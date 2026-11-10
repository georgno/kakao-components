/**
 * <kakao-date-input>
 * ============================================================================
 * A date, time, date-and-time, month or week field that keeps the browser's
 * own field and picker, dressed as the library's other fields: label, hint,
 * error, three sizes, the picker icon on the right where the select's chevron
 * sits. Form-associated. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="date-input.js"><\/script>
 *
 *   <kakao-date-input label="Start" name="start" min="2026-01-01" required></kakao-date-input>
 *   <kakao-date-input type="time" label="At" value="09:30" step="900"></kakao-date-input>
 *   <kakao-date-input type="datetime-local" label="Meeting" locale="de-AT"></kakao-date-input>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  type          "date" (default) | "time" | "datetime-local" | "month" | "week".
 *                A type the browser has no field for (month and week in
 *                Firefox and desktop Safari) becomes a text field for the ISO
 *                form, with a placeholder (YYYY-MM, YYYY-Www) and a pattern.
 *  label         Visible label above the field.
 *  aria-label    Accessible name when there is no visible label.
 *  hint          Helper text below the field (hidden while there is an error).
 *  error         Error text: danger border and message, aria-invalid, and the
 *                validation message.
 *  value         The default value, ISO: 2026-03-04 · 14:30 · 2026-03-04T14:30 ·
 *                2026-03 · 2026-W10. Form reset goes back to it.
 *  min · max · step   As on the native input (step in seconds for times,
 *                days for dates, weeks, months).
 *  name · required · disabled · readonly · autocomplete   Form participation.
 *  size          "sm" | "md" (default) | "lg".
 *  locale        Language tag for the inner field. Without it the nearest
 *                `lang` (the element's own, an ancestor's, <html>) is used,
 *                and followed when it changes.
 *
 *  data-* attributes on the host are mirrored onto the inner input.
 *
 * ----------------------------------------------------------------------------
 * LOCALE: WHAT IT DOES AND WHAT IT CAN'T
 * ----------------------------------------------------------------------------
 *  The browser draws the field in ITS OWN format, not the page's: Chromium
 *  follows the browser's UI language (on Linux the process locale), Firefox
 *  its UI language or, if the user turned it on, the OS regional format,
 *  Safari the OS region. None of them reads `lang` (tested 2026-11). The
 *  component still passes the locale to the inner input as `lang` (correct
 *  for assistive technology, and honoured should a browser start to), and
 *  `locale` tells a page which locale to format the value with itself
 *  (Intl.DateTimeFormat). The value is always ISO.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value            Get / set the ISO value ('' when empty or incomplete).
 *  valueAsDate      The value as a Date (UTC), or null (date, datetime-local,
 *                   month, week, time as on the native input).
 *  locale           The locale in use (read only).
 *  type             Get / set the type.
 *  showPicker()     Opens the native picker where the browser allows it,
 *                   otherwise focuses the field. Needs a user gesture.
 *  focus() · blur()
 *  checkValidity() · reportValidity() · validity · validationMessage · form
 *
 *  Setting value never fires events.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed; once each, from the host)
 * ----------------------------------------------------------------------------
 *  input            while the value changes
 *  change           when the user commits a value (picker, or leaving a segment)
 *
 * ----------------------------------------------------------------------------
 * PICKER ICON
 * ----------------------------------------------------------------------------
 *  The icon is the browser's own control and opens the browser's picker.
 *  Chromium: redrawn in the muted colour with our calendar / clock glyph
 *  (--kakao-date-input-icon-size), centred where the select's chevron is.
 *  Firefox: its button can't be styled; it takes the text colour (lighter) and
 *  is moved onto the chevron's line with --kakao-date-input-moz-nudge.
 *  Safari (desktop) draws no icon; the field opens the picker on click.
 *  The field inherits the page's color-scheme, so pickers open dark in dark
 *  themes.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  - A real <label> is tied to the native field; hint and error describe it,
 *    the error sets aria-invalid. Keyboard and screen reader behaviour is the
 *    browser's own (segments with arrow keys, the picker).
 *  - Focus is the shared 2px outline with 2px offset, on the field.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-date-input';
  if (customElements.get(TAG_NAME)) return;

  const TYPES = ['date', 'time', 'datetime-local', 'month', 'week'];

  /* The ISO text form, for a type the browser has no field for. */
  const FALLBACK = {
    date: { placeholder: 'YYYY-MM-DD', pattern: '\\d{4}-\\d{2}-\\d{2}' },
    time: { placeholder: 'HH:MM', pattern: '\\d{2}:\\d{2}(:\\d{2}(\\.\\d{1,3})?)?' },
    'datetime-local': { placeholder: 'YYYY-MM-DDTHH:MM', pattern: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(:\\d{2})?' },
    month: { placeholder: 'YYYY-MM', pattern: '\\d{4}-(0[1-9]|1[0-2])' },
    week: { placeholder: 'YYYY-Www', pattern: '\\d{4}-W(0[1-9]|[1-4]\\d|5[0-3])' },
  };

  const VALIDITY_KEYS = ['valueMissing', 'typeMismatch', 'patternMismatch', 'tooLong', 'tooShort',
    'rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'badInput'];

  /* Glyphs for the Chromium picker icon, used as a mask so the theme colours it. */
  const svg = (body) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E${body}%3C/svg%3E")`;
  const CALENDAR = svg("%3Crect x='3.5' y='5' width='17' height='15.5' rx='2.5'/%3E%3Cpath d='M3.5 10h17M8 3v4M16 3v4'/%3E");
  const CLOCK = svg("%3Ccircle cx='12' cy='12' r='8.5'/%3E%3Cpath d='M12 7.5V12l3 2'/%3E");

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-date-input- (written by construction.html, edit there) */
        --_bg: var(--kakao-date-input-bg, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-date-input-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-date-input-muted, var(--kakao-color-muted, #62626c));
        --_border: var(--kakao-date-input-border, var(--kakao-color-field-border, #ececef));
        --_focus: var(--kakao-date-input-focus, var(--kakao-color-focus, #2563eb));
        --_danger: var(--kakao-date-input-danger, var(--kakao-color-danger, #dc2626));
        --_font: var(--kakao-date-input-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_label-weight: var(--kakao-date-input-label-weight, 600);
        --_height: var(--kakao-date-input-height, 44px);
        --_padding-x: var(--kakao-date-input-padding-x, 12px);
        --_label-gap: var(--kakao-date-input-label-gap, 6px);
        --_message-gap: var(--kakao-date-input-message-gap, 5px);
        --_icon-size: var(--kakao-date-input-icon-size, 1em);
        --_moz-nudge: var(--kakao-date-input-moz-nudge, -0.36em);
        --_radius: var(--kakao-date-input-radius, 10px);
        --_focus-width: var(--kakao-date-input-focus-width, 2px);
        --_focus-offset: var(--kakao-date-input-focus-offset, 2px);
        --_disabled-opacity: var(--kakao-date-input-disabled-opacity, 0.55);
        --_duration: var(--kakao-date-input-duration, 150ms);
        --_ease: var(--kakao-date-input-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        --_glyph: ${CALENDAR};
        display: block;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([type="time"]) { --_glyph: ${CLOCK}; }
      :host([size="sm"]) { --_height: var(--kakao-date-input-sm-height, 36px); --_padding-x: var(--kakao-date-input-sm-padding-x, 10px); }
      :host([size="lg"]) { --_height: var(--kakao-date-input-lg-height, 52px); --_padding-x: var(--kakao-date-input-lg-padding-x, 14px); }
      :host([disabled]), :host(:disabled) { opacity: var(--_disabled-opacity); }

      .label {
        display: block;
        margin: 0 0 var(--_label-gap);
        font-weight: var(--_label-weight);
        font-size: 0.82rem;
        cursor: pointer;
      }
      .label:empty { display: none; }

      /* ---- Field: the text input's field (as in the combobox) ---- */
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
      /* focus-within: in Chromium the picker icon is a tab stop of its own,
         and the input itself is not :focus while it has focus. */
      .field:has(input:focus-visible, input:focus-within) {
        border-color: var(--_focus);
        outline: var(--_focus-width) solid var(--_focus);
        outline-offset: var(--_focus-offset);
      }
      :host([error]) .field { border-color: var(--_danger); }
      :host([error]) .field:has(input:focus-visible, input:focus-within) { outline-color: var(--_danger); }
      /* Font size on the field, so the icon (em) matches the select's chevron at every size. */
      :host([size="sm"]) .field { font-size: 0.875rem; }
      :host([size="lg"]) .field { font-size: 1rem; }

      input {
        flex: 1;
        min-width: 0;
        box-sizing: border-box;
        height: calc(var(--_height) - 2px);
        margin: 0;
        padding: 0;
        border: 0;
        outline: none;
        background: none;
        color: inherit;
        font: inherit;
        font-variant-numeric: tabular-nums;
        text-align: start;
      }
      input::placeholder { color: var(--_muted); opacity: 1; }
      input:disabled { cursor: not-allowed; }

      /* Chromium / WebKit: the editable part fills the field. */
      input::-webkit-datetime-edit { padding: 0; }
      input::-webkit-datetime-edit-fields-wrapper { padding: 0; }
      input::-webkit-date-and-time-value { text-align: start; }

      /* Chromium: the browser's own picker button, redrawn with our glyph in
         the muted colour. Its centre sits 0.45em in from the padding edge,
         where the select's 0.9em chevron is centred: the input's end margin
         makes up the difference between the icon and the chevron. */
      input[data-native]::-webkit-calendar-picker-indicator {
        box-sizing: border-box;
        width: var(--_icon-size);
        height: var(--_icon-size);
        margin: 0 0 0 calc(var(--_padding-x) * 0.6);
        padding: 0;
        background: var(--_muted);
        -webkit-mask: var(--_glyph) center / contain no-repeat;
        mask: var(--_glyph) center / contain no-repeat;
        opacity: 1;
        cursor: pointer;
      }
      input[data-native]::-webkit-calendar-picker-indicator:hover { background: var(--_text); }
      /* The icon's own tab stop (Chromium): drawn in the focus colour. */
      input[data-native]:focus-within:not(:focus)::-webkit-calendar-picker-indicator { background: var(--_focus); }
      input[data-native] { margin-inline-end: calc(0.45em - var(--_icon-size) / 2); }

      /* Firefox: its picker button can't be styled; this moves it onto the
         chevron's line (measured: ~0.36em further in than the chevron). Its
         segments also start 2px in; the start margin lines the text up with
         the other fields. */
      @supports (-moz-appearance: none) {
        input[data-native] { margin-inline: -2px var(--_moz-nudge); }
      }

      .hint, .error { margin: var(--_message-gap) 0 0; font-size: 0.78rem; color: var(--_muted); }
      .hint:empty, .error:empty { display: none; }
      .error { color: var(--_danger); }
      :host([error]) .hint { display: none; }

      @media (prefers-reduced-motion: reduce) {
        .field { transition: none; }
      }
    </style>
    <label class="label" part="label" id="label" for="input"></label>
    <div class="field" part="field">
      <input id="input" part="input" type="date" />
    </div>
    <p class="hint" part="hint" id="hint"></p>
    <p class="error" part="error" id="error"></p>
  `;

  /* One observer for every instance: a `lang` change anywhere re-resolves the locale. */
  const instances = new Set();
  let langObserver = null;
  function watchLang() {
    if (langObserver || typeof MutationObserver !== 'function') return;
    langObserver = new MutationObserver(() => instances.forEach((el) => el._syncLocale()));
    langObserver.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['lang'] });
  }

  class KakaoDateInput extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['type', 'label', 'aria-label', 'hint', 'error', 'value', 'min', 'max', 'step', 'name',
        'required', 'disabled', 'readonly', 'autocomplete', 'size', 'locale'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      this._labelEl = shadow.querySelector('.label');
      this._input = shadow.querySelector('input');
      this._hintEl = shadow.querySelector('#hint');
      this._errorEl = shadow.querySelector('#error');
      this._type = 'date';
      this._native = true;
      this._formDisabled = false;
      this._initialised = false;
      this._pendingValue = null;
      this._dirty = false;

      this._input.addEventListener('input', (e) => {
        // The native event is composed and would leave the shadow root next to ours.
        e.stopPropagation();
        this._dirty = true;
        this._syncForm();
        this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      });
      this._input.addEventListener('change', () => {
        this._syncForm();
        this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      });
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      ['value', 'type'].forEach((p) => this._upgrade(p));
      instances.add(this);
      watchLang();
      if (!this._initialised) {
        this._initialised = true;
        this._sync();
        this._input.value = this._pendingValue != null ? this._pendingValue : (this.getAttribute('value') || '');
        this._pendingValue = null;
      }
      this._sync();
    }

    disconnectedCallback() {
      instances.delete(this);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this._initialised) return;
      if (name === 'value') {
        // The attribute is the default: it moves the field only while the
        // user has not changed it (as with a native input's value attribute).
        if (!this._dirty) this._input.value = newValue || '';
      }
      this._sync();
    }

    formResetCallback() {
      this._dirty = false;
      this._input.value = this.getAttribute('value') || '';
      this._sync();
    }

    formDisabledCallback(disabled) {
      this._formDisabled = disabled;
      this._sync();
    }

    formStateRestoreCallback(state) {
      this._input.value = typeof state === 'string' ? state : '';
      this._sync();
    }

    /* -------------------------- Public API -------------------------- */

    get type() { return this._resolveType(); }
    set type(v) { this.setAttribute('type', v); }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(v) { this.toggleAttribute('disabled', !!v); }
    get readOnly() { return this.hasAttribute('readonly'); }
    set readOnly(v) { this.toggleAttribute('readonly', !!v); }
    get required() { return this.hasAttribute('required'); }
    set required(v) { this.toggleAttribute('required', !!v); }
    get name() { return this.getAttribute('name') || ''; }
    set name(v) { this.setAttribute('name', v); }
    get min() { return this.getAttribute('min') || ''; }
    set min(v) { this.setAttribute('min', v); }
    get max() { return this.getAttribute('max') || ''; }
    set max(v) { this.setAttribute('max', v); }
    get step() { return this.getAttribute('step') || ''; }
    set step(v) { this.setAttribute('step', v); }

    get value() {
      if (!this._initialised) return this._pendingValue != null ? this._pendingValue : (this.getAttribute('value') || '');
      const v = this._input.value;
      if (this._native || v === '') return v;
      return new RegExp(`^(?:${FALLBACK[this._type].pattern})$`).test(v) ? v : '';
    }

    set value(v) {
      const next = v == null ? '' : String(v);
      if (!this._initialised) {
        this._pendingValue = next;
        return;
      }
      this._dirty = true;
      this._input.value = next;
      this._syncForm();
    }

    get valueAsDate() {
      if (!this._native) return null;
      try { return this._input.valueAsDate; } catch (e) { return null; }
    }

    get locale() {
      return this._resolveLocale() || (navigator.language || '');
    }

    get form() { return this._internals ? this._internals.form : null; }
    get validity() { return this._internals ? this._internals.validity : this._input.validity; }
    get validationMessage() { return this._internals ? this._internals.validationMessage : this._input.validationMessage; }
    get willValidate() { return this._internals ? this._internals.willValidate : true; }
    checkValidity() { return this._internals ? this._internals.checkValidity() : this._input.checkValidity(); }
    reportValidity() { return this._internals ? this._internals.reportValidity() : this._input.reportValidity(); }

    focus(options) { this._input.focus(options); }
    blur() { this._input.blur(); }

    showPicker() {
      if (this._isDisabled() || this.readOnly) return;
      this._input.focus();
      if (this._native && typeof this._input.showPicker === 'function') {
        try { this._input.showPicker(); } catch (e) { /* no user gesture, or not supported: focus is enough */ }
      }
    }

    /* -------------------------- Internals -------------------------- */

    _upgrade(prop) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const v = this[prop];
        delete this[prop];
        this[prop] = v;
      }
    }

    _resolveType() {
      const t = (this.getAttribute('type') || 'date').toLowerCase();
      return TYPES.includes(t) ? t : 'date';
    }

    _isDisabled() {
      return this.disabled || this._formDisabled;
    }

    /** The `locale` attribute, else the nearest `lang`, crossing shadow roots. */
    _resolveLocale() {
      const own = this.getAttribute('locale');
      if (own) return own;
      let node = this;
      while (node) {
        if (node.nodeType === 1 && node.hasAttribute('lang')) return node.getAttribute('lang');
        node = node.parentNode || node.host || null;
      }
      return '';
    }

    _syncLocale() {
      const lang = this._resolveLocale();
      if (lang) this._input.setAttribute('lang', lang);
      else this._input.removeAttribute('lang');
    }

    _syncType() {
      const type = this._resolveType();
      this._type = type;
      const value = this._input.value;
      this._input.type = type;
      this._native = this._input.type === type;
      if (!this._native) {
        this._input.type = 'text';
        this._input.placeholder = FALLBACK[type].placeholder;
        this._input.pattern = FALLBACK[type].pattern;
        this._input.inputMode = type === 'week' ? 'text' : 'numeric';
        this._input.value = value;
      } else {
        this._input.removeAttribute('placeholder');
        this._input.removeAttribute('pattern');
        this._input.removeAttribute('inputmode');
      }
      this._input.toggleAttribute('data-native', this._native);
    }

    _sync() {
      if (this._input.dataset.kind !== this._resolveType()) {
        this._syncType();
        this._input.dataset.kind = this._type;
      }
      const input = this._input;
      ['min', 'max', 'step', 'autocomplete'].forEach((attr) => {
        const v = this.getAttribute(attr);
        if (v == null) input.removeAttribute(attr);
        else input.setAttribute(attr, v);
      });
      input.required = this.hasAttribute('required');
      input.readOnly = this.hasAttribute('readonly');
      input.disabled = this._isDisabled();

      const label = this.getAttribute('label') || '';
      this._labelEl.textContent = label;
      if (label) input.removeAttribute('aria-label');
      else input.setAttribute('aria-label', this.getAttribute('aria-label') || 'Date');

      const hint = this.getAttribute('hint') || '';
      const error = this.getAttribute('error') || '';
      this._hintEl.textContent = hint;
      this._errorEl.textContent = error;
      const describedBy = [hint && 'hint', error && 'error'].filter(Boolean).join(' ');
      if (describedBy) input.setAttribute('aria-describedby', describedBy);
      else input.removeAttribute('aria-describedby');
      if (error) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');

      this._syncLocale();
      this._mirrorDataAttrs();
      this._syncForm();
    }

    _syncForm() {
      if (!this._internals) return;
      const value = this.value;
      this._internals.setFormValue(value === '' ? null : value, this._input.value);
      const error = this.getAttribute('error');
      if (error) {
        this._internals.setValidity({ customError: true }, error, this._input);
        return;
      }
      const v = this._input.validity;
      const flags = {};
      VALIDITY_KEYS.forEach((k) => { if (v[k]) flags[k] = true; });
      let message = this._input.validationMessage;
      // A text fallback (month / week in Firefox) knows nothing of min and max;
      // ISO strings of one type compare in order, so check them here.
      if (!this._native && value && !this._input.readOnly) {
        const min = this.getAttribute('min');
        const max = this.getAttribute('max');
        if (min && value < min) { flags.rangeUnderflow = true; message = `Please enter ${min} or later.`; }
        if (max && value > max) { flags.rangeOverflow = true; message = `Please enter ${max} or earlier.`; }
      }
      if (flags.patternMismatch) message = `Please use the form ${FALLBACK[this._type].placeholder}.`;
      if (Object.keys(flags).length) this._internals.setValidity(flags, message || 'Please enter a valid value.', this._input);
      else this._internals.setValidity({});
    }

    /** data-* on the host is mirrored onto the field (Yii and other hooks). */
    _mirrorDataAttrs() {
      Array.from(this._input.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-') && attr.name !== 'data-native' && attr.name !== 'data-kind'
          && !this.hasAttribute(attr.name)) this._input.removeAttribute(attr.name);
      });
      Array.from(this.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-')) this._input.setAttribute(attr.name, attr.value);
      });
    }
  }

  customElements.define(TAG_NAME, KakaoDateInput);
})();
