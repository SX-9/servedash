import { getServerInfo } from "$lib";

/** @type {import('./$types').LayoutLoad} */
export async function load() {
	return await getServerInfo();
}