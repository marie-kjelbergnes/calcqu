<script>
    import katex from "katex";
    import dat110 from "$lib/dat110.json";

    const formulas = dat110.formulas;
    let rendered_formula = $state("");
    let question_text = $state("");
    let show_answer = $state(false);

    let math_expr = formulas[0].answer;

    let text_thing = katex.renderToString(math_expr,
        {
            throwOnError: false,
            displayMode: true
        }
    );

    function get_question() {
        show_answer = false;
        let random_question = formulas[Math.floor(Math.random() * formulas.length)];

        rendered_formula = katex.renderToString(random_question.answer,
            {
                throwOnError: false,
                displayMode: true
            }
        );

        question_text = random_question.question;
    }

    get_question();
</script>

<div class="wrapper">
    <h1 class="title">DAT110 Quiz</h1>

    <div class="card">
        <p class="question">{@html question_text}</p>

        {#if !show_answer}
            <div class="answer blur">
                <p>{@html rendered_formula}</p>
            </div>
            <button class="primary" onclick={() => {show_answer = true;}}>
                Reveal answer
            </button>
        {:else}
            <div class="answer">
                <p>{@html rendered_formula}</p>
            </div>
        {/if}

        <button class="secondary" onclick={get_question}>
            Next question
        </button>
    </div>
</div>

<style>
    :global(body) {
        background: linear-gradient(135deg, #ffe4ec, #f7f0ff);
        font-family: "Segoe UI", "Helvetica Neue", sans-serif;
        color: #444;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
    }

    .title {
        text-align: center;
        font-weight: 600;
        color: #b76e79;
        margin-bottom: 1rem;
    }

    .card {
        background: white;
        padding: 2rem;
        border-radius: 20px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        max-width: 500px;
        text-align: center;
    }

    .question {
        font-size: 1.1rem;
        margin-bottom: 1.5rem;
    }

    .answer {
        background: #fff0f5;
        border-radius: 12px;
        padding: 1rem;
        margin: 1rem 0;
    }

    .blur {
        filter: blur(5px);
    }

    button {
        border: none;
        padding: 0.6rem 1.2rem;
        margin: 0.4rem;
        border-radius: 999px;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .primary {
        background: #ff8fab;
        color: white;
    }

    .primary:hover {
        background: #ff6f91;
        transform: translateY(-1px);
    }

    .secondary {
        background: #e0c3fc;
        color: #4b3f72;
    }

    .secondary:hover {
        background: #cdb4f6;
        transform: translateY(-1px);
    }
</style>