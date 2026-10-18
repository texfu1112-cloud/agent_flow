# dsh-crew

A DeepSeek Harness **bundle** that adds a configurable, uniformly managed crew:

- one Host plugin, `crew-config`, holding **one role list** and registering one
  global delegation tool per **enabled** role (`crew_<id>`);
- a **browser configuration page** on the bundle's Plugins page: enable/disable a
  role, edit its id/name, pick its access boundary, and set provider, model,
  reasoning effort, and persona in one table;
- two **boundary presets** for Crew children — `crew-role` (read-only, no commands)
  and `crew-writer` (read/write/edit plus the shell) — so a role's permission
  boundary is enforced by the child's Agent Preset;
- one selectable `crew` preset that mirrors the shipped `standard` tool set and
  carries the **Orchestrator** persona for the main session.

Roles are **ordinary config**: saving the table rewrites the profile entry and the
Loader reloads the plugin, so a newly enabled role's tool appears — and a disabled
role's tool disappears — without restarting the app. Disabled roles keep their
settings and can be re-enabled at any time.

Written against DSH `0.2.1-rc.2`.

## What you get

| Part | Kind | Purpose |
|---|---|---|
| `crew-config` | Host plugin (bundle entry) | Owns the unified role list and registers one global delegation tool per enabled role |
| bundle page config | Browser half (`./client`) | One table in `plugins.bundle.config` (key: `@agent-flow/dsh-crew`) with an enable toggle, access select, model dropdowns, and persona per role |
| `crew-role` | Child boundary preset | Read-only boundary: `read`/`grep`/`glob`, no write/edit, no commands, no delegation |
| `crew-writer` | Child boundary preset | Read/write/edit + execute boundary: `read`/`write`/`edit`/`bash`/`pwsh`, no delegation |
| `crew` | Agent preset (selectable; Orchestrator session) | Mirrors the shipped `standard` tool set and carries the Orchestrator persona and workflow guidance |

The initial role list seeds the seven sub-roles from the Crew role definition:
**Analyst, Explorer, Architect, Designer, Executor, Tester, Reviewer**. Every role
starts on the same model route (`deepseek-account` / `deepseek-flash`) and can be
edited or disabled independently. **Orchestrator is the main session itself** and is
deliberately not a table row: it is always on and owns task split, delegation,
context/dependency management, conflict resolution, user communication, and
acceptance.

The bundle adds three presets to the preset picker: **Crew** (the intended
Orchestrator session), **Crew Role** (read-only child boundary), and **Crew Writer**
(read/write/run child boundary). DSH `0.2.1-rc.2` has no hidden-preset flag, so the
two boundary presets also appear as selectable session presets; starting a session
directly on one gives you that tool boundary without the Orchestrator persona.
The role tools are registered **globally**, so they work from any session preset
(including `standard`); the bundle never overrides the shipped `standard` preset.

## Role config

| Field | Meaning | Seeded value |
|---|---|---|
| `id` | Tool suffix; must match `^[a-z][a-z0-9_]{0,31}$` and be unique. `orchestrator` is reserved for the main session. The tool becomes `crew_<id>` | `analyst`, `explorer`, `architect`, `designer`, `executor`, `tester`, `reviewer` |
| `name` | Display name used in the tool description and table | 需求分析 / 探索 / 架构 / 设计 / 执行 / 测试 / 审查 |
| `enabled` | Whether the `crew_<id>` tool is registered. Disabled roles keep their settings | `true` |
| `access` | Child boundary: `read`, `exec`, or `write` (see below) | `read`, except `designer`=`write`, `executor`=`write`, and `tester`=`exec` |
| `provider` | LLM provider route id (as shown by the model picker) | `deepseek-account` |
| `model` | Model id interpreted by that provider | `deepseek-flash` |
| `reasoningEffort` | Adapter-owned effort (`off`/`low`/`high`/`max` for DeepSeek routes). Empty inherits the parent session's effort when the provider/model route matches; otherwise the route default applies | empty |
| `persona` | Free-text persona for the role child; rendered as the child's persona prefix | a role-specific default persona |

