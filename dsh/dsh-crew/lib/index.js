/**
 * dsh-crew — the Host half of the Crew bundle.
 *
 * One Host entry (`crew-config`) owns everything that is configurable at
 * runtime:
 *
 * - a Schemastery Config holding one uniform `roles` list. Every role carries
 *   an id, display name, enabled flag, access boundary, provider, model,
 *   reasoning effort, and persona. There is no built-in/custom split: the
 *   initial role set is ordinary seeded data and every role is a peer.
 * - one global delegation tool per enabled role (`crew_<id>`) that reads the
 *   live Config at execute time and starts a managed child activation through
 *   `ctx.subagents`.
 * - identity and model routing passed with every delegation: the persona is
 *   prepended to the child's task as its role preamble, the model route travels
 *   as `agentOptions`, and the role's access selects one of two child boundaries:
 *   `crew-role` (read-only, no commands) or `crew-writer` (read/write/edit plus
 *   the shell). This DSH build ignores a per-request `toolFilter`, so the preset
 *   is the enforced boundary.
 *
 * The Orchestrator is the main session itself (the `crew` preset persona), so
 * it is not a configurable delegation tool.
 *
 * Roles are ordinary (not volatile) config: saving the role list through the
 * bundle's own route rewrites the profile patch and the Loader reloads this
 * plugin, so enabling or disabling a role adds or removes its tool without
 * restarting the app. Disabled roles keep their settings and can be re-enabled
 * from the configuration page.
 *
 * @module @agent-flow/dsh-crew
 */

import z from '@deepseek-ai/schemastery';

/** Cordis plugin name, used in diagnostics. */
export const name = 'crew-config';

/** Host services the plugin registers against. */
export const inject = ['tools', 'subagents'];

/** HTTP path the browser half uses to read the model catalog (same origin). */
const CATALOG_PATH = '/agent-flow/dsh-crew/catalog';

/** HTTP path the browser half uses to read/write the role list. */
const ROLES_PATH = '/agent-flow/dsh-crew/roles';

/** Upper bound on configured roles (each enabled role adds one global tool). */
const MAX_ROLES = 12;

/** Accepted role id; it becomes the `crew_<id>` tool suffix. */
const ROLE_ID_PATTERN = /^[a-z][a-z0-9_]{0,31}$/;

/** Ids that cannot become delegation tools. The main session is the Orchestrator. */
const RESERVED_ROLE_IDS = new Set(['orchestrator']);

/** Ordered access boundaries a role can request. */
export const ACCESS_VALUES = ['read', 'exec', 'write'];

/**
 * Child boundary preset per access. `exec` shares the write preset because this
 * DSH build cannot subtract write/edit from it per delegation; the Tester
 * persona carries the "do not edit implementation code" rule instead.
 */
const CHILD_PRESET = {
  read: 'crew-role',
  exec: 'crew-writer',
  write: 'crew-writer',
};

/** Every child boundary preset this bundle may mount for a role. */
const CHILD_PRESETS = new Set(Object.values(CHILD_PRESET));

/** One-line boundary description used in the model-facing tool description. */
const ACCESS_BOUNDARY = {
  read: 'the child is read-only (no write/edit tools, no commands)',
  exec: 'the child gets read/write/edit and the shell but must not edit implementation code',
  write: 'the child may read, write, and edit files and run commands',
};

/** Catalog cache lifetime; provider/model discovery is comparatively expensive. */
const CATALOG_TTL_MS = 30_000;

/** Per-provider bound so one slow adapter cannot stall the whole catalog. */
const PROVIDER_TIMEOUT_MS = 6_000;

/**
 * Race a promise against a deadline.
 * @template T
 * @param {Promise<T>} promise - operation to bound.
 * @param {number} ms - deadline in milliseconds.
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * Build the provider/model/effort directory the configuration page suggests.
 * Providers and models come from the live `llm` registry; each provider is
 * bounded independently so an unresponsive adapter cannot block the rest.
 * @param {object} llm - host LLM registry service.
 * @returns {Promise<Array<object>>} provider groups with models and efforts.
 */
