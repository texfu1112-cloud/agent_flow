# Context Capsule

Task ID: 2026-09-25-global-workflow-install
Generated: 2026-09-25
Scope: opt-in global OpenCode workflow installation

## Investigation Question

Why does the workflow disappear in other folders, and how is the same workflow deployed machine-wide without changing unrelated projects?

## Relevant Evidence

- OpenCode configuration is project-scoped: it loads `opencode.json` and `.opencode/` from the opened folder up to the git worktree root, so agents, commands, and plugins defined only in `agent_flow` are unavailable elsewhere.
- Global deployment now lives in `~/.config/opencode/`: `agents/` (five roles), `commands/` (three commands), `plugins/stateful-compaction.js`, and `opencode.jsonc`.
- Global `opencode.jsonc` declares the plugin with a `file:///` URL and adopts the project compaction/tool-output/internal-agent policy, but deliberately omits `default_agent`, `model`, and `small_model`.
- Neutral-folder verification with OpenCode 1.18.18 resolved all five roles, all three commands, and the global plugin; `default_agent` remained unset there.
- A project directory loads both the global and project plugin instances. `stateful-compaction.js` now detects an existing `## Durable task checkpoint` entry and skips, preventing duplicate injection; it also returns safely when `output.context` is missing or `TASK.md` does not exist.
- All global copies are byte-identical to the repository sources (`cmp` for agents/commands, SHA-256 for the plugin).
- The repository remains the single source of truth; global installation is documented in `README.md` under "全局安装（可选）" and recorded as ADR-002.

## Current Flow

- Any folder: `/work <request>` or `@builder` activates the workflow. The plugin reads that project's `TASK.md`; without the file it no-ops. In `agent_flow`, project config still makes Builder the default agent and both plugin instances coexist safely.

## Constraints And Conventions

- Global config must keep `default_agent` and model defaults unchanged.
- Updating workflow definitions means re-copying to `~/.config/opencode/` and restarting OpenCode; config-time files are not hot-reloaded.
- Do not install a global `AGENTS.md`; the state protocol ships inside the agent and command definitions to avoid imposing it on every project.

## Likely Change Surface

- Workflow definition changes: update the repository files first, then re-copy to the global directories.
- Site changes remain `docs/` plus `scripts/validate-site.mjs`.

## Verification Commands

- Plugin behavior: direct `node --input-type=module` invocation from the repository
- Global config: `opencode debug config`, `opencode agent list`, `opencode debug agent architect` from a non-project directory
- Project regression: `node scripts/validate-site.mjs --self-test`, `node --check docs/app.js`, project `debug config`

## Unknowns

- The OpenCode client must be restarted for the running session to see the new global agents and plugin; that restart is the user's action.

## Capsule Rule

Builder replaces this file with current task evidence. Keep paths, observed behavior, and unresolved facts; exclude raw output, plans, and conversation history. Maximum target size: 2,500 tokens.
