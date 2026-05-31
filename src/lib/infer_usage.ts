
/**
 * infer usage of actions instead of forcing the user to choose when it's obvious 
 */ 
export function inferAction(latex: string) {
  const s = latex.trim();

  // 1. Has an equation (=) with a variable on one side → solve
  if (/=/.test(s) && /[a-zA-Z]/.test(s)) {
    return "solve";
  }

  // 2. Has multiplication across parentheses or power expressions → expand
  if (/\\left|\\right|\)\s*\(|\^{?\d/.test(s) || /[a-z]\(|}\(/.test(s)) {
    return "expand";
  }

  // 3. Has fractions, sqrt, or nested ops → simplify
  if (/\\frac|\\sqrt|\\sum|\\int/.test(s)) {
    return "simplify";
  }

  // 4. Pure numbers / constants only → evaluate
  if (/^[\d\s\+\-\*\/\^\.\(\)\\pi\\e]+$/.test(s)) {
    return "evaluate";
  }

  // 5. Has variables but no operator ambiguity → simplify
  if (/[a-zA-Z]/.test(s)) {
    return "simplify";
  }

  return "evaluate"; // fallback
}