import type { RequestHandler } from './$types';
import fs from 'fs';

export const POST: RequestHandler = async (e) => {
    const { fod: fileOrDir } = e.params;
    const name = e.url.searchParams.get('path');
    if (!name) return new Response('Name not provided', { status: 400 });
    try {
        switch (fileOrDir) {
            case 'file':
                fs.writeFileSync(name, '');
                break;
            case 'dir':
                fs.mkdirSync(name);
                break;
            default:
                return new Response();
        }
        return new Response();
    } catch (e) {
        return new Response(e as string, { status: 500 });
    }
};