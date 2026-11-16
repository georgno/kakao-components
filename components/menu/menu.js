/**
 * <kakao-menu>
 * ============================================================================
 * A menu of actions that opens from any trigger, or as a context menu on
 * right-click. Groups with headings, separators, icons, shortcuts, a danger
 * tone, checkbox and radio items, link items and submenus. The WAI-ARIA menu
 * pattern (menu / menuitem / menuitemcheckbox / menuitemradio, arrow keys,
 * type-ahead). Vanilla JS, Shadow DOM, no deps.
 *
 * For a simple pick-one dropdown on a button, <kakao-button list-data> is
 * enough. This element is for everything beyond that.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="menu.js"><\/script>
 *
 *   <!-- opened from a trigger -->
 *   <kakao-button id="more" label="Actions"></kakao-button>
 *   <kakao-menu for="more" list-data='[
 *     { "label": "Rename", "value": "rename", "icon": "edit", "shortcut": "F2" },
 *     { "label": "Duplicate", "value": "duplicate", "icon": "copy", "shortcut": "Mod+D" },
 *     "-",
 *     { "label": "Delete", "value": "delete", "icon": "trash", "tone": "danger" }
 *   ]'></kakao-menu>
 *
 *   <!-- a context menu: right-click, long-press, Shift+F10 or the Menu key -->
 *   <div id="file" tabindex="0">Report.pdf</div>
 *   <kakao-menu context-for="file" list-data='["Open", "Download"]'></kakao-menu>
 *
 *   <!-- from script -->
 *   menu.open(anchorElement);
 *   menu.openAt(x, y);
 *
 * ----------------------------------------------------------------------------
 * ITEMS (list-data: a JSON array, or the `items` property)
 * ----------------------------------------------------------------------------
 *  "Label"                       an item; its value is the label
 *  "-"                           a separator (also { "separator": true })
 *  { "group": "Heading", "items": [ … ] }
 *                                a group of items under a heading (the heading
 *                                can be left out). Radio items in one group
 *                                belong together.
 *  { label, value, … }           an item:
 *    label      The text.
 *    value      Reported in menu-select. Default: the label.
 *    icon       A named glyph: copy, cut, paste, edit, trash, download, upload,
 *               share, link, external, settings, user, folder, file, plus,
 *               star, archive, eye, refresh, logout, info. Leave out for none.
 *    shortcut   A hint such as "Mod+D", shown at the end of the row. Drawn by
 *               <kakao-kbd> when that component is loaded, else as plain
 *               text. The menu shows the hint only: it does not bind the key.
 *    disabled   true: shown, but cannot be picked and is skipped by the keys.
 *    tone       "danger" for a destructive action.
 *    type       "checkbox" or "radio": the item carries a check mark.
 *    checked    The state of a checkbox or radio item.
 *    name       Radio items with the same name in one menu belong together
 *               (default: the radio items of the same group).
 *    href       Makes the item a link (with optional `target`).
 *    children   An array of items: the item opens a submenu.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  list-data     The items (see above).
 *  for           Id of the trigger. A click opens and closes the menu; Down and
 *                Up on the trigger open it on the first or last item. The
 *                trigger gets aria-haspopup="menu" and aria-expanded (on the
 *                button or link inside it, when the trigger is not one itself).
 *  context-for   Id of an element whose context menu this is: right-click,
 *                long-press on touch, Shift+F10 or the Menu key.
 *  placement     bottom-start (default) · bottom-end · top-start · top-end.
 *                Where the menu sits against its trigger. It flips to the
 *                other side when there is no room.
 *  label         Accessible name of the menu. Default: the trigger's text,
 *                else "Menu" (KakaoMenu.texts.menu).
 *  keep-open     Checkbox and radio items do not close the menu.
 *  inline        The menu is shown in place, always open (for a settings
 *                column, a preview). Submenus still open beside it.
 *  disabled      The menu does not open.
 *  open          Reflects the open state; setting it opens at the trigger.
 *
 * ----------------------------------------------------------------------------
 * KEYBOARD
 * ----------------------------------------------------------------------------
 *  Down / Up     next / previous item (wraps)      Home / End   first / last
 *  a letter      the next item starting with it    Enter, Space pick
 *  Right         open a submenu                    Left         close it
 *  Escape        close (a submenu first), focus returns to where it was
 *  Tab           close and move on
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  menu-select   an item was picked: { value, item, checked }. `item` is the
 *                entry from list-data, `checked` the new state of a checkbox or
 *                radio item. Cancelable: preventDefault() keeps the menu open,
 *                leaves the check as it was and stops a link.
 *  menu-open     the menu opened
 *  menu-close    the menu closed
 *
 * ----------------------------------------------------------------------------
 * METHODS / PROPERTIES
 * ----------------------------------------------------------------------------
 *  open(anchorEl?)   open against an element (default: the trigger)
 *  openAt(x, y)      open at a point in the viewport
 *  close()           close
 *  toggle(anchorEl?) open or close
 *  items             the items as an array (get / set)
 *  isOpen            true while open
 *  KakaoMenu.texts   { menu: "Menu" }, the default accessible name
 *
 * ----------------------------------------------------------------------------
 * SMALL SCREENS
 * ----------------------------------------------------------------------------
 *  The menu stays anchored (no bottom sheet) and is kept inside the viewport.
 *  A submenu with no room on either side opens under its item, over the
 *  parent menu. Rows are taller on touch devices.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES
 * ----------------------------------------------------------------------------
 *  --kakao-menu-*: defaults live in the settings block of this file; change
 *  them on construction.html.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-menu';
  if (customElements.get(TAG_NAME)) return;

  const MARGIN = 8; // kept free between the menu and the viewport edge
  const HOVER_DELAY = 140; // before a submenu opens or closes under the pointer
  const LONG_PRESS = 500;
  const TYPE_RESET = 600;

  const svg = (body) => `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

  const ICONS = {
    copy: svg('<rect x="5.5" y="5.5" width="8" height="8" rx="1.4"/><path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"/>'),
    cut: svg('<circle cx="4.5" cy="11.5" r="2"/><circle cx="11.5" cy="11.5" r="2"/><path d="M6 10 12.5 2.5"/><path d="M10 10 3.5 2.5"/>'),
    paste: svg('<rect x="3.5" y="3.5" width="9" height="10.5" rx="1.2"/><path d="M6 3.5v-1a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1z"/>'),
    edit: svg('<path d="M10.8 2.7a1.4 1.4 0 0 1 2 2L5.5 12l-3 .8.8-3z"/><path d="m9.5 4 2.3 2.3"/>'),
    trash: svg('<path d="M2.5 4.5h11"/><path d="M6 4.5v-2h4v2"/><path d="m4 4.5.6 8.6a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.6"/><path d="M6.7 7.2v4M9.3 7.2v4"/>'),
    download: svg('<path d="M8 2.5v8"/><path d="m4.8 7.5 3.2 3.2 3.2-3.2"/><path d="M2.5 13.5h11"/>'),
    upload: svg('<path d="M8 10.5v-8"/><path d="M4.8 5.7 8 2.5l3.2 3.2"/><path d="M2.5 13.5h11"/>'),
    share: svg('<circle cx="4" cy="8" r="1.8"/><circle cx="11.8" cy="3.8" r="1.8"/><circle cx="11.8" cy="12.2" r="1.8"/><path d="m5.6 7.1 4.6-2.4M5.6 8.9l4.6 2.4"/>'),
    link: svg('<path d="M6.8 9.2a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-.8.8"/><path d="M9.2 6.8a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l.8-.8"/>'),
    external: svg('<path d="M9 2.5h4.5V7"/><path d="M13.5 2.5 7.5 8.5"/><path d="M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3"/>'),
    settings: svg('<path d="M2.5 4.5h6M11.5 4.5h2M2.5 11.5h2M7.5 11.5h6"/><circle cx="10" cy="4.5" r="1.5"/><circle cx="6" cy="11.5" r="1.5"/>'),
    user: svg('<circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.6-2.4 2.6-3.7 5-3.7s4.4 1.3 5 3.7"/>'),
    folder: svg('<path d="M2 4.5a1 1 0 0 1 1-1h3.2l1.5 1.6H13a1 1 0 0 1 1 1v5.9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>'),
    file: svg('<path d="M4 2.5h5l3 3v8H4z"/><path d="M9 2.5v3h3"/>'),
    plus: svg('<path d="M8 3v10M3 8h10"/>'),
    star: svg('<path d="m8 2.3 1.7 3.6 3.9.5-2.9 2.7.8 3.9L8 11.1 4.5 13l.8-3.9-2.9-2.7 3.9-.5z"/>'),
    archive: svg('<rect x="2" y="3" width="12" height="3" rx=".8"/><path d="M3 6v6.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6"/><path d="M6.5 9h3"/>'),
    eye: svg('<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>'),
    refresh: svg('<path d="M13 8a5 5 0 1 1-1.5-3.6"/><path d="M13 2.5v3h-3"/>'),
    logout: svg('<path d="M6.5 2.5h-3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3"/><path d="M10.5 5 13.5 8l-3 3"/><path d="M13.5 8h-7"/>'),
    info: svg('<circle cx="8" cy="8" r="5.5"/><path d="M8 7.5v3.2"/><path d="M8 5.2v.1"/>'),
  };

  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m6 3.5 4.5 4.5L6 12.5"/></svg>';

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-menu- (written by construction.html, edit there) */
        --_bg: var(--kakao-menu-bg, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-menu-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-menu-muted, var(--kakao-color-muted, #62626c));
        --_hover-bg: var(--kakao-menu-hover-bg, var(--kakao-color-subtle, #f0f0f1));
        --_line: var(--kakao-menu-line, var(--kakao-color-line, #e5e7eb));
        --_icon: var(--kakao-menu-icon, var(--kakao-color-muted, #62626c));
        --_check: var(--kakao-menu-check, var(--kakao-color-primary, #4f46e5));
        --_danger: var(--kakao-menu-danger, var(--kakao-color-danger, #dc2626));
        --_focus: var(--kakao-menu-focus, var(--kakao-color-focus, #2563eb));
        --_font: var(--kakao-menu-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_checked-weight: var(--kakao-menu-checked-weight, 600);
        --_heading-size: var(--kakao-menu-heading-size, 0.78rem);
        --_heading-weight: var(--kakao-menu-heading-weight, 600);
        --_shortcut-size: var(--kakao-menu-shortcut-size, 0.8rem);
        --_radius: var(--kakao-menu-radius, var(--kakao-radius-md, 10px));
        --_padding: var(--kakao-menu-padding, 4px);
        --_offset: var(--kakao-menu-offset, 6px);
        --_sub-offset: var(--kakao-menu-sub-offset, 4px);
        --_min-width: var(--kakao-menu-min-width, 11rem);
        --_max-width: var(--kakao-menu-max-width, 20rem);
        --_max-height: var(--kakao-menu-max-height, 24rem);
        --_shadow: var(--kakao-menu-shadow, 0 8px 24px rgb(0 0 0 / .08), 0 0 0 1px color-mix(in srgb, var(--kakao-color-text, #18181b) 10%, transparent));
        --_z: var(--kakao-menu-z, 70);
        --_item-height: var(--kakao-menu-item-height, 36px);
        --_touch-item-height: var(--kakao-menu-touch-item-height, 44px);
        --_item-radius: var(--kakao-menu-item-radius, var(--kakao-radius-sm, 6px));
        --_item-padding-x: var(--kakao-menu-item-padding-x, 0.6rem);
        --_gap: var(--kakao-menu-gap, 0.55rem);
        --_shortcut-gap: var(--kakao-menu-shortcut-gap, 1.5rem);
        --_icon-size: var(--kakao-menu-icon-size, 1.1em);
        --_separator-margin: var(--kakao-menu-separator-margin, 4px);
        --_focus-width: var(--kakao-menu-focus-width, 2px);
        --_disabled-opacity: var(--kakao-menu-disabled-opacity, 0.55);
        --_duration: var(--kakao-menu-duration, 150ms);
        --_ease: var(--kakao-menu-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        display: contents;
      }
      :host([hidden]) { display: none; }
      :host([inline]) { display: inline-block; vertical-align: top; max-width: 100%; }

      /* ---- Panel: the select's dropdown surface (overlay, elevation level 3) ---- */
      .panel {
        position: fixed;
        inset: auto;
        z-index: var(--_z);
        box-sizing: border-box;
        display: none;
        width: max-content;
        min-width: var(--_min-width);
        max-width: min(var(--_max-width), calc(100vw - ${MARGIN * 2}px));
        max-height: min(var(--_max-height), var(--_room, 100vh));
        margin: 0;
        padding: var(--_padding);
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        background: var(--_bg);
        color: var(--_text);
        font: var(--_font);
        text-align: left;
        border: 0;
        border-radius: var(--_radius);
        box-shadow: var(--_shadow);
        outline: none;
      }
      .panel.is-open { display: block; animation: kakao-menu-in var(--_duration) var(--_ease); }
      .panel[data-up] { --_from: 4px; }
      @keyframes kakao-menu-in {
        from { opacity: 0; transform: translateY(var(--_from, -4px)); }
      }
      :host([inline]) .panel[data-depth="0"] {
        position: static;
        display: block;
        max-width: 100%;
        max-height: none;
        animation: none;
      }

      .item {
        display: flex;
        align-items: center;
        gap: var(--_gap);
        box-sizing: border-box;
        min-height: var(--_item-height);
        padding: 0.4rem var(--_item-padding-x);
        border-radius: var(--_item-radius);
        color: inherit;
        line-height: 1.3;
        text-decoration: none;
        cursor: pointer;
        outline: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: background-color var(--_duration) var(--_ease);
      }
      .item:focus,
      .item[aria-expanded="true"] { background: var(--_hover-bg); }
      .item:focus-visible { outline: var(--_focus-width) solid var(--_focus); outline-offset: calc(var(--_focus-width) * -1); }
      .item[aria-disabled="true"] { opacity: var(--_disabled-opacity); cursor: not-allowed; }
      .item[data-tone="danger"] { color: var(--_danger); }
      .item[aria-checked="true"] { font-weight: var(--_checked-weight); }

      .lbl { flex: 1; min-width: 0; overflow-wrap: anywhere; }

      /* Leading column: the check mark or the icon. Only in a menu that has one. */
      .lead {
        flex: none;
        display: none;
        width: var(--_icon-size);
        height: var(--_icon-size);
        color: var(--_icon);
      }
      .panel.has-lead .lead { display: inline-flex; }
      .lead svg { width: 100%; height: 100%; }
      .item[data-tone="danger"] .lead { color: inherit; }
      .lead.check { color: var(--_check); visibility: hidden; }
      .lead.check svg { fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
      .item[aria-checked="true"] .lead.check { visibility: visible; }

      .shortcut {
        flex: none;
        margin-left: calc(var(--_shortcut-gap) - var(--_gap));
        color: var(--_muted);
        font-size: var(--_shortcut-size);
        font-weight: 400;
        white-space: nowrap;
      }
      .arrow {
        flex: none;
        display: inline-flex;
        width: 0.9em;
        height: 0.9em;
        margin-left: calc(var(--_shortcut-gap) - var(--_gap));
        margin-right: -0.15em;
        color: var(--_muted);
      }
      .arrow svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }

      .sep {
        height: 1px;
        margin: var(--_separator-margin) calc(var(--_padding) * -1);
        background: var(--_line);
      }
      .heading {
        padding: 0.55rem var(--_item-padding-x) 0.25rem;
        font-size: var(--_heading-size);
        font-weight: var(--_heading-weight);
        color: var(--_muted);
      }

      @media (pointer: coarse) {
        .item { min-height: var(--_touch-item-height); }
      }
      @media (prefers-reduced-motion: reduce) {
        .panel.is-open { animation: none; }
        .item { transition: none; }
      }
      @media (forced-colors: active) {
        .panel { border: 1px solid CanvasText; }
        .item:focus, .item[aria-expanded="true"] { outline: 2px solid Highlight; outline-offset: -2px; }
        .sep { background: CanvasText; }
      }
    </style>
    <div class="panels"></div>
  `;

  let seq = 0;

  const deepActive = () => {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
    return el && el !== document.body ? el : null;
  };

  /** The element of a trigger that takes focus and ARIA: itself, or the button or link inside it. */
  const focusTarget = (el) => {
    if (!el) return null;
    if (el.matches('button, a[href], input, select, textarea, [tabindex]')) return el;
    return el.querySelector('button, a[href], [tabindex]:not([tabindex="-1"])') || el;
  };

  const isSeparator = (raw) => raw === '-' || raw === '---'
    || (raw && typeof raw === 'object' && (raw.separator === true || raw.type === 'separator'));

  function normalise(list, inGroup) {
    const out = [];
    (Array.isArray(list) ? list : []).forEach((raw) => {
      if (isSeparator(raw)) { out.push({ kind: 'sep' }); return; }
      if (typeof raw === 'string' || typeof raw === 'number') {
        out.push(makeItem({ label: String(raw) }, { label: String(raw), value: String(raw) }));
        return;
      }
      if (!raw || typeof raw !== 'object') return;
      if (Array.isArray(raw.items)) {
        if (inGroup) { normalise(raw.items, true).forEach((n) => out.push(n)); return; }
        out.push({ kind: 'group', label: String(raw.group || raw.label || ''), items: normalise(raw.items, true) });
        return;
      }
      out.push(makeItem(raw, raw));
    });
    return out;
  }

  function makeItem(raw, source) {
    const label = String(raw.label != null ? raw.label : (raw.value != null ? raw.value : ''));
    const children = Array.isArray(raw.children) && raw.children.length ? normalise(raw.children, false) : null;
    const check = !children && (raw.type === 'checkbox' || raw.type === 'radio') ? raw.type : '';
    const href = !children && !check && typeof raw.href === 'string' && !/^\s*javascript:/i.test(raw.href) ? raw.href : '';
    return {
      kind: 'item',
      label,
      value: raw.value != null ? raw.value : label,
      icon: Object.prototype.hasOwnProperty.call(ICONS, raw.icon) ? raw.icon : '',
      shortcut: raw.shortcut != null ? String(raw.shortcut) : '',
      disabled: raw.disabled === true,
      danger: raw.tone === 'danger' || raw.danger === true,
      check,
      checked: check ? raw.checked === true : false,
      name: raw.name != null ? String(raw.name) : '',
      href,
      target: href && raw.target ? String(raw.target) : '',
      children,
      source,
    };
  }

  class KakaoMenu extends HTMLElement {
    static get observedAttributes() {
      return ['list-data', 'for', 'context-for', 'label', 'inline', 'open', 'disabled'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).appendChild(TEMPLATE.content.cloneNode(true));
      this._panels = this.shadowRoot.querySelector('.panels');
      this._items = null; // set through the property; wins over list-data until that changes
      this._nodes = [];
      this._meta = new WeakMap(); // item element → { node, panel, sub, key } · panel → { depth, parentItem }
      this._root = null;
      this._stack = []; // open panels, root first
      this._isOpen = false;
      this._anchor = null;
      this._returnTo = null;
      this._trigger = null; // the element that currently carries our ARIA
      this._hoverEl = null;
      this._hoverTimer = 0;
      this._pressTimer = 0;
      this._handledAt = 0; // when a key or long-press last opened the context menu
      this._typed = '';
      this._typedAt = 0;
      this._raf = 0;
      this._hasPopover = typeof HTMLElement.prototype.showPopover === 'function';

      this._onDocClick = this._onDocClick.bind(this);
      this._onDocKeydown = this._onDocKeydown.bind(this);
      this._onDocContext = this._onDocContext.bind(this);
      this._onDocPointerDown = this._onDocPointerDown.bind(this);
      this._onDocPointerEnd = this._onDocPointerEnd.bind(this);
      this._onDocPointerMove = this._onDocPointerMove.bind(this);
      this._onViewport = this._onViewport.bind(this);
      this._onBlur = () => this.close(false);

      const root = this.shadowRoot;
      root.addEventListener('click', (e) => this._onClick(e));
      root.addEventListener('keydown', (e) => this._onKeydown(e));
      root.addEventListener('pointermove', (e) => this._onPointerMove(e));
      root.addEventListener('contextmenu', (e) => e.preventDefault());
      root.addEventListener('focusin', (e) => this._onFocusIn(e));
      root.addEventListener('focusout', (e) => {
        const to = e.relatedTarget;
        if (to && root.contains(to)) return;
        if (this._isOpen) this.close(false);
        else if (this.hasAttribute('inline')) this._closeFrom(1);
      });
    }

    connectedCallback() {
      // `items` set before the element was defined is a plain property: take it over.
      if (Object.prototype.hasOwnProperty.call(this, 'items')) {
        const value = this.items;
        delete this.items;
        this._items = Array.isArray(value) ? value : null;
      }
      this._connected = true;
      document.addEventListener('click', this._onDocClick);
      document.addEventListener('keydown', this._onDocKeydown);
      document.addEventListener('contextmenu', this._onDocContext);
      document.addEventListener('pointerdown', this._onDocPointerDown, true);
      document.addEventListener('pointerup', this._onDocPointerEnd, true);
      document.addEventListener('pointercancel', this._onDocPointerEnd, true);
      document.addEventListener('pointermove', this._onDocPointerMove, true);
      this._render();
      this._syncTrigger();
      // The trigger may come later in the page than the menu.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._syncTrigger(), { once: true });
      }
      // Shortcuts become keycaps once kakao-kbd is there.
      if (!customElements.get('kakao-kbd')) {
        customElements.whenDefined('kakao-kbd').then(() => {
          if (this._connected && this.shadowRoot.querySelector('.shortcut')) this._render();
        });
      }
      if (this.hasAttribute('open') && !this.hasAttribute('inline')) this.open();
    }

    disconnectedCallback() {
      this._connected = false;
      this.close(false);
      clearTimeout(this._pressTimer);
      document.removeEventListener('click', this._onDocClick);
      document.removeEventListener('keydown', this._onDocKeydown);
      document.removeEventListener('contextmenu', this._onDocContext);
      document.removeEventListener('pointerdown', this._onDocPointerDown, true);
      document.removeEventListener('pointerup', this._onDocPointerEnd, true);
      document.removeEventListener('pointercancel', this._onDocPointerEnd, true);
      document.removeEventListener('pointermove', this._onDocPointerMove, true);
      this._clearTrigger();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this._connected || oldValue === newValue) return;
      if (name === 'list-data') { this._items = null; this._render(); return; }
      if (name === 'inline') { this._render(); return; }
      if (name === 'for') { this._syncTrigger(); return; }
      if (name === 'label') { this._syncLabel(); return; }
      if (name === 'disabled') { if (newValue !== null) this.close(); return; }
      if (name === 'open') {
        if (this.hasAttribute('inline')) return;
        if (newValue !== null && !this._isOpen) this.open();
        else if (newValue === null && this._isOpen) this.close();
      }
    }

    /* ------------------------------ Public ------------------------------ */

    get items() {
      if (this._items) return this._items;
      return this._parse();
    }

    set items(value) {
      this._items = Array.isArray(value) ? value : null;
      if (this._connected) this._render();
    }

    get isOpen() { return this._isOpen; }

    /** Opens against an element: the given one, else the trigger, else the context element. */
    open(anchorEl) {
      const el = anchorEl instanceof Element ? anchorEl
        : (this._byId('for') || this._byId('context-for') || this.parentElement);
      if (!el) return;
      this._show({ el }, 'none', el === this._byId('for') ? focusTarget(el) : null);
    }

    /** Opens at a point in the viewport (client coordinates). */
    openAt(x, y) {
      this._show({ point: true, x: Number(x) || 0, y: Number(y) || 0 }, 'none', null);
    }

    toggle(anchorEl) {
      if (this._isOpen) this.close();
      else this.open(anchorEl);
    }

    /** Closes the menu. Focus returns to where it was when it sat in the menu. */
    close(returnFocus) {
      if (!this._isOpen) return;
      const back = returnFocus === undefined ? this.shadowRoot.activeElement !== null : returnFocus === true;
      this._isOpen = false;
      this._closeFrom(0);
      clearTimeout(this._hoverTimer);
      cancelAnimationFrame(this._raf);
      this._hoverEl = null;
      window.removeEventListener('scroll', this._onViewport, true);
      window.removeEventListener('resize', this._onViewport);
      window.removeEventListener('blur', this._onBlur);
      this.removeAttribute('open');
      if (this._trigger) this._trigger.setAttribute('aria-expanded', 'false');
      const to = this._returnTo;
      this._returnTo = null;
      if (back && to && to.isConnected) to.focus({ preventScroll: true });
      this._fire('menu-close', {});
    }

    /* ------------------------------ Data ------------------------------ */

    _parse() {
      const raw = this.getAttribute('list-data');
      if (!raw) return [];
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) return data;
        console.warn('<kakao-menu>: list-data must be a JSON array.');
      } catch (err) {
        console.warn('<kakao-menu>: list-data is not valid JSON.', err);
      }
      return [];
    }

    _byId(attr) {
      const id = this.getAttribute(attr);
      if (!id) return null;
      const root = this.getRootNode();
      return (root && root.getElementById ? root.getElementById(id) : null) || document.getElementById(id);
    }

    /* ------------------------------ Render ------------------------------ */

    _render() {
      if (this._isOpen) this.close();
      this._nodes = normalise(this._items || this._parse(), false);
      this._panels.textContent = '';
      this._stack = [];
      this._root = this._buildPanel(this._nodes, 0, null);
      if (this.hasAttribute('inline')) {
        this._stack = [this._root];
        const first = this._enabled(this._root)[0];
        if (first) first.tabIndex = 0;
      }
      this._syncLabel();
    }

    _buildPanel(nodes, depth, parentItem) {
      const panel = document.createElement('div');
      panel.className = 'panel';
      panel.setAttribute('role', 'menu');
      panel.dataset.depth = String(depth);
      panel.tabIndex = -1;
      panel.id = `kakao-menu-${++seq}`;
      const popup = depth > 0 || !this.hasAttribute('inline');
      if (popup && this._hasPopover) panel.setAttribute('popover', 'manual');
      this._meta.set(panel, { depth, parentItem });
      this._panels.append(panel);
      if (parentItem) {
        panel.setAttribute('aria-labelledby', parentItem.id);
        parentItem.setAttribute('aria-controls', panel.id);
      }

      let lead = false;
      const add = (node, parent, key) => {
        if (node.kind === 'sep') {
          const sep = document.createElement('div');
          sep.className = 'sep';
          sep.setAttribute('role', 'separator');
          parent.append(sep);
          return;
        }
        if (node.kind === 'group') {
          const group = document.createElement('div');
          group.className = 'group';
          group.setAttribute('role', 'group');
          if (node.label) {
            const heading = document.createElement('div');
            heading.className = 'heading';
            heading.id = `kakao-menu-${++seq}`;
            heading.textContent = node.label;
            group.setAttribute('aria-labelledby', heading.id);
            group.append(heading);
          }
          const groupKey = `g${++seq}`;
          node.items.forEach((n) => add(n, group, groupKey));
          parent.append(group);
          return;
        }
        if (node.icon || node.check) lead = true;
        parent.append(this._buildItem(node, panel, key, depth));
      };
      nodes.forEach((n) => add(n, panel, 'top'));
      panel.classList.toggle('has-lead', lead);
      return panel;
    }

    _buildItem(node, panel, key, depth) {
      const link = node.href && !node.disabled;
      const el = document.createElement(link ? 'a' : 'div');
      el.className = 'item';
      el.id = `kakao-menu-${++seq}`;
      el.tabIndex = -1;
      el.setAttribute('role', node.check ? `menuitem${node.check}` : 'menuitem');
      if (link) {
        el.href = node.href;
        if (node.target) {
          el.target = node.target;
          if (node.target === '_blank') el.rel = 'noopener';
        }
      }
      if (node.check) el.setAttribute('aria-checked', String(node.checked));
      if (node.disabled) el.setAttribute('aria-disabled', 'true');
      if (node.danger) el.dataset.tone = 'danger';

      const leadEl = document.createElement('span');
      leadEl.className = node.check ? 'lead check' : 'lead';
      leadEl.setAttribute('aria-hidden', 'true');
      if (node.check) leadEl.innerHTML = CHECK;
      else if (node.icon) leadEl.innerHTML = ICONS[node.icon];
      const lbl = document.createElement('span');
      lbl.className = 'lbl';
      lbl.textContent = node.label;
      el.append(leadEl, lbl);

      if (node.shortcut) {
        const sc = document.createElement('span');
        sc.className = 'shortcut';
        if (customElements.get('kakao-kbd')) {
          const kbd = document.createElement('kakao-kbd');
          kbd.setAttribute('size', 'sm');
          kbd.setAttribute('keys', node.shortcut);
          sc.append(kbd);
        } else {
          sc.textContent = node.shortcut;
        }
        el.append(sc);
      }

      const meta = { node, panel, sub: null, key: node.name ? `n:${node.name}` : key };
      this._meta.set(el, meta);
      if (node.children) {
        el.setAttribute('aria-haspopup', 'menu');
        el.setAttribute('aria-expanded', 'false');
        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.innerHTML = ARROW;
        el.append(arrow);
        meta.sub = this._buildPanel(node.children, depth + 1, el);
      }
      return el;
    }

    _syncLabel() {
      if (!this._root) return;
      const trigger = this._byId('for');
      const text = this.getAttribute('label')
        || (trigger && (trigger.getAttribute('aria-label') || trigger.getAttribute('label') || trigger.textContent.trim()))
        || KakaoMenu.texts.menu;
      this._root.setAttribute('aria-label', text);
    }

    /* ------------------------------ Trigger ------------------------------ */

    _syncTrigger() {
      const el = focusTarget(this._byId('for'));
      if (el !== this._trigger) this._clearTrigger();
      this._trigger = el;
      if (el) {
        el.setAttribute('aria-haspopup', 'menu');
        el.setAttribute('aria-expanded', String(this._isOpen));
      }
      this._syncLabel();
    }

    _clearTrigger() {
      if (!this._trigger) return;
      this._trigger.removeAttribute('aria-haspopup');
      this._trigger.removeAttribute('aria-expanded');
      this._trigger = null;
    }

    _within(e, el) {
      return !!el && e.composedPath().includes(el);
    }

    _onDocClick(e) {
      const trigger = this._byId('for');
      if (!this._within(e, trigger) || e.defaultPrevented) return;
      // Pressing the trigger of an open menu closes it (the press may already
      // have, by taking focus): the click must not open it again.
      const wasOpen = this._pressedOpen && e.detail !== 0;
      this._pressedOpen = false;
      if (this._isOpen || wasOpen) { this.close(true); return; }
      // A click from the keyboard (Enter, Space) starts on the first item.
      this._show({ el: trigger }, e.detail === 0 ? 'first' : 'none', focusTarget(trigger));
    }

    _onDocKeydown(e) {
      if (this._isOpen || e.defaultPrevented) return;
      const trigger = this._byId('for');
      if (this._within(e, trigger) && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this._show({ el: trigger }, e.key === 'ArrowDown' ? 'first' : 'last', focusTarget(trigger));
        return;
      }
      const target = this._byId('context-for');
      if (this._within(e, target) && (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey))) {
        e.preventDefault();
        const focused = deepActive();
        const el = focused && target.contains(focused) ? focused : target;
        this._handledAt = Date.now();
        this._show({ el }, 'first', focused);
      }
    }

    _onDocContext(e) {
      const target = this._byId('context-for');
      if (!this._within(e, target) || this._within(e, this) || this.hasAttribute('disabled')) return;
      e.preventDefault();
      // The key or the long press already opened it.
      if (Date.now() - this._handledAt < 600) return;
      this._show({ point: true, x: e.clientX, y: e.clientY }, 'none', null);
    }

    _onDocPointerDown(e) {
      const inside = this._within(e, this);
      const onTrigger = this._within(e, this._byId('for'));
      this._pressedOpen = this._isOpen && onTrigger;
      if (this._isOpen && !inside && !onTrigger) this.close(false);
      if (!inside && this.hasAttribute('inline')) this._closeFrom(1);
      // Long press on touch (Safari on iOS sends no contextmenu event).
      clearTimeout(this._pressTimer);
      if (e.pointerType !== 'touch' || inside) return;
      const target = this._byId('context-for');
      if (!this._within(e, target)) return;
      const x = e.clientX;
      const y = e.clientY;
      this._press = { x, y };
      this._pressTimer = setTimeout(() => {
        this._press = null;
        this._handledAt = Date.now();
        this._show({ point: true, x, y }, 'none', null);
      }, LONG_PRESS);
    }

    _onDocPointerMove(e) {
      if (!this._press) return;
      if (Math.abs(e.clientX - this._press.x) > 10 || Math.abs(e.clientY - this._press.y) > 10) this._onDocPointerEnd();
    }

    _onDocPointerEnd() {
      clearTimeout(this._pressTimer);
      this._press = null;
    }

    /* --------------------------- Open and place --------------------------- */

    _show(anchor, focus, returnTo) {
      if (!this._connected || this.hasAttribute('disabled') || this.hasAttribute('inline')) return;
      if (!this._root || !this._root.querySelector('.item')) return;
      if (this._isOpen) this.close(false);
      this._returnTo = returnTo || deepActive();
      this._anchor = anchor;
      this._isOpen = true;
      this._showPanel(this._root);
      this._stack = [this._root];
      this._placeRoot();
      this.setAttribute('open', '');
      this._syncTrigger();
      window.addEventListener('scroll', this._onViewport, true);
      window.addEventListener('resize', this._onViewport);
      window.addEventListener('blur', this._onBlur);
      const items = this._enabled(this._root);
      if (focus === 'first' && items.length) this._focusItem(items[0]);
      else if (focus === 'last' && items.length) this._focusItem(items[items.length - 1]);
      else this._root.focus({ preventScroll: true });
      this._fire('menu-open', {});
    }

    _showPanel(panel) {
      panel.removeAttribute('data-up');
      panel.style.removeProperty('--_room');
      panel.scrollTop = 0;
      if (panel.hasAttribute('popover')) {
        try { panel.showPopover(); } catch (err) { /* already open */ }
      }
      panel.classList.add('is-open');
    }

    _hidePanel(panel) {
      panel.classList.remove('is-open');
      if (panel.hasAttribute('popover')) {
        try { panel.hidePopover(); } catch (err) { /* not open */ }
      }
    }

    _lengthVar(name, fallback) {
      const n = parseFloat(getComputedStyle(this).getPropertyValue(name));
      return Number.isFinite(n) ? n : fallback;
    }

    /**
     * Against a trigger: under it (or above, per `placement`), flipped when
     * there is no room on that side and more on the other; lined up with the
     * trigger's start edge, else its end edge, else kept inside the viewport.
     * At a point: its top left corner on the point, flipped to the other side
     * of the point when it would leave the viewport.
     */
    _placeRoot() {
      const panel = this._root;
      const a = this._anchor;
      if (!a) return;
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      panel.style.removeProperty('--_room');
      panel.style.left = '0px';
      panel.style.top = '0px';
      const w = panel.offsetWidth;
      const natural = panel.offsetHeight;
      let x;
      let y;
      if (a.point) {
        panel.style.setProperty('--_room', `${Math.max(120, vh - MARGIN * 2)}px`);
        const h = panel.offsetHeight;
        x = a.x;
        y = a.y;
        if (x + w > vw - MARGIN) x = x - w >= MARGIN ? x - w : Math.max(MARGIN, vw - MARGIN - w);
        if (y + h > vh - MARGIN) y = y - h >= MARGIN ? y - h : Math.max(MARGIN, vh - MARGIN - h);
      } else {
        if (!a.el.isConnected) { this.close(false); return; }
        const r = a.el.getBoundingClientRect();
        const offset = this._lengthVar('--_offset', 6);
        const placement = this.getAttribute('placement') || 'bottom-start';
        const below = vh - r.bottom - offset - MARGIN;
        const above = r.top - offset - MARGIN;
        const up = placement.startsWith('top')
          ? !(above < natural && below > above)
          : (below < natural && above > below);
        panel.toggleAttribute('data-up', up);
        panel.style.setProperty('--_room', `${Math.max(120, Math.floor(up ? above : below))}px`);
        const h = panel.offsetHeight;
        y = Math.max(MARGIN, up ? r.top - offset - h : r.bottom + offset);
        if (placement.endsWith('end')) {
          x = r.right - w;
          if (x < MARGIN) x = r.left + w <= vw - MARGIN ? r.left : MARGIN;
        } else {
          x = r.left;
          if (x + w > vw - MARGIN) x = r.right - w >= MARGIN ? r.right - w : Math.max(MARGIN, vw - MARGIN - w);
        }
        x = Math.max(MARGIN, x);
      }
      panel.style.left = `${Math.round(x)}px`;
      panel.style.top = `${Math.round(y)}px`;
    }

    /**
     * A submenu sits beside its parent menu, level with its item: to the
     * right, else to the left. With room on neither side (a phone) it opens
     * under the item, over the parent menu, so the item stays in view.
     */
    _placeSub(panel) {
      const { parentItem } = this._meta.get(panel);
      const parentPanel = this._meta.get(parentItem).panel;
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const r = parentItem.getBoundingClientRect();
      const pr = parentPanel.getBoundingClientRect();
      const gap = this._lengthVar('--_sub-offset', 4);
      const pad = this._lengthVar('--_padding', 4);
      panel.style.setProperty('--_room', `${Math.max(120, vh - MARGIN * 2)}px`);
      panel.style.left = '0px';
      panel.style.top = '0px';
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      let x = pr.right + gap;
      let y = r.top - pad;
      if (x + w > vw - MARGIN) {
        x = pr.left - gap - w;
        if (x < MARGIN) {
          x = Math.max(MARGIN, Math.min(r.left + pad * 2, vw - MARGIN - w));
          y = r.bottom + 2;
        }
      }
      if (y + h > vh - MARGIN) y = Math.max(MARGIN, vh - MARGIN - h);
      panel.style.left = `${Math.round(x)}px`;
      panel.style.top = `${Math.round(y)}px`;
    }

    _onViewport(e) {
      if (!this._isOpen) return;
      if (e && e.type === 'scroll' && this._within(e, this)) return; // the menu's own scrolling
      // A menu at a point has nothing to follow.
      if (this._anchor && this._anchor.point) { this.close(false); return; }
      cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => {
        if (!this._isOpen) return;
        this._placeRoot();
        this._stack.slice(1).forEach((p) => this._placeSub(p));
      });
    }

    /* ------------------------------ Submenus ------------------------------ */

    _openSub(itemEl, focusFirst) {
      const meta = this._meta.get(itemEl);
      if (!meta || !meta.sub) return;
      const depth = this._meta.get(meta.panel).depth;
      if (this._stack[depth + 1] !== meta.sub) {
        this._closeFrom(depth + 1);
        this._showPanel(meta.sub);
        this._stack[depth + 1] = meta.sub;
        itemEl.setAttribute('aria-expanded', 'true');
        this._placeSub(meta.sub);
      }
      if (focusFirst) {
        const first = this._enabled(meta.sub)[0];
        if (first) this._focusItem(first);
        else meta.sub.focus({ preventScroll: true });
      }
    }

    /** Closes the open panels from this depth on (0: all of them; the inline root stays). */
    _closeFrom(depth) {
      const from = Math.max(depth, this.hasAttribute('inline') ? 1 : 0);
      while (this._stack.length > from) {
        const panel = this._stack.pop();
        this._hidePanel(panel);
        const { parentItem } = this._meta.get(panel);
        if (parentItem) parentItem.setAttribute('aria-expanded', 'false');
      }
    }

    /* ------------------------------ Focus ------------------------------ */

    _enabled(panel) {
      return Array.from(panel.querySelectorAll('.item:not([aria-disabled="true"])'));
    }

    _focusItem(el) {
      if (!el) return;
      el.focus({ preventScroll: true });
      // Keep it in view inside its own panel, without moving the page.
      const panel = this._meta.get(el).panel;
      if (panel.scrollHeight > panel.clientHeight) {
        const pr = panel.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        if (r.top < pr.top) panel.scrollTop -= pr.top - r.top + 4;
        else if (r.bottom > pr.bottom) panel.scrollTop += r.bottom - pr.bottom + 4;
      }
    }

    _onFocusIn(e) {
      // Inline: one tab stop, on the item that had focus last.
      if (!this.hasAttribute('inline') || !this._root) return;
      const el = e.target.closest ? e.target.closest('.item') : null;
      if (!el || this._meta.get(el).panel !== this._root) return;
      this._root.querySelectorAll('.item[tabindex="0"]').forEach((n) => { n.tabIndex = -1; });
      el.tabIndex = 0;
    }

    /** The panel the keys act on: the focused item's, else the deepest open one. */
    _currentPanel() {
      const active = this.shadowRoot.activeElement;
      if (active) {
        if (active.classList.contains('panel')) return active;
        const meta = this._meta.get(active);
        if (meta) return meta.panel;
      }
      return this._stack[this._stack.length - 1] || this._root;
    }

    _move(panel, where) {
      const items = this._enabled(panel);
      if (!items.length) return;
      const i = items.indexOf(this.shadowRoot.activeElement);
      let next;
      if (where === 'first') next = 0;
      else if (where === 'last') next = items.length - 1;
      else if (i === -1) next = where > 0 ? 0 : items.length - 1;
      else next = (i + where + items.length) % items.length;
      this._closeFrom(this._meta.get(panel).depth + 1);
      this._focusItem(items[next]);
    }

    _typeAhead(panel, char) {
      const now = Date.now();
      if (now - this._typedAt > TYPE_RESET) this._typed = '';
      this._typedAt = now;
      this._typed += char.toLowerCase();
      const items = this._enabled(panel);
      if (!items.length) return;
      const i = items.indexOf(this.shadowRoot.activeElement);
      const same = this._typed.split('').every((c) => c === this._typed[0]);
      const query = same ? this._typed[0] : this._typed;
      // One letter (again and again) walks on; a longer word may stay on the current item.
      const start = same ? i + 1 : Math.max(i, 0);
      for (let n = 0; n < items.length; n += 1) {
        const el = items[(start + n) % items.length];
        if (this._meta.get(el).node.label.trim().toLowerCase().startsWith(query)) {
          this._closeFrom(this._meta.get(panel).depth + 1);
          this._focusItem(el);
          return;
        }
      }
    }

    /* ------------------------------ Events ------------------------------ */

    _onKeydown(e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const inline = this.hasAttribute('inline');
      if (!this._isOpen && !inline) return;
      const panel = this._currentPanel();
      const depth = this._meta.get(panel).depth;
      const active = this.shadowRoot.activeElement;
      const item = active && active.classList.contains('item') ? active : null;
      const meta = item ? this._meta.get(item) : null;
      let handled = true;
      switch (e.key) {
        case 'ArrowDown': this._move(panel, 1); break;
        case 'ArrowUp': this._move(panel, -1); break;
        case 'Home': case 'PageUp': this._move(panel, 'first'); break;
        case 'End': case 'PageDown': this._move(panel, 'last'); break;
        case 'ArrowRight':
          if (meta && meta.sub) this._openSub(item, true);
          break;
        case 'ArrowLeft':
          if (depth > 0) this._backFrom(panel);
          break;
        case 'Escape':
          if (depth > 0) this._backFrom(panel);
          else if (!inline) this.close(true);
          else handled = false;
          break;
        case 'Enter':
        case ' ':
          if (e.key === ' ' && this._typed && Date.now() - this._typedAt <= TYPE_RESET) {
            this._typeAhead(panel, ' ');
          } else if (item) {
            item.click();
          }
          break;
        case 'Tab':
          // Close and let the Tab go on from where the menu was opened.
          handled = false;
          if (!inline) this.close(true);
          else this._closeFrom(1);
          break;
        default:
          if (e.key.length === 1) {
            this._typeAhead(panel, e.key);
          } else {
            handled = false;
          }
      }
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    /** Closes a submenu and puts focus back on the item that opened it. */
    _backFrom(panel) {
      const meta = this._meta.get(panel);
      this._closeFrom(meta.depth);
      if (meta.parentItem) this._focusItem(meta.parentItem);
    }

    _onPointerMove(e) {
      if (e.pointerType === 'touch') return;
      const el = e.target.closest ? e.target.closest('.item') : null;
      if (el === this._hoverEl) return;
      this._hoverEl = el;
      clearTimeout(this._hoverTimer);
      if (!el) return;
      const meta = this._meta.get(el);
      const depth = this._meta.get(meta.panel).depth;
      if (el.getAttribute('aria-disabled') !== 'true') el.focus({ preventScroll: true });
      else meta.panel.focus({ preventScroll: true });
      if (meta.sub && el.getAttribute('aria-disabled') !== 'true') {
        if (this._stack[depth + 1] !== meta.sub) {
          this._hoverTimer = setTimeout(() => this._openSub(el, false), HOVER_DELAY);
        }
      } else if (this._stack.length > depth + 1) {
        this._hoverTimer = setTimeout(() => this._closeFrom(depth + 1), HOVER_DELAY);
      }
    }

    _onClick(e) {
      const el = e.target.closest ? e.target.closest('.item') : null;
      if (!el) return;
      const meta = this._meta.get(el);
      const node = meta.node;
      if (node.disabled) { e.preventDefault(); return; }
      if (meta.sub) {
        clearTimeout(this._hoverTimer);
        // From the keyboard the submenu takes focus; a pointer stays on the item.
        this._openSub(el, e.detail === 0);
        return;
      }
      const detail = { value: node.value, item: node.source };
      if (node.check) detail.checked = node.check === 'radio' ? true : !node.checked;
      if (!this._fire('menu-select', detail, true)) { e.preventDefault(); return; }
      if (node.check) this._setChecked(el, meta, detail.checked);
      if (this.hasAttribute('inline')) { this._closeFrom(1); return; }
      if (node.check && this.hasAttribute('keep-open')) return;
      this.close(true);
    }

    _setChecked(el, meta, checked) {
      const apply = (itemEl, on) => {
        const node = this._meta.get(itemEl).node;
        node.checked = on;
        if (node.source && typeof node.source === 'object') node.source.checked = on;
        itemEl.setAttribute('aria-checked', String(on));
      };
      if (meta.node.check === 'radio') {
        meta.panel.querySelectorAll('.item[role="menuitemradio"]').forEach((other) => {
          if (other !== el && this._meta.get(other).key === meta.key) apply(other, false);
        });
      }
      apply(el, checked);
    }

    _fire(name, detail, cancelable) {
      return this.dispatchEvent(new CustomEvent(name, {
        bubbles: true,
        composed: true,
        cancelable: cancelable === true,
        detail,
      }));
    }
  }

  KakaoMenu.texts = { menu: 'Menu' };

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }

  window.KakaoMenu = KakaoMenu;
  customElements.define(TAG_NAME, KakaoMenu);
})();
