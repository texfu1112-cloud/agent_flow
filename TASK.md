# Active Task

Status: completed
Task ID: 2026-09-25-global-workflow-install
Updated: 2026-09-25
Phase: close

## Objective

Install the stateful multi-agent workflow into the global OpenCode config so Builder, the three custom commands, and compaction checkpointing are available from any project folder, without changing the user's default agent.

## Acceptance Criteria

- `~/.config/opencode/` contains the five agent definitions, three commands, and the compaction plugin.
- Global config declares the plugin and preserves the existing `$schema`; it does not set `default_agent`.
- A fresh OpenCode process started outside `/Users/xiafu/source/agent_flow` resolves Builder, Explore, Architect, Planner, Reviewer, `/work`, `/checkpoint`, `/continue-task`, and the global plugin.
- The compaction plugin injects the current project's `TASK.md` and skips cleanly when it is absent; dual loading (global plus project) does not duplicate the injected checkpoint.
- The agent_flow project behavior and published site remain unchanged.
- Repository docs, durable state, and the GitHub remote record the global installation.

## Constraints

- Preserve the user's existing global config and unrelated global files.
- Do not change the global default agent or global model defaults.
- Keep the project repository as the single source of truth; the global copy deploys the same definitions.
- Config-time changes require an OpenCode restart.

## Context References

- Evidence capsule: `.opencode/state/CONTEXT.md`
- Architecture sections: `Components And Boundaries`, `External Systems`, `Invariants`
- Decision entries: ADR-001 (Pages deployment); ADR-002 (global opt-in installation)

## Architecture Gate

Status: accepted by Builder (bounded operational decision recorded as ADR-002)
Decision: deploy the same location-independent agents/commands/plugin into `~/.config/opencode/` as an explicit-opt-in global workflow; never set a global `default_agent`; keep dual-loaded compaction injection idempotent

## Implementation Plan

- [x] Make `stateful-compaction.js` skip injection when a checkpoint block is already present, and verify single/double injection plus missing-`TASK.md` behavior.
- [x] Copy the five agents, three commands, and the plugin into `~/.config/opencode/` and declare the plugin in the global config without touching other fields.
- [x] Verify from a neutral folder that a fresh OpenCode process resolves all roles, commands, and the global plugin.
- [x] Document the global installation in `README.md`, `ARCHITECTURE.md`, and `DECISIONS.md` (ADR-002).
- [x] Update `TASK.md` and `.opencode/state/CONTEXT.md`, commit, and push; confirm the site stays green.

## Progress

- Completed: plugin idempotence, global deployment, neutral-folder verification, documentation, review, regression checks, and publication
- In progress: none
- Pending: none

## Changed Paths

- `.opencode/plugins/stateful-compaction.js` (idempotent checkpoint injection)
- `README.md`, `ARCHITECTURE.md`, `DECISIONS.md`
- `TASK.md`, `.opencode/state/CONTEXT.md`
- `~/.config/opencode/agents/`, `~/.config/opencode/commands/`, `~/.config/opencode/plugins/`, `~/.config/opencode/opencode.jsonc` (outside the repository)

## Verification

| Check | Result | Notes |
|---|---|---|
| Plugin unit behavior | pass | Single injection, duplicate prevention, missing `TASK.md` no-op, and defensive empty output all pass; syntax check passes |
| Global copies match sources | pass | SHA-256 of plugin equal; `cmp` equal for all five agents and three commands |
| Neutral-folder resolved config | pass | Builder/Explore on Flash, Architect/Planner/Reviewer on `openai/gpt-5.6-sol`, all three commands route to Builder, global plugin declared, `default_agent` unchanged |
| Neutral-folder agent list and route | pass | Five roles listed; `architect` resolves to `openai/gpt-5.6-sol` |
| Project-scope coexistence | pass | Project directory loads two plugin instances (global + project); idempotence guard prevents duplicate checkpoints |
| Project regression | pass | Site validator self-test, `docs/app.js` syntax, plugin syntax, and project resolved config all pass |
| Reviewer gate | pass | Focused review returned PASS with no findings, acceptance gaps, test gaps, or architecture drift |

## Review

Status: pass
Findings: none; scoped review found no actionable issue in the global installation or idempotence change

## Blockers

- None.

## Next Action

Restart OpenCode, then use `/work <request>` or `@builder` from any project folder; re-copy global files after future workflow changes.
