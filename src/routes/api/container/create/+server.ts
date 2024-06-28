import { createContainer } from '$lib';
import type { ContainerCreateInfo } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (e) => {
  const body: ContainerCreateInfo = await e.request.json();
  const { id } = await createContainer(body).catch((e) => {
    console.error(e);
    return { id: null };
  });
  return new Response(id);
};