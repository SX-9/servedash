import { getServerInfo } from "$lib";

/** @type {import('./$types').LayoutLoad} */
export async function load(e) {
	return {...await getServerInfo(), url: e.url.pathname};
}