# 02 — correct fix in one analyzer; siblings still carry the old behavior

**PR title:** `fix: score Rust boolean operator runs as flat +1, not nesting-scaled`
**Author:** human
**Body:** "Rust applied the nesting penalty to `&&`/`||` runs. C# (#489) and Go (#495) already fixed this. Adds an exact-complexity test."

## Expected verdict

`APPROVE (advisory)` — Step 3 is green when applied to `main` at 0aaca96: compile and lint
clean, `test:unit` 255 passing (baseline 254 + the new test), coverage gate met. No existing Rust
assertion pinned the old `1 + nesting` value, so no other test needed updating.

## Must contain

| Sev | Rule | Finding |
|-----|------|---------|
| — | R1 | Explicit statement that the change moves Rust **toward** the baseline (boolean runs are flat) and that `else_clause` handling is unchanged. |
| 🟡 | R2 | Parity matrix for "boolean-operator run inside `if`" across all seven analyzers, showing Python still returns `1 + nesting` (`pythonAnalyzer.ts` `boolean_operator` case). Recommended as a **follow-up `fix:`**, not as a blocker on this PR. |
| — | R3 | Satisfied: `src/unit/unit.test.ts` gains an exact total (`4`), the reasons array and the `increment === 1` assertion. The report should say so rather than stay silent. |
| — | R7 | `fix:` is the right type (behavior change + regression test; patch bump; appears under 🐛 Bug Fixes). |

## Must not

- Block the PR because Python (or any sibling) still has the old behavior.
- Ask the author to also fix Python inside this PR as a condition of approval.
- Flag the `binary_expression` exemption as "special-casing" — in Rust the penalty lives in `getNestingPenalty`, so that is the correct place (see `references/cognitive-complexity-rules.md` §4).
- Report more than one Nit; the diff is ~30 lines.
