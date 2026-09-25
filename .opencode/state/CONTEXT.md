# Context Capsule

Task ID: 2026-09-25-tutorial-site-github
Generated: 2026-09-25
Scope: completed tutorial site and GitHub/Pages publication

## Investigation Question

Is the dependency-free tutorial site implemented, verified, and published from `main:/docs`, with the corrected Sol model routes and no generated artifacts in Git?

## Relevant Evidence

- `docs/` contains hand-authored `index.html`, `styles.css`, `app.js`, and `.nojekyll`. Core navigation and all five role panels work without JavaScript; enhancements cover themes, mobile navigation, role tabs, checklist state, command copying, scroll progress, and reveal effects.
- `scripts/validate-site.mjs` uses Node built-ins only; `--self-test` proves recursive discovery and rejection of a nested credential probe, and it also validates selector-level contrast, IDs, fragments, local assets, relative URLs, progressive baseline, and the four-file publication allowlist.
- Verification passed: static validator self-test, JS syntax, local HTTP assets, Playwright role/theme/checklist/copy/mobile-focus/no-JS/320-390px reflow smoke, desktop/mobile screenshots, and OpenCode config/agent/plugin smoke checks.
- Root cause of the earlier child-agent failures: `opencode/gpt-5.6-sol` does not exist; the active model is `openai/gpt-5.6-sol` with variant `max`. Architect, Planner, and Reviewer definitions and documentation were corrected, and delegation smoke tests passed after restart.
- Initial commit `c41b071` on `main` contains exactly 22 authored files; generated `.opencode` dependencies, manifests, lock files, and the generated `.opencode/.gitignore` remain ignored, and the staged credential-pattern scan is clean.
- `origin` is `git@github.com:texfu1112-cloud/agent_flow.git`; the repository is public with default branch `main`.
- GitHub Pages uses branch source `main:/docs` (no workflow). Latest build status is `built`, and the live HTML, `styles.css`, and `app.js` were fetched with expected current content.

## Current Flow

- Public entry points: repository `https://github.com/texfu1112-cloud/agent_flow` and site `https://texfu1112-cloud.github.io/agent_flow/`. Local maintenance uses `node scripts/validate-site.mjs` plus the OpenCode debug commands.

## Constraints And Conventions

- OpenCode loads project config only at startup; restart the client after config-time changes.
- Site assets must stay document-relative and inside `docs/`; core content must not depend on JavaScript.
- Never commit generated dependencies, credentials, or raw runtime output.
- Shell validation requires `/Users/xiafu/.local/node/bin` on `PATH` for Node/npm tooling.

## Likely Change Surface

- Future site changes: `docs/` plus `scripts/validate-site.mjs`, then Pages re-verification.
- Future orchestration changes: `opencode.json`, `.opencode/`, durable state files, and the OpenCode smoke checks.

## Verification Commands

- `node scripts/validate-site.mjs --self-test`
- `node --check docs/app.js`
- `opencode debug config`, `opencode agent list`, `opencode debug agent <name>`
- `node --check .opencode/plugins/stateful-compaction.js`
- `git status --short --branch`, `gh api repos/texfu1112-cloud/agent_flow/pages`

## Unknowns

- The initial commit author identity resolved from local Git auto-configuration (`夏甫 <xiafu@xiafudeMacBook-Pro.local>`), so GitHub may not link that commit to the account. No functional impact; the user can set an explicit identity for future commits.

## Capsule Rule

Builder replaces this file with current task evidence. Keep paths, observed behavior, and unresolved facts; exclude raw output, plans, and conversation history. Maximum target size: 2,500 tokens.
