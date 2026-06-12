<script>
	import { page } from '$app/state';
</script>

<main>
    <h1>Error {page.status}: {page.error?.message}</h1>
    <p>Error URL: {page.url}</p>
    <p><a href="./">Go home</a></p>
</main>

<style>
    main {
        display: flexbox;
        justify-items: center;
        margin: 2em;
        flex-grow: 1;
    }
</style>