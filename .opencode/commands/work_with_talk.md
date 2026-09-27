---
description: Discuss a vague requirement in the main conversation, review it, and hand off a ready task.
agent: builder
---

The requirement below is not yet clear. Run the requirement discussion protocol before any implementation:

$ARGUMENTS

Rules:

- Do not edit implementation files, scaffold code, or explore a solution while the requirement is unresolved.
- Discuss only in the main conversation. Ask at most three prioritized questions per turn, offer concrete options with trade-offs when the user is unsure, and restate your understanding before recording it.
- Keep a requirements checkpoint in `TASK.md` (`Status: needs_user`, `Phase: requirements_discussion`) with the raw request, known facts, open questions, and a draft `Clarified Requirement` block. Record confirmed decisions as they land.
- When the user confirms the restatement, finalize the block with the next revision, confirmed goal, scope, acceptance criteria, constraints, and `Open Questions: NONE`. Set `Status: in_progress`, `Phase: requirements_review`.
- Invoke `requirements-reviewer` with a bounded packet (`TASK.md` plus only named context files). Fix and re-review non-ready findings; increment the revision and clear the verdict whenever the requirement changes.
- Only `READY` for the current revision permits `Status: ready`, `Phase: execute`, and Next Action: run `/new`, then `/continue-task`, in a fresh session. Never treat missing review as approval; use `Status: blocked`, `Phase: requirements_review` when review cannot run.
- If and only if the current revision reaches `READY`, finish by telling the user the reviewed requirement is saved and to execute it in a new session with `/new` and `/continue-task`. Otherwise report the exact blocker or remaining questions and the next discussion step.
