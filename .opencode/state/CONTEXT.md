# Context Capsule

Task ID: 2026-09-25-tutorial-site-github
Generated: 2026-09-25
Scope: authoritative tutorial content and static-site deployment

## Investigation Question

What must the website teach, and what constraints shape a no-build GitHub Pages implementation?

## Relevant Evidence

- Routing diagnosis: the OpenCode provider catalog contains `opencode/gpt-5.6-luna` but not `opencode/gpt-5.6-sol`; the configured Sol route therefore returned `Model access is disabled` for Architect, Planner, and Reviewer.
- The authenticated OpenAI provider exposes active `openai/gpt-5.6-sol` with the required `max` variant. All three Agent definitions now use that route; Explore and Builder remain on `opencode/deepseek-v4.1-flash`.
- Fresh OpenCode 1.18.18 CLI processes resolved the corrected routes and successfully delegated smoke tests to Architect (ACCEPT), Planner (READY), and Reviewer (PASS).
- After restart, Architect accepted ADR-001 and Planner returned a complete implementation/publication plan through the corrected Sol route.
- `README.md:7-35` defines five roles and the flow: Builder/Flash controls work; Explore/Flash produces evidence; Architect, Planner, and Reviewer use Sol at bounded gates; Builder implements, verifies, fixes, and checkpoints.
- `opencode.json:3-31` makes Builder the default, limits subagent depth to one, configures output truncation and compaction, and routes compaction/summary/title to Flash.
- `.opencode/agents/builder.md` allows Builder to delegate only to Explore, Architect, Planner, and Reviewer and defines architecture, planning, and review gate criteria.
- `AGENTS.md:7-24` defines precedence as source and verification, durable architecture/decisions, `TASK.md`, `CONTEXT.md`, then chat. Builder is the only writer; task state is replaced rather than accumulated.
- The three commands are `/work <request>`, `/checkpoint`, and `/continue-task`. Session replacement is `/checkpoint` → native `/new` → `/continue-task`; `/resume` remains reserved by OpenCode.
- `.opencode/plugins/stateful-compaction.js` injects `TASK.md` before compaction, truncating only after 12,000 characters and doing nothing when the file is absent.
- Startup guidance requires opening/restarting OpenCode in the project, connecting providers with `/connect`, and then using `/work` or the default Builder. Config-time files are not hot-reloaded.
- Maintenance commands are `opencode debug config`, `opencode agent list`, `opencode debug agent <name>`, and `node --check .opencode/plugins/stateful-compaction.js`.
- Generated OpenCode dependencies, package manifests, lock files, logs, and secrets must remain outside Git.
- GitHub publication is approved as a public `texfu1112-cloud/agent_flow` repository with GitHub Pages. `gh` is authenticated, the local repository has no commits, and no remote exists yet.
- Architect accepted ADR-001 with progressive-enhancement constraints; Planner returned an implementation/publication sequence with no open questions.
- `docs/` now contains hand-authored HTML, CSS, JavaScript, and `.nojekyll`. Core links and all role content remain available without JavaScript; enhancements cover themes, navigation, role tabs, checklist state, command copying, progress, and reveal behavior.
- `scripts/validate-site.mjs` uses Node built-ins only and verifies the publication boundary, required tutorial content, IDs/fragments/assets, relative URLs, no remote runtime dependencies, progressive baseline, and accessibility/responsive hooks.
- Static validation, JavaScript syntax, local HTTP assets, OpenCode smoke checks, and Playwright interaction/no-JS/320px reflow checks pass. Desktop and mobile screenshots were inspected.

## Current Flow

- Implementation and focused verification are complete. Reviewer inspection precedes explicit staging, the initial commit, repository creation/push, and `main:/docs` Pages activation.

## Constraints And Conventions

- The site must be responsive, accessible, Chinese-first, dependency-free, and usable without a build toolchain.
- Avoid asserting an unverified generic OpenCode installation command. Explain the validated local CLI context (`opencode-ai@1.18.18`) separately from provider/model availability.
- Keep the project root focused on orchestration; use a dedicated static publish surface.
- No token, credential, generated dependency, or raw runtime output may be published.

## Likely Change Surface

- Review changes only in the paths listed by `TASK.md`, then Git/GitHub publication state.

## Verification Commands

- Existing OpenCode smoke commands from `AGENTS.md`.
- Static HTML parsing, internal-anchor/file-reference checks, JavaScript syntax check, local HTTP smoke test, and focused accessibility assertions.
- Git status/ignore checks, secret scan, GitHub remote/Pages status checks.

## Unknowns

- Pages settings and the live URL cannot be verified until after the initial push; no implementation fact is blocked.

## Capsule Rule

Builder replaces this file with current task evidence. Keep paths, observed behavior, and unresolved facts; exclude raw output, implementation plans, and conversation history. Maximum target size: 2,500 tokens.
