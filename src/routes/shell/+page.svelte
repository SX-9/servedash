<script lang="ts">
	import { source } from "sveltekit-sse";
	import Icon from "@iconify/svelte";

	let cmd = '';
	let output = '';
	const sse = source('/api/shell');

	sse.select('stdout').subscribe(update);
	sse.select('stderr').subscribe(update);

	function update(data: string) {
		output += data;
	}

	async function submitHandler(e: Event) {
		e.preventDefault();
		output += `\n$ ${cmd}\n`;
		await fetch('/api/shell', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'text/plain',
			},
			body: cmd,
		});
		cmd = '';
	}

</script>

<div class="whitespace-pre-warp card overflow-auto h-[calc(100vh-14rem)]">
	<pre class="whitespace-pre-warp text-sm">{output}</pre>
</div>
<form on:submit={submitHandler}>
	<input class="w-full" type="text" placeholder="cat /etc/motd" bind:value={cmd}>
	<div class="mt-2 btngroup">
		<button type="button" on:click={() => output = ''}><Icon icon="ic:sharp-clear-all" /></button>
	</div>
</form>