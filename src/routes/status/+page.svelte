<script lang="ts">
  import type { Readable } from 'svelte/motion';
  import type { Usage, ServerInfoDetailed } from '$lib/types';
  import { source } from 'sveltekit-sse';
  import { notifs } from '$lib/client';
  import { onMount } from 'svelte';

  const usages: Readable<Usage> = source('/api/sse').select('usage').json();
  export let data: ServerInfoDetailed;

  onMount(() => {
    notifs.set('Waiting for usages...');
    setTimeout(() => {
      notifs.set('');
    }, 700 *2);
  });
</script>

<div class="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 my-2">
  <div class="card">
    <h2 class="mb-2">System</h2>
    <p>
      <b>Arch</b> {data?.arch}<br>
      <b>Platform</b> {data?.platform}<br>
      <b>Release</b> {data?.release}<br>
      <b>Docker</b> {data?.docker}<br>
    </p>
  </div>
  <div class="card">
    <h2 class="mb-2">Network</h2>
    <ul>
      {#each Object.entries(data?.network || {}).filter(([i])=>!(i.startsWith('br-')||i.startsWith('veth'))) as [interfaces, ips]}
        <li><b>{interfaces}</b> {ips?.filter(i=>i.family==='IPv4').map(i=>i.address).join(', ')}</li>
      {/each}
    </ul>
    <hr>
    <ul>
      <li><b>{$usages?.net.total.outputMb} MB</b> Upload</li>
      <li><b>{$usages?.net.total.inputMb} MB</b> Download</li>
    </ul>
  </div>
  <div class="card">
    <h2 class="mb-2">Usage</h2>
    <p>CPU: <b>{$usages?.cpu || 0}%</b></p>
    <progress class={$usages?.cpu > 85 ? 'warn' : ''} value={$usages?.cpu || 0} max="100"></progress>
    <p>RAM: <b>{Math.round($usages?.mem.usedMemMb)}/{Math.round($usages?.mem.totalMemMb)} MB</b></p>
    <progress class={$usages?.mem.usedMemPercentage > 85 ? 'warn' : ''} value={$usages?.mem.usedMemPercentage || 0} max="100"></progress>
  </div>
  <div class="card">
    <h2 class="mb-2">Docker</h2>
    <p><b>{$usages?.docker.images}</b> Images</p>
    <p><b>{$usages?.docker.containers}</b> Containers</p>
    <ul>
      <li><b>{$usages?.docker.running}</b> Running</li>
      <li><b>{$usages?.docker.stopped}</b> Stopped</li>
    </ul>
  </div>
  <div class="card">
    <h2 class="mb-2">MOTD</h2>
    <p class="font-mono text-xs">{data?.motd}</p>
  </div>
</div>
      
