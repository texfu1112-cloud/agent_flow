window.__ModuleLoader__.load({
  id: '@agent-flow/dsh-crew',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Locale namespace this page's dictionaries and its t() reader are bound to. */
    const NS = 'dsh-crew';

    /** English copy for the crew configuration page. */
    const en = {
      title: 'Crew roles',
      description:
        'One uniform role list for the Crew. The main session is the Orchestrator; every enabled role ' +
        'becomes a crew_<id> tool the Orchestrator can delegate to.',
      orchestratorNote:
        'Orchestrator is this main session and is always on. The rows below are the sub-agents it can ' +
        'delegate to; disable a row to remove its tool.',
      rolesLoading: 'Loading the role list…',
      saveHint:
        'Saving rewrites the profile role list and reloads the Crew plugin; the next delegation uses the ' +
        'new roles and boundaries. No app restart is needed.',
      enabled: 'On',
      roleId: 'ID',
      roleName: 'Name',
      fieldAccess: 'Access',
      fieldProvider: 'Provider',
      fieldModel: 'Model',
      fieldEffort: 'Reasoning effort',
      fieldPersona: 'Persona',
      accessRead: 'Read-only',
      accessExec: 'Read + run',
      accessWrite: 'Read + write',
      accessHint:
        'The access column selects the child boundary preset: Read-only mounts Crew Role (no write/edit, ' +
        'no commands); Read + run and Read + write mount Crew Writer (read/write/edit + shell). The Tester ' +
        'persona carries the "do not edit implementation code" rule.',
      effortHint: 'An empty Reasoning effort inherits the parent effort when the route matches; otherwise the route default applies.',
      placeholderRoleId: 'e.g. debugger',
      placeholderName: 'Display name',
      placeholderProvider: 'provider id',
      placeholderModel: 'model id',
      placeholderEffort: 'Route default',
      placeholderPersona: 'Role persona',
      rolesLoadError: 'Could not load the role list: {message}',
      rolesLoadTimeout: 'Timed out loading the role list; retry.',
      rolesEmpty: 'No roles are configured. Use Add role to define one.',
      rolesSaveError: 'The save request failed; check the roles and try again.',
      rolesValidation: 'Check the roles: {message}',
      rolesRejected: 'The Host rejected the roles: {message}',
      rolesSaved: 'Roles saved; the Crew plugin reloaded and the next delegation can use them.',
      saveRoles: 'Save roles',
      addRole: 'Add role',
      removeRole: 'Remove',
      roleRow: 'row {row}',
      validationId: 'row {row}: ID "{id}" must match {pattern}',
      validationDuplicate: 'row {row}: duplicate ID "{id}"',
      validationReserved: 'row {row}: ID "{id}" is reserved for the main session',
      validationProvider: 'row {row}: Provider is required',
      validationModel: 'row {row}: Model is required',
      validationAccess: 'row {row}: Access must be read, exec, or write',
      ariaLabel: '{role} {field}',
      catalogHint:
        'Options come from the live model catalog ({providers} providers, {models} models); you can still ' +
        'type a custom value.',
      catalogLoading: 'Loading the model catalog…',
      catalogUnavailable: 'The model catalog is unavailable here; type the provider and model ids directly.',
      customOption: 'Custom…',
      useList: 'Pick from list',
      catalogError: 'Could not load the model catalog: {message}',
      catalogTimeout: 'Timed out loading the model catalog; type the ids directly or retry.',
      catalogFallback:
        'The live model catalog is unavailable, so built-in DeepSeek options are shown; you can still type ' +
        'custom values.',
      retry: 'Retry',
      saving: 'Saving…',
    };

    /** Simplified Chinese copy for the crew configuration page. */
    const zh = {
      title: 'Crew 角色',
      description: '统一的角色列表。主会话就是 Orchestrator；每个启用的角色都会成为 crew_<id> 工具，供 Orchestrator 按需委派。',
      orchestratorNote: 'Orchestrator 就是当前主会话，始终保留。下表是它可以委派的子 Agent；关闭某一行即移除对应工具。',
      rolesLoading: '正在加载角色列表…',
      saveHint: '保存会重写 profile 中的角色列表并重载 Crew 插件；下一次委派即使用新的角色与权限边界，无需重启应用。',
      enabled: '启用',
      roleId: 'ID',
      roleName: '名称',
      fieldAccess: '权限',
      fieldProvider: '服务方',
      fieldModel: '模型',
      fieldEffort: '推理强度',
      fieldPersona: '人设',
      accessRead: '只读',
      accessExec: '只读 + 执行',
      accessWrite: '读 + 写',
      accessHint: '权限列选择子会话的边界预设：只读挂载 Crew Role（无写/改工具、无命令）；只读 + 执行与读 + 写挂载 Crew Writer（读/写/改 + shell）。Tester 的“不修改实现代码”由角色人设约束。',
      effortHint: '推理强度留空时，同一路由继承父级强度，否则使用该路由的默认强度。',
      placeholderRoleId: '例如 debugger',
      placeholderName: '显示名称',
      placeholderProvider: 'provider id',
      placeholderModel: 'model id',
      placeholderEffort: '路由默认',
      placeholderPersona: '角色人设',
      rolesLoadError: '角色列表加载失败：{message}',
      rolesLoadTimeout: '角色列表加载超时；请重试。',
      rolesEmpty: '还没有配置角色，点击“添加角色”创建一个。',
      rolesSaveError: '保存请求失败；请检查角色列表后重试。',
      rolesValidation: '请检查角色列表：{message}',
      rolesRejected: 'Host 拒绝了角色列表：{message}',
      rolesSaved: '角色已保存；Crew 插件已重载，下一次委派即可使用。',
      saveRoles: '保存角色',
      addRole: '添加角色',
      removeRole: '移除',
      roleRow: '第 {row} 行',
      validationId: '第 {row} 行：ID "{id}" 必须匹配 {pattern}',
      validationDuplicate: '第 {row} 行：ID "{id}" 重复',
      validationReserved: '第 {row} 行：ID "{id}" 为主会话保留',
      validationProvider: '第 {row} 行：必须填写服务方',
      validationModel: '第 {row} 行：必须填写模型',
      validationAccess: '第 {row} 行：权限必须是 read、exec 或 write',
      ariaLabel: '{role} {field}',
      catalogHint: '选项来自当前模型目录（{providers} 个 provider、{models} 个模型）；也可以直接输入自定义值。',
      catalogLoading: '正在加载模型目录…',
      catalogUnavailable: '此处未提供模型目录，可直接输入 provider 与 model。',
      customOption: '自定义…',
      useList: '从列表选择',
      catalogError: '模型目录加载失败：{message}',
      catalogTimeout: '模型目录加载超时；可直接手输，或稍后重试。',
      catalogFallback: '模型目录不可用，已使用内置的 DeepSeek 选项；仍可直接输入自定义值。',
      retry: '重试',
      saving: '保存中…',
    };

    /** Editable leaves of one role; the role list is saved as one payload. */
    const FIELDS = [
      { id: 'provider', labelKey: 'fieldProvider', placeholderKey: 'placeholderProvider', mono: true },
      { id: 'model', labelKey: 'fieldModel', placeholderKey: 'placeholderModel', mono: true },
      { id: 'reasoningEffort', labelKey: 'fieldEffort', placeholderKey: 'placeholderEffort' },
    ];

    /** HTTP route the Host half serves the live model catalog on (same origin). */
    const CATALOG_PATH = '/agent-flow/dsh-crew/catalog';

    /** HTTP route the Host half serves the role list on (same origin). */
    const ROLES_PATH = '/agent-flow/dsh-crew/roles';

    /** Bound for one HTTP request; the page falls back or reports an error after it. */
    const REQUEST_TIMEOUT_MS = 8000;

    /** Pause before re-reading the roles after an ambiguous save response. */
    const RECHECK_DELAY_MS = 1200;

    /** Role limits used when the Host route does not return them. */
    const DEFAULT_LIMITS = {
      maxRoles: 12,
      idPattern: '^[a-z][a-z0-9_]{0,31}$',
      access: ['read', 'exec', 'write'],
      reserved: ['orchestrator'],
    };

    /** Built-in DeepSeek effort ids used when the live catalog is unavailable. */
    const FALLBACK_EFFORTS = [
      { id: 'off', name: 'Off' },
      { id: 'low', name: 'Low' },
      { id: 'high', name: 'High' },
      { id: 'max', name: 'Max' },
    ];

    /** Built-in provider/model suggestions used when the live catalog is unavailable. */
    const FALLBACK_GROUPS = [
      {
        id: 'deepseek-account',
        name: 'DeepSeek Account',
        models: [
          { id: 'deepseek-flash', name: 'DeepSeek Flash', reasoning: { efforts: FALLBACK_EFFORTS } },
          { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', reasoning: { efforts: FALLBACK_EFFORTS } },
        ],
      },
      {
        id: 'deepseek-official',
        name: 'DeepSeek',
        models: [{ id: 'deepseek-flash', name: 'DeepSeek Flash', reasoning: { efforts: FALLBACK_EFFORTS } }],
      },
    ];

    /**
     * Keep only providers whose live catalog returned models. A provider that
     * answers with no models (for example a route without credentials) cannot
     * serve a delegation, so it must not be offered as a choice; the built-in
     * fallback list is used only when nothing live is usable.
     */
    function usableGroups(groups) {
      const usable = Array.isArray(groups)
        ? groups.filter((group) => Array.isArray(group.models) && group.models.length > 0)
        : [];
      return usable.length === 0 ? FALLBACK_GROUPS : usable;
    }

    /**
     * Read-only store for the Host model catalog powering the input suggestions.
     * The catalog comes from this bundle's own Host route, so it does not depend
     * on session-scoped Client Remote namespaces (unavailable on the root
     * Plugins page). A failed read falls back to built-in DeepSeek options, so
     * the table always offers dropdown choices.
     */
    function createCatalogStore() {
      let state = { status: 'idle', groups: [], failures: [], error: null, timedOut: false, fallback: false };
      const listeners = new Set();
      let inflight;
      const publish = (patch) => {
        state = { ...state, ...patch };
        for (const listener of listeners) listener();
      };
      const read = async (force = false) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
          const response = await fetch(force ? CATALOG_PATH + '?refresh=1' : CATALOG_PATH, {
            method: 'GET',
            credentials: 'same-origin',
            headers: { accept: 'application/json' },
            signal: controller.signal,
          });
          if (!response.ok) throw new Error('HTTP ' + String(response.status));
          const payload = await response.json();
          const groups = usableGroups(payload.groups);
          return { groups, failures: [], error: null, timedOut: false, fallback: groups === FALLBACK_GROUPS };
        } catch (error) {
          const aborted = error instanceof Error && error.name === 'AbortError';
          return {
            groups: FALLBACK_GROUPS,
            failures: [],
            error: aborted ? 'timed out' : (error instanceof Error ? error.message : String(error)),
            timedOut: aborted,
            fallback: true,
          };
        } finally {
          clearTimeout(timer);
        }
      };
      return {
        getSnapshot: () => state,
        subscribe: (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        load: (force = false) => {
          if (inflight !== undefined && force !== true) return inflight;
          if (force !== true && (state.status === 'ready' || state.status === 'error')) return Promise.resolve(state);
          publish({ status: 'loading', error: null });
          inflight = read(force)
            .then(({ groups, failures, error, timedOut, fallback }) => {
              publish({ status: 'ready', groups, failures, error, timedOut, fallback });
              return state;
            })
            .finally(() => {
              inflight = undefined;
            });
          return inflight;
        },
      };
    }

    /**
     * Read/write store for the Host's Crew role list.
     * A GET feeds the editor; saving rewrites the profile configuration and
     * reloads the Host plugin, so the page confirms ambiguous responses with one
     * later GET before reporting failure.
     */
    function createRolesStore() {
      let state = { status: 'idle', roles: [], limits: { ...DEFAULT_LIMITS }, error: null, timedOut: false };
      const listeners = new Set();
      let inflight;
      const publish = (patch) => {
        state = { ...state, ...patch };
        for (const listener of listeners) listener();
      };
      const read = async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
          const response = await fetch(ROLES_PATH, {
            method: 'GET',
            credentials: 'same-origin',
            headers: { accept: 'application/json' },
            signal: controller.signal,
          });
          let payload;
          try {
            payload = await response.json();
          } catch {
            payload = undefined;
          }
          if (!response.ok) {
            const reason = payload !== null && payload !== undefined && typeof payload.error === 'string'
              ? payload.error
              : 'HTTP ' + String(response.status);
            throw new Error(reason);
          }
          return {
            roles: normalizeRoles(payload !== null && payload !== undefined ? payload.roles : undefined),
            limits: normalizeLimits(payload !== null && payload !== undefined ? payload.limits : undefined),
            error: null,
            timedOut: false,
          };
        } catch (error) {
          const aborted = error instanceof Error && error.name === 'AbortError';
          return {
            roles: [],
            limits: { ...DEFAULT_LIMITS },
            error: aborted ? 'timed out' : (error instanceof Error ? error.message : String(error)),
            timedOut: aborted,
          };
        } finally {
          clearTimeout(timer);
        }
      };
      return {
        getSnapshot: () => state,
        subscribe: (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        load: (force = false) => {
          if (inflight !== undefined && force !== true) return inflight;
          if (force !== true && (state.status === 'ready' || state.status === 'error')) return Promise.resolve(state);
          publish({ status: 'loading', error: null });
          inflight = read()
            .then((result) => {
              if (result.error !== null) {
                publish({ status: 'error', error: result.error, timedOut: result.timedOut });
              } else {
                publish({ status: 'ready', roles: result.roles, limits: result.limits, error: null, timedOut: false });
              }
              return state;
            })
            .finally(() => {
              inflight = undefined;
            });
          return inflight;
        },
      };
    }

    /** Look up one provider group of the catalog by its route id. */
    function groupOf(state, providerId) {
      if (!Array.isArray(state.groups)) return undefined;
      return state.groups.find((group) => group.id === providerId);
    }

    /** Models advertised for one provider; while a custom provider is typed, all groups. */
    function modelsFor(state, providerId) {
      const group = groupOf(state, providerId);
      if (group !== undefined && Array.isArray(group.models)) return group.models;
      const groups = Array.isArray(state.groups) ? state.groups : [];
      return groups.flatMap((entry) => (Array.isArray(entry.models) ? entry.models : []));
    }

    /** Advertised reasoning efforts for one exact provider/model pair. */
    function effortsFor(state, providerId, modelId) {
      const group = groupOf(state, providerId);
      if (group === undefined || !Array.isArray(group.models)) return [];
      const model = group.models.find((entry) => entry.id === modelId);
      if (model === undefined || model.reasoning === undefined || !Array.isArray(model.reasoning.efforts)) return [];
      return model.reasoning.efforts;
    }

    /**
     * Datalist suggestions for one editable string field.
     * @param fieldId - provider / model / reasoningEffort.
     * @param state - catalog snapshot.
     * @param providerId - the row's effective provider id.
     * @param modelId - the row's effective model id.
     * @returns option value/label pairs; empty when nothing is known.
     */
    function suggestionsFor(fieldId, state, providerId, modelId) {
      if (fieldId === 'provider') {
        const groups = Array.isArray(state.groups) ? state.groups : [];
        return groups.map((group) => ({ value: group.id, label: group.name ?? group.id }));
      }
      if (fieldId === 'model') {
        return modelsFor(state, providerId).map((model) => ({ value: model.id, label: model.name ?? model.id }));
      }
      if (fieldId === 'reasoningEffort') {
        return effortsFor(state, providerId, modelId).map((effort) => ({ value: effort.id, label: effort.name ?? effort.id }));
      }
      return [];
    }

    /** Coerce a possibly-missing string leaf of a JSON payload to a string. */
    function stringOf(value) {
      return typeof value === 'string' ? value : '';
    }

    /** Normalize one role read from the Host; missing fields become safe defaults. */
    function normalizeRole(role) {
      if (role === null || typeof role !== 'object') {
        return {
          id: '', name: '', enabled: true, access: 'read',
          provider: '', model: '', reasoningEffort: '', persona: '',
        };
      }
      const access = stringOf(role.access).trim();
      return {
        id: stringOf(role.id).trim(),
        name: stringOf(role.name).trim(),
        enabled: role.enabled !== false,
        access: access === 'exec' || access === 'write' ? access : 'read',
        provider: stringOf(role.provider).trim(),
        model: stringOf(role.model).trim(),
        reasoningEffort: stringOf(role.reasoningEffort).trim(),
        persona: stringOf(role.persona),
      };
    }

    /** Normalize a list of roles read from the Host. */
    function normalizeRoles(roles) {
      return Array.isArray(roles) ? roles.map(normalizeRole) : [];
    }

    /** Deep-clone a normalized role list into editable draft rows. */
    function cloneRoles(roles) {
      return normalizeRoles(roles).map((role) => ({ ...role }));
    }

    /** Normalize the role limits, falling back to the built-in values. */
    function normalizeLimits(limits) {
      const source = limits !== null && typeof limits === 'object' ? limits : {};
      const maxRoles = Number.isInteger(source.maxRoles) && source.maxRoles > 0
        ? source.maxRoles
        : DEFAULT_LIMITS.maxRoles;
      const idPattern = typeof source.idPattern === 'string' && source.idPattern !== ''
        ? source.idPattern
        : DEFAULT_LIMITS.idPattern;
      const access = Array.isArray(source.access) && source.access.length > 0
        ? source.access.filter((value) => typeof value === 'string')
        : DEFAULT_LIMITS.access;
      const reserved = Array.isArray(source.reserved)
        ? source.reserved.filter((value) => typeof value === 'string')
        : DEFAULT_LIMITS.reserved;
      return { maxRoles, idPattern, access, reserved };
    }

    /** Compile the limits id pattern, tolerating a malformed Host pattern. */
    function idMatcher(limits) {
      try {
        return new RegExp(limits.idPattern);
      } catch {
        return new RegExp(DEFAULT_LIMITS.idPattern);
      }
    }

    /** The id pattern shown to the user, falling back when the Host pattern is malformed. */
    function idPatternText(limits) {
      try {
        new RegExp(limits.idPattern);
        return limits.idPattern;
      } catch {
        return DEFAULT_LIMITS.idPattern;
      }
    }

    /** Wait for the Host plugin to settle before confirming an ambiguous save. */
    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /** Compare two normalized role lists field by field. */
    function sameRoles(left, right) {
      if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
      const fields = ['id', 'name', 'enabled', 'access', 'provider', 'model', 'reasoningEffort', 'persona'];
      return left.every((role, index) => fields.every((field) => role[field] === right[index][field]));
    }

    /**
     * Validate the role draft before saving it.
     * @param roles - normalized draft rows.
     * @param limits - { maxRoles, idPattern, access, reserved } from the Host.
     * @param t - locale reader.
     * @returns the first localized validation message, or null when valid.
     */
    function validateRoleDraft(roles, limits, t) {
      const matcher = idMatcher(limits);
      const pattern = idPatternText(limits);
      const reserved = new Set(Array.isArray(limits.reserved) ? limits.reserved : []);
      const accessValues = Array.isArray(limits.access) && limits.access.length > 0
        ? limits.access
        : DEFAULT_LIMITS.access;
      const seen = new Set();
      for (let index = 0; index < roles.length; index += 1) {
        const role = roles[index];
        const row = String(index + 1);
        if (role.id === '' || matcher.test(role.id) !== true) return t('validationId', { row, id: role.id, pattern });
        if (seen.has(role.id)) return t('validationDuplicate', { row, id: role.id });
        if (reserved.has(role.id)) return t('validationReserved', { row, id: role.id });
        seen.add(role.id);
        if (role.provider === '') return t('validationProvider', { row });
        if (role.model === '') return t('validationModel', { row });
        if (!accessValues.includes(role.access)) return t('validationAccess', { row });
      }
      return null;
    }

    /**
     * Re-read the role list once after an ambiguous POST and compare it with what
     * was submitted: a save that reloaded the Host may have applied before its
     * HTTP response was lost.
     * @param submitted - the normalized list that was POSTed.
     * @returns whether the Host now serves exactly the submitted list.
     */
    async function confirmRolesSaved(submitted) {
      await delay(RECHECK_DELAY_MS);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(ROLES_PATH, {
          method: 'GET',
          credentials: 'same-origin',
          headers: { accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) return false;
        const payload = await response.json();
        return sameRoles(
          normalizeRoles(payload !== null && payload !== undefined ? payload.roles : undefined),
          submitted,
        );
      } catch {
        return false;
      } finally {
        clearTimeout(timer);
      }
    }

    /** Theme aliases: every color comes from a DSH token so both themes stay readable. */
    const COLORS = {
      layer1: 'var(--dsw-alias-bg-layer-1)',
      layer2: 'var(--dsw-alias-bg-layer-2)',
      border: 'var(--dsw-alias-border-l1)',
      primary: 'var(--dsw-alias-label-primary)',
      secondary: 'var(--dsw-alias-label-secondary)',
      brand: 'var(--dsw-alias-brand-primary)',
      error: 'var(--dsw-alias-state-error-primary)',
      success: 'var(--dsw-alias-state-success-primary)',
    };

    /** Monospace stack for provider and model ids, which are technical strings. */
    const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';

    /** Inline styles; no global stylesheet, no fixed positioning, no overlay. */
    const styles = {
      section: { display: 'flex', flexDirection: 'column', gap: 8, color: COLORS.primary, fontSize: 13, lineHeight: 1.5 },
      title: { margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.primary },
      divider: { width: '100%', margin: '4px 0', border: 'none', borderTop: '1px solid ' + COLORS.border },
      description: { margin: 0, color: COLORS.secondary },
      hint: { margin: 0, color: COLORS.secondary, fontSize: 12 },
      notice: {
        margin: 0, padding: '6px 8px', border: '1px solid ' + COLORS.border, borderRadius: 4,
        background: COLORS.layer2, color: COLORS.secondary, fontSize: 12,
      },
      tableWrap: { overflowX: 'auto', border: '1px solid ' + COLORS.border, borderRadius: 6, background: COLORS.layer1 },
      table: { borderCollapse: 'collapse', width: '100%', fontSize: 12 },
      th: {
        padding: '6px 8px', borderBottom: '1px solid ' + COLORS.border, background: COLORS.layer2,
        color: COLORS.secondary, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap',
      },
      cell: { padding: '6px 8px', borderBottom: '1px solid ' + COLORS.border, verticalAlign: 'top' },
      input: {
        width: '100%', minWidth: 110, boxSizing: 'border-box', padding: '4px 6px',
        border: '1px solid ' + COLORS.border, borderRadius: 4, background: COLORS.layer2,
        color: COLORS.primary, fontSize: 12,
      },
      textarea: {
        width: '100%', minWidth: 200, boxSizing: 'border-box', padding: '4px 6px',
        border: '1px solid ' + COLORS.border, borderRadius: 4, background: COLORS.layer2,
        color: COLORS.primary, fontSize: 12, fontFamily: 'inherit', resize: 'vertical',
      },
      select: {
        width: '100%', minWidth: 110, boxSizing: 'border-box', padding: '4px 6px',
        border: '1px solid ' + COLORS.border, borderRadius: 4, background: COLORS.layer2,
        color: COLORS.primary, fontSize: 12, cursor: 'pointer',
      },
      checkbox: { margin: 0, cursor: 'pointer' },
      linkButton: {
        display: 'inline', marginTop: 2, padding: 0, border: 'none', background: 'transparent',
        color: COLORS.brand, fontSize: 11, cursor: 'pointer', textAlign: 'left',
      },
      actions: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
      saveButton: {
        padding: '5px 12px', border: '1px solid ' + COLORS.brand, borderRadius: 4,
        background: COLORS.layer2, color: COLORS.brand, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      },
      resetButton: {
        padding: '5px 12px', border: '1px solid ' + COLORS.border, borderRadius: 4,
        background: 'transparent', color: COLORS.secondary, fontSize: 12, cursor: 'pointer',
      },
      status: { fontSize: 12, color: COLORS.secondary },
    };

    /** Snapshot shown before a controller is available or before it first derives. */
    const EMPTY_SNAPSHOT = Object.freeze({
      status: 'loading',
      value: undefined,
      base: undefined,
      user: undefined,
      revision: undefined,
      writable: false,
    });

    /**
     * Read the current controller snapshot defensively.
     * @param source - a ConfigFormController-like source, or undefined.
     * @returns the current snapshot, or the empty loading snapshot.
     */
    function snapshotOf(source) {
      if (source === undefined || source === null || typeof source.getSnapshot !== 'function') return EMPTY_SNAPSHOT;
      return source.getSnapshot();
    }

    /**
     * Subscribe a component to a controller's replaceable snapshot.
     * @param source - a ConfigFormController-like source with getSnapshot/subscribe.
     * @returns the current snapshot, re-rendering the component on changes.
     */
    function useControllerSnapshot(source) {
      const [snapshot, setSnapshot] = React.useState(() => snapshotOf(source));
      React.useEffect(() => {
        if (source === undefined || source === null || typeof source.subscribe !== 'function') return undefined;
        const sync = () => setSnapshot(snapshotOf(source));
        sync();
        return source.subscribe(sync);
      }, [source]);
      return snapshot;
    }

    /**
     * Render one editable value with optional suggestions: a <select> offering the
     * known values plus a "Custom…" escape hatch, or a free-text input/textarea with
     * a "Pick from list" action back to the list.
     * @param options - { t, value, suggestions, mode, disabled, ariaLabel, placeholder,
     *   mono, multiline, rows, emptyLabel, onEdit, onMode }.
     * @returns {{ control, action }}: the input element and an optional inline action.
     */
    function suggestionControl(options) {
      const { t, value, suggestions, mode, disabled, ariaLabel, placeholder, mono, multiline, rows, emptyLabel, onEdit, onMode } = options;
      const list = Array.isArray(suggestions) ? suggestions : [];
      if (list.length > 0 && mode !== 'text') {
        const entries = [];
        const seenValues = new Set();
        const push = (entry) => {
          if (seenValues.has(entry.value)) return;
          seenValues.add(entry.value);
          entries.push(entry);
        };
        if (emptyLabel !== undefined) push({ value: '', label: emptyLabel });
        if (value !== '' && !list.some((option) => option.value === value)) push({ value, label: value });
        for (const option of list) push(option);
        return {
          control: h('select', {
            'aria-label': ariaLabel,
            disabled,
            style: styles.select,
            value,
            onChange: (event) => {
              const next = event.target.value;
              if (next === '__custom__') {
                onMode('text');
                return;
              }
              onMode(undefined);
              onEdit(next);
            },
          },
            ...entries.map((entry) => h('option', { key: entry.value, value: entry.value }, entry.label)),
            h('option', { key: '__custom__', value: '__custom__' }, t('customOption'))),
          action: null,
        };
      }
      const controlStyle = multiline === true
        ? styles.textarea
        : mono === true
          ? { ...styles.input, fontFamily: MONO }
          : styles.input;
      const common = {
        'aria-label': ariaLabel,
        disabled,
        placeholder,
        spellCheck: false,
        style: controlStyle,
        value,
        onChange: (event) => onEdit(event.target.value),
      };
      const control = multiline === true
        ? h('textarea', { ...common, rows: rows === undefined ? 2 : rows })
        : h('input', { ...common, type: 'text' });
      const action = list.length > 0 && mode !== 'list'
        ? h('button', {
          type: 'button',
          onClick: () => onMode('list'),
          style: styles.linkButton,
        }, t('useList'))
        : null;
      return { control, action };
    }

    /**
     * Render a bundle's configuration page: one uniform role table with enable
     * toggles, access boundaries, model routes, and personas, plus staged save.
     * @param props - { view, t, form, catalog, roles }: requested view, locale
     *   reader, shared configuration form, catalog store, roles store.
     * @returns the page content.
     */
    function ConfigPage(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const catalog = props.catalog;
      const roles = props.roles;
      const catalogState = useControllerSnapshot(catalog);
      const rolesState = useControllerSnapshot(roles);
      React.useEffect(() => {
        if (catalog !== undefined && catalog !== null && typeof catalog.load === 'function') catalog.load();
      }, [catalog]);
      React.useEffect(() => {
        if (roles !== undefined && roles !== null && typeof roles.load === 'function') roles.load();
      }, [roles]);
      const [roleDraft, setRoleDraft] = React.useState(null);
      const [roleModes, setRoleModes] = React.useState({});
      const [roleStatus, setRoleStatus] = React.useState('idle');
      const [roleMessage, setRoleMessage] = React.useState('');
      React.useEffect(() => {
        if (rolesState.status === 'ready' && roleDraft === null) setRoleDraft(cloneRoles(rolesState.roles));
      }, [rolesState, roleDraft]);

      const ready = rolesState.status === 'ready';
      const rolesBusy = roleStatus === 'saving';
      const editable = ready && roleDraft !== null && !rolesBusy;
      const roleRows = Array.isArray(roleDraft) ? roleDraft : [];
      const limits = normalizeLimits(rolesState.limits);
      const atRoleLimit = roleRows.length >= limits.maxRoles;

      const editRole = (index, fieldId, value) => {
        setRoleDraft((previous) => {
          if (!Array.isArray(previous)) return previous;
          return previous.map((role, position) => (position === index ? { ...role, [fieldId]: value } : role));
        });
        setRoleStatus('idle');
        setRoleMessage('');
      };

      const setRoleMode = (index, fieldId, mode) => {
        setRoleModes((previous) => ({ ...previous, [String(index) + ':' + fieldId]: mode }));
      };

      const addRole = () => {
        const rows = Array.isArray(roleDraft) ? roleDraft : [];
        if (rows.length >= limits.maxRoles) return;
        const used = new Set(rows.map((role) => String(role.id ?? '').trim()));
        let counter = 1;
        while (used.has('custom' + String(counter))) counter += 1;
        const firstGroup = Array.isArray(catalogState.groups) && catalogState.groups.length > 0
          ? catalogState.groups[0]
          : undefined;
        const provider = firstGroup !== undefined ? stringOf(firstGroup.id) : '';
        const group = groupOf(catalogState, provider);
        const model = group !== undefined && Array.isArray(group.models) && group.models.length > 0
          ? stringOf(group.models[0].id)
          : '';
        setRoleDraft([...rows, {
          id: 'custom' + String(counter),
          name: '',
          enabled: true,
          access: 'read',
          provider,
          model,
          reasoningEffort: '',
          persona: '',
        }]);
        setRoleModes({});
        setRoleStatus('idle');
        setRoleMessage('');
      };

      const removeRole = (index) => {
        setRoleDraft((previous) => (
          Array.isArray(previous) ? previous.filter((role, position) => position !== index) : previous
        ));
        setRoleModes({});
        setRoleStatus('idle');
        setRoleMessage('');
      };

      const saveRoles = async () => {
        if (rolesBusy || !Array.isArray(roleDraft)) return;
        const submitted = roleDraft.map(normalizeRole);
        const problem = validateRoleDraft(submitted, limits, t);
        if (problem !== null) {
          setRoleStatus('validation');
          setRoleMessage(problem);
          return;
        }
        setRoleStatus('saving');
        setRoleMessage('');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let response;
        let payload;
        let failed = false;
        try {
          response = await fetch(ROLES_PATH, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { accept: 'application/json', 'content-type': 'application/json' },
            body: JSON.stringify({ roles: submitted }),
            signal: controller.signal,
          });
          try {
            payload = await response.json();
          } catch {
            payload = undefined;
          }
        } catch {
          failed = true;
        } finally {
          clearTimeout(timer);
        }
        if (failed !== true && response !== undefined) {
          if (response.ok) {
            const accepted = payload !== null && payload !== undefined && Array.isArray(payload.roles)
              ? normalizeRoles(payload.roles)
              : cloneRoles(submitted);
            setRoleDraft(accepted);
            setRoleModes({});
            setRoleStatus('saved');
            if (roles !== undefined && roles !== null && typeof roles.load === 'function') roles.load(true);
            return;
          }
          if (response.status === 400) {
            const message = payload !== null && payload !== undefined && typeof payload.error === 'string'
              ? payload.error
              : 'HTTP 400';
            setRoleStatus('rejected');
            setRoleMessage(message);
            return;
          }
        }
        const confirmed = await confirmRolesSaved(submitted);
        if (confirmed) {
          setRoleDraft(cloneRoles(submitted));
          setRoleModes({});
          setRoleStatus('saved');
          if (roles !== undefined && roles !== null && typeof roles.load === 'function') roles.load(true);
          return;
        }
        setRoleStatus('error');
        setRoleMessage('');
      };

      let roleStatusText = '';
      let roleStatusColor = COLORS.secondary;
      if (roleStatus === 'saving') {
        roleStatusText = t('saving');
      } else if (roleStatus === 'saved') {
        roleStatusText = t('rolesSaved');
        roleStatusColor = COLORS.success;
      } else if (roleStatus === 'validation') {
        roleStatusText = t('rolesValidation', { message: roleMessage });
        roleStatusColor = COLORS.error;
      } else if (roleStatus === 'rejected') {
        roleStatusText = t('rolesRejected', { message: roleMessage });
        roleStatusColor = COLORS.error;
      } else if (roleStatus === 'error') {
        roleStatusText = t('rolesSaveError');
        roleStatusColor = COLORS.error;
      }

      let providerCount = 0;
      let modelCount = 0;
      for (const group of (Array.isArray(catalogState.groups) ? catalogState.groups : [])) {
        providerCount += 1;
        modelCount += Array.isArray(group.models) ? group.models.length : 0;
      }
      let catalogNote = null;
      if (catalogState.status === 'ready' && catalogState.fallback === true) {
        catalogNote = h('p', { style: styles.hint },
          t('catalogFallback'),
          ' ',
          h('button', {
            type: 'button',
            onClick: () => catalog.load(true),
            style: styles.linkButton,
          }, t('retry')));
      } else if (catalogState.status === 'ready') {
        catalogNote = h('p', { style: styles.hint },
          t('catalogHint', { providers: String(providerCount), models: String(modelCount) }));
      } else if (catalogState.status === 'loading' || catalogState.status === 'idle') {
        catalogNote = h('p', { style: styles.hint }, t('catalogLoading'));
      } else if (catalogState.status === 'unavailable') {
        catalogNote = h('p', { style: styles.hint }, t('catalogUnavailable'));
      } else if (catalogState.status === 'error') {
        catalogNote = h('p', { style: styles.hint },
          catalogState.timedOut === true
            ? t('catalogTimeout')
            : t('catalogError', { message: catalogState.error ?? '' }),
          ' ',
          h('button', {
            type: 'button',
            onClick: () => catalog.load(true),
            style: styles.linkButton,
          }, t('retry')));
      }

      let rolesContent;
      if (rolesState.status === 'error') {
        const message = rolesState.timedOut === true
          ? t('rolesLoadTimeout')
          : t('rolesLoadError', { message: rolesState.error ?? '' });
        rolesContent = h('p', { style: styles.notice },
          message,
          ' ',
          h('button', {
            type: 'button',
            onClick: () => roles.load(true),
            style: styles.linkButton,
          }, t('retry')));
      } else if (!ready || roleDraft === null) {
        rolesContent = h('p', { style: styles.hint }, t('rolesLoading'));
      } else if (roleRows.length === 0) {
        rolesContent = h('p', { style: styles.hint }, t('rolesEmpty'));
      } else {
        const header = h('thead', null, h('tr', null,
          h('th', { scope: 'col', style: styles.th }, t('enabled')),
          h('th', { scope: 'col', style: styles.th }, t('roleId')),
          h('th', { scope: 'col', style: styles.th }, t('roleName')),
          h('th', { scope: 'col', style: styles.th }, t('fieldAccess')),
          FIELDS.map((field) => h('th', { key: field.id, scope: 'col', style: styles.th }, t(field.labelKey))),
          h('th', { scope: 'col', style: styles.th }, t('fieldPersona')),
          h('th', { scope: 'col', style: styles.th }, t('removeRole'))));
        const body = h('tbody', null, roleRows.map((role, index) => {
          const rowLabel = role.name !== ''
            ? role.name
            : role.id !== ''
              ? role.id
              : t('roleRow', { row: String(index + 1) });
          const providerId = role.provider.trim();
          const modelId = role.model.trim();
          const fieldCells = FIELDS.map((field) => {
            const fieldValue = stringOf(role[field.id]);
            const emptyLabel = field.id === 'reasoningEffort' ? t('placeholderEffort') : undefined;
            const rendered = suggestionControl({
              t,
              value: fieldValue,
              suggestions: suggestionsFor(field.id, catalogState, providerId, modelId),
              mode: roleModes[String(index) + ':' + field.id],
              disabled: !editable,
              ariaLabel: t('ariaLabel', { role: rowLabel, field: t(field.labelKey) }),
              placeholder: t(field.placeholderKey),
              mono: field.mono === true,
              multiline: false,
              emptyLabel,
              onEdit: (text) => editRole(index, field.id, text),
              onMode: (nextMode) => setRoleMode(index, field.id, nextMode),
            });
            return h('td', { key: field.id, style: styles.cell }, rendered.control, rendered.action);
          });
          const accessSelect = h('select', {
            'aria-label': t('ariaLabel', { role: rowLabel, field: t('fieldAccess') }),
            disabled: !editable,
            style: styles.select,
            value: role.access,
            onChange: (event) => editRole(index, 'access', event.target.value),
          },
            h('option', { key: 'read', value: 'read' }, t('accessRead')),
            h('option', { key: 'exec', value: 'exec' }, t('accessExec')),
            h('option', { key: 'write', value: 'write' }, t('accessWrite')));
          return h('tr', { key: String(index) },
            h('td', { style: styles.cell },
              h('input', {
                'aria-label': t('ariaLabel', { role: rowLabel, field: t('enabled') }),
                checked: role.enabled,
                disabled: !editable,
                style: styles.checkbox,
                type: 'checkbox',
                onChange: (event) => editRole(index, 'enabled', event.target.checked),
              })),
            h('td', { style: styles.cell },
              h('input', {
                'aria-label': t('ariaLabel', { role: rowLabel, field: t('roleId') }),
                disabled: !editable,
                placeholder: t('placeholderRoleId'),
                spellCheck: false,
                style: { ...styles.input, minWidth: 80, fontFamily: MONO },
                type: 'text',
                value: role.id,
                onChange: (event) => editRole(index, 'id', event.target.value),
              })),
            h('td', { style: styles.cell },
              h('input', {
                'aria-label': t('ariaLabel', { role: rowLabel, field: t('roleName') }),
                disabled: !editable,
                placeholder: t('placeholderName'),
                spellCheck: false,
                style: { ...styles.input, minWidth: 120 },
                type: 'text',
                value: role.name,
                onChange: (event) => editRole(index, 'name', event.target.value),
              })),
            h('td', { style: styles.cell }, accessSelect),
            ...fieldCells,
            h('td', { style: styles.cell },
              h('textarea', {
                'aria-label': t('ariaLabel', { role: rowLabel, field: t('fieldPersona') }),
                disabled: !editable,
                placeholder: t('placeholderPersona'),
                rows: 2,
                spellCheck: false,
                style: styles.textarea,
                value: role.persona,
                onChange: (event) => editRole(index, 'persona', event.target.value),
              })),
            h('td', { style: styles.cell },
              h('button', {
                'aria-label': t('ariaLabel', { role: rowLabel, field: t('removeRole') }),
                type: 'button',
                onClick: () => removeRole(index),
                disabled: !editable,
                style: styles.linkButton,
              }, t('removeRole'))));
        }));
        rolesContent = h('div', { style: styles.tableWrap },
          h('table', { style: styles.table }, header, body));
      }

      return h('section', { style: styles.section },
        h('h3', { style: styles.title }, t('title')),
        h('p', { style: styles.description }, t('description')),
        h('p', { style: styles.hint }, t('orchestratorNote')),
        h('p', { style: styles.hint }, t('saveHint')),
        catalogNote,
        h('p', { style: styles.hint }, t('accessHint')),
        rolesContent,
        h('p', { style: styles.hint }, t('effortHint')),
        h('hr', { style: styles.divider }),
        h('div', { style: styles.actions },
          h('button', {
            type: 'button',
            onClick: addRole,
            disabled: !editable || atRoleLimit,
            style: !editable || atRoleLimit
              ? { ...styles.resetButton, opacity: 0.55, cursor: 'not-allowed' }
              : styles.resetButton,
          }, t('addRole')),
          h('button', {
            type: 'button',
            onClick: saveRoles,
            disabled: !editable,
            style: !editable
              ? { ...styles.saveButton, opacity: 0.55, cursor: 'not-allowed' }
              : styles.saveButton,
          }, rolesBusy ? t('saving') : t('saveRoles')),
          h('span', { role: 'status', style: { ...styles.status, color: roleStatusColor } }, roleStatusText)));
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const catalog = createCatalogStore();
        const roles = createRolesStore();
        ctx.effect(() => ctx.locale.register(NS, { en, zh }));
        // Register the page unconditionally: the role list is served by this
        // bundle's own HTTP route, so the page must not depend on the generated
        // settings form (which this bundle disables) being served.
        ctx.effect(() => ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
          name: 'plugins.bundle.config',
          key: '@agent-flow/dsh-crew',
          locale: NS,
          inject: () => ({ catalog, roles }),
        }, ConfigPage)));
      },
    };
  },
});
