/**
 * dsh-crew — the Host half of the Crew bundle.
 *
 * One Host entry (`crew-config`) owns everything that is configurable at
 * runtime:
 *
 * - a Schemastery Config whose volatile leaves hold four roles
 *   (explore / architect / planner / reviewer) with a provider, model,
 *   reasoning effort, and persona each;
 * - four global delegation tools (`crew_explore`, `crew_architect`,
 *   `crew_planner`, `crew_reviewer`) that read the live Config at execute
 *   time and start a managed child activation through `ctx.subagents`;
 * - a per-child persona override applied through `agent/created`, because
 *   this DSH build no longer accepts `persona` in the activation request
 *   (the request still carries the documented field for forward
 *   compatibility; the scoped prompt section is what actually renders it).
 *
 * The four `crew-*` Agent Presets declared by `cordis.patch.yml` stay the
 * child's tool boundary (read-only); this plugin contributes identity and
 * model routing. Volatile fields let a GUI save take effect on the next
 * delegation without reloading the plugin or restarting the process.
 *
 * @module @agent-flow/dsh-crew
 */

import z from '@deepseek-ai/schemastery';

/** Cordis plugin name, used in diagnostics. */
export const name = 'crew-config';

/** Host services the plugin registers against. */
export const inject = ['tools', 'subagents', 'systemPrompt'];

/** Stable prompt-section name owned by the system prompt registry. */
const PERSONA_PREFIX_SECTION = 'deployment:persona-prefix';

/** HTTP path the browser half uses to read the model catalog (same origin). */
const CATALOG_PATH = '/agent-flow/dsh-crew/catalog';

/** HTTP path the browser half uses to read/write user-defined roles. */
const ROLES_PATH = '/agent-flow/dsh-crew/roles';

/** Read-only Agent Preset mounted by every user-defined role child. */
const CUSTOM_ROLE_PRESET = 'crew-role';

/** Upper bound on user-defined roles (each adds one global tool). */
const MAX_CUSTOM_ROLES = 8;

/** Accepted user-defined role id; it becomes the `crew_<id>` tool suffix. */
const ROLE_ID_PATTERN = /^[a-z][a-z0-9_]{0,31}$/;

/** Limits reported to the browser editor. */
const CUSTOM_ROLE_LIMITS = { maxRoles: MAX_CUSTOM_ROLES, idPattern: ROLE_ID_PATTERN.source };

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

/** Ordered role ids; the order is the GUI table order. */
export const ROLE_NAMES = ['explore', 'architect', 'planner', 'reviewer'];

/** HTTP path of the browser-facing model catalog route. */
export { CATALOG_PATH, ROLES_PATH };

/**
 * Per-role facts: the model-facing tool, the child preset that supplies the
 * read-only tool boundary, and the read-only tool filter forwarded in the
 * activation request.
 */
export const ROLE_INFO = {
  explore: {
    tool: 'crew_explore',
    preset: 'crew-explore',
    toolFilter: { allow: ['read', 'grep', 'glob', 'working_directory', 'load_workspace_dependencies'] },
  },
  architect: {
    tool: 'crew_architect',
    preset: 'crew-architect',
    toolFilter: { allow: ['read', 'grep', 'glob', 'working_directory', 'load_workspace_dependencies'] },
  },
  planner: {
    tool: 'crew_planner',
    preset: 'crew-planner',
    toolFilter: { allow: ['read', 'grep', 'glob', 'working_directory', 'load_workspace_dependencies'] },
  },
  reviewer: {
    tool: 'crew_reviewer',
    preset: 'crew-reviewer',
    toolFilter: { allow: ['read', 'grep', 'glob', 'working_directory', 'load_workspace_dependencies'] },
  },
};

/** Every delegation tool this plugin registers. */
const CREW_TOOL_NAMES = ROLE_NAMES.map((role) => ROLE_INFO[role].tool);

