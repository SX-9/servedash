<script lang="ts">
  import { errors, notifs, readableUptime } from "$lib/client";
  import { navigating } from "$app/stores";
  import { fly } from 'svelte/transition'
  import Icon from '@iconify/svelte';
  import { page } from '$app/stores';
  import "../app.css";
  
  export let data;
  const pages = {
    "Home": ['ic:sharp-home', '/'],
    "Status": ['ic:sharp-monitor-heart', '/status'],
    "Containers": ['ic:sharp-apps', '/containers'],
    "Files": ['ic:sharp-folder', '/files'],
    "Shell": ['ic:sharp-terminal', '/shell'],
  }
  const pagesUrls = Object.entries(pages).map(i=>i[1][1]);
  let displaySwitch: boolean = false;
  let message: string, err = "";

  notifs.subscribe((msg) => message = msg);
  errors.subscribe((error) => {
    err = error;
    setTimeout(() => err = '', 5000);
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
    {#each Object.entries(pages) as [title, [icon, url]]}
      <a href={url} class:active={$page.url.pathname === url}><Icon icon={icon} /> <span>{title}</span></a>
    {/each}
  </nav>
</header>
{#key data.url}
  <main
    in:fly={{ x: 250 * (pagesUrls.indexOf($navigating?.from?.url.pathname || '/') > pagesUrls.indexOf($navigating?.to?.url.pathname || '/') ? -1 : 1), duration: 300, delay: 300 }}
    out:fly={{ x: 250 * (pagesUrls.indexOf($navigating?.from?.url.pathname || '/') < pagesUrls.indexOf($navigating?.to?.url.pathname || '/') ? -1 : 1), duration: 300 }}
  >
    <slot />
  </main>
  <footer
    in:fly={{ y: 50, duration: 300, delay: 300 }}
    out:fly={{ y: 50, duration: 300 }}
    class="mt-4 mb-20 sm:mb-auto flex justify-center items-center"
  >
    <p>made by <a href="https://satr14.is-a.dev">satr14</a></p>
  </footer>
{/key}
