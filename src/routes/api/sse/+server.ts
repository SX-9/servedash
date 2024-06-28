import { produce } from 'sveltekit-sse';
import { getUsage } from '$lib';
import { docker } from '$lib';

function delay(milliseconds: number) {
  return new Promise(function run(resolve) {
    setTimeout(resolve, milliseconds)
  })
}

/** @type {import('./$types').RequestHandler} */
export function POST() {
  return produce(async ({ emit }) => {
    docker.getEvents({}, async (err, data) => {
      if (err || !data) return;
      data.on('data', (chunk) => {
        const {error} = emit('container', chunk.toString('utf8'));
        if(error) return;
      });
    });
    while (true) {
      const {error} = emit('usage', JSON.stringify(await getUsage()));
      if(error) return;
      await delay(700);
    }
  });
}
