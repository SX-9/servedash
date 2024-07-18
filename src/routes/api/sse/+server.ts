import { produce } from 'sveltekit-sse';
import { getUsage, docker, delay } from '$lib';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
  return produce(async ({ emit }) => {
    docker.getEvents({}, async (err, data) => {
      if (err || !data) return;
      data.on('data', (chunk) => {
        const { error } = emit('container', chunk.toString('utf8'));
        if (error) return;
      });
    });
    while (true) {
      const { error } = emit('usage', JSON.stringify(await getUsage()));
      if (error) return;
      await delay(700);
    }
  });
};
