<script lang="ts">
    import { render_text } from "$lib/common";
    import type { LessonStep } from "$lib/lesson";

    let { lesson, onquiz }: { lesson: LessonStep[]; onquiz: () => void } = $props();

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    let step = $state(0);
    // chosen answer to the quick check on the current step
    let checked = $state<string | null>(null);
    let page = $derived(lesson[step]);

    function go_step(i: number) {
        step = i;
        checked = null;
    }

    /** Text with $latex$ and line breaks to html */
    function md(text: string) {
        return render_text(text).replaceAll("\n", "<br>");
    }

    function escape(text: string) {
        return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    }

    function inline(text: string) {
        return render_text(text)
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/`([^`]+)`/g, "<code>$1</code>");
    }

    /** Walkthrough text: paragraphs separated by blank lines, "- " bullet lists, **bold**, `code` and ``` blocks */
    function rich(text: string) {
        return text.trim().split(/\n\s*\n/).map((block) => {
            if (block.startsWith("```")) {
                const code = block.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
                return `<pre><code>${escape(code)}</code></pre>`;
            }
            // consecutive "- " lines become a list, other runs of lines a paragraph
            const runs: { list: boolean; lines: string[] }[] = [];
            for (const line of block.split("\n")) {
                const list = line.startsWith("- ");
                const last = runs.at(-1);
                if (last && last.list === list) last.lines.push(list ? line.slice(2) : line);
                else runs.push({ list, lines: [list ? line.slice(2) : line] });
            }
            return runs.map((r) => r.list
                ? `<ul>${r.lines.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`
                : `<p>${r.lines.map(inline).join("<br>")}</p>`
            ).join("");
        }).join("");
    }
</script>

    <nav class="steps" aria-label="Walkthrough steps">
        {#each lesson as s, i (i)}
            <button
                class="step"
                class:current={i === step}
                class:done={i < step}
                onclick={() => go_step(i)}
                title={s.title.replaceAll("$", "")}
                aria-label="Step {i + 1}: {s.title.replaceAll("$", "")}"
            ></button>
        {/each}
    </nav>

    <section class="card lesson">
        <p class="number">Step {step + 1} of {lesson.length}</p>
        <h3 class="step-title">{@html inline(page.title)}</h3>
        <div class="rich">{@html rich(page.body)}</div>

        {#if page.image}
            <img src={page.image} alt={page.imageAlt ?? ""} />
        {/if}

        {#if page.example}
            <div class="example">
                <p class="box-label">Worked example</p>
                <div class="rich">{@html rich(page.example)}</div>
            </div>
        {/if}

        {#if page.remember}
            <div class="remember">
                <p class="box-label">Remember</p>
                <ul>
                    {#each page.remember as point}
                        <li>{@html inline(point)}</li>
                    {/each}
                </ul>
            </div>
        {/if}

        {#if page.check}
            {@const c = page.check}
            <div class="quick-check">
                <p class="box-label">Quick check</p>
                <div class="question">{@html md(c.question)}</div>
                <ol class="options">
                    {#each c.options as option, i}
                        {@const letter = letters[i]}
                        <li>
                            <button
                                class="option"
                                class:correct={checked !== null && letter === c.answer}
                                class:wrong={checked === letter && letter !== c.answer}
                                disabled={checked !== null}
                                onclick={() => (checked = letter)}
                            >
                                <span class="letter">{letter}</span>
                                <span>{@html md(option)}</span>
                            </button>
                        </li>
                    {/each}
                </ol>
                {#if checked !== null}
                    <p class="feedback {checked === c.answer ? 'correct' : 'wrong'}">
                        {checked === c.answer ? "Correct!" : `Not quite, the answer is ${c.answer}.`}
                    </p>
                    <p class="note">{@html md(c.explanation)}</p>
                {/if}
            </div>
        {/if}

        <div class="controls">
            <button disabled={step === 0} onclick={() => go_step(step - 1)}>Previous</button>
            {#if step < lesson.length - 1}
                <button onclick={() => go_step(step + 1)}>Next</button>
            {:else}
                <button class="primary" onclick={onquiz}>Start the quiz</button>
            {/if}
        </div>
    </section>

<style>
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
        font-weight: bold;
        line-height: 1.5;
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

    .steps {
        display: flex;
        gap: 0.3rem;
        margin-bottom: 1rem;
    }

    .step {
        flex: 1;
        height: 0.4rem;
        padding: 0;
        border: none;
        border-radius: 0.2rem;
        background-color: var(--highlight-high);
    }

    .step.done {
        background-color: var(--foam);
    }

    .step.current {
        background-color: var(--iris);
    }

    .step-title {
        color: var(--iris);
        margin: 0.25rem 0 1rem;
    }

    .rich {
        line-height: 1.6;
    }

    .rich :global(p) {
        margin: 0 0 0.8rem;
    }

    .rich :global(ul) {
        margin: 0 0 0.8rem;
        padding-left: 1.25rem;
    }

    .rich :global(li) {
        margin-bottom: 0.3rem;
    }

    .rich :global(code) {
        font-family: monospace;
        font-size: 0.9em;
        padding: 0.05rem 0.3rem;
        border-radius: 0.25rem;
        background-color: var(--highlight-low);
    }

    .rich :global(pre) {
        margin: 0 0 0.8rem;
        padding: 0.75rem 1rem;
        overflow-x: auto;
        border-radius: 0.4rem;
        background-color: var(--highlight-low);
    }

    .rich :global(pre code) {
        padding: 0;
        background: none;
    }

    .rich :global(strong) {
        color: var(--gold);
    }

    .rich :global(.katex-display) {
        overflow-x: auto;
        overflow-y: hidden;
    }

    .example,
    .remember,
    .quick-check {
        margin: 1.25rem 0;
        padding: 0.9rem 1.1rem;
        border-radius: 0.5rem;
        border-left: 3px solid var(--foam);
        background-color: var(--overlay);
    }

    .remember {
        border-left-color: var(--gold);
    }

    .remember ul {
        margin: 0;
        padding-left: 1.25rem;
        line-height: 1.6;
    }

    .quick-check {
        border-left-color: var(--iris);
    }

    .box-label {
        margin: 0 0 0.5rem;
        font-size: 0.8rem;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--subtle);
    }

    .primary {
        border-color: var(--iris);
        color: var(--iris);
    }
</style>