async function buildCatalog(llm) {
  const providers = llm.listProviders();
  const groups = [];
  for (const provider of providers) {
    try {
      const models = await withTimeout(llm.listModels(provider.id), PROVIDER_TIMEOUT_MS);
      const entries = [];
      for (const model of models) {
        let reasoning;
        try {
          const resolved = await withTimeout(llm.resolveModelInfo(provider.id, model.id), PROVIDER_TIMEOUT_MS);
          if (resolved.reasoning !== undefined) {
            reasoning = {
              efforts: resolved.reasoning.efforts.map((effort) => ({ id: effort.id, name: effort.name })),
              ...(resolved.reasoning.defaultEffort === undefined
                ? {}
                : { defaultEffort: resolved.reasoning.defaultEffort }),
            };
          }
        } catch (_error) {
          reasoning = undefined;
        }
        entries.push({ id: model.id, name: model.name, ...(reasoning === undefined ? {} : { reasoning }) });
      }
      groups.push({ id: provider.id, name: provider.name, models: entries });
    } catch (error) {
      groups.push({ id: provider.id, name: provider.name, models: [], error: String(error) });
    }
  }
  return groups;
}

/**
 * The initial role set. Every role is seeded at the same priority (same
 * provider/model) and can be enabled, disabled, edited, or removed from the
 * configuration page afterwards. These are ordinary config data, not special
 * code paths: an installation that saves its own list replaces them entirely.
 */
export const ROLE_SEEDS = [
  {
    id: 'analyst',
    name: '需求分析',
    enabled: true,
    access: 'read',
    provider: 'deepseek-account',
    model: 'deepseek-flash',
    reasoningEffort: '',
    persona:
      '你是 Analyst（需求分析），负责把模糊诉求转化为可执行要求。' +
      '梳理用户场景、业务规则、范围和优先级；识别歧义与冲突；制定可验证的验收标准。' +
      '产出需求说明、验收标准与待确认问题。你只做分析与提问，不实现代码。',
  },
  {
    id: 'explorer',
    name: '探索',
    enabled: true,
    access: 'read',
    provider: 'deepseek-account',
    model: 'deepseek-flash',
    reasoningEffort: '',
    persona:
      '你是 Explorer（探索），基于证据查清现状和约束。' +
      '阅读代码与资料，调查依赖和已有实现，定位问题，验证假设，识别约束与风险。' +
      '产出带文件与行号证据的现状分析、定位结果和约束清单。你只读，不修改文件。',
  },
  {
    id: 'architect',
    name: '架构',
    enabled: true,
    access: 'read',
    provider: 'deepseek-account',
    model: 'deepseek-flash',
    reasoningEffort: '',
    persona:
      '你是 Architect（架构），制定系统结构和技术方案。' +
      '设计模块边界、接口、数据结构和数据流；评估技术取舍；规划实施步骤。' +
      '产出架构方案、接口约定和技术决策。你不修改文件，只给出可执行的方案。',
  },
  {
    id: 'designer',
    name: '设计',
    enabled: true,
    access: 'write',
    provider: 'deepseek-account',
    model: 'deepseek-flash',
    reasoningEffort: '',
    persona:
      '你是 Designer（设计），定义用户如何理解和使用产品。' +
      '设计用户流程、信息结构、交互和视觉；覆盖加载、空白、错误等状态；考虑可访问性。' +
      '产出设计方案、交互规范与页面状态说明。' +
      '你可以在工作区内创建和修改设计产物（如 HTML/CSS、原型、设计规范文档），' +
      '但不要改动业务实现逻辑，不提交或推送。',
  },
  {
    id: 'executor',
    name: '执行',
    enabled: true,
    access: 'write',
    provider: 'deepseek-account',
    model: 'deepseek-flash',
    reasoningEffort: '',
    persona:
      '你是 Executor（执行），将需求和方案落实为具体成果。' +
      '按批准的方案实现功能、修改代码或产物，完成必要的开发自测，并修复测试与审查发现的问题。' +
      '产出实现成果、自测结果与变更说明。你可以读写工作区文件并运行命令；' +
      '严格限定在分配范围内，不擅自扩大改动，不提交或推送。',
  },
  {
    id: 'tester',
    name: '测试',
    enabled: true,
    access: 'exec',
    provider: 'deepseek-account',
    model: 'deepseek-flash',
    reasoningEffort: '',
    persona:
      '你是 Tester（测试），独立验证实际行为是否满足要求。' +
      '设计并执行测试，覆盖正常、异常和边界场景，报告可复现的缺陷，验证修复并执行回归。' +
      '产出测试用例、缺陷报告与测试结论。你可以读取文件并执行命令，但不修改实现代码。',
  },
  {
    id: 'reviewer',
    name: '审查',
    enabled: true,
    access: 'read',
    provider: 'deepseek-account',
    model: 'deepseek-flash',
    reasoningEffort: '',
    persona:
      '你是 Reviewer（审查），独立评估成果的质量与风险。' +
      '审查实现和方案，检查正确性、可维护性、安全性及需求遗漏，评估测试证据是否充分。' +
      '产出审查意见、问题分级与审查结论。你只读，不修改文件。',
  },
];

