---
description: Resume the active task from durable project state in a fresh session.
agent: builder
---

Resume the active task without relying on prior chat history.

Read `TASK.md` first, then `.opencode/state/CONTEXT.md`, the current working tree, and only the architecture or decision entries referenced by the task. Validate that recorded state still matches the files.

Readiness guard for gated tasks: if `TASK.md` contains a `Clarified Requirement` block, do not enter any implementation phase unless the block is user-confirmed, `Open Questions: NONE`, and `requirements-reviewer` returned `READY` for the matching current `Revision` / `Reviewed revision` pair. On any mismatch, cleared verdict, or missing evidence, fail closed: set `Status: needs_user` or `blocked` with the appropriate requirements phase, tell the user exactly what is missing, and do not implement. Tasks without a `Clarified Requirement` block are not gated.

Dispatch by status and phase:

- `needs_user` or `in_progress` with `Phase: requirements_discussion`: resume the discussion as dialogue. Ask the next prioritized questions; do not implement.
- `in_progress` or `blocked` with `Phase: requirements_review`: complete the requirements review before any implementation. Never treat missing review as approval.
- `ready` with `Phase: execute`: apply the readiness guard, then set `Status: in_progress` and continue with the normal Builder workflow phases.
- Any other implementation phase on a gated task: apply the readiness guard before continuing the normal workflow.

Continue from `Next Action` and update the checkpoint before responding.

Optional user guidance: $ARGUMENTS
