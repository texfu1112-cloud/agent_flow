# Active Task

Status: completed
Task ID: 2026-09-25-requirement-discussion-flow
Updated: 2026-09-27
Phase: close

## Objective

Add a requirement-discussion phase that runs in the main conversation, a `/work_with_talk` command for requirements that are still vague, and a requirements-review subagent powered by gpt-5.6 Sol. Precise requirements keep using `/work` directly. After discussion and review, durable state must let the user run `/new` plus `/continue-task` to implement the reviewed requirement.

## Acceptance Criteria

- Builder classifies requirement clarity at intake: precise requests proceed through `/work`; materially ambiguous requests are discussed in the main conversation instead of being guessed at.
- `/work_with_talk` performs a discussion protocol: no implementation, prioritized bounded questions, restatement, options with trade-offs, and decisions recorded in `TASK.md`.
- `requirements-reviewer` reviews the finalized requirement as a read-only, bounded subagent on `openai/gpt-5.6-sol` (`max`) and reports ambiguity, missing acceptance criteria, scope risks, and open questions.
- After discussion and review, `TASK.md` holds the authoritative clarified requirement, the review verdict, and an exact next action; a fresh session's `/continue-task` can execute it without chat history.
- Tutorial site, `README.md`, `ARCHITECTURE.md`, `DECISIONS.md`, and the site validator reflect the new role/command and stay green.
- The global installation (`~/.config/opencode/`) is synced, the repository is committed and pushed, and the published site remains reachable.

## Constraints

- Discussion happens in the main conversation with Builder; do not add another primary agent.
- Requirements review must use `openai/gpt-5.6-sol`; Sol inputs stay bounded and read-only.
- Command name is exactly `work_with_talk`; agent name is `requirements-reviewer`.
- No implementation work may start while the requirement is materially ambiguous.
- Preserve existing workflows, permissions, and model routes; config-time changes require an OpenCode restart.
- Keep generated dependencies and credentials out of Git.

## Context References

- Evidence capsule: `.opencode/state/CONTEXT.md`
- Architecture sections: `Components And Boundaries`, `Runtime And Data Flow`, `Invariants`
- Decision entries: ADR-003 (requirement gate), ADR-002 (global install), ADR-001 (Pages)

## Architecture Gate

Status: accepted by Architect
Decision: ADR-003 — additive pre-execution requirements lifecycle with a revisioned `Clarified Requirement`, a read-only `requirements-reviewer` on `openai/gpt-5.6-sol`, fail-closed `ready/execute` handoff, and `/continue-task` validation before implementation

## Implementation Plan

- [x] Frame the task and run the architecture gate on the lifecycle proposal.
- [x] Run the planning gate for the multi-component change set.
- [x] Add `requirements-reviewer` agent, `work_with_talk` command, and Builder intake updates.
- [x] Update `TASK.md` handoff semantics in `continue-task.md` and `checkpoint.md`.
- [x] Update site content, validator, README, ARCHITECTURE, and DECISIONS (ADR-003).
- [x] Verify: validator self-test, site behavior/reflow, OpenCode config/agents/commands.
- [x] Resolve the first Reviewer findings and pass a delta review.
- [x] Sync the global installation, commit, push, and verify Pages; close state.

## Progress

- Completed: architecture/plan gates, agent and command lifecycle, site/documentation/validator updates, focused verification, both review cycles, global sync, and publication
- In progress: none
- Pending: none

## Changed Paths

- `.opencode/agents/builder.md` (requirement gate, discussion protocol, clarified-requirement block, delegation allowlist)
- `.opencode/agents/requirements-reviewer.md` (new, Sol read-only requirements review)
- `.opencode/commands/work_with_talk.md` (new), `.opencode/commands/work.md`, `.opencode/commands/continue-task.md`, `.opencode/commands/checkpoint.md`
- `docs/index.html`, `docs/styles.css`, `scripts/validate-site.mjs`
- `README.md`, `ARCHITECTURE.md`, `DECISIONS.md` (ADR-003)
- `TASK.md`, `.opencode/state/CONTEXT.md`
- `~/.config/opencode/` (global sync of six agents, four commands, and the plugin)

## Verification

| Check | Result | Notes |
|---|---|---|
| OpenCode agent/command resolution | pass | `requirements-reviewer` resolves as subagent on `openai/gpt-5.6-sol` (`max`, read-only); four commands route to Builder; Builder delegation allowlist includes the new agent |
| Live delegation smoke test | pass | Builder invoked `requirements-reviewer`; it returned `NEEDS_CLARIFICATION` for a task without a Clarified Requirement block, proving the fail-closed path |
| `node scripts/validate-site.mjs --self-test` | pass | 4 published files, 31 IDs, six paired role tabs/panels, four command cards, exact `/work_with_talk` heading, recursive allowlist probe rejected |
| JavaScript syntax checks | pass | `docs/app.js` and `scripts/validate-site.mjs` parse |
| Playwright site behavior | pass | Six role tabs (click/Arrow/Home), four command cards, theme toggle, mobile menu focus/Escape, no-JS six panels, 320/390px reflow |
| Visual inspection | pass | Six-role grid, five-chip route map, 2×2 command cards, and mobile command cards render correctly |
| Reviewer gates | pass | First pass NEEDS_FIX addressed (resume guard for every gated phase, conditional handoff, verdict semantics, `/work` token check, checkpoint refresh); delta review confirmed the behavioral fixes and the state-text follow-up was corrected |
| Global installation sync | pass | Six agents, four commands, and the plugin are byte-identical to the repository; a neutral-folder process resolves everything and `default_agent` remains unchanged |
| Repository publication | pass | Changes committed and pushed to `main`; Pages rebuilt and the live site serves the updated tutorial |

## Review

Status: pass
Findings: none open; LLM prompt transitions are covered by prompt review plus the live reviewer smoke test because deterministic automation of model behavior is not feasible

## Blockers

- None.

## Next Action

Restart OpenCode to load the new agent and command, then try `/work_with_talk <模糊想法>`; the reviewed requirement will be saved for execution via `/new` and `/continue-task`.