/** Copy the seed list so schema defaults and callers never share one array. */
export function seedRoles() {
  return ROLE_SEEDS.map((role) => ({ ...role }));
}

/**
 * Schemastery config for one role. Every field is ordinary config (not
 * volatile): adding, removing, enabling, or disabling a role changes the
 * registered tool set, so the Loader reloads this plugin on save.
 */
const roleSchema = z.object({
  id: z.string().default(''),
  name: z.string().default(''),
  enabled: z.boolean().default(true),
  access: z.string().default('read'),
  provider: z.string().default('deepseek-account'),
  model: z.string().default('deepseek-flash'),
  reasoningEffort: z.string().default(''),
  persona: z.string().default(''),
});

/**
 * Live Crew configuration. One uniform role list; the Orchestrator is the main
 * session and is deliberately not a row here.
 */
export const Config = z
  .object({
    roles: z.array(roleSchema).default(seedRoles()),
  })
  .default({});

/**
 * Coerce a possibly-missing string to a trimmed string.
 * @param {unknown} value - raw config or request value.
 * @returns {string} the trimmed string, or ''.
 */
function textOf(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Normalize one raw role. Invalid ids are rejected; other fields are coerced,
 * with the access boundary mapped to the safe `read` value when unrecognized.
 * @param {unknown} raw - candidate role object.
 * @returns {object | undefined} the normalized role, or undefined for a bad id.
 */
function normalizeRole(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const id = textOf(raw.id);
  if (!ROLE_ID_PATTERN.test(id)) return undefined;
  const access = textOf(raw.access);
  return {
    id,
    name: textOf(raw.name),
    enabled: raw.enabled !== false,
    access: ACCESS_VALUES.includes(access) ? access : 'read',
    provider: textOf(raw.provider),
    model: textOf(raw.model),
    reasoningEffort: textOf(raw.reasoningEffort),
    persona: typeof raw.persona === 'string' ? raw.persona : '',
  };
}

/**
 * Read and validate one role from raw config for a specific id.
 * @param {object} config - parsed plugin Config.
 * @param {string} id - role id.
 * @returns {object | undefined} the normalized role.
 */
function findRole(config, id) {
  const list = Array.isArray(config?.roles) ? config.roles : [];
  for (const raw of list) {
    const role = normalizeRole(raw);
    if (role !== undefined && role.id === id) return role;
  }
  return undefined;
}

/**
 * Read the valid roles from the live config, de-duplicated and bounded.
 * Invalid hand-written entries are skipped; an invalid access boundary falls
 * back to the safe read-only value.
 * @param {object} config - parsed plugin Config.
 * @param {object} [logger] - plugin logger for warnings.
 * @returns {Array<object>} normalized roles in configured order.
 */
function rolesOf(config, logger) {
  const list = Array.isArray(config?.roles) ? config.roles : [];
  const seen = new Set();
  const roles = [];
  for (const entry of list) {
    const role = normalizeRole(entry);
    if (role === undefined) {
      logger?.warn('crew-config: skipping a role whose id must match %s', ROLE_ID_PATTERN.source);
      continue;
    }
    if (RESERVED_ROLE_IDS.has(role.id)) {
      logger?.warn('crew-config: skipping reserved role id "%s"', role.id);
      continue;
    }
    if (seen.has(role.id)) {
      logger?.warn('crew-config: skipping duplicate role "%s"', role.id);
      continue;
    }
    seen.add(role.id);
    roles.push(role);
    if (roles.length >= MAX_ROLES) {
      if (list.length > MAX_ROLES) {
        logger?.warn('crew-config: only the first %d configured roles are registered', MAX_ROLES);
      }
      break;
    }
  }
  return roles;
}

/**
 * Validate a complete role list submitted by the browser editor.
 * @param {unknown} input - candidate list.
 * @returns {{ roles?: Array<object>, error?: string }} the accepted list or a message.
 */
function validateRoles(input) {
  if (!Array.isArray(input)) return { error: 'roles must be an array' };
  if (input.length > MAX_ROLES) return { error: `at most ${MAX_ROLES} roles are supported` };
  const seen = new Set();
  const roles = [];
  for (const [index, raw] of input.entries()) {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return { error: `role ${index + 1}: expected an object` };
    }
    const role = normalizeRole(raw);
    if (role === undefined) {
      return { error: `role ${index + 1}: "id" must match ${ROLE_ID_PATTERN.source}` };
    }
    if (RESERVED_ROLE_IDS.has(role.id)) return { error: `role id "${role.id}" is reserved` };
    if (seen.has(role.id)) return { error: `role id "${role.id}" is already used` };
    if (role.provider.length === 0) return { error: `role "${role.id}": provider is required` };
    if (role.model.length === 0) return { error: `role "${role.id}": model is required` };
    const rawAccess = textOf(raw.access);
    if (!ACCESS_VALUES.includes(rawAccess)) {
      return { error: `role "${role.id}": access must be one of ${ACCESS_VALUES.join(', ')}` };
    }
    const fields = [['name', 64], ['provider', 200], ['model', 200], ['reasoningEffort', 32], ['persona', 4000]];
    for (const [field, max] of fields) {
      if (role[field].length > max) return { error: `role "${role.id}": ${field} exceeds ${max} characters` };
    }
    seen.add(role.id);
    roles.push(role);
  }
  return { roles };
}

