<script lang="ts">
    import { page } from '$app/stores';
</script>

<h1 class="bold text-7xl text-center">{$page.status}</h1>
<p class="italic text-lg text-subtext1 text-center">{$page.error?.message}: {$page.error?.message}</p>