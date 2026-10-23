<script lang="ts">
    import { onMount } from "svelte";
    import { categories, letters, loadResults, saveResults, type Category, type Letter, type Results } from "$lib/mcq";

    let results = $state<Results>({});
    let category = $state<Category | null>(null);
    let index = $state(0);

    onMount(() => {
        results = loadResults();
    });

    let question = $derived(category?.questions[index]);
    let chosen = $derived(category ? results[category.id]?.[index] : undefined);

    function stats(cat: Category) {
        const answers = results[cat.id] ?? {};
        let answered = 0;
        let correct = 0;
        cat.questions.forEach((q, i) => {
            if (answers[i]) {
                answered++;
                if (answers[i] === q.answer) correct++;
            }
        });
        return { answered, correct, total: cat.questions.length };
    }

    function open(cat: Category) {
        category = cat;
        // continue at the first unanswered question
        const answers = results[cat.id] ?? {};
        const next = cat.questions.findIndex((_, i) => !answers[i]);
        index = next === -1 ? 0 : next;
    }

    function choose(letter: Letter) {
        if (!category || chosen) return;
        results[category.id] = { ...results[category.id], [index]: letter };
        saveResults(results);
    }

    function reset() {
        if (!category) return;
        delete results[category.id];
        saveResults(results);
        index = 0;
    }

    function status(i: number) {
        if (!category) return "";
        const a = results[category.id]?.[i];
        if (!a) return "";
        return a === category.questions[i].answer ? "correct" : "wrong";
    }
</script>

<main>
    {#if !category}
        <h2>Multiple choice questions</h2>
        <ul class="categories">
            {#each categories as cat (cat.id)}
                {@const s = stats(cat)}
                <li>
                    <button onclick={() => open(cat)}>
                        <span class="name">{cat.name}</span>
                        <span class="progress">
                            {s.answered}/{s.total} answered · {s.correct} correct
                        </span>
                    </button>
                </li>
            {/each}
        </ul>
    {:else if question}
        {@const s = stats(category)}
        <div class="bar">
            <button class="link" onclick={() => (category = null)}>&larr; Categories</button>
            <span>{category.name}</span>
            <span>{s.correct}/{s.answered} correct</span>
        </div>

        <nav class="dots">
            {#each category.questions as _, i}
                <button
                    class="dot {status(i)}"
                    class:current={i === index}
                    onclick={() => (index = i)}
                    title="Question {i + 1}"
                >{i + 1}</button>
            {/each}
        </nav>

        <section class="card">
            <p class="number">Question {index + 1} of {category.questions.length}</p>
            <h3>{question.question}</h3>

            {#if question.image}
                <img src={question.image} alt={question.imageAlt ?? ""} />
            {/if}

            <ol class="options">
                {#each question.options as option, i}
                    {@const letter = letters[i]}
                    <li>
                        <button
                            class="option"
                            class:correct={chosen && letter === question.answer}
                            class:wrong={chosen === letter && letter !== question.answer}
                            disabled={!!chosen}
                            onclick={() => choose(letter)}
                        >
                            <span class="letter">{letter}</span>
                            <span>{option}</span>
                        </button>
                    </li>
                {/each}
            </ol>

            {#if chosen}
                <p class="feedback {chosen === question.answer ? 'correct' : 'wrong'}">
                    {chosen === question.answer ? "Correct!" : `Wrong, the answer is ${question.answer}.`}
                </p>
                {#if question.note}
                    <p class="note">{question.note}</p>
                {/if}
            {/if}

            <div class="controls">
                <button disabled={index === 0} onclick={() => index--}>Previous</button>
                <button disabled={index === category.questions.length - 1} onclick={() => index++}>Next</button>
            </div>
        </section>

        <button class="link reset" onclick={reset}>Reset results for this category</button>
    {/if}
</main>

<style>
    main {
        flex-grow: 1;
        padding: 2rem;
        max-width: 50rem;
        width: 100%;
        margin: 0 auto;
        box-sizing: border-box;
    }

    h2 {
        text-align: center;
        color: var(--iris);
    }

    button {
        font: inherit;
        color: var(--text);
        background-color: var(--overlay);
        border: 1px solid var(--highlight-high);
        border-radius: 0.4rem;
        padding: 0.5rem 1rem;
        cursor: pointer;
    }

    button:hover:not(:disabled) {
        border-color: var(--rose);
    }

    button:disabled {
        cursor: default;
        opacity: 0.6;
    }

    .link {
        background: none;
        border: none;
        color: var(--rose);
        padding: 0;
    }

    .link:hover {
        color: var(--love);
    }

    .categories {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .categories button {
        width: 100%;
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 1rem 1.25rem;
        background-color: var(--surface);
        text-align: left;
    }

    .progress {
        color: var(--subtle);
    }

    .bar {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.5rem;
        color: var(--subtle);
        margin-bottom: 1rem;
    }

    .dots {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
        margin-bottom: 1rem;
    }

    .dot {
        width: 2.1rem;
        padding: 0.25rem 0;
        font-size: 0.8rem;
        background-color: var(--surface);
    }

    .dot.correct {
        background-color: var(--pine);
    }

    .dot.wrong {
        background-color: var(--love);
        color: var(--base);
    }

    .dot.current {
        border-color: var(--gold);
        outline: 1px solid var(--gold);
    }

    .card {
        background-color: var(--surface);
        border: 1px solid var(--highlight-med);
        border-radius: 0.6rem;
        padding: 1.5rem;
    }

    .number {
        margin: 0;
        color: var(--love);
        font-size: 0.85rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
    }

    h3 {
        margin: 0.5rem 0 1rem;
        font-size: 1.3rem;
    }

    img {
        display: block;
        max-width: 100%;
        margin: 0 auto 1rem;
        border-radius: 0.4rem;
    }

    .options {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .option {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-align: left;
    }

    .option:disabled {
        opacity: 1;
    }

    .letter {
        flex-shrink: 0;
        width: 1.8rem;
        height: 1.8rem;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background-color: var(--highlight-med);
        font-size: 0.85rem;
        font-weight: bold;
    }

    .option.correct {
        border-color: var(--foam);
        background-color: color-mix(in srgb, var(--pine) 40%, var(--overlay));
    }

    .option.wrong {
        border-color: var(--love);
        background-color: color-mix(in srgb, var(--love) 30%, var(--overlay));
    }

    .feedback.correct {
        color: var(--foam);
    }

    .feedback.wrong {
        color: var(--love);
    }

    .note {
        color: var(--subtle);
        font-style: italic;
    }

    .controls {
        display: flex;
        justify-content: space-between;
        margin-top: 1rem;
    }

    .reset {
        margin-top: 1rem;
        font-size: 0.85rem;
    }
</style>
