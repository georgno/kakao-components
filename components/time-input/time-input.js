/**
 * <kakao-time-input>
 * ============================================================================
 * A time field that keeps the browser's own field and picker, dressed as the
 * library's other fields: label, hint, error, three sizes, the picker icon on
 * the right where the select's chevron sits. The field shows 12 or 24 hours
 * as the browser and the OS are set; the value is always ISO 24-hour.
 * The sibling of <kakao-date-input>. Form-associated. Vanilla JS, Shadow
 * DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="time-input.js"><\/script>
 *
 *   <kakao-time-input label="Start" name="start" value="09:30" step="900"></kakao-time-input>
 *   <kakao-time-input label="Check-in" min="15:00" max="22:00" now required></kakao-time-input>
 *   <kakao-time-input label="Lap" step="1" value="00:01:30"></kakao-time-input>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  label         Visible label above the field.
 *  aria-label    Accessible name when there is no visible label.
 *  hint          Helper text below the field (hidden while there is an error).
 *  error         Error text: danger border and message, aria-invalid, and the
 *                validation message.
 *  value         The default value, ISO 24-hour: 14:30 · 14:30:15 ·
 *                14:30:15.250. Form reset goes back to it.
 *  min · max     ISO times. min after max is a range over midnight
 *                (22:00 to 06:00), as on the native field.
 *  step          In seconds (default 60). Below 60, or not whole minutes, the
 *                field shows seconds and the value carries them.
 *  name · required · disabled · readonly · autocomplete   Form participation.
 *  size          "sm" | "md" (default) | "lg".
 *  now           Shows a small tag in the row under the field that sets the
 *                current time, rounded to step (counted from min; without
 *                step the minute), like a user edit (input and change once
 *                each). Outside min / max it stays but is disabled
 *                (aria-disabled, with a title and an accessible description
 *                saying why); hidden while disabled or read only.
 *  now-label     The tag's text. Default from Intl in the locale: "Now"
 *                ("Jetzt", "Maintenant" …).
 *  locale        Language tag for the inner field. Without it the nearest
 *                `lang` (the element's own, an ancestor's, <html>) is used,
 *                and followed when it changes.
 *
 *  data-* attributes on the host are mirrored onto the inner input.
 *
 * ----------------------------------------------------------------------------
 * 12 OR 24 HOURS: THE BROWSER DECIDES
 * ----------------------------------------------------------------------------
 *  The browser draws the field in ITS OWN format, not the page's: Chromium
 *  follows the browser's UI language (on Linux the process locale), Firefox
 *  its UI language or, if the user turned it on, the OS regional format,
 *  Safari the OS region. So a US browser shows 2:30 PM with an AM/PM segment,
 *  a German one 14:30. None of them reads `lang` (tested 2026-11, as for
 *  kakao-date-input). The component passes the locale to the inner input as
 *  `lang` (correct for assistive technology, and honoured should a browser
 *  start to); `locale` tells a page which locale to format the value with
 *  itself (Intl.DateTimeFormat). The value is always ISO 24-hour.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value            Get / set the ISO value ('' when empty or incomplete).
 *  valueAsNumber    Milliseconds since midnight, or NaN.
 *  valueAsDate      The time on 1970-01-01 UTC, or null.
 *  locale           The locale in use (read only).
 *  min · max · step · name · required · disabled · readOnly   Mirror the attributes.
 *  showPicker()     Opens the native picker where the browser allows it,
 *                   otherwise focuses the field. Needs a user gesture.
 *  focus() · blur()
 *  checkValidity() · reportValidity() · validity · validationMessage · form
 *
 *  Setting value never fires events (the now tag does, as a user edit).
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
 *  Chromium: redrawn in the muted colour with our clock glyph
 *  (--kakao-time-input-icon-size), centred where the select's chevron is.
 *  Firefox: its clock button can't be styled; it takes the text colour
 *  (lighter) and is moved onto the chevron's line with
 *  --kakao-time-input-moz-nudge.
 *  Safari (desktop) draws no icon; the segments take arrow keys. The field
 *  inherits the page's color-scheme, so pickers open dark in dark themes.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  - A real <label> is tied to the native field; hint and error describe it,
 *    the error sets aria-invalid. Keyboard and screen reader behaviour is the
 *    browser's own (segments with arrow keys, the picker).
 *  - Focus is the shared 2px outline with 2px offset, on the field.
 *  - The now tag is a real button after the hint; its name is "Set to now"
 *    (English locales) or its visible label. Focus stays on it. When it is
 *    disabled (out of range), the reason is its title for the mouse and,
 *    through aria-describedby, a visually hidden description for keyboard
 *    and screen reader users.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-time-input';
  if (customElements.get(TAG_NAME)) return;

  /* The ISO text form, for a browser with no time field. */
  const FALLBACK = { placeholder: 'HH:MM', pattern: '([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d(\\.\\d{1,3})?)?' };

  const VALIDITY_KEYS = ['valueMissing', 'typeMismatch', 'patternMismatch', 'tooLong', 'tooShort',
    'rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'badInput'];

  /* The clock glyph for the Chromium picker icon, used as a mask so the theme colours it. */
  const CLOCK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='8.5'/%3E%3Cpath d='M12 7.5V12l3 2'/%3E%3C/svg%3E")`;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-time-input- (written by construction.html, edit there) */
        --_bg: var(--kakao-time-input-bg, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-time-input-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-time-input-muted, var(--kakao-color-muted, #62626c));
        --_border: var(--kakao-time-input-border, var(--kakao-color-field-border, #ececef));
        --_focus: var(--kakao-time-input-focus, var(--kakao-color-focus, #2563eb));
        --_danger: var(--kakao-time-input-danger, var(--kakao-color-danger, #dc2626));
        --_font: var(--kakao-time-input-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_label-weight: var(--kakao-time-input-label-weight, 600);
        --_height: var(--kakao-time-input-height, 44px);
        --_padding-x: var(--kakao-time-input-padding-x, 12px);
        --_label-gap: var(--kakao-time-input-label-gap, 6px);
        --_message-gap: var(--kakao-time-input-message-gap, 5px);
        --_icon-size: var(--kakao-time-input-icon-size, 1em);
        --_moz-nudge: var(--kakao-time-input-moz-nudge, -0.36em);
        --_radius: var(--kakao-time-input-radius, 10px);
        --_focus-width: var(--kakao-time-input-focus-width, 2px);
        --_focus-offset: var(--kakao-time-input-focus-offset, 2px);
        --_disabled-opacity: var(--kakao-time-input-disabled-opacity, 0.55);
        --_duration: var(--kakao-time-input-duration, 150ms);
        --_ease: var(--kakao-time-input-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        --_now-bg: var(--kakao-time-input-now-bg, var(--kakao-color-subtle-strong, #e6e6e8));
        --_now-text: var(--kakao-time-input-now-text, var(--kakao-color-text, #18181b));
        --_now-height: var(--kakao-time-input-now-height, 1.25rem);
        --_now-padding-x: var(--kakao-time-input-now-padding-x, 0.4rem);
        --_now-font-size: var(--kakao-time-input-now-font-size, 0.78rem);
        --_now-font-weight: var(--kakao-time-input-now-font-weight, 600);
        --_now-radius: var(--kakao-time-input-now-radius, 4px);
        /* @kakao-settings:end */
        display: block;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) { --_height: var(--kakao-time-input-sm-height, 36px); --_padding-x: var(--kakao-time-input-sm-padding-x, 10px); }
      :host([size="lg"]) { --_height: var(--kakao-time-input-lg-height, 52px); --_padding-x: var(--kakao-time-input-lg-padding-x, 14px); }
      :host([disabled]), :host(:disabled) { opacity: var(--_disabled-opacity); }

      .label {
        display: block;
        margin: 0 0 var(--_label-gap);
        font-weight: var(--_label-weight);
        font-size: 0.82rem;
        cursor: pointer;
      }
      .label:empty { display: none; }

      /* ---- Field: the text input's field (as in the combobox and date input) ---- */
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

      /* Chromium: the browser's own picker button, redrawn with our clock in
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
        -webkit-mask: ${CLOCK} center / contain no-repeat;
        mask: ${CLOCK} center / contain no-repeat;
        opacity: 1;
        cursor: pointer;
      }
      input[data-native]::-webkit-calendar-picker-indicator:hover { background: var(--_text); }
      /* The icon's own tab stop (Chromium): drawn in the focus colour. */
      input[data-native]:focus-within:not(:focus)::-webkit-calendar-picker-indicator { background: var(--_focus); }
      input[data-native] { margin-inline-end: calc(0.45em - var(--_icon-size) / 2); }

      /* Firefox: its clock button can't be styled; this moves it onto the
         chevron's line (measured: ~0.36em further in than the chevron). Its
         segments also start 2px in; the start margin lines the text up with
         the other fields. */
      @supports (-moz-appearance: none) {
        input[data-native] { margin-inline: -2px var(--_moz-nudge); }
      }

      /* The row under the field: hint or error, then the now tag at the end
         (as the textarea's counter and the date input's today tag). */
      .below {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        justify-content: space-between;
      }
      .hint, .error { flex: 1; min-width: 0; margin: var(--_message-gap) 0 0; font-size: 0.78rem; color: var(--_muted); }
      .hint:empty, .error:empty { display: none; }
      .error { color: var(--_danger); }
      :host([error]) .hint { display: none; }

      /* The now tag: the chip's neutral tag, as a real button. */
      .now {
        position: relative;
        flex: none;
        display: inline-flex;
        align-items: center;
        box-sizing: border-box;
        height: var(--_now-height);
        margin: var(--_message-gap) 0 0 auto;
        padding: 0 var(--_now-padding-x);
        border: 0;
        border-radius: var(--_now-radius);
        background: var(--_now-bg);
        color: var(--_now-text);
        font-family: inherit;
        font-size: var(--_now-font-size);
        font-weight: var(--_now-font-weight);
        line-height: 1;
        white-space: nowrap;
        cursor: pointer;
        transition: background-color var(--_duration) var(--_ease);
      }
      .now[hidden] { display: none; }
      /* The drawn tag stays small; the tap target is at least 24 × 24px (WCAG 2.5.8). */
      .now::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: max(100%, 24px);
        height: max(100%, 24px);
        transform: translate(-50%, -50%);
      }
      .now:hover { background: color-mix(in srgb, var(--_now-text) 8%, var(--_now-bg)); }
      .now:focus-visible { outline: var(--_focus-width) solid var(--_focus); outline-offset: var(--_focus-offset); }
      .now[aria-disabled="true"] { opacity: var(--_disabled-opacity); cursor: not-allowed; }
      .now[aria-disabled="true"]:hover { background: var(--_now-bg); }
      /* The reason a disabled tag gives, read through aria-describedby. */
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
        .now { border: 1px solid ButtonText; }
        .now[aria-disabled="true"] { border-color: GrayText; color: GrayText; }
      }

      @media (prefers-reduced-motion: reduce) {
        .field, .now { transition: none; }
      }
    </style>
    <label class="label" part="label" id="label" for="input"></label>
    <div class="field" part="field">
      <input id="input" part="input" type="time" />
    </div>
    <div class="below">
      <p class="hint" part="hint" id="hint"></p>
      <p class="error" part="error" id="error"></p>
      <button class="now" part="now" type="button" hidden></button>
      <span class="sr" id="now-reason"></span>
    </div>
  `;

  /** "Now" in the locale, from Intl's relative time words ("Jetzt", "Maintenant" …). */
  function nowLabel(locale) {
    try {
      const loc = locale || undefined;
      const word = new Intl.RelativeTimeFormat(loc, { numeric: 'auto' }).format(0, 'second');
      return word.charAt(0).toLocaleUpperCase(loc) + word.slice(1);
    } catch (e) {
      return 'Now';
    }
  }

  const pad = (n) => String(n).padStart(2, '0');

  /** Seconds since midnight of an ISO time, or null. */
  function timeSeconds(v) {
    const m = /^(\d{2}):(\d{2})(?::(\d{2}))?/.exec(v || '');
    return m ? (+m[1]) * 3600 + (+m[2]) * 60 + (+(m[3] || 0)) : null;
  }

  /**
   * The current time snapped to step, counted from min (the native field's
   * step base): rounded, floored and ceiled, nearest first, for the range
   * check to choose from. Seconds are kept only when step or min has them.
   */
  function nowValues(step, min, now) {
    let stepSec = parseFloat(step);
    if (!(stepSec >= 1)) stepSec = 60;
    stepSec = Math.round(stepSec);
    const base = timeSeconds(min) || 0;
    const secs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const withSeconds = stepSec % 60 !== 0 || base % 60 !== 0;
    return ['round', 'floor', 'ceil'].map((mode) => {
      const snapped = base + Math[mode]((secs - base) / stepSec) * stepSec;
      const t = ((snapped % 86400) + 86400) % 86400;
      const hm = `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}`;
      return withSeconds ? `${hm}:${pad(t % 60)}` : hm;
    });
  }

  /** Whether an ISO time lies within min and max; min after max runs over midnight. */
  function inRange(v, min, max) {
    const norm = (x) => (x && x.length === 5 ? `${x}:00` : x);
    const val = norm(v);
    const lo = norm(min);
    const hi = norm(max);
    if (lo && hi && lo > hi) return val >= lo || val <= hi;
    return (!lo || val >= lo) && (!hi || val <= hi);
  }

  /* One observer for every instance: a `lang` change anywhere re-resolves the locale. */
  const instances = new Set();
  let langObserver = null;
  function watchLang() {
    if (langObserver || typeof MutationObserver !== 'function') return;
    langObserver = new MutationObserver(() => instances.forEach((el) => el._syncLocale()));
    langObserver.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['lang'] });
  }

  class KakaoTimeInput extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['label', 'aria-label', 'hint', 'error', 'value', 'min', 'max', 'step', 'name',
        'required', 'disabled', 'readonly', 'autocomplete', 'size', 'locale', 'now', 'now-label'];
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
      this._nowEl = shadow.querySelector('.now');
      this._nowReasonEl = shadow.querySelector('#now-reason');
      // A browser without a time field gets the ISO text form.
      this._native = this._input.type === 'time';
      if (this._native) {
        this._input.setAttribute('data-native', '');
      } else {
        this._input.type = 'text';
        this._input.placeholder = FALLBACK.placeholder;
        this._input.pattern = FALLBACK.pattern;
        this._input.inputMode = 'numeric';
      }
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

      // The now tag: sets the value like a user edit. Its range state is
      // refreshed when it is about to be used, so it follows the clock.
      this._nowEl.addEventListener('click', () => this._applyNow());
      this._nowEl.addEventListener('focus', () => this._syncNow());
      this._nowEl.addEventListener('pointerenter', () => this._syncNow());
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      this._upgrade('value');
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
      return new RegExp(`^(?:${FALLBACK.pattern})$`).test(v) ? v : '';
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

    get valueAsNumber() {
      const v = this.value;
      const m = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(v);
      if (!m) return NaN;
      return ((+m[1]) * 3600 + (+m[2]) * 60 + (+(m[3] || 0))) * 1000 + (+((m[4] || '0').padEnd(3, '0')));
    }

    get valueAsDate() {
      const n = this.valueAsNumber;
      return Number.isNaN(n) ? null : new Date(n);
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
      this._syncNow();
    }

    /** The value the now tag sets, and whether min and max allow it. */
    _nowTarget() {
      const min = this.getAttribute('min') || '';
      const max = this.getAttribute('max') || '';
      const values = nowValues(this.getAttribute('step'), min, new Date());
      const value = values.find((v) => inRange(v, min, max));
      return { value: value || values[0], allowed: !!value, min, max };
    }

    _syncNow() {
      const tag = this._nowEl;
      const show = this.hasAttribute('now') && !this._isDisabled() && !this.hasAttribute('readonly');
      tag.hidden = !show;
      if (!show) return;
      const custom = this.getAttribute('now-label');
      const lang = this._resolveLocale() || navigator.language || 'en';
      const label = custom || nowLabel(lang);
      tag.textContent = label;
      // "Set to now" where the words are English; elsewhere the visible
      // label alone (there is no cheap localised verb).
      if (!custom && /^en\b/i.test(lang)) tag.setAttribute('aria-label', `Set to ${label.toLowerCase()}`);
      else tag.removeAttribute('aria-label');

      const { value, allowed, min, max } = this._nowTarget();
      if (allowed) {
        tag.removeAttribute('aria-disabled');
        tag.removeAttribute('title');
        tag.removeAttribute('aria-describedby');
        this._nowReasonEl.textContent = '';
      } else {
        const range = min && max ? `${min} to ${max}` : (min ? `${min} or later` : `${max} or earlier`);
        const reason = `${label} (${value}) is outside the allowed range: ${range}.`;
        tag.setAttribute('aria-disabled', 'true');
        tag.title = reason;  // for the mouse
        this._nowReasonEl.textContent = reason;  // for keyboard and screen readers
        tag.setAttribute('aria-describedby', 'now-reason');
      }
    }

    _applyNow() {
      this._syncNow();
      const tag = this._nowEl;
      if (tag.hidden || tag.getAttribute('aria-disabled') === 'true') return;
      const { value } = this._nowTarget();
      this._dirty = true;
      this._input.value = value;
      this._syncForm();
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }

    _sync() {
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
      else input.setAttribute('aria-label', this.getAttribute('aria-label') || 'Time');

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
      // The text fallback knows nothing of min and max; check them here.
      if (!this._native && value && !this._input.readOnly) {
        const min = this.getAttribute('min');
        const max = this.getAttribute('max');
        if (!inRange(value, min, max)) {
          if (min && !(max && min > max) && timeSeconds(value) < timeSeconds(min)) { flags.rangeUnderflow = true; message = `Please enter ${min} or later.`; }
          else { flags.rangeOverflow = true; message = `Please enter ${max} or earlier.`; }
        }
      }
      if (flags.patternMismatch) message = `Please use the form ${FALLBACK.placeholder}.`;
      if (Object.keys(flags).length) this._internals.setValidity(flags, message || 'Please enter a valid time.', this._input);
      else this._internals.setValidity({});
    }

    /** data-* on the host is mirrored onto the field (Yii and other hooks). */
    _mirrorDataAttrs() {
      Array.from(this._input.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-') && attr.name !== 'data-native'
          && !this.hasAttribute(attr.name)) this._input.removeAttribute(attr.name);
      });
      Array.from(this.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-')) this._input.setAttribute(attr.name, attr.value);
      });
    }
  }

  customElements.define(TAG_NAME, KakaoTimeInput);
})();
