import { shellExec } from '$lib';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (e) => {
    const body = await e.request.json();
    shellExec(body?.reboot ? 'sudo reboot' : 'sudo poweroff')
    return new Response();
};