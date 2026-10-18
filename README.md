# OpenCode Stateful Multi-Agent Workflow

这是一套项目级 OpenCode 编排配置。目标不是压低推理强度，而是让昂贵模型只看到完成判断所需的最小上下文，并把跨会话状态持久化到仓库文件。

## 教学网站

中文交互式指南：<https://texfu1112-cloud.github.io/agent_flow/>

网站是 `docs/` 下的无依赖静态文件，可以直接用浏览器打开 `docs/index.html`，也可以启动本地静态服务器：

```text
python3 -m http.server 8000 --directory docs
```

然后访问 <http://localhost:8000/>。修改网站后运行：

```text
node scripts/validate-site.mjs
node --check docs/app.js
```

GitHub Pages 固定从 `main` 分支的 `/docs` 发布；网站使用相对资源路径，不需要构建步骤。

## Agent 分工

| Agent | 模型 | 推理 | 作用 |
|---|---|---|---|
| Builder | `opencode/deepseek-v4.1-flash` | `max` | 默认主 Agent、编排、编码、构建、测试、修复 |
| Explore | `opencode/deepseek-v4.1-flash` | `max` | 只读搜索并生成证据摘要 |
| Architect | `openai/gpt-5.6-sol` | `max` | 重大且长期有效的技术决策 |
| Planner | `openai/gpt-5.6-sol` | `max` | 非平凡任务的可执行计划 |
| Reviewer | `openai/gpt-5.6-sol` | `max` | 基于任务、diff 和测试结果做审查 |
| Requirements Reviewer | `openai/gpt-5.6-sol` | `max` | 讨论结束后审阅需求：歧义、验收缺口、范围风险 |

Builder 也是轻量控制面，因此不再增加付费 Orchestrator。子 Agent 在独立 child session 中运行，避免把搜索过程和 Sol 推理长期堆在主上下文里。

```text
需求入口
  /work            需求明确，直接进入流程
  /work_with_talk  需求模糊，先讨论 → requirements-reviewer 审阅 → ready/execute

User request
     |
     v
Builder/Flash -----> Explore/Flash -----> CONTEXT.md
     |                                      |
     +---- architecture gate --> Architect/Sol
     |                                      |
     +---- planning gate -----> Planner/Sol
     |
     +---- edit + build + test
     |
     +---- review gate -------> Reviewer/Sol
     |                              |
     +<--------- fix if needed -----+
     |
     v
TASK.md checkpoint + concise result
```

## 成本控制

- Sol 不扫描仓库。它只读取需求、验收条件、压缩后的状态文件、相关路径或 diff、测试结论。
- Architect 只在公共接口、持久化 schema、安全边界、基础设施、跨模块重构等难逆决策上调用。
- Planner 只在非平凡、跨组件、有迁移或明显风险的工作上调用。
- Reviewer 只审当前任务的变更，不重新理解整个项目。
- Requirements Reviewer 只在讨论结束或需求变更后运行，只审需求本身，不做方案设计。
- `tool_output` 截断大输出；自动 compaction 会裁剪旧工具结果，只保留最近 6 个用户回合。
- `.opencode/plugins/stateful-compaction.js` 在压缩前注入最新 `TASK.md`，保证压缩摘要不会丢失任务状态。
- 一个主会话原则上只处理一个任务。无关新任务使用新会话。

## 状态文件

| 文件 | 生命周期 | 内容 |
|---|---|---|
| `AGENTS.md` | 长期 | 工作规则和上下文预算，OpenCode 自动加载 |
| `ARCHITECTURE.md` | 长期 | 当前边界、数据流和不变量 |
| `DECISIONS.md` | 长期 | 已接受且影响未来任务的技术决策 |
| `TASK.md` | 单任务 | 当前阶段、计划、进度、测试、Review、下一步 |
| `.opencode/state/CONTEXT.md` | 单次调查 | Explore 产出的证据摘要，可随时替换 |

聊天记录是最低优先级信息源。新会话应只依赖这些文件、当前工作树和测试产物恢复工作。

## 使用

1. 在项目目录启动或重启 OpenCode。配置文件、Agent、命令和插件不会在运行中的会话里热加载。
2. 确保 `/connect` 已配置能访问两个模型的 provider。
3. 需求明确时用 `/work 你的需求`；需求还模糊、需要先讨论时用 `/work_with_talk 你的想法`。讨论并审阅完成后，再 `/new` 开新会话并运行 `/continue-task` 执行。
4. 需要换会话时先运行 `/checkpoint`，再运行原生 `/new`，最后在新会话运行 `/continue-task`。
5. 需要手工调用角色时可使用 `@architect`、`@planner`、`@reviewer`、`@requirements-reviewer` 或 `@explore`。

