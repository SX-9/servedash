<script lang="ts">
  import { errors, notifs, toUrl } from "$lib/client";
  import type { LinkItem } from "$lib/types";
  import Icon from "@iconify/svelte";
  import { onMount } from "svelte";
  import YAML from "yaml";
  
  const configDir = '/etc/servedash';
  let config: LinkItem[] = [];
  notifs.set('Fetching links...');

  onMount(() => {
    fetch('/api/fs/file?path=' + decodeURIComponent(configDir + '/config.yaml'))
      .then(res => res.text()).then(data => {
        try {
          config = YAML.parse(data);
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


{#if config.length === 0}
  <p class="text-center italic">
    Nothing here. (try editing the config file: /etc/servedash/config.yaml)<br>
    The config file should be an array of objects that will look like this:
  </p>
  <pre class="whitespace-pre-wrap">{YAML.stringify([{
    "name": "Name of the link",
    "icon": "URL to the icon",
    "desc": "Description of the link (optional)",
    "URLlink": {
      "prot": "http or https",
      "host": "example.com (leave empty for the current domain)",
      "port": 80,
      "path": "/path/to/page"
    }
  }], null, 2)}</pre>
{:else}
  <div class="lg:h-[calc(100vh-10rem)] min-h-fit grid place-items-center w-full">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 my-2 gap-2 w-full">
      {#each config as item}
        <div class="card flex items-center h-fit w-full gap-2">
          <a href={toUrl(item)} target="_blank">
            <img class="size-12 rounded-xl" src={item.icon} alt={item.desc}>
          </a>
          <div class="flex-1">
            <h3><a href={toUrl(item)} target="_blank">{item.name}</a></h3>
            {#if item.desc}
              <span>{item.desc}</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
  <p class="text-center text-subtext0 italic">Edit links at: /etc/servedash/config.yaml</p>
{/if}