The table is **ordinary** config. A save writes the complete list through the
configuration editor; the Loader reloads this plugin, and the registered tool set
changes on the next composition. The app and other sessions keep running. If the
browser loses the response while the plugin reloads, the page re-reads the list and
confirms the save before reporting failure.

## Access boundaries

`access` selects the child boundary Agent Preset; it is the enforced permission
boundary (this DSH build ignores a request-level `toolFilter`):

| `access` | Child preset | Child tools | Intended role |
|---|---|---|---|
| `read` | `crew-role` | read, grep, glob, working_directory, load_workspace_dependencies | Analyst, Explorer, Architect, Reviewer |
| `exec` | `crew-writer` | read/write/edit + `bash`/`pwsh` | Tester: run tests and reproduce defects; the Tester persona forbids editing implementation code, but the tools are present |
| `write` | `crew-writer` | read/write/edit + `bash`/`pwsh` | Executor: implement and self-test within the assigned scope; Designer: create and edit UI, prototypes, and design-spec deliverables |

Because this DSH build cannot subtract write/edit from the write preset per
delegation, `exec` shares `crew-writer`; its "do not edit implementation code" rule
is carried by the Tester persona. If that is not enough, either give Tester `read`
or accept a third `crew-runner` preset (DSH has no hidden-preset flag).

Every boundary preset excludes the delegation tools, and the plugin additionally
hides all `crew_*` tools inside a Crew child, so a child cannot fan out further.
`maxDepth` also leaves zero further levels below the child.

**Security tradeoff:** the configuration page can move a role from `read` to
`exec`/`write`. That is intentional for the Executor/Designer roles, but it means
the Crew configuration page is an administrative surface: anyone who can save it can
grant a child write/execute access. The table does not allow arbitrary tool lists —
only the two fixed presets. `exec` and `write` share the same write-capable preset,
so the Tester's "no implementation edits" limit is a persona instruction, not a
tool-level guarantee; treat both as trusted execution.

**Route trust:** the bundle serves `GET /agent-flow/dsh-crew/catalog` and
`GET/POST /agent-flow/dsh-crew/roles` on DSH's raw web server, which has no built-in
browser authentication for raw routes. The Host plugin therefore fences them itself:
a browser request must be same-origin (`Sec-Fetch-Site` `same-origin`/`none`), its
`Host` authority must be loopback or the server's advertised origin, a present
`Origin` must match that authority, and a write must use `application/json`. This
blocks ordinary cross-site CSRF and DNS-rebinding attempts and keeps the routes
local to the DSH listener; a prefix-stripping reverse proxy in front of the GUI is
not supported by these root-absolute routes.

## Install

### Option A — Desktop app (recommended)

