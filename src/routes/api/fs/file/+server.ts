import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';

export const GET: RequestHandler = async (e) => {
    const path = e.url.searchParams.get('path');
    if (!path || !fs.existsSync(path) || fs.lstatSync(path).isDirectory()) return new Response(null, { status: 404 });
    
    try {
        const file = fs.readFileSync(path);
        return new Response(file, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename=${path.split('/').pop()}`
            }
        });
    } catch (e) {
        return new Response(e as string, { status: 500 });
    }
};

export const POST: RequestHandler = async (e) => {
    debugger;
    let err: boolean = false;
    const data = await e.request.formData().catch((e) => {
        console.error(e);
        err = true;
    });
    if (err) return new Response('Error parsing form data', { status: 400 });
    const params = e.url.searchParams;
    
    const file = data?.get('file') as File | null;
    const filePath = params.get('path');
    const overwrite = params.has('overwrite');

    if (!filePath) return new Response('Missing path', { status: 400 });

    if (!overwrite) {
        try {
            fs.accessSync(filePath);
            return new Response('File already exists and overwrite is not allowed', { status: 409 });
        } catch (err) {}
    }

    if (!file) return new Response('Missing file', { status: 400 });
    const buffer = await file.arrayBuffer();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(buffer));

    return new Response('File uploaded successfully', { status: 200 });
}