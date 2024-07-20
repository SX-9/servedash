import type { PageServerLoad } from './$types';
import fs from 'fs';

export const load = (async () => {
    const path = '/etc/servedash/config.yaml'
    if (!path || !fs.existsSync(path) || fs.lstatSync(path).isDirectory()) return { links: '' };
    try {
        const content = fs.readFileSync(path, 'utf8');
        return {
            links: content,
        };
    } catch (error) {
        console.error('Error reading/parsing config file:', error);
        return { links: '' };
    }
}) satisfies PageServerLoad;