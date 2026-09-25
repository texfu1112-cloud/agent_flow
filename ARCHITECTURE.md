# Architecture

This file records stable system boundaries and invariants. Task progress belongs in `TASK.md`; rationale for durable choices belongs in `DECISIONS.md`.

## System Summary

Agent Flow is a project-level OpenCode control plane. A single primary Builder routes bounded read-only work to four child roles, persists resumable state to repository files, and injects the active checkpoint during context compaction. A dependency-free tutorial site documents that workflow and is published separately from the runtime surface.

## Components And Boundaries

| Component | Responsibility | Owns | Must Not Own |
|---|---|---|---|
| `opencode.json` | Project defaults, model routing, output limits, and compaction policy | Default/small models and built-in agent overrides | Role prompts or task progress |
| `.opencode/agents/` | Builder, Explore, Architect, Planner, and Reviewer contracts | Role prompts, model choice, permissions, gate outputs | Implementation or durable task state |
| `.opencode/commands/` | User entry points into the Builder workflow | `/work`, `/checkpoint`, `/continue-task` templates | Independent orchestration logic |
| `.opencode/plugins/stateful-compaction.js` | Preserve the active task across context compaction | Compaction hook and bounded checkpoint injection | General persistence or business logic |
| `AGENTS.md`, `ARCHITECTURE.md`, `DECISIONS.md` | Long-lived operating rules, boundaries, and accepted decisions | Stable cross-task knowledge | Current task transcripts |
| `TASK.md`, `.opencode/state/CONTEXT.md` | Resumable task checkpoint and replaceable evidence capsule | Current progress and curated investigation evidence | Raw logs or full source copies |
| `docs/` | Complete public tutorial website | Hand-authored HTML, CSS, JavaScript, `.nojekyll` | OpenCode runtime state, dependencies, or build output |
| `scripts/` | Repository-only focused validation | Dependency-free maintenance checks | Published website runtime assets |

## Runtime And Data Flow

1. OpenCode loads project configuration, agents, commands, and plugins at startup.
2. The user invokes `/work` or talks to the default Builder.
3. Builder frames `TASK.md`, optionally delegates repository discovery to Explore, and sends only compact evidence to Architect, Planner, or Reviewer when their gates apply.
4. Builder alone edits implementation and state, runs verification, resolves findings, and closes or checkpoints the task.
5. Before automatic context compaction, the plugin reads `TASK.md` and injects a bounded durable checkpoint.
6. A new session resumes from the working tree, `TASK.md`, `CONTEXT.md`, and referenced durable constraints rather than chat history.

The tutorial website has no application runtime or data flow into OpenCode. GitHub Pages serves the files in `main:/docs` unchanged.

## Persistent Data

- `TASK.md`: one active task with objective, phase, checklist, changed paths, verification, blockers, and one exact next action.
- `.opencode/state/CONTEXT.md`: task-specific evidence below 2,500 tokens; replace when the investigation changes.
- `ARCHITECTURE.md`: current stable boundaries and invariants.
- `DECISIONS.md`: accepted durable decisions, newest first.

Source files and current verification results outrank all recorded state.

## External Systems

- OpenCode loads the project and invokes configured model providers.
- The OpenCode provider supplies `deepseek-v4.1-flash` for Builder, Explore, and lightweight system work.
- The OpenAI provider supplies `gpt-5.6-sol` for Architect, Planner, and Reviewer.
- GitHub stores the public repository; GitHub Pages publishes `main:/docs` under the `/agent_flow/` project path.

## Invariants

- Builder is the only role that edits implementation or state files.
- Child-agent depth is one; child roles cannot delegate further.
- Expensive roles receive bounded, named context and do not scan the repository.
- Config-time changes require an OpenCode restart.
- Generated `.opencode` dependencies, package manifests, lock files, credentials, and raw runtime output never enter source control.
- `docs/` is the sole website publication boundary. Its assets are document-relative, work under `file://` and `/agent_flow/`, and require no build step or external runtime dependency.
- Core tutorial content and navigation remain usable without JavaScript; JavaScript adds isolated progressive enhancements only.
- Pages deployment uses `main:/docs`; no generated deployment branch or checked-in Pages workflow is maintained.

## Quality Attributes

| Attribute | Requirement |
|---|---|
| Security | No credentials or session exports in Git or the site; child roles have least-privilege tool access |
| Reliability | Disk state survives compaction/session replacement; the site remains readable if enhancements fail |
| Performance | Search output and Sol inputs stay compact; the site has no framework, CDN, or build payload |
| Compatibility | Relative site assets support project-subpath hosting and direct local viewing |
| Accessibility | Semantic landmarks, keyboard operation, visible focus, reduced motion, contrast, and responsive reflow |
| Operability | OpenCode debug commands and `scripts/validate-site.mjs` provide focused smoke checks |

## Known Risks

- Model catalogs and account access can change. Validate provider-prefixed model IDs rather than assuming that equal model names exist under every provider.
- GitHub Pages publication is asynchronous. Verify both Pages settings and the deployed asset URLs after each release.
- State files can become stale. Repair them against current source and verification instead of following them blindly.

## Update Rule

Describe the current architecture, not its history. Keep this file below roughly 4,000 tokens and put superseded rationale in `DECISIONS.md`.
