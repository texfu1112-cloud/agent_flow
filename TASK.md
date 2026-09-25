# Active Task

Status: in_progress
Task ID: 2026-09-25-tutorial-site-github
Updated: 2026-09-25
Phase: publish

## Objective

Build a polished website that teaches how to use the OpenCode stateful multi-agent project, then commit and publish the project to GitHub.

## Acceptance Criteria

- A responsive, accessible tutorial website explains installation, startup, the five Agent roles, `/work`, `/checkpoint`, `/continue-task`, common workflows, and maintenance checks.
- The website is usable without a local build toolchain and fits the existing repository structure.
- Existing OpenCode configuration and generated-artifact exclusions remain valid.
- Website behavior, links, responsive layout, and the existing OpenCode smoke checks are verified.
- Intended project files are committed and pushed to the user-approved GitHub repository; generated dependencies and credentials are not included.
- If approved, GitHub Pages is configured and its public URL is verified.

## Constraints

- Publish to the user-approved public repository `texfu1112-cloud/agent_flow` and enable GitHub Pages.
- Preserve the OpenCode orchestration behavior unless a tutorial correction requires a documented change.
- Keep `.opencode/node_modules`, generated package files, credentials, and runtime output out of Git.
- Use the authenticated GitHub account `texfu1112-cloud`; do not expose its token.

## Context References

- Evidence capsule: `.opencode/state/CONTEXT.md`
- Architecture sections: `Components And Boundaries`, `External Systems`, and `Invariants` document the `docs/` publication boundary
- Decision entries: ADR-001 (`main:/docs` Pages deployment)

## Architecture Gate

Status: accepted by Architect after Sol routing repair
Decision: ADR-001 — keep a dependency-free, progressively enhanced site in `docs/` and deploy `main:/docs` through GitHub Pages branch-source settings

## Implementation Plan

- [x] Inspect the current Git worktree, remotes, and GitHub authentication.
- [x] Confirm the GitHub destination, visibility, and whether to publish with GitHub Pages.
- [x] Map authoritative tutorial content and accept ADR-001 for `main:/docs` branch-source deployment.
- [x] Diagnose and repair the disabled Sol child-agent route; verify Architect, Planner, and Reviewer in fresh CLI processes.
- [x] Build `docs/index.html`, `docs/styles.css`, `docs/app.js`, and `docs/.nojekyll` with responsive, accessible interactions and relative URLs.
- [x] Add a dependency-free static-site validation script and update `README.md` plus stable architecture boundaries.
- [x] Verify HTML structure, anchors/assets, JavaScript, responsive/accessibility hooks, local HTTP serving, and existing OpenCode configuration/plugin checks.
- [x] Review the bounded changes and resolve findings.
- [ ] Inspect/stage only intended files, create the initial commit, create/push public `texfu1112-cloud/agent_flow`, configure `main:/docs`, and verify Pages.

## Progress

- Completed: preflight, design, implementation, documentation, verification, two Reviewer fix cycles, and final PASS
- In progress: explicit staging and initial Git/GitHub publication
- Pending: Pages activation/live verification and final state push

## Changed Paths

- `TASK.md`
- `.opencode/state/CONTEXT.md`
- `DECISIONS.md`
- `ARCHITECTURE.md`
- `docs/index.html`
- `docs/styles.css`
- `docs/app.js`
- `docs/.nojekyll`
- `scripts/validate-site.mjs`
- `.opencode/agents/architect.md`
- `.opencode/agents/planner.md`
- `.opencode/agents/reviewer.md`
- `README.md`

## Verification

| Check | Result | Notes |
|---|---|---|
| `git status --short --branch` | pass | Repository has no commits and no configured remote |
| `gh auth status` | pass | Authenticated to GitHub as `texfu1112-cloud` with repository scope |
| Provider/model catalog inspection | pass | `opencode/gpt-5.6-sol` does not exist; `openai/gpt-5.6-sol` is active and supports variant `max` |
| Resolved Sol route assertions | pass | Architect, Planner, and Reviewer now resolve to `openai/gpt-5.6-sol` (`max`) |
| Fresh-process child-agent smoke tests | pass | Architect returned ACCEPT, Planner READY, and Reviewer PASS through Builder delegation |
| `node scripts/validate-site.mjs --self-test` | pass | Recursive four-file allowlist discovers/rejects a real nested temporary credential probe; actual terminal selectors, contrast ratios, IDs, assets, progressive baseline, and subpath boundaries validated |
| JavaScript syntax checks | pass | `docs/app.js` and `scripts/validate-site.mjs` parse successfully |
| Local HTTP smoke | pass | `/`, `/styles.css`, and `/app.js` return successfully from `docs/` |
| Playwright behavior/reflow smoke | pass | Role tabs/keyboard, theme, checklist, copy fallback, mobile focus entry/trap/restore/Escape, no-JS content, and 320/390px overflow checks passed |
| Desktop/mobile visual inspection | pass | Hero, quick start, and role layouts render coherently in light/dark responsive screenshots |
| OpenCode resolved configuration | pass | Five roles, repaired Sol routes, three commands, and plugin resolve correctly; agent list and plugin syntax pass |
| Generated-artifact ignore check | pass | OpenCode dependencies, manifests, lock file, and generated ignore file remain ignored |
| GitHub destination preflight | pass | `texfu1112-cloud/agent_flow` is available for creation |

## Review

Status: pass
Findings: none; final delta review confirmed both remaining findings resolved with no regression, acceptance gap, test gap, or architecture drift

## Blockers

- None.

## Next Action

Inspect Git status/diff/history, stage the explicit authored-file allowlist, verify the staged tree, and create the initial commit.
