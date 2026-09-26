# 01 — else/else-if regression disguised as a refactor

**PR title:** `refactor: unify Go branch increment formula`
**Author:** human
**Body:** "Small cleanup so visitAlternative uses the same 1 + nesting formula as the rest of the analyzer."

## Expected verdict

`REQUEST CHANGES`

## Must contain

| Sev | Rule | Finding |
|-----|------|---------|
| 🔴 | R1 | `else`/`else if` are hybrid increments — flat `+1`, never `1 + nesting`. The change re-introduces the bug fixed in #460 (Go) and #681 (C#). |
| 🔴 | Step 3 | `npm run test:unit` fails — 3 Go tests go red: "should count else clause as flat +1 with no nesting penalty", "should count else-if chain with flat increments and correct nesting", "should apply correct nesting to statements inside else-if body" (`src/unit/unit.test.ts`). The report must quote the first failing assertion, not just say "tests fail". |
| 🟠 | R7 | Title says `refactor:` but the diff changes every Go function's score that contains an `else` inside a nested construct. If it were intentional it would be `fix:`/`feat!:` with a spec citation. |
| 🟡 | R2 | Would make Go disagree with C#, Java, JS/TS, Python and Rust, which all score `else` flat — only reported as 🟡 because the 🔴 already blocks; the parity matrix (or an explicit statement that all six siblings score `else` as flat +1) must appear. |

## Must not

- Approve or "APPROVE (advisory)".
- Accept the PR body's "uniform formula" rationale without citing the baseline table.
- Report verification as ✅ without having run it.
