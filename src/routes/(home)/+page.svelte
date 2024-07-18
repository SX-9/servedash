<script lang="ts">
  import { errors, notifs, toUrl } from "$lib/client";
  import type { LinkItem } from "$lib/types";
  import { onMount } from "svelte";
  
  const configDir = '/etc/servedash';
  let config: LinkItem[] = [];
  notifs.set('Fetching links...');

  onMount(() => {
    fetch('/api/fs/file?path=' + decodeURIComponent(configDir + '/config.json'))
      .then(res => res.text())
      .then(data => {
        try {
          config = JSON.parse(data);
        } catch (err) {
          console.error(err);
          errors.set(err as string);
        }
        notifs.set('');
      })
      .catch(err => {
        console.error(err);
        errors.set(err);
      });
  });
</script>

<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:mx-32 lg:h-[calc(100vh-10rem)] place-items-center min-h-fit gap-2">
  {#each config as item}
    <div class="card flex justify-center items-center flex-col sm:flex-row h-fit w-full gap-2">
      <a href={toUrl(item)}>
        <img class="size-20 sm:size-12 rounded-xl" src={item.icon} alt={item.desc}>
      </a>
      <div>
        <h3><a href={toUrl(item)}>{item.name}</a></h3>
        {#if item.desc}
          <span class="hidden sm:block">{item.desc}</span>
        {/if}
      </div>
    </div>
  {/each}
</div>

{#if config.length === 0}
  <p class="text-center italic">
    Nothing here. (try editing the config file: /etc/servedash/config.json)<br>
    The config file should be an array of objects with the following properties:
  </p>
  <pre>{JSON.stringify({
    "name": "Name of the link",
    "icon": "URL to the icon",
    "desc": "Description of the link (optional)",
    "URLlink": {
      "prot": "http or https",
      "host": "example.com (leave empty for the current domain)",
      "port": 80,
      "path": "/path/to/page"
    }
  }, null, 2)}</pre>
{:else}
  <p class="text-center text-subtext0 italic">Edit links at: /etc/servedash/config.json</p>
{/if}
