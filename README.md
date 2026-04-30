# calcqu

I will be using compute engine for now, and developing my own engine (as I've done it before). It will consist of
1. Parser + AST (easy, can reuse compute engine?)
2. Canonical form + basic simplification (Flatten nested sums/products, sort terms, combine like terms, reduce rationals, apply identity rules)
3. Polynomial arithmetic (Represent polynomials in a useful internal form (sparse dictionary or dense coefficient list), multiply/divide them, compute GCDs (Euclidean algorithm over polynomials), factor over the rationals.)
4. Equation solving (Linear equations: Gaussian elimination, trivial. Polynomial equations: factor (Layer 3), then apply quadratic/cubic/quartic formulas to factors. Beyond degree 4 you need numerical root-finding (Durand-Kerner, Aberth - well-documented algorithms). Systems of polynomial equations: Gröbner bases. This is where it gets hard - Buchberger's algorithm is conceptually simple but the implementation has many footguns (term ordering, reduction strategy, performance). Trig/transcendental: pattern matching + substitution heuristics. Genuinely open-ended)

Might add calculus or something later~

Honestly though, this might be a bit of a pain, but it should be a nice summer project. I want it all to be client side, as buying workers from cloudflare sounds expensive. I don't want to dabble in most of sympy, as it is sloooow.

## Make it so that N (newtons) gets converted to kgm/s^2 in calculations, and gets converted back afterwards