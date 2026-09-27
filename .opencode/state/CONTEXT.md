# Context Capsule

Task ID: 2026-09-25-requirement-discussion-flow
Generated: 2026-09-27
Scope: requirement discussion, review, and cross-session handoff

## Investigation Question

How does the workflow gate materially ambiguous requirements through discussion and review before implementation, while keeping precise requests direct?

## Relevant Evidence

- ADR-003 defines the lifecycle: Builder classifies intake; precise `/work` continues directly; materially ambiguous requests and `/work_with_talk` run a main-conversation discussion with no implementation; Builder records one user-confirmed revisioned `Clarified Requirement` in `TASK.md`; `requirements-reviewer` returns `READY | NEEDS_CLARIFICATION | NEEDS_CONTEXT`; only `READY` for the current revision permits `ready/execute`; `/continue-task` validates the handoff in a fresh session.
- `.opencode/agents/builder.md` now owns the requirement gate, discussion protocol, clarified-requirement block format, and delegation allowlist including `requirements-reviewer`.
- `.opencode/agents/requirements-reviewer.md` is a read-only Sol subagent (`openai/gpt-5.6-sol`, `max`, `steps: 12`, no bash/edit/task/webfetch/question) with a fixed compact verdict format.
- `.opencode/commands/work_with_talk.md` forces discussion; `.opencode/commands/work.md` classifies intake; `.opencode/commands/continue-task.md` applies a readiness guard to every gated implementation phase and fails closed; `.opencode/commands/checkpoint.md` preserves revision, confirmation, verdict, and reviewed revision.
- Resolved config verified `requirements-reviewer` and all four commands from both the project and a neutral directory; `agent list` shows six roles; Builder may delegate to `requirements-reviewer`.
- Live delegation smoke test: Builder invoked `requirements-reviewer`, which returned `NEEDS_CLARIFICATION` for a task lacking a Clarified Requirement block, confirming the fail-closed path.
- Site updates: six role tabs/panels (paired keys asserted), four command cards with the exact `/work_with_talk` heading, `Clarified Requirement` and revision concepts, five-chip route map, two session lanes. Validator self-test, Playwright behavior/no-JS/reflow, and visual checks pass.
- Global installation re-synced byte-identically for six agents, four commands, and the idempotent plugin; global `default_agent` remains unset.
- Reviewer expectation for this task: first pass NEEDS_FIX (resume guard, stale checkpoint, conditional handoff, verdict semantics, `/work` token check); all fixes verified, delta review confirmed the behavioral fixes with only a state-text follow-up, which was corrected.

## Current Flow

- `/work_with_talk` → discussion in the main conversation → user-confirmed clarification recorded in `TASK.md` → `requirements-reviewer` → `ready/execute` → `/new` → `/continue-task` implements. `/work` stays direct for precise requests.

## Constraints And Conventions

- The requirements phase never edits implementation files and never scans broadly; Sol inputs stay bounded.
- Missing review is never approval; unavailable review yields `blocked/requirements_review`.
- Material requirement changes increment the revision, clear the verdict, require renewed confirmation, and require re-review.
- Config-time changes require an OpenCode restart; global copies must be refreshed from the repository after changes.

## Likely Change Surface

- Workflow changes: `.opencode/agents/`, `.opencode/commands/`, then re-copy to `~/.config/opencode/`.
- Site changes: `docs/` plus `scripts/validate-site.mjs`.

## Verification Commands

- `node scripts/validate-site.mjs --self-test`
- `node --check docs/app.js`
- `opencode debug config`, `opencode agent list`, `opencode debug agent requirements-reviewer`
- Playwright smoke for six role tabs, four command cards, no-JS, and 320/390px reflow

## Unknowns

- LLM prompt transitions (`/continue-task` fail-closed variants) are reviewed and smoke-tested but not deterministically automated; manual verification remains the practical check.

## Capsule Rule

Builder replaces this file with current task evidence. Keep paths, observed behavior, and unresolved facts; exclude raw output, plans, and conversation history. Maximum target size: 2,500 tokens.
