/**
 * <kakao-tree-view>
 * ============================================================================
 * Nested, collapsible rows: folders and files, or permission groups with
 * checkboxes. The WAI-ARIA tree pattern (tree / treeitem / group, one tab stop,
 * arrow keys, type-ahead) with three selection modes and an optional form
 * value. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="tree-view.js"><\/script>
 *
 *   <kakao-tree-view label="Files" list-data='[
 *     { "id": "docs", "label": "Documents", "icon": "folder", "expanded": true, "children": [
 *       { "id": "inv", "label": "Invoices", "icon": "folder", "children": [
 *         { "id": "inv-2026", "label": "2026.pdf", "icon": "file" }
 *       ] },
 *       { "id": "cv", "label": "CV.pdf", "icon": "file", "selected": true }
 *     ] }
 *   ]'></kakao-tree-view>
 *
 *   <!-- or a server-rendered nested list; without JavaScript it stays a list -->
 *   <kakao-tree-view label="Permissions" selection="multiple" name="perm[]">
 *     <ul>
 *       <li data-id="posts" data-expanded>Posts
 *         <ul>
 *           <li data-id="posts.read" data-selected>Read</li>
 *           <li data-id="posts.write">Write</li>
 *         </ul>
 *       </li>
 *     </ul>
 *   </kakao-tree-view>
 *
 *   el.nodes = [{ id: 'a', label: 'A', children: [...] }];   // from script
 *   el.value;                 // ['posts.read']
 *   el.expand('posts'); el.collapseAll();
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  list-data    JSON array of nodes (never "data"). A node is a string (the
 *               label) or { "id", "label", "children"?, "icon"?, "expanded"?,
 *               "disabled"?, "selected"?, "lazy"? }. icon is one of folder,
 *               file, user, users, lock, key, or left out for none. A node
 *               without an id gets one from its position ("node-0-2").
 *               "lazy": true marks a node whose children come later (see
 *               tree-expand). Wins over a nested list in the element.
 *  selection    "single" (default): one node is selected, filled like a
 *               selected list row. "multiple": a checkbox per node; a parent
 *               checks or clears everything under it and shows a dash when
 *               only some are checked. "none": rows only open and close.
 *  name         With a form: every selected id is sent under this name
 *               (use "perm[]" for PHP / Yii2).
 *  leaves-only  Multiple: value and the form get only the checked nodes that
 *               have no children. Without it a fully checked parent is in too.
 *  guides       Draws a thin line down each open level.
 *  label        Accessible name of the tree. Default "Tree".
 *  disabled     Nothing can be focused, opened or selected; nothing is sent.
 *
 * Nested list markup: <li> attributes data-id, data-icon, data-expanded,
 * data-selected, data-disabled, data-lazy; the label is the item's own text.
 *
 * PROPERTIES: nodes (get / set, the list-data shapes), value (get / set, an
 * array of selected ids; a string for one), loadChildren (a function
 * (node) => array or Promise of an array, called when a lazy node opens).
 *
 * METHODS: expand(id), collapse(id), toggle(id), expandAll(), collapseAll(),
 * setChildren(id, nodes) (fills a lazy node), clear() (selects nothing),
 * refresh() (reads list-data or the nested list again).
 *
 * KakaoTreeView.texts: the words for every tree: { label, loading }.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  tree-select  { id, label, selected, value }  the user selected a node, or
 *               ticked / cleared it; value is the new list of selected ids.
 *  tree-expand  { id, label, lazy }  cancelable, before a node opens. For a
 *               lazy node: load its children and call setChildren(id, nodes)
 *               (or set loadChildren instead); until then it shows a spinner.
 *  tree-toggle  { id, label, expanded }  a node opened or closed.
 *
 * Keyboard: Tab reaches one row. Up / Down move, Right opens a closed node or
 * goes to its first child, Left closes an open node or goes to its parent,
 * Home / End go to the first / last row, typing letters jumps to the next row
 * that starts with them, * opens every node on the current level, Enter or
 * Space select (or, with selection="none", open and close).
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-tree-view-text / -muted / -hover-bg / -selected-bg / -focus / -chevron
 *  --kakao-tree-view-icon / -guide / -box-bg / -box-border / -box-checked-bg / -mark
 *  --kakao-tree-view-font / -selected-weight / -row-height / -touch-row-height
 *  --kakao-tree-view-padding-x / -gap / -indent / -toggle-size / -chevron-size
 *  --kakao-tree-view-icon-size / -box-size / -box-radius / -row-radius / -guide-width
 *  --kakao-tree-view-focus-width / -disabled-opacity / -duration / -ease
 *
 * Parts: tree, item, row, toggle, checkbox, icon, label, group.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-tree-view';
  if (customElements.get(TAG_NAME)) return;

  /** The built-in words. Change them for every tree with KakaoTreeView.texts. */
  const TEXTS = Object.freeze({
    label: 'Tree',
    loading: 'Loading',
  });

  const svg = (body) => `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

  const CHEVRON = '<svg class="chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m6 3.5 4.5 4.5L6 12.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const SPINNER = '<svg class="spinner" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2.5A5.5 5.5 0 1 1 2.5 8" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';
  const BOX = '<svg class="tick" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3.5 8.5 3 3 6-7"/></svg><svg class="dash" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 8h8"/></svg>';

  /** The known glyphs. "folder" swaps to "folder-open" while its node is open. */
  const ICONS = {
    folder: svg('<path d="M2 4.5a1 1 0 0 1 1-1h3.2l1.5 1.6H13a1 1 0 0 1 1 1v5.9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>'),
    'folder-open': svg('<path d="M2 12V4.5a1 1 0 0 1 1-1h3.2l1.5 1.6H12a1 1 0 0 1 1 1v1.4"/><path d="M2 12.5 3.7 8.2a1 1 0 0 1 .9-.7h8.9a.7.7 0 0 1 .65 1L12.6 12.4a1 1 0 0 1-.9.6H2.5a.5.5 0 0 1-.5-.5z"/>'),
    file: svg('<path d="M4 2.5h5l3 3v8H4z"/><path d="M9 2.5v3h3"/>'),
    user: svg('<circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.6-2.4 2.6-3.7 5-3.7s4.4 1.3 5 3.7"/>'),
    users: svg('<circle cx="6" cy="5.5" r="2.2"/><path d="M1.8 13c.5-2.1 2.2-3.2 4.2-3.2s3.7 1.1 4.2 3.2"/><path d="M10.5 3.6a2.2 2.2 0 0 1 0 4"/><path d="M12 10.2c1.2.5 2 1.5 2.3 2.8"/>'),
    lock: svg('<rect x="3.5" y="7" width="9" height="6.5" rx="1.2"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>'),
    key: svg('<circle cx="5.5" cy="10.5" r="2.5"/><path d="m7.4 8.6 5.6-5.6"/><path d="m11 5 1.5 1.5"/>'),
  };

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-tree-view- (written by construction.html, edit there) */
        --_text: var(--kakao-tree-view-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-tree-view-muted, var(--kakao-color-muted, #62626c));
        --_hover-bg: var(--kakao-tree-view-hover-bg, var(--kakao-color-subtle, #f0f0f1));
        --_selected-bg: var(--kakao-tree-view-selected-bg, var(--kakao-color-subtle-strong, #e6e6e8));
        --_focus: var(--kakao-tree-view-focus, var(--kakao-color-focus, #2563eb));
        --_chevron: var(--kakao-tree-view-chevron, var(--kakao-color-muted, #62626c));
        --_icon: var(--kakao-tree-view-icon, var(--kakao-color-muted, #62626c));
        --_guide: var(--kakao-tree-view-guide, var(--kakao-color-line, #e5e7eb));
        --_box-bg: var(--kakao-tree-view-box-bg, var(--kakao-color-bg, #ffffff));
        --_box-border: var(--kakao-tree-view-box-border, var(--kakao-color-border, #82828b));
        --_box-checked-bg: var(--kakao-tree-view-box-checked-bg, var(--kakao-color-ink, #18181b));
        --_mark: var(--kakao-tree-view-mark, var(--kakao-color-on-ink, #fafafa));
        --_font: var(--kakao-tree-view-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_selected-weight: var(--kakao-tree-view-selected-weight, 600);
        --_row-height: var(--kakao-tree-view-row-height, 36px);
        --_touch-row-height: var(--kakao-tree-view-touch-row-height, 44px);
        --_padding-x: var(--kakao-tree-view-padding-x, 0.375rem);
        --_gap: var(--kakao-tree-view-gap, 0.375rem);
        --_indent: var(--kakao-tree-view-indent, 1.25rem);
        --_toggle-size: var(--kakao-tree-view-toggle-size, 1.5rem);
        --_chevron-size: var(--kakao-tree-view-chevron-size, 1rem);
        --_icon-size: var(--kakao-tree-view-icon-size, 1.125rem);
        --_box-size: var(--kakao-tree-view-box-size, 18px);
        --_box-radius: var(--kakao-tree-view-box-radius, var(--kakao-radius-sm, 6px));
        --_row-radius: var(--kakao-tree-view-row-radius, var(--kakao-radius-sm, 6px));
        --_guide-width: var(--kakao-tree-view-guide-width, 1px);
        --_focus-width: var(--kakao-tree-view-focus-width, 2px);
        --_disabled-opacity: var(--kakao-tree-view-disabled-opacity, 0.55);
        --_duration: var(--kakao-tree-view-duration, 150ms);
        --_ease: var(--kakao-tree-view-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        display: block;
        min-width: 0;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([disabled]) { opacity: var(--_disabled-opacity); }
      @media (pointer: coarse) {
        :host { --_row-height: var(--_touch-row-height); }
      }

      ul { margin: 0; padding: 0; list-style: none; }
      .item { --_depth: 0; outline: none; }
      .group { position: relative; }
      .group[hidden] { display: none; }

      .row {
        display: flex;
        align-items: center;
        gap: var(--_gap);
        box-sizing: border-box;
        min-height: var(--_row-height);
        padding-block: 0.25rem;
        padding-inline: calc(var(--_padding-x) + var(--_depth) * var(--_indent)) var(--_padding-x);
        border-radius: var(--_row-radius);
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: background-color var(--_duration) var(--_ease);
      }
      .row:hover { background: var(--_hover-bg); }
      .item[aria-selected="true"] > .row { background: var(--_selected-bg); font-weight: var(--_selected-weight); }
      .item:focus-visible > .row { outline: var(--_focus-width) solid var(--_focus); outline-offset: calc(var(--_focus-width) * -1); }
      .item[aria-disabled="true"] > .row { color: var(--_muted); cursor: not-allowed; }
      .item[aria-disabled="true"] > .row:hover { background: none; }
      :host([disabled]) .row { cursor: default; pointer-events: none; }

      /* The chevron: a 24px target; an empty one keeps leaves in line. */
      .toggle {
        flex: none;
        display: inline-grid;
        place-items: center;
        width: var(--_toggle-size);
        height: var(--_toggle-size);
        border-radius: var(--_row-radius);
        color: var(--_chevron);
      }
      .toggle svg { display: block; width: var(--_chevron-size); height: var(--_chevron-size); }
      .chevron { transition: transform var(--_duration) var(--_ease); }
      :host(:dir(rtl)) .chevron { transform: scaleX(-1); }
      .item[aria-expanded="true"] > .row .chevron { transform: rotate(90deg); }
      .toggle .spinner { display: none; animation: kakao-tree-view-spin 0.8s linear infinite; }
      .item[aria-busy="true"] > .row .chevron { display: none; }
      .item[aria-busy="true"] > .row .spinner { display: block; }
      @keyframes kakao-tree-view-spin { to { transform: rotate(360deg); } }

      /* Multiple: the checkbox's box, as in the select's panel. */
      .box {
        flex: none;
        display: inline-grid;
        place-items: center;
        box-sizing: border-box;
        width: var(--_box-size);
        height: var(--_box-size);
        border: 1px solid var(--_box-border);
        border-radius: var(--_box-radius);
        background: var(--_box-bg);
        color: var(--_mark);
        transition: background-color var(--_duration) var(--_ease), border-color var(--_duration) var(--_ease);
      }
      .box svg { display: none; width: 72%; height: 72%; fill: none; stroke: currentColor; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; }
      .item[aria-checked="true"] > .row .box,
      .item[aria-checked="mixed"] > .row .box { background: var(--_box-checked-bg); border-color: var(--_box-checked-bg); }
      .item[aria-checked="true"] > .row .tick,
      .item[aria-checked="mixed"] > .row .dash { display: block; }

      .icon { flex: none; display: inline-flex; color: var(--_icon); }
      .icon svg { display: block; width: var(--_icon-size); height: var(--_icon-size); }
      .label { flex: 1; min-width: 0; overflow-wrap: anywhere; }
      .sr {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
        border: 0;
      }

      /* Guides: a line under the middle of the parent's chevron. */
      :host([guides]) .group::before {
        content: "";
        position: absolute;
        inset-block: 0;
        inset-inline-start: calc(var(--_padding-x) + var(--_depth) * var(--_indent) + (var(--_toggle-size) - var(--_guide-width)) / 2);
        width: var(--_guide-width);
        background: var(--_guide);
        pointer-events: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .row, .box, .chevron { transition: none; }
        .toggle .spinner { animation: none; }
      }
      @media (forced-colors: active) {
        .item[aria-selected="true"] > .row { forced-color-adjust: none; background: Highlight; color: HighlightText; }
        .item[aria-selected="true"] > .row .toggle, .item[aria-selected="true"] > .row .icon { color: HighlightText; }
        .item[aria-checked="true"] > .row .box,
        .item[aria-checked="mixed"] > .row .box { forced-color-adjust: none; background: Highlight; border-color: Highlight; color: HighlightText; }
        .item:focus-visible > .row { outline-color: Highlight; }
        :host([guides]) .group::before { background: GrayText; }
      }
    </style>
    <ul class="tree" part="tree" role="tree"></ul>
  `;

  const flag = (el, name) => el.hasAttribute(name) && el.getAttribute(name) !== 'false';

  /** A nested <ul> / <ol> as raw nodes: the label is the item's own text. */
  function fromList(list) {
    return Array.from(list.children).filter((li) => li.localName === 'li').map((li) => {
      const sub = Array.from(li.children).find((c) => c.localName === 'ul' || c.localName === 'ol');
      let label = '';
      li.childNodes.forEach((n) => { if (n !== sub) label += n.textContent; });
      return {
        id: li.getAttribute('data-id') || li.id || '',
        label: label.replace(/\s+/g, ' ').trim(),
        icon: li.getAttribute('data-icon') || '',
        expanded: flag(li, 'data-expanded'),
        selected: flag(li, 'data-selected'),
        disabled: flag(li, 'data-disabled'),
        lazy: flag(li, 'data-lazy'),
        children: sub ? fromList(sub) : undefined,
      };
    });
  }

  /** Normalises one node: a string, or { id, label, children, icon, ... }. */
  function toNode(raw, parent, path) {
    const obj = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : { label: raw };
    const node = {
      id: obj.id == null || obj.id === '' ? `node-${path}` : String(obj.id),
      label: String(obj.label ?? obj.title ?? obj.id ?? ''),
      icon: Object.prototype.hasOwnProperty.call(ICONS, obj.icon) ? obj.icon : '',
      expanded: obj.expanded === true,
      disabled: obj.disabled === true,
      selected: obj.selected === true,
      lazy: obj.lazy === true,
      loading: false,
      state: false, // multiple: true, false or "mixed", worked out from the leaves
      parent,
      children: [],
      el: null,
    };
    if (Array.isArray(obj.children)) {
      node.children = obj.children.map((child, i) => toNode(child, node, `${path}-${i}`)).filter((n) => n.label);
    }
    if (node.children.length) node.lazy = false;
    if (node.lazy) node.expanded = false;
    return node;
  }

  const walk = (nodes, fn) => nodes.forEach((n) => { fn(n); walk(n.children, fn); });
  const canOpen = (node) => node.children.length > 0 || node.lazy;

  const instances = new Set(); // connected trees, redrawn when the texts change
  let texts = { ...TEXTS };
  let seq = 0;

  class KakaoTreeView extends HTMLElement {
    static get formAssociated() { return true; }

    /** The words every tree uses. Setting it merges into the built-in ones. */
    static get texts() { return { ...texts }; }
    static set texts(value) {
      texts = { ...TEXTS, ...(value && typeof value === 'object' ? value : {}) };
      instances.forEach((el) => el._build());
    }

    static get observedAttributes() {
      return ['list-data', 'selection', 'name', 'leaves-only', 'label', 'disabled'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._tree = shadow.querySelector('.tree');
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      this._base = `${TAG_NAME}-${++seq}`;
      this._roots = [];
      this._byId = new Map();
      this._nodeOf = new WeakMap(); // treeitem element -> node
      this._fromScript = false; // nodes were set by script: attribute and markup are not read again
      this._activeId = null; // the row that holds the tab stop
      this._default = [];
      this._formDisabled = false;
      this._typed = '';
      this._typedAt = 0;
      this._wired = false;
      /** Optional hook for lazy nodes: (node) => array of nodes, or a Promise of one. */
      if (!Object.prototype.hasOwnProperty.call(this, 'loadChildren')) this.loadChildren = null;
    }

    connectedCallback() {
      instances.add(this);
      if (!this._wired) {
        this._wired = true;
        this._tree.addEventListener('click', (e) => this._onClick(e));
        this._tree.addEventListener('dblclick', (e) => this._onDblClick(e));
        this._tree.addEventListener('keydown', (e) => this._onKeydown(e));
        this._tree.addEventListener('focusin', (e) => this._onFocusIn(e));
        // Properties set before the element was upgraded go through the setters now.
        const early = {};
        ['nodes', 'value'].forEach((prop) => {
          if (!Object.prototype.hasOwnProperty.call(this, prop)) return;
          early[prop] = this[prop];
          delete this[prop];
        });
        if ('nodes' in early) this.nodes = early.nodes;
        if (!this._fromScript) {
          this._read();
          // Loaded without defer: the nested list is not parsed yet.
          if (!this._roots.length && document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
              if (!this._fromScript && !this._roots.length) this.refresh();
            }, { once: true });
          }
        }
        if ('value' in early) this._setValue(early.value);
      }
      this._build();
    }

    disconnectedCallback() {
      instances.delete(this);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this._wired) return;
      if (name === 'list-data') {
        this._fromScript = false;
        this._read();
        this._build();
      } else if (name === 'selection') {
        this._normalise();
        this._build();
      } else if (name === 'label') {
        this._tree.setAttribute('aria-label', newValue || texts.label);
      } else {
        this._paint();
      }
    }

    formResetCallback() {
      this._setValue(this._default);
    }

    formDisabledCallback(disabled) {
      this._formDisabled = disabled;
      this._paint();
    }

    /* ---------------------------------------------------------------- API */

    /** The nodes as plain objects, with their current open and selected state. */
    get nodes() {
      const multiple = this._mode() === 'multiple';
      const out = (node) => {
        const copy = { id: node.id, label: node.label };
        if (node.icon) copy.icon = node.icon;
        if (node.expanded) copy.expanded = true;
        if (node.disabled) copy.disabled = true;
        if (multiple ? node.state === true : node.selected) copy.selected = true;
        if (node.lazy) copy.lazy = true;
        if (node.children.length) copy.children = node.children.map(out);
        return copy;
      };
      return this._roots.map(out);
    }

    set nodes(list) {
      this._fromScript = true;
      this._load(Array.isArray(list) ? list : []);
      if (this._wired) this._build();
    }

    /** The selected ids, in the order of the tree. */
    get value() {
      const mode = this._mode();
      const ids = [];
      if (mode === 'none') return ids;
      const leavesOnly = mode === 'multiple' && flag(this, 'leaves-only');
      walk(this._roots, (node) => {
        const on = mode === 'multiple' ? node.state === true : node.selected;
        if (on && !(leavesOnly && node.children.length)) ids.push(node.id);
      });
      return ids;
    }

    set value(ids) {
      this._setValue(ids);
    }

    expand(id) { return this._setExpanded(this._byId.get(String(id)), true); }

    collapse(id) { return this._setExpanded(this._byId.get(String(id)), false); }

    toggle(id) {
      const node = this._byId.get(String(id));
      return node ? this._setExpanded(node, !node.expanded) : false;
    }

    /** Opens every node that has its children; lazy ones stay closed. */
    expandAll() {
      walk(this._roots, (node) => { if (node.children.length) node.expanded = true; });
      this._paint();
    }

    collapseAll() {
      const hadFocus = this.shadowRoot.activeElement != null;
      walk(this._roots, (node) => { node.expanded = false; });
      const active = this._byId.get(this._activeId);
      if (active && active.parent) {
        let top = active;
        while (top.parent) top = top.parent;
        this._activeId = top.id;
      }
      this._paint();
      if (hadFocus) this._focus(this._byId.get(this._activeId));
    }

    /** Fills a lazy node (or replaces a node's children) and ends its spinner. */
    setChildren(id, list) {
      const node = this._byId.get(String(id));
      if (!node) return false;
      const wasChecked = this._mode() === 'multiple' && (node.children.length ? node.state === true : node.selected);
      node.children = (Array.isArray(list) ? list : [])
        .map((child, i) => toNode(child, node, `${node.id}-${i}`)).filter((n) => n.label);
      node.lazy = false;
      node.loading = false;
      if (!node.children.length) node.expanded = false;
      if (wasChecked) walk(node.children, (n) => { n.selected = true; });
      this._index();
      this._normalise();
      this._build();
      return true;
    }

    /** Selects nothing. */
    clear() {
      this._setValue([]);
    }

    /** Reads list-data, or the nested list in the element, again. */
    refresh() {
      this._fromScript = false;
      this._read();
      this._build();
    }

    /* ----------------------------------------------------------- internals */

    get _off() {
      return this.hasAttribute('disabled') || this._formDisabled;
    }

    _mode() {
      const raw = (this.getAttribute('selection') || '').toLowerCase();
      if (raw === 'none') return 'none';
      return raw === 'multiple' || raw === 'multi' ? 'multiple' : 'single';
    }

    _read() {
      const raw = this.getAttribute('list-data');
      if (raw != null) {
        try {
          const parsed = JSON.parse(raw);
          this._load(Array.isArray(parsed) ? parsed : []);
        } catch (err) {
          console.warn(`${TAG_NAME}: list-data is not valid JSON`, err);
          this._load([]);
        }
        return;
      }
      const list = Array.from(this.children).find((c) => c.localName === 'ul' || c.localName === 'ol');
      this._load(list ? fromList(list) : []);
    }

    _load(list) {
      this._roots = list.map((raw, i) => toNode(raw, null, String(i))).filter((n) => n.label);
      this._index();
      this._normalise();
      this._default = this.value;
      this._activeId = null;
    }

    _index() {
      this._byId = new Map();
      walk(this._roots, (node) => {
        if (this._byId.has(node.id)) {
          console.warn(`${TAG_NAME}: the id "${node.id}" is used twice`);
          let n = 2;
          while (this._byId.has(`${node.id}-${n}`)) n += 1;
          node.id = `${node.id}-${n}`;
        }
        this._byId.set(node.id, node);
      });
    }

    /** Makes the selected flags fit the mode: one in single, parents carried down in multiple. */
    _normalise() {
      const mode = this._mode();
      if (mode === 'multiple') {
        walk(this._roots, (node) => {
          if (node.selected && node.children.length) node.children.forEach((c) => { c.selected = true; });
        });
        this._states();
      } else {
        let found = false;
        walk(this._roots, (node) => {
          if (node.selected && !found) found = true;
          else node.selected = false;
        });
      }
    }

    /** Multiple: every parent's state from its children. */
    _states() {
      const of = (node) => {
        if (!node.children.length) {
          node.state = node.selected;
          return node.state;
        }
        const states = node.children.map(of);
        node.state = states.every((s) => s === true) ? true : states.every((s) => s === false) ? false : 'mixed';
        node.selected = node.state === true;
        return node.state;
      };
      this._roots.forEach(of);
    }

    _setValue(ids) {
      const mode = this._mode();
      const list = (Array.isArray(ids) ? ids : ids == null || ids === '' ? [] : [ids]).map(String);
      walk(this._roots, (node) => { node.selected = false; });
      if (mode === 'multiple') {
        list.forEach((id) => {
          const node = this._byId.get(id);
          if (!node) return;
          node.selected = true;
          walk(node.children, (n) => { n.selected = true; });
        });
        this._states();
      } else if (mode === 'single') {
        const node = this._byId.get(list[0]);
        if (node) node.selected = true;
      }
      this._paint();
    }

    _visible() {
      const out = [];
      const add = (nodes) => nodes.forEach((node) => {
        out.push(node);
        if (node.expanded) add(node.children);
      });
      add(this._roots);
      return out;
    }

    /** Draws every row again. Open, selected and focus state are then painted on. */
    _build() {
      if (!this._wired) return;
      const hadFocus = this.shadowRoot.activeElement != null;
      const multiple = this._mode() === 'multiple';
      let count = 0;

      const group = (nodes, level) => nodes.map((node, i) => {
        const li = document.createElement('li');
        li.className = 'item';
        li.setAttribute('part', 'item');
        li.setAttribute('role', 'treeitem');
        li.id = `${this._base}-item-${count}`;
        li.style.setProperty('--_depth', String(level - 1));
        li.setAttribute('aria-level', String(level));
        li.setAttribute('aria-posinset', String(i + 1));
        li.setAttribute('aria-setsize', String(nodes.length));
        li.setAttribute('aria-labelledby', `${this._base}-label-${count}`);

        const row = document.createElement('div');
        row.className = 'row';
        row.setAttribute('part', 'row');

        const toggle = document.createElement('span');
        toggle.className = 'toggle';
        toggle.setAttribute('part', 'toggle');
        toggle.setAttribute('aria-hidden', 'true');
        if (canOpen(node)) toggle.innerHTML = CHEVRON + SPINNER;
        row.append(toggle);

        if (multiple) {
          const box = document.createElement('span');
          box.className = 'box';
          box.setAttribute('part', 'checkbox');
          box.setAttribute('aria-hidden', 'true');
          box.innerHTML = BOX;
          row.append(box);
        }
        if (node.icon) {
          const icon = document.createElement('span');
          icon.className = 'icon';
          icon.setAttribute('part', 'icon');
          icon.setAttribute('aria-hidden', 'true');
          row.append(icon);
        }
        const label = document.createElement('span');
        label.className = 'label';
        label.setAttribute('part', 'label');
        label.id = `${this._base}-label-${count}`;
        label.textContent = node.label;
        row.append(label);
        li.append(row);
        count += 1;

        if (node.children.length) {
          const ul = document.createElement('ul');
          ul.className = 'group';
          ul.setAttribute('part', 'group');
          ul.setAttribute('role', 'group');
          ul.append(...group(node.children, level + 1));
          li.append(ul);
        }
        node.el = li;
        this._nodeOf.set(li, node);
        return li;
      });

      this._tree.replaceChildren(...group(this._roots, 1));
      this._tree.setAttribute('aria-label', this.getAttribute('label') || texts.label);
      this._paint();
      if (hadFocus) this._focus(this._byId.get(this._activeId));
    }

    /** Writes open, selected, disabled and tab stop state onto the rows, and the form value. */
    _paint() {
      if (!this._wired) return;
      const mode = this._mode();
      const off = this._off;
      if (mode === 'multiple') {
        this._states();
        this._tree.setAttribute('aria-multiselectable', 'true');
      } else {
        this._tree.removeAttribute('aria-multiselectable');
      }
      if (off) this._tree.setAttribute('aria-disabled', 'true');
      else this._tree.removeAttribute('aria-disabled');

      const visible = this._visible();
      let active = this._byId.get(this._activeId);
      if (!active || !visible.includes(active)) {
        active = (mode === 'single' && visible.find((n) => n.selected)) || visible[0] || null;
        this._activeId = active ? active.id : null;
      }

      walk(this._roots, (node) => {
        const li = node.el;
        if (!li) return;
        if (canOpen(node)) li.setAttribute('aria-expanded', node.expanded ? 'true' : 'false');
        else li.removeAttribute('aria-expanded');
        const groupEl = li.querySelector(':scope > .group');
        if (groupEl) groupEl.hidden = !node.expanded;

        if (mode === 'multiple') {
          li.removeAttribute('aria-selected');
          li.setAttribute('aria-checked', String(node.state));
        } else {
          li.removeAttribute('aria-checked');
          if (mode === 'single') li.setAttribute('aria-selected', node.selected ? 'true' : 'false');
          else li.removeAttribute('aria-selected');
        }
        if (node.disabled) li.setAttribute('aria-disabled', 'true');
        else li.removeAttribute('aria-disabled');

        if (node.loading) li.setAttribute('aria-busy', 'true');
        else li.removeAttribute('aria-busy');
        const label = li.querySelector(':scope > .row > .label');
        const busy = label.querySelector('.sr');
        if (node.loading && !busy) {
          const sr = document.createElement('span');
          sr.className = 'sr';
          sr.textContent = `, ${texts.loading}`;
          label.append(sr);
        } else if (!node.loading && busy) {
          busy.remove();
        }

        const icon = li.querySelector(':scope > .row > .icon');
        if (icon) {
          const name = node.icon === 'folder' && node.expanded ? 'folder-open' : node.icon;
          if (icon.dataset.icon !== name) {
            icon.dataset.icon = name;
            icon.innerHTML = ICONS[name];
          }
        }
        li.tabIndex = !off && node === active ? 0 : -1;
        if (off) li.removeAttribute('tabindex');
      });
      this._syncForm();
    }

    _syncForm() {
      if (!this._internals) return;
      const name = this.getAttribute('name');
      const ids = this.value;
      if (!name || this._off || !ids.length) {
        this._internals.setFormValue(null);
        return;
      }
      const data = new FormData();
      ids.forEach((id) => data.append(name, id));
      this._internals.setFormValue(data);
    }

    _focus(node) {
      if (!node || !node.el || this._off) return;
      const before = this._byId.get(this._activeId);
      if (before && before.el) before.el.tabIndex = -1;
      this._activeId = node.id;
      node.el.tabIndex = 0;
      node.el.focus({ preventScroll: true });
      const row = node.el.firstElementChild;
      if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    _fire(name, detail, cancelable) {
      return this.dispatchEvent(new CustomEvent(name, {
        bubbles: true,
        composed: true,
        cancelable: cancelable === true,
        detail,
      }));
    }

    _setExpanded(node, on) {
      if (!node || !canOpen(node) || node.expanded === on) return false;
      if (on) {
        const allowed = this._fire('tree-expand', { id: node.id, label: node.label, lazy: node.lazy }, true);
        if (!allowed) return false;
        // The handler may have filled the node already (setChildren).
        node = this._byId.get(node.id) || node;
        if (node.lazy) this._fetch(node);
        else if (!node.children.length) return false;
      } else if (node.loading) {
        node.loading = false;
      }
      node.expanded = on;
      const focused = this.shadowRoot.activeElement;
      const inside = !on && focused && focused !== node.el && node.el && node.el.contains(focused);
      if (inside) this._activeId = node.id;
      this._paint();
      if (inside) this._focus(node);
      this._fire('tree-toggle', { id: node.id, label: node.label, expanded: on });
      return true;
    }

    /** A lazy node was opened: show the spinner and ask the hook, if there is one. */
    _fetch(node) {
      node.loading = true;
      if (typeof this.loadChildren !== 'function') return;
      const id = node.id;
      const info = { id, label: node.label };
      Promise.resolve().then(() => this.loadChildren(info)).then((children) => {
        const now = this._byId.get(id);
        if (!now || !now.loading) return; // closed or replaced meanwhile
        this.setChildren(id, Array.isArray(children) ? children : []);
      }, (err) => {
        console.warn(`${TAG_NAME}: loadChildren failed for "${id}"`, err);
        const now = this._byId.get(id);
        if (!now || !now.loading) return;
        now.loading = false;
        now.expanded = false;
        this._paint();
        this._fire('tree-toggle', { id, label: now.label, expanded: false });
      });
    }

    /** Enter, Space or a click on a row. */
    _activate(node) {
      if (this._off) return;
      const mode = this._mode();
      if (mode === 'none') {
        this._setExpanded(node, !node.expanded);
        return;
      }
      if (node.disabled) return;
      if (mode === 'single') {
        if (node.selected) return;
        walk(this._roots, (n) => { n.selected = false; });
        node.selected = true;
        this._paint();
        this._fire('tree-select', { id: node.id, label: node.label, selected: true, value: this.value });
        return;
      }
      // Multiple: a parent ticks every enabled leaf under it, or clears them when all are ticked.
      const leaves = [];
      const collect = (n) => {
        if (n.disabled) return;
        if (n.children.length) n.children.forEach(collect);
        else leaves.push(n);
      };
      collect(node);
      if (!leaves.length) return;
      const on = !leaves.every((n) => n.selected);
      leaves.forEach((n) => { n.selected = on; });
      this._paint();
      this._fire('tree-select', { id: node.id, label: node.label, selected: on, value: this.value });
    }

    _nodeAt(target) {
      const row = target && target.closest ? target.closest('.row') : null;
      return row ? this._nodeOf.get(row.parentElement) : null;
    }

    _onClick(e) {
      const node = this._nodeAt(e.target);
      if (!node || this._off) return;
      this._focus(node);
      if (e.target.closest('.toggle') && canOpen(node)) this._setExpanded(node, !node.expanded);
      else this._activate(node);
    }

    /** With a selection mode a click selects, so a double click opens and closes. */
    _onDblClick(e) {
      const node = this._nodeAt(e.target);
      if (!node || this._off || this._mode() !== 'single' || e.target.closest('.toggle')) return;
      this._setExpanded(node, !node.expanded);
    }

    _onFocusIn(e) {
      const node = this._nodeOf.get(e.target);
      if (!node || node.id === this._activeId) return;
      const before = this._byId.get(this._activeId);
      if (before && before.el) before.el.tabIndex = -1;
      this._activeId = node.id;
      node.el.tabIndex = 0;
    }

    _onKeydown(e) {
      const node = this._nodeOf.get(e.target);
      if (!node || this._off || e.altKey || e.ctrlKey || e.metaKey) return;
      const visible = this._visible();
      const at = visible.indexOf(node);
      const rtl = getComputedStyle(this).direction === 'rtl';
      const key = rtl && e.key === 'ArrowLeft' ? 'ArrowRight' : rtl && e.key === 'ArrowRight' ? 'ArrowLeft' : e.key;

      if (e.key.length !== 1) this._typed = ''; // a move ends what was typed
      switch (key) {
        case 'ArrowDown': this._focus(visible[at + 1]); break;
        case 'ArrowUp': this._focus(visible[at - 1]); break;
        case 'Home': this._focus(visible[0]); break;
        case 'End': this._focus(visible[visible.length - 1]); break;
        case 'ArrowRight':
          if (!canOpen(node)) break;
          if (!node.expanded) this._setExpanded(node, true);
          else this._focus(node.children[0]);
          break;
        case 'ArrowLeft':
          if (canOpen(node) && node.expanded) this._setExpanded(node, false);
          else this._focus(node.parent);
          break;
        case 'Enter':
        case ' ':
          this._activate(node);
          break;
        case '*':
          (node.parent ? node.parent.children : this._roots).forEach((n) => this._setExpanded(n, true));
          break;
        default:
          if (e.key.length !== 1) return;
          this._typeAhead(e.key, visible, at);
      }
      e.preventDefault();
    }

    /** Jumps to the next visible row whose label starts with what was typed. */
    _typeAhead(char, visible, at) {
      const now = Date.now();
      this._typed = now - this._typedAt > 600 ? char : this._typed + char;
      this._typedAt = now;
      const needle = this._typed.toLowerCase();
      // One letter looks from the next row on; more letters may stay on this row.
      const from = needle.length === 1 ? at + 1 : at;
      for (let i = 0; i < visible.length; i += 1) {
        const node = visible[(from + i) % visible.length];
        if (node.label.toLowerCase().startsWith(needle)) {
          this._focus(node);
          return;
        }
      }
    }
  }

  KakaoTreeView.TEXTS = TEXTS; // the built-in words, read-only

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }

  window.KakaoTreeView = KakaoTreeView;
  customElements.define(TAG_NAME, KakaoTreeView);
})();
