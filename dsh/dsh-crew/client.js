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
      description: 'Model routes and personas for the four crew roles the Lead delegates to.',
      volatileHint: 'Saving applies to the next delegation, without restarting the session.',
      roleColumn: 'Role',
      fieldProvider: 'Provider',
      fieldModel: 'Model',
      fieldEffort: 'Reasoning effort',
      fieldPersona: 'Persona',
      roleExplore: 'Explore',
      roleExploreHint: 'Cheap, read-only codebase reconnaissance.',
      roleArchitect: 'Architect',
      roleArchitectHint: 'Strong-model design decisions and invariants.',
      rolePlanner: 'Planner',
      rolePlannerHint: 'Turns the goal into an ordered, verifiable plan.',
      roleReviewer: 'Reviewer',
      roleReviewerHint: 'Independent review of the finished change.',
      effortHint: "An empty Reasoning effort inherits the parent route's effort.",
      placeholderProvider: 'Inherit',
      placeholderModel: 'Default model',
      placeholderEffort: 'Inherit parent effort',
      placeholderPersona: 'No persona override',
      loading: 'Loading crew configuration…',
      unavailable: 'The Host does not serve the crew configuration right now.',
      readOnly: 'This deployment stores the crew configuration read-only.',
      unsavedChanges: 'Unsaved changes.',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved; the next delegation uses the new values.',
      refused: 'The Host refused this save and refreshed the values; review the draft and try again.',
      saveError: 'The save request failed; the draft was kept, try again.',
      reset: 'Discard changes',
      ariaLabel: '{role} {field}',
      catalogHint: 'Options come from the live model catalog ({providers} providers, {models} models); you can still type a custom value.',
      catalogLoading: 'Loading the model catalog…',
      catalogUnavailable: 'The model catalog is unavailable here; type the provider and model ids directly.',
      customOption: 'Custom…',
      useList: 'Pick from list',
      catalogError: 'Could not load the model catalog: {message}',
      catalogTimeout: 'Timed out loading the model catalog; type the ids directly or retry.',
      catalogFallback: 'The live model catalog is unavailable, so built-in DeepSeek options are shown; you can still type custom values.',
      retry: 'Retry',
    };

    /** Simplified Chinese copy for the crew configuration page. */
    const zh = {
      title: 'Crew 角色',
      description: '为 Lead 委派的四个 crew 角色配置模型路由与人格。',
      volatileHint: '保存后从下一次委派起生效，无需重启会话。',
      roleColumn: '角色',
      fieldProvider: '服务方',
      fieldModel: '模型',
      fieldEffort: '推理强度',
      fieldPersona: '人格',
      roleExplore: '探查',
      roleExploreHint: '便宜、只读的代码库摸查。',
      roleArchitect: '架构',
      roleArchitectHint: '用强模型做设计决策与不变量梳理。',
      rolePlanner: '计划',
      rolePlannerHint: '把目标拆成有序、可验证的计划。',
      roleReviewer: '审查',
      roleReviewerHint: '对完成的改动做独立审查。',
      effortHint: '推理强度留空时，继承父级路由的推理强度。',
      placeholderProvider: '继承',
      placeholderModel: '默认模型',
      placeholderEffort: '继承父级强度',
      placeholderPersona: '不覆盖人格',
      loading: '正在加载 Crew 配置…',
      unavailable: 'Host 当前未提供 Crew 配置。',
      readOnly: '本部署的 Crew 配置为只读。',
      unsavedChanges: '有未保存的改动。',
      save: '保存',
      saving: '保存中…',
      saved: '已保存；下一次委派即会使用新值。',
      refused: 'Host 拒绝了本次保存并刷新了数值；请检查草稿后重试。',
      saveError: '保存请求失败；草稿已保留，请重试。',
      reset: '放弃改动',
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
    };

    /** Rows of the settings table, in the host schema's role order. */
    const ROLES = [
      { id: 'explore', nameKey: 'roleExplore', hintKey: 'roleExploreHint' },
      { id: 'architect', nameKey: 'roleArchitect', hintKey: 'roleArchitectHint' },
      { id: 'planner', nameKey: 'rolePlanner', hintKey: 'rolePlannerHint' },
      { id: 'reviewer', nameKey: 'roleReviewer', hintKey: 'roleReviewerHint' },
    ];

    /** Editable string leaves of one role; `roles.<role>.<id>` is the settings path. */
    const FIELDS = [
      { id: 'provider', labelKey: 'fieldProvider', placeholderKey: 'placeholderProvider', mono: true },
      { id: 'model', labelKey: 'fieldModel', placeholderKey: 'placeholderModel', mono: true },
      { id: 'reasoningEffort', labelKey: 'fieldEffort', placeholderKey: 'placeholderEffort' },
      { id: 'persona', labelKey: 'fieldPersona', placeholderKey: 'placeholderPersona', multiline: true, wide: true },
    ];

    /** HTTP route the Host half serves the live model catalog on (same origin). */
    const CATALOG_PATH = '/agent-flow/dsh-crew/catalog';

    /** Bound for one catalog fetch; the page falls back to built-in options after it. */
    const CATALOG_TIMEOUT_MS = 8000;

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

    /** Models of one built-in provider group. */
    function fallbackModels(providerId) {
      const group = FALLBACK_GROUPS.find((entry) => entry.id === providerId);
      return group === undefined ? [] : group.models;
    }

    /** Fill providers that answered without models from the built-in map. */
    function mergeFallback(groups) {
      if (!Array.isArray(groups) || groups.length === 0) return FALLBACK_GROUPS;
      return groups.map((group) => {
        if (Array.isArray(group.models) && group.models.length > 0) return group;
        return { ...group, models: fallbackModels(group.id) };
      });
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
      const read = async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
        try {
          const response = await fetch(CATALOG_PATH, {
            method: 'GET',
            credentials: 'same-origin',
            headers: { accept: 'application/json' },
            signal: controller.signal,
          });
          if (!response.ok) throw new Error('HTTP ' + String(response.status));
          const payload = await response.json();
          const groups = mergeFallback(payload.groups);
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
          inflight = read()
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
      roleCell: { padding: '6px 8px', borderBottom: '1px solid ' + COLORS.border, verticalAlign: 'top' },
      roleName: { display: 'block', fontWeight: 600, color: COLORS.primary, whiteSpace: 'nowrap' },
      roleHint: {
        display: 'block', maxWidth: 180, color: COLORS.secondary, fontSize: 11,
        lineHeight: 1.4, whiteSpace: 'normal',
      },
      input: {
        width: '100%', minWidth: 110, boxSizing: 'border-box', padding: '4px 6px',
        border: '1px solid ' + COLORS.border, borderRadius: 4, background: COLORS.layer2,
        color: COLORS.primary, fontSize: 12,
      },
      textarea: {
        width: '100%', minWidth: 180, boxSizing: 'border-box', padding: '4px 6px',
        border: '1px solid ' + COLORS.border, borderRadius: 4, background: COLORS.layer2,
        color: COLORS.primary, fontSize: 12, fontFamily: 'inherit', resize: 'vertical',
      },
      select: {
        width: '100%', minWidth: 110, boxSizing: 'border-box', padding: '4px 6px',
        border: '1px solid ' + COLORS.border, borderRadius: 4, background: COLORS.layer2,
        color: COLORS.primary, fontSize: 12, cursor: 'pointer',
      },
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
     * Read one string leaf out of the settings value.
     * @param value - the namespace value, possibly missing.
     * @param path - dotted settings path, e.g. `roles.architect.model`.
     * @returns the string leaf, or '' when missing or not a string.
     */
    function readLeaf(value, path) {
      let node = value;
      for (const part of path.split('.')) {
        if (node === null || typeof node !== 'object') return '';
        node = node[part];
      }
      return typeof node === 'string' ? node : '';
    }

    /**
     * Render a bundle's configuration page: one row per crew role, staged edits,
     * and an explicit save/discard action pair.
     * @param props - { view, t, form }: requested view, locale reader, shared configuration form.
     * @returns the page content.
     */
    function ConfigPage(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const form = props.form;
      const catalog = props.catalog;
      const snapshot = useControllerSnapshot(form);
      const catalogState = useControllerSnapshot(catalog);
      React.useEffect(() => {
        if (catalog !== undefined && catalog !== null && typeof catalog.load === 'function') catalog.load();
      }, [catalog]);
      const [draft, setDraft] = React.useState({});
      const [modes, setModes] = React.useState({});
      const [status, setStatus] = React.useState('idle');
      const ready = snapshot.status === 'ready';
      const readOnly = snapshot.writable === false;
      const disabled = !ready || readOnly || status === 'saving';
      const draftCount = Object.keys(draft).length;

      const valueOf = (path) => (
        Object.prototype.hasOwnProperty.call(draft, path) ? draft[path] : readLeaf(snapshot.value, path)
      );

      const edit = (path, text) => {
        setDraft((previous) => ({ ...previous, [path]: text }));
        setStatus('idle');
      };

      const setMode = (path, mode) => {
        setModes((previous) => ({ ...previous, [path]: mode }));
      };

      const reset = () => {
        setDraft({});
        setModes({});
        setStatus('idle');
      };

      const save = async () => {
        const entries = Object.entries(draft);
        if (entries.length === 0 || disabled || form === undefined) return;
        setStatus('saving');
        try {
          const ops = entries.map(([path, value]) => ({ op: 'set', path: path.split('.'), value }));
          const accepted = await form.mutate(ops, snapshot.revision);
          if (accepted) {
            setDraft({});
            setStatus('saved');
          } else {
            setStatus('refused');
          }
        } catch {
          setStatus('error');
        }
      };

      let statusText = '';
      let statusColor = COLORS.secondary;
      if (status === 'saving') {
        statusText = t('saving');
      } else if (status === 'saved') {
        statusText = t('saved');
        statusColor = COLORS.success;
      } else if (status === 'refused') {
        statusText = t('refused');
        statusColor = COLORS.error;
      } else if (status === 'error') {
        statusText = t('saveError');
        statusColor = COLORS.error;
      } else if (draftCount > 0) {
        statusText = t('unsavedChanges');
      }

      const notice = ready ? null : t(snapshot.status === 'loading' ? 'loading' : 'unavailable');

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

      const header = h('thead', null, h('tr', null,
        h('th', { scope: 'col', style: styles.th }, t('roleColumn')),
        FIELDS.map((field) => h('th', { key: field.id, scope: 'col', style: styles.th }, t(field.labelKey)))));
      const body = h('tbody', null, ROLES.map((role) => {
        const roleName = t(role.nameKey);
        const providerId = valueOf('roles.' + role.id + '.provider').trim();
        const modelId = valueOf('roles.' + role.id + '.model').trim();
        return h('tr', { key: role.id },
          h('td', { style: styles.roleCell },
            h('span', { style: styles.roleName }, roleName),
            h('span', { style: styles.roleHint }, t(role.hintKey))),
          FIELDS.map((field) => {
            const path = 'roles.' + role.id + '.' + field.id;
            const value = valueOf(path);
            const ariaLabel = t('ariaLabel', { role: roleName, field: t(field.labelKey) });
            const controlStyle = field.multiline
              ? styles.textarea
              : field.mono
                ? { ...styles.input, fontFamily: MONO }
                : styles.input;
            const common = {
              'aria-label': ariaLabel,
              disabled,
              placeholder: t(field.placeholderKey),
              spellCheck: false,
              style: controlStyle,
              value,
              onChange: (event) => edit(path, event.target.value),
            };
            const suggestions = field.id === 'persona'
              ? []
              : suggestionsFor(field.id, catalogState, providerId, modelId);
            const mode = modes[path];
            const knownValue = value === '' || suggestions.some((option) => option.value === value);
            const selectable = suggestions.length > 0 && mode !== 'text' && (knownValue || mode === 'list');
            let control;
            let action = null;
            if (selectable) {
              const options = field.id === 'reasoningEffort'
                ? [{ value: '', label: t('placeholderEffort') }]
                : value === ''
                  ? [{ value: '', label: t(field.placeholderKey) }]
                  : [];
              if (value !== '' && !suggestions.some((option) => option.value === value)) {
                options.push({ value, label: value });
              }
              options.push(...suggestions);
              control = h('select', {
                'aria-label': ariaLabel,
                disabled,
                style: styles.select,
                value,
                onChange: (event) => {
                  const next = event.target.value;
                  if (next === '__custom__') {
                    setMode(path, 'text');
                    return;
                  }
                  setMode(path, undefined);
                  edit(path, next);
                },
              },
                ...options.map((option) => h('option', { key: option.value, value: option.value }, option.label)),
                h('option', { key: '__custom__', value: '__custom__' }, t('customOption')));
            } else if (field.multiline) {
              control = h('textarea', { ...common, rows: 2 });
            } else {
              control = h('input', { ...common, type: 'text' });
            }
            if (suggestions.length > 0 && !selectable && mode !== 'list') {
              action = h('button', {
                type: 'button',
                onClick: () => setMode(path, 'list'),
                style: styles.linkButton,
              }, t('useList'));
            }
            return h('td', {
              key: field.id,
              style: field.wide ? { ...styles.cell, minWidth: 220 } : styles.cell,
            }, control, action);
          }));
      }));

      return h('section', { style: styles.section },
        h('h3', { style: styles.title }, t('title')),
        h('p', { style: styles.description }, t('description')),
        h('p', { style: styles.hint }, t('volatileHint')),
        notice === null ? null : h('p', { style: styles.notice }, notice),
        ready && readOnly ? h('p', { style: styles.notice }, t('readOnly')) : null,
        h('div', { style: styles.tableWrap }, h('table', { style: styles.table }, header, body)),
        catalogNote,
        h('p', { style: styles.hint }, t('effortHint')),
        h('div', { style: styles.actions },
          h('button', {
            type: 'button',
            onClick: save,
            disabled,
            style: disabled ? { ...styles.saveButton, opacity: 0.55, cursor: 'not-allowed' } : styles.saveButton,
          }, status === 'saving' ? t('saving') : t('save')),
          h('button', {
            type: 'button',
            onClick: reset,
            disabled: status === 'saving' || draftCount === 0,
            style: status === 'saving' || draftCount === 0
              ? { ...styles.resetButton, opacity: 0.55, cursor: 'not-allowed' }
              : styles.resetButton,
          }, t('reset')),
          h('span', { role: 'status', style: { ...styles.status, color: statusColor } }, statusText)));
    }

    return {
      inject: ['configForms', 'slots', 'locale'],
      apply(ctx) {
        const form = ctx.configForms.get('crew-config');
        const catalog = createCatalogStore();
        ctx.effect(() => ctx.locale.register(NS, { en, zh }));
        ctx.effect(() => ctx.configForms.whileServed(['crew-config'], () => ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
          name: 'plugins.bundle.config',
          key: '@agent-flow/dsh-crew',
          locale: NS,
          inject: () => ({ form, catalog }),
        }, ConfigPage))));
      },
    };
  },
});
