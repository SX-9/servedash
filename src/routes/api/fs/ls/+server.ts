import type { dirContents } from '$lib/types';
import type { RequestHandler } from './$types';
import fs from 'fs';

export const POST: RequestHandler = async (e) => {
	if (e.request.headers.get('content-type') !== 'text/plain') return new Response('Expected text/plain', {status: 400});
	const path = await e.request.text();

	if (!path) return new Response('Missing body', {status: 400});
	if (!fs.existsSync(path)) return new Response('Path does not exist', {status: 404});
	if (!fs.lstatSync(path).isDirectory()) return new Response('Path is not a directory', {status: 400});

	try {
		const contents: dirContents[] = fs.readdirSync(path, { withFileTypes: true })
			.map((dirent) => {
				const stat = fs.statSync(`${path}/${dirent.name}`);
				let type: dirContents['type'] = 'file';
				if (dirent.isDirectory()) type = 'dir';
				else if (dirent.isSymbolicLink()) type = 'link';
				else if (dirent.isBlockDevice() || dirent.isCharacterDevice()) type = 'dev';
				else if (dirent.isFIFO()) type = 'pipe';
				else if (dirent.isSocket()) type = 'sock';
				return {
					name: dirent.name, type,
					mask: stat.mode.toString(8).slice(-3),
					size: type === 'file' ? stat.size : 0,
					lmod: stat.mtime.getTime(),
					owner: stat.uid,
					group: stat.gid,
				}
			});
		return new Response(JSON.stringify(contents), { status: 200 });
	} catch (error) {
		return new Response(JSON.stringify(error), {status: 500});
	}
};