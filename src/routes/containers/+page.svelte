<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '@iconify/svelte';
  import { source } from 'sveltekit-sse';
  import { notifs, errors } from '$lib/client';
  import type { ContainerInfo, ContainerAction, ContainerCreateInfo } from '$lib/types';

  export let data: {
    containers: ContainerInfo[]
  };

  let dialogValues: ContainerCreateInfo = {
    name: '',
    image: '',
    cwd: '',
    ports: [],
    env: [],
    volumes: [],
    cmdline: [],
    restart: 'always'
  };
  let prefix = '';
  let indexProcessing = 0;
  let processing = true;
  let selection: ContainerInfo[] = [];
  let dialog: HTMLDialogElement;

  const formMethods = {
    addPortMapping() {
      dialogValues.ports.push({ public: 0, private: 0, protocol: 'tcp' });
      dialogValues = dialogValues;
    },
    removePortMapping(index: number) {
      dialogValues.ports.splice(index, 1);
      dialogValues = dialogValues;
    },
    addEnvVariable() {
      dialogValues.env.push({ key: '', value: '' });
      dialogValues = dialogValues;
    },
    removeEnvVariable(index: number) {
      dialogValues.env.splice(index, 1);
      dialogValues = dialogValues;
    },
    addVolumeMapping() {
      dialogValues.volumes.push({ host: '', container: '' });
      dialogValues = dialogValues;
    },
    removeVolumeMapping(index: number) {
      dialogValues.volumes.splice(index, 1);
      dialogValues = dialogValues;
    },
    addCmdArg() {
      dialogValues.cmdline.push('');
      dialogValues = dialogValues;
    },
    removeCmdArg(index: number) {
      dialogValues.cmdline.splice(index, 1);
      dialogValues = dialogValues;
    },
    async create() {
      processing = true;
      notifs.set(`Creating ${dialogValues.name}...`);
      await fetch('/api/container/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dialogValues),
      }).catch((e) => alert(e));
      dialog.close();
      notifs.set('Waiting for server response...');
    },
  }

  notifs.set('Loading data...');
  source('/api/sse').select('container').subscribe((msg) => {
    try {
      const msgData = JSON.parse(msg);
      if (['create', 'destroy'].includes(msgData.Action)) return window.location.reload();
      if (!['start', 'stop', 'restart'].includes(msgData.Action)) return;
      const parsedMsg = {
        action: msgData?.Action,
        id: msgData?.id,
        time: msgData?.time,
      };
      data.containers = data.containers.map((container) => {
        if (container.id === parsedMsg.id) {
          container.status = parsedMsg.action === 'start' ? 'running' : 'stopped';
        }
        return container;
      });
      notifs.set('');
      processing = false;
    } catch {}
  })

  onMount(() => {
    notifs.set('');
    processing = false;
    prefix = `${window.location.protocol}//${window.location.hostname}:`;
  });

  async function pullImage() {
    const image = prompt('Enter the image name to pull');
    if (!image) return;
    notifs.set(`Pulling ${image}...`);
    processing = true;
    const req = await fetch(`/api/image/pull`, {
      method: 'POST',
      body: JSON.stringify({ image }),
    });
    if (!req.ok) errors.set(`Error: ${req.status} ${req.statusText} ${(await req.json())?.message}`);
    notifs.set('');
    processing = false;
  }
  
  async function doContainers(action: ContainerAction, danger?: boolean) {
    if (danger && !confirm(`Are you sure you want to ${action} ${selection.length} containers?`)) return;
    let errTrig = false;
    indexProcessing = 0;
    processing = true;
    notifs.set('Processing...');
    for (let ct of selection) {
      const index = data.containers.findIndex(container => container.id === ct.id);
      indexProcessing = index + 1;
      notifs.set(`${action}: ${ct.name}`)
      const req = await fetch(`/api/container/action/${ct.id}/${action}`, {
      method: 'POST',
      });
      if (!req.ok) {
      errors.set(`Error: ${req.status} ${req.statusText} ${(await req.json())?.message}`);
      processing = false;
      indexProcessing = 0;
      break;
      }
    }
    if (!errTrig) {
      notifs.set('Waiting for server response...');
      selection = [];
      indexProcessing = 0;
    }
  }
  
  function toggleAll(e: Event) {
    selection = (e.target as HTMLInputElement).checked ? data.containers : [];
  }
