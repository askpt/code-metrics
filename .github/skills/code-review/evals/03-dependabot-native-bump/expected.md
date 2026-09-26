# 03 — dependabot bump of a native module without the `allowScripts` update

**PR title:** `build(deps): bump tree-sitter-go from 0.21.2 to 0.21.3`
**Author:** `dependabot[bot]`
**Body:** standard dependabot release-notes body. `statusCheckRollup`: assume all green.

## Expected verdict

`REQUEST CHANGES`

## Must contain

| Sev | Rule | Finding |
|-----|------|---------|
| 🟠 | Step 2 (dependabot row) | `package.json` `allowScripts` still lists `"tree-sitter-go@0.21.2": true`; the new version has `"hasInstallScript": true` in the lockfile, so under npm 12 the native build is skipped and the Go grammar fails to load. Fix: replace the key with `"tree-sitter-go@0.21.3": true` (e.g. `npm approve-scripts tree-sitter-go`). |
| — | Step 2 | Confirmation that `package.json` and `package-lock.json` agree on `0.21.3` and that CI is green. |

## Must not

- Run or report Steps 3–5 (no compile/lint/test rows are required; if present they must be truthful).
- Produce code-quality findings, nits, or a parity matrix.
- Comment on the `integrity` hash or ask the bot to "add tests".
- Suggest editing `CHANGELOG.md`.
