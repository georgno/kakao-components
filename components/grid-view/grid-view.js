/**
 * <kakao-grid-view>
 * ============================================================================
 * A data grid in the manner of Yii2's GridView: a kakao-table with a filter
 * row under its headings (a search field or a dropdown per column), an action
 * column (view / edit / delete or your own buttons per row), a summary line
 * ("Showing 1–20 of 143") and a kakao-pagination below. It filters, sorts and
 * pages the rows in the browser, or leaves all three to the server and sends
 * the filters as GET parameters (UserSearch[email]=…), and it decorates a
 * server-rendered table in place. On a phone each row wraps into a block of
 * label / value pairs (the table's wrapped form); the filters open from a
 * "Filters" button above the blocks and the actions sit at the bottom of
 * each block.
 *
 * Light DOM (needs grid-view.css), because it composes a light DOM table.
 * Needs table.js / table.css. Uses, where they are loaded:
 * kakao-pagination (paging), kakao-text-input and kakao-select (filter
 * fields; native fields otherwise), kakao-button (actions and "Clear
 * filters"; native buttons otherwise), kakao-empty-state and kakao-skeleton
 * (through the table). Vanilla JS, no deps.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        A data grid with a filter row, sorting and paging.
 *  not for    A table without filters: kakao-table.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     grid-view.js
 *  css        grid-view.css   (light DOM: load it in the page head)
 *  requires   table   (load these first, in this order)
 *  enhanced   button, dialog, empty-state, pagination, select, skeleton, text-input   (used when loaded, optional)
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="table.css" />
 *   <link rel="stylesheet" href="grid-view.css" />
 *   <script src="table.js"><\/script>
 *   <script src="pagination.js"><\/script>
 *   <script src="grid-view.js"><\/script>
 *
 *   <kakao-grid-view label="Users" page-size="10" sort="name" list-data='{
 *     "columns": [
 *       { "key": "name", "label": "Name", "sortable": true, "filter": true },
 *       { "key": "status", "label": "Status", "filter": ["Active", "Blocked"] },
 *       { "key": "actions", "label": "Actions", "actions": ["view", "update", "delete"] }
 *     ],
 *     "rows": [{ "id": 1, "name": "Ada Lovelace", "status": "Active" }]
 *   }'></kakao-grid-view>
 *
 *   <!-- Yii2: the server renders table, filter row and pager -->
 *   <kakao-grid-view mode="server" total-items="143" page="2" page-size="20">
 *     <kakao-table sort="-created_at"><table>
 *       <thead>
 *         <tr><th><a href="?sort=username" data-sort="username">Username</a></th>
 *             <th data-type="actions" data-hide-label>Actions</th></tr>
 *         <tr class="filters"><td><input name="UserSearch[username]"></td><td></td></tr>
 *       </thead>
 *       <tbody>…</tbody>
 *     </table></kakao-table>
 *     <kakao-pagination page="2" total-items="143" page-size="20" url="?page={page}"></kakao-pagination>
 *   </kakao-grid-view>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  list-data      JSON { "columns": […], "rows": […] }: the grid owns the rows.
 *                 A column takes the table's keys (key, label, type, align,
 *                 sortable, width, hideLabel) plus:
 *                   filter   true | "search": a search field;
 *                            ["a", "b"] | [{ "value", "label" }] |
 *                            { "type": "select", "options": […] }: a dropdown
 *                            (first option "All", value ""). Optional
 *                            "placeholder". From script also match(value,
 *                            query, row) → boolean.
 *                   actions  ["view", "update", "delete"] and / or objects
 *                            { name, label, icon, url, tone, confirm, method,
 *                            visible }: icon is a built-in glyph (view,
 *                            update, delete, filter) or icon-font classes;
 *                            url a template ({id}, {action}, any {key} of the
 *                            row, URL-encoded) that makes it a link; tone
 *                            "danger"; confirm a question ({key} filled);
 *                            method "post" (a link sent as a form, Yii's
 *                            data-method); visible a row key that must be
 *                            truthy. delete brings confirm and tone. The
 *                            column's heading is read out only.
 *                 A row: an object by column key (or an array in column
 *                 order). Its id is row[row-key], else its position in all
 *                 rows. "selected": true preselects it.
 *  mode           "server": the grid does not filter, sort or page. Filter
 *                 changes go to the server as GET parameters (see
 *                 filter-url); sorting is the table's server form; the pager
 *                 gets total-items / page / page-size / page-url. A grid
 *                 without rows of its own (server markup) always works so.
 *  page           The page shown, 1-based. Default 1.
 *  page-size      Rows per page, default 20. "0": no paging.
 *  page-sizes     "10,20,50": a rows-per-page select on the pager.
 *  total-items    Server mode: the number of rows, for the pager and summary.
 *  page-url       Server mode: the pager's link template ("?page={page}").
 *  filter-name    Field name template of generated filters, "{key}" replaced:
 *                 "UserSearch[{key}]" for Yii2. Default "{key}".
 *  filter-url     Server mode: where filters are sent. Default: the current
 *                 address. Its query is kept, minus the filter fields and
 *                 "page".
 *  filter-delay   Milliseconds of no typing before a search filters in the
 *                 browser. Default 300.
 *  action-url     Default link template for actions without a url:
 *                 "/user/{action}?id={id}" (Yii's ActionColumn).
 *  hide-summary   No summary line.
 *  label · row-key · selectable · selection-name · striped · dense ·
 *  bordered · sticky-header · scroll · layout · loading · loading-rows ·
 *  empty-text · empty-label · empty-heading · empty-message · sort
 *                 Passed to the table the grid creates (sort only at the
 *                 start, and when the attribute changes). A kakao-table
 *                 written inside is used as it is.
 *
 * CHILDREN (server markup)
 *  <kakao-table>       Used instead of a created one. A second <thead> row
 *                      with class "filters" or data-filters is the filter
 *                      row: its fields (input, select, kakao-text-input,
 *                      kakao-select) are read by name. A heading with
 *                      data-type="actions" (or data-actions) marks the action
 *                      column: its links and buttons get the action look and
 *                      fire row-action (data-action, else the title).
 *  <kakao-pagination>  Used instead of a created one.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  columns · rows     Property form of list-data. Columns may carry
 *                     render(value, row, column) as on the table.
 *  filters            { key: value } of the filters. Setting it fills the
 *                     fields and filters (no event).
 *  page · pageSize    The page and the page size.
 *  sort               The table's sort ("name", "-name").
 *  selected           Ids of the selected rows, on every page. Settable.
 *  table · pager      The composed elements (read only).
 *  clearFilters()     Empties every filter and applies it (fires filter-change).
 *  refresh()          Draws again (after rows were changed in place).
 *
 *  KakaoGridView.texts  The words: { summary, filtered, none, filters,
 *                       filterLabel, all, clearFilters, noMatches,
 *                       noMatchesMessage, actionLabel, view, update, delete,
 *                       confirmDelete, confirmTitle, cancel }.
 *
 *  Confirmations use a kakao-dialog (title confirmTitle, the action's question,
 *  Cancel and the action's own label, danger for a danger action) when
 *  dialog.js and button.js are on the page; otherwise the browser's confirm().
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  filter-change   { filters, params, url, source } before a filter change
 *                  applies: filters by column key, params by field name, url
 *                  where server mode goes (else null), source "user" | "clear".
 *                  Cancelable: in the browser the rows stay as they are; in
 *                  server mode the page does not navigate (load it yourself).
 *  row-action      { action, id, row, href } after a confirmation, if any.
 *                  row is the row object (null for server markup), href the
 *                  link (else null). Cancelable: a link is not followed.
 *  The table's sort-change and selection-change and the pager's page-change
 *  and page-size-change bubble through the grid as well.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block of grid-view.css)
 * ----------------------------------------------------------------------------
 *  --kakao-grid-view-text / -muted / -line / -focus / -danger / -danger-hover-bg
 *  --kakao-grid-view-action-color / -action-hover-bg / -action-stacked-bg
 *  --kakao-grid-view-field-bg / -field-border / -field-text / -field-height / -field-radius
 *  --kakao-grid-view-filter-min-width / -summary-size / -gap
 *  --kakao-grid-view-action-size / -action-radius / -action-icon-size / -action-gap
 *  --kakao-grid-view-toggle-bg / -toggle-border / -toggle-radius / -count-bg / -count-text
 *  --kakao-grid-view-focus-width / -focus-offset / -duration
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-grid-view';
  if (customElements.get(TAG_NAME)) return;

  const PREFIX = 'kakao-grid-view-';
  const DEFAULT_PAGE_SIZE = 20;
  const DEFAULT_DELAY = 300;

  /** The built-in words. Change them for every grid with KakaoGridView.texts. */
  const TEXTS = {
    summary: 'Showing {from}–{to} of {total}',
    filtered: '(filtered from {all})',
    none: 'No entries',
    filters: 'Filters',
    filterLabel: 'Filter {label}',
    all: 'All',
    clearFilters: 'Clear filters',
    noMatches: 'No matches',
    noMatchesMessage: 'Try other filters.',
    actionLabel: '{action} {row}',
    view: 'View',
    update: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Delete this item?',
    confirmTitle: 'Are you sure?',
    cancel: 'Cancel',
  };

  /** Attributes a created table takes from the grid. */
  const MIRRORED = [
    'label', 'row-key', 'selectable', 'selection-name', 'striped', 'dense', 'bordered', 'sticky-header',
    'scroll', 'layout', 'loading', 'loading-rows', 'empty-text', 'empty-label', 'empty-heading', 'empty-message',
  ];

  const svg = (body) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  const GLYPHS = {
    view: svg('<path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>'),
    update: svg('<path d="M10.5 2.75l2.75 2.75L6 12.75l-3.25.5.5-3.25z"/><path d="M9 4.25l2.75 2.75"/>'),
    delete: svg('<path d="M2.5 4.25h11"/><path d="M6.25 4.25V2.75h3.5v1.5"/><path d="M3.75 4.25l.7 9h7.1l.7-9"/><path d="M6.75 7v3.75M9.25 7v3.75"/>'),
    filter: svg('<path d="M2 3h12l-4.75 5.5v4.25l-2.5-1.25v-3z"/>'),
  };
  GLYPHS.edit = GLYPHS.update;

  const BUILT_IN = {
    view: () => ({ label: texts.view, icon: 'view' }),
    update: () => ({ label: texts.update, icon: 'update' }),
    edit: () => ({ label: texts.update, icon: 'update' }),
    delete: () => ({ label: texts.delete, icon: 'delete', tone: 'danger', confirm: texts.confirmDelete, method: 'post' }),
  };

  const isBlank = (value) => value === null || value === undefined || String(value).trim() === '';
  const fill = (text, values, encode = false) => String(text).replace(/\{([\w-]+)\}/g, (match, key) => {
    if (!(key in values) || values[key] === null || values[key] === undefined) return match === '{id}' ? '' : match;
    return encode ? encodeURIComponent(values[key]) : String(values[key]);
  });
  /** Case and accents ignored: "Malmö" matches "malmo". */
  const fold = (value) => String(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
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
  const glyph = (name) => {
    if (GLYPHS[name]) {
      const template = document.createElement('template');
      template.innerHTML = GLYPHS[name];
      return template.content.firstElementChild;
    }
    const icon = el('i', String(name));
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  };
  const fieldValue = (field) => {
    if ('value' in field && typeof field.value === 'string') return field.value;
    return field.getAttribute('value') || '';
  };
  const isTextField = (field) => field.localName === 'kakao-text-input'
    || (field.localName === 'input' && !['checkbox', 'radio', 'hidden'].includes(field.type));

  /** A column's filter, or null: { type: "search" | "select", options, placeholder, match }. */
  const filterSpec = (filter) => {
    if (!filter) return null;
    if (filter === true || filter === 'search' || filter === 'text') return { type: 'search' };
    if (Array.isArray(filter)) return { type: 'select', options: filter };
    if (typeof filter === 'object') {
      const options = Array.isArray(filter.options) ? filter.options : null;
      return { ...filter, type: filter.type === 'select' || (options && filter.type !== 'search') ? 'select' : 'search', options: options || [] };
    }
    return null;
  };
  const optionOf = (option) => (option && typeof option === 'object'
    ? { value: String(option.value !== undefined ? option.value : option.label), label: String(option.label !== undefined ? option.label : option.value) }
    : { value: String(option), label: String(option) });

  const instances = new Set();
  let texts = { ...TEXTS };
  let fieldIds = 0;

  class KakaoGridView extends HTMLElement {
    static get TEXTS() { return { ...TEXTS }; }
    static get texts() { return { ...texts }; }
    static set texts(value) {
      texts = { ...TEXTS, ...(value && typeof value === 'object' ? value : {}) };
      instances.forEach((grid) => grid._redraw());
    }

    static get observedAttributes() {
      return [
        'list-data', 'mode', 'page', 'page-size', 'page-sizes', 'total-items', 'page-url', 'filter-name', 'filter-url',
        'filter-delay', 'action-url', 'hide-summary', 'sort', ...MIRRORED,
      ];
    }

    constructor() {
      super();
      this._data = null; // { columns, rows } the grid owns
      this._entries = []; // [{ row, id, index }] for the rows
      this._filters = {};
      this._selected = new Set();
      this._page = 1;
      this._pageSize = null;
      this._timer = 0;
      this._filtersOpen = false;
      this._filterRow = null; // generated filter row
      this._filterColumns = null; // columns it was drawn for
      this._actionInfo = new WeakMap(); // control -> { action, row, id }
      this._waiting = new Set();
      this._onInput = (event) => this._handleInput(event);
      this._onChange = (event) => this._handleChange(event);
      this._onClick = (event) => this._handleClick(event);
      this._onTableRender = () => this._decorate();
      this._onSortChange = () => queueMicrotask(() => this._sorted());
      this._onSelection = (event) => this._selectionChanged(event);
      this._onPage = (event) => queueMicrotask(() => this._paged(event));
      this._stackObserver = new MutationObserver(() => this._syncStacked());
    }

    connectedCallback() {
      instances.add(this);
      this.addEventListener('input', this._onInput);
      this.addEventListener('change', this._onChange);
      this.addEventListener('click', this._onClick);
      if (this.hasAttribute('list-data') && !this._data) this._readData();
      if (!this._started) {
        this._started = true;
        this._page = Math.max(1, parseInt(this.getAttribute('page'), 10) || 1);
      }
      if (customElements.get('kakao-table')) this._redraw();
      else customElements.whenDefined('kakao-table').then(() => { if (this.isConnected) this._redraw(); });
    }

    disconnectedCallback() {
      instances.delete(this);
      this.removeEventListener('input', this._onInput);
      this.removeEventListener('change', this._onChange);
      this.removeEventListener('click', this._onClick);
      this._stackObserver.disconnect();
      clearTimeout(this._timer);
      if (this._confirmDialog) { this._confirmDialog.remove(); this._confirmDialog = null; }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || oldValue === newValue || !customElements.get('kakao-table')) return;
      if (name === 'list-data' || name === 'row-key') {
        this._readData();
      } else if (name === 'page') {
        this._page = Math.max(1, parseInt(newValue, 10) || 1);
      } else if (name === 'page-size') {
        this._pageSize = null;
      } else if (name === 'sort') {
        if (this._ownTable) this._table.sort = newValue || '';
        this._page = 1;
      } else if (name === 'filter-name') {
        this._filterColumns = null;
      }
      this._redraw();
    }

    /* ---------------------------------------------------------------- API */

    get columns() { return this._data ? this._data.columns.map((column) => ({ ...column })) : []; }
    set columns(value) {
      this._data = { columns: this._normalColumns(value), rows: this._data ? this._data.rows : [] };
      this._prepareRows();
      if (this.isConnected) this._redraw();
    }

    get rows() { return this._data ? this._data.rows.slice() : []; }
    set rows(value) {
      this._data = { columns: this._data ? this._data.columns : [], rows: Array.isArray(value) ? value.slice() : [] };
      this._prepareRows();
      if (this.isConnected) this._redraw();
    }

    get filters() {
      const { filters } = this._readFilters();
      return filters;
    }
    set filters(value) {
      const next = value && typeof value === 'object' ? value : {};
      this._fields().forEach(({ field, key, name }) => {
        const wanted = key in next ? next[key] : name in next ? next[name] : '';
        this._setField(field, isBlank(wanted) ? '' : String(wanted));
      });
      this._filters = this._readFilters().filters;
      this._page = 1;
      this._redraw();
    }

    get page() { return this._page; }
    set page(value) {
      this._page = Math.max(1, parseInt(value, 10) || 1);
      this._redraw();
    }

    get pageSize() {
      if (this._pageSize !== null) return this._pageSize;
      const raw = parseInt(this.getAttribute('page-size'), 10);
      return Number.isNaN(raw) || raw < 0 ? DEFAULT_PAGE_SIZE : raw;
    }
    set pageSize(value) {
      const size = parseInt(value, 10);
      this._pageSize = Number.isNaN(size) || size < 0 ? null : size;
      this._page = 1;
      this._redraw();
    }

    get sort() { return this._table && customElements.get('kakao-table') ? this._table.sort : this.getAttribute('sort') || ''; }
    set sort(value) { setAttr(this, 'sort', isBlank(value) ? null : String(value)); }

    get selected() {
      if (!this._clientMode()) return this._table ? this._table.selected : [];
      return Array.from(this._selected);
    }
    set selected(value) {
      this._selected = new Set(Array.from(value || [], String));
      if (this._table && customElements.get('kakao-table')) {
        if (this._clientMode()) this._syncTableSelection();
        else this._table.selected = Array.from(this._selected);
      }
    }

    get table() { return this._table || null; }
    get pager() { return this._pager || null; }

    clearFilters() {
      this._fields().forEach(({ field }) => this._setField(field, ''));
      this._apply('clear');
    }

    refresh() {
      this._prepareRows();
      this._redraw();
    }

    /* --------------------------------------------------------------- Data */

    _normalColumns(value) {
      if (!Array.isArray(value)) return [];
      return value
        .filter((column) => column && typeof column === 'object')
        .map((column, index) => ({ ...column, key: isBlank(column.key) ? String(index) : String(column.key), label: isBlank(column.label) ? '' : String(column.label) }));
    }

    _readData() {
      const raw = this.getAttribute('list-data');
      if (raw === null) {
        this._data = null;
        this._entries = [];
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
      this._prepareRows();
    }

    _rowKey() { return this.getAttribute('row-key') || 'id'; }

    /** Each row with a stable id; an object row without one gets its position as id. */
    _prepareRows() {
      const rowKey = this._rowKey();
      const rows = this._data ? this._data.rows : [];
      this._entries = rows.map((row, index) => {
        const record = row && typeof row === 'object' ? row : {};
        const own = Array.isArray(row) ? undefined : record[rowKey];
        const id = isBlank(own) ? String(index) : String(own);
        let given = row;
        if (!Array.isArray(row) && isBlank(own)) given = { ...record, [rowKey]: id };
        if (!Array.isArray(row) && record.selected && !this._seenSelected) this._selected.add(id);
        return { row: given, source: row, id, index };
      });
      if (rows.length) this._seenSelected = true;
    }

    _value(entry, column) {
      if (Array.isArray(entry.row)) return entry.row[this._data.columns.indexOf(column)];
      return entry.row ? entry.row[column.key] : undefined;
    }

    _clientMode() { return Boolean(this._data) && this.getAttribute('mode') !== 'server'; }

    /* -------------------------------------------------------------- Parts */

    _awaitDefined(tag) {
      if (customElements.get(tag) || this._waiting.has(tag)) return;
      this._waiting.add(tag);
      customElements.whenDefined(tag).then(() => {
        this._waiting.delete(tag);
        if (tag === 'kakao-text-input' || tag === 'kakao-select') this._filterColumns = null;
        if (this.isConnected) this._redraw();
      });
    }

    /** bar · table · pager: a kakao-table or kakao-pagination written inside is used as it is. */
    _frame() {
      let bar = this.querySelector(`:scope > .${PREFIX}bar`);
      if (!bar) {
        bar = el('div', `${PREFIX}bar`);
        const summary = el('p', `${PREFIX}summary`);
        summary.setAttribute('role', 'status');
        bar.append(summary);
      }
      this._bar = bar;
      this._summary = bar.querySelector(`.${PREFIX}summary`);

      let table = this.querySelector(':scope > kakao-table');
      if (!table) {
        table = el('kakao-table');
        table.setAttribute('data-grid-generated', '');
        if (this.hasAttribute('sort')) table.setAttribute('sort', this.getAttribute('sort'));
      }
      this._ownTable = table.hasAttribute('data-grid-generated');
      if (table !== this._table) {
        if (this._table) {
          this._table.removeEventListener('table-render', this._onTableRender);
          this._table.removeEventListener('sort-change', this._onSortChange);
          this._table.removeEventListener('selection-change', this._onSelection);
        }
        table.addEventListener('table-render', this._onTableRender);
        table.addEventListener('sort-change', this._onSortChange);
        table.addEventListener('selection-change', this._onSelection);
        this._stackObserver.disconnect();
        this._stackObserver.observe(table, { attributes: true, attributeFilter: ['data-stacked'] });
        this._table = table;
      }

      let pager = this.querySelector(':scope > kakao-pagination');
      if (!pager) {
        pager = el('kakao-pagination');
        pager.setAttribute('data-grid-generated', '');
        pager.setAttribute('hide-single', '');
      }
      this._ownPager = pager.hasAttribute('data-grid-generated');
      if (pager !== this._pager) {
        if (this._pager) {
          this._pager.removeEventListener('page-change', this._onPage);
          this._pager.removeEventListener('page-size-change', this._onPage);
        }
        pager.addEventListener('page-change', this._onPage);
        pager.addEventListener('page-size-change', this._onPage);
        this._pager = pager;
      }

      if (bar.parentNode !== this || bar !== this.firstElementChild) this.prepend(bar);
      if (table.parentNode !== this) bar.after(table);
      if (pager.parentNode !== this) table.after(pager);
    }

    _mirror() {
      if (!this._ownTable) return;
      MIRRORED.forEach((name) => setAttr(this._table, name, this.hasAttribute(name) ? this.getAttribute(name) : null));
    }

    /* ------------------------------------------------------------- Render */

    _redraw() {
      if (!this.isConnected || !customElements.get('kakao-table')) return;
      this._frame();
      this._mirror();
      const table = this._table;
      if (this._data) {
        // The grid sorts and pages all rows; the table shows the state.
        if (this._clientMode() || this._ownTable) setAttr(table, 'sort-mode', 'server');
        if (this._tableColumnsFor !== this._data.columns || this._textsFor !== texts) {
          this._tableColumnsFor = this._data.columns;
          this._textsFor = texts;
          table.columns = this._tableColumns();
        }
      }
      if (this._clientMode()) this._showPage();
      else this._showServer();
      this._decorate();
    }

    /** The table's columns: action columns get their buttons through render. */
    _tableColumns() {
      return this._data.columns.map((column) => {
        if (!column.actions) return { ...column };
        return {
          ...column,
          type: 'actions',
          hideLabel: true,
          sortable: false,
          align: column.align || 'start',
          render: (value, row) => this._renderActions(column, row),
        };
      });
    }

    _matches(entry, filters) {
      return this._data.columns.every((column) => {
        const query = filters[column.key];
        if (isBlank(query)) return true;
        const spec = filterSpec(column.filter);
        if (!spec) return true;
        const value = this._value(entry, column);
        if (typeof spec.match === 'function') return Boolean(spec.match(value, query, entry.row));
        if (spec.type === 'select') return !isBlank(value) && String(value) === String(query);
        return !isBlank(value) && fold(value).includes(fold(query).trim());
      });
    }

    /** Sorted by the table's column types (KakaoTable.types), empty values last. */
    _sortEntries(entries) {
      const raw = (this._table.sort || '').trim();
      if (!raw) return entries;
      const desc = raw.startsWith('-');
      const key = desc ? raw.slice(1) : raw;
      const column = this._data.columns.find((entry) => entry.key === key);
      if (!column) return entries;
      const types = window.KakaoTable ? window.KakaoTable.types : {};
      const type = types[column.type] || types.text;
      const compare = type && type.compare ? type.compare : (a, b) => String(a).localeCompare(String(b));
      const flip = desc ? -1 : 1;
      return entries
        .map((entry) => ({ entry, value: this._value(entry, column) }))
        .sort((a, b) => {
          const blank = isBlank(a.value) - isBlank(b.value);
          if (blank) return blank;
          if (!isBlank(a.value)) {
            const result = compare(a.value, b.value) * flip;
            if (result) return result;
          }
          return a.entry.index - b.entry.index;
        })
        .map((item) => item.entry);
    }

    _showPage() {
      const table = this._table;
      const all = this._entries;
      const filtered = all.filter((entry) => this._matches(entry, this._filters));
      const sorted = this._sortEntries(filtered);
      const pagerReady = Boolean(customElements.get('kakao-pagination'));
      if (!pagerReady) this._awaitDefined('kakao-pagination');
      const size = pagerReady ? this.pageSize : 0;
      const pages = size ? Math.max(1, Math.ceil(sorted.length / size)) : 1;
      this._page = Math.min(Math.max(1, this._page), pages);
      const start = size ? (this._page - 1) * size : 0;
      const shown = size ? sorted.slice(start, start + size) : sorted;

      // Nothing matches the filters: say so, unless the page chose its own words.
      if (this._ownTable) {
        const noMatch = !shown.length && filtered.length !== all.length;
        setAttr(table, 'empty-heading', noMatch && !this.hasAttribute('empty-heading') ? texts.noMatches : this.getAttribute('empty-heading'));
        setAttr(table, 'empty-message', noMatch && !this.hasAttribute('empty-heading') ? texts.noMatchesMessage : this.getAttribute('empty-message'));
      }
      table.rows = shown.map((entry) => entry.row);
      this._syncTableSelection();

      const pager = this._pager;
      if (this._ownPager) {
        pager.hidden = !size;
        setAttr(pager, 'label', this.getAttribute('label'));
        setAttr(pager, 'page-sizes', this.getAttribute('page-sizes'));
        setAttr(pager, 'url', null);
      }
      if (size) {
        setAttr(pager, 'page-size', size);
        setAttr(pager, 'total-items', sorted.length);
        setAttr(pager, 'page', this._page);
      }
      this._renderSummary(shown.length ? start + 1 : 0, start + shown.length, sorted.length, all.length);
    }

    _showServer() {
      const table = this._table;
      if (this._data) {
        table.rows = this._entries.map((entry) => entry.row);
        if (this._selected.size) this._table.selected = Array.from(this._selected);
      }
      const pager = this._pager;
      const total = parseInt(this.getAttribute('total-items'), 10);
      const size = this.pageSize;
      const page = this._page;
      if (this._ownPager) {
        pager.hidden = Number.isNaN(total) || !size;
        setAttr(pager, 'label', this.getAttribute('label'));
        setAttr(pager, 'page-sizes', this.getAttribute('page-sizes'));
        setAttr(pager, 'url', this.getAttribute('page-url'));
        setAttr(pager, 'total-items', Number.isNaN(total) ? null : total);
        setAttr(pager, 'page-size', size || null);
        setAttr(pager, 'page', page);
      }
      if (Number.isNaN(total)) {
        this._renderSummary(null);
        return;
      }
      const from = total ? (size ? (page - 1) * size + 1 : 1) : 0;
      const to = size ? Math.min(total, page * size) : total;
      this._renderSummary(from, to, total, total);
    }

    _renderSummary(from, to, total, all) {
      const summary = this._summary;
      if (from === null || this.hasAttribute('hide-summary')) {
        summary.hidden = true;
        summary.textContent = '';
      } else {
        summary.hidden = false;
        let text = total ? fill(texts.summary, { from, to, total }) : texts.none;
        if (all !== total) text += ` ${fill(texts.filtered, { all })}`;
        if (summary.textContent !== text) summary.textContent = text;
      }
      this._renderClear();
    }

    /** "Clear filters" in the bar while a filter has a value. */
    _renderClear() {
      const bar = this._bar;
      const active = this._activeCount() > 0;
      let clear = bar.querySelector(`:scope > .${PREFIX}clear`);
      const useKakao = Boolean(customElements.get('kakao-button'));
      if (!useKakao) this._awaitDefined('kakao-button');
      if (clear && (clear.localName === 'kakao-button') !== useKakao) {
        clear.remove();
        clear = null;
      }
      if (!clear) {
        if (useKakao) {
          clear = el('kakao-button', `${PREFIX}clear`);
          clear.setAttribute('variant', 'ghost');
          clear.setAttribute('size', 'sm');
        } else {
          clear = el('button', `${PREFIX}clear`);
          clear.type = 'button';
        }
        bar.append(clear);
      }
      if (useKakao) setAttr(clear, 'label', texts.clearFilters);
      else if (clear.textContent !== texts.clearFilters) clear.textContent = texts.clearFilters;
      clear.hidden = !active;
      bar.hidden = this._summary.hidden && !active;
    }

    /* ----------------------------------------------------------- Filters */

    _tableElement() {
      return this._table ? this._table.querySelector('table') : null;
    }

    /** The filter row: the generated one, or the server's tr.filters / tr[data-filters]. */
    _currentFilterRow() {
      if (this._filterRow) return this._filterRow;
      const table = this._tableElement();
      if (!table || !table.tHead) return null;
      return table.tHead.querySelector(':scope > tr.filters, :scope > tr[data-filters], :scope > tr.' + PREFIX + 'filters');
    }

    /** Every filter field: { field, key, name }. */
    _fields() {
      const row = this._currentFilterRow();
      if (!row) return [];
      const keys = this._columnKeys();
      const out = [];
      Array.from(row.cells).filter((cell) => !cell.classList.contains(`${PREFIX}spacer`)).forEach((cell, index) => {
        cell.querySelectorAll('input[name], select[name], kakao-text-input[name], kakao-select[name], [data-filter-key]').forEach((field) => {
          if (field.closest(`.${PREFIX}filters`) !== row && field.closest('tr') !== row) return;
          const name = field.getAttribute('name') || field.dataset.filterKey;
          out.push({ field, name, key: field.dataset.filterKey || keys[index] || name });
        });
      });
      return out;
    }

    /** The key of each heading (not the selection column), for a server row's fields. */
    _columnKeys() {
      const table = this._tableElement();
      const headRow = table && table.tHead && table.tHead.rows[0];
      if (!headRow) return [];
      return Array.from(headRow.cells)
        .filter((cell) => !cell.classList.contains('kakao-table-select'))
        .map((th) => {
          if (th.dataset.key) return th.dataset.key;
          const link = th.querySelector('a[data-sort]');
          return link ? link.dataset.sort.replace(/^-/, '') : '';
        });
    }

    _readFilters() {
      const filters = {};
      const params = {};
      this._fields().forEach(({ field, key, name }) => {
        const value = fieldValue(field);
        filters[key] = value;
        if (name) params[name] = value;
      });
      return { filters, params };
    }

    _activeCount() {
      return this._fields().filter(({ field }) => !isBlank(fieldValue(field))).length;
    }

    _setField(field, value) {
      if (field.localName === 'kakao-text-input' || field.localName === 'kakao-select') {
        if (customElements.get(field.localName)) field.value = value;
        else field.setAttribute('value', value);
      } else {
        field.value = value;
      }
    }

    _filterName(key) { return fill(this.getAttribute('filter-name') || '{key}', { key }); }

    /** One filter field: a kakao field where defined, else a native one. */
    _field(column, spec) {
      const key = column.key;
      const name = this._filterName(key);
      const label = fill(texts.filterLabel, { label: column.label });
      const value = isBlank(this._filters[key]) ? '' : String(this._filters[key]);
      let field;
      if (spec.type === 'select') {
        const options = [{ value: '', label: texts.all }, ...spec.options.map(optionOf)];
        if (customElements.get('kakao-select')) {
          field = el('kakao-select');
          field.setAttribute('size', 'sm');
          field.setAttribute('placeholder', texts.all);
          field.setAttribute('list-data', JSON.stringify(options));
          field.setAttribute('value', value);
        } else {
          this._awaitDefined('kakao-select');
          field = el('select');
          options.forEach((option) => {
            const node = el('option');
            node.value = option.value;
            node.textContent = option.label;
            field.append(node);
          });
          field.value = value;
        }
      } else if (customElements.get('kakao-text-input')) {
        field = el('kakao-text-input');
        field.setAttribute('type', 'search');
        field.setAttribute('size', 'sm');
        field.setAttribute('clearable', '');
        field.setAttribute('value', value);
        if (spec.placeholder) field.setAttribute('placeholder', spec.placeholder);
      } else {
        this._awaitDefined('kakao-text-input');
        field = el('input');
        field.type = 'search';
        field.value = value;
        field.autocomplete = 'off';
        if (spec.placeholder) field.placeholder = spec.placeholder;
      }
      field.classList.add(`${PREFIX}field`);
      field.dataset.filterKey = key;
      field.setAttribute('name', name);
      field.setAttribute('aria-label', label);
      return field;
    }

    /** The generated filter row, drawn again when the columns, names or words changed. */
    _buildFilterRow() {
      const columns = this._data ? this._data.columns : [];
      const specs = columns.map((column) => filterSpec(column.filter));
      if (!specs.some(Boolean)) {
        if (this._filterRow) this._filterRow.remove();
        this._filterRow = null;
        this._filterColumns = null;
        return;
      }
      if (this._filterRow && this._filterColumns === columns && this._filterTexts === texts) return;
      // Keep what was typed while the row is drawn again.
      if (this._filterRow) Object.assign(this._filters, this._readFilters().filters);
      const row = el('tr', `${PREFIX}filters`);
      row.id = this._filterRow ? this._filterRow.id : `${PREFIX}filters-${++fieldIds}`;
      columns.forEach((column, index) => {
        const cell = el('td');
        if (specs[index]) cell.append(this._field(column, specs[index]));
        row.append(cell);
      });
      if (this._filterRow) this._filterRow.replaceWith(row);
      this._filterRow = row;
      this._filterColumns = columns;
      this._filterTexts = texts;
    }

    /** After the table drew: filter row in place, its labels, the Filters button, action cells. */
    _decorate() {
      const table = this._tableElement();
      if (!table) return;
      if (this._data) this._buildFilterRow();
      const head = table.tHead;
      const row = this._currentFilterRow();
      if (row && head) {
        if (row.parentNode !== head || head.rows[0] === row) head.append(row);
        row.classList.add(`${PREFIX}filters`);
        setAttr(row, 'role', 'row');
        if (!row.id) row.id = `${PREFIX}filters-${++fieldIds}`;
        const headRow = head.rows[0];
        // A cell under the table's selection column, so the fields stay under their headings.
        const selectCell = headRow && headRow.querySelector(':scope > .kakao-table-select');
        let spacer = row.querySelector(`:scope > .${PREFIX}spacer`);
        if (selectCell && !spacer) {
          spacer = el('td', `kakao-table-select ${PREFIX}spacer`);
          row.prepend(spacer);
        } else if (!selectCell && spacer) {
          spacer.remove();
        }
        const headings = headRow ? Array.from(headRow.cells).filter((cell) => !cell.classList.contains('kakao-table-select')) : [];
        Array.from(row.cells).filter((cell) => cell !== spacer).forEach((cell, index) => {
          const th = headings[index];
          const label = th ? (th.dataset.label !== undefined ? th.dataset.label : th.textContent.trim()) : '';
          const field = cell.querySelector('input:not([type="hidden"]), select, kakao-text-input, kakao-select');
          setAttr(cell, 'role', 'cell');
          setAttr(cell, 'data-label', field ? label : null);
          setAttr(cell, 'data-filter-empty', field ? null : '');
          if (field && !field.hasAttribute('aria-label') && !(field.labels && field.labels.length)) {
            field.setAttribute('aria-label', fill(texts.filterLabel, { label }));
          }
        });
      }
      this._renderToggle(row);
      this._decorateServerActions();
      this._syncStacked();
      this._renderClear();
    }

    /** The "Filters" disclosure in the table's tools line (shown while the rows are wrapped). */
    _renderToggle(row) {
      const tools = this._table.querySelector(':scope > .kakao-table-tools');
      if (!tools) return;
      let toggle = tools.querySelector(`:scope > .${PREFIX}toggle`);
      if (!row) {
        if (toggle) toggle.remove();
        return;
      }
      if (!toggle) {
        toggle = el('button', `${PREFIX}toggle`);
        toggle.type = 'button';
        toggle.append(glyph('filter'), el('span', `${PREFIX}toggle-text`), el('span', `${PREFIX}count`));
        tools.append(toggle);
      }
      toggle.setAttribute('aria-controls', row.id);
      toggle.setAttribute('aria-expanded', String(this._filtersOpen));
      toggle.querySelector(`.${PREFIX}toggle-text`).textContent = texts.filters;
      const count = this._activeCount();
      const badge = toggle.querySelector(`.${PREFIX}count`);
      badge.textContent = count ? String(count) : '';
      badge.hidden = !count;
      this.toggleAttribute('data-filters-open', this._filtersOpen);
      // The table hides its tools line without rows; filters that match nothing must stay changeable.
      tools.hidden = false;
    }

    _handleInput(event) {
      const field = this._filterField(event.target);
      if (!field || !isTextField(field) || !this._clientMode()) return;
      clearTimeout(this._timer);
      const delay = parseInt(this.getAttribute('filter-delay'), 10);
      this._timer = setTimeout(() => this._apply('user'), Number.isNaN(delay) || delay < 0 ? DEFAULT_DELAY : delay);
    }

    _handleChange(event) {
      const field = this._filterField(event.target);
      if (!field) return;
      clearTimeout(this._timer);
      this._apply('user');
    }

    _filterField(target) {
      if (!(target instanceof Element) || target.closest(TAG_NAME) !== this) return null;
      const row = this._currentFilterRow();
      if (!row || !row.contains(target)) return null;
      return target.closest('input, select, kakao-text-input, kakao-select');
    }

    /** Fires filter-change; then filters in the browser or goes to the server. */
    _apply(source) {
      const { filters, params } = this._readFilters();
      const snapshot = JSON.stringify(params) + JSON.stringify(filters);
      if (source !== 'clear' && snapshot === this._lastApplied) return;
      const server = !this._clientMode();
      const url = server ? this._filterUrl(params) : null;
      const go = this.dispatchEvent(new CustomEvent('filter-change', {
        detail: { filters, params, url, source }, bubbles: true, composed: true, cancelable: true,
      }));
      this._lastApplied = snapshot;
      if (!go) {
        this._renderToggle(this._currentFilterRow());
        this._renderClear();
        return;
      }
      if (server) {
        window.location.assign(url);
        return;
      }
      this._filters = filters;
      this._page = 1;
      this._redraw();
    }

    /** Where server mode sends the filters: the query kept, filters and page replaced. */
    _filterUrl(params) {
      const url = new URL(this.getAttribute('filter-url') || window.location.href, window.location.href);
      Object.keys(params).forEach((name) => url.searchParams.delete(name));
      url.searchParams.delete('page');
      Object.keys(params).forEach((name) => {
        if (!isBlank(params[name])) url.searchParams.set(name, params[name]);
      });
      return url.href;
    }

    /* ----------------------------------------------------------- Actions */

    _normalAction(action) {
      if (typeof action === 'string') {
        return { name: action, ...(BUILT_IN[action] ? BUILT_IN[action]() : { label: action, icon: action }) };
      }
      if (!action || typeof action !== 'object' || isBlank(action.name)) return null;
      const base = BUILT_IN[action.name] ? BUILT_IN[action.name]() : { label: action.name, icon: action.name };
      return { ...base, ...action };
    }

    _rowLabel(row) {
      const column = this._data.columns.find((entry) => !entry.actions);
      if (!column) return '';
      const value = Array.isArray(row) ? row[this._data.columns.indexOf(column)] : row && row[column.key];
      return isBlank(value) || typeof value === 'object' ? '' : String(value).trim().replace(/\s+/g, ' ').slice(0, 80);
    }

    /** The buttons and links of one row's action cell. */
    _renderActions(column, row) {
      const record = row && typeof row === 'object' && !Array.isArray(row) ? row : {};
      const id = Array.isArray(row) ? '' : String(record[this._rowKey()]);
      const rowLabel = this._rowLabel(row);
      const useKakao = Boolean(customElements.get('kakao-button'));
      if (!useKakao) this._awaitDefined('kakao-button');
      const box = el('span', `${PREFIX}actions`);
      (Array.isArray(column.actions) ? column.actions : []).forEach((given) => {
        const action = this._normalAction(given);
        if (!action) return;
        if (typeof action.visible === 'string' && !record[action.visible]) return;
        if (typeof action.visible === 'function' && !action.visible(row)) return;
        if (action.visible === false) return;
        const values = { ...record, id, action: action.name };
        const template = action.url || this.getAttribute('action-url');
        const href = template ? fill(template, values, true) : null;
        const label = String(action.label);
        const name = rowLabel ? fill(texts.actionLabel, { action: label, row: rowLabel }) : label;
        let control;
        if (href) {
          control = el('a', `${PREFIX}action`);
          control.href = href;
        } else if (useKakao) {
          control = el('kakao-button', `${PREFIX}action`);
          control.setAttribute('variant', 'ghost');
          control.setAttribute('size', 'sm');
          control.setAttribute('icon-position', 'only');
          control.setAttribute('label', label);
        } else {
          control = el('button', `${PREFIX}action`);
          control.type = 'button';
        }
        const icon = glyph(action.icon || action.name);
        if (control.localName === 'kakao-button') icon.setAttribute('slot', 'icon');
        control.append(icon);
        if (control.localName !== 'kakao-button') {
          const text = el('span', `${PREFIX}action-label`);
          text.textContent = label;
          control.append(text);
        }
        control.setAttribute('aria-label', name);
        control.setAttribute('title', label);
        control.dataset.action = action.name;
        if (action.tone) control.dataset.tone = action.tone;
        const confirm = action.confirm ? fill(action.confirm, values) : '';
        const method = href && action.method && String(action.method).toLowerCase() !== 'get' ? String(action.method).toLowerCase() : '';
        // Yii's own script sends data-method links; the grid asks first.
        if (method && window.yii) control.dataset.method = method;
        this._actionInfo.set(control, { action: action.name, id, row: given && row, confirm, method, href, label, tone: action.tone || '' });
        box.append(control);
      });
      return box;
    }

    /** Server markup: links and buttons in a data-type="actions" column. */
    _decorateServerActions() {
      if (this._data) return;
      const table = this._tableElement();
      const headRow = table && table.tHead && table.tHead.rows[0];
      if (!headRow) return;
      const headings = Array.from(headRow.cells).filter((cell) => !cell.classList.contains('kakao-table-select'));
      const indexes = headings
        .map((th, index) => (th.dataset.type === 'actions' || th.hasAttribute('data-actions') ? index : -1))
        .filter((index) => index >= 0);
      if (!indexes.length) return;
      Array.from(table.tBodies).forEach((body) => {
        Array.from(body.rows).forEach((tr) => {
          const cells = Array.from(tr.cells).filter((cell) => !cell.classList.contains('kakao-table-select'));
          indexes.forEach((index) => {
            const cell = cells[index];
            if (!cell) return;
            cell.setAttribute('data-type', 'actions');
            cell.querySelectorAll('a[href], button, kakao-button').forEach((control) => {
              if (control.closest('kakao-button') && control.closest('kakao-button') !== control) return;
              control.classList.add(`${PREFIX}action`);
              const title = control.getAttribute('title') || control.getAttribute('aria-label') || '';
              if (!control.dataset.action && title) control.dataset.action = fold(title).trim().replace(/\s+/g, '-');
              if (control.localName !== 'kakao-button' && !control.textContent.trim() && title && !control.querySelector(`.${PREFIX}action-label`)) {
                const text = el('span', `${PREFIX}action-label`);
                text.textContent = title;
                control.append(text);
              }
            });
          });
        });
      });
    }

    _handleClick(event) {
      if (!(event.target instanceof Element)) return;
      const target = event.target;
      if (target.closest(TAG_NAME) !== this) return;

      if (target.closest(`.${PREFIX}toggle`)) {
        this._filtersOpen = !this._filtersOpen;
        this._renderToggle(this._currentFilterRow());
        return;
      }
      if (target.closest(`.${PREFIX}clear`) && this._bar.contains(target)) {
        this.clearFilters();
        return;
      }

      const control = target.closest(`.${PREFIX}action`);
      if (!control || !this._table || !this._table.contains(control) || control.closest('thead')) return;
      if (control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true') return;
      const tr = control.closest('tr');
      let info = this._actionInfo.get(control);
      if (!info) {
        // Server markup: Yii writes data-confirm and data-method itself.
        const href = control.localName === 'a' ? control.href : control.getAttribute('href');
        info = {
          action: control.dataset.action || '',
          id: tr ? (tr.dataset.key !== undefined ? tr.dataset.key : tr.dataset.id || null) : null,
          row: null,
          confirm: window.yii ? '' : control.getAttribute('data-confirm') || '',
          method: window.yii ? '' : (control.getAttribute('data-method') || '').toLowerCase(),
          href: href || null,
          // The dialog's main button: the link's own name; a delete link is a danger action.
          label: control.getAttribute('title') || control.getAttribute('aria-label') || '',
          tone: /delete/i.test(control.dataset.action || control.getAttribute('href') || '') ? 'danger' : '',
        };
        if (info.method === 'get') info.method = '';
      }
      const stop = () => {
        event.preventDefault();
        event.stopPropagation(); // Yii's document handler must not send it either
      };
      if (info.confirm) {
        // Ask first; the click itself never proceeds, the answer continues it.
        stop();
        this._ask(info).then((yes) => { if (yes) this._run(info, control); });
        return;
      }
      if (!this._run(info, control, true)) stop();
    }

    /**
     * Fires row-action and does what the action means. `inClick`: still inside
     * the click, so a plain link may simply be followed. Returns false when the
     * click must not proceed.
     */
    _run(info, control, inClick = false) {
      const go = this.dispatchEvent(new CustomEvent('row-action', {
        detail: { action: info.action, id: info.id, row: info.row, href: info.href }, bubbles: true, composed: true, cancelable: true,
      }));
      if (!go) return false;
      if (info.method && info.href) {
        this._send(info.href, info.method);
        return false;
      }
      if (!inClick) {
        // After a confirmation: follow the link ourselves (respecting its target).
        if (info.href) {
          const target = control.getAttribute('target');
          if (target && target !== '_self') window.open(info.href, target);
          else window.location.assign(info.href);
        }
      }
      return true;
    }

    /** The confirmation: our dialog when it is on the page, else the browser's. */
    _ask(info) {
      const texts = KakaoGridView.texts;
      if (!customElements.get('kakao-dialog') || !customElements.get('kakao-button')) {
        return Promise.resolve(window.confirm(info.confirm));
      }
      let dialog = this._confirmDialog;
      if (!dialog || !dialog.isConnected) {
        dialog = el('kakao-dialog');
        dialog.setAttribute('size', 'sm');
        dialog.dataset.gridConfirm = '';
        const heading = el('h2');
        heading.slot = 'header';
        const message = el('p');
        const footer = el('div');
        footer.slot = 'footer';
        const cancel = el('kakao-button');
        cancel.setAttribute('variant', 'secondary');
        cancel.dataset.close = 'cancel';
        const ok = el('kakao-button');
        ok.dataset.close = 'confirm';
        footer.append(cancel, ok);
        dialog.append(heading, message, footer);
        document.body.append(dialog);
        this._confirmDialog = dialog;
      }
      const [heading, message, footer] = dialog.children;
      const [cancel, ok] = footer.children;
      heading.textContent = texts.confirmTitle;
      message.textContent = info.confirm;
      cancel.setAttribute('label', texts.cancel);
      ok.setAttribute('label', info.label || texts.delete);
      ok.setAttribute('variant', info.tone === 'danger' || info.action === 'delete' ? 'danger' : 'primary');
      return new Promise((resolve) => {
        dialog.addEventListener('dialog-close', (e) => resolve(e.detail && e.detail.returnValue === 'confirm'), { once: true });
        dialog.open();
      });
    }

    /** A link with a method other than GET, without yii.js: a POST form with Yii's CSRF field. */
    _send(href, method) {
      const form = el('form');
      form.method = 'post';
      form.action = href;
      form.hidden = true;
      const add = (name, value) => {
        const input = el('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.append(input);
      };
      const param = document.querySelector('meta[name="csrf-param"]');
      const token = document.querySelector('meta[name="csrf-token"]');
      if (param && token) add(param.content, token.content);
      if (method !== 'post') add('_method', method);
      document.body.append(form);
      form.submit();
    }

    /* ------------------------------------------------- Sort, page, select */

    _sorted() {
      if (!this._clientMode()) return;
      const sort = this._table.sort;
      if (sort === this._lastSort) return;
      this._lastSort = sort;
      this._page = 1;
      this._redraw();
    }

    _paged(event) {
      if (!this._clientMode() || event.defaultPrevented) return;
      const pager = this._pager;
      if (event.type === 'page-size-change') this._pageSize = pager.pageSize;
      this._page = pager.page;
      this._redraw();
    }

    _selectionChanged(event) {
      if (!this._clientMode()) return;
      const shown = new Set(this._table.rows.map((row) => (Array.isArray(row) ? null : String(row[this._rowKey()]))));
      shown.forEach((id) => this._selected.delete(id));
      (event.detail && event.detail.selected ? event.detail.selected : []).forEach((id) => this._selected.add(String(id)));
    }

    _syncTableSelection() {
      if (this.hasAttribute('selectable') || this._table.hasAttribute('selectable')) this._table.selected = Array.from(this._selected);
    }

    /** Wrapped form: action buttons show their labels. */
    _syncStacked() {
      const table = this._table;
      if (!table) return;
      const stacked = table.hasAttribute('data-stacked');
      table.querySelectorAll(`kakao-button.${PREFIX}action`).forEach((button) => {
        setAttr(button, 'icon-position', stacked ? 'left' : 'only');
        setAttr(button, 'variant', stacked ? 'secondary' : 'ghost');
      });
    }
  }

  customElements.define(TAG_NAME, KakaoGridView);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }

  window.KakaoGridView = KakaoGridView;
})();
