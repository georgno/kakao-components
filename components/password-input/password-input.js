/**
 * <kakao-password-input>
 * ============================================================================
 * A password field: the text input's look (label, hint, error, three sizes),
 * a show / hide button inside the field, a Caps Lock warning while typing,
 * and, opt-in, a list of requirements whose progress is drawn with the
 * segmented <kakao-progress>: one segment per requirement, so every
 * requirement the password meets completes a segment (and that segment
 * pops). Form-associated. Vanilla JS, Shadow DOM, no icon font.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="../progress/progress.js"><\/script>   (only for requirements)
 *   <script src="password-input.js"><\/script>
 *
 *   <kakao-password-input label="Password" name="password" required></kakao-password-input>
 *   <kakao-password-input label="New password" name="password" requirements
 *                         required-strength></kakao-password-input>
 *   <kakao-password-input label="PIN" requirements list-data='[
 *       {"label": "6 digits", "pattern": "^\\d{6}$"}]'></kakao-password-input>
 *
 * ----------------------------------------------------------------------------
 * DEPENDENCY: PROGRESS
 * ----------------------------------------------------------------------------
 *  With `requirements` the strength bar is a real <kakao-progress> in this
 *  element's shadow root, so the page loads components/progress/progress.js
 *  too (as a page using <kakao-toast> loads alert.js). Without it the list
 *  still works and the bar stays empty; a console warning says so once.
 *  The bar takes the progress's own settings (--kakao-progress-*), which
 *  inherit into the shadow root, so a page restyles both from one place.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  label         Visible label above the field.
 *  aria-label    Accessible name when there is no visible label.
 *  hint          Helper text below the field (hidden while there is an error).
 *  error         Error text: danger border and message, aria-invalid, and the
 *                validation message.
 *  placeholder   Placeholder text.
 *  value         The default value. It is NOT reflected back while typing
 *                (the password never lands in the DOM); form reset returns
 *                to it.
 *  name · required · disabled · readonly · minlength · maxlength
 *                Form participation, passed to the field.
 *  autocomplete  Passed through. Default: "new-password" with
 *                `requirements` (a password being chosen), "current-password"
 *                without (a sign-in).
 *  size          "sm" | "md" (default) | "lg".
 *  requirements  Opt-in: shows the strength bar and the requirement list.
 *                Without `list-data` the defaults are: at least 8 characters
 *                (or `minlength`, when set), a lowercase letter, an uppercase
 *                letter, a number, a symbol.
 *  list-data     JSON array of requirements, replacing the defaults:
 *                [{ "label": "8+ characters", "pattern": ".{8,}" }, …]
 *                `pattern` is a regular expression source tested against the
 *                value (not anchored), `flags` is optional (default "u", so
 *                \p{…} classes work). An item with an invalid pattern is
 *                left out, with a console warning.
 *  required-strength
 *                Makes unmet requirements a validation error: the form will
 *                not submit (patternMismatch, with a message naming what is
 *                missing). Empty: every requirement; a number N: at least N
 *                of them. Only a non-empty value is checked (an empty one is
 *                `required`'s business). Implies `requirements`, so the
 *                person always sees what is asked of them. Without it the
 *                requirements are advice only and never block the form.
 *  hide-toggle   No show / hide button.
 *
 *  data-* attributes on the host are mirrored onto the inner input.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value               Get / set the value (setting fires no events).
 *  visible             Get / set whether the password is shown as text.
 *  requirements        Get: the requirements in use, [{ label, met }].
 *                      Set: an array of { label, pattern, flags } or
 *                      { label, test(value) → boolean } (overrides list-data;
 *                      null goes back to it).
 *  met · total         How many requirements the value meets / are in use.
 *  valid               validity.valid, without firing an invalid event.
 *  checkValidity() · reportValidity() · validity · validationMessage
 *  willValidate · form · focus() · blur() · select()
 *  disabled · readOnly · required · name   Property mirrors.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed; from the host)
 * ----------------------------------------------------------------------------
 *  input                       every edit (value already updated)
 *  change                      when the field loses focus after an edit
 *  password-input-toggle       { visible } the show / hide button was used
 *  password-input-requirements { met, total, requirements: [{ label, met }] }
 *                              the set of met requirements changed (on edits
 *                              and when the requirements change)
 *
 *  Enter in the field submits its form (requestSubmit), as in a native
 *  sign-in form.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  - A real <label> is tied to the field; hint, error and the requirement
 *    list describe it (aria-describedby). Each requirement carries its state
 *    in words ("met" / "not met"), not colour alone: a check or an open
 *    circle.
 *  - The show / hide button is a real button with a fixed name, "Show
 *    password", and aria-pressed (true while the password is visible); only
 *    its icon swaps (eye / eye with a stroke). A changing name together with
 *    aria-pressed would read "Hide password, pressed", which inverts the
 *    meaning. Pointer use keeps focus and the caret in the field; the caret
 *    and selection survive every switch.
 *  - Caps Lock, while the field has focus and the key state is known: a
 *    visible warning under the field, at its end on the hint's line (the
 *    hint wraps beside it), and one polite announcement.
 *  - Requirement changes are announced politely, once typing pauses (about
 *    a second), only while the field has focus, and only what changed
 *    ("Met: A number. 3 of 5 requirements met."), never every keystroke.
 *  - The strength bar is hidden from assistive technology: it says what the
 *    list already says.
 *  - Focus is the shared 2px outline with 2px offset: on the field while
 *    typing, on the button when it has focus.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  Field: --kakao-password-input-bg / -text / -muted / -border / -focus /
 *  -danger / -font / -label-weight / -height / -padding-x / -radius /
 *  -label-gap / -message-gap / -focus-width / -focus-offset / -disabled-opacity
 *  Toggle: -toggle-size / -toggle-radius / -toggle-hover-bg / -icon-size
 *  Caps Lock and list: -warning / -success / -strength-gap / -list-offset / -list-gap /
 *  -list-min-column
 *  Motion: -duration / -ease
 *  Sizes: --kakao-password-input-sm-height / -sm-padding-x / -lg-height /
 *  -lg-padding-x (as on the text input), -sm-toggle-size.
 *
 * Parts: label, field, input, toggle, caps, hint, error, strength (the
 * kakao-progress), requirements (the list), requirement (each item).
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-password-input';
  if (customElements.get(TAG_NAME)) return;

  const ICON = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  const EYE = ICON('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>');
  const EYE_OFF = ICON('<path d="M10.6 5.6c.46-.07.92-.1 1.4-.1 6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-2.5 3.4M6.6 6.6C3.97 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.9 0 3.6-.65 5-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M3 3l18 18"/>');
  const CAPS = ICON('<path d="M12 4 4.5 12H9v4h6v-4h4.5L12 4Z"/><path d="M9 19.5h6"/>');
  const CHECK = ICON('<path d="M5 12.5l4.5 4.5L19 7.5"/>');
  const OPEN = ICON('<circle cx="12" cy="12" r="4.5"/>');

  /** The defaults; the length one follows minlength. */
  function defaultRequirements(min) {
    return [
      { label: `At least ${min} characters`, pattern: `.{${min},}` },
      { label: 'A lowercase letter', pattern: '\\p{Ll}' },
      { label: 'An uppercase letter', pattern: '\\p{Lu}' },
      { label: 'A number', pattern: '\\p{Nd}' },
      { label: 'A symbol', pattern: '[^\\p{L}\\p{N}\\s]' },
    ];
  }

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-password-input- (written by construction.html, edit there) */
        --_bg: var(--kakao-password-input-bg, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-password-input-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-password-input-muted, var(--kakao-color-muted, #62626c));
        --_border: var(--kakao-password-input-border, var(--kakao-color-field-border, #ececef));
        --_focus: var(--kakao-password-input-focus, var(--kakao-color-focus, #2563eb));
        --_danger: var(--kakao-password-input-danger, var(--kakao-color-danger, #dc2626));
        --_warning: var(--kakao-password-input-warning, var(--kakao-color-warning, #b45309));
        --_success: var(--kakao-password-input-success, var(--kakao-color-success, #15803d));
        --_toggle-hover-bg: var(--kakao-password-input-toggle-hover-bg, var(--kakao-color-subtle, #f0f0f1));
        --_font: var(--kakao-password-input-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_label-weight: var(--kakao-password-input-label-weight, 600);
        --_height: var(--kakao-password-input-height, 44px);
        --_padding-x: var(--kakao-password-input-padding-x, 12px);
        --_label-gap: var(--kakao-password-input-label-gap, 6px);
        --_message-gap: var(--kakao-password-input-message-gap, 5px);
        --_toggle-size: var(--kakao-password-input-toggle-size, 30px);
        --_icon-size: var(--kakao-password-input-icon-size, 18px);
        --_strength-gap: var(--kakao-password-input-strength-gap, 10px);
        --_list-offset: var(--kakao-password-input-list-offset, 8px);
        --_list-gap: var(--kakao-password-input-list-gap, 4px);
        --_list-min-column: var(--kakao-password-input-list-min-column, 11rem);
        --_radius: var(--kakao-password-input-radius, 10px);
        --_toggle-radius: var(--kakao-password-input-toggle-radius, 6px);
        --_focus-width: var(--kakao-password-input-focus-width, 2px);
        --_focus-offset: var(--kakao-password-input-focus-offset, 2px);
        --_disabled-opacity: var(--kakao-password-input-disabled-opacity, 0.55);
        --_duration: var(--kakao-password-input-duration, 150ms);
        --_ease: var(--kakao-password-input-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        display: block;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) { --_height: var(--kakao-password-input-sm-height, 36px); --_padding-x: var(--kakao-password-input-sm-padding-x, 10px); --_toggle-size: var(--kakao-password-input-sm-toggle-size, 26px); }
      :host([size="lg"]) { --_height: var(--kakao-password-input-lg-height, 52px); --_padding-x: var(--kakao-password-input-lg-padding-x, 14px); }
      :host([disabled]), :host(:disabled) { opacity: var(--_disabled-opacity); }

      .label {
        display: block;
        margin: 0 0 var(--_label-gap);
        font-weight: var(--_label-weight);
        font-size: 0.82rem;
        cursor: pointer;
      }
      .label:empty { display: none; }

      /* ---- Field: the text input's field ---- */
      .field {
        display: flex;
        align-items: center;
        gap: calc(var(--_padding-x) * 0.5);
        box-sizing: border-box;
        min-height: var(--_height);
        padding: 0 var(--_padding-x);
        background: var(--_bg);
        color: var(--_text);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        transition: border-color var(--_duration) var(--_ease), background-color var(--_duration) var(--_ease);
      }
      .field:has(input:focus-visible) {
        border-color: var(--_focus);
        outline: var(--_focus-width) solid var(--_focus);
        outline-offset: var(--_focus-offset);
      }
      :host([error]) .field { border-color: var(--_danger); }
      :host([error]) .field:has(input:focus-visible) { outline-color: var(--_danger); }

      /* width 0: the field never asks for the input's intrinsic width (a grid
         or flex parent would otherwise let it overflow). flex: 1 fills it. */
      input {
        flex: 1;
        width: 0;
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
      }
      input::placeholder { color: var(--_muted); opacity: 1; }
      input:disabled { cursor: not-allowed; }
      /* Edge's own reveal button: ours is the one. */
      input::-ms-reveal, input::-ms-clear { display: none; }
      :host([size="sm"]) input { font-size: 0.875rem; }
      :host([size="lg"]) input { font-size: 1rem; }

      /* ---- Show / hide: an icon button at the end of the field ---- */
      .toggle {
        position: relative;
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: var(--_toggle-size);
        height: var(--_toggle-size);
        margin-inline-end: calc((var(--_padding-x) - (var(--_height) - var(--_toggle-size)) / 2) * -1);
        padding: 0;
        border: 0;
        border-radius: var(--_toggle-radius);
        background: transparent;
        color: var(--_muted);
        cursor: pointer;
        transition: background-color var(--_duration) var(--_ease), color var(--_duration) var(--_ease);
      }
      .toggle[hidden] { display: none; }
      .toggle svg { width: var(--_icon-size); height: var(--_icon-size); }
      .toggle .off, .toggle[aria-pressed="true"] .on { display: none; }
      .toggle[aria-pressed="true"] .off { display: block; }
      .toggle:hover:not(:disabled) { background: var(--_toggle-hover-bg); color: var(--_text); }
      .toggle:focus-visible { outline: var(--_focus-width) solid var(--_focus); outline-offset: var(--_focus-offset); }
      .toggle:disabled { cursor: not-allowed; }

      /* ---- Rows under the field ----
         One line: the hint (or the error that replaces it) takes the room
         and wraps; the Caps Lock warning keeps to the end and never wraps.
         Nothing shown, the line takes no space. */
      .messages {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 0 0.75rem;
      }
      .caps, .hint, .error {
        margin: var(--_message-gap) 0 0;
        font-size: 0.78rem;
        color: var(--_muted);
      }
      /* Under about 9rem left for the hint, the warning moves below it. */
      .hint, .error { flex: 1 1 9rem; min-width: 0; overflow-wrap: anywhere; }
      .hint:empty, .error:empty { display: none; }
      .error { color: var(--_danger); }
      :host([error]) .hint { display: none; }

      .caps {
        flex: none;
        display: flex;
        align-items: center;
        gap: 0.35em;
        margin-inline-start: auto;
        color: var(--_text);
        font-weight: 500;
        white-space: nowrap;
      }
      .caps[hidden] { display: none; }
      /* One line box high, so the icon never makes the line taller. */
      .caps svg { flex: none; width: 1.2em; height: 1.2em; margin-block: -0.1em; color: var(--_warning); }

      .strength { margin-top: var(--_strength-gap); }
      .strength[hidden] { display: none; }

      .reqs {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--_list-min-column)), 1fr));
        gap: var(--_list-gap) 1rem;
        margin: var(--_list-offset) 0 0;
        padding: 0;
        list-style: none;
        font-size: 0.78rem;
        color: var(--_muted);
      }
      .reqs li {
        display: flex;
        align-items: flex-start;
        gap: 0.4em;
        min-width: 0;
        overflow-wrap: anywhere;
        transition: color var(--_duration) var(--_ease);
      }
      .reqs svg { flex: none; width: 1.25em; height: 1.25em; margin-top: 0.05em; }
      .reqs .on { display: none; color: var(--_success); }
      .reqs .off { opacity: 0.7; }
      .reqs li[data-met] { color: var(--_text); }
      .reqs li[data-met] .on { display: block; }
      .reqs li[data-met] .off { display: none; }

      .sr {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      @media (forced-colors: active) {
        .toggle:hover:not(:disabled) { background: transparent; outline: 1px solid ButtonText; }
        .caps svg, .reqs .on { color: CanvasText; }
      }

      @media (prefers-reduced-motion: reduce) {
        .field, .toggle, .reqs li { transition: none; }
      }
    </style>
    <label class="label" part="label" for="input"></label>
    <div class="field" part="field">
      <input id="input" part="input" type="password" autocapitalize="off" autocorrect="off" spellcheck="false" />
      <button class="toggle" part="toggle" type="button" aria-pressed="false" aria-label="Show password" aria-controls="input">
        <span class="on">${EYE}</span><span class="off">${EYE_OFF}</span>
      </button>
    </div>
    <div class="messages">
      <p class="hint" part="hint" id="hint"></p>
      <p class="error" part="error" id="error"></p>
      <p class="caps" part="caps" hidden aria-hidden="true">${CAPS}<span>Caps Lock is on</span></p>
    </div>
    <div class="strength" hidden>
      <kakao-progress part="strength" size="sm" aria-hidden="true" value="0" max="1" segments="1"></kakao-progress>
      <div id="reqs-desc">
        <span class="sr">Password requirements:</span>
        <ul class="reqs" part="requirements"></ul>
      </div>
    </div>
    <span class="sr" id="live" role="status" aria-live="polite"></span>
  `;

  const ANNOUNCE_DELAY = 1000;
  let warnedProgress = false;

  class KakaoPasswordInput extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['label', 'aria-label', 'hint', 'error', 'placeholder', 'value', 'name', 'required', 'disabled',
        'readonly', 'minlength', 'maxlength', 'autocomplete', 'size', 'requirements', 'list-data',
        'required-strength', 'hide-toggle'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      this._labelEl = shadow.querySelector('.label');
      this._input = shadow.querySelector('input');
      this._toggle = shadow.querySelector('.toggle');
      this._capsEl = shadow.querySelector('.caps');
      this._hintEl = shadow.querySelector('#hint');
      this._errorEl = shadow.querySelector('#error');
      this._strengthEl = shadow.querySelector('.strength');
      this._progress = shadow.querySelector('kakao-progress');
      this._listEl = shadow.querySelector('.reqs');
      this._live = shadow.querySelector('#live');

      this._initialised = false;
      this._pendingValue = null;
      this._dirty = false;
      this._formDisabled = false;
      this._visible = false;
      this._caps = false;
      this._custom = null;       // requirements set through the property
      this._reqs = [];           // [{ label, test }]
      this._met = [];            // booleans, per requirement
      this._listKey = '';        // labels rendered in the list
      this._announced = null;    // met state last announced
      this._announceTimer = 0;

      this._input.addEventListener('input', (e) => {
        e.stopPropagation();
        this._dirty = true;
        this._evaluate(true);
        this._syncForm();
        this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      });
      this._input.addEventListener('change', () => {
        this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      });
      this._input.addEventListener('keydown', (e) => {
        this._readCaps(e);
        if (e.key === 'Enter' && !e.isComposing) {
          const form = this.form;
          if (form && typeof form.requestSubmit === 'function') {
            e.preventDefault();
            form.requestSubmit();
          }
        }
      });
      this._input.addEventListener('keyup', (e) => this._readCaps(e));
      this._input.addEventListener('pointerdown', (e) => this._readCaps(e));
      this._input.addEventListener('focus', () => {
        this._announced = this._met.slice();
      });
      this._input.addEventListener('blur', () => {
        this._setCaps(false);
        this._flushAnnounce(false);
      });

      // Pointer: keep focus (and the caret) in the field. Keyboard: focus
      // stays on the button, so its new pressed state is read out.
      this._toggle.addEventListener('pointerdown', (e) => {
        if (this.shadowRoot.activeElement === this._input) e.preventDefault();
      });
      this._toggle.addEventListener('click', () => {
        this._setVisible(!this._visible);
        this.dispatchEvent(new CustomEvent('password-input-toggle', {
          bubbles: true, composed: true, detail: { visible: this._visible },
        }));
      });

      this._labelEl.addEventListener('click', (e) => {
        e.preventDefault();
        this._input.focus();
      });
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      ['value', 'visible', 'requirements'].forEach((p) => this._upgrade(p));
      if (!this._initialised) {
        this._initialised = true;
        this._input.value = this._pendingValue != null ? this._pendingValue : (this.getAttribute('value') || '');
        this._pendingValue = null;
      }
      this._sync();
    }

    disconnectedCallback() {
      clearTimeout(this._announceTimer);
      this._announceTimer = 0;
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this._initialised) return;
      if (name === 'value' && !this._dirty) this._input.value = newValue || '';
      this._sync();
    }

    formResetCallback() {
      this._dirty = false;
      this._input.value = this.getAttribute('value') || '';
      this._setVisible(false);
      this._sync();
    }

    formDisabledCallback(disabled) {
      this._formDisabled = disabled;
      this._sync();
    }

    formStateRestoreCallback() {
      // Passwords are not restored (the state saved is always empty).
    }

    /* -------------------------- Public API -------------------------- */

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
      this._input.value = next;
      this._evaluate(false);
      this._syncForm();
    }

    get visible() { return this._visible; }
    set visible(v) { this._setVisible(!!v); }

    get requirements() {
      return this._reqs.map((r, i) => ({ label: r.label, met: !!this._met[i] }));
    }

    set requirements(list) {
      this._custom = Array.isArray(list) ? list : null;
      if (this._initialised) this._sync();
    }

    get met() { return this._met.filter(Boolean).length; }
    get total() { return this._reqs.length; }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(v) { this.toggleAttribute('disabled', !!v); }
    get readOnly() { return this.hasAttribute('readonly'); }
    set readOnly(v) { this.toggleAttribute('readonly', !!v); }
    get required() { return this.hasAttribute('required'); }
    set required(v) { this.toggleAttribute('required', !!v); }
    get name() { return this.getAttribute('name') || ''; }
    set name(v) { this.setAttribute('name', v); }

    get form() { return this._internals ? this._internals.form : null; }
    get validity() { return this._internals ? this._internals.validity : this._input.validity; }
    get validationMessage() { return this._internals ? this._internals.validationMessage : this._input.validationMessage; }
    get willValidate() { return this._internals ? this._internals.willValidate : true; }
    get valid() { return this.validity.valid; }
    checkValidity() { return this._internals ? this._internals.checkValidity() : this._input.checkValidity(); }
    reportValidity() { return this._internals ? this._internals.reportValidity() : this._input.reportValidity(); }

    focus(options) { this._input.focus(options); }
    blur() { this._input.blur(); }
    select() { this._input.select(); }

    /* -------------------------- Internals -------------------------- */

    _upgrade(prop) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const v = this[prop];
        delete this[prop];
        this[prop] = v;
      }
    }

    _isDisabled() {
      return this.hasAttribute('disabled') || this._formDisabled;
    }

    _showsRequirements() {
      return this.hasAttribute('requirements') || this.hasAttribute('required-strength');
    }

    /** How many requirements must be met for the value to be valid, or 0 for none. */
    _strengthNeeded() {
      if (!this.hasAttribute('required-strength')) return 0;
      const n = parseInt(this.getAttribute('required-strength'), 10);
      const total = this._reqs.length;
      return Number.isFinite(n) && n > 0 ? Math.min(n, total) : total;
    }

    _setVisible(show) {
      if (show === this._visible) return;
      const input = this._input;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const dir = input.selectionDirection;
      this._visible = show;
      input.type = show ? 'text' : 'password';
      this._toggle.setAttribute('aria-pressed', String(show));
      if (start != null && end != null) {
        try { input.setSelectionRange(start, end, dir || 'none'); } catch (e) { /* not a text field */ }
      }
    }

    _readCaps(e) {
      if (typeof e.getModifierState !== 'function') return;
      this._setCaps(e.getModifierState('CapsLock'));
    }

    _setCaps(on) {
      const show = on && this.shadowRoot.activeElement === this._input;
      if (show === this._caps) return;
      this._caps = show;
      this._capsEl.hidden = !show;
      if (show) this._say('Caps Lock is on.');
    }

    _say(text) {
      // Clear first, so the same words are announced again next time.
      this._live.textContent = '';
      requestAnimationFrame(() => { this._live.textContent = text; });
    }

    /** The requirement list: property, else list-data, else the defaults. */
    _readRequirements() {
      let source = this._custom;
      if (!source && this.hasAttribute('list-data')) {
        try {
          const parsed = JSON.parse(this.getAttribute('list-data'));
          if (Array.isArray(parsed)) source = parsed;
          else console.warn(`${TAG_NAME}: list-data must be a JSON array`);
        } catch (err) {
          console.warn(`${TAG_NAME}: list-data is not valid JSON`, err);
        }
      }
      if (!source) {
        const min = parseInt(this.getAttribute('minlength'), 10);
        source = defaultRequirements(Number.isFinite(min) && min > 0 ? min : 8);
      }
      const out = [];
      source.forEach((item) => {
        if (!item || typeof item.label !== 'string' || !item.label.trim()) return;
        if (typeof item.test === 'function') {
          out.push({ label: item.label.trim(), test: (v) => !!item.test(v) });
          return;
        }
        if (typeof item.pattern !== 'string') return;
        try {
          const re = new RegExp(item.pattern, item.flags != null ? String(item.flags).replace(/[gy]/g, '') : 'u');
          out.push({ label: item.label.trim(), test: (v) => re.test(v) });
        } catch (err) {
          console.warn(`${TAG_NAME}: requirement "${item.label}" has an invalid pattern`, err);
        }
      });
      return out;
    }

    _renderList() {
      const key = JSON.stringify(this._reqs.map((r) => r.label));
      if (key === this._listKey) return;
      this._listKey = key;
      this._listEl.textContent = '';
      this._reqs.forEach((r) => {
        const li = document.createElement('li');
        li.setAttribute('part', 'requirement');
        const icon = document.createElement('span');
        icon.innerHTML = `<span class="on">${CHECK}</span><span class="off">${OPEN}</span>`;
        icon.style.display = 'contents';
        const text = document.createElement('span');
        text.textContent = r.label;
        const state = document.createElement('span');
        state.className = 'sr';
        li.append(icon, text, state);
        this._listEl.append(li);
      });
      const n = Math.max(this._reqs.length, 1);
      this._progress.setAttribute('segments', String(n));
      this._progress.setAttribute('max', String(n));
    }

    /** Tests the value; updates list, bar and (when typing) the announcement. */
    _evaluate(typing) {
      const value = this._input.value;
      const before = this._met;
      this._met = this._reqs.map((r) => {
        try { return value !== '' && r.test(value); } catch (e) { return false; }
      });
      const items = this._listEl.children;
      this._met.forEach((m, i) => {
        const li = items[i];
        if (!li) return;
        li.toggleAttribute('data-met', m);
        li.lastChild.textContent = m ? ': met.' : ': not met.';
      });
      const met = this.met;
      const total = this._reqs.length;
      this._progress.setAttribute('value', String(met));
      this._progress.setAttribute('tone', total && met === total ? 'success' : 'primary');

      const changed = before.length !== this._met.length || before.some((m, i) => m !== this._met[i]);
      if (changed) {
        this.dispatchEvent(new CustomEvent('password-input-requirements', {
          bubbles: true, composed: true, detail: { met, total, requirements: this.requirements },
        }));
      }
      if (typing && this._showsRequirements()) {
        clearTimeout(this._announceTimer);
        this._announceTimer = setTimeout(() => this._flushAnnounce(true), ANNOUNCE_DELAY);
      }
    }

    /** Says what changed since the last announcement (only while focused). */
    _flushAnnounce(speak) {
      clearTimeout(this._announceTimer);
      this._announceTimer = 0;
      const prev = this._announced;
      this._announced = this._met.slice();
      if (!speak || !prev || prev.length !== this._met.length) return;
      if (this.shadowRoot.activeElement !== this._input) return;
      const gained = [];
      const lost = [];
      this._met.forEach((m, i) => {
        if (m && !prev[i]) gained.push(this._reqs[i].label);
        if (!m && prev[i]) lost.push(this._reqs[i].label);
      });
      if (!gained.length && !lost.length) return;
      const total = this._reqs.length;
      const met = this.met;
      const parts = [];
      if (gained.length) parts.push(`Met: ${gained.join(', ')}.`);
      if (lost.length) parts.push(`No longer met: ${lost.join(', ')}.`);
      parts.push(met === total ? `All ${total} requirements met.` : `${met} of ${total} requirements met.`);
      this._say(parts.join(' '));
    }

    _sync() {
      const input = this._input;
      const shows = this._showsRequirements();
      ['placeholder', 'minlength', 'maxlength'].forEach((attr) => {
        const v = this.getAttribute(attr);
        if (v == null) input.removeAttribute(attr);
        else input.setAttribute(attr, v);
      });
      input.setAttribute('autocomplete', this.getAttribute('autocomplete') || (shows ? 'new-password' : 'current-password'));
      input.required = this.hasAttribute('required');
      input.readOnly = this.hasAttribute('readonly');
      input.disabled = this._isDisabled();
      this._toggle.disabled = this._isDisabled();
      this._toggle.hidden = this.hasAttribute('hide-toggle');
      if (this._toggle.hidden) this._setVisible(false);

      const label = this.getAttribute('label') || '';
      this._labelEl.textContent = label;
      if (label) input.removeAttribute('aria-label');
      else input.setAttribute('aria-label', this.getAttribute('aria-label') || 'Password');

      const hint = this.getAttribute('hint') || '';
      const error = this.getAttribute('error') || '';
      this._hintEl.textContent = hint;
      this._errorEl.textContent = error;

      this._reqs = this._readRequirements();
      this._strengthEl.hidden = !shows || !this._reqs.length;
      if (shows && !customElements.get('kakao-progress') && !warnedProgress) {
        warnedProgress = true;
        console.warn(`${TAG_NAME}: load progress.js (kakao-progress) for the strength bar to draw.`);
      }
      this._renderList();
      this._evaluate(false);
      if (this._announced && this._announced.length !== this._met.length) this._announced = this._met.slice();

      const describedBy = [hint && !error && 'hint', error && 'error', !this._strengthEl.hidden && 'reqs-desc']
        .filter(Boolean).join(' ');
      if (describedBy) input.setAttribute('aria-describedby', describedBy);
      else input.removeAttribute('aria-describedby');
      if (error) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');

      this._mirrorDataAttrs();
      this._syncForm();
    }

    _syncForm() {
      if (!this._internals) return;
      const value = this._input.value;
      this._internals.setFormValue(value === '' ? null : value, '');
      const error = this.getAttribute('error');
      if (error) {
        this._internals.setValidity({ customError: true }, error, this._input);
        return;
      }
      const v = this._input.validity;
      if (v.valueMissing) {
        this._internals.setValidity({ valueMissing: true }, this._input.validationMessage || 'Please fill in this field.', this._input);
        return;
      }
      if (v.tooShort || v.tooLong) {
        this._internals.setValidity(v.tooShort ? { tooShort: true } : { tooLong: true }, this._input.validationMessage, this._input);
        return;
      }
      const needed = this._strengthNeeded();
      if (needed && value !== '' && this.met < needed) {
        const missing = this._reqs.filter((r, i) => !this._met[i]).map((r) => r.label);
        const message = needed === this._reqs.length
          ? `Your password still needs: ${missing.join(', ')}.`
          : `Meet at least ${needed} of the ${this._reqs.length} password requirements (${this.met} so far).`;
        this._internals.setValidity({ patternMismatch: true }, message, this._input);
        return;
      }
      this._internals.setValidity({});
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

  customElements.define(TAG_NAME, KakaoPasswordInput);
})();
