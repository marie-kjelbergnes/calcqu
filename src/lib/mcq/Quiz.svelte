<script lang="ts">
    import { onMount } from "svelte";
    import {
        group_categories, letters, score, blank_correct, loadResults, saveResults,
        type Category, type Question, type Response, type Results
    } from "$lib/mcq";
    import { render_text } from "$lib/common";
    import Walkthrough from "$lib/Walkthrough.svelte";

    let { title, categories }: { title: string; categories: Category[] } = $props();
    let groups = $derived(group_categories(categories));

    let results = $state<Results>({});
    let category = $state<Category | null>(null);
    let index = $state(0);
    // answer being built before it is checked, shape depends on the question type
    let draft = $state<any>(null);
    let revealed = $state(false);
    // showing the walkthrough of the open category instead of its questions
    let learning = $state(false);

    onMount(() => {
        results = loadResults();
    });

    let question = $derived(category?.questions[index]);
    let response = $derived(category ? results[category.id]?.[index] : undefined);
    let fraction = $derived(question && response !== undefined ? score(question, response) : null);
    // what is shown in the inputs: the saved answer once checked, otherwise the draft
    let shown = $derived<any>(response ?? draft);

    /** Text with $latex$ and line breaks to html */
    function md(text: string) {
        return render_text(text).replaceAll("\n", "<br>");
    }

    function learn(cat: Category) {
        category = cat;
        learning = true;
    }

    function start_quiz() {
        if (category) open(category);
    }

    function empty_draft(q: Question): any {
        switch (q.type) {
            case "multi": return [];
            case "truefalse": return q.statements.map(() => null);
            case "match": return q.items.map(() => -1);
            case "fill": return q.blanks.map(() => "");
            case "written": return "";
            default: return null;
        }
    }

    function go_to(i: number) {
        if (!category) return;
        index = i;
        revealed = false;
        draft = empty_draft(category.questions[i]);
    }

    function stats(cat: Category) {
        const answers = results[cat.id] ?? {};
        let answered = 0, correct = 0, earned = 0, total = 0;
        cat.questions.forEach((q, i) => {
            const points = q.points ?? 1;
            total += points;
            if (answers[i] === undefined) return;
            answered++;
            const f = score(q, answers[i]);
            earned += f * points;
            if (f === 1) correct++;
        });
        const has_points = cat.questions.some((q) => q.points !== undefined);
        return { answered, correct, earned: Math.round(earned * 10) / 10, total, count: cat.questions.length, has_points };
    }

    function open(cat: Category) {
        category = cat;
        learning = false;
        // continue at the first unanswered question
        const answers = results[cat.id] ?? {};
        const next = cat.questions.findIndex((_, i) => answers[i] === undefined);
        go_to(next === -1 ? 0 : next);
    }

    function save(r: Response) {
        if (!category || response !== undefined) return;
        results[category.id] = { ...results[category.id], [index]: r };
        saveResults(results);
    }

    function toggle(letter: string) {
        draft = draft.includes(letter) ? draft.filter((l: string) => l !== letter) : [...draft, letter];
    }

    function reset() {
        if (!category) return;
        delete results[category.id];
        saveResults(results);
        go_to(0);
    }

    function status(i: number) {
        if (!category) return "";
        const r = results[category.id]?.[i];
        if (r === undefined) return "";
        const f = score(category.questions[i], r);
        return f === 1 ? "correct" : f > 0 ? "partial" : "wrong";
    }

    function feedback(q: Question, f: number) {
        if (q.type === "written") return f === 1 ? "Marked as correct." : f > 0 ? "Marked as partly correct." : "Marked as wrong.";
        if (f === 1) return "Correct!";
        if (!q.type || q.type === "single" || q.type === "multi") {
            const answer = Array.isArray(q.answer) ? q.answer.join(", ") : q.answer;
            return `Wrong, the answer is ${answer}.`;
        }
        return `${Math.round(f * 100)}% correct.`;
    }
</script>

