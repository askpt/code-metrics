# Cognitive Complexity scoring rules for reviewers

Use this when a diff touches `src/metricsAnalyzer/languages/*Analyzer.ts`. It gives you three
things: the SonarSource baseline, the conventions this repo deliberately applies on top of it, and
the divergences that already exist between analyzers — so you can tell a regression from a
convention and new drift from old drift.

## 1. SonarSource baseline (whitepaper appendix B)

| Construct | Structural increment | Nesting increment (scaled by depth) | Increases nesting level |
|-----------|----------------------|-------------------------------------|-------------------------|
| `if`, ternary | +1 | yes | yes |
| `else if`, `else` | +1 | **no** (hybrid: flat +1) | yes |
| `switch` / `match` (the statement, not each case) | +1 | yes | yes |
| `for`, `foreach`, `while`, `do while` | +1 | yes | yes |
| `catch` / `except` | +1 | yes | yes |
| `try`, `finally` | none | — | no |
| `goto LABEL`, `break LABEL`, `continue LABEL` | +1 | **no** (flat) | no |
| unlabeled `break` / `continue` | none | — | no |
| run of like binary boolean operators (`a && b && c` counts once; `a && b || c` counts twice) | +1 per run | **no** (flat) | no |
| nested function / lambda / closure | none | — | **yes** |
| recursion | +1 per method in the cycle | no | no |

"Structural" means `1 + current nesting`. "Flat" means exactly `+1` regardless of depth.

## 2. Conventions this repo applies (verified by probe on 2026-09-26)

These deviate from or extend the baseline on purpose. Do not file them as findings; do file a
finding when a diff moves one analyzer away from the convention the others share.

| Convention | Analyzers |
|------------|-----------|
| A nested lambda / closure / function literal gets its own `1 + nesting` increment when it appears inside another construct, in addition to bumping nesting for its body | C#, Go, Java, JS/TS, Rust |
| A lambda at nesting 0 gets no increment (only bumps nesting for its body) | C#, Go, Rust |
| A lambda / arrow function at nesting 0 still gets `+1` | Java, JS/TS |
| Python nested `def` is reported as its own function; the enclosing function is not penalized | Python |
| Go `recover()` call is the `catch` analogue: flat `+1`, no nesting increment | Go |
| C# `try_statement` scores `1 + nesting` (baseline says none) and bumps nesting, so its `catch` sits one level deeper | C# |
| Unlabeled `break` / `continue` inside a nested construct: C# flat `+1`, Go `1 + nesting` | C#, Go (Java, JS/TS, Python, Rust score 0, matching the baseline) |
| `??` is treated as a boolean operator run | JS/TS |
| C# scans `ERROR` and malformed-declaration nodes with regexes to recover complexity hidden by preprocessor directives | C# |
| Nobody scores recursion | all |

## 3. Known divergences between analyzers (as of 2026-09-26 — re-probe before citing)

Report these as 🟡 informational follow-ups when a diff touches the construct, never as a blocker
for a PR that fixes one analyzer. Fixing them is `fix:` work with an exact-complexity test.

| Construct | Baseline | Current per-analyzer increment at nesting 1 |
|-----------|----------|---------------------------------------------|
| Boolean-operator run inside `if` | flat +1 | C# 1, Go 1, Java 1, JS/TS 1, **Python 2**, **Rust 2** — Python's `boolean_operator` returns `1 + nesting`; Rust's `visit()` applies `getNestingPenalty` to every non-`else_clause` node |
| Labeled `break` inside two loops | flat +1 | Go 1, Java 1, JS/TS 1, **Rust 3** (same `getNestingPenalty` cause) |
| `catch` inside `if` | 1 + nesting = 2 | C# 3 (after `try` took +2), Java 2, Python 2, **JS/TS 1** (`catch_clause` returns flat 1 in `jsLikeAnalyzer.ts`) |

Consistent everywhere (do not re-litigate): `else`/`else if` flat +1 with no extra nesting bump for
the else-if body; ternary / conditional expression flat +1; `if`/loops/`switch`/`match` `1 + nesting`;
same-operator chains counted once via `isOutermostInSameOperatorChain`.

## 4. Where scoring lives in each analyzer

