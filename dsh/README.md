# DeepSeek Harness (DSH) integration

This directory carries the optional DeepSeek Harness side of the repository. The
OpenCode workflow in `.opencode/`, `opencode.json`, and the state protocol in
`AGENTS.md` is unchanged and remains the primary workflow. Nothing here is loaded
by OpenCode.

## Layout

| Path | Purpose |
|---|---|
| `dsh/dsh-crew/` | A self-contained DSH **bundle**: one selectable `crew` preset plus four read-only role presets (`crew-explore`, `crew-architect`, `crew-planner`, `crew-reviewer`), each bound to an LLM route through `agentOptions` |
| `dsh/dsh-crew/cordis.patch.yml` | The bundle payload: preset declarations and the model-bound delegation tool instances |
| `dsh/dsh-crew/package.json` | Package manifest; `dsh.bundle.patch` is what makes it a bundle |

## Coexistence with the OpenCode workflow

The two clients are independent and can share this repository:

| Concern | OpenCode | DeepSeek Harness |
|---|---|---|
| Entry config | `opencode.json`, `.opencode/` | `~/.dsh/profiles/<profile>/` (outside the repo) |
| Role model | `.opencode/agents/*.md` | Agent presets (this bundle) |
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
  provider routes in the preset. They do not need to match, but keep the cheap/strong
  split consistent if you compare results.

## Install

```sh
# Desktop: Plugins -> Add plugin -> Install third-party plugin
#   npm name:  @agent-flow/dsh-crew
#   git:       git+https://github.com/<owner>/agent_flow.git#<commit>&path:/dsh/dsh-crew
#   or a local absolute path to dsh/dsh-crew

# CLI
dsh plugin --profile desktop add @agent-flow/dsh-crew
```

After installation, enable the bundle and start a **new** session with the **Crew**
preset. See [`dsh-crew/README.md`](dsh-crew/README.md) for the role table, model
route editing, verification, and uninstall.

## Sharing

The bundle is the sharing unit. It can be distributed as:

- an npm package (`npm publish` from `dsh/dsh-crew`),
- a Git URL pinned to a commit (append `&path:/dsh/dsh-crew` when installing from
  this monorepo),
- a tarball or local path.

Anyone installing it must edit the four `agentOptions` routes to match their own
providers. The preset ids are namespaced (`crew-*`) and the bundle never overrides
the shipped `standard` preset, so it can coexist with other bundles, including the
Agent Teams bundle.

## Maintainer checks

Run these after editing the bundle:

```sh
ruby -ryaml -e '
  raw = File.read("dsh/dsh-crew/cordis.patch.yml").gsub(/!!js .*$/, "false")
  doc = YAML.load(raw)
  raise "expected one insert entry" unless doc.is_a?(Array) && doc.size == 1 && doc[0]["insert"]
  presets = doc[0]["insert"].select { |r| r["name"] == "@deepseek-ai/dsh-agent-preset" }
  raise "expected 5 presets, got #{presets.size}" unless presets.size == 5
  puts "ok: #{presets.size} presets"
'
python3 -c 'import json,sys; [json.load(open(p)) for p in sys.argv[1:]]; print("ok: json")' \
  dsh/dsh-crew/package.json dsh/dsh-crew/locale/zh.json dsh/dsh-crew/locale/en.json
node --check dsh/dsh-crew/lib/index.js
```

There is no automated test suite for the bundle; installation in a disposable
profile plus a single `crew_explore` call is the end-to-end smoke test.