/**
 * Buffer and parse one small JSON request body.
 * @param {object} req - Node request stream.
 * @param {number} limit - maximum accepted bytes.
 * @returns {Promise<any>} the parsed JSON value.
 */
function readJsonBody(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length === 0 ? {} : JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (_error) {
        reject(new Error('request body must be JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Read one request header as a string.
 * @param {object} req - Node request.
 * @param {string} name - lowercase header name.
 * @returns {string | undefined} the header value, or undefined when absent.
 */
function headerOf(req, name) {
  const value = req?.headers?.[name];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/** Hostnames this bundle treats as the local machine. */
const LOOPBACK_HOSTNAMES = new Set(['127.0.0.1', 'localhost', '[::1]']);

/**
 * Fence a raw webServer route. DSH's raw routes sit outside the `/api`
 * Host/Origin fence and browser authentication, so this bundle applies its own
 * minimal fence before reading or writing configuration:
 *
 * - a browser `Sec-Fetch-Site` other than `same-origin`/`none` is refused;
 * - the `Host` authority must be loopback or the server's own advertised
 *   origin, which defeats DNS rebinding that points another hostname at the
 *   local listener;
 * - a present `Origin` must match that authority (cross-origin CSRF).
 *
 * Callers additionally require an `application/json` media type on writes.
 * @param {object} req - Node request.
 * @param {object} webServer - the Host web server service.
 * @returns {boolean} whether the request may use the route.
 */
function isTrustedRequest(req, webServer) {
  const site = headerOf(req, 'sec-fetch-site');
  if (site !== undefined && site !== 'same-origin' && site !== 'none') return false;

  const host = headerOf(req, 'host');
  if (host === undefined) return false;
  let hostname;
  try {
    hostname = new URL(`http://${host}`).hostname;
  } catch {
    return false;
  }

  const origin = headerOf(req, 'origin');
  if (origin !== undefined) {
    try {
      if (new URL(origin).host !== host) return false;
    } catch {
      return false;
    }
  }

  if (LOOPBACK_HOSTNAMES.has(hostname)) return true;
  let localHostname;
  try {
    localHostname = new URL(webServer.getOrigin()).hostname;
  } catch {
    localHostname = undefined;
  }
  return localHostname !== undefined && hostname === localHostname;
}

/**
 * Read one required, non-empty string argument.
 * @param {unknown} value - model-supplied argument.
 * @param {string} field - argument name for the diagnostic.
 */
function requireText(value, field) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`crew: "${field}" must be a non-empty string`);
  }
  return value;
}

/**
 * Delegation budget for one role child.
 *
 * In DSH 0.2.1-rc.2 `request.maxDepth` is an ABSOLUTE depth cap: the manager
 * computes `childDepth = parentDepth + 1` and rejects the activation when
 * `childDepth > maxDepth`. A literal `maxDepth: 0` therefore fails to start
 * the child from a top-level parent ("subagent depth 1 exceeds maxDepth 0").
 * What the Crew needs is the relative policy "the child may delegate zero
 * further levels" (the role presets mount no delegation tools anyway), so the
 * absolute cap is the child's own depth:
 *
 *   maxDepth = parentDepth + 1 + 0
 *
 * A depth-0 Lead gets 1 (direct children only, grandchildren rejected); a
 * nested caller at depth N gets N+1.
 * @param {object} parent - the calling agent.
 * @returns {number} the absolute depth cap to put in the activation request.
 */
function childMaxDepth(parent) {
  const parentDepth = parent?.session?.header?.delegationDepth ?? 0;
  const depth = Number.isSafeInteger(parentDepth) && parentDepth > 0 ? parentDepth : 0;
  return depth + 1;
}

/**
 * Build the model-facing delegation tool for one configured role.
 * @param {object} ctx - plugin context.
 * @param {object} config - live plugin Config.
 * @param {object} role - normalized role snapshot used for the tool description.
 */
function defineRoleTool(ctx, config, role) {
  const toolName = `crew_${role.id}`;
  const display = role.name.length > 0 ? role.name : role.id;
  const boundary = ACCESS_BOUNDARY[role.access];
  const delegationLimits =
    role.access === 'write'
      ? 'The child may modify files: keep the task confined to the assigned scope.'
      : role.access === 'exec'
        ? 'The child may run verification commands; do not delegate implementation or file edits.'
        : 'Do not delegate writing, editing, or verification commands.';
  return {
    name: toolName,
    description:
      `Delegate one bounded task to the Crew "${display}" role (${role.id}). ` +
      `The child runs under the shared "${CHILD_PRESET[role.access]}" Agent Preset, where ${boundary}. ` +
      `It uses the provider, model, reasoning effort, and persona currently saved in the Crew ` +
      `configuration (Plugins → Crew). ` +
      `This tool starts an independently managed child and immediately returns its id; ` +
      `the runtime notifies you when it finishes. ${delegationLimits}`,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        description: {
          type: 'string',
          description: 'A short (3-5 word) description of the delegated task, for display.',
        },
        prompt: {
          type: 'string',
          description:
            'The complete, self-contained task for the child. It does not share this conversation, ' +
            'so include every fact, question, and constraint it needs.',
        },
        cwd: {
          type: 'string',
          description:
            'Optional initial child working directory. Relative paths resolve against your current ' +
            'directory; omission inherits it.',
        },
      },
      required: ['description', 'prompt'],
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          kind: { type: 'string', const: 'activation' },
          subagentId: { type: 'string' },
        },
        required: ['kind', 'subagentId'],
      },
      render(_args, value) {
        return [{ type: 'text', text: `started subagent ${value.subagentId}` }];
      },
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const parent = exec.agent;
      if (parent === undefined) throw new Error(`crew: ${toolName} requires a calling agent`);
      const description = requireText(args?.description, 'description');
      const prompt = requireText(args?.prompt, 'prompt');
      if (args?.cwd !== undefined && (typeof args.cwd !== 'string' || args.cwd.length === 0)) {
        throw new Error('crew: "cwd" must be a non-empty string when supplied');
      }

      const current = findRole(config, role.id);
      if (current === undefined) {
        throw new Error(
          `crew: role "${role.id}" is no longer configured. ` +
            `Open the bundle configuration page (Plugins → Crew) and review the role list.`,
        );
      }
      if (!current.enabled) {
        throw new Error(
          `crew: role "${role.id}" is disabled. ` +
            `Enable it on the bundle configuration page (Plugins → Crew) to delegate again.`,
        );
      }
      if (current.provider.length === 0 || current.model.length === 0) {
        throw new Error(
          `crew: role "${role.id}" has no provider/model configured. ` +
            `Open the bundle configuration page (Plugins → Crew) and save a provider and model for it.`,
        );
      }

      const agentOptions = {
        provider: current.provider,
        model: current.model,
        ...(current.reasoningEffort.length > 0
          ? { reasoningEffort: current.reasoningEffort }
          : {}),
      };

      const identity = current.persona.length > 0
        ? current.persona
        : `You are ${display}, a Crew role.`;
      const started = await ctx.subagents.startActivation({
        provider: 'spawn',
        label: description,
        delivery: 'parent',
        signal: exec.signal,
        request: {
          prompt: [{ type: 'text', text: `${identity}\n\n${prompt}` }],
          parent,
          agentPreset: CHILD_PRESET[current.access],
          agentOptions,
          // Forward-compatible request fact. This DSH build conveys identity
          // through the role preamble above and ignores a request-level
          // `toolFilter`; the child preset is the enforced tool boundary.
          // Relative budget 0 below the child, expressed as the absolute cap
          // this runtime actually interprets (see childMaxDepth()).
          maxDepth: childMaxDepth(parent),
          ...(args.cwd !== undefined ? { cwd: args.cwd } : {}),
        },
      });

      return { kind: 'activation', subagentId: started.childId };
    },
  };
}

