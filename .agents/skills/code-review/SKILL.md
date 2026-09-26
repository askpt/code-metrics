---
name: code-review
description: Review a diff or pull request in the code-metrics VS Code extension against this repository's conventions and produce a severity-ranked findings report with a verdict. Checks Cognitive Complexity scoring fidelity (flat vs nesting-scaled increments), parity across the seven tree-sitter analyzers, exact-complexity unit tests under the c8 gate, VS Code disposable hygiene, package.json/configuration.ts/README setting sync, hand edits to generated files, and semantic PR-title accuracy, after actually running compile, lint and unit tests. USE FOR: "review this PR", "review my changes", "review the diff before I open a PR", "is this analyzer change correct", dependabot, release-please or [repo-assist] PRs in this repo. DO NOT USE FOR: implementing or fixing code (finish the change, then review), replying to review comments others left (address-pr-comments), security-only audits (security-review), any repository other than code-metrics (generic code-review).
---

# Code Review (code-metrics)

Review changes to this VS Code extension the way its maintainers do: run the build, lint and
c8-gated unit tests instead of assuming they pass, check every hunk against the repo-specific
rules below (the ones a generic reviewer misses — above all Cognitive Complexity scoring fidelity
and parity across the seven language analyzers), and return one findings report with a verdict.
Report-only by default; post to GitHub only when explicitly asked.

## When to Use

- Reviewing the current branch's changes against `main` before opening a PR
- Reviewing an open PR by number or URL — human, `[repo-assist]`, dependabot or release-please
- Judging whether an analyzer change is spec-correct and consistent with the sibling analyzers

## When Not to Use

- The change is not finished — implement first, then review
- Replying to or resolving review threads left by other reviewers → `address-pr-comments`
- A dedicated vulnerability audit → `security-review`
- Any other repository → the generic `code-review` skill

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| Target | No | PR number or URL. Absent → local branch diff against `origin/main` plus untracked files. |
| Mode | No | `report` (default) or `post`. Use `post` only when the user explicitly asks to submit or post the review. |
| Everything else | — | Discover it with `git`/`gh`: base branch, changed files, PR class, author, CI status. Never ask the user for something a command can answer. |

## Workflow

### Step 1: Resolve the target and classify the PR

```bash
git fetch origin main 2>/dev/null || true
BASE=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
```

- **PR given** → `gh pr view <n> --json number,title,body,author,headRefName,files,statusCheckRollup`
  then `gh pr diff <n>`. If `gh pr checkout <n>` succeeds, run Step 3 on that branch; if it fails
  (no auth or network), review the diff read-only and mark the verdict `UNVERIFIED`.
- **No PR given** → `gh pr view --json number 2>/dev/null` detects one for the current branch;
  otherwise use `git diff "$BASE"` (committed + staged + unstaged) and `git status --porcelain`
  for untracked files, which you review as whole-file additions.
- Classify the change by author and title prefix (Step 2). Record the title for R7.

### Step 2: Fast-path bot PRs

| Class (how to detect) | Check only this | Then |
|-----------------------|-----------------|------|
| dependabot — `author.login` is `dependabot[bot]`, title `build(deps…)` / `ci(deps)` | `package.json` and `package-lock.json` agree on the new version; a `tree-sitter*` bump updates the matching `allowScripts` key `name@version` (npm 12 skips the native build otherwise); a pinned action SHA keeps its `# vX.Y.Z` comment; `statusCheckRollup` is green | Verdict from these checks only. Skip Steps 3–5. |
| release-please — title `chore(main): release x.y.z` | `package.json` version, `.github/.release-please-manifest.json` and the top `CHANGELOG.md` entry agree; **no other file** changed | `COMMENT`; never edit its files |
| `[repo-assist]` prefix | Full review, plus: the linked issue exists and the PR body's claims match the diff | Steps 3–6 |
| human | Full review | Steps 3–6 |

Never write code-quality findings on a version bump; stop after the row's checks.

### Step 3: Run the verification the verdict depends on

Run these in the worktree that contains the change. Never infer a result from reading.

```bash
npm ci --no-audit --no-fund   # only if node_modules is missing or package-lock.json is in the diff
npm run compile && npm run lint
npm run test:unit             # c8 gate: lines 95 / statements 95 / branches 88 / functions 97
```

