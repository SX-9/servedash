import { getDetailedInfo } from "$lib";

/** @type {import('./$types').LayoutLoad} */
export function load() {
	return getDetailedInfo();
}