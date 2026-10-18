# dsh-crew

A DeepSeek Harness **bundle** that adds a selectable `crew` agent preset plus four
child-only role presets. Each role pairs an identity and a tool boundary with one
LLM route, so delegation — not the model's improvisation — decides which model does
which kind of work.

Written against DSH `0.2.1-rc.2`.

## What you get

| Preset | Purpose | Tools | Default route in this bundle |
|---|---|---|---|
| `crew` | The preset you select for a session: mirrors the shipped `standard` tool set and adds four role tools | all standard tools + `crew_explore` / `crew_architect` / `crew_planner` / `crew_reviewer` | inherits the session model |
| `crew-explore` | Read-only exploration; returns a compact evidence capsule | `read`, `grep`/`glob`, no write/edit | `deepseek-account/deepseek-flash` |
| `crew-architect` | One bounded technical decision | read-only | `openai-codex/gpt-5.6-sol` |
| `crew-planner` | Implementation-ready plan | read-only | `openai-codex/gpt-5.6-sol` |
| `crew-reviewer` | Reviews a bounded diff | read-only | `openai-codex/gpt-5.6-sol` |

The role presets exist only to be mounted as child presets; selecting them as a
session preset works but is not the intended use.

## Requirements

- DSH `0.2.1-rc.2` or a compatible `0.2.x` build.
- The providers referenced by `agentOptions` must be configured on the machine, and
  the exact routes must be authorized for subagent model selection if you rely on
  it. **Edit the routes to match your own providers** (see below).
- Bundles are installed into a profile; the Desktop app and the `dsh` CLI both work.
- The package name `@agent-flow/dsh-crew` uses a placeholder scope. Change `name` in
  `package.json` before publishing to npm; Git and local-path installs do not care.

## Install

### Option A — Desktop app (recommended)

1. Sidebar **Plugins → Add plugin → Install third-party plugin**.
2. Enter one of:
   - npm: `@agent-flow/dsh-crew`
   - Git: `git+https://github.com/<owner>/agent_flow.git#<commit>&path:/dsh/dsh-crew`
   - a local absolute path, or a packed tarball
3. **Enable** the bundle when installation finishes.
4. Open a **new** session, choose the **Crew** preset (or set it as the default in
   Settings → Agent presets).

### Option B — CLI

```sh
dsh plugin --profile desktop add <spec>      # npm name, git URL, or local path
```

### Option C — profile patch (no packaging)

Copy the `- insert:` block from [`cordis.patch.yml`](cordis.patch.yml) into
`~/.dsh/profiles/<profile>/cordis.patch.yml`, then restart DSH. This bypasses the
bundle format entirely and is only recommended for a single machine.

## Change the model routes

Open [`cordis.patch.yml`](cordis.patch.yml) and edit the four `agentOptions` blocks
inside the `crew` preset:

```yaml
              agentOptions:
                provider: openai-codex          # <- your provider id
                model: gpt-5.6-sol              # <- your model id
```

Rules of thumb:

- Use the exact provider id and model id shown in DSH's model picker.
- Use the provider that actually holds credentials on that machine. Account login
  registers `deepseek-account`; an API key registers `deepseek-official`. A route
  listed in `allowedModels` can still be unavailable if its provider has no
  credential.
- Keep `crew_explore` on a cheap model; keep `crew_architect`, `crew_planner`, and
  `crew_reviewer` on a strong model.
- Do **not** add `reasoningEffort` unless the adapter advertises that level for the
  route. Omit it to inherit the parent's level.
- If you want the model to choose a route per call instead of pinning it, remove
  `agentOptions` and rely on the generic `subagent` tool with model selection
  enabled (`modelSelectionSettings: true` + the host `subagent-model-selection`
  setting). Pinned routes are more predictable and cheaper to reason about.

## Verify

1. New session with the **Crew** preset.
2. Ask: `Use crew_explore to find where the CLI entry point is defined; report file and line only.`
3. Ask: `Use crew_architect to decide whether <decision>; do not edit files.`
4. Check the usage/transcript records: the first call should run on the cheap route,
   the second on the strong route. The tool result also reports the child id.
5. Try `crew_architect` on a write request: it must refuse or fail, because its
   preset has no write/edit tools.

## Uninstall

Desktop: **Plugins → Installed plugins → Crew → Remove**.
CLI: `dsh plugin --profile desktop remove @agent-flow/dsh-crew`.

Removing the bundle removes the presets it declared. Sessions created with the
`crew` preset keep their recorded composition; a cold resume fails if the preset id
no longer exists, so switch those sessions back to `standard` before removing.

## Notes

- **Preset ids are namespaced** (`crew-*`) to avoid colliding with the shipped
  `standard` / `minimal` / `ptc` / `cordis` presets or with other bundles.
- **Version coupling:** the `crew` preset carries a copy of the shipped `standard`
  preset's plugin list because presets do not support inheritance. When DSH updates
  `standard`, review the diff and update this list if needed. The `engines.dsh` range
  documents the version this copy was written against.
- **Security:** a bundle patch can contain `!!js` and plugin rows, so installing a
  bundle is trusting its code. Review the patch before installing.
- **Agent Teams:** this bundle does not change Team behavior. Teammates still inherit
  the Lead's model; use the role tools from the Lead for model-differentiated work.
- **Token cost:** the four tool instances add schema tokens to every request in the
  `crew` preset. If you only need two roles, delete the unused rows.