- Also run `npm test` when the diff touches `src/extension.ts`, `src/configuration.ts` or
  `src/providers/**`: those files are excluded from c8 and only exercised by the VS Code
  integration suite. Classify its outcome before blaming the PR:
  - mocha output with `N failing` → the PR's failure (🔴, quote the first assertion);
  - `Skipping VS Code integration tests` (no network), `EPERM … /tmp/vscode-test-*.zip` (the
    wrapper does not forward `TMPDIR`; retry with `npm run test:vscode`, which inherits it), or
    `sandbox_extension_issue_file_to_process … Operation not permitted` / `Exit code: SIGSEGV`
    before any test runs (sandbox blocks Electron) → environment failure: record
    `skipped (<reason>)` and mark the verdict `UNVERIFIED`. Then read the affected
    `src/test/**` file and *predict* which assertion the diff breaks, labelled as predicted.
- A `test:unit` failure containing `does not meet global threshold` is a **coverage-gate breach**
  (🔴), distinct from a failing assertion. Quote the line.
- If `~/.npm` is not writable (sandbox), retry once with `npm_config_cache="$TMPDIR/npm-cache"`.
  If a command still cannot run, report the exact error and mark `UNVERIFIED`. Never report a
  check you did not run.

### Step 4: Review the diff against the repo rules

Read every hunk. For each rule, look for its trigger, then apply the check.
`references/review-checklist.md` has the grep commands and worked examples for each rule.

| # | Trigger in diff | Check | Sev |
|---|-----------------|-------|-----|
| R1 | `src/metricsAnalyzer/languages/*Analyzer.ts` | Increments follow `references/cognitive-complexity-rules.md`: structural constructs `1 + nesting`; `else`/`else if`, ternary, boolean-operator *runs* and labeled jumps flat `+1`; an else-if body is visited without a second nesting bump; same-operator chains counted once via `isOutermostInSameOperatorChain`; new nesting constructs added to `NESTING_TYPES` | 🔴 |
| R2 | Any change to how one analyzer scores a construct | Probe that construct in all seven analyzers (Step 5). Disagreement **introduced** by the diff → 🟠. Pre-existing disagreement left untouched → 🟡 informational, named as follow-up, never blocking | 🟠/🟡 |
| R3 | Runtime behavior change under `src/**` | For `src/metricsAnalyzer/**` and `src/lruCache.ts`: an exact-complexity assertion (`assert.strictEqual(result.complexity, N)` plus `details` reasons) is added in `src/unit/unit.test.ts` — tests only in `src/test/**` do not count toward the c8 gate. For `src/extension.ts`, `src/configuration.ts`, `src/providers/**` (c8-excluded, need the `vscode` module): the test belongs in `src/test/**` instead. A new `/* c8 ignore */` carries a comment saying why the branch is unreachable | 🟠 |
| R4 | `src/extension.ts`, `src/providers/**` | Every `vscode.*` registration and `EventEmitter` is pushed to `context.subscriptions` or disposed in `dispose()`; caches use `LruCache`, never an unbounded `Map` | 🔴 |
| R5 | A `codeMetrics.*` setting or its default | Identical in `package.json` `contributes.configuration`, `src/configuration.ts` (default and validation) and the README "Extension Settings" list. The `package.json` value is what users get at runtime; `DEFAULT_CONFIG` is only a fallback, so a change made there alone does nothing and breaks `src/test/configuration.test.ts` | 🟠 |
| R6 | `CHANGELOG.md`, `.github/.release-please-manifest.json`, `.github/workflows/*.lock.yml` | Hand edits outside a release-please PR are wrong: the first two come from release-please, `.lock.yml` from `gh aw compile` of its sibling `.md`. A `.lock.yml` change without its `.md` (or the reverse) is drift | 🟠 |
| R7 | PR title | Type matches content: `fix:` changes runtime behavior in `src/` and adds a regression test; `feat:` adds a user-visible capability and updates README; `refactor:`/`perf:` leave exact-complexity assertions unchanged; `test:`/`docs:`/`ci:`/`build:`/`chore:` touch no `src/` runtime file. `feat` bumps minor, `fix`/`perf` patch, `!` major; `docs`/`test`/`ci`/`build`/`style` are hidden from the changelog | 🟠 |
| R8 | Any TypeScript | Generic correctness with the local traps: `line`/`column` are 0-based; `node.children` allocates in hot loops (use `childCount`/`child(i)`); `substring` where `node.type` suffices; eslint `eqeqeq`, `curly`, `semi` are **warn-only** so CI stays green — you are the gate; glob or regex built from user settings must escape metacharacters | 🟡 |

### Step 5: Cross-analyzer parity probe (only when R2 fires)

