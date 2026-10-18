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
| `crew-config` | Host plugin (bundle entry) | Owns the live role config and registers one global delegation tool per role (four built-in + up to eight user-defined) |
| bundle page config | Browser half (`./client`) | Table editors in `plugins.bundle.config` (key: `@agent-flow/dsh-crew`) for the built-in roles and the user-defined role list |
| `crew-role` | Agent preset (child-only) | The single shared read-only tool boundary every Crew child mounts (`read`, `grep`/`glob`, no write/edit, no delegation) |
| `crew` | Agent preset (selectable) | Mirrors the shipped `standard` tool set and adds Crew delegation guidance |

Built-in and user-defined roles are treated identically: **one role = one global
tool + one config entry**, and every child mounts the same read-only `crew-role`
preset. The persona is prepended to that child's task as its role preamble and the
model route travels as `agentOptions`, so no per-role preset is needed. Child
sessions record `agentPreset: crew-role`.

Only two Crew presets appear in the preset list: **Crew** (selectable session
preset) and **Crew Role** (child-only boundary). The role tools themselves are
registered **globally**, so they work from any session preset (including
`standard`); the bundle never overrides the shipped `standard` preset.

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
   - tarball: the absolute path of a packed `agent-flow-dsh-crew-0.3.0.tgz` file
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
     `agent-flow-dsh-crew-0.3.0.tgz` and have the recipient paste its absolute path
     (or `dsh plugin --profile desktop add /abs/path/agent-flow-dsh-crew-0.3.0.tgz`).
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

## User-defined roles

Besides the four built-in roles, the configuration page has a **Custom roles**
section where you can add, edit, and remove your own roles:

| Field | Meaning |
|---|---|
| `id` | Tool suffix; must match `^[a-z][a-z0-9_]{0,31}$` and be unique (the tool becomes `crew_<id>`) |
| `name` | Display name used in the tool description (defaults to `id`) |
| `provider`, `model`, `reasoningEffort`, `persona` | Same meaning as the built-in role fields |

Rules and behavior:

- Up to **8** custom roles; ids cannot reuse the built-in role names.
- Saving writes the complete entry through the configuration editor: `customRoles`
  is **ordinary** config (not volatile), so the Loader reloads this plugin and the
  new `crew_<id>` tools exist for the next delegation. The built-in four roles stay
  volatile and still update without a reload.
- Every custom-role child mounts the shared read-only `crew-role` preset, so its tool
  boundary matches the built-in roles. Its persona is injected at the top of the task
  prompt (one shared preset cannot carry several identities); the model route and
  depth policy are identical to the built-in roles.
- The browser editor talks to `GET /agent-flow/dsh-crew/roles` (returns
  `{ roles, limits }`) and `POST /agent-flow/dsh-crew/roles` (complete role list),
  both served by this bundle's own Host plugin, so no session-scoped Remote is
  involved. The same values can be edited by hand in the profile patch:

```yaml
- id: crew-config
  name: "@agent-flow/dsh-crew"
  config:
    customRoles:
      - id: debugger
        name: Debugger
        provider: deepseek-account
        model: deepseek-flash
        reasoningEffort: high
        persona: "You are Debugger. Reproduce the failure, isolate the cause, and report the smallest fix."
```

## Model routes

- Use the exact provider id and model id shown in DSH's model picker.
- The provider must hold credentials on that machine. Account login registers
  `deepseek-account` (built-in catalog: `deepseek-flash`, `deepseek-v4-pro`); an API
  key registers `deepseek-official`. A route listed in `allowedModels` can still be
  unavailable when its provider has no credential.
- Defaults in this bundle use `deepseek-account` so that a fresh install works after
  account login. Edit them in the GUI for your own providers.
- The dropdowns only offer providers whose live catalog returns models. A provider
  that answers with an empty catalog (for example a route without credentials) is
  omitted — configure its credential first, then retry the page.
- Only pass a `reasoningEffort` the adapter advertises for the route; empty is the
  safe default.

## Delegation contract

Each `crew_*` tool's `execute`:

1. reads the **current** Config leaves (`.get()` on the volatile references);
2. calls `ctx.subagents.startActivation({ provider: 'spawn', delivery: 'parent', request })`
   with:
   - `agentPreset: crew-role` — the shared read-only tool boundary,
   - `agentOptions: { provider, model, reasoningEffort? }` — the configured route,
   - `persona` and `toolFilter` — forwarded request facts; the persona also leads
     the task prompt as the child's role preamble (see note below),
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