1. Sidebar **Plugins → Add plugin → Install third-party plugin**.
2. Enter one of (folder path is the local/dev form; Git and tarball install the
   bundle's registry dependency automatically):
   - folder: the absolute path to this `dsh/dsh-crew` directory — run
     `pnpm install` in it first (see *Linked / local development installs* below);
     DSH records it as a `link:` dependency
   - Git: `git+https://github.com/texfu1112-cloud/agent_flow.git#<commit>&path:/dsh/dsh-crew`
   - tarball: the absolute path of a packed `agent-flow-dsh-crew-0.4.0.tgz` file
   - npm: `@agent-flow/dsh-crew` (if published; see *Sharing* below)
3. **Enable** the bundle when installation finishes.

### Option B — CLI

```sh
dsh plugin --profile desktop add 'git+https://github.com/texfu1112-cloud/agent_flow.git#<commit>&path:/dsh/dsh-crew'
```

### Upgrading from 0.3.x

The old `roles` object and `customRoles` array no longer exist. The Config schema now
reads one `roles` array; a profile that still overrides the old shape must be
rewritten (the fresh-install defaults are the same seven-role list, so an empty
`config: {}` also works). Replace the `crew-config` entry in
`~/.dsh/profiles/<profile>/cordis.patch.yml` with:

```yaml
- id: crew-config
  name: "@agent-flow/dsh-crew"
  config: {}
```

or paste the role list from the configuration page after the first save. The old
`crew_explore` / `crew_architect` / `crew_planner` / `crew_reviewer` tools are gone;
the new set is enabled from the role list.

## Sharing the bundle

The Git spec above was verified end-to-end with DSH `0.2.1-rc.2` + pnpm 11.28.5
(pnpm resolves the `&path:` subdirectory and installs the bundle's registry
dependency). Checklist for sharing this repo:

1. **Commit and push first.** Git installation reads pushed commits only. Give the
   recipient the pushed hash: `git rev-parse HEAD`.
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
     `agent-flow-dsh-crew-0.4.0.tgz` and have the recipient paste its absolute path
     (or `dsh plugin --profile desktop add /abs/path/agent-flow-dsh-crew-0.4.0.tgz`).
4. **npm (optional):** `@agent-flow` is a placeholder scope. To publish under your
   own scope, change `name` in `dsh/dsh-crew/package.json` **and** the two package
   name references in `client.js` — the `window.__ModuleLoader__.load({ id: ... })`
   module id and the `plugins.bundle.config` registration `key`. The slot key must
   equal the published bundle package name or the config page will not render. Then
   `cd dsh/dsh-crew && npm publish`.
5. **After install:** open **Plugins → Crew**, review the seven seeded roles (the
   defaults work with `deepseek-account`), then call any enabled `crew_*` tool from
   any session.

## Configure the roles (GUI)

1. Open **Plugins → Crew** (the bundle's detail page). The configuration table
   renders between the bundle description and its plugin rows.
2. Each row has: **enable** checkbox, **ID**, **name**, **access**, **provider**,
   **model**, **reasoning effort**, **persona**, and a **Remove** action. The
   `provider`, `model`, and `reasoningEffort` cells are dropdowns fed by the
   bundle's own Host route (`GET /agent-flow/dsh-crew/catalog`), which reads the
   live `llm` registry (providers → models → reasoning efforts) and caches it for
   30 s. Each dropdown has a **Custom…** entry that switches that cell to a
   free-form input, and a **Pick from list** link switches back. A status line under
   the table reports the catalog state; if the live read fails or exceeds 8 s, the
   table falls back to built-in DeepSeek provider/model/effort options with a
   notice, so dropdowns remain available and a typed custom value always works.
   Effort options follow the row's effective provider + model.
3. Use **Add role** to append a row and **Remove** to delete one. Disable a role
   instead of deleting it when you only want to stop exposing its tool for a while.
4. Press **Save roles**. The page POSTs the complete list, the Host rewrites the
   `crew-config` entry, and the plugin reloads. The next delegation uses the new
   roles and boundaries. No app restart and no new session are required.
5. The page re-reads the list after an ambiguous response; a save that lost its HTTP
   response while the plugin reloaded is confirmed by comparing the re-read list
   with the draft.

### Equivalent profile-patch edit

The GUI save produces the same kind of profile override; editing by hand also works
and is picked up by HMR:

```yaml
- id: crew-config
  name: "@agent-flow/dsh-crew"
  config:
    roles:
      - id: architect
        name: 架构
        enabled: true
        access: read
        provider: deepseek-account
        model: deepseek-flash
        reasoningEffort: high
        persona: "你是 Architect（架构）……"
```

Omitted fields fall back to the schema defaults. An override replaces the whole
`config` (Loader patches never deep-merge), so restate every role you want to keep;
omitting `roles` entirely yields the seeded seven-role list.

## The Orchestrator

The Orchestrator persona lives in the **Crew** preset, so it applies to a session
that selects **Crew** in the preset picker (DSH's shipped `standard` preset remains
the default elsewhere). The role tools are global either way, but without the Crew
preset a session does not carry the Orchestrator flow guidance. The Orchestrator owns
task split, delegation, context and dependency management, conflict resolution,
unified user communication, and acceptance. Its persona also carries the collaboration flow
(requirements/exploration → solution/design → implementation/self-test → test/review
→ fix/re-verify → acceptance) and the skip rules, so the model knows when a role can
be omitted. The Orchestrator itself is not toggleable; the sub-role tools are.

## Delegation contract

Each `crew_<id>` tool's `execute`:

1. re-reads the role from the current Config and refuses if it was removed or
   disabled (a stale session can still expose the tool);
2. calls `ctx.subagents.startActivation({ provider: 'spawn', delivery: 'parent', request })`
   with:
   - `agentPreset` — `crew-role` for `read`, `crew-writer` for `exec`/`write`,
   - `agentOptions: { provider, model, reasoningEffort? }` — the configured route,
   - `persona` — forwarded for forward compatibility; the role preamble at the top
     of the task prompt actually conveys identity (see note below),
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

**Persona and toolFilter:** this DSH build's `SubagentStartRequest` does not honour
a per-request `persona` field, so the request still carries it for forward
compatibility while the role preamble at the top of the task prompt is what actually
conveys identity. A request-level **`toolFilter` does not narrow the child's tools**
(verified live), so the plugin does not rely on it: the child preset selected by
`access` is the boundary, and an `agent/created` hook denies every enabled `crew_*`
delegation tool inside a Crew child.

## Verify

1. In any session, confirm the enabled role tools exist (they are global) and call
   one, for example:

   ```text
   crew_explorer({ description: "Smoke test", prompt: "Reply with exactly OK. Do not use tools." })
   ```

2. The result is `started subagent <childId>`.
3. Inspect the child session log at
   `~/.dsh/sessions/<escaped-cwd>/<childId>/session.v4.jsonl.zstd` (child ids have no
   `session-` prefix; the file is concatenated Zstandard frames). The `request/header`
   event records the exact `provider`, `model`, and `reasoningEffort`; the
   `user/message` (task) event begins with the configured persona preamble.
4. Check the boundary expected for the role: `analyst`/`explorer`/`architect`/
   `reviewer` children show `agentPreset: crew-role` and a read-only tool list;
   `executor`, `designer`, and `tester` show `crew-writer` and may write/edit (the
   Tester's persona is what keeps it from editing implementation code). Child depth
   is the parent depth + 1, so a Lead-level delegation records `delegationDepth: 1`
   (a delegation from a teammate is depth 2). Every child shows no `crew_*` tools and
   `turn/end.reason.kind: completed`.

### Toggle verification recipe

1. Note the current tool list and call `crew_tester` once.
2. Disable `tester` on **Plugins → Crew** and save. The plugin reloads.
3. A fresh session composition no longer sees `crew_tester`; re-enable it and save to
   bring it back. The same table edits the model route and persona — the next
   delegation uses the new values without an app restart.

## Coexistence

- Preset ids are namespaced (`crew*`); the bundle adds only `crew`, `crew-role`,
  and `crew-writer` and never overrides the shipped
  `standard`/`minimal`/`ptc`/`cordis` presets.
- The `crew_*` tools are global by design. If you do not want them in every session
  composition, use a profile that does not select this bundle.
- The bundle does not change Agent Teams behavior. Teammates inherit the Lead's
  model; use the `crew_*` tools from the Lead for model-differentiated delegation.

## Working with Agent Teams

The official **Agent Teams** bundle and this bundle are complementary; both can be
enabled in the same profile. Use a teammate as a durable, multi-turn worker, and a
Crew role as a one-shot specialist:

| | Agent Teams teammate | Crew role child |
|---|---|---|
| Lifetime | durable session; can be steered, resumed, interrupted | one activation; returns a completion notice |
| Model | inherits the Lead session's model | configured per role in **Plugins → Crew** |
| Tools | the spawning member's composition; can write when the Lead assigns it | fixed `crew-role` (read) or `crew-writer` (exec/write) boundary chosen by `access` |
| Best for | parallel implementation, long-running verification, owning a task-board item | bounded analysis/design, focused implementation (Executor), independent testing (Tester), bounded review (Reviewer) |

Recommended loop for a non-trivial task:

1. `crew_analyst` — turn the request into scoped requirements and acceptance criteria.
2. `crew_explorer` — collect a compact evidence capsule.
3. `crew_architect` / `crew_designer` — technical decision or UX/interaction design
   (Designer can write UI/prototype/spec deliverables; Executor owns implementation).
4. `crew_executor` — implement within its assigned scope (or `spawn_teammate` for
   parallel or durable work; the Lead keeps final ownership).
5. `crew_tester` — run the verification plan and report reproducible failures.
6. `crew_reviewer` — review the bounded diff plus the task/verification evidence.
7. The Lead/Orchestrator runs the final checks, records the checkpoint, and reports.

Coordination notes:

- The enabled `crew_*` tools are **global**, so teammates can call them too; prefer
  calling them from the Lead so role models stay a Lead-level routing decision.
- Teammates inherit the Lead's model in this DSH build. Use a Crew role (not another
  teammate) when a subtask needs a different model.
- Teammates and Crew children share the same activation capacity
  (`maxActiveSubagents`, default 8 per tree) and depth accounting: a Crew call from a
  teammate is depth 2. Keep parallel fan-out deliberate.
- A Crew child cannot own shared task-board items; the Lead or a teammate owns them.
- One DSH workflow per `TASK.md`: do not run an OpenCode `/work` session and a DSH
  session against the same active task at the same time (see `AGENTS.md`).

## Uninstall

Desktop: **Plugins → Installed plugins → Crew → Remove**.
CLI: `dsh plugin --profile desktop remove @agent-flow/dsh-crew`.

Removing the bundle removes the `crew_*` tools, the config entry, and the three Crew
presets. Sessions created with the `crew` preset keep their recorded composition; a
cold resume fails if the preset id no longer exists, so switch those sessions back to
`standard` before removing.

## Maintainer checks

Run these after editing the bundle:

```sh
# Patch structure: one insert block, 3 presets (crew, crew-role, crew-writer)
# + the crew-config row.
ruby -ryaml -e '
  raw = File.read("dsh/dsh-crew/cordis.patch.yml").gsub(/!!js .*$/, "false")
  doc = YAML.load(raw)
  raise "expected one insert entry" unless doc.is_a?(Array) && doc.size == 1 && doc[0]["insert"]
  rows = doc[0]["insert"]
  presets = rows.select { |r| r["name"] == "@deepseek-ai/dsh-agent-preset" }
  raise "expected 3 presets, got #{presets.size}" unless presets.size == 3
  ids = presets.map { |r| r["config"]["id"] }.sort
  raise "unexpected presets: #{ids}" unless ids == %w[crew crew-role crew-writer]
  raise "missing crew-config row" unless rows.any? { |r| r["id"] == "crew-config" && r["name"] == "@agent-flow/dsh-crew" }
  puts "ok: #{presets.size} presets + crew-config"
'
python3 -c 'import json,sys; [json.load(open(p)) for p in sys.argv[1:]]; print("ok: json")' \
  dsh/dsh-crew/package.json dsh/dsh-crew/locale/zh.json dsh/dsh-crew/locale/en.json
node --check dsh/dsh-crew/lib/index.js
node --check dsh/dsh-crew/client.js
# Config defaults (run from the repository root; the bundled node_modules resolves):
node -e 'import("./dsh/dsh-crew/lib/index.js").then((m) => {
  const parsed = m.Config();
  console.log("ok: schema", parsed.roles.length, parsed.roles[0].id, parsed.roles[0].enabled);
})'
```

There is no automated test suite. The end-to-end smoke test is: install into a
disposable profile, call one enabled `crew_*` tool, and inspect the child session log
as described above. A reload-free logic check can import the module, call
`apply(fakeCtx, Config())`, and assert the registered tool names and each tool's
`agentPreset` choice.

## Notes and limitations

- **GUI rendering is verified at the slot-registration level** (the browser half
  registers an active `plugins.bundle.config` occupant and serves `client.js`); full
  pixel-level rendering still needs a human look at the Plugins page.
- **The config owns routes, personas, enablement, and the boundary choice.** Tool
  boundaries remain in the two child presets, so a config save can only choose
  among `read` / `exec` / `write`, never an arbitrary tool list. Moving a role from
  `read` to `write` is an administrative action (see the security tradeoff above).
- **Token cost:** one global tool schema per enabled role plus the Orchestrator
  persona is present in every session that composes this bundle. Keep the enabled
  set deliberate; remove the bundle if that cost is unwanted.
- **Security:** a bundle patch can contain `!!js` and plugin rows, and installed Host
  code runs in-process. Review the patch and `lib/index.js` before installing.
- The bundle's one runtime dependency (`@deepseek-ai/schemastery`) is pinned to the
  DSH vendor version so the Config schema is byte-compatible with the Loader.
