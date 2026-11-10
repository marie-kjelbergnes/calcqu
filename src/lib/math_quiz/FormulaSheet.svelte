<script lang="ts">
    import { render_text } from "$lib/math_quiz";

    let { open = $bindable(false) }: { open?: boolean } = $props();

    // the formula sheet attached to the MATH123 exam (2025)
    const sections: { title: string; body: string }[] = [
        {
            title: "A. Lokale ekstremalpunkter",
            body: "I et kritisk punkt $(a, b)$ har funksjonen $f(x, y)$<br>1) et lokalt maksimum hvis $D(a, b) > 0$ og $f_{xx}(a, b) < 0$,<br>2) et lokalt minimum hvis $D(a, b) > 0$ og $f_{xx}(a, b) > 0$,<br>3) et sadelpunkt hvis $D(a, b) < 0$,<br>der $$D(a, b) = \\begin{vmatrix} f_{xx}(a, b) & f_{xy}(a, b) \\\\ f_{yx}(a, b) & f_{yy}(a, b) \\end{vmatrix}.$$"
        },
        {
            title: "B. Optimering med bibetingelser",
            body: "For å maksimere/minimere funksjonen $f(x, y, z)$ under bibetingelsene $g_1(x, y, z) = 0$ og $g_2(x, y, z) = 0$ løser man Lagranges system $$\\nabla f = \\lambda \\nabla g_1 + \\mu \\nabla g_2, \\quad g_1(x, y, z) = 0, \\quad g_2(x, y, z) = 0,$$ der $\\nabla = \\left\\langle \\frac{\\partial}{\\partial x}, \\frac{\\partial}{\\partial y}, \\frac{\\partial}{\\partial z} \\right\\rangle$."
        },
        {
            title: "C. Kurveintegral av en skalar funksjon",
            body: "$$\\int_C f(x, y, z)\\,ds = \\int_a^b f(\\mathbf r(t))\\,\\|\\mathbf r'(t)\\|\\,dt,$$ der kurven $C$ er parametrisert ved $\\mathbf r = \\mathbf r(t)$ $(a \\le t \\le b)$."
        },
        {
            title: "D. Arbeid i et vektorfelt",
            body: "Arbeid i $\\mathbf F = \\langle P, Q, R \\rangle$ langs en kurve $C$ orientert vha. enhetstangentvektoren $\\mathbf T$: $$\\int_C (\\mathbf F \\cdot \\mathbf T)\\,ds = \\int_C \\mathbf F \\cdot d\\mathbf r = \\int_C P\\,dx + Q\\,dy + R\\,dz.$$"
        },
        {
            title: "E. Komponenttesten for konservative 2D-vektorfelter",
            body: "$$\\mathbf F = \\langle P, Q \\rangle \\text{ er konservativt} \\iff \\frac{\\partial Q}{\\partial x} = \\frac{\\partial P}{\\partial y}.$$"
        },
        {
            title: "F. Sirkulasjon",
            body: "Sirkulasjon til $\\mathbf F = \\langle P, Q \\rangle$ omkring en lukket kurve $C$ i planet: $$\\oint_C (\\mathbf F \\cdot \\mathbf T)\\,ds = \\oint_C \\mathbf F \\cdot d\\mathbf r = \\oint_C P\\,dx + Q\\,dy,$$ der $\\mathbf T$ er enhetstangentvektoren til $C$."
        },
        {
            title: "G. Fluks",
            body: "Fluks til $\\mathbf F = \\langle P, Q \\rangle$ over en lukket kurve $C$ i planet: $$\\oint_C (\\mathbf F \\cdot \\mathbf N)\\,ds = \\oint_C -Q\\,dx + P\\,dy,$$ der $\\mathbf N$ er enhetsnormalvektoren til $C$."
        },
        {
            title: "H. Greens teorem",
            body: "1) sirkulasjon: $$\\oint_C (\\mathbf F \\cdot \\mathbf T)\\,ds = \\iint_D (Q_x - P_y)\\,dx\\,dy,$$ 2) fluks: $$\\oint_C (\\mathbf F \\cdot \\mathbf N)\\,ds = \\iint_D (P_x + Q_y)\\,dx\\,dy,$$ der $C$ er en lukket, positivt orientert kurve i planet, som omslutter et 2D-område $D$, og $\\mathbf N$ er den utadrettede normalen til $C$."
        }
    ];

    // render_text escapes html, so line breaks are put back afterwards
    const rendered = sections.map((s) => ({
        title: s.title,
        html: render_text(s.body.replaceAll("<br>", "\n")).replaceAll("\n", "<br>")
    }));

    function handle_keydown(event: KeyboardEvent) {
        if (open && event.key === "Escape") open = false;
    }
</script>

<svelte:window onkeydown={handle_keydown} />

{#if open}
    <aside class="sheet" aria-label="Formelsamling">
        <header>
            <h3>Formelsamling</h3>
            <button class="close" onclick={() => (open = false)} aria-label="Lukk formelsamling">&times;</button>
        </header>
        {#each rendered as section (section.title)}
            <section>
                <h4>{section.title}</h4>
                <div class="body">{@html section.html}</div>
            </section>
        {/each}
    </aside>
{/if}

<style>
    .sheet {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(28rem, 100vw);
        box-sizing: border-box;
        overflow-y: auto;
        padding: 1rem 1.25rem 2rem;
        background-color: var(--surface);
        border-left: 1px solid var(--highlight-high);
        box-shadow: -0.5rem 0 1.5rem rgba(0, 0, 0, 0.25);
        z-index: 10;
    }

    header {
        position: sticky;
        top: -1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: -1rem -1.25rem 0;
        padding: 1rem 1.25rem 0.5rem;
        background-color: var(--surface);
    }

    h3 {
        margin: 0;
        color: var(--iris);
    }

    h4 {
        margin: 1.25rem 0 0.25rem;
        color: var(--foam);
        font-size: 0.95rem;
    }

    .body {
        font-size: 0.9rem;
        line-height: 1.7;
        overflow-x: auto;
    }

    .body :global(.katex-display) {
        margin: 0.4rem 0;
    }

    .close {
        font: inherit;
        font-size: 1.5rem;
        line-height: 1;
        color: var(--subtle);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0 0.25rem;
    }

    .close:hover {
        color: var(--love);
    }
</style>
