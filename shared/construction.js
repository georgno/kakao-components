/*
 * construction.js — engine behind every construction page
 * ============================================================================
 * A construction page shows a live preview of one component and a settings
 * table for all of its visual custom properties. Values can be literals or
 * bound to a main variable (shared/tokens.css). Save writes them into the
 * component's settings block through tools/construct-server.js.
 *
 * Page contract:
 *
 *   <main data-construction data-target="switch-group"
 *         data-source="switch-group.js" data-title="Switch group">
 *     <div class="construction-preview"> …component instances… </div>
 *     <script type="application/json" class="construction-manifest">
 *       [{ "property": "--kakao-switch-track-height", "label": "Track height",
 *          "group": "Size & spacing", "type": "length" }, …]
 *     <\/script>
 *   </main>
 *
 * data-target is the component folder name, or "tokens" for the main-variables
 * page. data-source is the file with the settings block, relative to the page.
 *
 * Manifest entry: { property, label, group, type, min?, max?, step?, units?, hint? }
 * Types: color · length · radius · number · percent · duration · easing ·
 *        shadow · font · font-family · text
 *
 * Needs kakao-button (components/button) on the page for the toolbar.
 * ============================================================================
 */
(function () {
  'use strict';

  const ENGINE_URL = document.currentScript ? document.currentScript.src : location.href;
  const TOKENS_PAGE = new URL('../tokens.html', ENGINE_URL).href;
  const START_RE = /\/\* @kakao-settings:start prefix=(--kakao-[a-z0-9-]*)[^*]*\*\//;
  const END_MARK = '/* @kakao-settings:end */';
  const LINE_RE = /^--_([a-z0-9-]+): var\((--kakao-[a-z0-9-]+), (.+)\);$/;
  const TOKEN_DEFAULT_RE = /^var\((--kakao-[a-z0-9-]+), (.+)\)$/;
  const TOKEN_LINE_RE = /^(--kakao-[a-z0-9-]+): (.+);$/;
  const FORBIDDEN_VALUE = /[;{}<>\\`\n\r]|\*\/|\/\*|\$\{/;
  const SIMPLE_LENGTH_RE = /^(-?\d*\.?\d+)(px|rem|em|%|ch|vw|vh)?$/;
  const DURATION_RE = /^(-?\d*\.?\d+)(ms|s)$/;

  /** Which CSS property a value of each type is checked against. */
  const PROBE_PROPERTY = {
    color: 'color',
    length: 'margin-left',
    radius: 'border-top-left-radius',
    number: 'opacity',
    percent: 'border-top-left-radius',
    duration: 'transition-duration',
    easing: 'transition-timing-function',
    shadow: 'box-shadow',
    font: 'font',
    'font-family': 'font-family',
  };

  /** Which main-variable types a setting of each type may bind to. */
  const TOKEN_COMPAT = {
    color: ['color'],
    length: ['length'],
    radius: ['length'],
    duration: ['duration'],
    'font-family': ['font-family'],
  };

  const STORAGE_CANVAS = 'kakao-construction-canvas';

  /* -------------------------------------------------------------------------
   * Settings block parsing (mirrors tools/construct-server.js)
   * ----------------------------------------------------------------------- */

  function parseBlock(text, isTokens) {
    const start = text.match(START_RE);
    if (!start) throw new Error('no settings block found');
    const bodyStart = start.index + start[0].length;
    const end = text.indexOf(END_MARK, bodyStart);
    if (end < 0) throw new Error('settings block has no end marker');
    const entries = new Map();
    const problems = [];
    text.slice(bodyStart, end).split('\n').forEach((raw) => {
      const line = raw.trim();
      if (!line) return;
      if (isTokens) {
        const m = line.match(TOKEN_LINE_RE);
        if (m) entries.set(m[1], { value: m[2], token: null });
        else problems.push(line);
        return;
      }
      const m = line.match(LINE_RE);
      if (!m) { problems.push(line); return; }
      const bound = m[3].match(TOKEN_DEFAULT_RE);
      entries.set(m[2], bound ? { value: bound[2], token: bound[1] } : { value: m[3], token: null });
    });
    return { prefix: start[1], entries, problems };
  }

  async function fetchText(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return res.text();
  }

  /** Reads the main-variable manifest from tokens.html. */
  async function loadTokenManifest() {
    try {
      const html = await fetchText(TOKENS_PAGE);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const el = doc.querySelector('.construction-manifest');
      return el ? JSON.parse(el.textContent) : [];
    } catch (err) {
      console.warn('construction: could not read the main variables', err);
      return [];
    }
  }

  /* -------------------------------------------------------------------------
   * Small helpers
   * ----------------------------------------------------------------------- */

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else if (k in node && typeof v !== 'string') node[k] = v;
      else node.setAttribute(k, v === true ? '' : v);
    });
    children.flat().forEach((c) => c != null && node.append(c));
    return node;
  }

  function button(label, opts = {}) {
    const b = el('kakao-button', {
      label,
      size: 'sm',
      variant: opts.variant || 'secondary',
      icon: opts.icon,
      'icon-position': opts.iconPosition,
      'aria-label': opts.ariaLabel,
      title: opts.title,
    });
    if (opts.onClick) b.addEventListener('kakao-button-action', opts.onClick);
    return b;
  }

  function setDisabled(btn, disabled) {
    if (disabled) btn.setAttribute('disabled', '');
    else btn.removeAttribute('disabled');
  }

  const probe = document.createElement('span');
  function toHex(color) {
    probe.style.color = '';
    probe.style.color = color;
    if (!probe.style.color) return null;
    document.body.append(probe);
    const rgb = getComputedStyle(probe).color.match(/[\d.]+/g);
    probe.remove();
    if (!rgb) return null;
    return '#' + rgb.slice(0, 3).map((n) => Math.round(+n).toString(16).padStart(2, '0')).join('');
  }

  function isValid(type, value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    if (FORBIDDEN_VALUE.test(value)) return false;
    let depth = 0;
    for (const ch of value) {
      if (ch === '(') depth++;
      if (ch === ')' && --depth < 0) return false;
    }
    if (depth !== 0) return false;
    const prop = PROBE_PROPERTY[type];
    return prop ? CSS.supports(prop, value) : true;
  }

  function sameState(a, b) {
    return a.value === b.value && (a.token || null) === (b.token || null);
  }

  /* -------------------------------------------------------------------------
   * The construction page
   * ----------------------------------------------------------------------- */

  class Construction {
    constructor(root) {
      this.root = root;
      this.target = root.dataset.target;
      this.isTokens = this.target === 'tokens';
      this.sourceUrl = new URL(root.dataset.source, location.href).href;
      this.title = root.dataset.title || this.target;
      this.preview = root.querySelector('.construction-preview');
      const manifestEl = root.querySelector('.construction-manifest');
      this.manifest = manifestEl ? JSON.parse(manifestEl.textContent) : [];
      this.rows = new Map();      // property → row controller
      this.saved = new Map();     // property → { value, token }
      this.current = new Map();   // property → { value, token }
      this.tokens = [];           // main-variable manifest
      this.serverOnline = false;
    }

    async init() {
      this.buildLayout();
      const [source, tokens] = await Promise.all([
        fetchText(this.sourceUrl).catch((err) => { this.fail(err); return null; }),
        this.isTokens ? Promise.resolve(this.manifest) : loadTokenManifest(),
      ]);
      this.tokens = tokens;
      if (source == null) return;
      let block;
      try {
        block = parseBlock(source, this.isTokens);
      } catch (err) {
        this.fail(err);
        return;
      }
      this.prefix = block.prefix;
      this.manifest.forEach((entry) => {
        const saved = block.entries.get(entry.property);
        const state = saved || { value: this.computedDefault(entry), token: null };
        this.saved.set(entry.property, { ...state });
        this.current.set(entry.property, { ...state });
      });
      this.buildTable();
      this.reportMismatches(block);
      this.applyAll();
      this.refresh();
      this.checkServer();
      window.addEventListener('beforeunload', (e) => {
        if (this.changedCount() > 0) { e.preventDefault(); e.returnValue = ''; }
      });
    }

    /** Value used for a manifest entry that has no line in the block yet. */
    computedDefault(entry) {
      const host = this.sampleHost();
      const v = host ? getComputedStyle(host).getPropertyValue(entry.property).trim() : '';
      return v || '';
    }

    fail(err) {
      console.error(err);
      this.status(`Could not load the settings: ${err.message}`, 'error');
    }

    /* ---- layout ---------------------------------------------------------- */

    buildLayout() {
      const demoHref = this.isTokens ? null : 'demo.html';
      const overview = this.isTokens ? 'index.html' : '../../index.html';

      this.saveBtn = button('Save', { variant: 'primary', onClick: () => this.save() });
      this.resetAllBtn = button('Reset all', { onClick: () => this.resetAll() });
      this.copyBtn = button('Copy CSS', { onClick: () => this.copyCss() });
      this.statusEl = el('p', { class: 'construction-status', role: 'status', 'aria-live': 'polite' });
      this.warningsEl = el('div', { class: 'construction-warnings', hidden: true });

      const canvasPicker = el('div', { class: 'construction-canvas-picker', role: 'radiogroup', 'aria-label': 'Preview background' });
      ['light', 'dark', 'checker'].forEach((name) => {
        const id = `canvas-${name}`;
        canvasPicker.append(
          el('input', { type: 'radio', name: 'construction-canvas', id, value: name, onchange: () => this.setCanvas(name) }),
          el('label', { for: id, text: name === 'checker' ? 'Checkered' : name[0].toUpperCase() + name.slice(1) }),
        );
      });

      const header = el('header', { class: 'construction-header' },
        el('a', { class: 'back', href: overview, text: '← All components' }),
        el('div', { class: 'construction-heading' },
          el('h1', {}, el('span', { class: 'construction-kicker', text: 'Construction' }), ' ', this.title),
          el('nav', { class: 'construction-links' },
            demoHref && el('a', { href: demoHref, text: 'Demo' }),
            !this.isTokens && el('a', { href: '../../tokens.html', text: 'Main variables' }),
          ),
        ),
        el('div', { class: 'construction-toolbar' }, this.saveBtn, this.resetAllBtn, this.copyBtn, this.statusEl),
        this.warningsEl,
      );

      this.canvas = el('section', { class: 'construction-canvas', 'aria-label': 'Live preview' }, canvasPicker);
      this.preview.replaceWith(this.canvas);
      this.canvas.append(this.preview);

      this.filter = el('input', {
        type: 'search', class: 'construction-filter', placeholder: 'Filter settings…', 'aria-label': 'Filter settings',
        oninput: () => this.applyFilter(),
      });
      this.table = el('div', { class: 'construction-table' });
      const panel = el('section', { class: 'construction-panel', 'aria-label': 'Settings' }, this.filter, this.table);

      this.root.prepend(header);
      this.root.append(el('div', { class: 'construction-body' }, this.canvas, panel));

      let canvasName = 'light';
      try { canvasName = localStorage.getItem(STORAGE_CANVAS) || 'light'; } catch { /* storage blocked */ }
      this.setCanvas(canvasName);
      const radio = canvasPicker.querySelector(`[value="${canvasName}"]`);
      if (radio) radio.checked = true;
    }

    setCanvas(name) {
      this.canvas.dataset.canvas = name;
      try { localStorage.setItem(STORAGE_CANVAS, name); } catch { /* storage blocked */ }
    }

    buildTable() {
      const groups = new Map();
      this.manifest.forEach((entry) => {
        const g = entry.group || 'Other';
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(entry);
      });
      groups.forEach((entries, name) => {
        const body = el('div', { class: 'construction-group-body' });
        const details = el('details', { class: 'construction-group', open: true },
          el('summary', { text: name }), body);
        entries.forEach((entry) => {
          const row = this.createRow(entry);
          this.rows.set(entry.property, row);
          body.append(row.el);
        });
        this.table.append(details);
      });
    }

    reportMismatches(block) {
      const listed = new Set(this.manifest.map((e) => e.property));
      const warnings = [];
      this.manifest.forEach((e) => {
        if (!block.entries.has(e.property)) warnings.push(`${e.property} is in the table but not in the settings block of ${this.root.dataset.source}.`);
        if (!this.isTokens && this.prefix && !e.property.startsWith(this.prefix)) warnings.push(`${e.property} is outside the ${this.prefix}* namespace.`);
      });
      block.entries.forEach((_, prop) => {
        if (!listed.has(prop)) warnings.push(`${prop} is in the settings block but missing from the table.`);
      });
      block.problems.forEach((line) => warnings.push(`Unreadable settings line: ${line}`));
      if (!warnings.length) return;
      this.warningsEl.hidden = false;
      this.warningsEl.replaceChildren(
        el('strong', { text: `${warnings.length} warning${warnings.length > 1 ? 's' : ''}` }),
        el('ul', {}, warnings.map((w) => el('li', { text: w }))),
      );
    }

    /* ---- rows ------------------------------------------------------------ */

    createRow(entry) {
      const prop = entry.property;
      const type = entry.type || 'text';
      const id = `set-${prop.replace(/^--/, '')}`;
      const row = { entry, type };

      const label = el('label', { class: 'construction-label', for: id },
        el('span', { text: entry.label || prop }),
        el('code', { text: prop }));
      if (entry.hint) label.append(el('small', { text: entry.hint }));

      const editor = el('div', { class: 'construction-editor' });
      const bound = el('div', { class: 'construction-bound', hidden: true });
      const tokenBtn = el('button', {
        type: 'button', class: 'construction-icon', title: 'Use a main variable',
        'aria-label': `Use a main variable for ${entry.label || prop}`, text: '◆',
      });
      const resetBtn = el('button', {
        type: 'button', class: 'construction-icon', title: 'Reset to saved',
        'aria-label': `Reset ${entry.label || prop}`, text: '↺',
        onclick: () => this.update(prop, { ...this.saved.get(prop) }),
      });
      const tokenMenu = el('select', { class: 'construction-token-menu', hidden: true, 'aria-label': 'Main variable' });

      row.el = el('div', { class: 'construction-row', 'data-property': prop },
        label, el('div', { class: 'construction-control' }, editor, bound, tokenMenu), tokenBtn, resetBtn);

      // ---- literal editors per type
      const text = el('input', {
        id, type: 'text', class: 'construction-text', spellcheck: false, autocomplete: 'off',
        oninput: () => this.edit(prop, text.value),
      });
      row.setText = (v) => { if (document.activeElement !== text) text.value = v; };

      if (type === 'color') {
        const swatch = el('input', {
          type: 'color', class: 'construction-swatch', 'aria-label': `${entry.label || prop} colour picker`,
          oninput: () => { text.value = swatch.value; this.edit(prop, swatch.value); },
        });
        editor.append(swatch, text);
        row.show = (v) => {
          row.setText(v);
          // Expressions (color-mix, var) are shown with the colour they resolve to
          const hex = toHex(v) || (this.prefix && toHex(this.resolvedAlias(`var(--_${prop.slice(this.prefix.length)})`)));
          if (hex) swatch.value = hex;
        };
      } else if (type === 'length' || type === 'radius') {
        const units = entry.units || ['px', 'rem', 'em', '%'];
        const num = el('input', { type: 'number', class: 'construction-number', step: entry.step || 'any', 'aria-label': `${entry.label || prop} amount` });
        const unit = el('select', { class: 'construction-unit', 'aria-label': `${entry.label || prop} unit` },
          units.map((u) => el('option', { value: u, text: u || '–' })));
        const simple = el('span', { class: 'construction-simple' }, num, unit);
        const fx = el('button', { type: 'button', class: 'construction-icon construction-fx', title: 'Edit as expression', text: 'fx', 'aria-pressed': 'false' });
        const commit = () => { const v = `${num.value}${unit.value}`; text.value = v; this.edit(prop, v); };
        num.addEventListener('input', commit);
        unit.addEventListener('change', commit);
        let raw = false;
        const setRaw = (on) => {
          raw = on;
          fx.setAttribute('aria-pressed', String(on));
          simple.hidden = on;
          text.hidden = !on;
        };
        fx.addEventListener('click', () => setRaw(!raw));
        editor.append(simple, text, fx);
        row.show = (v) => {
          row.setText(v);
          const m = v.match(SIMPLE_LENGTH_RE);
          if (m && units.includes(m[2] || '') || (m && m[1] === '0')) {
            if (document.activeElement !== num) num.value = m[1];
            if (m[2] && !units.includes(m[2])) unit.append(el('option', { value: m[2], text: m[2] }));
            unit.value = m[2] || units[0];
            if (!raw || document.activeElement !== text) setRaw(false);
          } else {
            setRaw(true);
          }
        };
      } else if (type === 'number' || type === 'percent') {
        const isPct = type === 'percent';
        const min = entry.min ?? 0;
        const max = entry.max ?? (isPct ? 100 : 2);
        const step = entry.step ?? (isPct ? 1 : 0.01);
        const range = el('input', { type: 'range', class: 'construction-range', min, max, step, 'aria-label': `${entry.label || prop} slider` });
        const num = el('input', { type: 'number', class: 'construction-number', min, max, step, 'aria-label': `${entry.label || prop} value` });
        const commit = (src) => {
          const v = isPct ? `${src.value}%` : String(src.value);
          (src === range ? num : range).value = src.value;
          text.value = v;
          this.edit(prop, v);
        };
        range.addEventListener('input', () => commit(range));
        num.addEventListener('input', () => commit(num));
        editor.append(range, num);
        if (isPct) editor.append(el('span', { class: 'construction-suffix', text: '%' }));
        text.hidden = true;
        editor.append(text);
        row.show = (v) => {
          row.setText(v);
          const n = parseFloat(v);
          if (!Number.isNaN(n)) {
            range.value = n;
            if (document.activeElement !== num) num.value = n;
          }
        };
      } else if (type === 'duration') {
        const num = el('input', { type: 'number', class: 'construction-number', min: 0, step: entry.step || 10, 'aria-label': `${entry.label || prop} in milliseconds` });
        num.addEventListener('input', () => { const v = `${num.value}ms`; text.value = v; this.edit(prop, v); });
        editor.append(num, el('span', { class: 'construction-suffix', text: 'ms' }));
        text.hidden = true;
        editor.append(text);
        row.show = (v) => {
          row.setText(v);
          const m = v.match(DURATION_RE);
          if (m && document.activeElement !== num) num.value = m[2] === 's' ? +m[1] * 1000 : +m[1];
        };
      } else {
        editor.append(text);
        row.show = (v) => row.setText(v);
      }

      // ---- main-variable binding
      const compatible = this.isTokens ? [] : this.tokens.filter((t) => (TOKEN_COMPAT[type] || []).includes(t.type));
      if (!compatible.length) {
        tokenBtn.classList.add('is-unavailable');
        tokenBtn.disabled = true;
        tokenBtn.tabIndex = -1;
      } else {
        tokenMenu.append(el('option', { value: '', text: 'Choose a main variable…' }),
          ...compatible.map((t) => el('option', { value: t.property, text: t.label || t.property })));
        tokenBtn.addEventListener('click', () => {
          tokenMenu.hidden = !tokenMenu.hidden;
          if (!tokenMenu.hidden) { tokenMenu.value = ''; tokenMenu.focus(); }
        });
        tokenMenu.addEventListener('change', () => {
          if (tokenMenu.value) this.bind(prop, tokenMenu.value);
          tokenMenu.hidden = true;
        });
        tokenMenu.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') { tokenMenu.hidden = true; tokenBtn.focus(); }
        });
      }
      row.showBound = (token, literal) => {
        const follows = !token && this.followedSetting(literal);
        const isBound = !!token || !!follows;
        bound.hidden = !isBound;
        editor.hidden = isBound;
        tokenBtn.classList.toggle('is-active', !!token);
        if (!isBound) return;
        if (follows) {
          const value = this.resolvedAlias(literal);
          bound.replaceChildren(
            el('span', { class: 'construction-chip is-follow', title: literal },
              type === 'color' ? el('span', { class: 'construction-chip-swatch', style: `background:${value}` }) : null,
              el('span', { text: `Follows ${follows.label || follows.property}` }),
              el('small', { text: value })),
            el('button', {
              type: 'button', class: 'construction-icon', text: '×', title: 'Use its own value',
              'aria-label': `Give ${entry.label || prop} its own value`,
              onclick: () => this.update(prop, { value: value || literal, token: null }),
            }),
          );
          return;
        }
        const meta = this.tokens.find((t) => t.property === token);
        const value = this.tokenValue(token);
        const swatch = type === 'color' ? el('span', { class: 'construction-chip-swatch', style: `background:${value}` }) : null;
        bound.replaceChildren(
          el('span', { class: 'construction-chip', title: token }, swatch,
            el('span', { text: meta ? meta.label : token }),
            el('small', { text: value })),
          el('button', {
            type: 'button', class: 'construction-icon', text: '×', title: 'Detach from main variable',
            'aria-label': `Detach ${entry.label || prop} from ${meta ? meta.label : token}`,
            onclick: () => this.unbind(prop),
          }),
        );
      };
      row.markInvalid = (invalid) => row.el.classList.toggle('is-invalid', invalid);
      row.markChanged = (changed) => {
        row.el.classList.toggle('is-changed', changed);
        resetBtn.disabled = !changed;
      };
      return row;
    }

    /* ---- state ----------------------------------------------------------- */

    /** First instance of the component in the preview (its aliases live there). */
    sampleHost() {
      return this.preview.querySelector(`kakao-${this.target}`)
        || [...this.preview.querySelectorAll('*')].find((n) => n.localName.includes('-'))
        || null;
    }

    /** A default like var(--_track-bg-on) follows another setting. */
    followedSetting(value) {
      const m = /^var\(--_([a-z0-9-]+)\)$/.exec(value || '');
      if (!m || !this.prefix) return null;
      const property = this.prefix + m[1];
      return this.manifest.find((e) => e.property === property) || { property };
    }

    resolvedAlias(value) {
      const host = this.sampleHost();
      const name = value.slice(4, -1);
      return host ? getComputedStyle(host).getPropertyValue(name).trim() : '';
    }

    tokenValue(token) {
      return getComputedStyle(this.canvas).getPropertyValue(token).trim();
    }

    /** A literal typed into a row. */
    edit(prop, value) {
      const row = this.rows.get(prop);
      const valid = isValid(row.type, value);
      row.markInvalid(!valid);
      if (!valid) { this.refresh(); return; }
      this.current.set(prop, { value: value.trim(), token: null });
      this.apply(prop);
      row.show(value.trim());
      this.refresh();
    }

    update(prop, state) {
      this.current.set(prop, { ...state });
      this.rows.get(prop).markInvalid(false);
      this.apply(prop);
      this.renderRow(prop);
      this.refresh();
    }

    bind(prop, token) {
      this.update(prop, { value: this.tokenValue(token) || this.current.get(prop).value, token });
    }

    /** Detach keeps the variable's current value as a literal. */
    unbind(prop) {
      const { token, value } = this.current.get(prop);
      this.update(prop, { value: (token && this.tokenValue(token)) || value, token: null });
    }

    apply(prop) {
      const { value, token } = this.current.get(prop);
      if (this.isTokens) {
        this.canvas.style.setProperty(prop, value);
        // Rows bound elsewhere show the new value of this variable
        return;
      }
      this.canvas.style.setProperty(prop, token ? `var(${token}, ${value})` : value);
    }

    applyAll() {
      this.current.forEach((_, prop) => { this.apply(prop); this.renderRow(prop); });
    }

    renderRow(prop) {
      const row = this.rows.get(prop);
      const { value, token } = this.current.get(prop);
      row.showBound(token, value);
      if (!token && !this.followedSetting(value)) row.show(value);
    }

    changedCount() {
      let n = 0;
      this.current.forEach((state, prop) => { if (!sameState(state, this.saved.get(prop))) n++; });
      return n;
    }

    invalidCount() {
      return this.table.querySelectorAll('.construction-row.is-invalid').length;
    }

    refresh() {
      this.current.forEach((state, prop) => {
        const row = this.rows.get(prop);
        row.markChanged(!sameState(state, this.saved.get(prop)));
        // Chips show resolved values, which may depend on other settings
        if (state.token || this.followedSetting(state.value)) row.showBound(state.token, state.value);
      });
      const changed = this.changedCount();
      const invalid = this.invalidCount();
      setDisabled(this.resetAllBtn, changed === 0);
      setDisabled(this.saveBtn, !this.serverOnline || changed === 0 || invalid > 0);
      this.saveBtn.setAttribute('label', changed ? `Save ${changed} change${changed > 1 ? 's' : ''}` : 'Save');
      if (invalid) this.status(`${invalid} invalid value${invalid > 1 ? 's' : ''}: fix ${invalid > 1 ? 'them' : 'it'} to save.`, 'error');
      else if (!this.serverOnline) this.status(this.offlineHint(), 'hint');
      else this.status(changed ? 'Unsaved changes.' : 'All settings saved.', changed ? 'pending' : 'ok');
    }

    status(message, kind) {
      this.statusEl.textContent = message;
      this.statusEl.dataset.kind = kind || '';
    }

    offlineHint() {
      return 'Save needs the construction server: run `node tools/construct-server.js` and open this page from http://localhost:8790.';
    }

    resetAll() {
      this.saved.forEach((state, prop) => {
        this.current.set(prop, { ...state });
        this.rows.get(prop).markInvalid(false);
        this.apply(prop);
        this.renderRow(prop);
      });
      this.refresh();
    }

    applyFilter() {
      const q = this.filter.value.trim().toLowerCase();
      this.rows.forEach((row) => {
        const hay = `${row.entry.label} ${row.entry.property} ${row.entry.group}`.toLowerCase();
        row.el.hidden = q !== '' && !hay.includes(q);
      });
      this.table.querySelectorAll('.construction-group').forEach((g) => {
        g.hidden = !g.querySelector('.construction-row:not([hidden])');
      });
    }

    /* ---- copy / save ----------------------------------------------------- */

    cssText() {
      const changed = [...this.current].filter(([prop, s]) => !sameState(s, this.saved.get(prop)));
      const list = changed.length ? changed : [...this.current];
      return list.map(([prop, s]) => `${prop}: ${s.token ? `var(${s.token}, ${s.value})` : s.value};`).join('\n');
    }

    async copyCss() {
      const text = this.cssText();
      try {
        await navigator.clipboard.writeText(text);
        this.status('CSS copied to the clipboard.', 'ok');
      } catch {
        window.prompt('Copy the CSS:', text);
      }
    }

    async checkServer() {
      try {
        const res = await fetch('/__construct/status', { cache: 'no-store' });
        const data = res.ok ? await res.json() : null;
        this.serverOnline = !!(data && data.name === 'kakao-construct');
      } catch {
        this.serverOnline = false;
      }
      this.refresh();
    }

    async save() {
      if (!this.serverOnline || this.invalidCount() || !this.changedCount()) return;
      const settings = [...this.current].map(([property, s]) => (
        s.token ? { property, value: s.value, token: s.token } : { property, value: s.value }));
      this.saveBtn.setAttribute('disabled', '');
      this.status('Saving…', 'pending');
      try {
        const res = await fetch('/__construct/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: this.target, settings }),
        });
        const data = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
        if (!data.ok) throw new Error(data.error || `HTTP ${res.status}`);
        // Re-read what was written, so "saved" is what the file really holds.
        const block = parseBlock(await fetchText(this.sourceUrl), this.isTokens);
        this.manifest.forEach(({ property }) => {
          const s = block.entries.get(property);
          if (s) this.saved.set(property, { ...s });
        });
        this.refresh();
        this.status(`Saved to ${data.file}.`, 'ok');
        this.root.dispatchEvent(new CustomEvent('construction-save', { detail: { file: data.file }, bubbles: true }));
      } catch (err) {
        this.refresh();
        this.status(`Save failed: ${err.message}`, 'error');
      }
    }
  }

  function start() {
    document.querySelectorAll('[data-construction]').forEach((root) => {
      const c = new Construction(root);
      root.construction = c;
      // Components are deferred too; wait until they are defined so computed
      // defaults and the toolbar buttons are real.
      const tags = new Set([...root.querySelectorAll('*')].map((n) => n.localName).filter((n) => n.includes('-')));
      tags.add('kakao-button');
      const ready = Promise.all([...tags].map((t) => customElements.whenDefined(t)));
      const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
      Promise.race([ready, timeout]).then(() => c.init());
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