`/continue-task` 特意没有命名为 `/resume`，因为 `/resume` 是 OpenCode 原生的会话列表命令。

### 需求讨论流程（`/work_with_talk`）

1. Builder 在主对话中提问、给出选项和取舍，逐步确认目标、范围、验收与约束；只更新 `TASK.md`，不写代码。
2. 确认后的需求写入 `TASK.md` 的 `Clarified Requirement` 块，带 `Revision` 和用户确认标记。
3. `requirements-reviewer`（`openai/gpt-5.6-sol`）只读审阅，返回 `READY`、`NEEDS_CLARIFICATION` 或 `NEEDS_CONTEXT`。
4. 只有当前 revision 得到 `READY`，Builder 才会写入 `Status: ready` / `Phase: execute`。
5. 你运行 `/new` 开新会话，再运行 `/continue-task`，实现工作才开始。
6. 审阅后需求一旦变化：revision 递增、旧结论作废、需要重新确认和重新审阅。

没有 `Clarified Requirement` 块的历史任务保持原有语义；精确需求的 `/work` 也不会被强制加审阅。

## 全局安装（可选）

默认情况下这是项目级配置：只有在 `/Users/xiafu/source/agent_flow`（或自带同一套文件的目录）里启动 OpenCode 才会生效。如果希望**任意文件夹**都能使用这套工作流，可以把同一份定义部署到全局配置：

```text
mkdir -p ~/.config/opencode/agents ~/.config/opencode/commands ~/.config/opencode/plugins
cp .opencode/agents/*.md ~/.config/opencode/agents/
cp .opencode/commands/*.md ~/.config/opencode/commands/
cp .opencode/plugins/stateful-compaction.js ~/.config/opencode/plugins/
```

然后在 `~/.config/opencode/opencode.jsonc` 中声明插件（保留文件里已有的其他字段）：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "file:///Users/<你的用户名>/.config/opencode/plugins/stateful-compaction.js"
  ]
}
```

重启 OpenCode 后，任意目录都可以用 `/work <需求>` 或 `@builder` 进入流程。

全局安装的约定：

- 全局配置**不设置** `default_agent`，避免改变其他项目的默认 Agent；只有你主动运行 `/work` 或 `@builder` 才进入这套工作流。
- 插件读取的是当前项目的 `TASK.md`；项目里没有该文件时自动跳过。
- 压缩插件是幂等的，因此全局与项目同时加载时不会重复注入检查点。
- 本仓库仍是唯一事实来源；修改 Agent、命令或插件后需要重新复制到全局并重启客户端。

## DeepSeek Harness 组合包（可选）

仓库同时提供一个可选的 [DeepSeek Harness](https://deepseek.com) 组合包 [`dsh/dsh-crew`](dsh/dsh-crew/)，把「便宜模型探索 + 强模型架构/计划/审查」固化成四个只读角色预设，并提供一个带 GUI 配置页的 Host 插件：四个角色（explore/architect/planner/reviewer）的 provider、model、reasoningEffort、persona 在 **插件 → Crew** 页面里用表格编辑，保存后下一次委派立即生效（volatile 配置，无需重启）；`crew_explore` / `crew_architect` / `crew_planner` / `crew_reviewer` 四个委派工具在所有会话中可用。它不修改 OpenCode 的任何配置，两者可以并存。

### 分享给别人安装

安装的本质是给 DSH 插件管理器一个它能解析的包 spec：**本机文件夹绝对路径**、Git URL、tarball 或 npm 包名都可以。

- **你本机现在就是这么装的**：profile 里记录的是 `link:/Users/xiafu/source/agent_flow/dsh/dsh-crew`，属于「文件夹安装」。
- **文件夹安装只对「能拿到这个文件夹的机器」有效**：别人克隆了本仓库或有同一份文件夹时，填文件夹绝对路径即可（链接安装不会代装依赖，需要该目录里已有 `node_modules`，见方式 A）。
- **对方没有这个文件夹时**，用 Git URL 或 tarball（依赖由插件管理器自动安装，对方不需要 Node/pnpm）。

前提：对方使用 DSH `0.2.1-rc.x`，且已配置好至少一个可用 provider（例如 `deepseek-account` 账号登录）。

**方式 A：文件夹安装（本机开发 / 对方也持有该文件夹）**

1. 安装依赖（链接安装从 bundle 自己的目录解析依赖，必须先装一次）：

   ```sh
   cd dsh/dsh-crew && pnpm install     # 生成 node_modules/@deepseek-ai/schemastery
   ```

2. DSH Desktop：**插件 → 添加插件 → 安装第三方插件**，填 bundle 文件夹的**绝对路径**：

   ```text
   /path/to/agent_flow/dsh/dsh-crew
   ```

   （本机当前就是 `/Users/xiafu/source/agent_flow/dsh/dsh-crew`；profile 会把它记为 `link:`。）
3. **启用** bundle。

> 如果对方不想装 Node/pnpm，也可以把 `dsh/dsh-crew` 文件夹**连同其 `node_modules` 一起**压缩发过去，对方解压后填该文件夹的绝对路径即可。

**方式 B：从 GitHub 安装（分享推荐）**

先 commit + push（Git 安装只读取已推送的 commit），然后对方在 **添加插件** 里填：

```text
git+https://github.com/texfu1112-cloud/agent_flow.git#<commit>&path:/dsh/dsh-crew
```

`<commit>` 换成 `git rev-parse HEAD` 的结果（固定 commit 最稳，也可用 `#main`）。pnpm 会自动为 `dsh/dsh-crew` 安装依赖（`@deepseek-ai/schemastery`，公共 npm 包）。CLI 等价命令：

