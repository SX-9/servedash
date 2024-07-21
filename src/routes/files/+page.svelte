<script lang="ts">
	import { convertPermissions, errors, initTextarea, notifs, readableByteSize } from "$lib/client";
	import type { dirContents } from "$lib/types";
	import Icon from "@iconify/svelte";
	import { onMount } from "svelte";

	let cwd = "/";
	let editorName = '';
	let editorPosLn = 0;
	let editorPosCol = 0;
	let editorBuffer = '';
	let overwrite = false;
	let editorWrap = false;
	let processing = false;
	let showHidden = false;
	let uploadProgress = 0;
	let indexProcessing = 0;
	let file: File | null = null;
	let dialog: HTMLDialogElement;
	let editor: HTMLDialogElement;
	let contents: dirContents[] = [];
	let selection: dirContents[] = [];
	let editorElement: HTMLTextAreaElement;
	
	function toggleAll(e: Event) {
		selection = (e.target as HTMLInputElement).checked ? contents : [];
	}

	async function parentDir() {
		if (cwd === "/") return;
		const parts = cwd.split("/");
		parts.pop();
		cwd = parts.join("/") || "/";
		await refreshContents();
	}

	async function gotoDir(dir: string) {
		const oldCwd = cwd;
		const newCwd = (cwd + dir).replace(/\/+/g, "/");
		cwd = newCwd;
		if (!await refreshContents()) cwd = oldCwd;
	}

	async function openFile(item: string, edit?: boolean) {
		if (edit) {
			const res = await fetch(`/api/fs/file?path=${encodeURIComponent(cwd + "/" + item)}`);
			if (!res.ok) return errors.set(`Failed to open file: ${res.status} ${res.statusText}`);
			const text = await res.text();

			editorBuffer = text;
			editorName = item;
			editor.showModal();
			return;
		}
		if (!confirm('Download file?')) return;
		window.open(`/api/fs/file?path=${encodeURIComponent(cwd + "/" + item)}`, "_blank");
	}

	async function refreshContents() {
		notifs.set("Loading directory contents...");
		processing = true;
		const res = await fetch(`/api/fs/ls`, {
			method: "POST",
			headers: {
				"Content-Type": "text/plain",
			},
			body: cwd,
		});

		if (!res.ok) errors.set(`Failed to list directory: ${res.status} ${res.statusText}`);
		else {
			contents = await res.json();
			selection = [];
		}

		processing = false;
		notifs.set("");
		return res.ok;
	}

  async function handleSubmit(event: Event) {
		notifs.set('DO NOT LEAVE THIS PAGE, Uploading file...');
		processing = true;
		event.preventDefault();
		dialog.close();
    if (!file) return errors.set('No file selected.');
		const formData = new FormData();
		const xhr = new XMLHttpRequest();
		
		formData.append('file', file);
		xhr.open('POST', `/api/fs/file?path=${encodeURIComponent(`${cwd}/${file.name}`.replace(/\/+/g, "/"))}&overwrite=${overwrite}`, true);

		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) uploadProgress = Math.round((event.loaded / event.total) * 100);
		};
		xhr.onload = () => {
			if (xhr.status !== 200) return errors.set('Upload Failed: ' + xhr.status);
			else return refreshContents();
		};

		xhr.send(formData);
		processing = false;
		notifs.set('');
  }

	function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    file = target.files ? target.files[0] : null;
  }
	
	async function create(type: "dir" | "file") {
		const path = prompt(`Enter the name of the new ${type}:`, cwd);
		if (!path) return;
		const res = await fetch(`/api/fs/new/${type}?path=${encodeURIComponent(path)}`, {
			method: "POST",
		});
		if (!res.ok) errors.set(`Failed to create ${type}: ${res.status} ${res.statusText}`);
		else await refreshContents();
		dialog.close();
	}

	async function doFs(action: 'delete' | 'move' | 'copy', danger: boolean, getDest: boolean) {
		let dest: string = '';
		if (getDest) {
			dest = prompt(`Enter the full destination dir path for the operation:`, cwd) || '';
			if (dest.length === 0) return;
		}
		if (danger && !confirm(`Are you sure you want to ${action} ${selection.length} items?`)) return;
		notifs.set(`Processing...`);
		processing = true;
		indexProcessing = 0;
		for (const item of selection) {
			const index = contents.findIndex((i) => i.name === item.name);
			indexProcessing = index;
			notifs.set(`${action}: ${item.name}`);
			const res = await fetch(`/api/fs/action/${action}?path=${encodeURIComponent(cwd + "/" + item.name)}&dest=${decodeURIComponent(dest + "/" + item.name)}`, {
				method: "POST",
			});
			if (!res.ok) {
				errors.set(`Failed to ${action} ${item.name}: ${res.status} ${res.statusText}`);
				break;
			}
		}
		selection = [];
		indexProcessing = 0;
		processing = false;
		notifs.set("");
		await refreshContents();
	}
	
	async function renameFs() {
		if (selection.length !== 1) return errors.set('Select a single item to rename.');
		const item = selection[0];
		const newName = prompt(`Enter the new name for ${item.name}:`, item.name);
		if (!newName) return;
		const res = await fetch(`/api/fs/action/move?path=${encodeURIComponent(cwd + "/" + item.name)}&dest=${encodeURIComponent(cwd + "/" + newName)}`, {
			method: "POST",
		});
		if (!res.ok) errors.set(`Failed to rename ${item.name}: ${res.status} ${res.statusText}`);
		else await refreshContents();
	}

	async function editorSave(event: Event) {
		event.preventDefault();
		notifs.set('DO NOT LEAVE THIS PAGE, Saving file...');
		processing = true;
		const res = await fetch(`/api/fs/write?path=${encodeURIComponent(cwd + "/" + editorName)}`, {
			method: "POST",
			headers: {
				"Content-Type": "text/plain",
			},
			body: editorBuffer,
		});
		if (!res.ok) errors.set(`Failed to save file: ${res.status} ${res.statusText}`);
		else {
			editor.close();
			await refreshContents();
		}
	}

	function editorSetPos() {
		const pos = editorElement.selectionStart;
		editorPosLn = editorBuffer.substr(0, pos).split("\n").length;
		editorPosCol = pos - editorBuffer.lastIndexOf("\n", pos - 1);
	}

	onMount(() => {
		window.onbeforeunload = (e) => {
			if (!processing) return;
			e.preventDefault();
		};
		refreshContents();
		initTextarea(editorElement);
	});
