<script lang="ts">
  import type { LinkItem, WidgetContent } from "$lib/types";
  import type { Readable } from "svelte/store";
  import { source } from "sveltekit-sse";
  import { errors } from "$lib/client";
  import Icon from "@iconify/svelte";
  import { onMount } from "svelte";
  import YAML from "yaml";

  export let data;
  let config: LinkItem[] = [];
  let toUrl = (_: LinkItem) => 'about:blank';
  try {
    config = YAML.parse(data.links);
  } catch (error) {
    errors.set(error as string);
    console.error("Error parsing YAML data:", error);
  }

  const sse = source('/api/monitor', {
    options: {
      body: JSON.stringify(config),
    }
  });
  let status: Readable<boolean[]> = sse.select('results').json();
  let widgetContents: Readable<(WidgetContent[] | undefined)[]> = sse.select('widgets').json();

  function confirmOpen(e: Event, i: number) {
    if (config[i]?.container && !$status?.[i]) {
      e.preventDefault();
      if (confirm("The service is down. Are you sure you want to open it?")) {
        window.open(toUrl(config[i]), '_blank');
      }
    }
  }

  onMount(async () => {
    const clientLib = await import('$lib/client');
    toUrl = clientLib.toUrl;
  });
</script>


{#if config?.length === 0}
  <p class="text-center italic">
    Nothing here. (try editing the config file: /etc/servedash/config.yaml)<br>
    The config file should be an array of objects that will look like this:
  </p>
  <pre class="whitespace-pre-wrap">{YAML.stringify([{
    "widget": "Widget ID, Overrides everything and replaces it with widgets (optional)",
    "name": "Name of the link",
    "icon": "URL to the icon",
    "desc": "Description of the link (optional)",
    "container": "Container name for status checks (optional)",
    "URLlink": {
      "prot": "https (or http)",
      "host": "example.com (leave empty for the current domain)",
      "port": 80,
      "path": "/path/to/page"
    }
  }], null, 2)}</pre>
{:else}
  <div class="lg:h-[calc(100vh-10rem)] min-h-fit grid place-items-center w-full">
    <div class="flex flex-wrap justify-center items-center my-2 gap-2 w-full">
      {#each config as item, i}
        <div class="card w-full sm:w-[40%] lg:w-[24%] xl:w-1/5 flex items-center h-fit gap-2 px-2">
          {#if item?.widget}
            {#if $widgetContents?.[i]?.length}
              {#each $widgetContents?.[i] as widget}
                <div class="flex flex-col text-center flex-1 justify-center items">
                  <span class="text-xs text-subtext0">{widget.title}</span>
                  <h2 class="font-bold text-xl whitespace-nowrap" class:warning={widget.warning}>{widget.content}</h2>
                </div>
              {/each}
            {:else}
              <div class="flex flex-col text-center flex-1 justify-center items">
                <h2 class="font-bold text-lg">Loading data...</h2>
              </div>
            {/if}
          {:else}
            {#if item.icon}
              <a href={toUrl(item)} on:click={(e) => confirmOpen(e, i)} target="_blank">
                <img class="size-12 rounded-xl" class:grayscale={item?.container && !$status?.[i]} src={item.icon} alt={item.desc}>
              </a>
            {/if}
            <div class="flex-1">
              <h3><a href={toUrl(item)} on:click={(e) => confirmOpen(e, i)} target="_blank">{item.name}</a></h3>
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
        {/if}
        </div>
      {/each}
    </div>
  </div>
  <p class="text-center text-subtext0 italic">Edit links at: /etc/servedash/config.yaml</p>
{/if}