/** Default model routes; both ids belong to the built-in `deepseek-account` catalog. */
const ROLE_DEFAULTS = {
  explore: {
    provider: 'deepseek-account',
    model: 'deepseek-flash',
    reasoningEffort: '',
    persona:
      'You are Explore, the read-only exploration role of the Crew. ' +
      'Investigate exactly the question you are given and return a compact evidence capsule. ' +
      'Search broadly enough to be correct, but never dump raw files or long search results. ' +
      'Every conclusion must name the file and line range that supports it. ' +
      'You cannot edit files or run mutating commands.',
  },
  architect: {
    provider: 'deepseek-account',
    model: 'deepseek-v4-pro',
    reasoningEffort: '',
    persona:
      'You are Architect, the technical decision maker of the Crew. ' +
      'Make one bounded, high-impact technical decision from the evidence you are given; ' +
      'never scan the repository, and name a missing fact instead of guessing it. ' +
      'Weigh boundaries, invariants, failure modes, tradeoffs, migration, and rollback. ' +
      'Prefer the smallest decision consistent with the existing architecture. ' +
      'You cannot modify files.',
  },
  planner: {
    provider: 'deepseek-account',
    model: 'deepseek-v4-pro',
    reasoningEffort: '',
    persona:
      'You are Planner, the implementation planner of the Crew. ' +
      'Turn curated evidence into an implementation-ready plan: ordered edits with paths and symbols, ' +
      'verification commands, edge cases, compatibility concerns, and rollback where applicable. ' +
      'Prefer the smallest viable change and reuse existing abstractions. ' +
      'You cannot modify files.',
  },
  reviewer: {
    provider: 'deepseek-account',
    model: 'deepseek-v4-pro',
    reasoningEffort: '',
    persona:
      'You are Reviewer, the reviewer of the Crew. ' +
      'Review only the diff and task context you are given, never the whole repository. ' +
      'Report findings as blocking issues, non-blocking suggestions, and verification gaps; ' +
      'cite a file and line for every finding and state what evidence would change your conclusion. ' +
      'You cannot edit files.',
  },
};

/**
 * Schemastery config for one role. Every field is volatile: the Loader keeps
 * the parsed reference stable and updates its value in place when the settings
 * form writes a new accepted value.
 * @param {object} defaults - initial provider/model/effort/persona values.
 */
function roleSchema(defaults) {
  return z
    .object({
      provider: z.string().default(defaults.provider).volatile(),
      model: z.string().default(defaults.model).volatile(),
      reasoningEffort: z.string().default(defaults.reasoningEffort).volatile(),
      persona: z.string().default(defaults.persona).volatile(),
    })
    .default({});
}

/**
 * Schema of one user-defined role. These fields are ordinary (not volatile):
 * adding or editing a role changes the registered tool set, so the Loader
 * reloads this plugin and the next delegation uses the new definitions. The
 * four built-in roles stay volatile because editing their routes/persona must
 * not remount the tools.
 */
const customRoleSchema = z.object({
  id: z.string().required(),
  name: z.string().default(''),
  provider: z.string().required(),
  model: z.string().required(),
  reasoningEffort: z.string().default(''),
  persona: z.string().default(''),
});

/**
 * Live Crew configuration. The four role objects are addressed by the
 * settings GUI as `roles.<role>.<field>` paths; every leaf is volatile so a
 * save applies without remounting this plugin. `customRoles` is ordinary
 * config written by the bundle's own `/agent-flow/dsh-crew/roles` route.
 */
export const Config = z
  .object({
    roles: z
      .object({
        explore: roleSchema(ROLE_DEFAULTS.explore),
        architect: roleSchema(ROLE_DEFAULTS.architect),
        planner: roleSchema(ROLE_DEFAULTS.planner),
        reviewer: roleSchema(ROLE_DEFAULTS.reviewer),
      })
      .default({}),
    customRoles: z.array(customRoleSchema).default([]),
  })
  .default({});

/**
 * Read one config leaf. Volatile leaves are references; ordinary values are
 * accepted too so a plain composition still works during migration.
 * @param {unknown} value - config leaf or volatile reference.
 * @returns {string} the current trimmed string value, or an empty string.
 */