<main>
    {#if !category}
        <h2>{title}</h2>
        {#each groups as [group, cats] (group)}
            <h3 class="group">{group}</h3>
            <ul class="categories">
                {#each cats as cat (cat.id)}
                    {@const s = stats(cat)}
                    <li class:has-lesson={cat.lesson}>
                        <button onclick={() => open(cat)}>
                            <span class="name">{cat.name}</span>
                            <span class="progress">
                                {s.answered}/{s.count} answered ·
                                {#if s.has_points}{s.earned}/{s.total} points{:else}{s.correct} correct{/if}
                            </span>
                            {#if cat.description}
                                <span class="description">{cat.description}</span>
                            {/if}
                        </button>
                        {#if cat.lesson}
                            <button class="learn" onclick={() => learn(cat)}>
                                Walkthrough
                                <span class="progress">{cat.lesson.length} steps</span>
                            </button>
                        {/if}
                    </li>
                {/each}
            </ul>
        {/each}
    {:else if learning && category.lesson}
        <div class="bar">
            <button class="link" onclick={() => (category = null)}>&larr; Categories</button>
            <span>{category.name}</span>
            <button class="link" onclick={start_quiz}>Go to quiz &rarr;</button>
        </div>

        <Walkthrough lesson={category.lesson} onquiz={start_quiz} />
    {:else if question}
        {@const s = stats(category)}
        <div class="bar">
            <button class="link" onclick={() => (category = null)}>&larr; Categories</button>
            <span>
                {category.name}
                {#if category.lesson}
                    · <button class="link" onclick={() => learn(category!)}>Walkthrough</button>
                {/if}
            </span>
            <span>{#if s.has_points}{s.earned}/{s.total} points{:else}{s.correct}/{s.answered} correct{/if}</span>
        </div>

        <nav class="dots">
            {#each category.questions as _, i}
                <button
                    class="dot {status(i)}"
                    class:current={i === index}
                    onclick={() => go_to(i)}
                    title="Question {i + 1}"
                >{i + 1}</button>
            {/each}
        </nav>

        <section class="card">
            <p class="number">
                Question {index + 1} of {category.questions.length}
                {#if question.points !== undefined}· {question.points}p{/if}
            </p>
            <div class="question">{@html md(question.question)}</div>

            {#if question.image}
                <img src={question.image} alt={question.imageAlt ?? ""} />
            {/if}

            {#if !question.type || question.type === "single"}
                {@const q = question}
                <ol class="options">
                    {#each q.options as option, i}
                        {@const letter = letters[i]}
                        <li>
                            <button
                                class="option"
                                class:correct={response !== undefined && letter === q.answer}
                                class:wrong={response === letter && letter !== q.answer}
                                disabled={response !== undefined}
                                onclick={() => save(letter)}
                            >
                                <span class="letter">{letter}</span>
                                <span>{@html md(option)}</span>
                            </button>
                        </li>
                    {/each}
                </ol>
            {:else if question.type === "multi"}
                {@const q = question}
                <ol class="options">
                    {#each q.options as option, i}
                        {@const letter = letters[i]}
                        {@const chosen = shown.includes(letter)}
                        <li>
                            <button
                                class="option"
                                class:selected={chosen}
                                class:correct={response !== undefined && q.answer.includes(letter)}
                                class:wrong={response !== undefined && chosen && !q.answer.includes(letter)}
                                disabled={response !== undefined}
                                onclick={() => toggle(letter)}
                                aria-pressed={chosen}
                            >
                                <span class="letter box">{chosen ? "✓" : letter}</span>
                                <span>{@html md(option)}</span>
                            </button>
                        </li>
                    {/each}
                </ol>
                {#if response === undefined}
                    <button class="check" disabled={draft.length === 0} onclick={() => save($state.snapshot(draft))}>Check</button>
                {/if}
            {:else if question.type === "truefalse"}
                {@const q = question}
                <div class="scroll">
                    <table class="tf">
                        <thead><tr><th></th><th></th><th>True</th><th>False</th></tr></thead>
                        <tbody>
                            {#each q.statements as statement, i}
                                <tr>
                                    <td class="tf-letter">{letters[i]}</td>
                                    <td>{@html md(statement)}</td>
                                    {#each [true, false] as value}
                                        <td>
                                            <button
                                                class="tf-choice"
                                                class:selected={shown[i] === value}
                                                class:correct={response !== undefined && q.answer[i] === value}
                                                class:wrong={response !== undefined && shown[i] === value && q.answer[i] !== value}
                                                disabled={response !== undefined}
                                                onclick={() => (draft[i] = value)}
                                                aria-label="{letters[i]}: {value ? 'true' : 'false'}"
                                            >{shown[i] === value ? "●" : "○"}</button>
                                        </td>
                                    {/each}
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                {#if response === undefined}
                    <button class="check" onclick={() => save($state.snapshot(draft))}>Check</button>
                {/if}
            {:else if question.type === "match"}
                {@const q = question}
                {@const image_choices = q.choices.some((c) => c.image)}
                {#if image_choices}
                    <div class="gallery">
                        {#each q.choices as choice, c}
                            <figure>
                                <figcaption>{letters[c]}</figcaption>
                                {#if choice.image}<img src={choice.image} alt={choice.imageAlt ?? ""} />{/if}
                                {#if choice.text}<div>{@html md(choice.text)}</div>{/if}
                            </figure>
                        {/each}
                    </div>
                {/if}
                <ol class="match">
                    {#each q.items as item, i}
                        {@const right = response !== undefined && shown[i] === q.answer[i]}
                        <li class:correct={response !== undefined && right} class:wrong={response !== undefined && !right}>
                            <div class="match-item">
                                {#if item.image}<img src={item.image} alt={item.imageAlt ?? ""} />{/if}
                                {#if item.text}<div class="scroll">{@html md(item.text)}</div>{/if}
                            </div>
                            <div class="match-select">
                                <select
                                    value={shown[i]}
                                    onchange={(e) => (draft[i] = Number((e.target as HTMLSelectElement).value))}
                                    disabled={response !== undefined}
                                    aria-label="Choice for item {i + 1}"
                                >
                                    <option value={-1}>Choose…</option>
                                    {#each q.choices as choice, c}
                                        <option value={c}>{letters[c]}{choice.text && !image_choices ? `: ${choice.text}` : ""}</option>
                                    {/each}
                                </select>
                                {#if response !== undefined}
                                    <span class="mark">
                                        {#if right}✓{:else}✗ {letters[q.answer[i]]}{q.choices[q.answer[i]].text && !image_choices ? `: ${q.choices[q.answer[i]].text}` : ""}{/if}
                                    </span>
                                {/if}
                            </div>
                        </li>
                    {/each}
                </ol>
                {#if response === undefined}
                    <button class="check" onclick={() => save($state.snapshot(draft))}>Check</button>
                {/if}
            {:else if question.type === "fill"}
                {@const q = question}
                <div class="blanks">
                    {#each q.blanks as blank, i}
                        {@const right = response !== undefined && blank_correct(q, i, shown[i])}
                        <label class:correct={response !== undefined && right} class:wrong={response !== undefined && !right}>
                            <span>{@html md(blank)}</span>
                            <input
                                type="text"
                                inputmode="decimal"
                                value={shown[i]}
                                oninput={(e) => (draft[i] = (e.target as HTMLInputElement).value)}
                                disabled={response !== undefined}
                            />
                            {#if response !== undefined && !right}<span class="mark">{q.answer[i]}</span>{/if}
                        </label>
                    {/each}
                </div>
                {#if response === undefined}
                    <button class="check" onclick={() => save($state.snapshot(draft))}>Check</button>
                {/if}
            {:else if question.type === "written"}
                {@const q = question}
                {@const done = response as { self: number; text: string } | undefined}
                <textarea
                    rows="6"
                    placeholder="Write your answer here…"
                    value={done ? done.text : draft}
                    oninput={(e) => (draft = (e.target as HTMLTextAreaElement).value)}
                    disabled={done !== undefined}
                ></textarea>
                {#if revealed || done}
                    <div class="model">
                        <strong>Model answer</strong>
                        <p>{@html md(q.answer)}</p>
                    </div>
                    {#if !done}
                        <p class="hint">How well did your answer match?</p>
                        <div class="self">
                            <button onclick={() => save({ self: 1, text: draft })}>Correct</button>
                            <button onclick={() => save({ self: 0.5, text: draft })}>Partly</button>
                            <button onclick={() => save({ self: 0, text: draft })}>Wrong</button>
                        </div>
                    {/if}
                {:else}
                    <button class="check" onclick={() => (revealed = true)}>Show model answer</button>
                {/if}
            {/if}

            {#if fraction !== null}
                <p class="feedback {fraction === 1 ? 'correct' : fraction > 0 ? 'partial' : 'wrong'}">{feedback(question, fraction)}</p>
                {#if question.note}
                    <p class="note">{@html md(question.note)}</p>
                {/if}
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

    h3.group {
        color: var(--foam);
        margin: 2rem 0 0.5rem;
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

    .categories li.has-lesson {
        display: flex;
        gap: 0.5rem;
    }

    .categories li.has-lesson > button:first-child {
        flex: 1;
    }

    .categories button.learn {
        width: auto;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        flex-wrap: nowrap;
        gap: 0.2rem;
        color: var(--foam);
        text-align: center;
    }


    .progress {
        color: var(--subtle);
    }

    .description {
        flex-basis: 100%;
        color: var(--subtle);
        font-size: 0.85rem;
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

    .dot.partial {
        background-color: var(--gold);
        color: var(--base);
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

    .question {
        margin: 0.5rem 0 1rem;
        font-size: 1.3rem;
        font-weight: bold;
        line-height: 1.5;
        overflow-x: auto;
    }

    .question :global(.katex-display) {
        font-weight: normal;
        font-size: 1rem;
        margin: 0.75rem 0;
    }

    .scroll {
        overflow-x: auto;
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

    .letter.box {
        border-radius: 0.3rem;
    }

    .option.selected .letter,
    .tf-choice.selected {
        background-color: var(--iris);
        color: var(--base);
    }

    .option.correct,
    .tf-choice.correct {
        border-color: var(--foam);
        background-color: color-mix(in srgb, var(--pine) 40%, var(--overlay));
    }

    .option.wrong,
    .tf-choice.wrong {
        border-color: var(--love);
        background-color: color-mix(in srgb, var(--love) 30%, var(--overlay));
    }

    .tf-choice:disabled {
        opacity: 1;
    }

    .check {
        margin-top: 1rem;
    }

    .tf {
        width: 100%;
        border-collapse: collapse;
    }

    .tf th {
        color: var(--subtle);
        font-weight: normal;
        padding: 0.25rem 0.5rem;
    }

    .tf td {
        padding: 0.4rem 0.5rem;
        border-top: 1px solid var(--highlight-med);
    }

    .tf-letter {
        color: var(--subtle);
    }

    .tf-choice {
        padding: 0.25rem 0.75rem;
    }

    .gallery {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 1rem;
    }

    .gallery figure {
        margin: 0;
        flex: 1 1 14rem;
        max-width: 22rem;
    }

    .gallery figcaption {
        font-weight: bold;
        color: var(--iris);
        margin-bottom: 0.25rem;
    }

    .gallery img {
        margin: 0;
    }

    .match {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .match li {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        border: 1px solid var(--highlight-med);
        border-radius: 0.4rem;
    }

    .match li.correct,
    .blanks label.correct input {
        border-color: var(--foam);
    }

    .match li.wrong,
    .blanks label.wrong input {
        border-color: var(--love);
    }

    .match-item {
        flex: 1 1 14rem;
        min-width: 0;
    }

    .match-item img {
        max-height: 14rem;
        margin: 0;
    }

    .match-select {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    select,
    input,
    textarea {
        font: inherit;
        color: var(--text);
        background-color: var(--overlay);
        border: 1px solid var(--highlight-high);
        border-radius: 0.4rem;
        padding: 0.4rem 0.6rem;
    }

    select:disabled,
    input:disabled,
    textarea:disabled {
        opacity: 1;
        color: var(--text);
    }

    .mark {
        color: var(--subtle);
    }

    .blanks {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1.25rem;
    }

    .blanks label {
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }

    .blanks input {
        width: 4.5rem;
    }

    textarea {
        width: 100%;
        box-sizing: border-box;
        resize: vertical;
    }

    .model {
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        border-left: 3px solid var(--iris);
        background-color: var(--overlay);
        border-radius: 0.4rem;
    }

    .model p {
        margin: 0.5rem 0 0;
        line-height: 1.5;
    }

    .hint {
        color: var(--subtle);
    }

    .self {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .feedback.correct {
        color: var(--foam);
    }

    .feedback.partial {
        color: var(--gold);
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
