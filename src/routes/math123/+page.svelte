<script lang="ts">
    import { onMount, tick } from "svelte";
    import {
        groups, grade, render_text, loadResults, saveResults,
        type MathCategory, type Results, type Verdict
    } from "$lib/math_quiz";
    import { render_expression } from "$lib/common";

    let results = $state<Results>({});
    let category = $state<MathCategory | null>(null);
    let index = $state(0);
    let input = $state("");
    let verdict = $state<Verdict | null>(null);
    let mfe: any = $state();

    onMount(async () => {
        await import("mathlive");
        results = loadResults();
    });

    let question = $derived(category?.questions[index]);
    let result = $derived(question ? results[question.id] : undefined);
    let show_answer = $derived(result?.status === "correct" || result?.status === "revealed");

    function stats(cat: MathCategory) {
        let correct = 0;
        let attempted = 0;
        for (const q of cat.questions) {
            const r = results[q.id];
            if (!r) continue;
            attempted++;
            if (r.status === "correct") correct++;
        }
        return { correct, attempted, total: cat.questions.length };
    }

    async function go_to(i: number) {
        index = i;
        input = "";
        verdict = null;
        await tick();
        if (mfe) {
            mfe.value = "";
            mfe.focus();
        }
    }

    function open(cat: MathCategory) {
        category = cat;
        // continue at the first question that isn't solved yet
        const next = cat.questions.findIndex((q) => results[q.id]?.status !== "correct");
        go_to(next === -1 ? 0 : next);
    }

    function check() {
        if (!question || input.trim() === "") return;
        verdict = grade(input, question.answer, category?.tolerance);
        if (verdict === "invalid") return;

        const previous = results[question.id];
        const attempts = (previous?.attempts ?? 0) + 1;
        let status = previous?.status ?? "wrong";
        if (verdict === "correct" && status !== "revealed") status = "correct";
        results[question.id] = { status, attempts };
        saveResults(results);
    }

    function reveal() {
        if (!question) return;
        const previous = results[question.id];
        if (previous?.status === "correct") return;
        results[question.id] = { status: "revealed", attempts: previous?.attempts ?? 0 };
        saveResults(results);
    }

    function reset() {
        if (!category) return;
        for (const q of category.questions) delete results[q.id];
        saveResults(results);
        go_to(0);
    }

    function handle_keydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault();
            check();
        }
    }

    const feedback: Record<Verdict, string> = {
        correct: "Correct!",
        close: "Close, but not exact. Give an exact answer (like 1/3 or √2) or more decimals.",
        wrong: "Not quite, try again.",
        invalid: "Couldn't evaluate that to a number. Make sure the answer contains no variables."
    };
</script>

<main>
    {#if !category}
        <h2>Math questions</h2>
        <p class="intro">Answer with an exact expression or a decimal number: <code>1/2</code>, <code>0.5</code> and <code>\frac{"{1}{2}"}</code> are all accepted. Use <code>i</code> for the imaginary unit and <code>e</code> for Euler's number.</p>
        {#each groups as [group, cats] (group)}
            <h3>{group}</h3>
            <ul class="categories">
                {#each cats as cat (cat.id)}
                    {@const s = stats(cat)}
                    <li>
                        <button onclick={() => open(cat)}>
                            <span class="name">{cat.name}</span>
                            <span class="progress">{s.correct}/{s.total} correct · {s.attempted} attempted</span>
                        </button>
                    </li>
                {/each}
            </ul>
        {/each}
    {:else if question}
        {@const s = stats(category)}
        <div class="bar">
            <button class="link" onclick={() => (category = null)}>&larr; Categories</button>
            <span>{category.name}</span>
            <span>{s.correct}/{s.total} correct</span>
        </div>

        <nav class="dots">
            {#each category.questions as q, i (q.id)}
                <button
                    class="dot {results[q.id]?.status ?? ''}"
                    class:current={i === index}
                    onclick={() => go_to(i)}
                    title="Question {i + 1}"
                >{i + 1}</button>
            {/each}
        </nav>

        <section class="card">
            <p class="number">Question {index + 1} of {category.questions.length}</p>
            {#if category.tolerance}
                <p class="hint">Decimal answers within ±{category.tolerance} are accepted, like on the exam (at least 2 decimals, radians).</p>
            {/if}
            <div class="question">{@html render_text(question.text)}</div>

            {#if question.image}
                <img src={question.image} alt={question.imageAlt ?? ""} />
            {/if}

            <div class="answer-row">
                <math-field
                    bind:this={mfe}
                    oninput={(e: Event) => (input = (e.target as HTMLInputElement).value)}
                    onkeydown={handle_keydown}
                    aria-label="Answer"
                    role="textbox"
                    tabindex="0"
                ></math-field>
                <button onclick={check}>Check</button>
            </div>

            {#if verdict}
                <p class="feedback {verdict}">
                    {feedback[verdict]}
                </p>
            {/if}

            {#if show_answer}
                <div class="solution">
                    <span>Answer:</span>
                    {@html render_expression(question.answer)}
                </div>
            {:else}
                <button class="link" onclick={reveal}>Show answer</button>
            {/if}

            <div class="controls">
                <button disabled={index === 0} onclick={() => go_to(index - 1)}>Previous</button>
                <button disabled={index === category.questions.length - 1} onclick={() => go_to(index + 1)}>Next</button>
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

    .intro {
        color: var(--subtle);
        text-align: center;
    }

    h3 {
        color: var(--foam);
        margin: 2rem 0 0.5rem;
    }

    .hint {
        margin: 0.25rem 0 0;
        color: var(--subtle);
        font-size: 0.85rem;
    }

    code {
        color: var(--foam);
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

    .dot.revealed {
        background-color: var(--gold);
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

    .question {
        margin: 0.75rem 0 1.25rem;
        font-size: 1.15rem;
        line-height: 2.2;
        overflow-x: auto;
    }

    img {
        display: block;
        max-width: 100%;
        margin: 0 auto 1rem;
        border-radius: 0.4rem;
    }

    .answer-row {
        display: flex;
        gap: 0.5rem;
        align-items: stretch;
    }

    math-field {
        flex-grow: 1;
        min-width: 0;
        border-radius: 8px;
        padding: 0.5rem 0.7rem;
        font-size: 1.2rem;
        background-color: var(--overlay);
        border: 1px solid var(--highlight-high);
        color: var(--text);
        --caret-color: var(--love);
        --selection-background-color: var(--highlight-med);
        --selection-color: var(--text);
        --placeholder-color: var(--muted);
        --contains-highlight-background-color: var(--highlight-low);
    }

    math-field:focus-within {
        border-color: var(--love);
        outline: 2px solid var(--love);
        outline-offset: 2px;
    }

    math-field::part(virtual-keyboard-toggle) {
        color: var(--subtle);
    }

    .feedback.correct {
        color: var(--foam);
    }

    .feedback.close {
        color: var(--gold);
    }

    .feedback.wrong,
    .feedback.invalid {
        color: var(--love);
    }

    .solution {
        display: flex;
        align-items: center;
        gap: 1rem;
        color: var(--subtle);
    }

    .solution :global(.katex-display) {
        margin: 0.5rem 0;
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
