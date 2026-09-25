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

Builder 也是轻量控制面，因此不再增加第五个付费 Orchestrator。子 Agent 在独立 child session 中运行，避免把搜索过程和 Sol 推理长期堆在主上下文里。

```text
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
3. 用 `/work 你的需求` 启动完整流程，也可以直接向默认 Builder 描述任务。
4. 需要换会话时先运行 `/checkpoint`，再运行原生 `/new`，最后在新会话运行 `/continue-task`。
5. 需要手工调用角色时可使用 `@architect`、`@planner`、`@reviewer` 或 `@explore`。

`/continue-task` 特意没有命名为 `/resume`，因为 `/resume` 是 OpenCode 原生的会话列表命令。

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
