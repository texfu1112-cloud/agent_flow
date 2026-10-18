# dsh-crew

A DeepSeek Harness **bundle** that adds a configurable multi-model crew:

- one Host plugin, `crew-config`, with a **live (volatile) Schemastery config** and
  four global delegation tools — `crew_explore`, `crew_architect`, `crew_planner`,
  `crew_reviewer`;
- a **browser config page** on the bundle's Plugins page: one table row per role,
  editing `provider`, `model`, `reasoningEffort`, and `persona`;
- four child-only **read-only role presets** that are the children's tool boundary;
- one selectable `crew` preset that mirrors the shipped `standard` tool set plus
  delegation guidance.

Saving the config applies to the **next delegation** — the config fields are
volatile, so the Loader updates the running references in place instead of
reloading the plugin or restarting the app.

Written against DSH `0.2.1-rc.2`.

## What you get

| Part | Kind | Purpose |
|---|---|---|
| `crew-config` | Host plugin (bundle entry) | Owns the volatile role config, registers the four global `crew_*` tools, applies the configured persona to each role child |
| bundle page config | Browser half (`./client`) | Table editor in `plugins.bundle.config` (key: `@agent-flow/dsh-crew`), reading/writing the `crew-config` settings namespace through `ctx.configForms` |
| `crew-explore` | Agent preset (child-only) | Read-only tool boundary for exploration children: `read`, `grep`/`glob`, no write/edit, no delegation |
| `crew-architect` | Agent preset (child-only) | Same read-only boundary, used for one bounded decision |
| `crew-planner` | Agent preset (child-only) | Same read-only boundary, used for an implementation plan |
| `crew-reviewer` | Agent preset (child-only) | Same read-only boundary, used for a bounded-diff review |
| `crew` | Agent preset (selectable) | Mirrors the shipped `standard` tool set and adds Crew delegation guidance |

The four role presets deliberately contain **no persona row**: identity and model
routing now come from `crew-config`, so changing a role's persona in the GUI takes
effect on the next child. The presets exist only as the read-only tool boundary.

The four `crew_*` tools are registered **globally**, so they work from any session
preset (including `standard`); the bundle never overrides the shipped `standard`
preset or any other preset id.

## Role config

| Field | Meaning | Default |
|---|---|---|
| `provider` | LLM provider route id (as shown by the model picker) | `deepseek-account` |
| `model` | Model id interpreted by that provider | `deepseek-flash` for explore; `deepseek-v4-pro` for architect/planner/reviewer |
| `reasoningEffort` | Adapter-owned effort (`off`/`low`/`high`/`max` for DeepSeek routes); empty means inherit/default | empty |
| `persona` | Free-text persona for the role child; rendered as the child's persona prefix (it shadows the deployment persona for that child) | a role-specific default persona |

All sixteen leaves are `.volatile()` fields. The GUI save writes the profile's
`cordis.patch.yml` through the settings service, and the Loader then re-parses the
entry and updates only the changed references (`loader/volatile-update`) — no plugin
restart, no session restart.

When a role's provider/model is changed and `reasoningEffort` is left empty, the
child route resolves its own default effort instead of inheriting the parent's
route-owned effort; keep the same route to inherit the parent's effort.

## Install

### Option A — Desktop app (recommended)

