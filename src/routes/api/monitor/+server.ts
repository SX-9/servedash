import type { RequestHandler } from './$types';
import type { LinkItem } from '$lib/types';
import { produce } from 'sveltekit-sse';
import { delay, docker } from '$lib';

export const POST: RequestHandler = async (e) => {
    const body: LinkItem[] = await e.request.json();
    const ctsChecks: string[] = body.map((item) => item?.container || '');
    
    return produce(async ({ emit }) => {
        while (true) {
            const results: boolean[] = [];
            const cts = await docker.listContainers({ all: true });
            
            for (const ctCheck of ctsChecks) {
                results.push(cts.some((ct) => ct.Names.includes(`/${ctCheck}`) && ct.State === 'running'));
            }

            emit('results', JSON.stringify(results));
            await delay(5000);
        }
    });
};