function readString(value) {
  const raw =
    value !== null && typeof value === 'object' && typeof value.get === 'function'
      ? value.get()
      : value;
  return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * Read one role's current values from the live config.
 * @param {object} config - parsed plugin Config.
 * @param {string} role - role id.
 */
function readRole(config, role) {
  const roleConfig = config?.roles?.[role];
  return {
    provider: readString(roleConfig?.provider),
    model: readString(roleConfig?.model),
    reasoningEffort: readString(roleConfig?.reasoningEffort),
    persona: readString(roleConfig?.persona),
  };
}

/**
 * Normalize one user-defined role from parsed config or a request body.
 * @param {unknown} raw - candidate role object.
 * @returns {object | undefined} the normalized role, or undefined when invalid.
 */
function normalizeCustomRole(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const provider = typeof raw.provider === 'string' ? raw.provider.trim() : '';
  const model = typeof raw.model === 'string' ? raw.model.trim() : '';
  if (!ROLE_ID_PATTERN.test(id) || provider.length === 0 || model.length === 0) return undefined;
  return {
    id,
    name: typeof raw.name === 'string' ? raw.name.trim() : '',
    provider,
    model,
    reasoningEffort: typeof raw.reasoningEffort === 'string' ? raw.reasoningEffort.trim() : '',
    persona: typeof raw.persona === 'string' ? raw.persona.trim() : '',
  };
}

/**
 * Read the valid user-defined roles from the live config, de-duplicated and
 * bounded. Invalid hand-written entries are skipped with a warning.
 * @param {object} config - parsed plugin Config.
 * @param {object} logger - plugin logger.
 * @returns {Array<object>} normalized roles.
 */
function customRolesOf(config, logger) {
  const list = Array.isArray(config?.customRoles) ? config.customRoles : [];
  const seen = new Set(ROLE_NAMES);
  const roles = [];
  for (const entry of list) {
    const role = normalizeCustomRole(entry);
    if (role === undefined) {
      logger?.warn('crew-config: skipping an invalid custom role (id must match %s; provider/model required)', ROLE_ID_PATTERN.source);
      continue;
    }
    if (seen.has(role.id)) {
      logger?.warn('crew-config: skipping duplicate custom role "%s"', role.id);
      continue;
    }
    seen.add(role.id);
    roles.push(role);
    if (roles.length >= MAX_CUSTOM_ROLES) break;
  }
  return roles;
}

/**
 * Validate a complete user-defined role list submitted by the browser editor.
 * @param {unknown} input - candidate list.
 * @returns {{ roles?: Array<object>, error?: string }} the accepted list or a message.
 */
function validateCustomRoles(input) {
  if (!Array.isArray(input)) return { error: 'roles must be an array' };
  if (input.length > MAX_CUSTOM_ROLES) return { error: `at most ${MAX_CUSTOM_ROLES} custom roles are supported` };
  const seen = new Set(ROLE_NAMES);
  const roles = [];
  for (const [index, raw] of input.entries()) {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return { error: `role ${index + 1}: expected an object` };
    }
    const role = normalizeCustomRole(raw);
    if (role === undefined) {
      return { error: `role ${index + 1}: "id" must match ${ROLE_ID_PATTERN.source} and provider/model must be non-empty` };
    }
    if (seen.has(role.id)) return { error: `role id "${role.id}" is already used` };
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
 * Read the four built-in role values as plain JSON (used when pinning the
 * complete config through the configuration editor).
 * @param {object} config - parsed plugin Config.
 */
function plainRoles(config) {
  const roles = {};
  for (const role of ROLE_NAMES) roles[role] = readRole(config, role);
  return roles;
}

/**
 * Buffer and parse one small JSON request body.
 * @param {object} req - Node request stream.
 * @param {number} limit - maximum accepted bytes.
 * @returns {Promise<any>} the parsed JSON value.
 */
function readJsonBody(req, limit = 64 * 1024) {
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
 * Resolve the Crew role of a live child from its durable session header.
 * @param {{ session?: { header?: { agentPreset?: string } } }} agent
 * @returns {string | undefined} role id when the session runs a crew-* preset.
 */
function roleOfAgent(agent) {
  const preset = agent?.session?.header?.agentPreset;
  if (typeof preset !== 'string') return undefined;
  return ROLE_NAMES.find((role) => ROLE_INFO[role].preset === preset);
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
 * further levels" (the read-only role presets mount no delegation tools
 * anyway), so the absolute cap is the child's own depth:
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
 * Build the model-facing tool for one role. The tool is deliberately thin:
 * the child preset supplies the read-only tool boundary, this tool supplies
 * the configured identity and model route, and the subagent runtime owns the
 * activation, completion notice, and cleanup.
 * @param {object} ctx - plugin context.
 * @param {object} config - live plugin Config.
 * @param {string} role - role id.
 */
function defineRoleTool(ctx, config, role) {
  const info = ROLE_INFO[role];
  const purpose =
    role === 'explore'
      ? 'read-only repository exploration that returns an evidence capsule'
      : role === 'architect'
        ? 'one bounded architecture decision'
        : role === 'planner'
          ? 'an implementation-ready plan'
          : 'a review of a bounded diff';
  return {
    name: info.tool,
    description:
      `Delegate one bounded task to the Crew ${role} role. ` +
      `The child runs under the "${info.preset}" Agent Preset, which mounts only read-only tools, ` +
      `and it uses the provider, model, reasoning effort, and persona currently saved in the Crew ` +
      `configuration (Plugins → Crew). Use it for ${purpose}. ` +
      `This tool starts an independently managed child and immediately returns its id; ` +
      `the runtime notifies you when it finishes. Do not delegate writing, editing, or verification commands.`,
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
      if (parent === undefined) throw new Error(`crew: ${info.tool} requires a calling agent`);
      const description = requireText(args?.description, 'description');
      const prompt = requireText(args?.prompt, 'prompt');
      if (args?.cwd !== undefined && (typeof args.cwd !== 'string' || args.cwd.length === 0)) {
        throw new Error('crew: "cwd" must be a non-empty string when supplied');
      }

      const current = readRole(config, role);
      if (current.provider.length === 0 || current.model.length === 0) {
        throw new Error(
          `crew: role "${role}" has no provider/model configured. ` +
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

      const started = await ctx.subagents.startActivation({
        provider: 'spawn',
        label: description,
        delivery: 'parent',
        signal: exec.signal,
        request: {
          prompt: [{ type: 'text', text: prompt }],
          parent,
          agentPreset: info.preset,
          agentOptions,
          // Forward-compatible request facts. This DSH build applies persona
          // through the scoped prompt section installed on `agent/created`
          // below; `toolFilter` remains declarative because the role preset
          // already mounts only the read-only tools.
          persona: current.persona,
          toolFilter: info.toolFilter,
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
 * Build the model-facing tool for one user-defined role. Unlike the four
 * built-in roles (whose preset carries no persona and whose persona is applied
 * per child), a user-defined role mounts the shared read-only `crew-role`
 * preset and carries its identity in the task preamble, because one preset id
 * cannot distinguish several custom roles.
 * @param {object} ctx - plugin context.
 * @param {object} role - normalized custom role.
 */
function defineCustomRoleTool(ctx, role) {
  const toolName = `crew_${role.id}`;
  const display = role.name.length > 0 ? role.name : role.id;
  return {
    name: toolName,
    description:
      `Delegate one bounded task to the "${display}" Crew role (user-defined in the Crew configuration). ` +
      `The child runs under the "${CUSTOM_ROLE_PRESET}" Agent Preset, which mounts only read-only tools, ` +
      `and it uses the role's configured provider, model, reasoning effort, and persona. ` +
      `This tool starts an independently managed child and immediately returns its id; ` +
      `the runtime notifies you when it finishes. Do not delegate writing, editing, or verification commands.`,
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
      const agentOptions = {
        provider: role.provider,
        model: role.model,
        ...(role.reasoningEffort.length > 0 ? { reasoningEffort: role.reasoningEffort } : {}),
      };
      const text = role.persona.length > 0 ? `${role.persona}\n\n${prompt}` : prompt;
      const started = await ctx.subagents.startActivation({
        provider: 'spawn',
        label: description,
        delivery: 'parent',
        signal: exec.signal,
        request: {
          prompt: [{ type: 'text', text }],
          parent,
          agentPreset: CUSTOM_ROLE_PRESET,
          agentOptions,
          persona: role.persona,
          toolFilter: { allow: ['read', 'grep', 'glob', 'working_directory', 'load_workspace_dependencies'] },
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

  // Browser-side editor for user-defined roles. These are ordinary config (not
  // volatile), so a save rewrites the complete entry through the configuration
  // editor and the Loader reloads this plugin with the new tool set.
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
        if (req.method === 'GET') {
          send(200, { roles: customRolesOf(config, ctx.logger), limits: CUSTOM_ROLE_LIMITS });
          return;
        }
        if (req.method !== 'POST') {
          send(405, { ok: false, error: 'method-not-allowed' });
          return;
        }
        readJsonBody(req)
          .then((body) => {
            const validated = validateCustomRoles(body === null || typeof body !== 'object' ? undefined : body.roles);
            if (validated.error !== undefined) {
              send(400, { ok: false, error: validated.error });
              return undefined;
            }
            const entry = child.configEditor.entries().find((row) => row.options.id === 'crew-config');
            if (entry === undefined) throw new Error('the crew-config entry is not addressable in this profile');
            return child.configEditor
              .edit(entry, () => ({ roles: plainRoles(config), customRoles: validated.roles }))
              .then(() => send(200, { ok: true, roles: validated.roles }));
          })
          .catch((error) => send(500, { ok: false, error: error instanceof Error ? error.message : String(error) }));
      },
    }), 'crew-config: custom roles route');
  });

  for (const role of ROLE_NAMES) {
    ctx.effect(
      () => ctx.tools.register(defineRoleTool(ctx, config, role)),
      `crew-config: ${ROLE_INFO[role].tool}`,
    );
  }

  const customRoles = customRolesOf(config, ctx.logger);
  for (const role of customRoles) {
    ctx.effect(
      () => ctx.tools.register(defineCustomRoleTool(ctx, role)),
      `crew-config: crew_${role.id}`,
    );
  }
  // A Crew child must not see any Crew delegation tool, including the dynamic
  // ones registered from the current custom-role list.
  const crewToolDenyList = [...CREW_TOOL_NAMES, ...customRoles.map((role) => `crew_${role.id}`)];

  // Apply the saved persona and hide the Crew delegation tools inside a Crew
  // child. The four role presets own the read-only tool boundary; this adds
  // the identity that the preset no longer carries and keeps a depth-capped
  // child from seeing delegation tools it cannot use.
  ctx.on('agent/created', ({ agent }) => {
    // `agent/created` is a serial listener: throwing here would reject the
    // child's creation announcement, so every optional contribution is
    // contained and only logged. A missed persona or deny list must not break
    // the delegation itself.
    let role;
    let preset;
    try {
      preset = agent?.session?.header?.agentPreset;
      role = roleOfAgent(agent);
    } catch (error) {
      ctx.logger.warn(`crew-config: could not resolve the created child's role: ${String(error)}`);
      return;
    }
    // User-defined roles share one read-only preset and carry their identity in
    // the task preamble; only the built-in roles get a scoped system persona.
    const crewChild = role !== undefined || preset === CUSTOM_ROLE_PRESET;
    if (!crewChild) return;
    try {
      const current = readRole(config, role);
      if (current.persona.length > 0) {
        agent.ctx.systemPrompt.section({
          name: PERSONA_PREFIX_SECTION,
          order: agent.ctx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA_PREFIX'),
          text: current.persona,
        });
      }
    } catch (error) {
      // A preset that already mounts the persona section collides by design;
      // keep the deployment persona rather than failing the delegation.
      ctx.logger.warn(`crew-config: could not apply the ${role} child's persona: ${String(error)}`);
    }
    try {
      agent.ctx.tools.restrict({ deny: crewToolDenyList });
    } catch (error) {
      // A denylist naming a tool this composition does not register is not
      // fatal; the child still cannot delegate because its role preset mounts
      // no delegation tools and its absolute depth cap leaves no further level.
      ctx.logger.warn(
        `crew-config: could not narrow the ${role} child's tool surface: ${String(error)}`,
      );
    }
  });

  ctx.logger.info(
    'crew-config: registered %d built-in role tools and %d custom role tool(s); edit roles in Plugins → Crew',
    CREW_TOOL_NAMES.length,
    customRoles.length,
  );
}
