import { getServerInfo } from "$lib";

/** @type {import('./$types').LayoutLoad} */
export function load() {
	return getServerInfo();
}