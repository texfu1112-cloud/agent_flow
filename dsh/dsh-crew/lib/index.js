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
export { CATALOG_PATH };

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
 * Live Crew configuration. The four role objects are addressed by the
 * settings GUI as `roles.<role>.<field>` paths; every leaf is volatile so a
 * save applies without remounting this plugin.
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

  for (const role of ROLE_NAMES) {
    ctx.effect(
      () => ctx.tools.register(defineRoleTool(ctx, config, role)),
      `crew-config: ${ROLE_INFO[role].tool}`,
    );
  }

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
    try {
      role = roleOfAgent(agent);
    } catch (error) {
      ctx.logger.warn(`crew-config: could not resolve the created child's role: ${String(error)}`);
      return;
    }
    if (role === undefined) return;
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
      agent.ctx.tools.restrict({ deny: CREW_TOOL_NAMES });
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
    'crew-config: registered %d role tools (explore/architect/planner/reviewer); edit roles in Plugins → Crew',
    CREW_TOOL_NAMES.length,
  );
}
