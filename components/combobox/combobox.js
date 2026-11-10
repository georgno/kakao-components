/**
 * <kakao-combobox>
 * ============================================================================
 * A text field with suggestions: typing filters a list below the field, and
 * the user either picks a suggestion or keeps their own text as the value
 * (an editable combobox with list autocomplete, as in the ARIA APG). The field
 * looks like the text input (label, hint, error, three sizes); the list is the
 * select's dropdown panel. Form-associated. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="combobox.js"><\/script>
 *
 *   <!-- suggestions as children; any other text is allowed too -->
 *   <kakao-combobox label="City" name="city" placeholder="Pick or type a city">
 *     <option value="ber">Berlin</option>
 *     <optgroup label="Austria">
 *       <option>Wien</option><option>Graz</option>
 *     </optgroup>
 *   </kakao-combobox>
 *
 *   <!-- suggestions as JSON, inline completion, only listed values -->
 *   <kakao-combobox strict autocomplete="both" label="Country"
 *     list-data='["Austria", {"value":"de","label":"Germany"}]'></kakao-combobox>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  label           Visible label above the field.
 *  aria-label      Accessible name when there is no visible label.
 *  hint            Helper text below the field (hidden while there is an error).
 *  error           Error text: danger border and message, aria-invalid, and the
 *                  validation message.
 *  placeholder     Placeholder of the field.
 *  value           The value. Form reset goes back to it (or to a child option
 *                  marked `selected`).
 *  list-data       JSON array of suggestions (never "data"): strings,
 *                  { value, label?, disabled?, selected? }, or groups
 *                  { label, options: [...] }. Wins over child elements.
 *  autocomplete    "list" (default): typing filters the list.
 *                  "both": also completes the first match in the field, the
 *                  added part selected so typing on replaces it.
 *                  "none": the list is not filtered.
 *  create-label    Text of the free-text row; {text} is the typed text.
 *                  Default "Use “{text}”".
 *  no-create       No free-text row (free text is still kept on Enter / Tab).
 *  strict          Only listed values: no free-text row, and text that names
 *                  no option goes back to the last value when committed.
 *  empty-text      Shown when nothing matches. Default "No matches".
 *  size            "sm" | "md" (default) | "lg".
 *  name · required · disabled · pattern · minlength · maxlength
 *                  Form participation. pattern / minlength / maxlength apply
 *                  to free text (listed values always pass); maxlength also
 *                  limits typing.
 *
 *  data-* attributes on the host are mirrored onto the inner input.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value            Get / set the value (the option's value, or the free text).
 *  text             The text in the field right now (read only).
 *  selectedOption   { value, label } of the picked option, or null for free text.
 *  options          Get / set the suggestions (same shape as list-data). Wins
 *                   over list-data and child elements.
 *  open() · close() · isOpen   The list.
 *  focus() · blur()
 *  checkValidity() · reportValidity() · validity · validationMessage · form
 *
 *  Setting value / options never fires events.
 *
 * ----------------------------------------------------------------------------
 * VALUE
 * ----------------------------------------------------------------------------
 *  Picking an option: value = the option's value, text = its label.
 *  Committing typed text (Enter, Tab, leaving the field): text that equals an
 *  option's label (case and accents ignored) picks that option; other text is
 *  both value and text (with `strict` it is reverted instead); an empty field
 *  clears the value. Typing alone changes nothing until it is committed.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  input            while typing (the field's own event), and after a commit
 *  change           after every value change made by the user
 *  combobox-change  { value, label, option, previous } (option: null for free text)
 *  combobox-create  { value } a free-text value that is not in the list, so
 *                   an app can store it
 *  combobox-open · combobox-close
 *
 * ----------------------------------------------------------------------------
 * KEYBOARD (ARIA APG editable combobox)
 * ----------------------------------------------------------------------------
 *  Typing filters (case and accents ignored, anywhere in the label) · ↓ opens
 *  and moves down · ↑ moves up · Alt+↓ opens · Alt+↑ closes · PageUp /
 *  PageDown jump · Enter picks the highlighted row, or commits the typed text
 *  when no row is highlighted · Escape closes the list, and on a closed list
 *  clears the field · Tab commits the typed text and moves on · Home / End and
 *  ← / → stay with the caret.
 *
 * ----------------------------------------------------------------------------
 * PLACEMENT
 * ----------------------------------------------------------------------------
 *  As in the select: the list sits in the top layer (popover API), opens below
 *  the field or above when there is no room, lines up with its right edge or
 *  is shifted in, its height capped by the room on screen; it follows the
 *  field while the page scrolls.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES
 * ----------------------------------------------------------------------------
 *  Defaults live in the settings block below; change them on construction.html.
 *  Sizes: --kakao-combobox-sm-height / -sm-padding-x / -lg-height / -lg-padding-x.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  - The field is an input with role="combobox", aria-autocomplete,
 *    aria-expanded and aria-controls; it keeps focus and points at the
 *    highlighted row with aria-activedescendant. Hint and error describe it.
 *  - The list is a listbox; groups are labelled role="group"; the free-text
 *    row is its first option.
 *  - The chevron is a pointer-only button (tabindex -1), as in the APG example.
 *  - A polite status reports how many suggestions match while typing.
 *
 * Panel, rows, groups, option parsing and placement are copied from select.js
 * (components never load each other, and each file stays inlineable): keep the
 * two in step.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-combobox';
  if (customElements.get(TAG_NAME)) return;

  const PAGE_STEP = 8;
  const MARGIN = 8; // the panel keeps this far from the viewport edges

  /** Lower case without accents, for matching. */
  const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg>';

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-combobox- (written by construction.html, edit there) */
        --_bg: var(--kakao-combobox-bg, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-combobox-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-combobox-muted, var(--kakao-color-muted, #62626c));
        --_border: var(--kakao-combobox-border, var(--kakao-color-field-border, #ececef));
        --_hover-bg: var(--kakao-combobox-hover-bg, var(--kakao-color-subtle, #f0f0f1));
        --_focus: var(--kakao-combobox-focus, var(--kakao-color-focus, #2563eb));
        --_danger: var(--kakao-combobox-danger, var(--kakao-color-danger, #dc2626));
        --_panel-bg: var(--kakao-combobox-panel-bg, var(--kakao-color-bg, #ffffff));
        --_line: var(--kakao-combobox-line, var(--kakao-color-line, #e5e7eb));
        --_check: var(--kakao-combobox-check, var(--kakao-color-primary, #4f46e5));
        --_font: var(--kakao-combobox-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_label-weight: var(--kakao-combobox-label-weight, 600);
        --_height: var(--kakao-combobox-height, 44px);
        --_padding-x: var(--kakao-combobox-padding-x, 12px);
        --_label-gap: var(--kakao-combobox-label-gap, 6px);
        --_message-gap: var(--kakao-combobox-message-gap, 5px);
        --_chevron-size: var(--kakao-combobox-chevron-size, 0.9em);
        --_radius: var(--kakao-combobox-radius, 10px);
        --_focus-width: var(--kakao-combobox-focus-width, 2px);
        --_focus-offset: var(--kakao-combobox-focus-offset, 2px);
        --_disabled-opacity: var(--kakao-combobox-disabled-opacity, 0.55);
        --_panel-radius: var(--kakao-combobox-panel-radius, 10px);
        --_panel-padding: var(--kakao-combobox-panel-padding, 4px);
        --_panel-offset: var(--kakao-combobox-panel-offset, 6px);
        --_panel-height: var(--kakao-combobox-panel-height, 20rem);
        --_panel-min-width: var(--kakao-combobox-panel-min-width, 12rem);
        --_panel-shadow: var(--kakao-combobox-panel-shadow, 0 8px 24px rgb(0 0 0 / .08), 0 0 0 1px color-mix(in srgb, var(--kakao-color-text, #18181b) 10%, transparent));
        --_z: var(--kakao-combobox-z, 70);
        --_option-height: var(--kakao-combobox-option-height, 36px);
        --_option-radius: var(--kakao-combobox-option-radius, 6px);
        --_duration: var(--kakao-combobox-duration, 150ms);
        --_ease: var(--kakao-combobox-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        display: block;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) { --_height: var(--kakao-combobox-sm-height, 36px); --_padding-x: var(--kakao-combobox-sm-padding-x, 10px); }
      :host([size="lg"]) { --_height: var(--kakao-combobox-lg-height, 52px); --_padding-x: var(--kakao-combobox-lg-padding-x, 14px); }
      :host([disabled]) { opacity: var(--_disabled-opacity); }

      .label {
        display: block;
        margin: 0 0 var(--_label-gap);
        font-weight: var(--_label-weight);
        font-size: 0.82rem;
        cursor: pointer;
      }
      .label:empty { display: none; }

      /* ---- Field: the text input's field, with a chevron ---- */
      .field {
        display: flex;
        align-items: center;
        box-sizing: border-box;
        min-height: var(--_height);
        padding: 0 var(--_padding-x);
        background: var(--_bg);
        color: var(--_text);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        transition: border-color var(--_duration) var(--_ease), background-color var(--_duration) var(--_ease);
      }
      .field[data-open] { border-color: var(--_focus); }
      .field:has(input:focus-visible) {
        border-color: var(--_focus);
        outline: var(--_focus-width) solid var(--_focus);
        outline-offset: var(--_focus-offset);
      }
      :host([error]) .field { border-color: var(--_danger); }
      :host([error]) .field:has(input:focus-visible) { outline-color: var(--_danger); }

      input {
        flex: 1;
        min-width: 0;
        height: calc(var(--_height) - 2px);
        margin: 0;
        padding: 0;
        border: 0;
        outline: none;
        background: none;
        color: inherit;
        font: inherit;
      }
      input::placeholder { color: var(--_muted); opacity: 1; }
      input:disabled { cursor: not-allowed; }
      /* Font size on the field, so the chevron (em) matches the select's at every size. */
      :host([size="sm"]) .field { font-size: 0.875rem; }
      :host([size="lg"]) .field { font-size: 1rem; }

      /* The chevron sits where the select's does (padding-x from the edge, the
         select's gap before it); the button reaches the field's edge as hit area. */
      .toggle {
        flex: none;
        align-self: stretch;
        display: inline-flex;
        align-items: center;
        margin: 0 calc(var(--_padding-x) * -1) 0 0;
        padding: 0 var(--_padding-x) 0 calc(var(--_padding-x) * 0.6);
        border: 0;
        border-radius: 0 var(--_radius) var(--_radius) 0;
        background: none;
        font: inherit;
        color: var(--_muted);
        cursor: pointer;
      }
      .toggle:disabled { cursor: not-allowed; }
      .toggle svg {
        width: var(--_chevron-size);
        height: var(--_chevron-size);
        fill: none;
        stroke: currentColor;
        stroke-width: 2.4;
        stroke-linecap: round;
        stroke-linejoin: round;
        transition: transform 200ms var(--_ease);
      }
      .field[data-open] .toggle svg { transform: rotate(180deg); }

      .hint, .error { margin: var(--_message-gap) 0 0; font-size: 0.78rem; color: var(--_muted); }
      .hint:empty, .error:empty { display: none; }
      .error { color: var(--_danger); }
      :host([error]) .hint { display: none; }

      .sr {
        position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
        overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
      }

      /* ---- Panel: the dropdown surface (overlay, elevation level 3) ----
         Keep in step with select.js: same panel, rows and groups. */
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
      .panel.is-open { display: flex; animation: kakao-combobox-in var(--_duration) var(--_ease); }
      .panel[data-up] { --_from: 4px; }
      @keyframes kakao-combobox-in {
        from { opacity: 0; transform: translateY(var(--_from, -4px)); }
      }

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

      /* The button menu's check mark. */
      .check { flex: none; display: inline-flex; width: 1.1em; color: var(--_check); visibility: hidden; }
      .check svg { width: 1.1em; height: 1.1em; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
      .row[aria-selected="true"] { font-weight: 600; }
      .row[aria-selected="true"] .check { visibility: visible; }

      /* The free-text row: first, with the select-all row's line under it. */
      .row.create {
        position: sticky;
        top: 0;
        z-index: 1;
        margin-bottom: 1px;
        background: var(--_panel-bg);
        box-shadow: 0 1px 0 var(--_line);
        border-radius: var(--_option-radius) var(--_option-radius) 0 0;
      }
      .row.create[data-alone] { box-shadow: none; margin-bottom: 0; border-radius: var(--_option-radius); }
      .row.create[data-active] { background: var(--_hover-bg); }
      .row.create .check { visibility: visible; color: var(--_muted); }

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
        .field, .toggle svg, .row { transition: none; }
      }
    </style>
    <label class="label" part="label" id="label" for="input"></label>
    <div class="field" part="field">
      <input id="input" part="input" type="text" role="combobox" aria-expanded="false" aria-controls="listbox"
        autocomplete="off" autocapitalize="off" spellcheck="false" />
      <button class="toggle" part="toggle" type="button" tabindex="-1" aria-hidden="true">${CHEVRON}</button>
    </div>
    <p class="hint" part="hint" id="hint"></p>
    <p class="error" part="error" id="error"></p>
    <div class="panel" part="panel" id="panel">
      <div class="list" part="list" id="listbox" role="listbox" tabindex="-1">
        <div class="row create" id="opt-create" role="option" aria-selected="false" hidden>
          <span class="check" aria-hidden="true">${PLUS}</span><span class="lbl"></span>
        </div>
      </div>
      <div class="empty" part="empty"></div>
      <span class="sr" id="status" role="status" aria-live="polite"></span>
    </div>
  `;

  class KakaoCombobox extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['label', 'aria-label', 'hint', 'error', 'placeholder', 'value', 'list-data', 'autocomplete',
        'create-label', 'no-create', 'strict', 'empty-text', 'size', 'name', 'required', 'disabled',
        'pattern', 'minlength', 'maxlength'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      const $ = (sel) => shadow.querySelector(sel);
      this._labelEl = $('.label');
      this._field = $('.field');
      this._input = $('input');
      this._toggle = $('.toggle');
      this._hintEl = $('#hint');
      this._errorEl = $('#error');
      this._panel = $('.panel');
      this._list = $('.list');
      this._createEl = $('.create');
      this._empty = $('.empty');
      this._status = $('#status');
      this._hasPopover = typeof this._panel.showPopover === 'function';
      if (this._hasPopover) this._panel.setAttribute('popover', 'manual');

      this._items = []; // { value, label, disabled, selected (default), group, key, el, hidden }
      this._groups = []; // { label, el }
      this._value = '';
      this._label = ''; // the committed text
      this._optionsProp = null;
      this._typed = false; // the text was typed since the last commit
      this._isOpen = false;
      this._active = -1; // index into _items, 'create', or -1
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
        if (this._source() === 'children' && records.some((r) => r.type !== 'attributes' || r.target !== this)) {
          this._build();
          this._sync();
        }
      });
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      this._connected = true;
      ['options', 'value'].forEach((p) => this._upgrade(p));
      if (!this._initialised) {
        this._initialised = true;
        this._wire();
        this._build();
        if (!this._valueSetByScript) this._setCommitted(this._defaultValue());
        else this._setCommitted(this._value);
      }
      this._observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
      this._sync();
    }

    disconnectedCallback() {
      this._connected = false;
      this._observer.disconnect();
      this.close();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this._initialised) return;
      switch (name) {
        case 'list-data':
          this._build();
          this._setCommitted(this._value);
          break;
        case 'value':
          this._setCommitted(newValue == null ? '' : newValue);
          break;
        case 'disabled':
          this.close();
          break;
        case 'autocomplete':
        case 'no-create':
        case 'strict':
        case 'create-label':
          if (this._isOpen) this._filter();
          break;
        default:
          break;
      }
      this._sync();
    }

    formResetCallback() {
      this.close();
      this._setCommitted(this._defaultValue());
      this._sync();
    }

    formDisabledCallback(disabled) {
      this._formDisabled = disabled;
      this.close();
      this._sync();
    }

    formStateRestoreCallback(state) {
      this._setCommitted(typeof state === 'string' ? state : '');
      this._sync();
    }

    /* -------------------------- Public API -------------------------- */

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(v) { this.toggleAttribute('disabled', !!v); }
    get required() { return this.hasAttribute('required'); }
    set required(v) { this.toggleAttribute('required', !!v); }
    get name() { return this.getAttribute('name') || ''; }
    set name(v) { this.setAttribute('name', v); }
    get isOpen() { return this._isOpen; }
    get text() { return this._input.value; }

    get value() { return this._value; }
    set value(v) {
      this._valueSetByScript = true;
      const next = v == null ? '' : String(v);
      if (!this._initialised) {
        this._value = next;
        return;
      }
      this._setCommitted(next);
      this._sync();
    }

    get selectedOption() {
      const it = this._optionFor(this._value, this._label);
      return it ? { value: it.value, label: it.label } : null;
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
        if (!this._typed) this._setCommitted(this._value);
        this._sync();
      }
    }

    get form() { return this._internals ? this._internals.form : null; }
    get validity() { return this._internals ? this._internals.validity : undefined; }
    get validationMessage() { return this._internals ? this._internals.validationMessage : ''; }
    checkValidity() { return this._internals ? this._internals.checkValidity() : true; }
    reportValidity() { return this._internals ? this._internals.reportValidity() : true; }

    focus(options) { this._input.focus(options); }
    blur() { this._input.blur(); }

    open() { this._open(); }

    close() {
      if (!this._isOpen) return;
      this._isOpen = false;
      this._active = -1;
      if (this._hasPopover && this._panel.matches(':popover-open')) this._panel.hidePopover();
      this._panel.classList.remove('is-open');
      this._field.removeAttribute('data-open');
      this._input.setAttribute('aria-expanded', 'false');
      this._input.removeAttribute('aria-activedescendant');
      document.removeEventListener('pointerdown', this._onDocPointerDown, true);
      window.removeEventListener('scroll', this._onViewport, true);
      window.removeEventListener('resize', this._onViewport);
      cancelAnimationFrame(this._raf);
      this._dispatch('combobox-close', {});
    }

    /* -------------------------- Options (as in select.js) -------------------------- */

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
      Array.from(this.children).forEach((el) => {
        if (el.localName === 'option') out.push(fromOption(el));
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
        if (value === '' && label === '') return;
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
      this._renderList();
      if (this._isOpen) this._filter();
    }

    _defaultValue() {
      if (this.hasAttribute('value')) return this.getAttribute('value');
      const picked = this._items.filter((it) => it.selected);
      return picked.length ? picked[picked.length - 1].value : '';
    }

    /** The option for a value (and, for free text equal to a value, its label). */
    _optionFor(value, label) {
      if (value === '') return null;
      return this._items.find((it) => it.value === value && (label == null || it.label === label))
        || null;
    }

    /** The enabled option whose label equals the text, case and accents ignored. */
    _exact(text) {
      const k = fold(text.trim());
      if (!k) return null;
      return this._items.find((it) => !it.disabled && it.key === k) || null;
    }

    /* -------------------------- Rendering -------------------------- */

    _renderList() {
      const list = this._list;
      Array.from(list.children).forEach((el) => { if (el !== this._createEl) el.remove(); });
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
        row.innerHTML = `<span class="check" aria-hidden="true">${CHECK}</span>`;
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

    /** Selected mark on the row of the current value. */
    _syncRows() {
      const current = this._optionFor(this._value, this._label);
      this._items.forEach((it) => { if (it.el) it.el.setAttribute('aria-selected', String(it === current)); });
    }

    /** Everything that depends on attributes and the value. */
    _sync() {
      const label = this.getAttribute('label') || '';
      this._labelEl.textContent = label;
      const name = label || this.getAttribute('aria-label') || 'Combobox';
      if (label) this._input.removeAttribute('aria-label');
      else this._input.setAttribute('aria-label', name);
      this._list.setAttribute('aria-label', name);
      const disabled = this._isDisabled();
      this._input.disabled = disabled;
      this._toggle.disabled = disabled;
      this._input.placeholder = this.getAttribute('placeholder') || '';
      const ac = this._autocomplete();
      this._input.setAttribute('aria-autocomplete', ac);
      const max = this.getAttribute('maxlength');
      if (max != null && /^\d+$/.test(max)) this._input.maxLength = Number(max);
      else this._input.removeAttribute('maxlength');
      this._empty.textContent = this.getAttribute('empty-text') || 'No matches';

      const hint = this.getAttribute('hint') || '';
      const error = this.getAttribute('error') || '';
      this._hintEl.textContent = hint;
      this._errorEl.textContent = error;
      const described = [hint && !error && 'hint', error && 'error'].filter(Boolean).join(' ');
      if (described) this._input.setAttribute('aria-describedby', described);
      else this._input.removeAttribute('aria-describedby');
      if (error) this._input.setAttribute('aria-invalid', 'true');
      else this._input.removeAttribute('aria-invalid');
      if (this.required) this._input.setAttribute('aria-required', 'true');
      else this._input.removeAttribute('aria-required');

      this._syncRows();
      this._syncForm();
      this._mirrorDataAttrs();
    }

    _autocomplete() {
      const ac = (this.getAttribute('autocomplete') || '').toLowerCase();
      return ac === 'both' || ac === 'none' ? ac : 'list';
    }

    _syncForm() {
      if (!this._internals) return;
      this._internals.setFormValue(this._value);
      const v = this._value;
      const free = v !== '' && !this._optionFor(v, this._label);
      const error = this.getAttribute('error');
      const min = Number(this.getAttribute('minlength'));
      const max = Number(this.getAttribute('maxlength'));
      const pattern = this.getAttribute('pattern');
      let flags = {};
      let message = '';
      if (error) {
        flags = { customError: true };
        message = error;
      } else if (this.required && v === '') {
        flags = { valueMissing: true };
        message = 'Please fill in this field.';
      } else if (free && min > 0 && v.length < min) {
        flags = { tooShort: true };
        message = `Please use at least ${min} characters.`;
      } else if (free && max > 0 && v.length > max) {
        flags = { tooLong: true };
        message = `Please use at most ${max} characters.`;
      } else if (free && pattern && !this._matchesPattern(v, pattern)) {
        flags = { patternMismatch: true };
        message = 'Please match the requested format.';
      }
      if (message) this._internals.setValidity(flags, message, this._input);
      else this._internals.setValidity({});
    }

    /** Anchored like the native pattern attribute (v flag, else u). */
    _matchesPattern(value, pattern) {
      for (const flag of ['v', 'u']) {
        try {
          return new RegExp(`^(?:${pattern})$`, flag).test(value);
        } catch (err) { /* try the next flag */ }
      }
      return true; // an invalid pattern is ignored, as natively
    }

    _mirrorDataAttrs() {
      Array.from(this._input.attributes).forEach((a) => {
        if (a.name.startsWith('data-') && !this.hasAttribute(a.name)) this._input.removeAttribute(a.name);
      });
      Array.from(this.attributes).forEach((a) => {
        if (a.name.startsWith('data-')) this._input.setAttribute(a.name, a.value);
      });
    }

    _isDisabled() {
      return this.disabled || this._formDisabled;
    }

    /* -------------------------- Value -------------------------- */

    /** Sets the committed value and its text without events. */
    _setCommitted(value) {
      this._value = value == null ? '' : String(value);
      const it = this._optionFor(this._value);
      this._label = it ? it.label : this._value;
      this._input.value = this._label;
      this._typed = false;
    }

    /** Commits the text in the field (Enter, Tab, leaving the field). */
    _commitText(forceFree) {
      const text = this._input.value.trim();
      if (text === '') {
        this._change('', '', null);
        return;
      }
      const it = forceFree ? null : this._exact(text);
      if (it) {
        this._change(it.value, it.label, it);
        return;
      }
      if (this.hasAttribute('strict')) {
        this._input.value = this._label; // back to the last value
        this._typed = false;
        return;
      }
      this._change(text, text, null);
    }

    _pickOption(index) {
      const it = this._items[index];
      if (!it || it.disabled) return;
      this._change(it.value, it.label, it);
    }

    /** Applies a user change; events only when the value or text really changed. */
    _change(value, label, option) {
      const previous = this._value;
      const same = value === this._value && label === this._label;
      this._value = value;
      this._label = label;
      this._input.value = label;
      this._typed = false;
      const end = label.length;
      try { this._input.setSelectionRange(end, end); } catch (err) { /* not focusable yet */ }
      if (same) return;
      this._sync();
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      this._dispatch('combobox-change', {
        value, label, option: option ? { value: option.value, label: option.label } : null, previous,
      });
      if (!option && value !== '' && value !== previous) this._dispatch('combobox-create', { value });
    }

    /* -------------------------- Filter and active row -------------------------- */

    /** The text the list is filtered by: the typed part, not an inline completion. */
    _query() {
      const input = this._input;
      if (this._autocomplete() === 'both' && input.selectionEnd === input.value.length && input.selectionStart < input.selectionEnd) {
        return input.value.slice(0, input.selectionStart);
      }
      return input.value;
    }

    _filter() {
      const typed = this._query().trim();
      const q = this._typed && this._autocomplete() !== 'none' ? fold(typed) : '';
      let shown = 0;
      this._items.forEach((it) => {
        it.hidden = q !== '' && !it.key.includes(q);
        it.el.hidden = it.hidden;
        if (!it.hidden) shown++;
      });
      this._groups.forEach((g, gi) => {
        g.el.hidden = !this._items.some((it) => it.group === gi && !it.hidden);
      });
      const whole = this._input.value.trim();
      const create = this._typed && whole !== '' && !this._exact(whole)
        && !this.hasAttribute('strict') && !this.hasAttribute('no-create');
      this._createEl.hidden = !create;
      if (create) {
        const tpl = this.getAttribute('create-label') || 'Use “{text}”';
        this._createEl.querySelector('.lbl').textContent = tpl.split('{text}').join(whole);
      }
      this._createEl.toggleAttribute('data-alone', !shown);
      this._empty.hidden = shown > 0 || create;
      if (!this._navigable().includes(this._active)) this._active = -1;
      this._syncActive();
      if (this._isOpen) this._place();
      this._announce(!this._typed || q === '' ? '' : shown
        ? `${shown} ${shown === 1 ? 'suggestion' : 'suggestions'}`
        : this._empty.textContent);
    }

    _announce(text) {
      clearTimeout(this._statusTimer);
      this._statusTimer = setTimeout(() => { this._status.textContent = text; }, 400);
    }

    /** Keys of the rows the arrows can reach, in order ('create' first). */
    _navigable() {
      const nav = [];
      if (!this._createEl.hidden) nav.push('create');
      this._items.forEach((it, i) => { if (!it.hidden && !it.disabled) nav.push(i); });
      return nav;
    }

    _rowFor(key) {
      return key === 'create' ? this._createEl : (this._items[key] && this._items[key].el);
    }

    _syncActive(center) {
      this._list.querySelectorAll('.row[data-active]').forEach((r) => r.removeAttribute('data-active'));
      const row = this._rowFor(this._active);
      if (!row || row.hidden) {
        this._input.removeAttribute('aria-activedescendant');
        return;
      }
      row.setAttribute('data-active', '');
      this._input.setAttribute('aria-activedescendant', row.id);
      if (this._active === 'create') return; // sticky, always in view
      const list = this._list;
      const sticky = this._createEl.hidden ? 0 : this._createEl.offsetHeight;
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

    /* -------------------------- Open / place (as in select.js) -------------------------- */

    _open() {
      if (this._isOpen || this._isDisabled() || !this._connected) return;
      this._isOpen = true;
      this._status.textContent = '';
      this._panel.removeAttribute('data-up');
      this._panel.style.removeProperty('--_room');
      if (this._hasPopover) {
        try { this._panel.showPopover(); } catch (err) { /* already open */ }
      }
      this._panel.classList.add('is-open');
      this._field.setAttribute('data-open', '');
      this._input.setAttribute('aria-expanded', 'true');
      this._active = -1;
      this._filter();
      this._place(true);
      // Untyped: show where the current value sits.
      const current = this._optionFor(this._value, this._label);
      if (!this._typed && current && !current.hidden) {
        this._active = this._items.indexOf(current);
        this._syncActive(true);
        if (this._autocomplete() !== 'none') this._active = -1; // shown, not highlighted until an arrow
        this._syncActive();
      }
      document.addEventListener('pointerdown', this._onDocPointerDown, true);
      window.addEventListener('scroll', this._onViewport, true);
      window.addEventListener('resize', this._onViewport);
      this._dispatch('combobox-open', {});
    }

    /**
     * Places the panel against the field (fixed, in the top layer): below, or
     * above when there's no room below and more above; left-aligned, else
     * right-aligned, else clamped to the viewport. The side is chosen on open
     * (and on resize), so typing doesn't flip it.
     */
    _place(chooseSide) {
      if (!this._isOpen) return;
      const panel = this._panel;
      const r = this._field.getBoundingClientRect();
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
      if (!e.composedPath().includes(this)) this.close();
    }

    /* -------------------------- Interaction -------------------------- */

    _wire() {
      const input = this._input;
      input.addEventListener('keydown', (e) => this._onKey(e));
      input.addEventListener('input', (e) => this._onInput(e));
      input.addEventListener('click', () => {
        if (!this._isOpen) this._open();
      });
      // The chevron and the panel must not take focus from the field.
      this._toggle.addEventListener('mousedown', (e) => e.preventDefault());
      this._toggle.addEventListener('click', () => {
        if (this._isDisabled()) return;
        if (this._isOpen) this.close();
        else this._open();
        input.focus({ preventScroll: true });
      });
      this._panel.addEventListener('mousedown', (e) => e.preventDefault());
      this._list.addEventListener('click', (e) => {
        const row = e.target.closest('.row');
        if (!row || row.getAttribute('aria-disabled') === 'true') return;
        this.close();
        if (row === this._createEl) this._commitText(true);
        else this._pickOption(Number(row.dataset.index));
        input.focus({ preventScroll: true });
      });
      // Hover follows the mouse, as in the select and the button menu.
      this._list.addEventListener('pointermove', (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        const row = e.target.closest('.row');
        if (!row || row.getAttribute('aria-disabled') === 'true') return;
        const key = row === this._createEl ? 'create' : Number(row.dataset.index);
        if (key === this._active) return;
        this._active = key;
        this._syncActive();
      });
      // Leaving the component commits the typed text.
      this.shadowRoot.addEventListener('focusout', (e) => {
        const to = e.relatedTarget;
        if (to && this.shadowRoot.contains(to)) return;
        this.close();
        if (this._typed || this._input.value !== this._label) this._commitText(false);
      });
    }

    _onInput(e) {
      this._typed = true;
      if (!this._isOpen) this._open();
      this._active = -1;
      this._filter();
      // Inline completion of the first match that starts with the text.
      if (this._autocomplete() === 'both' && e.inputType && e.inputType.startsWith('insert')) {
        const input = this._input;
        const typed = input.value;
        const caret = input.selectionStart;
        const k = fold(typed);
        const index = k && caret === typed.length
          ? this._items.findIndex((it) => !it.hidden && !it.disabled && it.key.startsWith(k)
            && fold(it.label.slice(0, typed.length)) === k)
          : -1;
        if (index > -1) {
          const label = this._items[index].label;
          input.value = typed + label.slice(typed.length);
          input.setSelectionRange(typed.length, input.value.length);
          this._filter(); // the "Use" row follows the completed text
          this._active = index;
          this._syncActive();
        }
      }
    }

    _onKey(e) {
      if (this._isDisabled()) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!this._isOpen) {
            this._open();
            if (e.altKey) break;
            // Start on the current value when it is shown, else on the first row.
            const current = this._optionFor(this._value, this._label);
            if (!this._typed && current && !current.hidden && !current.disabled) {
              this._active = this._items.indexOf(current);
              this._syncActive();
            } else {
              this._move(1);
            }
          } else if (!e.altKey) {
            this._move(1);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (e.altKey) {
            this.close();
          } else if (!this._isOpen) {
            this._open();
            this._move(-1);
          } else {
            this._move(-1);
          }
          break;
        case 'PageDown':
          if (this._isOpen) { e.preventDefault(); this._move(PAGE_STEP); }
          break;
        case 'PageUp':
          if (this._isOpen) { e.preventDefault(); this._move(-PAGE_STEP); }
          break;
        case 'Enter': {
          if (e.isComposing) return;
          const wasOpen = this._isOpen;
          const active = this._active;
          if (wasOpen) e.preventDefault();
          this.close();
          if (active === 'create') this._commitText(true);
          else if (typeof active === 'number' && active > -1) this._pickOption(active);
          else this._commitText(false);
          break;
        }
        case 'Escape':
          if (this._isOpen) {
            e.preventDefault();
            e.stopPropagation(); // don't also close a surrounding dialog or sheet
            this.close();
            // An inline completion goes away with the list.
            const q = this._query();
            if (q !== this._input.value) this._input.value = q;
          } else if (this._input.value !== '') {
            e.preventDefault();
            e.stopPropagation();
            this._input.value = '';
            this._commitText(false);
          }
          break;
        case 'Tab':
          // Commit before focus moves on; focusout then finds nothing to do.
          this.close();
          if (this._typed || this._input.value !== this._label) this._commitText(false);
          break;
        default:
          break;
      }
    }

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
  }

  customElements.define(TAG_NAME, KakaoCombobox);
})();