1. Sidebar **Plugins → Add plugin → Install third-party plugin**.
2. Enter one of (folder path is the local/dev form; Git and tarball install the
   bundle's registry dependency automatically):
   - folder: the absolute path to this `dsh/dsh-crew` directory — run
     `pnpm install` in it first (see *Linked / local development installs* below);
     DSH records it as a `link:` dependency
   - Git: `git+https://github.com/texfu1112-cloud/agent_flow.git#<commit>&path:/dsh/dsh-crew`
   - tarball: the absolute path of a packed `agent-flow-dsh-crew-0.2.3.tgz` file
   - npm: `@agent-flow/dsh-crew` (if published; see *Sharing* below)
3. **Enable** the bundle when installation finishes.

### Option B — CLI

```sh
dsh plugin --profile desktop add 'git+https://github.com/texfu1112-cloud/agent_flow.git#<commit>&path:/dsh/dsh-crew'
```

### Linked / local development installs

A `link:` dependency is not copied, and its dependencies resolve from its own
directory. Install the bundle's one runtime dependency once in the checkout:

```sh
cd dsh/dsh-crew
pnpm install          # creates node_modules/@deepseek-ai/schemastery
```

Registry, Git, and tarball installs get the dependency from the package manager, so
this step is only needed for `link:`/local development.

## Sharing the bundle

The Git spec above was verified end-to-end with DSH `0.2.1-rc.2` + pnpm 11.28.5
(pnpm resolves the `&path:` subdirectory and installs the bundle's registry
dependency). Checklist for sharing this repo:

1. **Commit and push first.** Git installation reads pushed commits only. Give the
   recipient the pushed hash:
   `git rev-parse HEAD`.
2. **Recipient prerequisites:** DSH `0.2.1-rc.x` and a credentialed provider.
   Recipients do not need Node or pnpm; DSH's Plugin Manager runs the install. A
   private repo needs the recipient's GitHub credentials.
3. **Send one spec** (Desktop **Plugins → Add plugin**, or the CLI form):
   - Folder: only for a recipient who has this directory (for example after cloning
     the repo). They run `pnpm install` in `dsh/dsh-crew` once, then install the
     directory's absolute path; DSH records it as a `link:` dependency. Shipping the
     directory together with its `node_modules` also works without Node/pnpm.
   - Git (recommended when the recipient has no copy):
     `git+https://github.com/texfu1112-cloud/agent_flow.git#<commit>&path:/dsh/dsh-crew`
   - Tarball: `cd dsh/dsh-crew && pnpm pack`, then send
     `agent-flow-dsh-crew-0.2.3.tgz` and have the recipient paste its absolute path
     (or `dsh plugin --profile desktop add /abs/path/agent-flow-dsh-crew-0.2.3.tgz`).
4. **npm (optional):** `@agent-flow` is a placeholder scope. To publish under your
   own scope, change `name` in `dsh/dsh-crew/package.json` **and** the two package
   name references in `client.js` — the `window.__ModuleLoader__.load({ id: ... })`
   module id and the `plugins.bundle.config` registration `key`. The slot key must
   equal the published bundle package name or the config page will not render. Then
   `cd dsh/dsh-crew && npm publish`.
5. **After install:** open **Plugins → Crew** and save the provider/model/effort/
   persona for the four roles (defaults already work with `deepseek-account`), then
   call any `crew_*` tool from any session.

## Configure the roles (GUI)

1. Open **Plugins → Crew** (the bundle's detail page). The configuration table
   renders between the bundle description and its plugin rows.
2. Edit any cell for `explore` / `architect` / `planner` / `reviewer`. The
   `provider`, `model`, and `reasoningEffort` cells are dropdowns fed by the bundle's
   own Host route (`GET /agent-flow/dsh-crew/catalog`), which reads the live `llm`
   registry (providers → models → reasoning efforts) and caches it for 30 s. Each
   dropdown has a **Custom…** entry that switches that cell to a free-form input, and
   a **Pick from list** link switches back. A status line under the table reports the
   catalog state; if the live read fails or exceeds 8 s, the table falls back to
   built-in DeepSeek provider/model/effort options with a notice, so dropdowns remain
   available and a typed custom value always works. Effort options follow the row's
   effective provider + model.
3. Press **Save**. The page writes the `crew-config` settings namespace and reports
   success; a revision conflict keeps your draft and asks you to review it.
4. The next `crew_*` call uses the new provider, model, effort, and persona. No
   restart and no new session is required.

The page is registered under the bundle package name in the
`plugins.bundle.config` slot; it reads and writes the `crew-config` namespace via
`ctx.configForms.get('crew-config')` and `form.mutate(operations, revision)`.

### Equivalent profile-patch edit

The GUI save produces the same kind of profile override; editing by hand also works
and is picked up by HMR:

```yaml
- id: crew-config
  name: "@agent-flow/dsh-crew"
  config:
    roles:
      architect:
        provider: deepseek-account
        model: deepseek-v4-pro
        reasoningEffort: high
        persona: "You are Architect. Make one bounded technical decision; never edit files."
```

Omitted leaves fall back to the schema defaults. An override replaces the whole
`config` (Loader patches never deep-merge), so restate every non-default value you
want to keep.

## Model routes

- Use the exact provider id and model id shown in DSH's model picker.
- The provider must hold credentials on that machine. Account login registers
  `deepseek-account` (built-in catalog: `deepseek-flash`, `deepseek-v4-pro`); an API
  key registers `deepseek-official`. A route listed in `allowedModels` can still be
  unavailable when its provider has no credential.
- Defaults in this bundle use `deepseek-account` so that a fresh install works after
  account login. Edit them in the GUI for your own providers.
- Only pass a `reasoningEffort` the adapter advertises for the route; empty is the
  safe default.

## Delegation contract

Each `crew_*` tool's `execute`:

1. reads the **current** Config leaves (`.get()` on the volatile references);
2. calls `ctx.subagents.startActivation({ provider: 'spawn', delivery: 'parent', request })`
   with:
   - `agentPreset: crew-<role>` — the read-only tool boundary,
   - `agentOptions: { provider, model, reasoningEffort? }` — the configured route,
   - `persona` and `toolFilter` — forwarded request facts (see note below),
   - `maxDepth` — the child's absolute delegation cap, computed as
     `parentDelegationDepth + 1 + 0` (the child may delegate zero further levels;
     its preset mounts no delegation tools anyway).
3. returns `{ kind: 'activation', subagentId }`; completion arrives as a normal
   subagent completion notice.

**`maxDepth` semantics (important):** in DSH `0.2.1-rc.2` the activation request's
`maxDepth` is an **absolute** depth cap. The manager computes
`childDepth = parentDepth + 1` and rejects the child when `childDepth > maxDepth`, so
a literal `request.maxDepth = 0` fails to start any child from a top-level parent
(`subagent depth 1 exceeds maxDepth 0`). The plugin therefore expresses the intended
relative policy "zero further levels below the child" as `parentDepth + 1`.

**Persona:** this DSH build's `SubagentStartRequest` no longer honours a per-request
`persona` field (it is ignored by the manager), so the request carries it for forward
compatibility while the plugin applies it for real: on `agent/created` it registers a
scoped `deployment:persona-prefix` section on the child's own context. That shadows
the deployment persona for that one child and is exactly what the child's system
prompt then shows. **`toolFilter`** is likewise forwarded for compatibility; the real
tool boundary is the read-only role preset, and the plugin additionally hides the
`crew_*` delegation tools inside role children.

## Verify

1. In any session, confirm the four tools exist (they are global) and call:

   ```text
   crew_explore({ description: "Smoke test", prompt: "Reply with exactly OK. Do not use tools." })
   ```

2. The result is `started subagent <childId>`.
3. Inspect the child session log at
   `~/.dsh/sessions/<escaped-cwd>/<childId>/session.v4.jsonl.zstd` (child ids have no
   `session-` prefix; the file is concatenated Zstandard frames). The `request/header`
   event records the exact `provider`, `model`, and `reasoningEffort`; the
   `system/message` event contains the child's rendered system prompt including the
   configured persona.
4. A role child must show `agentPreset: crew-<role>`, `delegationDepth: 1`, a
   read-only tool list (no write/edit/bash, no `crew_*`), and
   `turn/end.reason.kind: completed`.

### HMR verification recipe

1. Note the current `architect` route and persona from its child session log.
2. Save new values for `architect` in **Plugins → Crew** (or edit the equivalent
   profile patch). HMR recomposes the profile and commits the volatile-only change in
   place.
3. Call `crew_architect` once. Its new child session must show the new `model`
   (and effort) in `request/header` and the new persona text in `system/message`,
   while the app and the parent session kept running.

This exact sequence was verified against `0.2.1-rc.2`: `deepseek-v4-pro` /
`high` / persona `…BASELINE…` became `deepseek-flash` / `max` / persona `…HMR…` on the
next `crew_architect` call after the config edit.

## Coexistence

- Preset ids are namespaced (`crew-*`); the bundle never overrides the shipped
  `standard`/`minimal`/`ptc`/`cordis` presets.
- The `crew_*` tools are global by design. If you do not want them in every session
  composition, use a profile that does not select this bundle.
- The bundle does not change Agent Teams behavior. Teammates inherit the Lead's
  model; use the `crew_*` tools from the Lead for model-differentiated work.

## Uninstall

Desktop: **Plugins → Installed plugins → Crew → Remove**.
CLI: `dsh plugin --profile desktop remove @agent-flow/dsh-crew`.

Removing the bundle removes the `crew_*` tools, the config entry, and the four role
presets. Sessions created with the `crew` preset keep their recorded composition; a
cold resume fails if the preset id no longer exists, so switch those sessions back to
`standard` before removing.

## Maintainer checks

Run these after editing the bundle:

```sh
# Patch structure: one insert block, 5 presets + the crew-config row,
# no write-capable tool in role presets.
ruby -ryaml -e '
  raw = File.read("dsh/dsh-crew/cordis.patch.yml").gsub(/!!js .*$/, "false")
  doc = YAML.load(raw)
  raise "expected one insert entry" unless doc.is_a?(Array) && doc.size == 1 && doc[0]["insert"]
  rows = doc[0]["insert"]
  presets = rows.select { |r| r["name"] == "@deepseek-ai/dsh-agent-preset" }
  raise "expected 5 presets, got #{presets.size}" unless presets.size == 5
  raise "missing crew-config row" unless rows.any? { |r| r["id"] == "crew-config" && r["name"] == "@agent-flow/dsh-crew" }
  role_ids = presets.map { |r| r["config"]["id"] }.sort
  raise "unexpected presets: #{role_ids}" unless role_ids == %w[crew crew-architect crew-explore crew-planner crew-reviewer]
  puts "ok: #{presets.size} presets + crew-config"
'
python3 -c 'import json,sys; [json.load(open(p)) for p in sys.argv[1:]]; print("ok: json")' \
  dsh/dsh-crew/package.json dsh/dsh-crew/locale/zh.json dsh/dsh-crew/locale/en.json
node --check dsh/dsh-crew/lib/index.js
node --check dsh/dsh-crew/client.js
node -e 'import("./dsh/dsh-crew/lib/index.js").then((m) => {
  const parsed = m.Config();
  const role = parsed.roles.architect;
  console.log("ok: schema", role.model.get(), role.persona.get().slice(0, 20));
})'
```

There is no automated test suite. The end-to-end smoke test is: install into a
disposable profile, call `crew_explore` once, and inspect the child session log as
described above.

## Notes and limitations

- **GUI rendering is verified at the slot-registration level** (the browser half
  registers an active `plugins.bundle.config` occupant and serves `client.js`); full
  pixel-level rendering still needs a human look at the Plugins page.
- **The config owns routes and personas only.** Tool boundaries remain in the four
  read-only presets so a config save can never widen a child's tools.
- **Token cost:** four global tool schemas plus their guidance are present in every
  session that composes this bundle. Remove the bundle (or split the tools into a
  separate bundle) if that cost is unwanted.
- **Security:** a bundle patch can contain `!!js` and plugin rows, and installed Host
  code runs in-process. Review the patch and `lib/index.js` before installing.
- The bundle's one runtime dependency (`@deepseek-ai/schemastery`) is pinned to the
  DSH vendor version so the Config schema is byte-compatible with the Loader.
