<script lang="ts">
  import katex, { render } from "katex";
  import { onMount } from 'svelte';
  import { simplify, evaluate, N, assign, solve, expand, parse, LatexSyntax, type MathJsonNumberObject, type BoxedExpression, type Expression } from "@cortex-js/compute-engine";
  import { inferAction } from "./infer_usage";
    
  let action = $state("infer");

  // Initialize state with the Rune
  let mathfieldValue = $state("");
  let solve_for_this = $state("x");
  // @ts-ignore
  let unknowns = $state({} as Record<string, number>); // each key is a variable, and its value is its value

  let output = $state(evaluate("1"))
  let output_app = $state(evaluate("1"))
  let output_rendered = $state("");
  let output_approx = $state("");
  let mfe = $state(); // Reference to the DOM element

  onMount(async () => {
    await import('mathlive');
    
    // Sync initial state if necessary
    if (mfe) {
      // @ts-ignore
      mfe.value = mathfieldValue;
    }
  });

  function handleInput(event: { target: { value: string; }; }) {
    // Update the state rune when the user types
    mathfieldValue = event.target.value;

    let unknowns_for_now = parse(mathfieldValue).unknowns;
    if (Array.isArray(unknowns_for_now)) {
      for (const unknown in unknowns_for_now) {
        unknowns[unknowns_for_now[unknown]] = 1;
      }
    }
  }

  function paste_content(content: string) {
    if (mfe) {
      // @ts-ignore
      mfe.setValue(content, { format: "latex" }); 
    }
  }

  function render_output(latex: string) {
    // need to change \imaginaryI to i
    latex = latex.replaceAll("\\imaginaryI", "i");
    // might need to make a list of replacements or something later. KaTeX can be a bit weird sometimes.
    return katex.renderToString(
      latex,
      {
        throwOnError: false,
        displayMode: true
      }
    );
  }

  function calculate_thing() {
    let possible_solutions = solve("", "x");
    switch (action) {
      case "infer":
        action = inferAction(mathfieldValue);
        calculate_thing();
        console.log(action)
        action = "infer";
        break;
      case "evaluate":
        output = evaluate(mathfieldValue);
        output_app = output.N()
        break;
      case "simplify":
        output = simplify(mathfieldValue);
        output_app = output.N();
        break;
      case "expand":
        output = expand(mathfieldValue);
        output_app = output.N();
        break;
      case "solve":
        possible_solutions = solve(mathfieldValue, solve_for_this);
        if (possible_solutions != null && Array.isArray(possible_solutions) && possible_solutions.length != 0) {
          const solutionsString = possible_solutions.map(sol => sol.latex) .join(", ");
          // @ts-ignore
          let approxString = possible_solutions.map(sol => sol.N().latex).join(", ");

          let workaround_latex = `${solve_for_this} = ${solutionsString}`;
          let workaround_approx = `${solve_for_this} = ${approxString}`;
          console.log(approxString);
          output = parse(workaround_latex);
          output_app = parse(workaround_approx);
        } else {
          output = parse(solve_for_this + " = \\text{idk}");
          console.log(possible_solutions)
        }
        break;
      case "assign":
        for (const [varname, value] of Object.entries(unknowns)) {
          assign(varname, value)
          output = evaluate(mathfieldValue);
        }
        break;
      default:
        console.log(1);
    }
    // for (let i = 0; i < possible_solutions.length)
    output_rendered = render_output(output.latex);
    let approx = output.N();
    if (approx.latex !== output.latex) {
      output_approx = render_output("\\approx " + output_app.latex);
    } else {
      output_approx = render_output("\\approx " + output.latex); // don't show approx if it's the same
      console.log(approx)
    }
  }

  function handle_enter_keydown(event: { key: string; }) {
    if (event.key === 'Enter') {
      calculate_thing();
    }
  }
</script>

<div class="input">
  <math-field 
    bind:this={mfe}
    oninput={handleInput}
    class="my-mathfield"
    aria-label="Math input"
    tabindex="0"
    role="textbox"
    onkeydown={handle_enter_keydown}
  ></math-field>
</div>

<select bind:value={action}>
  <option value="infer">Infer action</option>
  <option value="evaluate">Evaluate</option>
  <option value="simplify">Simplify</option>
  <option value="expand">Expand</option>
  <option value="solve">Solve for variable</option>
  <option value="assign">Assign values to variables</option>
</select>

{#if action == "solve"}
Solve for what? <input type="text" bind:value={solve_for_this}>
this one is kind of stupid, don't expect much
{:else if action == "assign"}
asign it then:
  {#each Object.entries(unknowns) as [varname, value]}
    <p>{varname}: <input type="text" bind:value={unknowns[varname]}></p>
  {/each}
{/if}

<!-- <p>LaTeX Output: <strong>{mathfieldValue}</strong></p> -->
<div class="result">
  <strong>{@html output_rendered}</strong>
</div>
<p>Result: <strong>{@html output_approx}</strong></p>

<button onclick={calculate_thing}>Calculate</button>
<button onclick={() => {paste_content(output.latex)}}>Copy result to input field</button>

<style>
  .my-mathfield {
    display: block;
    font-size: 1.5rem;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 600px;
  }
  
  .input {
    display: flex;
    justify-content: center;
  }
</style>