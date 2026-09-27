# Technical Decisions

Record only accepted, durable decisions that constrain future work. Task-local choices belong in `TASK.md`. Newest entries go first.

## Entry Format

```text
## ADR-NNN: Short title
Date: YYYY-MM-DD
Status: accepted | superseded by ADR-NNN
Context: Why a durable choice was required.
Decision: What future work must follow.
Consequences: Important benefits, costs, migration, or rollback implications.
```

## Accepted Decisions

## ADR-003: Gate materially ambiguous work through durable requirement review
Date: 2026-09-27
Status: accepted
Context: Ambiguous requests cannot safely be resolved from guessed intent, and conversational clarification is lost across session replacement.
Decision: Builder classifies actionable intake. Precise `/work` requests use the existing workflow; materially ambiguous requests and `/work_with_talk` enter a main-conversation requirements phase with no implementation. Builder records one user-confirmed, revisioned `Clarified Requirement` in `TASK.md`, then obtains a bounded read-only review from `requirements-reviewer` on `openai/gpt-5.6-sol`. Only a `READY` verdict for the current revision permits `Status: ready` and `Phase: execute`; `/continue-task` validates that handoff before entering the normal implementation gates.
Consequences: Clarified work can resume without chat history, while precise work avoids additional latency. Material requirement changes require renewed confirmation and re-review. The state format is additive, so existing tasks remain compatible and removing the new command and role requires no data migration.

## ADR-002: Offer an explicit-opt-in global installation of the workflow
Date: 2026-09-25
Status: accepted
Context: Agent, command, and plugin definitions are project-scoped, so the workflow disappears when OpenCode starts in another folder. The user wants one machine-wide installation without changing unrelated projects' default behavior.
Decision: Deploy the same location-independent definitions to `~/.config/opencode/` and declare the plugin in the global config. Global configuration must not set `default_agent` or model defaults; the repository stays the single source of truth; the compaction plugin must stay idempotent because global and project scopes can load it at the same time.
Consequences: `/work`, `@builder`, and the other roles become available in every folder after a client restart. The global config also adopts the project's compaction, tool-output, and internal-agent model policy, which applies to all projects unless a project overrides it. Refreshing the workflow means re-copying definitions and restarting OpenCode.

## ADR-001: Publish the tutorial from `main/docs`
Date: 2026-09-25
Status: accepted
Context: The repository needs a dependency-free tutorial site that can be viewed locally and deployed to GitHub Pages without introducing a build pipeline or mixing website entry points with OpenCode project files.
Decision: Keep the complete static site in `docs/`, use only relative asset URLs, include `docs/.nojekyll`, and configure GitHub Pages to deploy the `/docs` directory from the `main` branch. Do not add a Pages Actions workflow unless future requirements need a build step.
Consequences: The site remains isolated, portable, auditable, and easy to roll back, while deployment depends on the repository Pages setting and a successful push to `main`. Future site assets must remain under `docs/` and work beneath the `/agent_flow/` project subpath.
