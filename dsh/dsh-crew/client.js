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
      const snapshot = useControllerSnapshot(form);
      const [draft, setDraft] = React.useState({});
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

      const reset = () => {
        setDraft({});
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
      const header = h('thead', null, h('tr', null,
        h('th', { scope: 'col', style: styles.th }, t('roleColumn')),
        FIELDS.map((field) => h('th', { key: field.id, scope: 'col', style: styles.th }, t(field.labelKey)))));
      const body = h('tbody', null, ROLES.map((role) => {
        const roleName = t(role.nameKey);
        return h('tr', { key: role.id },
          h('td', { style: styles.roleCell },
            h('span', { style: styles.roleName }, roleName),
            h('span', { style: styles.roleHint }, t(role.hintKey))),
          FIELDS.map((field) => {
            const path = 'roles.' + role.id + '.' + field.id;
            const controlStyle = field.multiline
              ? styles.textarea
              : field.mono
                ? { ...styles.input, fontFamily: MONO }
                : styles.input;
            const common = {
              'aria-label': t('ariaLabel', { role: roleName, field: t(field.labelKey) }),
              disabled,
              placeholder: t(field.placeholderKey),
              spellCheck: false,
              style: controlStyle,
              value: valueOf(path),
              onChange: (event) => edit(path, event.target.value),
            };
            return h('td', {
              key: field.id,
              style: field.wide ? { ...styles.cell, minWidth: 220 } : styles.cell,
            }, field.multiline
              ? h('textarea', { ...common, rows: 2 })
              : h('input', { ...common, type: 'text' }));
          }));
      }));

      return h('section', { style: styles.section },
        h('h3', { style: styles.title }, t('title')),
        h('p', { style: styles.description }, t('description')),
        h('p', { style: styles.hint }, t('volatileHint')),
        notice === null ? null : h('p', { style: styles.notice }, notice),
        ready && readOnly ? h('p', { style: styles.notice }, t('readOnly')) : null,
        h('div', { style: styles.tableWrap }, h('table', { style: styles.table }, header, body)),
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
        ctx.effect(() => ctx.locale.register(NS, { en, zh }));
        ctx.effect(() => ctx.configForms.whileServed(['crew-config'], () => ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
          name: 'plugins.bundle.config',
          key: '@agent-flow/dsh-crew',
          locale: NS,
          inject: () => ({ form }),
        }, ConfigPage))));
      },
    };
  },
});
