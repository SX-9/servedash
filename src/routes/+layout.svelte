<script lang="ts">
  import { errors, notifs, readableUptime } from "$lib/client";
  import Icon from '@iconify/svelte';
  import { page } from '$app/stores';
  import "../app.css";
  
  let path;
  let displaySwitch: boolean = false;
  let message: string, err = "";
  export let data;

  notifs.subscribe((msg) => message = msg);
  errors.subscribe((error) => {
    err = error
    setTimeout(() => err = '', 5000)
  });
  
  setInterval(() => displaySwitch = !displaySwitch, 2500);
  setInterval(() => data.uptime++, 1000);
  
  $: path = $page.url.pathname;
</script>

<svelte:head>
  <title>
    {data?.username}@{data?.hostname}
  </title>
</svelte:head>
<header class="mb-4">
  <h3 class="text-subtext0 italic sm:mb-1">
    {message
      ? message
      : displaySwitch
        ? data?.username+'@'+data?.hostname
        : readableUptime(data.uptime)
    }
  </h3>
  <nav>
    <a href="/" class:active={$page.url.pathname === '/'}><Icon icon="ic:sharp-home" /> <span>Home</span></a>
    <a href="/status" class:active={$page.url.pathname === '/status'}><Icon icon="ic:sharp-monitor-heart" /> <span>Status</span></a>
    <a href="/containers" class:active={$page.url.pathname === '/containers'}><Icon icon="ic:sharp-apps" /> <span>Containers</span></a>
    <a href="/files" class:active={$page.url.pathname === '/files'}><Icon icon="ic:sharp-folder" /> <span>Files</span></a>
    <a href="/shell" class:active={$page.url.pathname === '/shell'}><Icon icon="ic:sharp-terminal" /> <span>Shell</span></a>
  </nav>
  <span class="text-red italic">{err?`!! ${err}, check devtools for details !!`:''}</span>
</header>
<main>
  <slot />
</main>
<footer class="mt-4 mb-20 sm:mb-auto flex justify-center items-center">
  <p>made by <a href="https://satr14.is-a.dev">satr14</a></p>
</footer>
