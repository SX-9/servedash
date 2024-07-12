import type { RequestHandler } from './$types';
import fs from "fs";

export const POST: RequestHandler = async (e) => {
	const params = e.url.searchParams
	const path = params.get("path");
	const dest = params.get("dest");
	const { action } = e.params;

	if (path === null) return new Response("Path is required", { status: 400 });

	try {
		switch (action) {
			case "delete":
				fs.rmSync(path, { recursive: true });
				break;
			case "move":
				if (dest === null) return new Response("Path is required", { status: 400 });
				fs.renameSync(path, dest);
				break;
			case "copy":
				if (dest === null) return new Response("Path is required", { status: 400 });
				fs.copyFileSync(path, dest);
				break;
		}
	} catch (e) {
		return new Response(e as string, { status: 500 });
	}

	return new Response("Done", { status: 200 });
};