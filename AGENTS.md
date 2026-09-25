# Agent Operating Rules

This project uses disk state, not chat history, as the continuity layer for agent work.

## Sources Of Truth

Use this precedence when information conflicts:

1. Current source files and verification results
2. Accepted constraints in `ARCHITECTURE.md` and `DECISIONS.md`
3. The active checkpoint in `TASK.md`
4. The evidence capsule in `.opencode/state/CONTEXT.md`
5. Conversation history

Report and repair stale state instead of following it blindly.

## State Ownership

- Builder is the only agent that edits implementation or state files.
- `TASK.md` contains one active task and is the resumable checkpoint. Replace obsolete detail; do not append a diary.
- `.opencode/state/CONTEXT.md` contains task-specific evidence. Replace it when the investigation changes and keep it below 2,500 tokens.
- `ARCHITECTURE.md` contains stable system boundaries and invariants, not task progress.
- `DECISIONS.md` contains only accepted decisions that will constrain future tasks.
- Before ending actionable work, record status, changed paths, verification, blockers, and one exact next action in `TASK.md`.

## Context Budget

- Load files lazily and prefer targeted reads around named symbols.
- Never place full source files, raw search results, stack traces, or build logs in state documents.
- A Sol request receives only the requirement, acceptance criteria, compact state files, relevant paths or diff, and concise test outcomes.
- Explore may search broadly with Flash, but its returned capsule must contain evidence and conclusions rather than a repository tour.
- Use one primary session per task. Run `/checkpoint`, then `/new`, then `/continue-task` when the session becomes noisy or the task must move to another conversation.

## Project Commands

- Resolve and validate project configuration: `opencode debug config`
- List resolved agents and permissions: `opencode agent list`
- Inspect one resolved agent: `opencode debug agent <name>`
- Check compaction plugin syntax: `node --check .opencode/plugins/stateful-compaction.js`
- Automated test suite: none yet; use the OpenCode debug commands as smoke tests