</script>

{#if uploadProgress > 0}
	<progress class="inline w-40 mb-1" value={uploadProgress} max="100"></progress>
{/if}
<span>
	{#if uploadProgress > 0}
		Uploading... {uploadProgress}%
	{:else}
		{selection.length} selected.
	{/if}
</span><br>
<div class="btngroup">
	<button disabled={processing} on:click={refreshContents}><Icon icon="ic:sharp-refresh" /></button>
	<button disabled={processing} class="nodefault text-crust bg-green" on:click={() => dialog.showModal()}><Icon icon="ic:sharp-add" /></button>
</div>
<div class="btngroup">
	<button disabled={processing || selection.length === 0} on:click={() => doFs('delete', true, false)} class="nodefault text-crust bg-red"><Icon icon="ic:sharp-delete" /></button>
	<button disabled={processing || selection.length === 0} on:click={() => doFs('copy', false, true)}><Icon icon="ic:sharp-copy-all" /></button>
	<button disabled={processing || selection.length === 0} on:click={() => doFs('move', false, true)}><Icon icon="ic:sharp-drive-file-move" /></button>
	<button disabled={processing || selection.length !== 1} on:click={renameFs}><Icon icon="ic:sharp-drive-file-rename-outline" /></button>
	<button disabled={processing || selection.length !== 1 || selection[0].type !== "file"} on:click={() => openFile(selection[0].name, true)}><Icon icon="ic:sharp-edit-note" /></button>
</div>
<input type="checkbox" name="showHidden" bind:checked={showHidden}>
<label for="showHidden" class="font-normal italic">Show dotfiles</label>
<input class="my-2 w-full" disabled={processing} type="text" bind:value={cwd} on:keypress={(e) => {
	if (e.key === "Enter") refreshContents();
}}>
<div class="overflow-x-auto">
	<table>
		<colgroup>
			<col span="1">
			<col span="1">
			<col span="1" class="w-20">
			<col span="1" class="w-48">
			<col span="1" class="w-52 min-w-52">
		</colgroup>
		<tr>
			<th><input disabled={processing} type="checkbox" on:change={toggleAll} checked={selection.length === contents.length}></th>
			<th>Name</th>
			<th>Size</th>
			<th>Modified</th>
			<th>Properties</th>
		</tr>
		{#if cwd !== "/"}
			<tr>
				<td class="text-center">
					<input disabled={true} type="checkbox" value={null}>
				</td>
				<td class="font-bold cursor-pointer" on:click={() => parentDir()}>
					<div class="chips bg-yellow"></div> ../
				</td>
				<td></td><td></td><td></td>
			</tr>
		{/if}
		{#each contents.filter((i) => showHidden ? true : !i.name.startsWith('.')).sort((a, b) => {
			if (a.type !== b.type) {
				const typeOrder = ["dir", "file", "link", "dev", "sock", "pipe"];
				return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
			} else {
				if (a.size !== b.size) return a.size - b.size;
				return a.name.localeCompare(b.name);
			}
		}) as item, i}
			<tr class={indexProcessing === i+1 ? 'highlight' : ''}>
				<td class="text-center">
					<input disabled={processing} type="checkbox" bind:group={selection} value={item}>
				</td>
				<td class="font-bold cursor-pointer whitespace-nowrap" on:click={() => {
					switch (item.type) {
						case "dir": gotoDir("/"+item.name); break;
						case "file": openFile(item.name); break;
					}
				}} on:contextmenu={(e) => {
					e.preventDefault();
					if (selection.includes(item)) selection = selection.filter((i) => i !== item);
					else selection = [...selection, item];
				}}>
					{#if item.type === "dir"}
						<span class="text-yellow"><Icon icon="ic:sharp-folder" /></span>
					{:else if item.type === "file"}
						<span class="text-green"><Icon icon="ic:sharp-insert-drive-file" /></span>
					{:else if item.type === "link"}
						<span class="text-sapphire"><Icon icon="ic:sharp-shortcut" /></span>
					{:else if item.type === "dev"}
						<span class="text-peach"><Icon icon="ic:sharp-keyboard" /></span>
					{:else if item.type === "pipe"}
						<span class="text-mauve"><Icon icon="ic:sharp-compare-arrows" /></span>
					{:else if item.type === "sock"}
						<span class="text-red"><Icon icon="ic:sharp-call-split" /></span>
					{:else}
						<div class="chips bg-gray"></div>
					{/if}
					{item.name}{item.type === "dir" ? "/" : ""}
				</td>
				<td>{item.type === "file" ? readableByteSize(item.size) : (() => {
					switch (item.type) {
						case "link": return "Symlink";
						case "dev": return "Device";
						case "pipe": return "Pipe";
						case "sock": return "Socket";
						default: return "";
					}
				})()}</td>
				<td class="whitespace-nowrap">
					{new Date(item.lmod).toLocaleString()}
				</td>
				<td class="whitespace-nowrap">
					<div class="font-mono chips bg-blue">{item.owner}:{item.group}</div>
					{#if item.owner === 0}
						<div class="font-mono chips bg-red">root</div>
					{/if}
					<div class="font-mono chips bg-green">{convertPermissions(parseInt(item.mask))}</div>
				</td>
			</tr>
		{/each}
	</table>
</div>
<dialog bind:this={dialog}>
	<div class="flex justify-center items-center flex-col w-full mb-4">
		<span class="text-subtext1 italic">Create a new:</span>
		<div class="btngroup">
			<button on:click={async () => await create('dir')} class="nodefault text-crust bg-green">Directory</button>
			<button on:click={async () => await create('file')}>Empty File</button>
		</div>
	</div>
	<hr class="my-2">
	<form on:submit={async (e) => await handleSubmit(e)}>
		<label for="file">Select a file to upload:</label>
		<input class="mb-1" name="file "type="file" on:change={handleFileChange} required />
		<div></div>
		<div class="h-2"></div>
		<div class="btngroup">
			<button type="submit" class="nodefault text-crust bg-green"><Icon icon="ic:sharp-upload" /></button>
			<button type="button" class="nodefault text-crust bg-red" on:click={() => dialog.close()}><Icon icon="ic:sharp-close" /></button>
		</div>
		<input class="m-0 ml-2" type="checkbox" bind:checked={overwrite} />
		<label for="overwrite" class="font-normal italic">Overwrite existing file?</label>
	</form>
</dialog>
<dialog bind:this={editor}>
	<form on:submit={editorSave}>
		<div class="flex justify-between">
			<div class="btngroup">
				<button class="nodefault text-crust bg-green" on:click={() => editor.close()}><Icon icon="ic:sharp-save" /></button>
				<button class="nodefault text-crust bg-red" type="button" on:click={() => editor.close()}><Icon icon="ic:sharp-close" /></button>
			</div>
			<span class="text-subtext1 italic">{editorName}:{editorPosLn}:{editorPosCol}</span>
			<div>
				<input class="m-0 ml-2" type="checkbox" name="editorWrap" bind:checked={editorWrap} />
				<label for="editorWrap" class="font-normal italic">Wrap text</label>
			</div>
		</div>
		<div class="h-2"></div>
		<textarea class="whitespace-nowrap w-[calc(100vw-10rem)] h-[calc(100vh-10rem)]" class:linewrap={editorWrap}
			bind:this={editorElement} bind:value={editorBuffer}
			on:keyup={editorSetPos} on:touchend={editorSetPos} on:mouseup={editorSetPos} on:scroll={editorSetPos}
		></textarea>
		<div class="h-2"></div>
	</form>
</dialog>
