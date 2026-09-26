# Review checklist — commands and worked examples per rule

Companion to `SKILL.md` Step 4. Each section gives the fastest way to test the rule against a diff
and one real example from this repository's history so you can calibrate severity.

Set these once per review:

```bash
BASE=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
CHANGED=$(git diff --name-only "$BASE"; git ls-files --others --exclude-standard)
```

For a PR without a local checkout, substitute `gh pr diff <n> --name-only`.

## R1 — Cognitive Complexity fidelity

Trigger: `echo "$CHANGED" | grep -q 'src/metricsAnalyzer/languages/.*Analyzer\.ts'`

Look at every changed `return` inside `getComplexityIncrement` / `getNestingPenalty` /
`visitAlternative` / `visitElseBranch` / `analyzeNode` and classify it with
`references/cognitive-complexity-rules.md` §1–2:

- `1 + this.acc.nesting` on something the baseline lists as flat (`else`, `else if`, ternary,
  boolean run, labeled jump) → 🔴.
- Flat `1` on a structural construct (`if`, loop, `switch`, `catch`) → 🔴 unless the analyzer adds
  the penalty elsewhere (Rust does, in `visit()`).
- A new node type in `getComplexityIncrement` that nests per the baseline but is missing from
  `NESTING_TYPES` (C#, Go, JS/TS, Rust keep the two lists independent) → 🔴.
- Removed or changed dedup (`isOutermostInSameOperatorChain`) → 🔴; `a && b && c` must count once.

Worked examples: #681 fixed C# `else`/`else if` from nesting-scaled to flat; #680 did the same for
Go labeled `break`/`continue`; #495 and #489 removed the nesting penalty from Go and C# boolean
operators. Each shipped with an exact-total assertion in `src/unit/unit.test.ts`.

## R2 — Cross-analyzer parity

Trigger: R1 fired and the diff changes an increment, a penalty, a `NESTING_TYPES` entry or a
reason string.

```bash
grep -n "NESTING_TYPES: ReadonlySet" -A 12 src/metricsAnalyzer/languages/*Analyzer.ts
grep -n "case \"<node_type>\"" src/metricsAnalyzer/languages/*Analyzer.ts
```

Then run the probe in `references/cognitive-complexity-rules.md` §5 with the construct in every
language. Severity: the diff makes analyzers disagree where they agreed before → 🟠; the diff
fixes one analyzer and leaves siblings with the old behavior → 🟡 "follow-up: same construct in
X, Y" (cite the probe numbers). The `else` bug was fixed three separate times (#410 Python, #460 Go,
#681 C#) because earlier reviews never asked the parity question — ask it.

## R3 — Tests in the c8-gated suite

Trigger: any change under `src/**` outside `src/test/**` and `src/unit/**` that alters runtime
behavior.

```bash
git diff "$BASE" --stat -- src/unit/unit.test.ts src/test
git diff "$BASE" -- src/unit/unit.test.ts | grep -n "strictEqual(.*complexity" 
git diff "$BASE" | grep -n "c8 ignore"
```

- Behavior change in `src/metricsAnalyzer/**` or `src/lruCache.ts` with no hunk in
  `src/unit/unit.test.ts` → 🟠 (integration tests under `src/test/**` run in the VS Code host and
  are excluded from coverage).
- Behavior change in `src/extension.ts`, `src/configuration.ts` or `src/providers/**` with no hunk
  in `src/test/**` → 🟠. Do **not** ask for a `unit.test.ts` test there: those modules import
  `vscode` and cannot load under plain Node, which is why `.c8rc.json` excludes them.
- `c8 ignore` without an adjacent comment explaining unreachability → 🟠. Accepted form:
  `/* c8 ignore next 3 -- covered by analyzeFile() tests, but V8 source-map coverage misses these switch cases */`.
- Coverage gate (`.c8rc.json`): lines 95, statements 95, branches 88, functions 97. A red
  `test:unit` with `does not meet global threshold` is 🔴 even when every assertion passes.

Worked example: #682 added eviction coverage for `pruneAnalysisCacheForDocument` purely to keep
the branch threshold green — that is the standard.

## R4 — VS Code lifecycle

Trigger: `src/extension.ts`, `src/providers/**`.

```bash
git diff "$BASE" -- src/extension.ts src/providers | grep -nE "register|EventEmitter|onDid|new Map|dispose|subscriptions"
```

- `vscode.languages.register*`, `vscode.commands.registerCommand`, `workspace.onDid*` results not
  pushed to `context.subscriptions` → 🔴 (leak on reload).
- `new vscode.EventEmitter` without a matching `.dispose()` in the provider's `dispose()` → 🔴.
  Worked example: #634.
- New unbounded `Map` cache keyed by document → 🔴; use `LruCache` (`src/lruCache.ts`) and evict on
  `onDidCloseTextDocument` like the CodeLens provider does.
- Cache hits must verify the cached source text, not only the hash (#556).

## R5 — Setting triple sync

Trigger: `codeMetrics\.` appears in the diff, or a default in `src/configuration.ts` changes.

```bash
grep -n "codeMetrics\." package.json README.md src/configuration.ts | grep -v test
```

Every setting must have the same name, type and default in all three places, and
`src/configuration.ts` must validate what `package.json` constrains (`minimum: 1` on thresholds ⇒
positive-number validation, #632/#552). README line format:
``- `codeMetrics.<name>`: <description> (default: `<value>`)``. Missing any one → 🟠.

Know which copy is live: `WorkspaceConfiguration.get(key, fallback)` returns the **contributed
`package.json` default** whenever the user has not set the key; `DEFAULT_CONFIG` in
`src/configuration.ts` is only reached for an unregistered key. A default changed only in
`DEFAULT_CONFIG` has no user-visible effect and makes
`src/test/configuration.test.ts` ("should return default configuration…") fail in CI. Remember
`src/configuration.ts` is outside the c8 gate: the right test ask is the integration suite, and
Step 3 must include `npm test`.

## R6 — Generated files

Trigger:

```bash
echo "$CHANGED" | grep -E '^(CHANGELOG\.md|\.github/\.release-please-manifest\.json|\.github/workflows/.*\.lock\.yml)$'
```

| File | Generated by | Acceptable change |
|------|--------------|-------------------|
| `CHANGELOG.md`, `.github/.release-please-manifest.json`, `package.json` `version` | release-please on merge to `main` | Only inside the `chore(main): release …` PR |
| `.github/workflows/<name>.lock.yml` | `gh aw compile` from `<name>.md` | Only together with its `<name>.md`, or in an explicit "recompile" PR |
| `package-lock.json` | `npm install` | Only with a matching `package.json` change |

Hand edit elsewhere → 🟠 with the fix "revert; change the source instead".

## R7 — Semantic title accuracy

CI (`amannn/action-semantic-pull-request`) validates the *format* only. You validate the *type*.

| Title type | Must be true of the diff | Release effect |
|------------|--------------------------|----------------|
| `fix:` | Runtime behavior under `src/` changes; a regression test is added | patch; listed under 🐛 Bug Fixes |
| `feat:` | New user-visible capability (language, setting, command, CodeLens text); README updated | minor; ✨ New Features |
| `perf:` | No exact-complexity assertion changed; ideally a measurement in the body | patch; 🚀 Performance |
| `refactor:` | No behavior change: existing totals/reasons untouched | patch; 🔄 Refactoring |
| `test:`, `docs:`, `ci:`, `build:`, `style:` | No runtime file under `src/` touched | hidden from changelog |
| `chore:` | No `src/` or test change | listed under 🧹 Chore |
| `!` or `BREAKING CHANGE:` footer | Setting removed/renamed, default changed, minimum VS Code version raised | major |

A behavior change labelled `refactor:`/`perf:`/`chore:` hides a fix from users and picks the wrong
bump → 🟠. A test-only PR labelled `fix:` inflates the changelog → 🟡.

## R8 — Generic correctness, local flavour

```bash
npm run lint 2>&1 | grep -E "warning|error" | sort | uniq -c
git diff "$BASE" -- src | grep -nE "\.children\b|substring\(|==[^=]|!=[^=]"
```

- `eqeqeq`, `curly`, `semi`, `no-throw-literal`, `naming-convention` are **warn** in
  `eslint.config.mjs`; only `no-case-declarations` is an error. Warnings never fail CI — report
  new ones as 🟡 with the rule id.
- `node.children` allocates an array per call; hot traversal uses `node.childCount` / `node.child(i)`
  (#554, #562). New `.children` in a `visit`/`analyzeNode` loop → 🟡.
- `sourceText.substring(...)` to identify a token when `node.type` already carries the literal → 🟡.
- Glob patterns from `codeMetrics.excludePatterns` are user input: any new regex construction must
  escape metacharacters and support `*`, `**`, `?` (#235, #270).
- `line`/`column` in `MetricsDetail` are 0-based; anything that adds `+1` for display must do so
  only at the VS Code boundary in `src/providers/**`.

## Dependabot fast path — exact checks

```bash
gh pr diff <n> --name-only                       # expect only package.json + package-lock.json (npm) or a workflow file (actions)
gh pr diff <n> | grep -nE '^\+.*"(tree-sitter[^"]*|@vscode/vsce-sign|keytar|fsevents)"'
grep -n "allowScripts" -A 14 package.json         # the name@version key must match the new version
gh pr view <n> --json statusCheckRollup --jq '.statusCheckRollup[] | "\(.name): \(.conclusion)"'
```

A `tree-sitter*` (or any native-module) bump without the matching `allowScripts` key → 🟠: npm 12
skips the install script and the grammar fails to load. For GitHub Actions bumps, the SHA pin must
keep or update its trailing `# vX.Y.Z` comment.
