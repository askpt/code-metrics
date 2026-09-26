# 04 — setting default changed in one of its three homes

**PR title:** `feat: lower the default warning threshold to 8`
**Author:** human
**Body:** "Users asked for earlier warnings. Lowers the default warning threshold from 10 to 8."

## Expected verdict

`REQUEST CHANGES` — in a sandbox that cannot run VS Code (no network, `EPERM` on `/tmp`, or Electron blocked with `SIGSEGV`), `— UNVERIFIED: npm test (vscode) skipped (<reason>)` must be appended, because `src/configuration.ts` is excluded from c8 and only the integration suite exercises it.

## Must contain

| Sev | Rule | Finding |
|-----|------|---------|
| 🟠 | R5 | `package.json` `contributes.configuration.codeMetrics.warningThreshold.default` is still `10` and README "Extension Settings" still says `(default: 10)`. All three must agree. |
| 🟠 | R5 / R8 | The change has **no runtime effect**: `WorkspaceConfiguration.get(key, fallback)` returns the contributed `package.json` default (10) whenever the user has not set the value, so `DEFAULT_CONFIG` is only a fallback for an unregistered key. The user-visible default lives in `package.json`. |
| 🔴 or 🟠 | Step 3 | `src/test/configuration.test.ts` "should return default configuration when no custom values are set" asserts `config.warningThreshold === DEFAULT_CONFIG.warningThreshold`; with `package.json` at 10 and `DEFAULT_CONFIG` at 8 it fails in CI. 🔴 if the reviewer ran `npm test` and saw it fail; 🟠 (predicted, with the file:line) if the suite could not run. |
| — | R7 | `feat:` is defensible for a user-visible default change, but the report must note that it changes behavior for every existing user without action on their part and recommend either `feat!:` with a `BREAKING CHANGE:` footer or an explicit note in the PR body and README. |

## Must not

- Report `npm test (vscode)` as ✅ without it having run.
- Mark the verdict `APPROVE (advisory)`.
- Require an `src/unit/unit.test.ts` change (R3): `configuration.ts` is outside the c8 gate and tested by the integration suite — pointing at `src/test/configuration.test.ts` is the correct ask.
