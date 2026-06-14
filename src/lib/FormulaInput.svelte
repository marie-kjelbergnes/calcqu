<script lang="ts">
  import { onMount } from 'svelte';
  import { simplify, evaluate, N, assign, solve, expand, parse, LatexSyntax, type MathJsonNumberObject, type BoxedExpression, type Expression } from "@cortex-js/compute-engine";
  import { inferAction } from "./infer_usage";
  import { render_expression } from "$lib/common";
  
  let action = $state("infer");

  // Initialize state with the Rune
  let mathfieldValue = $state("");
  let solve_for_this = $state("x");
  // @ts-ignore
  let unknowns = $state({} as Record<string, number|string>); // each key is a variable, and its value is its value

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
        // default everything to be itself
        unknowns[unknowns_for_now[unknown]] = unknowns_for_now[unknown];
      }
    }
  }

  function paste_content(content: string) {
    if (mfe) {
      // @ts-ignore
      mfe.setValue(content, { format: "latex" }); 
    }
  }

  function calculate_thing() {
    let possible_solutions = solve("", "x");
    switch (action) {
      case "infer":
        action = inferAction(mathfieldValue);
        if (action == "solve") {
          // check what variables are present, and solve for one of them
          let variables = parse(mathfieldValue).unknowns;
          if (variables.length !== 0) {
            solve_for_this = variables[0]
          }
        }
        calculate_thing();
        // console.log(action)
        action = "infer"; // might remove this line at a later date, idk
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
          output_app = parse(solve_for_this + " = \\text{idk}")
          // console.log(possible_solutions)
        }
        break;
      case "assign":
        // this code sucks, fix it another time
        for (const [varname, value] of Object.entries(unknowns)) {
          assign(varname, Number(value))
        }
        output = evaluate(mathfieldValue);
        output_app = output.N();
        break;
      default:
        console.log(1);
    }
    // for (let i = 0; i < possible_solutions.length)
    output_rendered = render_expression(output.latex);
    let approx = output.N();
    if (approx.latex !== output.latex) {
      output_approx = render_expression("\\approx " + output_app.latex);
    } else {
      output_approx = render_expression("\\approx " + output.latex); // don't show approx if it's the same
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
  <div class="mathinput">
    <math-field 
      bind:this={mfe}
      oninput={handleInput}
      class="mathfield"
      aria-label="Math input"
      tabindex="0"
      role="textbox"
      onkeydown={handle_enter_keydown}
    ></math-field>
  </div>

  <div class="extra-input">
    <select bind:value={action}>
      <option value="infer">Infer action</option>
      <option value="evaluate">Evaluate</option>
      <option value="simplify">Simplify</option>
      <option value="expand">Expand</option>
      <option value="solve">Solve for variable</option>
      <option value="assign">Assign values to variables</option> <!-- this one is very buggy -->
    </select>
    <button onclick={calculate_thing}>Calculate</button>
  </div>
</div>

{#if action == "solve"}
<div class="solvefor">
  <p>What do you wish to solve for? Type your expression first, then select the variable.</p>
  {#each Object.keys(unknowns) as key}
    <input type="radio" value={key} bind:group={solve_for_this}>{key}
  {/each}
</div>
{:else if action == "assign"}
<div class="assign">
  <p>Assign your values here</p>
  {#each Object.entries(unknowns) as [varname, value]}
    <p>{varname}: <input type="text" bind:value={unknowns[varname]}></p>
  {/each}
</div>
{/if}

<!-- <p>LaTeX Output: <strong>{mathfieldValue}</strong></p> -->
<div class="result">
  <strong>{@html output_rendered}</strong>
  <strong>{@html output_approx}</strong>
</div>

<button onclick={() => {paste_content(output.latex)}}>Copy result to input field</button>

<style>
  .mathfield {
    display: block;
    font-size: 1.5rem;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 60vw;
  }
  
  .input {
    display: flex;
    justify-self: center;
    flex-direction: column;
  }

  .extra-input {  
    margin: 1em;
  }

  button {
      background-color: var(--overlay);
      color: var(--text);
      border: 1px solid var(--highlight-high);
      border-radius: 6px;
      padding: 0.4rem 0.9rem;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }

  button:hover {
    background-color: var(--highlight-med);
    border-color: var(--rose);
    color: var(--rose);
  }

  button:active {
      background-color: var(--highlight-high);
      border-color: var(--love);
      color: var(--love);
  }

  button:focus-visible {
      outline: 2px solid var(--love);
      outline-offset: 2px;
  }

  select {
    background-color: var(--overlay);
    color: var(--text);
    border: 1px solid var(--highlight-high);
    border-radius: 6px;
    padding: 0.4rem 0.7rem;
    font-size: 0.95rem;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23908caa' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.7rem center;
    padding-right: 2rem;
    transition: border-color 0.2s ease;
}

select:hover {
    border-color: var(--rose);
}

select:focus {
    outline: 2px solid var(--love);
    outline-offset: 2px;
    border-color: var(--love);
}

select option {
    background-color: var(--overlay);
    color: var(--text);
}

math-field {
    /* Layout */
    width: 100%;
    border-radius: 8px;
    padding: 0.5rem 0.7rem;
    font-size: 1.2rem;

    /* Rosé Pine Moon */
    --hue: 0; /* reset any default tinting */
    background-color: var(--overlay);
    border: 1px solid var(--highlight-high);
    color: var(--text);

    /* MathLive-specific variables */
    --caret-color:                    var(--love);
    --selection-background-color:     var(--highlight-med);
    --selection-color:                var(--text);
    --placeholder-color:              var(--muted);

    --contains-highlight-background-color: var(--highlight-low);

    transition: border-color 0.2s ease;
}

math-field:focus-within {
    border-color: var(--love);
    outline: 2px solid var(--love);
    outline-offset: 2px;
}

math-field:hover {
    border-color: var(--rose);
}

/* Popover (autocomplete suggestions) */
math-field::part(virtual-keyboard-toggle) {
    color: var(--subtle);
}

math-field::part(virtual-keyboard-toggle):hover {
    color: var(--rose);
}

input[type="text"], input[type="number"], input:not([type]) {
    background-color: var(--overlay);
    color: var(--text);
    border: 1px solid var(--highlight-high);
    border-radius: 6px;
    padding: 0.4rem 0.7rem;
    font-size: 0.95rem;
    box-sizing: border-box;
    transition: border-color 0.2s ease;
}

input::placeholder {
    color: var(--muted);
}

input:hover {
    border-color: var(--rose);
}

input:focus {
    outline: 2px solid var(--love);
    outline-offset: 2px;
    border-color: var(--love);
}

input:disabled {
    background-color: var(--surface);
    color: var(--muted);
    border-color: var(--highlight-med);
    cursor: not-allowed;
}
</style>