**Persona and toolFilter:** this DSH build's `SubagentStartRequest` no longer honours
a per-request `persona` field (the manager ignores it), so the request still carries
it for forward compatibility while the role preamble at the top of the task prompt is
what actually conveys identity — identically for built-in and user-defined roles.
**`toolFilter`** is likewise forwarded for compatibility; the real tool boundary is
the shared read-only `crew-role` preset, and the plugin additionally hides every
`crew_*` delegation tool inside Crew children.

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
   `user/message` (task) event begins with the configured persona preamble.
4. A role child must show `agentPreset: crew-role`, `delegationDepth: 1`, a
   read-only tool list (no write/edit/bash, no `crew_*`), the role preamble as the
   first lines of its task prompt, and `turn/end.reason.kind: completed`.

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

- Preset ids are namespaced (`crew*`); the bundle adds only `crew` and `crew-role`
  and never overrides the shipped `standard`/`minimal`/`ptc`/`cordis` presets.
- **Upgrading from 0.2.x:** the four per-role presets (`crew-explore`,
  `crew-architect`, `crew-planner`, `crew-reviewer`) no longer exist. Switch sessions
  that selected one back to `standard`/`Crew` before upgrading; their role tools keep
  working unchanged.
- The `crew_*` tools are global by design. If you do not want them in every session
  composition, use a profile that does not select this bundle.
- The bundle does not change Agent Teams behavior. Teammates inherit the Lead's
  model; use the `crew_*` tools from the Lead for model-differentiated work.

## Working with Agent Teams

The official **Agent Teams** bundle and this bundle are complementary; both can be
enabled in the same profile. Use a teammate as a durable, multi-turn worker, and a
Crew role as a one-shot, read-only specialist:

| | Agent Teams teammate | Crew role child |
|---|---|---|
| Lifetime | durable session; can be steered, resumed, interrupted | one activation; returns a completion notice |
| Model | inherits the Lead session's model | configured per role in **Plugins → Crew** |
| Tools | the spawning member's composition (can edit files per the Lead's assignment) | fixed read-only `crew-role` boundary (no write/edit, no delegation) |
| Best for | parallel implementation, long-running verification, owning a task-board item | cheap exploration, strong-model architecture/planning/review, a second opinion |

Recommended loop for a non-trivial task:

1. `crew_explore` — collect a compact evidence capsule (cheap model).
2. `crew_architect` / `crew_planner` — strong-model decision or implementation plan
   from that capsule (they do not scan the repository).
3. `spawn_teammate` — one or more durable teammates implement the plan, with disjoint
   write scopes recorded on the shared task board.
4. `crew_reviewer` — review the bounded diff plus the task/verification evidence.
5. The Lead runs the final checks, records the checkpoint, and reports.

Coordination notes:

- The four `crew_*` tools are **global**, so teammates can call them too; prefer
  calling them from the Lead so role models stay a Lead-level routing decision.
- Teammates inherit the Lead's model in this DSH build. Use a Crew role (not another
  teammate) when a subtask needs a different model.
- Teammates and Crew children share the same activation capacity
  (`maxActiveSubagents`, default 8 per tree) and depth accounting: a Crew call from a
  teammate is depth 2. Keep parallel fan-out deliberate.
- Crew children are read-only, so never assign them implementation or test-fix work;
  they also cannot own shared task-board items.
- One DSH workflow per `TASK.md`: do not run an OpenCode `/work` session and a DSH
  session against the same active task at the same time (see `AGENTS.md`).

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
# Patch structure: one insert block, 2 presets (crew, crew-role) + the
# crew-config row, no write-capable tool in the role preset.
ruby -ryaml -e '
  raw = File.read("dsh/dsh-crew/cordis.patch.yml").gsub(/!!js .*$/, "false")
  doc = YAML.load(raw)
  raise "expected one insert entry" unless doc.is_a?(Array) && doc.size == 1 && doc[0]["insert"]
  rows = doc[0]["insert"]
  presets = rows.select { |r| r["name"] == "@deepseek-ai/dsh-agent-preset" }
  raise "expected 2 presets, got #{presets.size}" unless presets.size == 2
  raise "missing crew-config row" unless rows.any? { |r| r["id"] == "crew-config" && r["name"] == "@agent-flow/dsh-crew" }
  role_ids = presets.map { |r| r["config"]["id"] }.sort
  raise "unexpected presets: #{role_ids}" unless role_ids == %w[crew crew-role]
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
