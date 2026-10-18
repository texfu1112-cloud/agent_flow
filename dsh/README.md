# DeepSeek Harness (DSH) integration

This directory carries the optional DeepSeek Harness side of the repository. The
OpenCode workflow in `.opencode/`, `opencode.json`, and the state protocol in
`AGENTS.md` is unchanged and remains the primary workflow. Nothing here is loaded
by OpenCode.

## Layout

| Path | Purpose |
|---|---|
| `dsh/dsh-crew/` | A self-contained DSH **bundle**: one Host plugin `crew-config` with a live (volatile) role configuration + four global delegation tools, a browser config page, one selectable `crew` preset, and four read-only role presets (`crew-explore`, `crew-architect`, `crew-planner`, `crew-reviewer`) |
| `dsh/dsh-crew/cordis.patch.yml` | The bundle payload: preset declarations, the read-only role boundaries, and the `crew-config` Host row |
| `dsh/dsh-crew/lib/index.js` | Host half: Schemastery `Config`, the four `crew_*` tools, and the per-child persona hook |
| `dsh/dsh-crew/client.js` | Browser half: the `plugins.bundle.config` table editor backed by `ctx.configForms` (hand-written `window.__ModuleLoader__` module, no build step) |
| `dsh/dsh-crew/package.json` | Package manifest; `dsh.bundle.patch` and `dsh.client` are what make it a bundle with a GUI |

## Coexistence with the OpenCode workflow

The two clients are independent and can share this repository:

| Concern | OpenCode | DeepSeek Harness |
|---|---|---|
| Entry config | `opencode.json`, `.opencode/` | `~/.dsh/profiles/<profile>/` (outside the repo) |
| Role model | `.opencode/agents/*.md` | Agent presets + live Crew role config (this bundle) |
| State files | `TASK.md`, `.opencode/state/CONTEXT.md` | same files, if the Lead is instructed to use them |
| Instructions | `AGENTS.md` loaded by OpenCode | `AGENTS.md` loaded automatically as workspace instructions |
| Compaction checkpoint | `.opencode/plugins/stateful-compaction.js` | no equivalent plugin; project files remain the continuity layer |

Rules that keep them from stepping on each other:

- **No shared runtime state.** Installing or removing the DSH bundle never edits
  `.opencode/`, `opencode.json`, `TASK.md`, or `.opencode/state/CONTEXT.md`.
- **`AGENTS.md` is read by both.** Its OpenCode-specific commands (`opencode debug
  config`, `opencode agent list`) are inert under DSH; the DSH section at the bottom
  of that file states the mapping (`Lead` takes the role `Builder` takes under
  OpenCode).
- **One active workflow per session.** Do not run an OpenCode `/work` session and a
  DSH `crew` session against the same `TASK.md` at the same time; the file has a
  single active-task slot.
- **Model routes are per machine.** OpenCode uses `opencode.json` model ids; DSH uses
  provider routes in the Crew configuration. They do not need to match, but keep the
  cheap/strong split consistent if you compare results.

## Install

```sh
# Desktop: Plugins -> Add plugin -> Install third-party plugin
#   folder:   /abs/path/to/agent_flow/dsh/dsh-crew   (local dev; run pnpm install there first)
#   git:      git+https://github.com/texfu1112-cloud/agent_flow.git#<commit>&path:/dsh/dsh-crew
#   tarball:  /abs/path/agent-flow-dsh-crew-0.2.3.tgz
#   npm name: @agent-flow/dsh-crew                    (after publishing)

# CLI (same forms; folder path also works)
dsh plugin --profile desktop add /abs/path/to/agent_flow/dsh/dsh-crew
dsh plugin --profile desktop add 'git+https://github.com/texfu1112-cloud/agent_flow.git#<commit>&path:/dsh/dsh-crew'
```

`<commit>` is a pushed commit (`git rev-parse HEAD`); `#main` also works but a
pinned commit is reproducible. For a `link:`/local development install, the bundle's
runtime dependency resolves from its own directory, so run `pnpm install` inside
`dsh/dsh-crew` once before installing the bundle. Registry, Git, and tarball installs
fetch `@deepseek-ai/schemastery` (public npm) automatically.

After installation, the four `crew_*` tools are available in every session, and the
bundle's own page under **Plugins → Crew** edits the role provider/model/effort/persona
table live. See [`dsh-crew/README.md`](dsh-crew/README.md) for the full behavior,
the HMR verification recipe, and uninstall.

## Sharing

The bundle is the sharing unit. Verified install shapes with DSH `0.2.1-rc.2` and
pnpm 11.28.5:

| Method | Spec / command | Notes |
|---|---|---|
| Git (this monorepo) | `git+https://github.com/texfu1112-cloud/agent_flow.git#<commit>&path:/dsh/dsh-crew` | pnpm resolves the subdirectory and installs the bundle's dependencies. The commit must be pushed; private repos need credentials. |
| Tarball | `cd dsh/dsh-crew && pnpm pack`, then install the absolute `.tgz` path | Self-contained for the recipient; dependencies come from the registry. |
| npm | change `name` in `dsh/dsh-crew/package.json`, sync the two package-name keys in `client.js`, `npm publish` | `@agent-flow` is a placeholder scope. The slot key must equal the published package name. |
| Local `link:` | `cd dsh/dsh-crew && pnpm install`, then install the absolute directory | Development only: linked packages do not get their dependencies installed by the profile. |

Recipients do not need Node/pnpm installed themselves; DSH's Plugin Manager runs the
installation. They do need a credentialed provider; the shipped defaults use
`deepseek-account` and can be changed in **Plugins → Crew** after installation.

The preset ids are namespaced (`crew-*`) and the bundle never overrides the shipped
`standard` preset, so it can coexist with other bundles, including the Agent Teams
bundle.

## Maintainer checks

Run these after editing the bundle:

```sh
ruby -ryaml -e '
  raw = File.read("dsh/dsh-crew/cordis.patch.yml").gsub(/!!js .*$/, "false")
  doc = YAML.load(raw)
  raise "expected one insert entry" unless doc.is_a?(Array) && doc.size == 1 && doc[0]["insert"]
  rows = doc[0]["insert"]
  presets = rows.select { |r| r["name"] == "@deepseek-ai/dsh-agent-preset" }
  raise "expected 5 presets, got #{presets.size}" unless presets.size == 5
  raise "missing crew-config row" unless rows.any? { |r| r["id"] == "crew-config" && r["name"] == "@agent-flow/dsh-crew" }
  puts "ok: #{presets.size} presets + crew-config"
'
python3 -c 'import json,sys; [json.load(open(p)) for p in sys.argv[1:]]; print("ok: json")' \
  dsh/dsh-crew/package.json dsh/dsh-crew/locale/zh.json dsh/dsh-crew/locale/en.json
node --check dsh/dsh-crew/lib/index.js
node --check dsh/dsh-crew/client.js
# Config defaults (run from dsh/dsh-crew so its node_modules resolves):
(cd dsh/dsh-crew && node -e 'import("./lib/index.js").then((m) => {
  const parsed = m.Config();
  console.log("ok: schema", parsed.roles.architect.model.get(), parsed.roles.architect.persona.get().slice(0, 20));
})')
```

There is no automated test suite for the bundle; installation in a disposable
profile plus a single `crew_explore` call (and inspecting the child session's
`request/header` + `system/message`) is the end-to-end smoke test.
