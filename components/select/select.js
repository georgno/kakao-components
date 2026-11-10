/**
 * <kakao-select>
 * ============================================================================
 * A select field: pick one value, or several with `multiple`, from a list
 * with a search field on top. The trigger looks like the other input fields
 * (label, hint, error, three sizes); the open panel is the library's dropdown
 * (the look and placement of the button menu and the multi dropdown).
 * Form-associated. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="select.js"><\/script>
 *
 *   <!-- progressive enhancement: plain options as children -->
 *   <kakao-select label="Country" name="country" required>
 *     <option value="at">Austria</option>
 *     <option value="de" selected>Germany</option>
 *     <optgroup label="More">
 *       <option value="fr">France</option>
 *     </optgroup>
 *   </kakao-select>
 *
 *   <!-- several values, options as JSON -->
 *   <kakao-select multiple label="Tags" name="tags" value="ui,api" list-data='[
 *     "ui", {"value":"api","label":"API"},
 *     {"label":"Later","options":[{"value":"docs","label":"Docs","disabled":true}]}
 *   ]'></kakao-select>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  label           Visible label above the field.
 *  aria-label      Accessible name when there is no visible label.
 *  hint            Helper text below the field (hidden while there is an error).
 *  error           Error text: danger border and message, aria-invalid, and the
 *                  validation message.
 *  placeholder     Text while nothing is selected. Default "Please select".
 *  multiple        Several values: a checkbox per row, the panel stays open
 *                  while picking, and a "Select all" row sits below the search.
 *  value           The selection. With `multiple` a comma-separated list, or a
 *                  JSON array for values that contain commas. Without it, child
 *                  options marked `selected` set the selection. Form reset goes
 *                  back to this (or to those options).
 *  list-data       JSON array of options (never "data"): strings,
 *                  { value, label?, disabled?, selected? }, or groups
 *                  { label, options: [...] }. Wins over child elements.
 *  search-placeholder   Placeholder of the search field. Default "Search".
 *  empty-text      Shown when the search matches nothing. Default "No matches".
 *  size            "sm" | "md" (default) | "lg".
 *  name · required · disabled   Form participation.
 *
 *  data-* attributes on the host are mirrored onto the trigger button.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value            Get / set the selection as a string (multiple: joined with ",").
 *  values           Get / set the selection as an array of values.
 *  selectedOptions  [{ value, label }] in list order.
 *  options          Get / set the options (same shape as list-data). Wins over
 *                   list-data and child elements.
 *  open() · close() · isOpen   The panel.
 *  focus()          Focus the trigger.
 *  checkValidity() · reportValidity() · validity · validationMessage · form
 *
 *  Setting value / values / options never fires events.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  input · change   after every change made by the user
 *  select-change    { value, values, previous } (previous: the values before)
 *  select-open · select-close
 *
 * ----------------------------------------------------------------------------
 * KEYBOARD
 * ----------------------------------------------------------------------------
 *  Trigger:  Enter, Space, ↓, ↑, Alt+↓ open · a letter opens with it in the
 *            search · Delete / Backspace clear the selection.
 *  Open:     typing filters (case and accents ignored, anywhere in the label) ·
 *            ↑ / ↓ / PageUp / PageDown move · Enter picks (multiple: toggles,
 *            the panel stays open) · Escape closes and returns to the trigger ·
 *            Tab closes and moves on, as from a native select.
 *  "Select all" acts on the options that are shown: with a filter it reads
 *  "Select all N matches" and leaves the hidden ones as they are.
 *
 * ----------------------------------------------------------------------------
 * PLACEMENT
 * ----------------------------------------------------------------------------
 *  The panel sits in the top layer (popover API), so a card with hidden
 *  overflow can't clip it. It opens below the trigger, or above when there is
 *  no room below and more above; it starts at the trigger's left edge, lines
 *  up with its right edge when it would run off the right, and is shifted in
 *  when neither fits. Its height is capped by the room on that side. It
 *  follows the trigger while the page scrolls.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES
 * ----------------------------------------------------------------------------
 *  Defaults live in the settings block below; change them on construction.html.
 *  Sizes: --kakao-select-sm-height / -sm-padding-x / -lg-height / -lg-padding-x.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  - The trigger is a button with aria-haspopup="listbox" and aria-expanded,
 *    named by the label and the current selection; hint and error describe it.
 *  - The search field is a combobox that controls the listbox and points at
 *    the active option with aria-activedescendant. The listbox is
 *    aria-multiselectable with `multiple`; "Select all" is its first option
 *    with aria-checked true / false / mixed. Groups are labelled role="group".
 *  - A polite status reports how many options match while filtering.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-select';
  if (customElements.get(TAG_NAME)) return;

  const PAGE_STEP = 8;
  const MARGIN = 8; // the panel keeps this far from the viewport edges

  /** Lower case without accents, for matching. */
  const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const CHEVRON = '<svg class="chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const BOX = '<span class="box" aria-hidden="true">'
    + '<svg class="tick" viewBox="0 0 24 24" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
    + '<svg class="dash" viewBox="0 0 24 24" focusable="false"><path d="M6 12h12"/></svg></span>';
  const SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>';

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-select- (written by construction.html, edit there) */
        --_bg: var(--kakao-select-bg, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-select-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-select-muted, var(--kakao-color-muted, #62626c));
        --_border: var(--kakao-select-border, var(--kakao-color-field-border, #ececef));
        --_hover-bg: var(--kakao-select-hover-bg, var(--kakao-color-subtle, #f0f0f1));
        --_focus: var(--kakao-select-focus, var(--kakao-color-focus, #2563eb));
        --_danger: var(--kakao-select-danger, var(--kakao-color-danger, #dc2626));
        --_panel-bg: var(--kakao-select-panel-bg, var(--kakao-color-bg, #ffffff));
        --_line: var(--kakao-select-line, var(--kakao-color-line, #e5e7eb));
        --_check: var(--kakao-select-check, var(--kakao-color-primary, #4f46e5));
        --_box-bg: var(--kakao-select-box-bg, var(--kakao-color-bg, #ffffff));
        --_box-border: var(--kakao-select-box-border, var(--kakao-color-border, #82828b));
        --_box-checked-bg: var(--kakao-select-box-checked-bg, var(--kakao-color-ink, #18181b));
        --_mark: var(--kakao-select-mark, var(--kakao-color-on-ink, #fafafa));
        --_font: var(--kakao-select-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_label-weight: var(--kakao-select-label-weight, 600);
        --_height: var(--kakao-select-height, 44px);
        --_padding-x: var(--kakao-select-padding-x, 12px);
        --_label-gap: var(--kakao-select-label-gap, 6px);
        --_message-gap: var(--kakao-select-message-gap, 5px);
        --_chevron-size: var(--kakao-select-chevron-size, 0.9em);
        --_radius: var(--kakao-select-radius, 10px);
        --_focus-width: var(--kakao-select-focus-width, 2px);
        --_focus-offset: var(--kakao-select-focus-offset, 2px);
        --_disabled-opacity: var(--kakao-select-disabled-opacity, 0.55);
        --_panel-radius: var(--kakao-select-panel-radius, 10px);
        --_panel-padding: var(--kakao-select-panel-padding, 4px);
        --_panel-offset: var(--kakao-select-panel-offset, 6px);
        --_panel-height: var(--kakao-select-panel-height, 20rem);
        --_panel-min-width: var(--kakao-select-panel-min-width, 12rem);
        --_panel-shadow: var(--kakao-select-panel-shadow, 0 8px 24px rgb(0 0 0 / .08), 0 0 0 1px color-mix(in srgb, var(--kakao-color-text, #18181b) 10%, transparent));
        --_z: var(--kakao-select-z, 70);
        --_option-height: var(--kakao-select-option-height, 36px);
        --_option-radius: var(--kakao-select-option-radius, 6px);
        --_search-height: var(--kakao-select-search-height, 36px);
        --_box-size: var(--kakao-select-box-size, 18px);
        --_box-radius: var(--kakao-select-box-radius, 5px);
        --_duration: var(--kakao-select-duration, 150ms);
        --_ease: var(--kakao-select-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        display: block;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) { --_height: var(--kakao-select-sm-height, 36px); --_padding-x: var(--kakao-select-sm-padding-x, 10px); }
      :host([size="lg"]) { --_height: var(--kakao-select-lg-height, 52px); --_padding-x: var(--kakao-select-lg-padding-x, 14px); }
      :host([disabled]) { opacity: var(--_disabled-opacity); }

      .label {
        display: block;
        margin: 0 0 var(--_label-gap);
        font-weight: var(--_label-weight);
        font-size: 0.82rem;
        cursor: pointer;
      }
      .label:empty { display: none; }

      /* ---- Trigger: the text input's field ---- */
      .trigger {
        display: flex;
        align-items: center;
        gap: calc(var(--_padding-x) * 0.6);
        box-sizing: border-box;
        width: 100%;
        min-height: var(--_height);
        margin: 0;
        padding: 0 var(--_padding-x);
        background: var(--_bg);
        color: var(--_text);
        font: inherit;
        text-align: left;
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        outline: none;
        cursor: pointer;
        transition: border-color var(--_duration) var(--_ease), background-color var(--_duration) var(--_ease);
      }
      :host([size="sm"]) .trigger { font-size: 0.875rem; }
      :host([size="lg"]) .trigger { font-size: 1rem; }
      .trigger:disabled { cursor: not-allowed; }
      .trigger:focus-visible,
      .trigger[aria-expanded="true"] { border-color: var(--_focus); }
      .trigger:focus-visible { outline: var(--_focus-width) solid var(--_focus); outline-offset: var(--_focus-offset); }
      :host([error]) .trigger { border-color: var(--_danger); }
      :host([error]) .trigger:focus-visible { outline-color: var(--_danger); }

      .text { display: flex; flex: 1; min-width: 0; align-items: baseline; gap: 0.4em; }
      .current { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .trigger[data-empty] .current { color: var(--_muted); }
      .more { flex: none; color: var(--_muted); font-variant-numeric: tabular-nums; }
      .more:empty { display: none; }

      .chevron {
        flex: none;
        width: var(--_chevron-size);
        height: var(--_chevron-size);
        fill: none;
        stroke: var(--_muted);
        stroke-width: 2.4;
        stroke-linecap: round;
        stroke-linejoin: round;
        transition: transform 200ms var(--_ease);
      }
      .trigger[aria-expanded="true"] .chevron { transform: rotate(180deg); }

      .hint, .error { margin: var(--_message-gap) 0 0; font-size: 0.78rem; color: var(--_muted); }
      .hint:empty, .error:empty { display: none; }
      .error { color: var(--_danger); }
      :host([error]) .hint { display: none; }

      .sr {
        position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
        overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
      }

      /* ---- Panel: the dropdown surface (overlay, elevation level 3) ----
         Keep in step with combobox.js: same panel, rows and groups. */
      .panel {
        position: fixed;
        inset: auto;
        z-index: var(--_z);
        box-sizing: border-box;
        display: none;
        flex-direction: column;
        margin: 0;
        padding: var(--_panel-padding);
        max-width: calc(100vw - ${MARGIN * 2}px);
        max-height: min(var(--_panel-height), var(--_room, 100vh));
        overflow: hidden;
        background: var(--_panel-bg);
        color: var(--_text);
        font: var(--_font);
        border: 0;
        border-radius: var(--_panel-radius);
        box-shadow: var(--_panel-shadow);
      }
      .panel.is-open { display: flex; animation: kakao-select-in var(--_duration) var(--_ease); }
      .panel[data-up] { --_from: 4px; }
      @keyframes kakao-select-in {
        from { opacity: 0; transform: translateY(var(--_from, -4px)); }
      }

      /* Search: a small field, radius 6 inside the panel's 4px padding (10 - 4). */
      .search {
        flex: none;
        display: flex;
        align-items: center;
        gap: 0.45rem;
        box-sizing: border-box;
        height: var(--_search-height);
        margin-bottom: var(--_panel-padding);
        padding: 0 0.6rem;
        background: var(--_bg);
        border: 1px solid var(--_border);
        border-radius: var(--_option-radius);
      }
      .search:has(input:focus-visible) {
        border-color: var(--_focus);
        outline: var(--_focus-width) solid var(--_focus);
        outline-offset: var(--_focus-offset);
      }
      .search svg {
        flex: none; width: 1em; height: 1em; fill: none;
        stroke: var(--_muted); stroke-width: 2.2; stroke-linecap: round;
      }
      .search input {
        flex: 1; min-width: 0; height: 100%;
        margin: 0; padding: 0; border: 0; outline: none;
        background: none; color: inherit; font: inherit; font-size: 0.92em;
      }
      .search input::placeholder { color: var(--_muted); opacity: 1; }
      .search input::-webkit-search-cancel-button { display: none; }

      .list {
        position: relative;
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        outline: none;
      }

      .row {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        box-sizing: border-box;
        min-height: var(--_option-height);
        padding: 0.4rem 0.6rem;
        border-radius: var(--_option-radius);
        line-height: 1.3;
        cursor: pointer;
        user-select: none;
        transition: background-color var(--_duration) var(--_ease);
      }
      .row[hidden] { display: none; }
      .row[data-active] { background: var(--_hover-bg); }
      .row[aria-disabled="true"] { color: var(--_muted); cursor: not-allowed; }
      .row .lbl { flex: 1; min-width: 0; overflow-wrap: anywhere; }

      /* Single: the button menu's check mark. */
      .check { flex: none; display: inline-flex; width: 1.1em; color: var(--_check); visibility: hidden; }
      .check svg, .box svg { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
      .check svg { width: 1.1em; height: 1.1em; stroke-width: 2.6; }
      .row[aria-selected="true"] { font-weight: 600; }
      .row[aria-selected="true"] .check { visibility: visible; }
      :host([multiple]) .row[aria-selected="true"] { font-weight: inherit; }

      /* Multiple: the checkbox's box. */
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
      .box svg { display: none; width: 72%; height: 72%; stroke-width: 3.2; }
      .row[aria-selected="true"] .box,
      .row.all[aria-checked="true"] .box,
      .row.all[aria-checked="mixed"] .box { background: var(--_box-checked-bg); border-color: var(--_box-checked-bg); }
      .row[aria-selected="true"] .box .tick,
      .row.all[aria-checked="true"] .box .tick,
      .row.all[aria-checked="mixed"] .box .dash { display: block; }
      .row.all[aria-checked="mixed"] .box .tick { display: none; }
      .row.all[aria-checked="true"] .box .dash { display: none; }

      /* Select all stays at the top while the list scrolls. */
      .row.all {
        position: sticky;
        top: 0;
        z-index: 1;
        margin-bottom: 1px;
        background: var(--_panel-bg);
        box-shadow: 0 1px 0 var(--_line);
        border-radius: var(--_option-radius) var(--_option-radius) 0 0;
      }
      .row.all[data-active] { background: var(--_hover-bg); }
      .row.all .count { color: var(--_muted); font-variant-numeric: tabular-nums; }

      .group[hidden] { display: none; }
      .group-label {
        padding: 0.55rem 0.6rem 0.25rem;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--_muted);
      }

      .empty { padding: 0.75rem 0.6rem; text-align: center; color: var(--_muted); font-size: 0.9em; }
      .empty[hidden] { display: none; }

      @media (prefers-reduced-motion: reduce) {
        .panel.is-open { animation: none; }
        .trigger, .chevron, .row, .box { transition: none; }
      }
    </style>
    <label class="label" part="label" id="label"></label>
    <button class="trigger" part="field trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="panel">
      <span class="text"><span class="current" part="value"></span><span class="more" aria-hidden="true"></span></span>
      ${CHEVRON}
    </button>
    <p class="hint" part="hint" id="hint"></p>
    <p class="error" part="error" id="error"></p>
    <div class="panel" part="panel" id="panel">
      <div class="search" part="search">
        ${SEARCH}
        <input type="search" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="listbox"
          autocomplete="off" spellcheck="false" enterkeyhint="done" />
      </div>
      <div class="list" part="list" id="listbox" role="listbox" tabindex="-1"></div>
      <div class="empty" part="empty"></div>
      <span class="sr" id="status" role="status" aria-live="polite"></span>
    </div>
  `;

  class KakaoSelect extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['label', 'aria-label', 'hint', 'error', 'placeholder', 'multiple', 'value', 'list-data',
        'search-placeholder', 'empty-text', 'size', 'name', 'required', 'disabled'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      const $ = (sel) => shadow.querySelector(sel);
      this._labelEl = $('.label');
      this._trigger = $('.trigger');
      this._currentEl = $('.current');
      this._moreEl = $('.more');
      this._hintEl = $('#hint');
      this._errorEl = $('#error');
      this._panel = $('.panel');
      this._search = $('.search input');
      this._list = $('.list');
      this._empty = $('.empty');
      this._status = $('#status');
      this._hasPopover = typeof this._panel.showPopover === 'function';
      if (this._hasPopover) this._panel.setAttribute('popover', 'manual');

      this._items = []; // { value, label, disabled, selected (default), group, key, el }
      this._groups = []; // { label, el }
      this._sel = []; // selected values
      this._optionsProp = null;
      this._isOpen = false;
      this._active = -1; // index into _items, or 'all'
      this._up = false;
      this._formDisabled = false;
      this._connected = false;
      this._raf = 0;
      this._statusTimer = 0;
      this._initialised = false;

      this._onDocPointerDown = this._onDocPointerDown.bind(this);
      this._onViewport = this._onViewport.bind(this);
      this._observer = new MutationObserver((records) => {
        // Only the option children count, not the host's own attributes.
        if (this._source() === 'children' && records.some((r) => r.type !== 'attributes' || r.target !== this)) this._build();
      });
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      this._connected = true;
      ['options', 'value', 'values'].forEach((p) => this._upgrade(p));
      if (!this._initialised) {
        this._initialised = true;
        this._wire();
        this._build();
        if (!this._valueSetByScript) this._sel = this._defaultValues();
      }
      this._observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
      this._sync();
    }

    disconnectedCallback() {
      this._connected = false;
      this._observer.disconnect();
      this.close(false);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this._initialised) return;
      switch (name) {
        case 'list-data':
          this._build();
          break;
        case 'multiple':
          this.close(false);
          if (!this.multiple && this._sel.length > 1) this._sel = this._sel.slice(0, 1);
          this._build();
          break;
        case 'value':
          this._sel = this._parse(newValue);
          this._cleanSel();
          break;
        case 'disabled':
          this.close(false);
          break;
        default:
          break;
      }
      this._sync();
    }

    formResetCallback() {
      this._sel = this._defaultValues();
      this._sync();
    }

    formDisabledCallback(disabled) {
      this._formDisabled = disabled;
      this.close(false);
      this._sync();
    }

    formStateRestoreCallback(state) {
      if (state instanceof FormData) this._sel = state.getAll(this.getAttribute('name') || '').map(String);
      else this._sel = state == null ? [] : [String(state)];
      this._cleanSel();
      this._sync();
    }

    /* -------------------------- Public API -------------------------- */

    get multiple() { return this.hasAttribute('multiple'); }
    set multiple(v) { this.toggleAttribute('multiple', !!v); }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(v) { this.toggleAttribute('disabled', !!v); }
    get required() { return this.hasAttribute('required'); }
    set required(v) { this.toggleAttribute('required', !!v); }
    get name() { return this.getAttribute('name') || ''; }
    set name(v) { this.setAttribute('name', v); }
    get isOpen() { return this._isOpen; }

    get value() { return this._sel.join(','); }
    set value(v) {
      this._valueSetByScript = true;
      this._sel = Array.isArray(v) ? v.map(String) : this._parse(v == null ? '' : String(v));
      this._cleanSel();
      if (this._initialised) this._sync();
    }

    get values() { return this._sel.slice(); }
    set values(v) { this.value = Array.isArray(v) ? v : v == null ? [] : [v]; }

    get selectedOptions() {
      return this._ordered().map((it) => ({ value: it.value, label: it.label }));
    }

    get options() {
      return this._items.map((it) => ({
        value: it.value, label: it.label, disabled: it.disabled,
        group: it.group == null ? null : this._groups[it.group].label,
      }));
    }
    set options(list) {
      this._optionsProp = Array.isArray(list) ? list : null;
      if (this._initialised) {
        this._build();
        this._sync();
      }
    }

    get form() { return this._internals ? this._internals.form : null; }
    get validity() { return this._internals ? this._internals.validity : undefined; }
    get validationMessage() { return this._internals ? this._internals.validationMessage : ''; }
    checkValidity() { return this._internals ? this._internals.checkValidity() : true; }
    reportValidity() { return this._internals ? this._internals.reportValidity() : true; }

    focus(options) { this._trigger.focus(options); }
    blur() { this._trigger.blur(); }

    open() { this._open(''); }

    close(returnFocus = true) {
      if (!this._isOpen) return;
      this._isOpen = false;
      this._active = -1;
      if (this._hasPopover && this._panel.matches(':popover-open')) this._panel.hidePopover();
      this._panel.classList.remove('is-open');
      this._trigger.setAttribute('aria-expanded', 'false');
      this._search.removeAttribute('aria-activedescendant');
      document.removeEventListener('pointerdown', this._onDocPointerDown, true);
      window.removeEventListener('scroll', this._onViewport, true);
      window.removeEventListener('resize', this._onViewport);
      cancelAnimationFrame(this._raf);
      if (returnFocus) this._trigger.focus({ preventScroll: true });
      this._dispatch('select-close', {});
    }

    /* -------------------------- Options -------------------------- */

    _upgrade(prop) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const v = this[prop];
        delete this[prop];
        this[prop] = v;
      }
    }

    _source() {
      if (this._optionsProp) return 'property';
      if (this.hasAttribute('list-data')) return 'attribute';
      return 'children';
    }

    /** Raw entries: [{ value, label, disabled, selected } | { label, options: [...] }]. */
    _rawEntries() {
      const source = this._source();
      if (source === 'property') return this._optionsProp;
      if (source === 'attribute') {
        try {
          const parsed = JSON.parse(this.getAttribute('list-data') || '[]');
          return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
          console.error(`<${TAG_NAME}> failed to parse list-data as JSON:`, err);
          return [];
        }
      }
      const fromOption = (o) => ({
        value: o.value, label: o.label || o.textContent.trim(), disabled: o.disabled, selected: o.hasAttribute('selected'),
      });
      const out = [];
      this._childPlaceholder = '';
      Array.from(this.children).forEach((el) => {
        // A top-level <option value=""> is the placeholder, as in a native required select.
        if (el.localName === 'option' && el.getAttribute('value') === '') this._childPlaceholder = el.textContent.trim();
        else if (el.localName === 'option') out.push(fromOption(el));
        else if (el.localName === 'optgroup') {
          out.push({
            label: el.getAttribute('label') || '',
            disabled: el.disabled,
            options: Array.from(el.querySelectorAll('option')).map((o) => ({ ...fromOption(o), disabled: o.disabled || el.disabled })),
          });
        }
      });
      return out;
    }

    _build() {
      const items = [];
      const groups = [];
      const add = (o, group) => {
        if (o == null) return;
        const entry = typeof o === 'object' ? o : { value: o };
        const value = String(entry.value != null ? entry.value : entry.label != null ? entry.label : '');
        const label = entry.label != null ? String(entry.label) : value;
        items.push({ value, label, disabled: !!entry.disabled, selected: !!entry.selected, group, key: fold(label) });
      };
      this._rawEntries().forEach((e) => {
        if (e && typeof e === 'object' && Array.isArray(e.options)) {
          groups.push({ label: String(e.label != null ? e.label : '') });
          e.options.forEach((o) => add(e.disabled && typeof o === 'object' ? { ...o, disabled: true } : o, groups.length - 1));
        } else {
          add(e, null);
        }
      });
      this._items = items;
      this._groups = groups;
      this._cleanSel();
      this._renderList();
      if (this._isOpen) this._filter(true);
    }

    /** Drops selected values that no longer exist (keeps them while there are no options yet). */
    _cleanSel() {
      if (!this._items.length) return;
      const known = new Set(this._items.map((it) => it.value));
      let next = [...new Set(this._sel)].filter((v) => known.has(v));
      if (!this.multiple) next = next.slice(0, 1);
      this._sel = next;
    }

    _parse(raw) {
      if (raw == null || raw === '') return [];
      const text = String(raw).trim();
      if (!this.multiple) return [text];
      if (text.startsWith('[')) {
        try {
          const arr = JSON.parse(text);
          if (Array.isArray(arr)) return arr.map(String);
        } catch (err) { /* fall through to the comma list */ }
      }
      return text.split(',').map((s) => s.trim()).filter(Boolean);
    }

    _defaultValues() {
      if (this.hasAttribute('value')) {
        const v = this._parse(this.getAttribute('value'));
        return this.multiple ? v : v.slice(0, 1);
      }
      const picked = this._items.filter((it) => it.selected).map((it) => it.value);
      return this.multiple ? picked : picked.slice(-1);
    }

    _ordered() {
      const set = new Set(this._sel);
      return this._items.filter((it) => set.has(it.value));
    }

    /* -------------------------- Rendering -------------------------- */

    _renderList() {
      const list = this._list;
      list.textContent = '';
      const multiple = this.multiple;
      list.toggleAttribute('aria-multiselectable', multiple);
      if (multiple) {
        const all = document.createElement('div');
        all.className = 'row all';
        all.id = 'opt-all';
        all.setAttribute('role', 'option');
        all.setAttribute('aria-selected', 'false');
        all.innerHTML = `${BOX}<span class="lbl"></span>`;
        list.append(all);
        this._allEl = all;
      } else {
        this._allEl = null;
      }
      const groupEls = this._groups.map((g, gi) => {
        const el = document.createElement('div');
        el.className = 'group';
        el.setAttribute('role', 'group');
        el.setAttribute('aria-labelledby', `grp-${gi}`);
        const head = document.createElement('div');
        head.className = 'group-label';
        head.id = `grp-${gi}`;
        head.setAttribute('role', 'presentation');
        head.textContent = g.label;
        el.append(head);
        g.el = el;
        return el;
      });
      let lastGroup;
      this._items.forEach((it, i) => {
        const row = document.createElement('div');
        row.className = 'row';
        row.id = `opt-${i}`;
        row.dataset.index = String(i);
        row.setAttribute('role', 'option');
        if (it.disabled) row.setAttribute('aria-disabled', 'true');
        row.innerHTML = multiple ? BOX : `<span class="check" aria-hidden="true">${CHECK}</span>`;
        const lbl = document.createElement('span');
        lbl.className = 'lbl';
        lbl.textContent = it.label;
        row.append(lbl);
        it.el = row;
        if (it.group == null) {
          list.append(row);
          lastGroup = null;
        } else {
          const g = groupEls[it.group];
          if (lastGroup !== g) list.append(g);
          lastGroup = g;
          g.append(row);
        }
      });
      groupEls.forEach((g) => { if (!g.isConnected) list.append(g); });
      this._syncRows();
    }

    /** Selected marks on the rows and the select-all state. */
    _syncRows() {
      const set = new Set(this._sel);
      this._items.forEach((it) => { if (it.el) it.el.setAttribute('aria-selected', String(set.has(it.value))); });
      if (!this._allEl) return;
      const shown = this._shownEnabled();
      const on = shown.filter((it) => set.has(it.value)).length;
      const state = !shown.length || !on ? 'false' : on === shown.length ? 'true' : 'mixed';
      this._allEl.setAttribute('aria-checked', state);
      this._allEl.setAttribute('aria-selected', String(state === 'true'));
      const filtered = this._search.value.trim() !== '';
      const lbl = this._allEl.querySelector('.lbl');
      lbl.textContent = filtered ? `Select all ${shown.length} ${shown.length === 1 ? 'match' : 'matches'}` : 'Select all';
      this._allEl.hidden = !shown.length;
    }

    _shownEnabled() {
      return this._items.filter((it) => !it.hidden && !it.disabled);
    }

    /** Everything that depends on attributes and the selection. */
    _sync() {
      const label = this.getAttribute('label') || '';
      this._labelEl.textContent = label;
      const name = label || this.getAttribute('aria-label') || 'Select';
      this._labelEl.onclick = (e) => { e.preventDefault(); if (!this._isDisabled()) this._trigger.focus(); };
      this._trigger.disabled = this._isDisabled();

      const chosen = this._ordered();
      const placeholder = this.getAttribute('placeholder') || this._childPlaceholder || 'Please select';
      this._trigger.toggleAttribute('data-empty', !chosen.length);
      this._currentEl.textContent = chosen.length ? chosen[0].label : placeholder;
      this._moreEl.textContent = chosen.length > 1 ? `+${chosen.length - 1}` : '';
      const spoken = chosen.length ? chosen.map((c) => c.label).join(', ') : 'nothing selected';
      this._trigger.setAttribute('aria-label', `${name}, ${spoken}`);
      this._list.setAttribute('aria-label', name);
      this._search.setAttribute('aria-label', `Search ${name}`);
      this._search.placeholder = this.getAttribute('search-placeholder') || 'Search';
      this._empty.textContent = this.getAttribute('empty-text') || 'No matches';

      const hint = this.getAttribute('hint') || '';
      const error = this.getAttribute('error') || '';
      this._hintEl.textContent = hint;
      this._errorEl.textContent = error;
      const described = [hint && !error && 'hint', error && 'error'].filter(Boolean).join(' ');
      if (described) this._trigger.setAttribute('aria-describedby', described);
      else this._trigger.removeAttribute('aria-describedby');
      if (error) this._trigger.setAttribute('aria-invalid', 'true');
      else this._trigger.removeAttribute('aria-invalid');

      this._syncRows();
      this._syncForm();
      this._mirrorDataAttrs();
    }

    _syncForm() {
      if (!this._internals) return;
      const name = this.getAttribute('name');
      if (this.multiple) {
        if (name && this._sel.length) {
          const fd = new FormData();
          this._sel.forEach((v) => fd.append(name, v));
          this._internals.setFormValue(fd);
        } else {
          this._internals.setFormValue(null);
        }
      } else {
        this._internals.setFormValue(this._sel.length ? this._sel[0] : null);
      }
      const error = this.getAttribute('error');
      if (error) this._internals.setValidity({ customError: true }, error, this._trigger);
      else if (this.required && !this._sel.length) {
        this._internals.setValidity({ valueMissing: true }, this.multiple ? 'Please select at least one option.' : 'Please select an option.', this._trigger);
      } else {
        this._internals.setValidity({});
      }
    }

    _mirrorDataAttrs() {
      Array.from(this._trigger.attributes).forEach((a) => {
        if (a.name.startsWith('data-') && a.name !== 'data-empty' && !this.hasAttribute(a.name)) this._trigger.removeAttribute(a.name);
      });
      Array.from(this.attributes).forEach((a) => {
        if (a.name.startsWith('data-') && a.name !== 'data-empty') this._trigger.setAttribute(a.name, a.value);
      });
    }

    _isDisabled() {
      return this.disabled || this._formDisabled;
    }

    /* -------------------------- Filter and active option -------------------------- */

    _filter(keepActive) {
      const q = fold(this._search.value.trim());
      let shown = 0;
      this._items.forEach((it) => {
        it.hidden = q !== '' && !it.key.includes(q);
        it.el.hidden = it.hidden;
        if (!it.hidden) shown++;
      });
      this._groups.forEach((g, gi) => {
        g.el.hidden = !this._items.some((it) => it.group === gi && !it.hidden);
      });
      this._empty.hidden = shown > 0;
      this._syncRows();
      if (!keepActive || !this._navigable().includes(this._active)) {
        const nav = this._navigable();
        this._active = nav.find((k) => k !== 'all');
        if (this._active === undefined) this._active = nav.length ? nav[0] : -1;
      }
      this._syncActive();
      if (this._isOpen) this._place();
      this._announce(q === '' ? '' : shown ? `${shown} ${shown === 1 ? 'option' : 'options'}` : this._empty.textContent);
    }

    _announce(text) {
      clearTimeout(this._statusTimer);
      this._statusTimer = setTimeout(() => { this._status.textContent = text; }, 400);
    }

    /** Keys of the options the arrows can reach, in order ('all' first in multiple). */
    _navigable() {
      const nav = [];
      if (this._allEl && !this._allEl.hidden) nav.push('all');
      this._items.forEach((it, i) => { if (!it.hidden && !it.disabled) nav.push(i); });
      return nav;
    }

    _rowFor(key) {
      return key === 'all' ? this._allEl : (this._items[key] && this._items[key].el);
    }

    _syncActive(center) {
      this._list.querySelectorAll('.row[data-active]').forEach((r) => r.removeAttribute('data-active'));
      const row = this._rowFor(this._active);
      if (!row || row.hidden) {
        this._search.removeAttribute('aria-activedescendant');
        return;
      }
      row.setAttribute('data-active', '');
      this._search.setAttribute('aria-activedescendant', row.id);
      if (this._active === 'all') return; // sticky, always in view
      const list = this._list;
      const sticky = this._allEl && !this._allEl.hidden ? this._allEl.offsetHeight : 0;
      const top = row.offsetTop;
      const bottom = top + row.offsetHeight;
      if (center) list.scrollTop = top - (list.clientHeight - row.offsetHeight) / 2;
      else if (top - sticky < list.scrollTop) list.scrollTop = top - sticky - 2;
      else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 2;
    }

    _move(delta) {
      const nav = this._navigable();
      if (!nav.length) return;
      let i = nav.indexOf(this._active);
      if (i === -1) i = delta > 0 ? -1 : nav.length;
      i = Math.max(0, Math.min(nav.length - 1, i + delta));
      this._active = nav[i];
      this._syncActive();
    }

    /* -------------------------- Open / place -------------------------- */

    _open(initial) {
      if (this._isOpen || this._isDisabled() || !this._connected) return;
      this._isOpen = true;
      this._search.value = initial || '';
      this._status.textContent = '';
      this._panel.removeAttribute('data-up');
      this._panel.style.removeProperty('--_room');
      if (this._hasPopover) {
        try { this._panel.showPopover(); } catch (err) { /* already open */ }
      }
      this._panel.classList.add('is-open');
      this._trigger.setAttribute('aria-expanded', 'true');
      this._filter(false);
      // Start on the (first) selected option when it is shown.
      const firstSel = this._items.findIndex((it) => !it.hidden && !it.disabled && this._sel.includes(it.value));
      if (firstSel > -1 && !initial) this._active = firstSel;
      this._place(true);
      this._syncActive(true);
      this._search.focus({ preventScroll: true });
      document.addEventListener('pointerdown', this._onDocPointerDown, true);
      window.addEventListener('scroll', this._onViewport, true);
      window.addEventListener('resize', this._onViewport);
      this._dispatch('select-open', {});
    }

    /**
     * Places the panel against the trigger (fixed, in the top layer), with the
     * button menu's rules: below, or above when there's no room below and more
     * above; left-aligned, else right-aligned, else clamped to the viewport.
     * The side is chosen on open (and on resize), so typing doesn't flip it.
     */
    _place(chooseSide) {
      if (!this._isOpen) return;
      const panel = this._panel;
      const r = this._trigger.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const offset = parseFloat(getComputedStyle(this).getPropertyValue('--_panel-offset')) || 6;
      const below = vh - r.bottom - offset - MARGIN;
      const above = r.top - offset - MARGIN;
      if (chooseSide) {
        panel.style.removeProperty('--_room');
        panel.style.top = '0px';
        panel.style.bottom = 'auto';
        const natural = panel.offsetHeight;
        this._up = below < natural && above > below;
        panel.toggleAttribute('data-up', this._up);
      }
      panel.style.setProperty('--_room', `${Math.max(120, Math.floor(this._up ? above : below))}px`);
      // As wide as the field (or the min width); long labels wrap.
      panel.style.width = `max(${Math.round(r.width)}px, var(--_panel-min-width))`;
      if (this._up) {
        panel.style.top = 'auto';
        panel.style.bottom = `${Math.round(vh - r.top + offset)}px`;
      } else {
        panel.style.bottom = 'auto';
        panel.style.top = `${Math.round(r.bottom + offset)}px`;
      }
      const width = panel.offsetWidth;
      let left = r.left;
      if (r.left + width > vw - MARGIN) {
        left = r.right - width >= MARGIN ? r.right - width : Math.max(MARGIN, vw - MARGIN - width);
      }
      panel.style.left = `${Math.round(left)}px`;
      panel.style.right = 'auto';
    }

    _onViewport(e) {
      if (e && e.type === 'scroll' && e.composedPath()[0] === this._list) return;
      cancelAnimationFrame(this._raf);
      const resize = e && e.type === 'resize';
      this._raf = requestAnimationFrame(() => this._place(resize));
    }

    _onDocPointerDown(e) {
      if (!e.composedPath().includes(this)) this.close(false);
    }

    /* -------------------------- Interaction -------------------------- */

    _wire() {
      const t = this._trigger;
      t.addEventListener('click', () => {
        if (this._isOpen) this.close(true);
        else this._open('');
      });
      t.addEventListener('keydown', (e) => this._onTriggerKey(e));
      this._search.addEventListener('keydown', (e) => this._onSearchKey(e));
      this._search.addEventListener('input', () => this._filter(false));
      // Pressing in the panel must not take focus from the search.
      this._panel.addEventListener('mousedown', (e) => {
        if (e.target !== this._search) e.preventDefault();
      });
      this._list.addEventListener('click', (e) => {
        const row = e.target.closest('.row');
        if (!row || row.getAttribute('aria-disabled') === 'true') return;
        if (row === this._allEl) {
          this._active = 'all';
          this._toggleAll();
        } else {
          this._active = Number(row.dataset.index);
          this._pick(this._active);
        }
      });
      // Hover follows the mouse, as in the button menu and the multi dropdown.
      this._list.addEventListener('pointermove', (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        const row = e.target.closest('.row');
        if (!row || row.getAttribute('aria-disabled') === 'true') return;
        const key = row === this._allEl ? 'all' : Number(row.dataset.index);
        if (key === this._active) return;
        this._active = key;
        this._list.querySelectorAll('.row[data-active]').forEach((r) => r.removeAttribute('data-active'));
        row.setAttribute('data-active', '');
        this._search.setAttribute('aria-activedescendant', row.id);
      });
      this.shadowRoot.addEventListener('focusout', (e) => {
        if (!this._isOpen) return;
        const to = e.relatedTarget;
        if (!to || !this.shadowRoot.contains(to)) this.close(false);
      });
    }

    _onTriggerKey(e) {
      if (this._isDisabled() || this._isOpen) return;
      switch (e.key) {
        case 'Enter':
        case ' ':
        case 'ArrowDown':
        case 'ArrowUp':
          e.preventDefault();
          this._open('');
          return;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (this._sel.length) this._commit([]);
          return;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            this._open(e.key);
          }
      }
    }

    _onSearchKey(e) {
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); this._move(1); break;
        case 'ArrowUp':
          e.preventDefault();
          if (e.altKey) this.close(true);
          else this._move(-1);
          break;
        case 'PageDown': e.preventDefault(); this._move(PAGE_STEP); break;
        case 'PageUp': e.preventDefault(); this._move(-PAGE_STEP); break;
        case 'Enter':
          e.preventDefault();
          if (this._active === 'all') this._toggleAll();
          else if (this._active !== -1 && this._active != null) this._pick(this._active);
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation(); // don't also close a surrounding dialog or sheet
          this.close(true);
          break;
        case 'Tab':
          // Back on the trigger before the browser moves focus, so Tab and
          // Shift+Tab continue from where the select sits.
          this.close(true);
          break;
        default:
          break;
      }
    }

    _pick(index) {
      const it = this._items[index];
      if (!it || it.disabled) return;
      if (this.multiple) {
        const next = this._sel.includes(it.value) ? this._sel.filter((v) => v !== it.value) : this._sel.concat(it.value);
        this._commit(this._orderValues(next));
        this._syncActive();
      } else {
        this.close(true);
        if (this._sel[0] !== it.value) this._commit([it.value]);
      }
    }

    /** Select all / none of the options that are shown (enabled only). */
    _toggleAll() {
      const shown = this._shownEnabled().map((it) => it.value);
      if (!shown.length) return;
      const allOn = shown.every((v) => this._sel.includes(v));
      const next = allOn
        ? this._sel.filter((v) => !shown.includes(v))
        : this._sel.concat(shown.filter((v) => !this._sel.includes(v)));
      this._commit(this._orderValues(next));
    }

    _orderValues(values) {
      const set = new Set(values);
      return this._items.filter((it) => set.has(it.value)).map((it) => it.value);
    }

    _commit(next) {
      const previous = this._sel.slice();
      this._sel = next;
      this._sync();
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      this._dispatch('select-change', { value: this.value, values: this.values, previous });
    }

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
  }

  customElements.define(TAG_NAME, KakaoSelect);
})();
