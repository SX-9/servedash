import type { LinkItem, PluginClass, WidgetContent } from '$lib/types';
import { delay, docker, getUsage } from '$lib';
import type { RequestHandler } from './$types';
import { readableUptime } from '$lib/client';
import { produce } from 'sveltekit-sse';
import os from 'os';

export const POST: RequestHandler = async (e) => {
    const body: LinkItem[] = await e.request.json();
    const ctsChecks: string[] = body.map((item) => item?.container || '');
    const widgets: [number, string][] = body.map((item, i) => [i, item?.widget || '']);
    const plugins = import.meta.glob('$lib/plugins/*.ts') as Record<string, undefined | (() => Promise<{default:PluginClass}>)>;

    return produce(async ({ emit }) => {
        while (true) {
            
            const results: boolean[] = [];
            const cts = await docker.listContainers({ all: true });
            for (const ctCheck of ctsChecks) {
                results.push(cts.some((ct) => ct.Names.includes(`/${ctCheck}`) && ct.State === 'running'));
            }
            emit('results', JSON.stringify(results));
            
            const widgetsContents: (WidgetContent[] | undefined)[] = [];
            const usages = await getUsage();
            for (const [i, widget] of widgets) {
                switch (widget) {
                    case 'usages':
                        widgetsContents.push([
                            {
                                title: 'CPU',
                                content: `${usages.cpu}%`,
                                warning: usages.cpu > 85,
                            },
                            {
                                title: 'RAM',
                                content: `${usages.mem.usedMemPercentage}%`,
                                warning: usages.mem.usedMemPercentage > 85,
                            }
                        ]);
                        break;
                    case 'network':
                        widgetsContents.push([
                            {
                                title: 'Download',
                                content: `${Math.round(usages.net.total.inputMb*100)/100} MB`,
                            },
                            {
                                title: 'Upload',
                                content: `${Math.round(usages.net.total.outputMb*100)/100} MB`
                            },
                        ]);
                        break;
                    case 'containers':
                        widgetsContents.push([
                            {
                                title: 'Running',
                                content: `${usages.docker.running}`,
                            },
                            {
                                title: 'Stopped',
                                content: `${usages.docker.stopped}`
                            },
                            {
                                title: 'Total',
                                content: `${usages.docker.containers}`
                            },
                        ]);
                        break;
                    case 'uptime':
                        widgetsContents.push([
                            {
                                title: 'Uptime',
                                content: readableUptime(os.uptime()),
                            },
                        ]);
                        break;
                    default:
                        if (!body[i]?.dynamic) {
                            widgetsContents.push(undefined);
                            break;
                        }

                        const Plugin = await plugins[`/src/lib/plugins/${body[i]?.dynamic?.service}.ts`]?.();
                        if (!Plugin) {
                            widgetsContents.push(undefined);
                            break;
                        }

                        if (ctsChecks[i] && !results[i]) {
                            widgetsContents.push(undefined);
                            break;
                        }

                        const plugin = new Plugin.default(body[i]?.dynamic?.api?.key || '', body[i]?.dynamic?.api?.baseurl);
                        widgetsContents.push(await plugin.getContent());
                        break;
                }
            }
            emit('widgets', JSON.stringify(widgetsContents));

            await delay(1500);
        }
    });
};