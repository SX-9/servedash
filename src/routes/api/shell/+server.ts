import type { RequestHandler } from './$types';
import childProcess from 'child_process';
import { produce } from 'sveltekit-sse';
import { EventEmitter } from 'node:events';

const eventEmitter = new EventEmitter();

export const PATCH: RequestHandler = async (e) => {
    const body = await e.request.text();
		eventEmitter.emit('stdin', body + '\n');
		console.log('stdin', body);
    return new Response();
};


export const POST: RequestHandler = async () => {
	let shellProcess = childProcess.spawn('sh', {
		cwd: '/',
		shell: true,
	});
	eventEmitter.on('stdin', (data) => {
		console.log('stdin', data);
		shellProcess.stdin.write(data);
	});

	return produce(async ({ emit }) => {
		shellProcess.stdout.on('data', (data) => {
			const {error} = emit('stdout', data.toString('utf8'));
			if(error) return;
		});
		shellProcess.stderr.on('data', (data) => {
			const {error} = emit('stderr', data.toString('utf8'));
			if(error) return;
		});
		shellProcess.on('exit', () => shellProcess = childProcess.spawn('sh'));
		shellProcess.stdin.write('cat /etc/motd\n');
	}, {
		ping: 500,
		stop() {
			if (!shellProcess.kill()) shellProcess.kill('SIGKILL');
		}
	});
};