</script>

<span>{selection.length} selected.</span>
<div class="mb-2">
  <div class="btngroup">
    <button disabled={processing} class="bg-green text-crust nodefault" on:click={() => dialog.showModal()}><Icon icon="ic:sharp-add" /></button>
    <button disabled={processing} class="bg-sapphire text-crust nodefault" on:click={pullImage}><Icon icon="ic:sharp-file-download" /></button>
    <button disabled={processing || selection.length === 0 || selection.filter(ct => ct.status !== 'running').length === 0} class="bg-red text-crust nodefault" on:click={() => doContainers('delete', true)}><Icon icon="ic:sharp-delete" /></button>
  </div>
  <div class="btngroup">
    <button disabled={processing || selection.length === 0 || selection.filter(ct => ct.status !== 'running').length === 0} class="text-green" on:click={() => doContainers('start')}><Icon icon="ic:sharp-play-arrow" /></button>
    <button disabled={processing || selection.length === 0 || selection.filter(ct => ct.status === 'running').length === 0} class="text-red" on:click={() => doContainers('stop')}><Icon icon="ic:sharp-stop" /></button>
    <button disabled={processing || selection.length === 0 || selection.filter(ct => ct.status === 'running').length === 0} class="text-yellow" on:click={() => doContainers('restart')}><Icon icon="ic:sharp-restart-alt" /></button>
  </div>
