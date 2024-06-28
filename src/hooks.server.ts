import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

interface AuthUser {
    username: string;
    password: string;
}

const users: AuthUser[] = [
  {
    username: env.USER,
    password: env.DASH_PASS || 'admin',
  }
];

export const handle: Handle = ({ event, resolve }) => {
    const authorization = event.request.headers.get('Authorization');
    const timestamp = new Date().toISOString();
    const method = event.request.method;
    const path = event.request.url;
    const ip = event.getClientAddress();

    console.log(`[${timestamp}] ${ip} ${method} ${path}`);

    if (env.NODE_ENV === 'development') {
        return resolve(event);
    }

    if (!authorization || !authorization.startsWith('Basic '))
        return new Response('Unauthorized', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Protected"',
            },
        });

    const token = authorization.replace('Basic ', '');

    const [username, password] = Buffer.from(token, 'base64')
        .toString()
        .split(':');

    const user: AuthUser | undefined = users.find(
        (u) => u.username === username && u.password === password,
    );

    if (!user)
        return new Response('Unauthorized', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Protected"',
            },
        });

    return resolve(event);
};