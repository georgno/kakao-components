/**
 * <kakao-tag-input>
 * ============================================================================
 * A field for a list of short free-text values (tags, keywords, recipients):
 * the typed text becomes a chip on Enter or a delimiter (comma by default),
 * the chips sit in the field, wrap to more lines, and the text field takes
 * the room left on the last line. The field looks like the text input (label,
 * hint, error, three sizes); the tags are real <kakao-chip>s; optional
 * suggestions open in the select's dropdown panel. Form-associated: one form
 * entry per tag. Vanilla JS, Shadow DOM, no deps.
 *
 * Needs components/chip/chip.js on the page for the chips (until it loads,
 * the tags show as plain grey labels without the remove button).
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="../chip/chip.js"><\/script>
 *   <script src="tag-input.js"><\/script>
 *
 *   <kakao-tag-input label="Keywords" name="keywords" value="design, tokens"
 *                    placeholder="Add a keyword"></kakao-tag-input>
 *
 *   <kakao-tag-input label="Labels" max-tags="5" delimiters=",;"
 *     list-data='["Bug","Feature","Docs","Design"]'></kakao-tag-input>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  label             Visible label above the field.
 *  aria-label        Accessible name when there is no visible label.
 *  hint              Helper text below the field (hidden while there is an error).
 *  error             Error text: danger border and message, aria-invalid, and
 *                    the validation message.
 *  placeholder       Placeholder of the text field, shown while there are no tags.
 *  value             The tags: a comma-separated list ("a, b, c"; spaces around
 *                    each tag are trimmed), or a JSON array for tags that contain
 *                    commas ('["Smith, J.", "Doe"]'). The initial value: it is
 *                    not rewritten as the user edits; form reset goes back to it.
 *  name              Form field name. The form gets one entry per tag
 *                    (name=a&name=b), like a multiple select.
 *  delimiters        Characters that end a tag while typing, each one on its own.
 *                    Default ",". Enter always ends a tag. Pasted text is split
 *                    on these and on line breaks and tabs.
 *  max-tags          Most tags allowed. Further ones are refused (announced).
 *  allow-duplicates  Allow the same tag twice. Without it a tag that is already
 *                    there (ignoring case) is refused, the existing chip flashes
 *                    and the text stays in the field.
 *  list-data         JSON array of suggestion strings (never "data"). While the
 *                    user types, matching ones that are not tags yet open in a
 *                    list below the field (case and accents ignored, anywhere
 *                    in the text). Free text is always allowed.
 *  size              "sm" | "md" (default) | "lg".
 *  disabled          No editing, no remove buttons, not submitted.
 *  readonly          Tags shown and submitted, but not changed: no remove
 *                    buttons, the text field is read-only.
 *  required          At least one tag (valueMissing otherwise).
 *
 *  data-* attributes on the host are mirrored onto the inner text field.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value          Get / set the tags as one string: comma-joined, or a JSON
 *                 array when a tag contains a comma. Setting parses like the
 *                 attribute.
 *  values         Get / set the tags as an array of strings.
 *  suggestions    Get / set the suggestions (array of strings). Wins over
 *                 list-data.
 *  add(text)      Adds a tag as if typed (refused when empty, a duplicate or
 *                 over max-tags); returns true when it was added.
 *  remove(text)   Removes the first tag equal to text (ignoring case);
 *                 returns true when one was removed.
 *  clear()        Removes every tag.
 *  text           The text typed in the field right now (read only).
 *  focus() · blur()
 *  checkValidity() · reportValidity() · validity · validationMessage · form
 *
 *  Calls through the API never fire events.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  tag-add      { value }  cancelable, before a tag the user entered is added.
 *               Cancelling keeps the text in the field. Change detail.value
 *               is not read back: cancel and call add() to rewrite a tag.
 *  tag-remove   { value }  cancelable, before a tag is removed by the user.
 *  change       after the user added or removed tags (once per action, also
 *               for a paste that adds several).
 *  input        the text field's own event while typing.
 *
 * ----------------------------------------------------------------------------
 * KEYBOARD
 * ----------------------------------------------------------------------------
 *  In the text field: Enter or a delimiter adds the text as a tag ·
 *  Backspace in an empty field selects the last tag (a second Backspace
 *  removes it) · ← at the start of the text selects the last tag ·
 *  ↓ / ↑ move through open suggestions, Enter picks one · Escape closes them ·
 *  Tab adds the typed text and moves on.
 *  On a selected tag: ← / → previous / next tag (→ from the last returns to the
 *  text field) · Home / End first tag / text field · Backspace removes it and
 *  selects the one before · Delete removes it and selects the one after ·
 *  Enter or Space on its × removes it · Escape or typing returns to the text
 *  field.
 *  Tab does not stop on every tag: the tags are reached with the arrow keys.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES
 * ----------------------------------------------------------------------------
 *  Defaults live in the settings block below; change them on construction.html.
 *  Sizes: --kakao-tag-input-sm-height / -sm-padding-x / -sm-padding-y and the
 *  -lg- ones. The chips themselves follow --kakao-chip-* (chip.js).
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  - The tags are a list (role="list", named after the label); each chip is a
 *    listitem whose × is a button named "Remove <tag>".
 *  - The text field is labelled by the label and described by hint and error.
 *    With suggestions it is a combobox (aria-expanded, aria-controls,
 *    aria-activedescendant over a listbox); focus stays in the field.
 *  - A polite status announces added, removed and refused tags.
 *  - Focus is the shared 2px outline: on the field while typing, on a chip's ×
 *    (and the chip turns ink) while a tag is selected.
 *
 * The panel and its rows are copied from combobox.js (components never load
 * each other's code, and each file stays inlineable): keep them in step.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-tag-input';
  if (customElements.get(TAG_NAME)) return;

  const MARGIN = 8; // the panel keeps this far from the viewport edges
  const FLASH_MS = 900; // a refused duplicate's chip flashes this long

  /** Lower case without accents, for matching. */
  const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const tidy = (s) => String(s).replace(/\s+/g, ' ').trim();
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-tag-input- (written by construction.html, edit there) */
        --_bg: var(--kakao-tag-input-bg, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-tag-input-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-tag-input-muted, var(--kakao-color-muted, #62626c));
        --_border: var(--kakao-tag-input-border, var(--kakao-color-field-border, #ececef));
        --_hover-bg: var(--kakao-tag-input-hover-bg, var(--kakao-color-subtle, #f0f0f1));
        --_focus: var(--kakao-tag-input-focus, var(--kakao-color-focus, #2563eb));
        --_danger: var(--kakao-tag-input-danger, var(--kakao-color-danger, #dc2626));
        --_selected-bg: var(--kakao-tag-input-selected-bg, var(--kakao-color-ink, #18181b));
        --_selected-text: var(--kakao-tag-input-selected-text, var(--kakao-color-on-ink, #fafafa));
        --_panel-bg: var(--kakao-tag-input-panel-bg, var(--kakao-color-bg, #ffffff));
        --_font: var(--kakao-tag-input-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_label-weight: var(--kakao-tag-input-label-weight, 600);
        --_height: var(--kakao-tag-input-height, 44px);
        --_padding-x: var(--kakao-tag-input-padding-x, 12px);
        --_padding-y: var(--kakao-tag-input-padding-y, 5px);
        --_gap: var(--kakao-tag-input-gap, 6px);
        --_row-gap: var(--kakao-tag-input-row-gap, 4px);
        --_text-min-width: var(--kakao-tag-input-text-min-width, 6rem);
        --_label-gap: var(--kakao-tag-input-label-gap, 6px);
        --_message-gap: var(--kakao-tag-input-message-gap, 5px);
        --_radius: var(--kakao-tag-input-radius, 10px);
        --_focus-width: var(--kakao-tag-input-focus-width, 2px);
        --_focus-offset: var(--kakao-tag-input-focus-offset, 2px);
        --_disabled-opacity: var(--kakao-tag-input-disabled-opacity, 0.55);
        --_panel-radius: var(--kakao-tag-input-panel-radius, 10px);
        --_panel-padding: var(--kakao-tag-input-panel-padding, 4px);
        --_panel-offset: var(--kakao-tag-input-panel-offset, 6px);
        --_panel-height: var(--kakao-tag-input-panel-height, 20rem);
        --_panel-min-width: var(--kakao-tag-input-panel-min-width, 12rem);
        --_panel-shadow: var(--kakao-tag-input-panel-shadow, 0 8px 24px rgb(0 0 0 / .08), 0 0 0 1px color-mix(in srgb, var(--kakao-color-text, #18181b) 10%, transparent));
        --_z: var(--kakao-tag-input-z, 70);
        --_option-height: var(--kakao-tag-input-option-height, 36px);
        --_option-radius: var(--kakao-tag-input-option-radius, 6px);
        --_duration: var(--kakao-tag-input-duration, 150ms);
        --_ease: var(--kakao-tag-input-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        /* The chips' own height, so they sit centred in a line of the field. */
        --_chip-height: var(--kakao-chip-height, 1.5rem);
        --_line: calc(var(--_height) - 2px - 2 * var(--_padding-y));
        --_inset: max(var(--_padding-y), calc((var(--_height) - 2px - var(--_chip-height)) / 2));
        display: block;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) {
        --_height: var(--kakao-tag-input-sm-height, 36px);
        --_padding-x: var(--kakao-tag-input-sm-padding-x, 10px);
        --_padding-y: var(--kakao-tag-input-sm-padding-y, 3px);
      }
      :host([size="lg"]) {
        --_height: var(--kakao-tag-input-lg-height, 52px);
        --_padding-x: var(--kakao-tag-input-lg-padding-x, 14px);
        --_padding-y: var(--kakao-tag-input-lg-padding-y, 7px);
      }
      :host([disabled]) { opacity: var(--_disabled-opacity); }

      .label {
        display: block;
        margin: 0 0 var(--_label-gap);
        font-weight: var(--_label-weight);
        font-size: 0.82rem;
        cursor: pointer;
      }
      .label:empty { display: none; }

      /* ---- Field: the text input's field; chips and text wrap inside ---- */
      .field {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        column-gap: var(--_gap);
        row-gap: var(--_row-gap);
        box-sizing: border-box;
        min-height: var(--_height);
        padding: var(--_padding-y) var(--_padding-x) var(--_padding-y) var(--_inset);
        background: var(--_bg);
        color: var(--_text);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        cursor: text;
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
      :host([disabled]) .field { cursor: not-allowed; }

      .tags { display: contents; }

      kakao-chip { outline: none; }
      /* The selected tag (keyboard focus on its ×, or a click on it) turns ink. */
      kakao-chip:focus-within {
        --kakao-chip-bg: var(--_selected-bg);
        --kakao-chip-text: var(--_selected-text);
        --kakao-chip-meta-text: var(--_selected-text);
      }
      kakao-chip.is-new { animation: kakao-tag-input-in var(--_duration) var(--_ease); }
      @keyframes kakao-tag-input-in {
        from { opacity: 0; transform: scale(0.85); }
      }
      /* Until chip.js has loaded: a plain grey label. */
      kakao-chip:not(:defined) {
        display: inline-flex;
        align-items: center;
        height: var(--_chip-height);
        padding: 0 0.45rem;
        border-radius: 4px;
        background: var(--kakao-color-subtle-strong, #e6e6e8);
        font-size: 0.75rem;
        font-weight: 600;
      }

      input {
        flex: 1 1 var(--_text-min-width);
        min-width: var(--_text-min-width);
        box-sizing: border-box;
        height: var(--_line);
        margin: 0;
        padding: 0;
        border: 0;
        outline: none;
        background: none;
        color: inherit;
        font: inherit;
      }
      /* Without tags the text starts where the text input's does. */
      .field:not([data-has-tags]) input { padding-left: max(0px, calc(var(--_padding-x) - var(--_inset))); }
      input::placeholder { color: var(--_muted); opacity: 1; }
      input:disabled { cursor: not-allowed; }
      :host([size="sm"]) .field { font-size: 0.875rem; }
      :host([size="lg"]) .field { font-size: 1rem; }

      .hint, .error { margin: var(--_message-gap) 0 0; font-size: 0.78rem; color: var(--_muted); }
      .hint:empty, .error:empty { display: none; }
      .error { color: var(--_danger); }
      :host([error]) .hint { display: none; }

      .sr {
        position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
        overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
      }

      /* ---- Panel: the combobox's dropdown surface (overlay, elevation level 3) ----
         Keep in step with combobox.js. */
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
      .panel.is-open { display: flex; animation: kakao-tag-input-panel-in var(--_duration) var(--_ease); }
      .panel[data-up] { --_from: 4px; }
      @keyframes kakao-tag-input-panel-in {
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
        box-sizing: border-box;
        min-height: var(--_option-height);
        padding: 0.4rem 0.6rem;
        border-radius: var(--_option-radius);
        line-height: 1.3;
        cursor: pointer;
        user-select: none;
        overflow-wrap: anywhere;
        transition: background-color var(--_duration) var(--_ease);
      }
      .row[data-active] { background: var(--_hover-bg); }

      @media (prefers-reduced-motion: reduce) {
        .panel.is-open, kakao-chip.is-new { animation: none; }
        .field, .row { transition: none; }
      }
      @media (forced-colors: active) {
        kakao-chip:focus-within { outline: 2px solid Highlight; outline-offset: 2px; }
        .row[data-active] { outline: 2px solid Highlight; outline-offset: -2px; }
        .panel { border: 1px solid CanvasText; }
      }
    </style>
    <label class="label" part="label" id="label" for="input"></label>
    <div class="field" part="field">
      <span class="tags" part="tags" role="list"></span>
      <input id="input" part="input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" />
    </div>
    <p class="hint" part="hint" id="hint"></p>
    <p class="error" part="error" id="error"></p>
    <span class="sr" id="status" role="status" aria-live="polite"></span>
    <div class="panel" part="panel" id="panel">
      <div class="list" part="list" id="listbox" role="listbox" tabindex="-1"></div>
    </div>
  `;

  class KakaoTagInput extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['label', 'aria-label', 'hint', 'error', 'placeholder', 'value', 'name', 'delimiters',
        'max-tags', 'allow-duplicates', 'list-data', 'size', 'disabled', 'readonly', 'required'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      const $ = (sel) => shadow.querySelector(sel);
      this._labelEl = $('.label');
      this._field = $('.field');
      this._tagsEl = $('.tags');
      this._input = $('input');
      this._hintEl = $('#hint');
      this._errorEl = $('#error');
      this._status = $('#status');
      this._panel = $('.panel');
      this._list = $('.list');
      this._hasPopover = typeof this._panel.showPopover === 'function';
      if (this._hasPopover) this._panel.setAttribute('popover', 'manual');

      this._tags = []; // strings, in order
      this._chips = []; // the <kakao-chip> of each tag
      this._suggestionsProp = null;
      this._matches = []; // suggestions shown in the panel
      this._active = -1;
      this._isOpen = false;
      this._up = false;
      this._formDisabled = false;
      this._connected = false;
      this._initialised = false;
      this._valueSetByScript = false;
      this._raf = 0;
      this._statusTimer = 0;

      this._onDocPointerDown = this._onDocPointerDown.bind(this);
      this._onViewport = this._onViewport.bind(this);
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      this._connected = true;
      ['value', 'values', 'suggestions'].forEach((p) => this._upgrade(p));
      if (!this._initialised) {
        this._initialised = true;
        this._wire();
        if (!this._valueSetByScript) this._setTags(this._parse(this.getAttribute('value')));
      }
      this._sync();
    }

    disconnectedCallback() {
      this._connected = false;
      this._close();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this._initialised) return;
      if (name === 'value') this._setTags(this._parse(newValue));
      if (name === 'disabled' || name === 'readonly') this._close();
      this._sync();
    }

    formResetCallback() {
      this._close();
      this._input.value = '';
      this._setTags(this._parse(this.getAttribute('value')));
      this._sync();
    }

    formDisabledCallback(disabled) {
      this._formDisabled = disabled;
      this._close();
      this._sync();
    }

    formStateRestoreCallback(state) {
      if (state instanceof FormData) this._setTags(state.getAll(this.getAttribute('name') || '').map(String));
      else if (typeof state === 'string') this._setTags(this._parse(state));
      this._sync();
    }

    /* -------------------------- Public API -------------------------- */

    get value() {
      return this._tags.some((t) => t.includes(',')) ? JSON.stringify(this._tags) : this._tags.join(',');
    }

    set value(v) {
      this._valueSetByScript = true;
      this._setTags(Array.isArray(v) ? v : this._parse(v));
      if (this._initialised) this._sync();
    }

    get values() { return this._tags.slice(); }
    set values(v) { this.value = Array.isArray(v) ? v : v == null ? [] : [v]; }

    get suggestions() { return this._suggestionList().slice(); }
    set suggestions(list) {
      this._suggestionsProp = Array.isArray(list) ? list.map((s) => tidy(s)).filter(Boolean) : null;
      if (this._isOpen) this._filter();
    }

    get text() { return this._input.value; }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(v) { this.toggleAttribute('disabled', !!v); }
    get readOnly() { return this.hasAttribute('readonly'); }
    set readOnly(v) { this.toggleAttribute('readonly', !!v); }
    get required() { return this.hasAttribute('required'); }
    set required(v) { this.toggleAttribute('required', !!v); }
    get name() { return this.getAttribute('name') || ''; }
    set name(v) { this.setAttribute('name', v); }

    get form() { return this._internals ? this._internals.form : null; }
    get validity() { return this._internals ? this._internals.validity : undefined; }
    get validationMessage() { return this._internals ? this._internals.validationMessage : ''; }
    checkValidity() { return this._internals ? this._internals.checkValidity() : true; }
    reportValidity() { return this._internals ? this._internals.reportValidity() : true; }

    focus(options) { this._input.focus(options); }
    blur() { this._input.blur(); }

    add(text) {
      const t = tidy(text == null ? '' : text);
      if (!t || this._refusal(t)) return false;
      this._appendTag(t, false);
      this._sync();
      return true;
    }

    remove(text) {
      const k = fold(tidy(text == null ? '' : text));
      const i = this._tags.findIndex((t) => fold(t) === k);
      if (i < 0) return false;
      this._removeAt(i);
      this._sync();
      return true;
    }

    clear() {
      this._setTags([]);
      this._sync();
    }

    /* -------------------------- Tags -------------------------- */

    _upgrade(prop) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const v = this[prop];
        delete this[prop];
        this[prop] = v;
      }
    }

    /** "a, b" or '["a", "b"]' to a list of tags (as the select's multiple value). */
    _parse(raw) {
      if (raw == null) return [];
      const text = String(raw).trim();
      if (!text) return [];
      if (text.startsWith('[')) {
        try {
          const arr = JSON.parse(text);
          if (Array.isArray(arr)) return arr.map((s) => tidy(s)).filter(Boolean);
        } catch (err) { /* fall through to the comma list */ }
      }
      return text.split(',').map(tidy).filter(Boolean);
    }

    _maxTags() {
      const n = parseInt(this.getAttribute('max-tags'), 10);
      return Number.isFinite(n) && n > 0 ? n : Infinity;
    }

    _indexOf(text) {
      const k = fold(text);
      return this._tags.findIndex((t) => fold(t) === k);
    }

    /** Why a tag can't be added: 'limit', 'duplicate', or '' when it can. */
    _refusal(text) {
      if (this._tags.length >= this._maxTags()) return 'limit';
      if (!this.hasAttribute('allow-duplicates') && this._indexOf(text) > -1) return 'duplicate';
      return '';
    }

    /** Replaces every tag (script, attribute, reset): no events. */
    _setTags(list) {
      this._chips.forEach((c) => c.remove());
      this._tags = [];
      this._chips = [];
      const max = this._maxTags();
      list.forEach((t) => {
        const tag = tidy(t);
        if (!tag || this._tags.length >= max) return;
        if (!this.hasAttribute('allow-duplicates') && this._indexOf(tag) > -1) return;
        this._appendTag(tag, false);
      });
    }

    _appendTag(text, animate) {
      const chip = document.createElement('kakao-chip');
      chip.setAttribute('role', 'listitem');
      chip.setAttribute('value', text);
      chip.tabIndex = -1; // reached with the arrow keys, not Tab
      chip.textContent = text;
      if (animate) {
        chip.classList.add('is-new');
        chip.addEventListener('animationend', () => chip.classList.remove('is-new'), { once: true });
      }
      this._tagsEl.appendChild(chip);
      this._tags.push(text);
      this._chips.push(chip);
      this._syncChip(chip);
    }

    _removeAt(i) {
      const [chip] = this._chips.splice(i, 1);
      this._tags.splice(i, 1);
      if (chip) chip.remove();
    }

    _editable() {
      return !this._isDisabled() && !this.hasAttribute('readonly');
    }

    _isDisabled() {
      return this.disabled || this._formDisabled;
    }

    /**
     * Adds tags the user entered, with tag-add for each; one change at the
     * end. Returns the texts that were refused or cancelled.
     */
    _userAdd(texts) {
      const kept = [];
      let added = 0;
      texts.map(tidy).filter(Boolean).forEach((text) => {
        const why = this._refusal(text);
        if (why === 'limit') {
          this._announce(`No more than ${this._maxTags()} tags.`);
          kept.push(text);
          return;
        }
        if (why === 'duplicate') {
          this._flash(this._indexOf(text));
          this._announce(`“${text}” is already added.`);
          kept.push(text);
          return;
        }
        if (!this._dispatch('tag-add', { value: text }, true)) {
          kept.push(text);
          return;
        }
        this._appendTag(text, true);
        added += 1;
        this._announce(added === 1 ? `Added ${text}.` : `Added ${added} tags.`);
      });
      if (added) {
        this._sync();
        this._dispatch('change');
      }
      return kept;
    }

    /** Removes tag i for the user (tag-remove, change) and moves focus on. */
    _userRemove(i, toward) {
      if (!this._editable() || i < 0 || i >= this._tags.length) return;
      const text = this._tags[i];
      if (!this._dispatch('tag-remove', { value: text }, true)) return;
      const hadFocus = this._chips[i].matches(':focus-within');
      this._removeAt(i);
      this._announce(`Removed ${text}.`);
      this._sync();
      this._dispatch('change');
      if (!hadFocus && toward !== 'click') return;
      // Focus stays near: the tag before (Backspace) or after (Delete, ×).
      let next = toward === 'previous' ? i - 1 : i;
      if (toward === 'previous' && next < 0) next = 0;
      if (next >= 0 && next < this._chips.length) this._focusChip(next);
      else this._input.focus({ preventScroll: true });
    }

    _commitText() {
      const text = this._input.value;
      if (!tidy(text)) {
        this._input.value = '';
        return false;
      }
      const kept = this._userAdd([text]);
      this._input.value = kept.length ? text : '';
      if (this._isOpen) this._filter();
      return kept.length === 0;
    }

    _flash(i) {
      const chip = this._chips[i];
      if (!chip) return;
      clearTimeout(chip._kakaoFlash);
      chip.setAttribute('tone', 'danger');
      chip._kakaoFlash = setTimeout(() => chip.removeAttribute('tone'), FLASH_MS);
    }

    _focusChip(i) {
      const chip = this._chips[i];
      if (!chip) return;
      // The chip's × when it has one, else the chip itself (readonly).
      if (chip.hasAttribute('removable') && typeof chip.focusRemove === 'function') chip.focusRemove();
      if (!chip.matches(':focus-within')) HTMLElement.prototype.focus.call(chip, { preventScroll: false });
    }

    _chipIndex(e) {
      const chip = e.composedPath().find((n) => n.localName === 'kakao-chip' && n.parentNode === this._tagsEl);
      return chip ? this._chips.indexOf(chip) : -1;
    }

    _delimiters() {
      const d = this.getAttribute('delimiters');
      return d == null ? ',' : d;
    }

    /* -------------------------- Rendering -------------------------- */

    _sync() {
      if (!this._initialised) return;
      const label = this.getAttribute('label') || '';
      const name = label || this.getAttribute('aria-label') || this.getAttribute('placeholder') || 'Tags';
      this._labelEl.textContent = label;
      if (label) {
        this._input.setAttribute('aria-labelledby', 'label');
        this._input.removeAttribute('aria-label');
      } else {
        this._input.removeAttribute('aria-labelledby');
        this._input.setAttribute('aria-label', name);
      }
      this._tagsEl.setAttribute('aria-label', name);
      this._tagsEl.hidden = this._tags.length === 0;
      this._field.toggleAttribute('data-has-tags', this._tags.length > 0);

      this._input.placeholder = this._tags.length ? '' : (this.getAttribute('placeholder') || '');
      this._input.disabled = this._isDisabled();
      this._input.readOnly = this.hasAttribute('readonly');

      if (this._hasSuggestions()) {
        this._input.setAttribute('role', 'combobox');
        this._input.setAttribute('aria-autocomplete', 'list');
        this._input.setAttribute('aria-controls', 'listbox');
        this._input.setAttribute('aria-expanded', String(this._isOpen));
      } else {
        ['role', 'aria-autocomplete', 'aria-controls', 'aria-expanded', 'aria-activedescendant']
          .forEach((a) => this._input.removeAttribute(a));
      }
      this._list.setAttribute('aria-label', name);

      const hint = this.getAttribute('hint') || '';
      const error = this.getAttribute('error') || '';
      this._hintEl.textContent = hint;
      this._errorEl.textContent = error;
      const describedBy = [hint && 'hint', error && 'error'].filter(Boolean).join(' ');
      if (describedBy) this._input.setAttribute('aria-describedby', describedBy);
      else this._input.removeAttribute('aria-describedby');
      if (error) this._input.setAttribute('aria-invalid', 'true');
      else this._input.removeAttribute('aria-invalid');

      this._chips.forEach((c) => this._syncChip(c));
      this._syncForm();
      this._mirrorDataAttrs();
    }

    _syncChip(chip) {
      chip.toggleAttribute('removable', this._editable());
    }

    _syncForm() {
      if (!this._internals) return;
      const name = this.getAttribute('name');
      if (name && this._tags.length && !this._isDisabled()) {
        const fd = new FormData();
        this._tags.forEach((t) => fd.append(name, t));
        this._internals.setFormValue(fd);
      } else {
        this._internals.setFormValue(null);
      }
      const error = this.getAttribute('error');
      if (error) this._internals.setValidity({ customError: true }, error, this._input);
      else if (this.required && !this._tags.length) {
        this._internals.setValidity({ valueMissing: true }, 'Please add at least one tag.', this._input);
      } else {
        this._internals.setValidity({});
      }
    }

    /** data-* on the host is mirrored onto the text field (Yii and other hooks). */
    _mirrorDataAttrs() {
      Array.from(this._input.attributes).forEach((a) => {
        if (a.name.startsWith('data-') && !this.hasAttribute(a.name)) this._input.removeAttribute(a.name);
      });
      Array.from(this.attributes).forEach((a) => {
        if (a.name.startsWith('data-')) this._input.setAttribute(a.name, a.value);
      });
    }

    _announce(text) {
      clearTimeout(this._statusTimer);
      this._status.textContent = '';
      this._statusTimer = setTimeout(() => { this._status.textContent = text; }, 50);
    }

    /* -------------------------- Suggestions -------------------------- */

    _suggestionList() {
      if (this._suggestionsProp) return this._suggestionsProp;
      const raw = this.getAttribute('list-data');
      if (!raw) return [];
      if (raw !== this._parsedRaw) {
        this._parsedRaw = raw;
        try {
          const parsed = JSON.parse(raw);
          this._parsedList = Array.isArray(parsed)
            ? parsed.map((s) => tidy(s && typeof s === 'object' ? s.value : s)).filter(Boolean)
            : [];
        } catch (err) {
          console.error(`<${TAG_NAME}> failed to parse list-data as JSON:`, err);
          this._parsedList = [];
        }
      }
      return this._parsedList;
    }

    _hasSuggestions() {
      return this._suggestionList().length > 0;
    }

    /** Fills the list with the suggestions that match the text; closes when none. */
    _filter() {
      const q = fold(tidy(this._input.value));
      const dupes = !this.hasAttribute('allow-duplicates');
      this._matches = this._suggestionList().filter((s) => (!q || fold(s).includes(q))
        && !(dupes && this._indexOf(s) > -1));
      this._list.textContent = '';
      this._matches.forEach((s, i) => {
        const row = document.createElement('div');
        row.className = 'row';
        row.id = `opt-${i}`;
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', 'false');
        row.dataset.index = String(i);
        row.textContent = s;
        this._list.appendChild(row);
      });
      this._active = -1;
      this._syncActive();
      if (!this._matches.length) this._close();
      else if (this._isOpen) this._place(false);
    }

    _open() {
      if (this._isOpen || !this._editable() || !this._connected || !this._hasSuggestions()) return;
      this._filter();
      if (!this._matches.length) return;
      this._isOpen = true;
      this._panel.removeAttribute('data-up');
      if (this._hasPopover) {
        try { this._panel.showPopover(); } catch (err) { /* already open */ }
      }
      this._panel.classList.add('is-open');
      this._field.setAttribute('data-open', '');
      this._input.setAttribute('aria-expanded', 'true');
      this._place(true);
      document.addEventListener('pointerdown', this._onDocPointerDown, true);
      window.addEventListener('scroll', this._onViewport, true);
      window.addEventListener('resize', this._onViewport);
    }

    _close() {
      if (!this._isOpen) return;
      this._isOpen = false;
      this._active = -1;
      if (this._hasPopover && this._panel.matches(':popover-open')) this._panel.hidePopover();
      this._panel.classList.remove('is-open');
      this._field.removeAttribute('data-open');
      if (this._input.hasAttribute('aria-expanded')) this._input.setAttribute('aria-expanded', 'false');
      this._input.removeAttribute('aria-activedescendant');
      document.removeEventListener('pointerdown', this._onDocPointerDown, true);
      window.removeEventListener('scroll', this._onViewport, true);
      window.removeEventListener('resize', this._onViewport);
      cancelAnimationFrame(this._raf);
    }

    _move(delta) {
      const n = this._matches.length;
      if (!n) return;
      this._active = this._active < 0 ? (delta > 0 ? 0 : n - 1) : (this._active + delta + n) % n;
      this._syncActive();
    }

    _syncActive() {
      this._list.querySelectorAll('.row[data-active]').forEach((r) => r.removeAttribute('data-active'));
      const row = this._active > -1 ? this._list.children[this._active] : null;
      if (!row) {
        this._input.removeAttribute('aria-activedescendant');
        return;
      }
      row.setAttribute('data-active', '');
      this._input.setAttribute('aria-activedescendant', row.id);
      const list = this._list;
      if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop;
      else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight;
      }
    }

    _pick(i) {
      const s = this._matches[i];
      if (s == null) return;
      const kept = this._userAdd([s]);
      if (!kept.length) this._input.value = '';
      this._close();
    }

    /** As in combobox.js: below the field, or above when there's more room there. */
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
      if (!e.composedPath().includes(this)) this._close();
    }

    /* -------------------------- Interaction -------------------------- */

    _wire() {
      const input = this._input;
      input.addEventListener('keydown', (e) => this._onInputKey(e));
      input.addEventListener('input', (e) => this._onInput(e));
      input.addEventListener('paste', (e) => this._onPaste(e));
      this._tagsEl.addEventListener('keydown', (e) => this._onChipKey(e));
      // The chip's own × asks first; the tag input does the removing.
      this._tagsEl.addEventListener('chip-remove', (e) => {
        e.preventDefault();
        const i = this._chipIndex(e);
        if (i > -1) this._userRemove(i, 'click');
      });
      this._labelEl.addEventListener('click', (e) => {
        e.preventDefault();
        if (!this._isDisabled()) input.focus();
      });
      // A click on the empty part of the field goes to the text field.
      this._field.addEventListener('mousedown', (e) => {
        if (e.target === this._field && !this._isDisabled()) {
          e.preventDefault();
          input.focus();
        }
      });
      this._panel.addEventListener('mousedown', (e) => e.preventDefault());
      this._list.addEventListener('click', (e) => {
        const row = e.target.closest('.row');
        if (!row) return;
        this._pick(Number(row.dataset.index));
        input.focus({ preventScroll: true });
      });
      this._list.addEventListener('pointermove', (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        const row = e.target.closest('.row');
        if (!row || Number(row.dataset.index) === this._active) return;
        this._active = Number(row.dataset.index);
        this._syncActive();
      });
      // Leaving the component adds the typed text.
      this.shadowRoot.addEventListener('focusout', (e) => {
        const to = e.relatedTarget;
        if (to && (to === this || this.shadowRoot.contains(to))) return;
        this._close();
        if (this._editable() && tidy(input.value)) this._commitText();
      });
    }

    _onInput(e) {
      if (!this._editable()) return;
      // A delimiter typed (or inserted by a mobile keyboard) ends the tag before it.
      // A paste the paste handler could not read (no clipboardData) is split
      // here: every part becomes a tag, the last one too.
      const delims = this._delimiters();
      if (delims) {
        const re = new RegExp(`[${escapeRe(delims)}]`);
        const value = this._input.value;
        if (re.test(value)) {
          const parts = value.split(re);
          const rest = e.inputType === 'insertFromPaste' ? '' : parts.pop();
          const kept = this._userAdd(parts);
          this._input.value = kept.length ? kept[0] : rest;
        }
      }
      if (this._hasSuggestions()) {
        if (tidy(this._input.value)) {
          if (this._isOpen) this._filter();
          else this._open();
        } else {
          this._close();
        }
      }
    }

    _onPaste(e) {
      if (!this._editable()) return;
      const text = e.clipboardData ? e.clipboardData.getData('text') : '';
      const re = new RegExp(`[${escapeRe(this._delimiters())}\\n\\r\\t]`);
      if (!text || !re.test(text)) return; // a single tag: the browser pastes it
      e.preventDefault();
      const field = this._input;
      const before = field.value.slice(0, field.selectionStart);
      const after = field.value.slice(field.selectionEnd);
      const kept = this._userAdd(`${before}${text}${after}`.split(re));
      field.value = kept.join(', ');
      this._close();
    }

    _onInputKey(e) {
      if (this._isDisabled()) return;
      const field = this._input;
      const atStart = field.selectionStart === 0 && field.selectionEnd === 0;
      switch (e.key) {
        case 'Enter':
          if (e.isComposing || !this._editable()) return;
          if (this._isOpen && this._active > -1) {
            e.preventDefault();
            this._pick(this._active);
          } else if (tidy(field.value)) {
            e.preventDefault();
            this._commitText();
            this._close();
          }
          break;
        case 'Backspace':
          if (atStart && this._chips.length && !e.repeat) {
            e.preventDefault();
            this._close();
            this._focusChip(this._chips.length - 1);
          }
          break;
        case 'ArrowLeft':
          if (atStart && this._chips.length) {
            e.preventDefault();
            this._close();
            this._focusChip(this._chips.length - 1);
          }
          break;
        case 'ArrowDown':
          if (!this._hasSuggestions() || !this._editable()) return;
          e.preventDefault();
          if (!this._isOpen) this._open();
          else this._move(1);
          break;
        case 'ArrowUp':
          if (!this._isOpen) return;
          e.preventDefault();
          this._move(-1);
          break;
        case 'Escape':
          if (this._isOpen) {
            e.preventDefault();
            e.stopPropagation(); // don't also close a surrounding dialog or sheet
            this._close();
          }
          break;
        case 'Tab':
          this._close();
          if (this._editable() && tidy(field.value)) this._commitText();
          break;
        default:
          break;
      }
    }

    _onChipKey(e) {
      const i = this._chipIndex(e);
      if (i < 0) return;
      const last = this._chips.length - 1;
      const toInput = () => this._input.focus();
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (i > 0) this._focusChip(i - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (i < last) this._focusChip(i + 1);
          else toInput();
          break;
        case 'Home':
          e.preventDefault();
          this._focusChip(0);
          break;
        case 'End':
        case 'Escape':
          e.preventDefault();
          toInput();
          break;
        case 'Backspace':
          e.preventDefault();
          if (!e.repeat) this._userRemove(i, 'previous');
          break;
        case 'Delete':
          e.preventDefault();
          this._userRemove(i, 'next');
          break;
        default:
          // Typing a character goes back to the text field and types there.
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ' && this._editable()) {
            toInput();
          }
          break;
      }
    }

    _dispatch(name, detail, cancelable) {
      const init = { bubbles: true, composed: true, cancelable: !!cancelable };
      const ev = detail === undefined ? new Event(name, init) : new CustomEvent(name, { ...init, detail });
      return this.dispatchEvent(ev);
    }
  }

  customElements.define(TAG_NAME, KakaoTagInput);
})();