1. Name the construct (for example "boolean-operator run inside `if`", "labeled break").
2. `grep -n "NESTING_TYPES" -A 12 src/metricsAnalyzer/languages/*Analyzer.ts` and read each
   `getComplexityIncrement`. Rust adds its penalty in `visit()` via `getNestingPenalty`; JS/TS
   score nested functions inside `analyzeNode`, not in `getComplexityIncrement`.
3. After `npm run compile`, run the probe template from `references/cognitive-complexity-rules.md`
   with a minimal snippet of the construct per language.
4. Put the resulting matrix (construct × analyzer → increment) in the report and mark the cells
   the diff changed.

### Step 6: Write the report

Use exactly this shape. Scale to the diff: a ten-line diff gets at most three findings.

```markdown
## Code review: <PR #n — title | branch vs main>

**Verdict:** REQUEST CHANGES | APPROVE (advisory) | COMMENT [— UNVERIFIED: <what could not run>]

**Verification**
| Check | Result |
|---|---|
| npm run compile | ✅ / ❌ <first error line> |
| npm run lint | ✅ / ⚠️ N warnings (<rule ids>) |
| npm run test:unit (c8) | ✅ N passing, L/S/B/F % / ❌ <first failing line> |
| npm test (vscode) | ✅ / not required / skipped (no network | EPERM /tmp | sandbox SIGSEGV) |

**Findings**
| # | Sev | File:line | Rule | Finding | Fix |
|---|---|---|---|---|---|
| 1 | 🔴 | src/metricsAnalyzer/languages/goAnalyzer.ts:377 | R1 | else clause scored 1 + nesting | return flat 1 |

**Parity matrix** — only when R2 fired

**Nits** — max 5, one line each; omit when none

**Title check:** `<type>:` matches | should be `<type>:` because <reason>
```

Severity: 🔴 **Blocker** — scoring regression, red compile/test, coverage-gate breach, resource
leak, security or data loss. 🟠 **Major** — behavior change without an exact-complexity test, new
cross-analyzer drift, config triple out of sync, generated file hand-edited, misleading commit
type. 🟡 **Minor** — correctness risk with no failing case yet, warn-only eslint hits, missing
JSDoc on a new public API. ⚪ **Nit** — optional.

Verdict rule: any 🔴 or 🟠 → `REQUEST CHANGES`; otherwise `APPROVE (advisory)`; release-please
PRs and bot PRs with no finding → `COMMENT`. Append `— UNVERIFIED` whenever a required check in
Step 3 did not run.

### Step 7: Post only when asked

Only if the user asked to post or submit: `gh pr review <n> --request-changes --body-file <file>`
for `REQUEST CHANGES`, otherwise `--comment`. Never `--approve` — approval is a human decision.
Never post `UNVERIFIED` results as `--request-changes` when the failure is the sandbox's, not the
PR's.

## Validation

- [ ] Every ✅/❌ in the Verification table matches a command you ran in this session
- [ ] Every 🔴/🟠 finding cites a file:line from the diff and a rule id
- [ ] If any `*Analyzer.ts` changed, R1 was applied and the report has a parity matrix or says "no scoring change"
- [ ] Verdict follows the severity rule; `UNVERIFIED` is present iff a required check did not run
- [ ] Nothing was posted to GitHub unless the user asked

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Demanding spec purity where the repo has a deliberate convention (nested lambdas `+1 + nesting`, Go `recover()` flat `+1`, C# preprocessor heuristics) | Compare against the convention table in `references/cognitive-complexity-rules.md`; flag divergence, not convention |
| Counting `src/test/**` integration tests as coverage | Only `src/unit/unit.test.ts` runs under c8 |
| Treating eslint warnings as a pass | The ruleset is warn-only and CI stays green; list the rule ids as 🟡 |
| Blaming the PR for `Skipping VS Code integration tests`, `EPERM … /tmp/vscode-test`, or a `SIGSEGV` before mocha starts | Those are the sandbox; mark `UNVERIFIED`, predict from `src/test/**`, do not request changes for it |
| Asking which branch or PR to review | `gh pr view` / `git merge-base` answer it; ask only if both fail |
| Ten findings on a dependabot bump | Step 2 fast path; stop after its checks |
| Suggesting edits to `CHANGELOG.md` or a `.lock.yml` | They are generated; request the source change instead |
| Blocking a fix because sibling analyzers still have the old bug | Pre-existing drift is 🟡 follow-up; only drift the diff introduces is 🟠 |
