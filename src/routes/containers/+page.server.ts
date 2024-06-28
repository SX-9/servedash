import { getContainers } from "$lib";

/** @type {import('./$types').LayoutLoad} */
export async function load() {
	return {
		containers: await getContainers()
	};
}