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

## ADR-001: Publish the tutorial from `main/docs`
Date: 2026-09-25
Status: accepted
Context: The repository needs a dependency-free tutorial site that can be viewed locally and deployed to GitHub Pages without introducing a build pipeline or mixing website entry points with OpenCode project files.
Decision: Keep the complete static site in `docs/`, use only relative asset URLs, include `docs/.nojekyll`, and configure GitHub Pages to deploy the `/docs` directory from the `main` branch. Do not add a Pages Actions workflow unless future requirements need a build step.
Consequences: The site remains isolated, portable, auditable, and easy to roll back, while deployment depends on the repository Pages setting and a successful push to `main`. Future site assets must remain under `docs/` and work beneath the `/agent_flow/` project subpath.
