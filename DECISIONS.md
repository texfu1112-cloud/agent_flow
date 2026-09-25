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