/**
 * Install the Crew Host contribution.
 * @param {object} ctx - plugin context.
 * @param {object} config - parsed plugin Config.
 */
export function apply(ctx, config) {
  // This plugin ships its own configuration page, so the Settings service must
  // not offer a generated page for the same entry.
  ctx.inject(['settings'], (child) => {
    child.effect(
      () => child.settings.configure({ auto: false }, ctx.fiber),
      'crew-config: settings page',
    );
  });

  // Browser-side suggestion source: an HTTP route owned by this plugin, so the
  // configuration page does not depend on the session-scoped client Remote
  // namespaces (those are unavailable on the root Plugins page).
  ctx.inject(['llm', 'webServer'], (child) => {
    let cache;
    let inflight;
    const catalog = (force = false) => {
      const now = Date.now();
      if (!force && cache !== undefined && now - cache.at < CATALOG_TTL_MS) return Promise.resolve(cache.groups);
      if (inflight !== undefined) return inflight;
      inflight = buildCatalog(child.llm)
        .then((groups) => {
          cache = { at: Date.now(), groups };
          return groups;
        })
        .finally(() => {
          inflight = undefined;
        });
      return inflight;
    };
    child.effect(() => child.webServer.register({
      kind: 'exact',
      path: CATALOG_PATH,
      handler: (req, res) => {
        const send = (status, body) => {
          const text = JSON.stringify(body);
          res.writeHead(status, {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
            'content-length': Buffer.byteLength(text),
          });
          res.end(text);
        };
        if (!isTrustedRequest(req, child.webServer)) {
          send(403, { error: 'forbidden' });
          return;
        }
        if (req.method !== 'GET') {
          send(405, { error: 'method-not-allowed' });
          return;
        }
        catalog(req.url !== undefined && req.url.includes('refresh=1'))
          .then((groups) => send(200, { groups }))
          .catch((error) => send(500, { error: error instanceof Error ? error.message : String(error) }));
      },
    }), 'crew-config: model catalog route');
  });

  // Browser-side editor for the complete role list. Roles are ordinary config:
  // a save rewrites this entry through the configuration editor, the Loader
  // reloads the plugin, and the enabled role tools appear or disappear without
  // an app restart.
  ctx.inject(['configEditor', 'webServer'], (child) => {
    child.effect(() => child.webServer.register({
      kind: 'exact',
      path: ROLES_PATH,
      handler: (req, res) => {
        const send = (status, body) => {
          const text = JSON.stringify(body);
          res.writeHead(status, {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
            'content-length': Buffer.byteLength(text),
          });
          res.end(text);
        };
        if (!isTrustedRequest(req, child.webServer)) {
          send(403, { ok: false, error: 'forbidden' });
          return;
        }
        if (req.method === 'GET') {
          send(200, {
            roles: rolesOf(config, ctx.logger),
            limits: {
              maxRoles: MAX_ROLES,
              idPattern: ROLE_ID_PATTERN.source,
              access: ACCESS_VALUES,
              reserved: [...RESERVED_ROLE_IDS],
            },
          });
          return;
        }
        if (req.method !== 'POST') {
          send(405, { ok: false, error: 'method-not-allowed' });
          return;
        }
        const mediaType = headerOf(req, 'content-type') ?? '';
        if (!mediaType.toLowerCase().startsWith('application/json')) {
          send(415, { ok: false, error: 'content-type must be application/json' });
          return;
        }
        readJsonBody(req)
          .then((body) => {
            const validated = validateRoles(body === null || typeof body !== 'object' ? undefined : body.roles);
            if (validated.error !== undefined) {
              send(400, { ok: false, error: validated.error });
              return undefined;
            }
            const entry = child.configEditor.entries().find((row) => row.options.id === 'crew-config');
            if (entry === undefined) throw new Error('the crew-config entry is not addressable in this profile');
            return child.configEditor
              .edit(entry, () => ({ roles: validated.roles }))
              .then(() => send(200, { ok: true, roles: validated.roles }));
          })
          .catch((error) => send(500, { ok: false, error: error instanceof Error ? error.message : String(error) }));
      },
    }), 'crew-config: roles route');
  });

  const roles = rolesOf(config, ctx.logger);
  for (const role of roles.filter((entry) => entry.enabled)) {
    ctx.effect(
      () => ctx.tools.register(defineRoleTool(ctx, config, role)),
      `crew-config: crew_${role.id}`,
    );
  }

  // A Crew child must not see any Crew delegation tool. The deny filter checks
  // names against the global/ancestor tool scope when it is registered, so it
  // must name only currently registered tools: including a disabled role's
  // absent name makes the whole restriction fail as an unknown tool.
  const crewToolDenyList = roles.filter((role) => role.enabled).map((role) => `crew_${role.id}`);

  ctx.on('agent/created', ({ agent }) => {
    let preset;
    try {
      preset = agent?.session?.header?.agentPreset;
    } catch (error) {
      ctx.logger.warn(`crew-config: could not read the created child's preset: ${String(error)}`);
      return;
    }
    if (!CHILD_PRESETS.has(preset)) return;
    if (crewToolDenyList.length === 0) return;
    try {
      agent.ctx.tools.restrict({ deny: crewToolDenyList });
    } catch (error) {
      // A denylist naming a tool this composition does not register is not
      // fatal; the child still cannot delegate because its preset mounts no
      // delegation tools and its absolute depth cap leaves no further level.
      ctx.logger.warn(`crew-config: could not narrow the Crew child's tool surface: ${String(error)}`);
    }
  });

  const enabledCount = roles.filter((role) => role.enabled).length;
  ctx.logger.info(
    'crew-config: registered %d of %d configured Crew role tools; child boundaries: %s',
    enabledCount,
    roles.length,
    Object.entries(CHILD_PRESET).map(([access, preset]) => `${access}=${preset}`).join(', '),
  );
}
