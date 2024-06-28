import type { RequestHandler } from './$types';
import { docker } from '$lib';

export const POST: RequestHandler = async (e) => {
    const {image} = await e.request.json();
    const pull = await docker.pull(image);
    
    return new Response('Requested image pull.');
};