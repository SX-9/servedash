import { doContainer } from '$lib';
import type { ContainerAction } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (req) => {
    const { id, action } = req.params;
    await doContainer(action as ContainerAction, id);
    return new Response(null, { status: 200 });
};