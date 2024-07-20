import { getServerInfo } from "$lib";

/** @type {import('./$types').LayoutLoad} */
export async function load(e) {
	const obj = {...await getServerInfo(), url: e.url.pathname};
	return obj;
}