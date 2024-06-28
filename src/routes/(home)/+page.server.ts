import { getContainers } from '$lib';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    return { sections: await getContainers() };
}) satisfies PageServerLoad;