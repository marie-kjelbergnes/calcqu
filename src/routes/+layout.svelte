<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
	import "../app.css"

	let { children } = $props();
</script>

<header class="title">
    <h1><a href="./">Calcqu</a><sup title="things might work badly">alpha</sup></h1>
</header>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<footer>
    <a href="./">&#169 Calcqu</a>
    <a href="licenses">Licenses & Acknowledgments</a>
</footer>

<style>
	

	.title {
        display: flex;
        justify-content: center;
        padding: 1.5rem 0 1rem;
        border-bottom: 1px solid var(--love);
        background-color: var(--surface);
    }

    h1 {
        margin: 0;
        font-size: 2.4rem;
        color: var(--love);
        letter-spacing: 0.04em;
    }

	footer {
        display: flex;
        justify-content: center;
        gap: 1em;
        padding: 1rem;
        border-top: 1px solid var(--love);
        background-color: var(--surface);
        font-size: 0.85rem;
    }

    footer a {
        color: var(--rose);
        text-decoration: none;
        transition: color 0.2s ease;
    }

    footer a:hover {
        color: var(--love);
    }

	:global(body) {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		margin: 0;
		background-color: var(--base);
		color: var(--text);
		font-family: 'Georgia', serif;
	}

    h1 sup {
        font-size: 1.0rem;
        font-weight: normal;
        letter-spacing: 0.05em;
        color: var(--rose);
    }
</style>
