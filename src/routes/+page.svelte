<script>
    import FormulaInput from "$lib/FormulaInput.svelte";
</script>

<header class="title">
    <h1>Calcqu<sup>alpha</sup></h1>
</header>


<main class="main">
    <FormulaInput />
</main>

<footer>
    <a href="./">&#169 Calcqu</a>
    <a href="licenses">Licenses & Acknowledgments</a>
</footer>

<style>
    :global(body) {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        margin: 0;
    }

    .title {
        display: flex;
        justify-content: center;
    }

    h1 sup {
        font-size: 1.0rem; /* relative to h1's font size */
        font-weight: normal;
        letter-spacing: 0.05em;
    }

    main {
        flex-grow: 1;  /* pushes footer to bottom */
    }

    footer {
        display: flex;
        justify-content: center;
        gap: 1em;
    }
</style>