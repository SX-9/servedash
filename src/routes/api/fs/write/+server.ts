import type { RequestHandler } from './$types';
import fs from "fs";

export const POST: RequestHandler = async (e) => {
    const path = e.url.searchParams.get("path");
    if (!path) return new Response("No path provided", { status: 400 });
    const body = await e.request.text();
    try {
        fs.writeFileSync(path, body);
        return new Response("OK");
    } catch (e) {
        return new Response(e as string, { status: 500 });
    }
};