| Analyzer | Structural increment source | Flat / special cases | Else handling |
|----------|-----------------------------|----------------------|---------------|
| `csharpAnalyzer.ts` | `switch` in `getComplexityIncrement` (`NESTING_TYPES` is separate — keep both in sync) | `conditional_expression`, `goto_statement` flat; `break`/`continue` flat when nested; `ERROR`/`field_declaration` heuristics | `visitElseBranch` |
| `goAnalyzer.ts` | `switch` in `getComplexityIncrement` (+ `NESTING_TYPES`) | `goto_statement`, labeled jumps, `recover()` flat | `visitAlternative` — `if_statement.alternative` field, no `else_clause` node |
| `javaAnalyzer.ts` | `NESTING_TYPES` membership ⇒ `1 + nesting` (single source of truth) | `ternary_expression`, labeled jumps flat | `else` token located in `visit` |
| `jsLikeAnalyzer.ts` (JS, TS, JSX, TSX) | `switch` in `getComplexityIncrement` (+ `NESTING_TYPES`) | `else_clause`, `catch_clause`, `ternary_expression`, labeled jumps flat; nested functions scored in `analyzeNode` via `NESTED_FUNCTION_TYPES` | `else_clause` + skip of inner `if_statement` self-increment |
| `pythonAnalyzer.ts` | `NESTING_TYPES` membership ⇒ `1 + nesting` (includes comprehensions) | `elif_clause`, `else_clause`, `conditional_expression` flat; `boolean_operator` currently `1 + nesting` | `elif_clause` / `else_clause` nodes |
| `rustAnalyzer.ts` | `getComplexityIncrement` returns the **base** (1); `visit()` adds `getNestingPenalty(node)` | penalty exempt only for `else_clause`; closures `1` when nested (+ penalty) | `else_clause` + `shouldSkipChildStructuralIncrement` |

Review heuristics that follow from this table:

- In Java and Python, adding a node type to `NESTING_TYPES` **also** makes it a structural
  increment. In C#, Go, JS/TS and Rust the two lists are independent — check that a new construct
  was added to both when the baseline says it nests.
- In Rust, making anything flat means exempting it in `getNestingPenalty`, not returning 0 from
  `getComplexityIncrement`.
- Reason strings are part of the contract: unit tests assert on them (`"else if clause"`,
  `"labeled break statement"`, `"binary && operator"`). A renamed reason is a behavior change.

## 5. Probe template (run after `npm run compile`)

Write the snippet to `$TMPDIR/probe.js` and run `node $TMPDIR/probe.js` from the repo root. Keep
one construct per function so the details line up across languages.

```js
const R = (p) => require(process.cwd() + "/out/metricsAnalyzer/languages/" + p);
const analyzers = {
  "C#": new (R("csharpAnalyzer").CSharpMetricsAnalyzer)(),
  Go: new (R("goAnalyzer").GoMetricsAnalyzer)(),
  Java: new (R("javaAnalyzer").JavaMetricsAnalyzer)(),
  JS: new (R("javascriptAnalyzer").JavaScriptMetricsAnalyzer)(),
  TS: new (R("typescriptAnalyzer").TypeScriptMetricsAnalyzer)(),
  Py: new (R("pythonAnalyzer").PythonMetricsAnalyzer)(),
  Rust: new (R("rustAnalyzer").RustMetricsAnalyzer)(),
};
const sources = {
  "C#": `class T { void A(bool a, bool b) { if (a) { if (a && b) { } } } }`,
  Go: `package main\nfunc A(a, b bool) { if a { if a && b { } } }`,
  Java: `class T { void a(boolean a, boolean b) { if (a) { if (a && b) { } } } }`,
  JS: `function A(a, b) { if (a) { if (a && b) { } } }`,
  TS: `function A(a: boolean, b: boolean) { if (a) { if (a && b) { } } }`,
  Py: `def A(a, b):\n    if a:\n        if a and b:\n            pass`,
  Rust: `fn a(a: bool, b: bool) { if a { if a && b { } } }`,
};
for (const [lang, analyzer] of Object.entries(analyzers)) {
  for (const f of analyzer.analyzeFunctions(sources[lang])) {
    const details = f.details.map((d) => `+${d.increment} ${d.reason}@n${d.nesting}`).join(", ");
    console.log(`${lang.padEnd(4)} ${f.name} = ${f.complexity}  [${details}]`);
  }
}
```

Every analyzer class exposes `analyzeFunctions(source)`; the static `analyzeFile(source)` used by
the unit tests wraps the same singleton. Delete the probe file afterwards.

## 6. What an acceptable analyzer test looks like

An analyzer behavior change is covered only if `src/unit/unit.test.ts` (the c8-instrumented
suite) gains an assertion that pins **both** the total and the reasons:

```ts
const results = GoMetricsAnalyzer.analyzeFile(sourceCode);
assert.strictEqual(results.length, 1);
assert.strictEqual(results[0].complexity, 4, "for(1) + for(2) + labeled break(1)");
assert.deepStrictEqual(
  results[0].details.map((d) => d.reason),
  ["for loop", "for loop", "labeled break statement"]
);
const labeled = results[0].details.find((d) => d.reason === "labeled break statement")!;
assert.strictEqual(labeled.increment, 1, "labeled break is flat +1");
```

Red flags: a test that only checks `complexity > 0`; a test added under `src/test/**` only; a
change to an existing expected total without a spec citation in the PR body; a new
`/* c8 ignore */` around a branch that a two-line snippet could reach.
