<script>
    import licenses from "$lib/licenses.json";
</script>

<header>
    <h1>Licenses & Acknowledgments for <a href="../">Calcqu</a></h1>
</header>

<main>
    <h2>This project would not be possible without the contributors of the following projects:</h2>
    <ul>
        {#each licenses["dependencies"] as license}
            <li>
                <a href={license.link}>{license.name}</a>:
                <details>
                    <summary>{license.license_name} License</summary>
                    <p>{license.license_text}</p>
                </details>
            </li>
        {/each}
    </ul>

    <p>This project is thus also licensed under the MIT license, and its source code can be found at <a href={licenses.self[0].link}>github</a>.</p>
    <details>
        <summary>{licenses.self[0].license_name} License</summary>
        <p>{licenses.self[0].license_text}</p>
    </details>
</main>



<style>
    header {
        display: flex;
        justify-content: center;
        text-align: center;
    }

    main {
        margin: 1em;
        flex-grow: 1;
        padding: 2rem;
    }
</style>