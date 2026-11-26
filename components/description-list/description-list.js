/**
 * <kakao-description-list>
 * ============================================================================
 * Key/value rows for summary and detail screens: "Plan / Pro", "Renews /
 * 1 Dec 2026". A real <dl>, with the term muted and the value in the text
 * colour. Term beside value where there is room, term above value where
 * there is not (a phone, a narrow column), so nothing is squeezed.
 * Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     description-list.js
 *  css        none
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="description-list.js"><\/script>
 *
 *   <kakao-description-list
 *     list-data='[["Plan", "Pro"], ["Renews", "1 Dec 2026"], ["Coupon", null]]'>
 *   </kakao-description-list>
 *
 *   <kakao-description-list dividers>
 *     <dt>Status</dt>
 *     <dd><kakao-badge tone="success">Active</kakao-badge></dd>
 *     <dt>Owner</dt>
 *     <dd><a href="/people/7">Ada Lovelace</a></dd>
 *   </kakao-description-list>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  list-data     JSON array of rows. A row is [term, value] or
 *                {"term": …, "value": …}; a value is a text, a number or an
 *                array of them (one <dd> each). null, "" and [] are empty
 *                values. Texts are set as text, never as HTML.
 *  layout        auto (default) · stacked. stacked puts the term above the
 *                value at every width. auto is side by side, which stacks by
 *                itself when a row is narrower than
 *                --kakao-description-list-stack-below.
 *  columns       2, 3 or 4: the pairs fill a grid of up to that many columns
 *                (row by row). Columns fall away while one would be narrower
 *                than --kakao-description-list-column-min-width.
 *  dividers      A hairline between the rows.
 *  size          sm · md (default). sm is the dense form.
 *  align         end puts the values at the end of the row (amounts in a
 *                summary). Not applied while stacked.
 *  empty-text    Shown for an empty value, default "—".
 *  empty-label   What a screen reader hears for an empty value while
 *                empty-text has no letter or digit in it, default "Not set".
 *  label         Accessible name of the list (aria-label), when no heading
 *                near it says what the list describes.
 *
 * CHILDREN: native <dt> and <dd> as direct children, for values with rich
 * content (badges, links, buttons). A <dt> starts a pair; more than one <dd>
 * after it are more values of that term, more than one <dt> before a <dd>
 * share the values. An empty <dd>, or a <dt> without one, shows empty-text.
 * Rows from list-data come first, then the children. Other children are not
 * shown. Children may change at any time; the list follows.
 *
 * The children keep their place in the page, so links and buttons in them stay
 * in the Tab order and keep their listeners; the list itself has no control
 * and takes no focus.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-description-list-text / -term-color / -empty-color / -line
 *  --kakao-description-list-font-size / -term-size / -term-weight / -value-weight
 *  --kakao-description-list-term-width / -gap / -stack-gap / -padding-y
 *  --kakao-description-list-stack-below / -column-gap / -column-min-width
 *  --kakao-description-list-divider-width
 *  --kakao-description-list-sm-font-size / -sm-term-size / -sm-padding-y
 *
 * Parts: list, row, term, value (the parts of rows from list-data; style
 * your own <dt> and <dd> from the page).
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-description-list';
  if (customElements.get(TAG_NAME)) return;

  const DEFAULT_EMPTY_TEXT = '—';
  const DEFAULT_EMPTY_LABEL = 'Not set';
  const MAX_COLUMNS = 4;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-description-list- (written by construction.html, edit there) */
        --_text: var(--kakao-description-list-text, var(--kakao-color-text, #18181b));
        --_term-color: var(--kakao-description-list-term-color, var(--kakao-color-muted, #62626c));
        --_empty-color: var(--kakao-description-list-empty-color, var(--kakao-color-muted, #62626c));
        --_line: var(--kakao-description-list-line, var(--kakao-color-line, #e4e4e7));
        --_font-size: var(--kakao-description-list-font-size, var(--kakao-font-size, 0.95rem));
        --_term-size: var(--kakao-description-list-term-size, 0.875rem);
        --_term-weight: var(--kakao-description-list-term-weight, 400);
        --_value-weight: var(--kakao-description-list-value-weight, 400);
        --_term-width: var(--kakao-description-list-term-width, 10rem);
        --_gap: var(--kakao-description-list-gap, 1rem);
        --_stack-gap: var(--kakao-description-list-stack-gap, 0.125rem);
        --_padding-y: var(--kakao-description-list-padding-y, 0.5rem);
        --_stack-below: var(--kakao-description-list-stack-below, 22rem);
        --_column-gap: var(--kakao-description-list-column-gap, 2rem);
        --_column-min-width: var(--kakao-description-list-column-min-width, 12rem);
        --_divider-width: var(--kakao-description-list-divider-width, 1px);
        --_sm-font-size: var(--kakao-description-list-sm-font-size, 0.875rem);
        --_sm-term-size: var(--kakao-description-list-sm-term-size, 0.8125rem);
        --_sm-padding-y: var(--kakao-description-list-sm-padding-y, 0.25rem);
        /* @kakao-settings:end */
        --_columns: 1;
        display: block;
        position: relative;
        color: var(--_text);
        font-size: var(--_font-size);
        line-height: 1.5;
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) {
        --_font-size: var(--_sm-font-size);
        --_term-size: var(--_sm-term-size);
        --_padding-y: var(--_sm-padding-y);
      }
      :host([columns="2"]) { --_columns: 2; }
      :host([columns="3"]) { --_columns: 3; }
      :host([columns="4"]) { --_columns: 4; }

      dl {
        display: grid;
        /* Up to --_columns columns; one falls away while it would be narrower
           than the minimum width, down to a single column. */
        grid-template-columns: repeat(
          auto-fill,
          minmax(min(100%, max(var(--_column-min-width), calc((100% - (var(--_columns) - 1) * var(--_column-gap)) / var(--_columns)))), 1fr)
        );
        column-gap: var(--_column-gap);
        margin: 0;
        padding: 0;
      }

      .row {
        display: grid;
        grid-template-columns: var(--_term-width) minmax(0, 1fr);
        grid-auto-flow: row dense;
        column-gap: var(--_gap);
        align-items: baseline;
        box-sizing: border-box;
        min-width: 0;
        padding-block: var(--_padding-y);
      }
      /* The list sits flush in its container: no padding above the first
         line of rows or below the last. */
      .row[data-first] { padding-top: 0; }
      .row[data-last] { padding-bottom: 0; }
      :host([dividers]) .row:not([data-first]) { border-top: var(--_divider-width) solid var(--_line); }

      /* A page that styles its own dt and dd (margins, an indent) must not
         shift the rows: the margins of slotted children are held. Colour and
         type stay the page's to override. */
      ::slotted(dt), ::slotted(dd) { margin: 0 !important; }
      dt, ::slotted(dt) {
        grid-column: 1;
        min-width: 0;
        margin: 0;
        color: var(--_term-color);
        font-size: var(--_term-size);
        font-weight: var(--_term-weight);
        overflow-wrap: anywhere;
      }
      dd, ::slotted(dd) {
        grid-column: 2;
        min-width: 0;
        margin: 0;
        color: var(--_text);
        font-weight: var(--_value-weight);
        overflow-wrap: anywhere;
      }
      dd.empty { color: var(--_empty-color); }

      :host([align="end"]) dl:not([data-stacked]) dd,
      :host([align="end"]) dl:not([data-stacked]) ::slotted(dd) { text-align: end; }

      /* Stacked: the term above its value. Asked for with layout="stacked",
         or set by the component while a row is too narrow for two columns. */
      dl[data-stacked] .row { display: block; }
      dl[data-stacked] dd { margin-top: var(--_stack-gap); }
      dl[data-stacked] ::slotted(dd) { margin-top: var(--_stack-gap) !important; }

      /* Measures --_stack-below in px; never seen. */
      .probe {
        position: absolute;
        inset: 0 auto auto 0;
        width: var(--_stack-below);
        height: 0;
        visibility: hidden;
        pointer-events: none;
      }
      .sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      @media print {
        .row { break-inside: avoid; }
      }
    </style>
    <dl part="list"></dl>
    <span class="probe" aria-hidden="true"></span>
  `;

  const isBlank = (value) => value === null || value === undefined || String(value).trim() === '';

  class KakaoDescriptionList extends HTMLElement {
    static get observedAttributes() {
      return ['list-data', 'layout', 'columns', 'dividers', 'size', 'align', 'empty-text', 'empty-label', 'label'];
    }

    constructor() {
      super();
      // Manual slot assignment: each pair of <dt>/<dd> children gets a row of
      // its own in the shadow <dl>, without wrapping or moving the children.
      const shadow = this.attachShadow({ mode: 'open', slotAssignment: 'manual' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._list = shadow.querySelector('dl');
      this._probe = shadow.querySelector('.probe');
      this._queued = false;
      this._children = new MutationObserver(() => this._queueRender());
      this._resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this._layout());
    }

    connectedCallback() {
      this._children.observe(this, { childList: true, subtree: true, characterData: true });
      if (this._resize) this._resize.observe(this);
      this._render();
    }

    disconnectedCallback() {
      this._children.disconnect();
      if (this._resize) this._resize.disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || oldValue === newValue) return;
      if (name === 'list-data' || name === 'empty-text' || name === 'empty-label') this._render();
      else if (name === 'label') this._renderLabel();
      else this._layout();
    }

    /** Several child changes in one task (a template filling the list) draw once. */
    _queueRender() {
      if (this._queued) return;
      this._queued = true;
      queueMicrotask(() => {
        this._queued = false;
        if (this.isConnected) this._render();
      });
    }

    /** Rows of list-data: [{ terms: [text], values: [text] }]. */
    _dataRows() {
      const raw = this.getAttribute('list-data');
      if (!raw || !raw.trim()) return [];
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        console.error(`${TAG_NAME}: invalid JSON in list-data`, error);
        return [];
      }
      if (!Array.isArray(parsed)) return [];
      const rows = [];
      parsed.forEach((entry) => {
        let term;
        let value;
        if (Array.isArray(entry)) [term, value] = entry;
        else if (entry && typeof entry === 'object') ({ term, value } = entry);
        else return;
        if (isBlank(term)) return;
        const values = (Array.isArray(value) ? value : [value]).filter((v) => !isBlank(v)).map(String);
        rows.push({ terms: [String(term)], values });
      });
      return rows;
    }

    /** Groups of <dt>/<dd> children: [{ nodes: [dt, dd …], empty }]. */
    _childGroups() {
      const groups = [];
      let group = null;
      let seenValue = false;
      Array.from(this.children).forEach((child) => {
        const tag = child.localName;
        if (tag !== 'dt' && tag !== 'dd') return;
        if (tag === 'dt') {
          if (!group || seenValue) {
            group = { nodes: [], empty: true };
            groups.push(group);
            seenValue = false;
          }
          group.nodes.push(child);
          return;
        }
        if (!group) return; // a <dd> before any <dt> describes nothing
        seenValue = true;
        // An empty <dd> is left out; the row shows the placeholder instead.
        if (child.childElementCount || child.textContent.trim()) {
          group.nodes.push(child);
          group.empty = false;
        }
      });
      return groups;
    }

    _emptyValue() {
      const attr = this.getAttribute('empty-text');
      const text = attr === null ? DEFAULT_EMPTY_TEXT : attr;
      const value = document.createElement('dd');
      value.className = 'empty';
      value.setAttribute('part', 'value');
      // A dash says nothing when read aloud: it gets a spoken text instead.
      if (/[\p{L}\p{N}]/u.test(text)) {
        value.textContent = text;
        return value;
      }
      const shown = document.createElement('span');
      shown.setAttribute('aria-hidden', 'true');
      shown.textContent = text;
      const spoken = document.createElement('span');
      spoken.className = 'sr';
      const label = this.getAttribute('empty-label');
      spoken.textContent = label === null ? DEFAULT_EMPTY_LABEL : label;
      value.append(shown, spoken);
      return value;
    }

    _row() {
      const row = document.createElement('div');
      row.className = 'row';
      row.setAttribute('part', 'row');
      return row;
    }

    _render() {
      const rows = [];
      const assignments = [];

      this._dataRows().forEach((data) => {
        const row = this._row();
        data.terms.forEach((text) => {
          const term = document.createElement('dt');
          term.setAttribute('part', 'term');
          term.textContent = text;
          row.appendChild(term);
        });
        data.values.forEach((text) => {
          const value = document.createElement('dd');
          value.setAttribute('part', 'value');
          value.textContent = text;
          row.appendChild(value);
        });
        if (!data.values.length) row.appendChild(this._emptyValue());
        rows.push(row);
      });

      this._childGroups().forEach((group) => {
        const row = this._row();
        const slot = document.createElement('slot');
        row.appendChild(slot);
        if (group.empty) row.appendChild(this._emptyValue());
        assignments.push([slot, group.nodes]);
        rows.push(row);
      });

      this._list.replaceChildren(...rows);
      assignments.forEach(([slot, nodes]) => slot.assign(...nodes));
      this._rows = rows;
      this._list.hidden = !rows.length;
      this._renderLabel();
      this._layout();
    }

    _renderLabel() {
      const label = (this.getAttribute('label') || '').trim();
      if (label) this._list.setAttribute('aria-label', label);
      else this._list.removeAttribute('aria-label');
    }

    /**
     * What CSS alone cannot know: how many columns the grid ended up with
     * (for the first and last line of rows) and whether a row is too narrow
     * for the term beside the value.
     */
    _layout() {
      const rows = this._rows || [];
      if (!rows.length) return;
      const tracks = getComputedStyle(this._list).gridTemplateColumns.split(' ').filter((t) => t.endsWith('px'));
      const columns = Math.max(1, Math.min(tracks.length || 1, MAX_COLUMNS, rows.length));
      const lastLineStart = Math.floor((rows.length - 1) / columns) * columns;
      rows.forEach((row, index) => {
        row.toggleAttribute('data-first', index < columns);
        row.toggleAttribute('data-last', index >= lastLineStart);
      });

      let stacked = this.getAttribute('layout') === 'stacked';
      if (!stacked) {
        const rowWidth = rows[0].getBoundingClientRect().width;
        const limit = this._probe.getBoundingClientRect().width;
        // Not laid out (display: none somewhere above): keep what it was.
        if (!rowWidth) return;
        stacked = rowWidth < limit;
      }
      this._list.toggleAttribute('data-stacked', stacked);
    }
  }

  customElements.define(TAG_NAME, KakaoDescriptionList);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }
})();
