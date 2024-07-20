<script lang="ts">
  import { errors, notifs, readableUptime } from "$lib/client";
  import { fly } from 'svelte/transition'
  import Icon from '@iconify/svelte';
  import { page } from '$app/stores';
  import "../app.css";
  
  export let data;
  let displaySwitch: boolean = false;
  let message: string, err = "";

  notifs.subscribe((msg) => message = msg);
  errors.subscribe((error) => {
    err = error
    setTimeout(() => err = '', 5000)
  });
  
  setInterval(() => displaySwitch = !displaySwitch, 2500);
  setInterval(() => data.uptime++, 1000);
</script>

<svelte:head>
  <title>
    {data?.username}@{data?.hostname}
  </title>
</svelte:head>
<header class="mb-4 lg:flex lg:flex-row lg:justify-between lg:items-center">
  <h3 class="text-subtext0 text-center italic sm:mb-1">
    {message
      ? message
      : displaySwitch
        ? data?.username+'@'+data?.hostname
        : readableUptime(data.uptime)
    }
  </h3>
  <span class="text-red italic text-center">{err?`${err}`:''}</span>
  <nav>
    <a href="/" class:active={$page.url.pathname === '/'}><Icon icon="ic:sharp-home" /> <span>Home</span></a>
    <a href="/status" class:active={$page.url.pathname === '/status'}><Icon icon="ic:sharp-monitor-heart" /> <span>Status</span></a>
    <a href="/containers" class:active={$page.url.pathname === '/containers'}><Icon icon="ic:sharp-apps" /> <span>Containers</span></a>
    <a href="/files" class:active={$page.url.pathname === '/files'}><Icon icon="ic:sharp-folder" /> <span>Files</span></a>
    <a href="/shell" class:active={$page.url.pathname === '/shell'}><Icon icon="ic:sharp-terminal" /> <span>Shell</span></a>
  </nav>
</header>
{#key data.url}
  <main
    in:fly={{ y: 50, duration: 300, delay: 300 }}
    out:fly={{ y: 50, duration: 300 }}
  >
    <slot />
  </main>
  <footer class="mt-4 mb-20 sm:mb-auto flex justify-center items-center">
    <p>made by <a href="https://satr14.is-a.dev">satr14</a></p>
  </footer>
{/key}
