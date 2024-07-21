import type { LinkItem, WidgetContent } from '$lib/types';
import { delay, docker, getUsage } from '$lib';
import type { RequestHandler } from './$types';
import { readableUptime } from '$lib/client';
import { produce } from 'sveltekit-sse';
import os from 'os';

export const POST: RequestHandler = async (e) => {
    const body: LinkItem[] = await e.request.json();
    const ctsChecks: string[] = body.map((item) => item?.container || '');
    const widgets: string[] = body.map((item) => item?.widget || '');
    
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
            for (const widget of widgets) {
                switch (widget) {
                    case 'usages':
                        widgetsContents.push([
                            {
                                title: 'CPU',
                                content: `${usages.cpu}%`,
                                warning: usages.cpu > 90,
                            },
                            {
                                title: 'RAM',
                                content: `${usages.mem.usedMemPercentage}%`,
                                warning: usages.mem.usedMemPercentage > 90,
                            }
                        ]);
                        break;
                    case 'network':
                        widgetsContents.push([
                            {
                                title: 'Download',
                                content: `${usages.net.total.inputMb} MB`,
                            },
                            {
                                title: 'Upload',
                                content: `${usages.net.total.outputMb} MB`
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
                        widgetsContents.push(undefined);
                        break;
                }
            }
            emit('widgets', JSON.stringify(widgetsContents));

            await delay(2500);
        }
    });
};