</div>
<div class="overflow-x-auto"> 
  <table>
    <tr>
      <th><input type="checkbox" on:change={toggleAll} checked={selection.length === data.containers.length} disabled={processing}></th>
      <th>Name</th>
      <th>Image</th>
      <th>Status</th>
      <th>Ports</th>
    </tr>
    {#each data.containers as container, i}
      <tr class={indexProcessing === i+1 ? 'highlight' : ''}>
        <td class="text-center">
          <input type="checkbox" bind:group={selection} value={container} disabled={processing}>
        </td>
        <td class="font-semibold">{container.name}</td>
        <td>{container.image}</td>
        <td>
          {#if ['running', 'created'].includes(container.status)}
            <div class="chips bg-green">
              {container.status}
            </div>
          {:else}
            <div class="chips bg-red">
              {container.status}
            </div>
          {/if}
        </td>
        <td>
          {#if container.ports.tcp.length === 0 && container.ports.udp.length === 0}
            <p class="text-subtext0 italic">
              <span class="text-subtext0 italic">No ports exposed</span>
            </p>
          {:else}
            {#each container.ports.tcp as port}
              <div class="bg-sapphire chips"><a class="no-underline text-crust" href={prefix+port.public} target="_blank">tcp/{port.public}{port.public !== port.private ? `:${port.private}` : ''}</a></div>
            {/each}
            {#each container.ports.udp as port}
              <div class="bg-subtext0 chips"><span>udp/{port.public}{port.public !== port.private ? `:${port.private}` : ''}</div>
            {/each}
          {/if}
        </td>
      </tr>
    {/each}
  </table>
</div>
<dialog bind:this={dialog} class="w-[22em]">
  <form on:submit|preventDefault={formMethods.create}>
    <label for="name">Name</label>
    <input disabled={processing} class="w-[18em]" placeholder="mycontainer" type="text" name="name" bind:value={dialogValues.name}>
    <label for="image">Image<span class="text-red">*</span></label>
    <input disabled={processing} class="w-[18em]" placeholder="busybox" type="text" name="image" required bind:value={dialogValues.image}>
    <label for="cwd">Working Directory</label>
    <input disabled={processing} class="w-[18em]" placeholder="/app" type="text" name="cwd" bind:value={dialogValues.cwd}>
    <label for="restart">Restart Policy</label>
    <select disabled={processing} name="restart" bind:value={dialogValues.restart} class="w-[18em]">
      <option value="always">Always</option>
      <option value="unless-stopped">Unless Stopped</option>
      <option value="on-failure">On Failure</option>
    </select>
    <label for="ports">Port Mappings</label>
    <button disabled={processing} type="button" class="mt-2 text-green text-xs" on:click={formMethods.addPortMapping}><Icon icon="ic:sharp-add" /></button>
    {#each dialogValues.ports as _, index (index)}
      <div class="flex items-center mt-2">
        <input disabled={processing} type="number" placeholder="public" name="public" required bind:value={dialogValues.ports[index].public} class="mr-1 w-[4em]">
        <span>:</span>
        <input disabled={processing} type="number" placeholder="private" name="private" required bind:value={dialogValues.ports[index].private} class="mx-1 w-[4em]">
        <span>:</span>
        <select disabled={processing} name="protocol" required bind:value={dialogValues.ports[index].protocol} class="ml-1 w-[4em]">
          <option value="tcp">TCP</option>
          <option value="udp">UDP</option>
        </select>
        <button disabled={processing} type="button" class="ml-2 text-red text-xs" on:click={() => formMethods.removePortMapping(index)}><Icon icon="ic:sharp-delete" /></button>
      </div>
    {/each}
    <div></div>
    <label for="volumes">Volume Mappings</label>
    <button disabled={processing} type="button" class="mt-2 text-green text-xs" on:click={formMethods.addVolumeMapping}><Icon icon="ic:sharp-add" /></button>
    {#each dialogValues.volumes as _, index (index)}
      <div class="flex items-center mt-2">
        <input disabled={processing} type="text" placeholder="host" name="host" required bind:value={dialogValues.volumes[index].host} class="mr-2 w-[6em]">
        <span>:</span>
        <input disabled={processing} type="text" placeholder="container" name="container" required bind:value={dialogValues.volumes[index].container} class="ml-2 w-[6em]">
        <button disabled={processing} type="button" class="ml-2 text-red text-xs" on:click={() => formMethods.removeVolumeMapping(index)}><Icon icon="ic:sharp-delete" /></button>
      </div>
    {/each}
    <div></div>
    <label for="env">Environment Variables</label>
    <button disabled={processing} type="button" class="mt-2 text-green text-xs" on:click={formMethods.addEnvVariable}><Icon icon="ic:sharp-add" /></button>
    {#each dialogValues.env as _, index (index)}
      <div class="flex items-center mt-2">
        <input disabled={processing} type="text" placeholder="key" name="key" required bind:value={dialogValues.env[index].key} class="mr-2 w-[6em]">
        <span>=</span>
        <input disabled={processing} type="text" placeholder="value" name="value" required bind:value={dialogValues.env[index].value} class="ml-2 w-[6em]">
        <button disabled={processing} type="button" class="ml-2 text-red text-xs" on:click={() => formMethods.removeEnvVariable(index)}><Icon icon="ic:sharp-delete" /></button>
      </div>
    {/each}
    <div></div>
    <label for="cmdline">Command Line Arguments</label>
    <button disabled={processing} type="button" class="mt-2 text-green text-xs" on:click={formMethods.addCmdArg}><Icon icon="ic:sharp-add" /></button>
    {#each dialogValues.cmdline as _, index (index)}
      <div class="flex items-center mt-2">
        <input disabled={processing} type="text" placeholder="arg" name="arg" required bind:value={dialogValues.cmdline[index]} class="w-[13em]">
        <button disabled={processing} type="button" class="ml-2 text-red text-xs" on:click={() => formMethods.removeCmdArg(index)}><Icon icon="ic:sharp-delete" /></button>
      </div>
    {/each}
    <div></div>
    <div class="btngroup mt-2 text-xl">
      <button disabled={processing} class="nodefault bg-green text-crust" type="submit"><Icon icon="ic:sharp-check" /></button>
      <button disabled={processing} class="nodefault bg-red text-crust" type="button" on:click={() => dialog.close()}><Icon icon="ic:sharp-close" /></button>
    </div>
  </form>
  <p class="italic text-subtext0 mt-2">
    *Note: if you need more options when creating a container, please do it manually.<br>
    <span class="text-yellow">*Warn: Pull the image first as we dont do it automatically.</span>
  </p>
</dialog>