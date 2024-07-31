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
    Nothing here. (try editing the config file: /etc/servedash/config.yaml)
  </p>
{:else}
  <div class="lg:h-[calc(100vh-9rem)] min-h-fit grid place-items-center w-full">
    <div class="flex flex-wrap justify-center items-center my-2 gap-2 w-full">
      {#each config as item, i}
        <div class="card w-full sm:w-[40%] lg:w-[24%] xl:w-1/5 flex items-center min-h-12 h-fit gap-2 px-2">
          {#if item?.widget}
            {#if $widgetContents?.[i]?.length}
              {#each $widgetContents?.[i] as widget}
                <div class="bg-surface0 rounded-lg p-1 flex flex-col text-center flex-1 justify-center items">
                  <h2 class="font-bold text-lg whitespace-nowrap" class:warning={widget.warning}>{widget.content}</h2>
                  <span class="text-xs text-subtext0">{widget.title}</span>
                </div>
              {/each}
            {:else}
              <div class="h-12 bg-surface0 rounded-lg flex flex-col text-center flex-1 justify-center items">
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
              {#if item?.dynamic && (item?.container && $status?.[i])}
                {#if $widgetContents?.[i]?.length}
                  {#each $widgetContents?.[i] as widget}
                    <div class="bg-surface0 text-text text-xs chips nodefault">
                      <b class:warning={widget.warning}>{widget.content}</b> {widget.title}
                    </div>
                  {/each}
                {:else}
                  <h3>Loading...</h3>
                {/if}
              {:else}
                <h3><a href={toUrl(item)} on:click={(e) => confirmOpen(e, i)} target="_blank" class="no-underline">{item.name}</a></h3>
                <span>{item.desc || ''}</span>
              {/if}
            </div>
            {#if !item?.dynamic}
              {#if item?.container}
                {#if $status?.[i]}
                  <div class="text-green status">
                    <Icon icon="ic:sharp-arrow-drop-up" />
                  </div>
                {:else}
                  <div class="text-red status">
                    <Icon icon="ic:sharp-arrow-drop-down" />
                  </div>
                {/if}
              {:else}
                <div class="text-sapphire status">
                  <Icon icon="ic:sharp-arrow-right" />
                </div>
              {/if}
            {/if}
        {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