```sh
dsh plugin --profile desktop add 'git+https://github.com/texfu1112-cloud/agent_flow.git#<commit>&path:/dsh/dsh-crew'
```

> 仓库为私有时，对方需要先配置 GitHub 凭据；公开仓库可直接安装。

**方式 C：tarball 文件**

维护者打包，把 `.tgz` 发给对方：

```sh
cd dsh/dsh-crew && pnpm pack     # 生成 agent-flow-dsh-crew-0.2.2.tgz
```

对方在 **添加插件** 里填该 tarball 的绝对路径（CLI：`dsh plugin --profile desktop add /abs/path/agent-flow-dsh-crew-0.2.2.tgz`）。

**方式 D：发布到 npm（可选）**

`@agent-flow` 是占位 scope。改成自己的包名时，除 `dsh/dsh-crew/package.json` 的 `name` 外，还要同步 `client.js` 里两处包名：`window.__ModuleLoader__.load({ id: '@agent-flow/dsh-crew' })` 和配置页 slot registration 的 `key: '@agent-flow/dsh-crew'`（slot key 必须等于 bundle 包名，否则配置页不显示）。然后 `cd dsh/dsh-crew && npm publish`，对方直接用包名安装。

### 安装之后

```text
插件 → Crew → 表格编辑四个角色的模型与人设 → 保存
任意会话 → crew_explore / crew_architect / crew_planner / crew_reviewer
```

表格里的 provider / model / 推理强度是从当前模型目录读取的下拉框（带「自定义…」可切回手输；目录状态在表格下方有提示）。保存只影响下一次委派，无需重启。验证：调用一次 `crew_explore`，用返回的 child id 查看 `~/.dsh/sessions/<cwd转义>/<childId>/session.v4.jsonl.zstd` 中的 `request/header`（模型）与 `system/message`（人格）。卸载：**插件 → Installed plugins → Crew → Remove**，或 `dsh plugin --profile desktop remove @agent-flow/dsh-crew`。

详细配置、HMR 验证与故障排查见 [`dsh/dsh-crew/README.md`](dsh/dsh-crew/README.md)；兼容性与维护检查见 [`dsh/README.md`](dsh/README.md)。

## 工程维护

该目录应作为独立 Git 工程维护。Agent、命令、插件、状态协议和文档都纳入版本控制；OpenCode 自动生成的 `.opencode/node_modules`、包清单与锁文件由根级 `.gitignore` 排除。

修改配置后至少执行：

```text
opencode debug config
opencode agent list
node --check .opencode/plugins/stateful-compaction.js
```

修改教学网站时再执行 `node scripts/validate-site.mjs` 和 `node --check docs/app.js`。

不要提交真实 API key、provider 凭据、原始会话导出或大段工具输出。

## 初始化项目知识

这些 Markdown 文件采用可直接替换的模板结构，`TASK.md` 会保留最近一次 checkpoint。首次在真实项目使用时，可以让 Builder 完成一个受控初始化任务：

```text
/work 探索项目并只更新 AGENTS.md 的真实构建命令，以及 ARCHITECTURE.md 的稳定边界和不变量；不要修改业务代码
```

不要一次性把整个仓库摘要塞进 `ARCHITECTURE.md`。只保留跨任务仍有价值、且无法从目录名直接看出的信息。

## 模型替换

当前模型 ID 已按 OpenCode 模型目录配置为：

```text
openai/gpt-5.6-sol
opencode/deepseek-v4.1-flash
```

如果实际账号使用其他 provider，只替换 `opencode.json` 和 `.opencode/agents/*.md` 中的 provider/model ID；角色协议和状态格式无需改变。
