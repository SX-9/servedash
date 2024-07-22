import type { RequestHandler } from './$types';
import childProcess from 'child_process';
import { produce } from 'sveltekit-sse';
import { EventEmitter } from 'node:events';

const eventEmitter = new EventEmitter();

export const DELETE: RequestHandler = async () => {
	eventEmitter.emit('restart');
	return new Response();
};

export const PATCH: RequestHandler = async (e) => {
	const body = await e.request.text();
	eventEmitter.emit('stdin', body + '\n');
	return new Response();
};


export const POST: RequestHandler = async () => {
	const spawnOptions: childProcess.SpawnOptionsWithoutStdio = {
		stdio: ['pipe', 'pipe', 'pipe'],
		detached: true,
		cwd: '/',
        env: {
          "TERM": 'dumb',
          "PATH": '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        },
	};
	let shellProcess = childProcess.spawn('sh', spawnOptions);
	
	eventEmitter.on('stdin', (data) => shellProcess.stdin.write(data));
	eventEmitter.on('restart', () => {
		if (!shellProcess.kill()) shellProcess.kill('SIGKILL');
		shellProcess = childProcess.spawn('sh', spawnOptions);
		setupShell(shellProcess);
	});

	return produce(async ({ emit }) => {
		eventEmitter.on('stdout', (data) => emit('stdout', data));
		eventEmitter.on('stderr', (data) => emit('stderr', data));
		shellProcess.on('exit', () => {
			shellProcess = childProcess.spawn('sh', spawnOptions);
			setupShell(shellProcess);
		});
		setupShell(shellProcess);
	}, {
		ping: 500,
		stop() {
			shellProcess.kill();
		}
	});
};

function setupShell(shellProcess: childProcess.ChildProcessWithoutNullStreams) {
	shellProcess.stdout.on('data', (data) => {
		eventEmitter.emit('stdout', data.toString('utf8'));
	});
	shellProcess.stderr.on('data', (data) => {
		eventEmitter.emit('stderr', data.toString('utf8'));
	});
	shellProcess.stdin.write('cat /etc/motd\n');
}
