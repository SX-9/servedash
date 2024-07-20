<script lang="ts">
  import type { Readable } from "svelte/store";
  import type { LinkItem } from "$lib/types";
  import { source } from "sveltekit-sse";
  import { errors } from "$lib/client";
  import Icon from "@iconify/svelte";
  import YAML from "yaml";
  import { onMount } from "svelte";

  export let data;
  let config: LinkItem[] = [];
  let toUrl = (_: LinkItem) => 'about:blank';
  try {
    config = YAML.parse(data.links);
  } catch (error) {
    errors.set(error as string);
    console.error("Error parsing YAML data:", error);
  }
  let status: Readable<boolean[]> = source('/api/monitor', {
    options: {
      body: JSON.stringify(config),
    }
  }).select('results').json();

  onMount(async () => {
    const clientLib = await import('$lib/client');
    toUrl = clientLib.toUrl;
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
    "container": "Container name for status checks (optional)",
    "URLlink": {
      "prot": "http or https",
      "host": "example.com (leave empty for the current domain)",
      "port": 80,
      "path": "/path/to/page"
    }
  }], null, 2)}</pre>
{:else}
  <div class="lg:h-[calc(100vh-10rem)] min-h-fit grid place-items-center w-full">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:p-16 my-2 gap-2 w-full">
      {#each config as item, i}
        <div class="card flex items-center h-fit w-full gap-2 px-2">
          <a href={toUrl(item)} target="_blank">
            <img class="size-12 rounded-xl" src={item.icon} alt={item.desc}>
          </a>
          <div class="flex-1">
            <h3><a href={toUrl(item)} target="_blank">{item.name}</a></h3>
            {#if item.desc}
              <span>{item.desc}</span>
            {/if}
          </div>
          {#if item?.container}
            {#if $status?.[i]}
              <div class="bg-green text-crust size-6 rounded-full flex justify-center items-center text-2xl">
                <Icon icon="ic:sharp-arrow-drop-up" />
              </div>
            {:else}
              <div class="bg-red text-crust size-6 rounded-full flex justify-center items-center text-2xl">
                <Icon icon="ic:sharp-arrow-drop-down" />
              </div>
            {/if}
          {:else}
            <div class="bg-sapphire text-crust size-6 rounded-full flex justify-center items-center text-2xl">
              <Icon icon="ic:sharp-arrow-right" />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
  <p class="text-center text-subtext0 italic">Edit links at: /etc/servedash/config.yaml</p>
{/if}
