/**
 * <kakao-code-input>
 * ============================================================================
 * A one-time code or PIN field: one box per character (4 to 8, default 6),
 * with the text input's label, hint, error, sizes and border. Typing moves on,
 * Backspace goes back, a pasted or autofilled code fills the boxes.
 * Form-associated. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="code-input.js"><\/script>
 *
 *   <kakao-code-input label="Verification code" name="otp" required
 *                     hint="We sent it to +43 660 …12"></kakao-code-input>
 *   <kakao-code-input label="PIN" length="4" mask autocomplete="off"></kakao-code-input>
 *   <kakao-code-input label="Backup code" length="8" type="alphanumeric" separator="4"></kakao-code-input>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  length        Number of boxes, 4 to 8 (default 6; out of range is clamped).
 *  type          "numeric" (default): digits, numeric keyboard.
 *                "alphanumeric": letters and digits, text keyboard.
 *  pattern       One character's allowed set as a regular expression, e.g.
 *                "[0-9A-F]"; overrides `type` for what is accepted (`type`
 *                still picks the keyboard). Anything else typed is ignored;
 *                a letter in the wrong case is switched when only the other
 *                case is allowed ("a" becomes "A" for [0-9A-F]).
 *  mask          Filled boxes show a dot instead of the character (PINs).
 *                The inner field becomes a password field, so screen readers
 *                say "dot" too.
 *  separator     A short dash between groups of boxes: a group size ("3":
 *                after every third box) or the sizes in order ("3-3", "4-4",
 *                "2-3-3"). Visual only; the value has no dash.
 *  label         Visible label above the boxes.
 *  aria-label    Accessible name when there is no visible label.
 *  hint          Helper text below (hidden while there is an error).
 *  error         Error text: danger borders, message, aria-invalid and the
 *                validation message.
 *  value         The default value; form reset goes back to it.
 *  name · required · disabled · readonly   Form participation.
 *  autocomplete  Default "one-time-code" (SMS autofill). Use "off" for a PIN.
 *  size          "sm" | "md" (default) | "lg": the text input's heights
 *                (36 / 44 / 52px).
 *
 *  data-* attributes on the host are mirrored onto the inner field.
 *
 * ----------------------------------------------------------------------------
 * KEYBOARD AND POINTER
 * ----------------------------------------------------------------------------
 *  A character      Fills the current box and moves to the next. On a filled
 *                   box it overwrites. Disallowed characters are ignored.
 *  Backspace        Clears the current box; on an empty box it moves back and
 *                   clears that one. Delete clears the current box.
 *  ← → Home End     Move between the filled boxes and the first empty one.
 *  Paste, drop      The pasted text without spaces, dashes and dots. A whole
 *                   code (as long as `length` or longer) replaces the value;
 *                   a shorter piece fills from the current box on.
 *  Enter            Commits (change) and submits the surrounding form.
 *  Click a box      Moves there (to the first empty box at most).
 *  The value has no gaps: boxes fill from the left, as in a text field.
 *
 * ----------------------------------------------------------------------------
 * WHY ONE HIDDEN FIELD, NOT ONE FIELD PER BOX
 * ----------------------------------------------------------------------------
 *  The boxes are only drawn; on top of them lies ONE real <input> with
 *  transparent text, the size of the whole row:
 *  - SMS autofill (iOS "From Messages", Android keyboards, Chrome's WebOTP
 *    autofill) fills one field with the whole code; spread over N fields it
 *    lands in the first box only, or needs a paste-splitting hack per browser.
 *  - Screen readers meet one labelled text field with its value ("Verification
 *    code, edit text, 6 digits"), not six unnamed one-character fields to tab
 *    through. Arrow keys read the character under the cursor.
 *  - Password managers, paste, long-press "Paste" on phones, dictation and IME
 *    all work on a normal field. The field is on top (not hidden under the
 *    boxes) so a long press reaches it.
 *  The component keeps the field's selection on the current box's character
 *  (a one-character selection, or a caret after the last one), so typing
 *  overwrites and Backspace clears, both natively; it handles inserts itself
 *  to filter and to paste across boxes. Untested on real iOS hardware: Safari
 *  is expected to offer the code because the field is a normal text field
 *  with autocomplete="one-time-code" (no opacity:0, no 1px size).
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value            Get / set the code (filtered and cut to `length`).
 *                   Setting it fires no events.
 *  length           Get / set the number of boxes.
 *  complete         True when every box is filled (read only).
 *  clear()          Empties the value (no events) and keeps focus where it is.
 *  focus() · blur()  focus() goes to the first empty box.
 *  checkValidity() · reportValidity() · validity · validationMessage · form
 *  disabled · readOnly · required · name   Property mirrors.
 *
 *  Validity: required and empty → valueMissing; started but not complete →
 *  tooShort ("Please enter all 6 digits."); `error` → customError.
 *  Custom state: :state(complete) while every box is filled.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed; from the host)
 * ----------------------------------------------------------------------------
 *  input            the user changed the value
 *  change           the user committed a changed value: the last box was
 *                   filled, Enter, or the field lost focus
 *  code-complete    every box is filled after a user edit: { value }
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  - A real <label> names the field; hint, error and "6 digits" (or
 *    characters) describe it; the error sets aria-invalid.
 *  - The drawn boxes are aria-hidden; the field carries the value.
 *  - Focus: the current box gets the shared 2px outline with 2px offset and
 *    the focus border; an empty current box shows a caret (it blinks unless
 *    reduced motion is asked for).
 *  - Forced colours: the boxes keep system colours, the current box the
 *    Highlight outline; the transparent field opts out so it stays invisible.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-code-input';
  if (customElements.get(TAG_NAME)) return;

  const MIN_LENGTH = 4;
  const MAX_LENGTH = 8;
  const DEFAULT_LENGTH = 6;
  /* Stripped from pasted / autofilled text before filtering. */
  const STRIP = /[\s\-–—._/]/g;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-code-input- (written by construction.html, edit there) */
        --_bg: var(--kakao-code-input-bg, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-code-input-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-code-input-muted, var(--kakao-color-muted, #62626c));
        --_border: var(--kakao-code-input-border, var(--kakao-color-field-border, #ececef));
        --_focus: var(--kakao-code-input-focus, var(--kakao-color-focus, #2563eb));
        --_danger: var(--kakao-code-input-danger, var(--kakao-color-danger, #dc2626));
        --_selected-bg: var(--kakao-code-input-selected-bg, var(--kakao-color-subtle, #f0f0f1));
        --_font: var(--kakao-code-input-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_char-weight: var(--kakao-code-input-char-weight, 600);
        --_label-weight: var(--kakao-code-input-label-weight, 600);
        --_height: var(--kakao-code-input-height, 44px);
        --_box-width: var(--kakao-code-input-box-width, 40px);
        --_char-size: var(--kakao-code-input-char-size, 1.15rem);
        --_gap: var(--kakao-code-input-gap, 8px);
        --_group-gap: var(--kakao-code-input-group-gap, 10px);
        --_radius: var(--kakao-code-input-radius, 10px);
        --_label-gap: var(--kakao-code-input-label-gap, 6px);
        --_message-gap: var(--kakao-code-input-message-gap, 5px);
        --_focus-width: var(--kakao-code-input-focus-width, 2px);
        --_focus-offset: var(--kakao-code-input-focus-offset, 2px);
        --_disabled-opacity: var(--kakao-code-input-disabled-opacity, 0.55);
        --_duration: var(--kakao-code-input-duration, 150ms);
        --_ease: var(--kakao-code-input-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        display: block;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) {
        --_height: var(--kakao-code-input-sm-height, 36px);
        --_box-width: var(--kakao-code-input-sm-box-width, 32px);
        --_char-size: var(--kakao-code-input-sm-char-size, 1rem);
        --_gap: var(--kakao-code-input-sm-gap, 6px);
      }
      :host([size="lg"]) {
        --_height: var(--kakao-code-input-lg-height, 52px);
        --_box-width: var(--kakao-code-input-lg-box-width, 48px);
        --_char-size: var(--kakao-code-input-lg-char-size, 1.35rem);
        --_gap: var(--kakao-code-input-lg-gap, 10px);
      }
      :host([disabled]), :host(:disabled) { opacity: var(--_disabled-opacity); }

      .label {
        display: block;
        margin: 0 0 var(--_label-gap);
        font-weight: var(--_label-weight);
        font-size: 0.82rem;
        cursor: pointer;
      }
      .label:empty { display: none; }

      /* The row: drawn boxes, the real field on top of them. */
      .row {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--_gap);
        max-width: 100%;
        width: max-content;
      }
      .boxes { display: contents; }
      .box {
        position: relative;
        flex: 0 1 var(--_box-width);
        min-width: 0;
        width: var(--_box-width);
        box-sizing: border-box;
        height: var(--_height);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--_bg);
        color: var(--_text);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        font-size: var(--_char-size);
        font-weight: var(--_char-weight);
        font-variant-numeric: tabular-nums;
        line-height: 1;
        transition: border-color var(--_duration) var(--_ease), background-color var(--_duration) var(--_ease);
      }
      .box.selected { background: var(--_selected-bg); }
      :host([error]) .box { border-color: var(--_danger); }
      .box.active {
        border-color: var(--_focus);
        outline: var(--_focus-width) solid var(--_focus);
        outline-offset: var(--_focus-offset);
      }
      :host([error]) .box.active { border-color: var(--_danger); outline-color: var(--_danger); }
      /* The mask dot. */
      .box.dot::after {
        content: "";
        width: 0.5em;
        height: 0.5em;
        border-radius: 50%;
        background: currentColor;
      }
      /* The caret in an empty current box. */
      .box.active.empty::after {
        content: "";
        width: 2px;
        height: 1.1em;
        border-radius: 1px;
        background: var(--_text);
        animation: blink 1.06s steps(1, end) infinite;
      }
      @keyframes blink { 50% { opacity: 0; } }

      .sep {
        flex: none;
        width: 0.6em;
        height: 2px;
        margin: 0 max(0px, calc(var(--_group-gap) - var(--_gap)));
        border-radius: 1px;
        background: var(--_muted);
        font-size: var(--_char-size);
      }

      /* The real field: on top of the boxes, invisible but not hidden (SMS
         autofill and long-press paste need a normal, reachable field). */
      input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        border: 0;
        outline: none;
        background: transparent;
        color: transparent;
        caret-color: transparent;
        -webkit-text-fill-color: transparent;
        font-size: 16px; /* no zoom-on-focus in iOS Safari */
        letter-spacing: 0;
        text-indent: 0;
        appearance: none;
        cursor: text;
        forced-color-adjust: none;
      }
      input::selection { background: transparent; color: transparent; }
      input:-webkit-autofill,
      input:-webkit-autofill:focus {
        -webkit-text-fill-color: transparent;
        -webkit-box-shadow: 0 0 0 100px transparent inset;
        transition: background-color 600000s 0s;
      }
      input:disabled { cursor: not-allowed; }

      .hint, .error { margin: var(--_message-gap) 0 0; font-size: 0.78rem; color: var(--_muted); }
      .hint:empty, .error:empty { display: none; }
      .error { color: var(--_danger); }
      :host([error]) .hint { display: none; }
      .sr {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0,0,0,0);
        white-space: nowrap;
        border: 0;
      }

      @media (forced-colors: active) {
        .box { border-color: CanvasText; background: Canvas; color: CanvasText; }
        .box.active { border-color: Highlight; outline-color: Highlight; }
        .box.selected { background: Highlight; color: HighlightText; }
        .box.active.empty::after, .sep { background: CanvasText; }
      }

      @media (prefers-reduced-motion: reduce) {
        .box { transition: none; }
        .box.active.empty::after { animation: none; }
      }
    </style>
    <label class="label" part="label" id="label" for="input"></label>
    <div class="row" part="row">
      <div class="boxes" aria-hidden="true"></div>
      <input id="input" part="input" type="text" spellcheck="false" autocorrect="off" autocapitalize="off" />
    </div>
    <p class="hint" part="hint" id="hint"></p>
    <p class="error" part="error" id="error"></p>
    <span class="sr" id="count"></span>
  `;

  class KakaoCodeInput extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['length', 'type', 'pattern', 'mask', 'separator', 'label', 'aria-label', 'hint', 'error',
        'value', 'name', 'required', 'disabled', 'readonly', 'autocomplete', 'size'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      this._labelEl = shadow.querySelector('.label');
      this._row = shadow.querySelector('.row');
      this._boxesEl = shadow.querySelector('.boxes');
      this._input = shadow.querySelector('input');
      this._hintEl = shadow.querySelector('#hint');
      this._errorEl = shadow.querySelector('#error');
      this._countEl = shadow.querySelector('#count');
      this._boxes = [];
      this._layoutKey = '';
      this._initialised = false;
      this._pendingValue = null;
      this._dirty = false;
      this._formDisabled = false;
      this._committed = '';
      this._caret = 0;

      const input = this._input;
      input.addEventListener('beforeinput', (e) => this._onBeforeInput(e));
      input.addEventListener('input', (e) => {
        // The native event is composed and would leave the shadow root next to ours.
        e.stopPropagation();
        this._onNativeInput();
      });
      input.addEventListener('change', (e) => e.stopPropagation());
      input.addEventListener('keydown', (e) => this._onKeydown(e));
      input.addEventListener('focus', () => {
        this._committed = this.value;
        this._placeCaret(this._input.selectionStart);
      });
      input.addEventListener('blur', () => {
        this._commit();
        this._render();
      });
      input.addEventListener('click', (e) => this._onClick(e));
      input.addEventListener('select', () => this._onSelectionChange());
      input.addEventListener('selectionchange', () => this._onSelectionChange());
      this._docSelection = () => {
        if (this.shadowRoot.activeElement === this._input) this._onSelectionChange();
      };
      this._labelEl.addEventListener('click', (e) => {
        e.preventDefault();
        this.focus();
      });
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      ['value', 'length'].forEach((p) => this._upgrade(p));
      document.addEventListener('selectionchange', this._docSelection);
      if (!this._initialised) {
        this._initialised = true;
        this._sync();
        this._input.value = this._clean(this._pendingValue != null ? this._pendingValue : (this.getAttribute('value') || ''));
        this._pendingValue = null;
        this._committed = this._input.value;
      }
      this._sync();
    }

    disconnectedCallback() {
      document.removeEventListener('selectionchange', this._docSelection);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this._initialised) return;
      if (name === 'value') {
        // The attribute is the default: it moves the field only while the
        // user has not changed it (as with a native input's value attribute).
        if (!this._dirty) this._input.value = this._clean(newValue || '');
      }
      if (name === 'length' || name === 'type' || name === 'pattern') {
        // Re-filter what is there against the new rules.
        this._sync();
        this._input.value = this._clean(this._input.value);
      }
      this._sync();
    }

    formResetCallback() {
      this._dirty = false;
      this._input.value = this._clean(this.getAttribute('value') || '');
      this._committed = this._input.value;
      this._sync();
    }

    formDisabledCallback(disabled) {
      this._formDisabled = disabled;
      this._sync();
    }

    formStateRestoreCallback(state) {
      this._input.value = this._clean(typeof state === 'string' ? state : '');
      this._sync();
    }

    /* -------------------------- Public API -------------------------- */

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(v) { this.toggleAttribute('disabled', !!v); }
    get readOnly() { return this.hasAttribute('readonly'); }
    set readOnly(v) { this.toggleAttribute('readonly', !!v); }
    get required() { return this.hasAttribute('required'); }
    set required(v) { this.toggleAttribute('required', !!v); }
    get name() { return this.getAttribute('name') || ''; }
    set name(v) { this.setAttribute('name', v); }

    get length() {
      const n = parseInt(this.getAttribute('length'), 10);
      if (!Number.isFinite(n)) return DEFAULT_LENGTH;
      return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, n));
    }
    set length(v) { this.setAttribute('length', String(v)); }

    get value() {
      if (!this._initialised) return this._pendingValue != null ? this._pendingValue : (this.getAttribute('value') || '');
      return this._input.value;
    }

    set value(v) {
      const next = v == null ? '' : String(v);
      if (!this._initialised) {
        this._pendingValue = next;
        return;
      }
      this._dirty = true;
      this._input.value = this._clean(next);
      this._committed = this._input.value;
      this._syncForm();
      this._placeCaret(this._input.value.length);
    }

    get complete() {
      return this.value.length === this.length;
    }

    clear() {
      this.value = '';
    }

    get form() { return this._internals ? this._internals.form : null; }
    get validity() { return this._internals ? this._internals.validity : this._input.validity; }
    get validationMessage() { return this._internals ? this._internals.validationMessage : this._input.validationMessage; }
    get willValidate() { return this._internals ? this._internals.willValidate : true; }
    checkValidity() { return this._internals ? this._internals.checkValidity() : this._input.checkValidity(); }
    reportValidity() { return this._internals ? this._internals.reportValidity() : this._input.reportValidity(); }

    focus(options) {
      this._input.focus(options);
      this._placeCaret(this._input.value.length);
    }

    blur() { this._input.blur(); }

    /* -------------------------- Rules -------------------------- */

    _upgrade(prop) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const v = this[prop];
        delete this[prop];
        this[prop] = v;
      }
    }

    _alphanumeric() {
      return (this.getAttribute('type') || '').toLowerCase() === 'alphanumeric';
    }

    /** One allowed character, as a RegExp. */
    _charRule() {
      const pattern = this.getAttribute('pattern');
      if (pattern) {
        try { return new RegExp(`^(?:${pattern})$`, 'u'); } catch (e) { /* fall through to type */ }
      }
      return this._alphanumeric() ? /^[\p{L}\p{N}]$/u : /^[0-9]$/;
    }

    /** Text as it may stand in the value: separators stripped, other characters dropped, cut to length. */
    _clean(text) {
      const rule = this._charRule();
      const out = [];
      for (const ch of String(text).replace(STRIP, '')) {
        // A letter in the other case is taken when only that case is allowed ([0-9A-F]).
        const ok = [ch, ch.toUpperCase(), ch.toLowerCase()].find((c) => rule.test(c));
        if (ok) out.push(ok);
        if (out.length === this.length) break;
      }
      return out.join('');
    }

    _isDisabled() {
      return this.disabled || this._formDisabled;
    }

    /** Group sizes from `separator`: "3" repeats, "3-3" / "2-3-3" in order. */
    _groups(n) {
      const raw = (this.getAttribute('separator') || '').trim();
      if (!raw) return [n];
      const parts = raw.split(/[^0-9]+/).map((p) => parseInt(p, 10)).filter((p) => p > 0);
      if (!parts.length) return [n];
      const sizes = [];
      let left = n;
      let i = 0;
      while (left > 0) {
        const size = parts.length === 1 ? parts[0] : (parts[i] || left);
        sizes.push(Math.min(size, left));
        left -= size;
        i++;
      }
      return sizes;
    }

    /* -------------------------- Editing -------------------------- */

    /** Inserts are done here: filtered, overwriting, and spread over boxes. */
    _onBeforeInput(e) {
      const type = e.inputType || '';
      if (!type.startsWith('insert') || type === 'insertCompositionText') return;
      if (this._input.readOnly || this._input.disabled) return;
      let data = e.data;
      if (data == null && e.dataTransfer) data = e.dataTransfer.getData('text/plain');
      if (type === 'insertLineBreak' || type === 'insertParagraph') {
        e.preventDefault();
        return;
      }
      if (data == null) return; // unknown insert: normalised after the fact
      e.preventDefault();
      this._insert(data, type !== 'insertText');
    }

    _insert(text, wholeCodeReplaces) {
      const clean = this._clean(text);
      if (!clean) return;
      const n = this.length;
      const prev = this._input.value;
      let next;
      let caret;
      if (wholeCodeReplaces && clean.length >= n) {
        next = clean.slice(0, n);
        caret = n;
      } else {
        let start = Math.min(this._input.selectionStart ?? prev.length, prev.length);
        const end = Math.max(start, Math.min(this._input.selectionEnd ?? start, prev.length));
        // A selection wider than one box is removed first.
        let base = prev;
        if (end - start > 1) base = prev.slice(0, start) + prev.slice(end);
        start = Math.min(start, base.length);
        next = (base.slice(0, start) + clean + base.slice(start + clean.length)).slice(0, n);
        caret = start + clean.length;
      }
      this._input.value = next;
      this._afterEdit(prev, caret);
    }

    /** Deletions, autofill without beforeinput, IME: normalise what the field did. */
    _onNativeInput() {
      const prev = this._lastValue != null ? this._lastValue : this._input.value;
      const raw = this._input.value;
      const clean = this._clean(raw);
      let caret = this._input.selectionStart ?? clean.length;
      if (clean !== raw) {
        this._input.value = clean;
        // A whole replacement (autofill) lands on the end; otherwise keep the place.
        caret = clean.length >= this.length ? clean.length : Math.min(caret, clean.length);
      }
      this._afterEdit(prev, caret);
    }

    _afterEdit(prev, caret) {
      this._dirty = true;
      const value = this._input.value;
      this._syncForm();
      this._placeCaret(caret);
      if (value === prev) return;
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      if (value.length === this.length) {
        this.dispatchEvent(new CustomEvent('code-complete', { bubbles: true, composed: true, detail: { value } }));
        this._commit();
      }
    }

    _commit() {
      const value = this.value;
      if (value === this._committed) return;
      this._committed = value;
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }

    _onKeydown(e) {
      if (e.altKey || e.metaKey || e.ctrlKey) return;
      const len = this._input.value.length;
      const last = Math.min(len, this.length - 1);
      let to = null;
      switch (e.key) {
        case 'ArrowLeft': to = Math.max(0, this._caret - 1); break;
        case 'ArrowRight': to = Math.min(last, this._caret + 1); break;
        case 'Home': case 'ArrowUp': to = 0; break;
        case 'End': case 'ArrowDown': to = last; break;
        case 'Enter':
          e.preventDefault();
          this._commit();
          if (this.form && typeof this.form.requestSubmit === 'function') this.form.requestSubmit();
          return;
        default: return;
      }
      e.preventDefault();
      this._placeCaret(to);
    }

    /** A click lands on the box under the pointer (no further than the first empty one). */
    _onClick(e) {
      if (!this._boxes.length) return;
      let index = this._boxes.length - 1;
      for (let i = 0; i < this._boxes.length; i++) {
        const r = this._boxes[i].getBoundingClientRect();
        if (e.clientX < r.right + this._gapPx() / 2) { index = i; break; }
      }
      this._placeCaret(index);
    }

    _gapPx() {
      return parseFloat(getComputedStyle(this._row).columnGap) || 0;
    }

    /** Selections the browser made (drag, double click, select all): follow them; a bare caret snaps to a box. */
    _onSelectionChange() {
      const s = this._input.selectionStart;
      const t = this._input.selectionEnd;
      if (s == null) return;
      if (s === t) this._placeCaret(s);
      else this._render();
    }

    /**
     * Puts the current box at `index` (clamped to the first empty box and the
     * last box). A filled box is selected as one character, so typing
     * overwrites it and Backspace clears it natively.
     */
    _placeCaret(index) {
      const len = this._input.value.length;
      const c = Math.max(0, Math.min(index == null ? len : index, len, this.length - 1));
      this._caret = c;
      if (this.shadowRoot.activeElement === this._input) {
        const end = c < len ? c + 1 : c;
        if (this._input.selectionStart !== c || this._input.selectionEnd !== end) {
          try { this._input.setSelectionRange(c, end); } catch (err) { /* type without selection */ }
        }
      }
      this._render();
    }

    /* -------------------------- Rendering -------------------------- */

    _buildBoxes() {
      const n = this.length;
      const key = `${n}|${this.getAttribute('separator') || ''}`;
      if (key === this._layoutKey) return;
      this._layoutKey = key;
      this._boxesEl.textContent = '';
      this._boxes = [];
      const groups = this._groups(n);
      groups.forEach((size, g) => {
        if (g > 0) {
          const sep = document.createElement('span');
          sep.className = 'sep';
          sep.setAttribute('part', 'separator');
          sep.setAttribute('aria-hidden', 'true');
          this._boxesEl.appendChild(sep);
        }
        for (let i = 0; i < size; i++) {
          const box = document.createElement('span');
          box.className = 'box';
          box.setAttribute('part', 'box');
          box.setAttribute('aria-hidden', 'true');
          this._boxesEl.appendChild(box);
          this._boxes.push(box);
        }
      });
    }

    _render() {
      this._buildBoxes();
      const value = this._input.value;
      const focused = this.shadowRoot.activeElement === this._input && !this._input.disabled;
      const s = this._input.selectionStart ?? 0;
      const t = this._input.selectionEnd ?? 0;
      const wide = focused && t - s > 1;
      const mask = this.hasAttribute('mask');
      this._boxes.forEach((box, i) => {
        const ch = value[i] || '';
        box.textContent = mask ? '' : ch;
        box.classList.toggle('dot', mask && !!ch);
        box.classList.toggle('empty', !ch);
        box.classList.toggle('active', focused && !wide && i === this._caret);
        box.classList.toggle('selected', wide && i >= s && i < t);
        box.part.toggle('box-filled', !!ch);
        box.part.toggle('box-active', focused && !wide && i === this._caret);
      });
      this._lastValue = value;
    }

    _sync() {
      const input = this._input;
      const n = this.length;
      const alnum = this._alphanumeric();
      const mask = this.hasAttribute('mask');
      input.type = mask ? 'password' : 'text';
      input.maxLength = n;
      input.inputMode = alnum ? 'text' : 'numeric';
      input.setAttribute('autocapitalize', alnum ? 'characters' : 'off');
      input.setAttribute('autocomplete', this.getAttribute('autocomplete') || 'one-time-code');
      if (!alnum && !this.getAttribute('pattern')) input.setAttribute('pattern', `[0-9]{${n}}`);
      else input.removeAttribute('pattern');
      input.required = this.hasAttribute('required');
      input.readOnly = this.hasAttribute('readonly');
      input.disabled = this._isDisabled();

      const label = this.getAttribute('label') || '';
      this._labelEl.textContent = label;
      if (label) input.removeAttribute('aria-label');
      else input.setAttribute('aria-label', this.getAttribute('aria-label') || 'Code');

      const hint = this.getAttribute('hint') || '';
      const error = this.getAttribute('error') || '';
      this._hintEl.textContent = hint;
      this._errorEl.textContent = error;
      this._countEl.textContent = `${n} ${alnum || this.getAttribute('pattern') ? 'characters' : 'digits'}`;
      const describedBy = [hint && 'hint', error && 'error', 'count'].filter(Boolean).join(' ');
      input.setAttribute('aria-describedby', describedBy);
      if (error) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');

      this._mirrorDataAttrs();
      this._syncForm();
      this._placeCaret(this._caret);
    }

    _syncForm() {
      const value = this._input.value;
      const n = this.length;
      const states = this._internals && this._internals.states;
      if (states) {
        try {
          if (value.length === n) states.add('complete');
          else states.delete('complete');
        } catch (e) { /* custom states not supported */ }
      }
      if (!this._internals) return;
      this._internals.setFormValue(value === '' ? null : value, value);
      const error = this.getAttribute('error');
      const what = this._alphanumeric() || this.getAttribute('pattern') ? 'characters' : 'digits';
      if (error) this._internals.setValidity({ customError: true }, error, this._input);
      else if (this.hasAttribute('required') && !value) {
        this._internals.setValidity({ valueMissing: true }, 'Please fill in this field.', this._input);
      } else if (value && value.length < n) {
        this._internals.setValidity({ tooShort: true }, `Please enter all ${n} ${what}.`, this._input);
      } else {
        this._internals.setValidity({});
      }
    }

    /** data-* on the host is mirrored onto the field (Yii and other hooks). */
    _mirrorDataAttrs() {
      Array.from(this._input.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-') && !this.hasAttribute(attr.name)) this._input.removeAttribute(attr.name);
      });
      Array.from(this.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-')) this._input.setAttribute(attr.name, attr.value);
      });
    }
  }

  customElements.define(TAG_NAME, KakaoCodeInput);
})();
