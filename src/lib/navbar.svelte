<script>
    import { page } from '$app/stores';
    let path;
    $: path = $page.url.pathname;
</script>

<nav class="btngroup">
    <button disabled={path === "/"}><a href="/">Home</a></button>
    <button disabled={path === "/status"}><a href="/status">Status</a></button>
    <button disabled={path === "/containers"}><a href="/containers">Containers</a></button>
    <!-- <button disabled={path === "/shell"}><a href="/shell">Shell</a></button> -->
    <!-- ^^ waiting for official websocket support -->
    <!-- <button disabled={path === "/files"}><a href="/files">Files</a></button> -->
    <!-- ^^ work in progress -->
</nav>