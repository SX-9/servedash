<script lang="ts">
  import { errors, notifs, readableUptime } from "$lib/client";
  import Navbar from "$lib/navbar.svelte";
  import "../app.css";

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
</script>

<svelte:head>
  <title>
    {data?.username}@{data?.hostname}
  </title>
</svelte:head>
<header class="mb-4">
  <h3 class="text-subtext0 italic">
    {message
      ? message
      : displaySwitch
        ? data?.username+'@'+data?.hostname
        : readableUptime(data.uptime)
    }
  </h3>
  <Navbar></Navbar>
  <span class="text-red italic">{err?`!! ${err}, check devtools for details !!`:''}</span>
</header>
<main>
  <slot />
</main>
<footer class="mt-4 flex justify-center items-center">
  <p>made by <a href="https://satr14.is-a.dev">satr14</a></p>
</footer>