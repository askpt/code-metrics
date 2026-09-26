# Eval fixtures for the `code-review` skill

Each case is a stimulus (`input.diff` plus the PR metadata in `expected.md`) and the findings a
correct review must contain. They exist so a reviewer — human, agent or a future eval harness — can
check that the skill catches what a generic review misses.

## Running a case by hand

1. Read `<case>/expected.md` for the PR title and author to assume.
2. Ask the agent: *"Using the code-review skill, review this diff as PR `<title>` by `<author>`"*
   and paste `<case>/input.diff` (or `git apply --3way <case>/input.diff` on a scratch branch to
   let Step 3 verification run for real).
3. Compare the report with `expected.md`:
   - **Must contain**: every listed finding (rule id + severity, file may be approximate) and the
     verdict.
   - **Must not contain**: anything listed under "Must not".
   - Verification rows must reflect commands actually run (or `UNVERIFIED`).

## Cases

| Case | Exercises | Expected verdict |
|------|-----------|------------------|
| `01-else-nesting-regression` | R1 scoring regression disguised as a refactor; R7 type mismatch; red unit tests | `REQUEST CHANGES` |
| `02-fix-with-sibling-drift` | Correct `fix:` in one analyzer while siblings keep the old behavior — R2 must be informational, not blocking | `APPROVE (advisory)` |
| `03-dependabot-native-bump` | Dependabot fast path; stale `allowScripts` key for a native module | `REQUEST CHANGES` |
| `04-setting-default-drift` | R5 triple sync; VS Code-only code path ⇒ `npm test` required; breaking-change title | `REQUEST CHANGES` (likely `— UNVERIFIED` in a sandbox) |
| `05-generated-file-hand-edit` | R6 hand-edited `CHANGELOG.md` inside an otherwise fine `test:` PR | `REQUEST CHANGES` |

The diffs were cut against `main` at 0aaca96 (2026-09). Context lines may drift as the code
evolves; the expected findings are stated in terms of rule ids so they stay valid after a rebase.
