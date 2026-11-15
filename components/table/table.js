/**
 * <kakao-table>
 * ============================================================================
 * A data table: sortable headings, row selection, a sticky header, striped,
 * dense and bordered forms, an empty and a loading state. On a narrow element
 * (a phone) each row wraps into a block of label / value pairs, the column
 * heading as the label, so no column is squeezed or hidden.
 *
 * Light DOM (needs table.css): the component draws a real <table> in the page,
 * or takes the server-rendered <table> it is wrapped around and enhances it in
 * place. Cells stay page content: links, buttons and page scripts in them keep
 * working, and the selection checkboxes submit with the form around them.
 * Vanilla JS, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="table.css" />
 *   <script src="table.js"><\/script>
 *
 *   <kakao-table selectable sort="name" label="Files" list-data='{
 *     "columns": [
 *       { "key": "name", "label": "Name", "sortable": true },
 *       { "key": "size", "label": "Size (MB)", "type": "number", "sortable": true },
 *       { "key": "owner", "label": "Owner" }
 *     ],
 *     "rows": [
 *       { "id": 1, "name": "report.pdf", "size": 2.4, "owner": "Ada" },
 *       { "id": 2, "name": "photo.jpg", "size": 4, "owner": null }
 *     ]
 *   }'></kakao-table>
 *
 *   <!-- A server-rendered table (Yii2 GridView): enhanced where it is -->
 *   <kakao-table selectable selection-name="selection[]">
 *     <table>
 *       <thead><tr>
 *         <th><a href="?sort=name" data-sort="name">Name</a></th>
 *         <th data-type="number">Amount</th>
 *       </tr></thead>
 *       <tbody>
 *         <tr data-key="12"><td><a href="/view/12">Ada</a></td><td>120.00</td></tr>
 *       </tbody>
 *     </table>
 *   </kakao-table>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  list-data        JSON { "columns": […], "rows": […] }. The component then
 *                   draws the table itself. Texts are set as text, never HTML.
 *                   A column: key, label, type ("text" | "number"), align
 *                   ("start" | "center" | "end"; a number is "end"), sortable,
 *                   width (a number is px, else a CSS length), hideLabel (the
 *                   heading is only read out, and the wrapped cell has no
 *                   label: an action column).
 *                   A row: an object by column key, or an array in column
 *                   order. Its id is row[row-key], else its position. Also
 *                   read: "selected": true, and "data": { … } (data-* on the
 *                   <tr>). null, undefined and "" are empty cells.
 *  row-key          The row property that holds the id, default "id".
 *  sort             The sorted column, Yii2 style: "name" ascending, "-name"
 *                   descending. Reflected when the user sorts.
 *  sort-mode        "server": headings only fire sort-change and show the
 *                   state; the page loads the rows. Anything else sorts the
 *                   rows in the browser.
 *  selectable       A checkbox per row and "select all" in the heading.
 *  selection-name   name of the row checkboxes (value: the row id), so the
 *                   selection submits with a form: "selection[]" for Yii2.
 *  sticky-header    The heading row stays at the top while the page scrolls
 *                   (offset: --kakao-table-sticky-top). Not in the wrapped
 *                   form, where there is no heading row.
 *  striped          Every other row on a subtle fill.
 *  dense            Less row padding, smaller text.
 *  bordered         A frame around the table and lines between the columns.
 *  scroll           Opt-in: never wraps the rows. A table wider than its
 *                   frame scrolls sideways in it, with the edge fade on each
 *                   side that has more. --kakao-table-max-height also lets it
 *                   scroll down in the frame (the sticky header then sticks
 *                   to the frame).
 *  layout           "stacked" wraps the rows at every width. Otherwise they
 *                   wrap while the element is narrower than
 *                   --kakao-table-stack-below (its own width, not the
 *                   window's).
 *  loading          Placeholder rows instead of the rows (kakao-skeleton
 *                   where it is loaded), aria-busy and a spoken "Loading".
 *  loading-rows     How many placeholder rows. Default: as many as there were
 *                   rows, at most 10; 5 for a table without rows.
 *  label            Accessible name of the table, when it has no <caption>.
 *  empty-text       Shown in an empty cell, default "—".
 *  empty-label      What a screen reader hears for it while empty-text has no
 *                   letter or digit, default "Not set".
 *  empty-heading    Heading of the empty state (no rows), default "Nothing to show".
 *  empty-message    Its message.
 *
 * CHILDREN
 *  <table>          A native table to enhance, when there is no list-data.
 *                   Read from it: th[data-key | data-type | data-align |
 *                   data-sortable | data-width | data-hide-label | data-label],
 *                   tr[data-key | data-id | data-selected],
 *                   td[data-sort-value]. A heading whose only content is a
 *                   link (Yii2's sorter) is sortable through that link: it
 *                   gets the icon and aria-sort (from `sort`, else from the
 *                   link's class asc / desc) and stays a real link. Only the
 *                   first row of <thead> is the heading row; further rows
 *                   there (filters) are left alone. No colspan or rowspan in
 *                   the body. Rows may be replaced at any time (pjax); the
 *                   table follows. After changing cell texts call refresh().
 *  [data-table-empty]  or a <kakao-empty-state> child: your own empty state.
 *                   Write it with `hidden`; the table shows it when there are
 *                   no rows. Without one it makes a kakao-empty-state where
 *                   that is loaded, else a plain text.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  columns · rows       Property form of list-data. Columns set here may also
 *                       carry render(value, row, column) returning a Node or
 *                       a text, for cells with buttons or badges. Setting
 *                       only rows keeps the heading row (and focus in it);
 *                       heading rows after the first (a grid view's filter
 *                       row) are kept on every redraw.
 *  selected             Array of the selected row ids (strings). Settable.
 *  sort · loading       Attribute mirrors.
 *  stacked              True while the rows are wrapped. Read only.
 *  sortBy(key, direction)   direction "asc" | "desc" | "none". Fires no event.
 *  selectAll() · clearSelection()   Fire selection-change, source "api".
 *  refresh()            Reads the table again.
 *
 *  KakaoTable.texts     The words: { label, sortBy, notSorted, ascending,
 *                       descending, selectAll, selectRow, selectRowPlain,
 *                       emptyHeading, loading }.
 *  KakaoTable.types     Column types: { align, compare(a, b), format(value,
 *                       row, column) }. Add your own ("date", "money").
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  sort-change        { key, direction, sort, previous, href, source }.
 *                     direction "asc" | "desc" | "none", sort the new value of
 *                     the attribute. Cancelable: cancelled, nothing changes
 *                     (and a link heading is not followed). For a link
 *                     heading direction is null and href is the link.
 *  selection-change   { selected, source }: the ids, "user" or "api".
 *  table-render       After the table was read or drawn again (does not
 *                     bubble). For code that decorates it, like a grid view.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block of table.css)
 * ----------------------------------------------------------------------------
 *  --kakao-table-text / -head-color / -head-bg / -muted / -line / -stripe-bg
 *  --kakao-table-selected-bg / -selected-muted / -sort-color / -sort-active-color / -focus
 *  --kakao-table-box-bg / -box-border / -box-checked-bg / -mark / -skeleton
 *  --kakao-table-control-bg / -control-border / -control-radius
 *  --kakao-table-font-size / -head-size / -head-weight
 *  --kakao-table-cell-padding-x / -cell-padding-y / -line-width / -radius
 *  --kakao-table-dense-font-size / -dense-head-size / -dense-padding-y
 *  --kakao-table-sticky-top / -max-height / -scroll-fade
 *  --kakao-table-stack-below / -label-width / -label-size / -label-gap
 *  --kakao-table-block-padding / -stack-gap
 *  --kakao-table-box-size / -box-radius / -focus-width / -focus-offset / -duration
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-table';
  if (customElements.get(TAG_NAME)) return;

  const DEFAULT_EMPTY_TEXT = '—';
  const PREFIX = 'kakao-table-';
  const MAX_LOADING_ROWS = 10;
  const BONE_WIDTHS = ['70%', '45%', '85%', '60%'];

  /** The built-in words. Change them for every table with KakaoTable.texts. */
  const TEXTS = {
    label: 'Table',
    sortBy: 'Sort by',
    notSorted: 'Not sorted',
    ascending: '{label}, ascending',
    descending: '{label}, descending',
    selectAll: 'Select all',
    selectRow: 'Select {row}',
    selectRowPlain: 'Select row',
    emptyHeading: 'Nothing to show',
    emptyLabel: 'Not set',
    loading: 'Loading',
  };

  const collator = typeof Intl !== 'undefined' && Intl.Collator
    ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    : { compare: (a, b) => (a < b ? -1 : a > b ? 1 : 0) };

  /** "1 234,50 €" and "1,234.50" both read as a number; NaN when there is none. */
  const toNumber = (value) => {
    if (typeof value === 'number') return value;
    let text = String(value).replace(/[^\d.,\-−]/g, '').replace('−', '-');
    const comma = text.lastIndexOf(',');
    const dot = text.lastIndexOf('.');
    // The last of the two is the decimal mark; a lone comma followed by exactly
    // three digits is a thousands mark.
    if (comma > dot && !(dot === -1 && /,\d{3}$/.test(text) && text.indexOf(',') === comma)) {
      text = text.replace(/\./g, '').replace(',', '.');
    } else {
      text = text.replace(/,/g, '');
    }
    return parseFloat(text);
  };

  /** Column types. A type may set align, compare(a, b) and format(value, row, column). */
  const TYPES = {
    text: { align: 'start', compare: (a, b) => collator.compare(String(a), String(b)) },
    number: {
      align: 'end',
      compare: (a, b) => {
        const x = toNumber(a);
        const y = toNumber(b);
        if (Number.isNaN(x) || Number.isNaN(y)) return Number.isNaN(x) - Number.isNaN(y);
        return x - y;
      },
    },
  };

  const isBlank = (value) => value === null || value === undefined || String(value).trim() === '';
  const fill = (text, values) => String(text).replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
  const el = (tag, className) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  };
  const setAttr = (node, name, value) => {
    if (value === null || value === undefined || value === false) {
      if (node.hasAttribute(name)) node.removeAttribute(name);
    } else if (node.getAttribute(name) !== String(value)) {
      node.setAttribute(name, value);
    }
  };

  const ICONS = document.createElement('template');
  ICONS.innerHTML = `
    <svg class="${PREFIX}sort-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path class="${PREFIX}sort-up" d="M5 6.5l3-3 3 3"/><path class="${PREFIX}sort-down" d="M5 9.5l3 3 3-3"/></svg>
    <span class="${PREFIX}box" aria-hidden="true"><svg class="${PREFIX}tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><svg class="${PREFIX}dash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M6 12h12"/></svg></span>
  `;
  const sortIcon = () => ICONS.content.querySelector('svg').cloneNode(true);
  const checkBox = () => ICONS.content.querySelector(`.${PREFIX}box`).cloneNode(true);

  /* Edge fade (styleguide rule: overflowing horizontal scrollers get an edge
     fade). Marks the physical side(s) with more to scroll as data-more-left /
     data-more-right; attributes change only when the state does. */
  function syncEdgeFade(scroller, enabled = true) {
    const max = scroller.scrollWidth - scroller.clientWidth;
    let left = false;
    let right = false;
    if (enabled && max > 1) {
      // From the left edge, 0..max: right-to-left scrollLeft runs from 0 down to -max.
      const x = getComputedStyle(scroller).direction === 'rtl' ? max + scroller.scrollLeft : scroller.scrollLeft;
      left = x > 1;
      right = x < max - 1;
    }
    if (left !== scroller.hasAttribute('data-more-left')) scroller.toggleAttribute('data-more-left', left);
    if (right !== scroller.hasAttribute('data-more-right')) scroller.toggleAttribute('data-more-right', right);
    return max > 1;
  }

  const instances = new Set(); // connected tables, redrawn when the texts change
  let texts = { ...TEXTS };

  class KakaoTable extends HTMLElement {
    static get TEXTS() { return { ...TEXTS }; }
    static get texts() { return { ...texts }; }
    static set texts(value) {
      texts = { ...TEXTS, ...(value && typeof value === 'object' ? value : {}) };
      instances.forEach((table) => table._render());
    }

    /** The type registry itself: KakaoTable.types.date = { compare, format }. */
    static get types() { return TYPES; }

    static get observedAttributes() {
      return [
        'list-data', 'row-key', 'sort', 'sort-mode', 'selectable', 'selection-name', 'loading', 'loading-rows',
        'label', 'empty-text', 'empty-label', 'empty-heading', 'empty-message', 'scroll', 'layout',
      ];
    }

    constructor() {
      super();
      this._data = null; // { columns, rows } from list-data or the properties
      this._dataDirty = false;
      this._columns = [];
      this._rows = [];
      this._selected = new Set();
      this._seen = new WeakSet(); // rows whose data-selected was read
      this._order = new WeakMap(); // row -> position as written, to undo a sort
      this._nextOrder = 0;
      this._values = new WeakMap(); // cell -> raw value from list-data
      this._queued = false;
      this._waiting = new Set(); // optional components we wait for
      this._observer = new MutationObserver((records) => {
        if (records.some((record) => this._isStructural(record))) this._queueRender();
      });
      this._resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this._layout());
      this._onClick = (event) => this._handleClick(event);
      this._onChange = (event) => this._handleChange(event);
      this._onScroll = () => this._syncScroll();
    }

    connectedCallback() {
      instances.add(this);
      this.addEventListener('click', this._onClick);
      this.addEventListener('change', this._onChange);
      if (this.hasAttribute('list-data') && !this._data) this._readData();
      this._render();
      if (this._resize) this._resize.observe(this);
    }

    disconnectedCallback() {
      instances.delete(this);
      this.removeEventListener('click', this._onClick);
      this.removeEventListener('change', this._onChange);
      this._observer.disconnect();
      if (this._resize) this._resize.disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || oldValue === newValue) return;
      if (name === 'list-data' || name === 'row-key') {
        this._readData();
        this._render();
      } else if (name === 'sort' || name === 'sort-mode') {
        this._mutate(() => this._applySort());
        this._syncTools();
      } else if (name === 'scroll' || name === 'layout') {
        this._layout();
      } else {
        this._render();
      }
    }

    /* ---------------------------------------------------------------- API */

    get columns() { return this._data ? this._data.columns.map((column) => ({ ...column })) : this._columns.map(({ th, control, link, ...column }) => column); }
    set columns(value) {
      this._data = { columns: this._normalColumns(value), rows: this._data ? this._data.rows : [] };
      this._dataDirty = true;
      if (this.isConnected) this._render();
    }

    get rows() { return this._data ? this._data.rows.slice() : []; }
    set rows(value) {
      this._data = { columns: this._data ? this._data.columns : [], rows: Array.isArray(value) ? value.slice() : [] };
      this._dataDirty = true;
      if (this.isConnected) this._render();
    }

    get selected() { return this._rows.filter((row) => this._selected.has(row.id)).map((row) => row.id); }
    set selected(value) {
      this._selected = new Set(Array.from(value || [], String));
      this._syncSelection();
    }

    get sort() { return this.getAttribute('sort') || ''; }
    set sort(value) { setAttr(this, 'sort', isBlank(value) ? null : String(value)); }

    get loading() { return this.hasAttribute('loading'); }
    set loading(value) { this.toggleAttribute('loading', Boolean(value)); }

    get stacked() { return this.hasAttribute('data-stacked'); }

    sortBy(key, direction = 'asc') {
      this.sort = direction === 'none' || isBlank(key) ? '' : `${direction === 'desc' ? '-' : ''}${key}`;
    }

    selectAll() { this._select(this._rows.map((row) => row.id), 'api'); }
    clearSelection() { this._select([], 'api'); }
    refresh() { this._render(); }

    /* --------------------------------------------------------------- Data */

    _normalColumns(value) {
      if (!Array.isArray(value)) return [];
      return value
        .filter((column) => column && typeof column === 'object')
        .map((column, index) => ({ ...column, key: isBlank(column.key) ? String(index) : String(column.key), label: isBlank(column.label) ? '' : String(column.label) }));
    }

    _readData() {
      const raw = this.getAttribute('list-data');
      this._dataDirty = true;
      if (raw === null) {
        this._data = null;
        return;
      }
      let parsed = null;
      if (raw.trim()) {
        try {
          parsed = JSON.parse(raw);
        } catch (error) {
          console.error(`${TAG_NAME}: invalid JSON in list-data`, error);
        }
      }
      const source = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      this._data = { columns: this._normalColumns(source.columns), rows: Array.isArray(source.rows) ? source.rows : [] };
    }

    /** The cells of one list-data row, as text or as what the column renders. */
    _buildRow(row, index, columns) {
      const tr = el('tr');
      const isList = Array.isArray(row);
      const record = row && typeof row === 'object' ? row : {};
      const id = isList ? undefined : record[this.getAttribute('row-key') || 'id'];
      tr.dataset.key = isBlank(id) ? String(index) : String(id);
      if (!isList) {
        if (record.selected) tr.setAttribute('data-selected', '');
        if (record.data && typeof record.data === 'object') {
          Object.keys(record.data).forEach((name) => { tr.dataset[name] = record.data[name]; });
        }
      }
      columns.forEach((column, position) => {
        const td = el('td');
        const value = isList ? row[position] : record[column.key];
        this._values.set(td, value);
        const type = TYPES[column.type] || TYPES.text;
        let content = value;
        if (typeof column.render === 'function') content = column.render(value, row, column);
        else if (typeof type.format === 'function' && !isBlank(value)) content = type.format(value, row, column);
        if (content instanceof Node) td.append(content);
        else if (!isBlank(content)) td.textContent = String(content);
        tr.append(td);
      });
      return tr;
    }

    /** Draws the native table for list-data; it is then enhanced like any other. */
    _build(table) {
      const { columns, rows } = this._data;
      // The <thead> is kept: its first row is drawn again only when the
      // columns changed (focus on a sort button survives new rows), and
      // further rows (a grid view's filters) are left as they are.
      let head = table.tHead;
      if (!head) head = el('thead');
      if (this._builtColumns !== columns || !head.rows[0]) {
        const headRow = el('tr');
        columns.forEach((column) => {
          const th = el('th');
          th.textContent = column.label;
          th.dataset.key = column.key;
          if (column.type) th.dataset.type = column.type;
          if (column.align) th.dataset.align = column.align;
          if (column.sortable) th.dataset.sortable = '';
          if (column.hideLabel) th.dataset.hideLabel = '';
          if (!isBlank(column.width)) th.dataset.width = column.width;
          headRow.append(th);
        });
        if (head.rows[0]) head.rows[0].replaceWith(headRow);
        else head.prepend(headRow);
        this._builtColumns = columns;
      }
      const body = el('tbody');
      rows.forEach((row, index) => body.append(this._buildRow(row, index, columns)));
      // Keep a server-rendered <caption> and <colgroup>s; they stay first, as HTML requires.
      const kept = (child) => child === head || child.localName === 'caption' || child.localName === 'colgroup';
      Array.from(table.children).forEach((child) => { if (!kept(child)) child.remove(); });
      if (this._serverCaption && !table.caption) table.prepend(this._serverCaption.cloneNode(true));
      if (head.parentNode !== table) {
        const lead = Array.from(table.children).filter((child) => child !== head && kept(child)).pop();
        if (lead) lead.after(head); else table.prepend(head);
      }
      table.append(body);
    }

    /* ------------------------------------------------------------- Render */

    /** Own changes to the children are not reported back to the observer. */
    _mutate(change) {
      this._observer.disconnect();
      try {
        change();
      } finally {
        if (this.isConnected) this._observer.observe(this, { childList: true, subtree: true });
      }
    }

    /** A change to the table's structure (rows, cells, the table itself), not to what is in a cell. */
    _isStructural(record) {
      const target = record.target;
      if (target === this || target === this._scroller || target === this._state) return true;
      if (!this._table || !this._table.contains(target)) return false;
      return ['table', 'thead', 'tbody', 'tr'].includes(target.localName) && target.closest('table') === this._table;
    }

    /** Several changes in one task (a template filling the table) draw once. */
    _queueRender() {
      if (this._queued) return;
      this._queued = true;
      queueMicrotask(() => {
        this._queued = false;
        if (this.isConnected) this._render();
      });
    }

    _part(name, tag = 'div') {
      let part = this.querySelector(`:scope > .${PREFIX}${name}`);
      if (!part) part = el(tag, PREFIX + name);
      return part;
    }

    _render() {
      if (!this.isConnected) return;
      this._mutate(() => {
        this._frame();
        if (this._data && (this._dataDirty || !this._table.hasAttribute('data-generated'))) {
          this._table.setAttribute('data-generated', '');
          this._build(this._table);
        }
        this._dataDirty = false;
        this._readColumns();
        this._enhanceHead();
        this._enhanceRows();
        this._applySort();
        this._renderTools();
        this._renderLoading();
        this._renderState();
        this._renderLabel();
      });
      this._syncSelection();
      this._layout();
      this.dispatchEvent(new CustomEvent('table-render'));
    }

    /** tools · scroll (the table) · state · probe, in that order. */
    _frame() {
      const tools = this._part('tools');
      const scroller = this._part('scroll');
      const state = this._part('state');
      const probe = this._part('probe', 'span');
      probe.setAttribute('aria-hidden', 'true');
      if (!probe.firstElementChild) probe.append(el('i'));
      if (!scroller.hasAttribute('data-listening')) {
        scroller.setAttribute('data-listening', '');
        scroller.addEventListener('scroll', this._onScroll, { passive: true });
      }

      let table = scroller.querySelector(':scope > table');
      const own = this.querySelector(':scope > table');
      if (this._data) {
        // list-data wins: a table written into the element is left where it is, hidden.
        if (!table || !table.hasAttribute('data-generated')) {
          // A server table replaced by data hands its caption (its name) to the drawn one.
          if (table && table.caption) this._serverCaption = table.caption.cloneNode(true);
          if (table) table.remove();
          table = el('table');
        }
        if (own) own.hidden = true;
      } else {
        if (table && table.hasAttribute('data-generated')) {
          table.remove();
          table = null;
        }
        if (own) {
          if (table) table.remove();
          table = own;
          table.hidden = false;
        }
        if (!table) table = el('table');
      }
      if (table.parentNode !== scroller) scroller.replaceChildren(table);

      // Your own empty state: taken into the state area once.
      const custom = this.querySelector(':scope > [data-table-empty], :scope > kakao-empty-state');
      if (custom) {
        custom.setAttribute('data-table-empty', '');
        state.replaceChildren(custom);
      }

      if (tools.parentNode !== this || tools.nextElementSibling !== scroller || scroller.nextElementSibling !== state || state.nextElementSibling !== probe) {
        this.append(tools, scroller, state, probe);
      }
      this._tools = tools;
      this._scroller = scroller;
      this._state = state;
      this._probe = probe;
      this._table = table;
    }

    _readColumns() {
      const table = this._table;
      const headRow = table.tHead && table.tHead.rows[0];
      this._headRow = headRow || null;
      const cells = headRow
        ? Array.from(headRow.cells).filter((cell) => !cell.classList.contains(`${PREFIX}select`))
        : [];
      const generated = this._data && table.hasAttribute('data-generated') ? this._data.columns : null;
      this._columns = cells.map((th, index) => {
        const link = th.children.length === 1 && th.firstElementChild.matches('a[href]') ? th.firstElementChild : null;
        const source = generated ? generated[index] || {} : {};
        const type = th.dataset.type || 'text';
        const key = th.dataset.key || (link && link.dataset.sort) || String(index);
        return {
          ...source,
          key,
          label: th.dataset.label !== undefined ? th.dataset.label : th.textContent.trim(),
          type,
          align: th.dataset.align || (TYPES[type] && TYPES[type].align) || 'start',
          sortable: Boolean(link) || th.dataset.sortable !== undefined,
          width: th.dataset.width,
          hideLabel: th.dataset.hideLabel !== undefined,
          th,
          link,
        };
      });
    }

    _enhanceHead() {
      const table = this._table;
      setAttr(table, 'role', 'table');
      if (table.tHead) setAttr(table.tHead, 'role', 'rowgroup');
      const headRow = this._headRow;
      if (!headRow) return;
      setAttr(headRow, 'role', 'row');

      this._columns.forEach((column) => {
        const th = column.th;
        setAttr(th, 'role', 'columnheader');
        if (!th.hasAttribute('scope')) th.setAttribute('scope', 'col');
        setAttr(th, 'data-type', column.type === 'text' ? null : column.type);
        setAttr(th, 'data-align', column.align === 'start' ? null : column.align);
        if (!isBlank(column.width)) th.style.width = /^\d+(\.\d+)?$/.test(String(column.width)) ? `${column.width}px` : column.width;

        let control = th.querySelector(`:scope > .${PREFIX}sort`);
        if (!control && column.sortable) {
          if (column.link) {
            control = column.link;
            control.classList.add(`${PREFIX}sort`);
          } else {
            control = el('button', `${PREFIX}sort`);
            control.type = 'button';
            control.append(...th.childNodes);
            th.append(control);
          }
          control.append(sortIcon());
        }
        column.control = control;

        if (column.hideLabel && !control && !th.querySelector(`:scope > .${PREFIX}sr`)) {
          const spoken = el('span', `${PREFIX}sr`);
          spoken.append(...th.childNodes);
          th.append(spoken);
        }
      });

      // The select-all cell leads the heading row.
      let cell = headRow.querySelector(`:scope > .${PREFIX}select`);
      if (this.hasAttribute('selectable')) {
        if (!cell) {
          cell = el('th', `${PREFIX}select`);
          cell.setAttribute('role', 'columnheader');
          cell.setAttribute('scope', 'col');
          cell.append(this._check(true));
          headRow.prepend(cell);
        }
        cell.querySelector('input').setAttribute('aria-label', texts.selectAll);
      } else if (cell) {
        cell.remove();
      }
    }

    /** The checkbox: a native input under the drawn box. */
    _check(all) {
      const label = el('label', `${PREFIX}check`);
      const input = el('input');
      input.type = 'checkbox';
      if (all) input.setAttribute('data-all', '');
      label.append(input, checkBox());
      return label;
    }

    _emptyCell(td) {
      const attr = this.getAttribute('empty-text');
      const text = attr === null ? DEFAULT_EMPTY_TEXT : attr;
      td.setAttribute('data-empty', '');
      // A dash says nothing when read aloud: it gets a spoken text instead.
      if (/[\p{L}\p{N}]/u.test(text)) {
        td.textContent = text;
        return;
      }
      const shown = el('span');
      shown.setAttribute('aria-hidden', 'true');
      shown.textContent = text;
      const spoken = el('span', `${PREFIX}sr`);
      const label = this.getAttribute('empty-label');
      spoken.textContent = label === null ? texts.emptyLabel : label;
      td.replaceChildren(shown, spoken);
    }

    _bodies() {
      return Array.from(this._table.tBodies).filter((body) => !body.classList.contains(`${PREFIX}loading`));
    }

    _enhanceRows() {
      const selectable = this.hasAttribute('selectable');
      const name = this.getAttribute('selection-name');
      const columns = this._columns;
      this._rows = [];

      this._bodies().forEach((body) => {
        setAttr(body, 'role', 'rowgroup');
        Array.from(body.rows).forEach((tr) => {
          setAttr(tr, 'role', 'row');
          if (!this._order.has(tr)) this._order.set(tr, this._nextOrder++);
          const position = this._order.get(tr);
          const id = tr.dataset.key !== undefined ? tr.dataset.key : tr.dataset.id !== undefined ? tr.dataset.id : String(position);
          if (!this._seen.has(tr)) {
            this._seen.add(tr);
            if (tr.hasAttribute('data-selected')) this._selected.add(id);
          }

          let select = tr.querySelector(`:scope > .${PREFIX}select`);
          const cells = Array.from(tr.cells).filter((cell) => cell !== select);
          cells.forEach((cell, index) => {
            const column = columns[index];
            setAttr(cell, 'role', cell.localName === 'th' ? 'rowheader' : 'cell');
            setAttr(cell, 'data-label', column && !column.hideLabel ? column.label : '');
            if (column) {
              setAttr(cell, 'data-type', column.type === 'text' ? null : column.type);
              setAttr(cell, 'data-align', column.align === 'start' ? null : column.align);
            }
            if (cell.hasAttribute('data-empty') || (!cell.childElementCount && !cell.textContent.trim())) this._emptyCell(cell);
          });

          if (selectable) {
            if (!select) {
              select = el('td', `${PREFIX}select`);
              select.setAttribute('role', 'cell');
              select.append(this._check(false));
              tr.prepend(select);
            }
            const input = select.querySelector('input');
            const first = cells.find((cell) => !cell.hasAttribute('data-empty'));
            const rowLabel = first ? first.textContent.trim().replace(/\s+/g, ' ').slice(0, 80) : '';
            input.setAttribute('aria-label', rowLabel ? fill(texts.selectRow, { row: rowLabel }) : texts.selectRowPlain);
            input.value = id;
            setAttr(input, 'name', name);
          } else if (select) {
            select.remove();
          }

          this._rows.push({ tr, id, position, cells, body });
        });
      });

      // The selection only names rows that are there.
      const ids = new Set(this._rows.map((row) => row.id));
      this._selected.forEach((id) => { if (!ids.has(id)) this._selected.delete(id); });
    }

    /* --------------------------------------------------------------- Sort */

    _sortState() {
      const raw = (this.getAttribute('sort') || '').trim();
      if (!raw) return { key: null, direction: 'none' };
      return raw.startsWith('-') ? { key: raw.slice(1), direction: 'desc' } : { key: raw, direction: 'asc' };
    }

    _direction(column, state = this._sortState()) {
      if (state.key !== null) return column.key === state.key ? state.direction : 'none';
      // A server-rendered link says so itself (Yii2: class "asc" / "desc").
      if (column.link && column.link.classList.contains('asc')) return 'asc';
      if (column.link && column.link.classList.contains('desc')) return 'desc';
      return 'none';
    }

    _cellValue(row, index) {
      const cell = row.cells[index];
      if (!cell || cell.hasAttribute('data-empty')) return null;
      if (cell.dataset.sortValue !== undefined) return cell.dataset.sortValue;
      if (this._values.has(cell)) {
        const value = this._values.get(cell);
        if (value === null || typeof value !== 'object') return value;
      }
      return cell.textContent.trim();
    }

    _applySort() {
      const state = this._sortState();
      this._columns.forEach((column) => {
        if (!column.sortable) return;
        const direction = this._direction(column, state);
        setAttr(column.th, 'aria-sort', direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none');
      });

      if (this.getAttribute('sort-mode') === 'server' || !this._rows.length) return;
      const index = this._columns.findIndex((column) => column.key === state.key);
      const column = this._columns[index];
      if (column && column.link) return; // the server sorts for a link heading
      if (state.key !== null && !column) return;
      const compare = column ? ((TYPES[column.type] || TYPES.text).compare || TYPES.text.compare) : null;
      const flip = state.direction === 'desc' ? -1 : 1;
      const keyed = this._rows.map((row) => ({ row, value: column ? this._cellValue(row, index) : null }));
      keyed.sort((a, b) => {
        if (column) {
          // Empty cells go last in both directions.
          const blank = isBlank(a.value) - isBlank(b.value);
          if (blank) return blank;
          if (!isBlank(a.value)) {
            const result = compare(a.value, b.value) * flip;
            if (result) return result;
          }
        }
        return a.row.position - b.row.position;
      });
      const sorted = keyed.map((entry) => entry.row);
      // Rows stay in their own <tbody>; one that is already in order is not touched.
      this._bodies().forEach((body) => {
        const rows = sorted.filter((row) => row.body === body).map((row) => row.tr);
        const current = Array.from(body.rows);
        if (rows.length === current.length && rows.every((tr, i) => tr === current[i])) return;
        body.append(...rows);
      });
      this._rows = sorted;
    }

    _fire(name, detail, cancelable = false) {
      return this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true, cancelable }));
    }

    /** A heading or the sort select was used. Returns false when it was cancelled. */
    _requestSort(column, direction, event) {
      const previous = this.sort;
      if (column && column.link) {
        const go = this._fire('sort-change', { key: column.key, direction: null, sort: previous, previous, href: column.link.href, source: 'user' }, true);
        if (!go && event) event.preventDefault();
        return go;
      }
      const sort = !column || direction === 'none' ? '' : `${direction === 'desc' ? '-' : ''}${column.key}`;
      if (sort === previous) return true;
      const go = this._fire('sort-change', { key: column ? column.key : null, direction, sort, previous, href: null, source: 'user' }, true);
      if (go) this.sort = sort;
      return go;
    }

    _handleClick(event) {
      const control = event.target instanceof Element ? event.target.closest(`.${PREFIX}sort`) : null;
      if (!control || !this._headRow || !this._headRow.contains(control)) return;
      const column = this._columns.find((entry) => entry.control === control);
      if (!column) return;
      const current = this._direction(column);
      this._requestSort(column, current === 'none' ? 'asc' : current === 'asc' ? 'desc' : 'none', event);
    }

    /* ---------------------------------------------------------- Selection */

    _select(ids, source) {
      const before = this.selected.join('\u0000');
      this._selected = new Set(ids);
      this._syncSelection();
      if (this.selected.join('\u0000') !== before) this._fire('selection-change', { selected: this.selected, source });
    }

    _syncSelection() {
      let count = 0;
      this._rows.forEach((row) => {
        const on = this._selected.has(row.id);
        if (on) count += 1;
        if (row.tr.hasAttribute('data-selected') !== on) row.tr.toggleAttribute('data-selected', on);
        const input = row.tr.querySelector(`:scope > .${PREFIX}select input`);
        if (input) input.checked = on;
      });
      const total = this._rows.length;
      this.querySelectorAll(`.${PREFIX}check input[data-all]`).forEach((input) => {
        if (!this.contains(input) || input.closest(TAG_NAME) !== this) return;
        input.checked = total > 0 && count === total;
        input.indeterminate = count > 0 && count < total;
        input.disabled = total === 0;
      });
    }

    _handleChange(event) {
      const target = event.target;
      if (!(target instanceof Element) || target.closest(TAG_NAME) !== this) return;
      if (target.matches(`.${PREFIX}check input`)) {
        if (target.hasAttribute('data-all')) {
          // From some to all, from all to none.
          this._select(target.checked ? this._rows.map((row) => row.id) : [], 'user');
          return;
        }
        const row = this._rows.find((entry) => entry.tr.contains(target));
        if (!row) return;
        const ids = new Set(this._selected);
        if (target.checked) ids.add(row.id);
        else ids.delete(row.id);
        this._select(ids, 'user');
        return;
      }
      if (target.matches(`.${PREFIX}tools select`)) {
        const [index, direction] = target.value.split(':');
        const column = this._columns[Number(index)];
        if (column && column.link) {
          this._syncTools();
          column.link.click(); // fires sort-change through the click, then follows the link
          return;
        }
        if (!this._requestSort(column || null, column ? direction : 'none')) this._syncTools();
      }
    }

    /* ------------------------------------------------- Tools (wrapped form) */

    /** Select all and "Sort by": what the heading row offers, while it is hidden. */
    _renderTools() {
      const tools = this._tools;
      const sortable = this._columns.filter((column) => column.sortable);
      const selectable = this.hasAttribute('selectable');
      // Parts added by others (a grid view's filters) are kept.
      tools.querySelectorAll(`:scope > .${PREFIX}tool`).forEach((tool) => tool.remove());
      const own = [];
      if (selectable) {
        const all = this._check(true);
        all.classList.add(`${PREFIX}tool`);
        const text = el('span');
        text.textContent = texts.selectAll;
        all.append(text);
        own.push(all);
      }
      if (sortable.length) {
        const label = el('label', `${PREFIX}tool`);
        const text = el('span');
        text.textContent = texts.sortBy;
        const select = el('select');
        const add = (value, content) => {
          const option = el('option');
          option.value = value;
          option.textContent = content;
          select.append(option);
        };
        add('', texts.notSorted);
        this._columns.forEach((column, index) => {
          if (!column.sortable) return;
          if (column.link) {
            add(`${index}:link`, column.label);
            return;
          }
          add(`${index}:asc`, fill(texts.ascending, { label: column.label }));
          add(`${index}:desc`, fill(texts.descending, { label: column.label }));
        });
        label.append(text, select);
        own.push(label);
      }
      tools.prepend(...own);
      tools.hidden = !tools.childElementCount || (!this._rows.length && !this.hasAttribute('loading'));
      this._syncTools();
    }

    _syncTools() {
      const select = this._tools && this._tools.querySelector(`:scope > .${PREFIX}tool select`);
      if (!select) return;
      const state = this._sortState();
      const index = this._columns.findIndex((column) => column.sortable && this._direction(column, state) !== 'none');
      const column = this._columns[index];
      select.value = !column ? '' : column.link ? `${index}:link` : `${index}:${this._direction(column, state)}`;
    }

    /* ------------------------------------------------- Loading and empty */

    /** Draws again once an optional component (skeleton, empty state) is defined. */
    _awaitDefined(tag) {
      if (customElements.get(tag) || this._waiting.has(tag)) return;
      this._waiting.add(tag);
      customElements.whenDefined(tag).then(() => {
        this._waiting.delete(tag);
        if (this.isConnected) this._render();
      });
    }

    _renderLoading() {
      const table = this._table;
      const loading = this.hasAttribute('loading');
      let body = table.querySelector(`:scope > tbody.${PREFIX}loading`);
      setAttr(this, 'aria-busy', loading ? 'true' : null);
      if (!loading) {
        if (body) body.remove();
        return;
      }
      if (!body) {
        body = el('tbody', `${PREFIX}loading`);
        body.setAttribute('aria-hidden', 'true');
        table.append(body);
      }
      const asked = parseInt(this.getAttribute('loading-rows'), 10);
      const count = asked > 0 ? asked : Math.min(this._rows.length || 5, MAX_LOADING_ROWS);
      const useSkeleton = Boolean(customElements.get('kakao-skeleton'));
      if (!useSkeleton) this._awaitDefined('kakao-skeleton');
      const selectable = this.hasAttribute('selectable');
      const rows = [];
      for (let r = 0; r < count; r += 1) {
        const tr = el('tr');
        if (selectable) tr.append(el('td', `${PREFIX}select`));
        this._columns.forEach((column, c) => {
          const td = el('td');
          td.setAttribute('data-label', column.hideLabel ? '' : column.label);
          const width = BONE_WIDTHS[(r + c) % BONE_WIDTHS.length];
          let bone;
          if (useSkeleton) {
            bone = el('kakao-skeleton');
            bone.setAttribute('width', width);
          } else {
            bone = el('span', `${PREFIX}bone`);
            bone.style.width = width;
          }
          td.append(bone);
          tr.append(td);
        });
        rows.push(tr);
      }
      body.replaceChildren(...rows);
    }

    _renderState() {
      const state = this._state;
      const loading = this.hasAttribute('loading');
      const empty = !loading && !this._rows.length;
      const custom = state.querySelector(':scope > [data-table-empty]');
      state.querySelectorAll(':scope > [data-generated]').forEach((node) => node.remove());

      if (loading) {
        const status = el('span', `${PREFIX}sr`);
        status.setAttribute('data-generated', '');
        status.setAttribute('role', 'status');
        status.textContent = texts.loading;
        state.append(status);
      }
      if (custom) custom.hidden = !empty;
      if (empty && !custom) {
        const heading = this.getAttribute('empty-heading') || texts.emptyHeading;
        const message = this.getAttribute('empty-message') || '';
        let block;
        if (customElements.get('kakao-empty-state')) {
          block = el('kakao-empty-state');
          block.setAttribute('size', 'sm');
          block.setAttribute('heading', heading);
          if (message) block.setAttribute('message', message);
        } else {
          this._awaitDefined('kakao-empty-state');
          block = el('p');
          const strong = el('b');
          strong.textContent = heading;
          block.append(strong);
          if (message) block.append(message);
        }
        block.setAttribute('data-generated', '');
        state.append(block);
      }
      // The state area takes space only for the empty state; the status is read, not seen.
      state.hidden = !empty && !loading;
      state.classList.toggle(`${PREFIX}sr`, loading);
    }

    _renderLabel() {
      const label = (this.getAttribute('label') || '').trim();
      setAttr(this._table, 'aria-label', label || null);
    }

    /* ------------------------------------------------------------- Layout */

    /** Wrapped or not (by the element's own width), and the frame's edge fade. */
    _layout() {
      if (!this._scroller) return;
      const scroll = this.hasAttribute('scroll');
      let stacked = !scroll && this.getAttribute('layout') === 'stacked';
      if (!scroll && !stacked) {
        const width = this.getBoundingClientRect().width;
        // Not laid out (display: none somewhere above): keep what it was.
        if (!width) return;
        stacked = width < this._probe.firstElementChild.getBoundingClientRect().width;
      }
      if (stacked !== this.hasAttribute('data-stacked')) this.toggleAttribute('data-stacked', stacked);
      this._syncScroll();
    }

    _syncScroll() {
      const scroller = this._scroller;
      if (!scroller) return;
      const scroll = this.hasAttribute('scroll');
      const overflows = syncEdgeFade(scroller, scroll) || (scroll && scroller.scrollHeight - scroller.clientHeight > 1);
      // A frame that scrolls is reachable by keyboard and says what it is.
      setAttr(scroller, 'tabindex', overflows ? '0' : null);
      setAttr(scroller, 'role', overflows ? 'region' : null);
      setAttr(scroller, 'aria-label', overflows ? (this.getAttribute('label') || '').trim() || texts.label : null);
    }
  }

  customElements.define(TAG_NAME, KakaoTable);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }

  window.KakaoTable = KakaoTable;
})();
