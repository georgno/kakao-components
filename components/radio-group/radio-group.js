/**
 * <kakao-radio-group>
 * ============================================================================
 * A set of radio buttons built from `list-data`: label, hint, error, vertical or
 * horizontal layout, three sizes. Form-associated: the chosen value is
 * submitted under `name`. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="radio-group.js"><\/script>
 *
 *   <kakao-radio-group label="Plan" name="plan" value="team"
 *     list-data='[{"value":"solo","label":"Solo"},
 *                 {"value":"team","label":"Team","hint":"up to 10 people"},
 *                 {"value":"enterprise","label":"Enterprise","disabled":true}]'>
 *   </kakao-radio-group>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  list-data     JSON array of options (never "data"): strings or
 *                { value, label?, hint?, disabled? }.
 *  label         Group label (fieldset legend).
 *  hint          Helper text under the options.
 *  error         Error text: red, and the validation message.
 *  value         The checked value; reflected when the user picks.
 *  name          Form field name (form-associated).
 *  orientation   "vertical" (default) | "horizontal".
 *  size          "sm" | "md" (default) | "lg".
 *  disabled      Disables every option.
 *  required      With a form: blocks submitting with nothing picked.
 *  aria-label    Used when there is no visible label.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value · disabled        Property mirrors.
 *  getData()               Deep copy of the options.
 *  setData(options)        Replace the options (same shape as list-data).
 *  focus()                 Focus the checked option (or the first one).
 *
 *  Calls made before the element is connected are queued.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  input · change          native events when the user picks
 *  radio-change            { value, label, previous }
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-radio-group';
  if (customElements.get(TAG_NAME)) return;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-radio-group- (written by construction.html, edit there) */
        --_text: var(--kakao-radio-group-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-radio-group-muted, var(--kakao-color-muted, #62626c));
        --_dot-bg: var(--kakao-radio-group-dot-bg, var(--kakao-color-bg, #ffffff));
        --_dot-border: var(--kakao-radio-group-dot-border, var(--kakao-color-border, #82828b));
        --_dot-checked-bg: var(--kakao-radio-group-dot-checked-bg, var(--kakao-color-ink, #18181b));
        --_dot-checked-border: var(--kakao-radio-group-dot-checked-border, var(--kakao-color-ink, #18181b));
        --_mark: var(--kakao-radio-group-mark, var(--kakao-color-on-ink, #fafafa));
        --_focus: var(--kakao-radio-group-focus, var(--kakao-color-focus, #2563eb));
        --_danger: var(--kakao-radio-group-danger, var(--kakao-color-danger, #dc2626));
        --_hover-bg: var(--kakao-radio-group-hover-bg, var(--kakao-color-subtle, #f0f0f1));
        --_font: var(--kakao-radio-group-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_dot-size: var(--kakao-radio-group-dot-size, 20px);
        --_gap: var(--kakao-radio-group-gap, 10px);
        --_option-gap: var(--kakao-radio-group-option-gap, 4px);
        --_option-padding: var(--kakao-radio-group-option-padding, 2px 8px);
        --_radius: var(--kakao-radio-group-radius, 10px);
        --_label-weight: var(--kakao-radio-group-label-weight, 600);
        --_focus-width: var(--kakao-radio-group-focus-width, 2px);
        --_focus-offset: var(--kakao-radio-group-focus-offset, 2px);
        --_disabled-opacity: var(--kakao-radio-group-disabled-opacity, 0.55);
        /* @kakao-settings:end */
        display: block;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) { --_dot-size: var(--kakao-radio-group-sm-dot-size, 16px); font-size: 0.875rem; }
      :host([size="lg"]) { --_dot-size: var(--kakao-radio-group-lg-dot-size, 24px); font-size: 1rem; }

      fieldset {
        margin: 0;
        padding: 0;
        border: 0;
        min-width: 0;
      }
      .label {
        display: block;
        padding: 0;
        margin: 0 0 8px;
        font-weight: var(--_label-weight);
        font-size: 0.82rem;
      }
      .label:empty { display: none; }

      .options { display: grid; gap: var(--_option-gap); }
      :host([orientation="horizontal"]) .options {
        grid-auto-flow: column;
        justify-content: start;
        align-items: start;
        gap: calc(var(--_option-gap) * 1.6);
      }

      .option {
        display: flex;
        align-items: flex-start;
        gap: var(--_gap);
        padding: var(--_option-padding);
        border-radius: var(--_radius);
        cursor: pointer;
        user-select: none;
      }
      .option:hover { background: var(--_hover-bg); }
      :host([disabled]) .option,
      .option.is-disabled { cursor: not-allowed; opacity: var(--_disabled-opacity); background: none; }

      /* One label line tall, dot centred in it: the dot sits on the first
         line of the option label whatever follows (hint, wrapped lines). */
      .control {
        position: relative;
        display: inline-flex;
        align-items: center;
        flex: none;
        height: 1.4em;
        height: 1lh;
      }
      input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        opacity: 0;
        cursor: inherit;
      }
      .dot {
        box-sizing: border-box;
        width: var(--_dot-size);
        height: var(--_dot-size);
        border: 1px solid var(--_dot-border);
        border-radius: 50%;
        background: var(--_dot-bg);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 120ms ease, border-color 120ms ease;
      }
      .dot::after {
        content: "";
        width: 44%;
        height: 44%;
        border-radius: 50%;
        background: var(--_mark);
        transform: scale(0);
        transition: transform 120ms ease;
      }
      input:checked + .dot { background: var(--_dot-checked-bg); border-color: var(--_dot-checked-border); }
      input:checked + .dot::after { transform: scale(1); }
      input:focus-visible + .dot { outline: var(--_focus-width) solid var(--_focus); outline-offset: var(--_focus-offset); }
      :host([error]) .dot { border-color: var(--_danger); }

      .text { display: grid; gap: 2px; min-width: 0; }
      .option-label { font-weight: 450; }
      .option-hint { font-size: 0.78rem; color: var(--_muted); }
      .option-hint:empty { display: none; }

      .hint, .error { margin: 8px 0 0; font-size: 0.78rem; color: var(--_muted); }
      .hint:empty, .error:empty { display: none; }
      .error { color: var(--_danger); }
      :host([error]) .hint { display: none; }

      @media (prefers-reduced-motion: reduce) {
        .dot, .dot::after { transition: none; }
      }
    </style>
    <fieldset>
      <legend class="label" part="label"></legend>
      <div class="options" part="options"></div>
      <p class="hint" part="hint"></p>
      <p class="error" part="error" role="alert"></p>
    </fieldset>
  `;

  let seq = 0;

  class KakaoRadioGroup extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['list-data', 'label', 'hint', 'error', 'value', 'name', 'orientation',
        'size', 'disabled', 'required', 'aria-label'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._optionsEl = shadow.querySelector('.options');
      this._legendEl = shadow.querySelector('.label');
      this._hintEl = shadow.querySelector('.hint');
      this._errorEl = shadow.querySelector('.error');
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      this._items = [];
      this._base = `${TAG_NAME}-${++seq}`;
      this._hintEl.id = `${this._base}-hint`;
      this._errorEl.id = `${this._base}-error`;
      this._connected = false;
      this._pending = [];
      this._reflecting = false;
    }

    connectedCallback() {
      this._connected = true;
      this._optionsEl.addEventListener('change', (e) => this._onChange(e));
      this._readItems();
      this._render();
      this._sync();
      while (this._pending.length) {
        const { method, args } = this._pending.shift();
        this[method](...args);
      }
    }

    disconnectedCallback() {
      this._connected = false;
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'value') {
        if (this._reflecting) return;
        this._syncChecked();
        this._syncForm();
        return;
      }
      if (!this._connected) return;
      if (name === 'list-data') this._readItems();
      if (name === 'list-data' || name === 'disabled' || name === 'name') this._render();
      this._sync();
    }

    /* -------------------------- Public API -------------------------- */

    get value() {
      const checked = this._inputFor(this.getAttribute('value'));
      if (checked) return checked.value;
      const any = this._optionsEl.querySelector('input:checked');
      return any ? any.value : '';
    }

    set value(v) {
      if (!this._connected) {
        this._pending.push({ method: 'setValue', args: [v] });
        return;
      }
      this.setAttribute('value', v == null ? '' : String(v));
    }

    setValue(v) {
      this.value = v;
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }

    set disabled(v) {
      this.toggleAttribute('disabled', !!v);
    }

    getData() {
      return this._items.map((it) => ({ ...it }));
    }

    setData(items) {
      if (!this._connected) {
        this._pending.push({ method: 'setData', args: [items] });
        return;
      }
      this._items = this._normalize(items);
      this._render();
      this._sync();
    }

    focus(options) {
      const target = this._inputFor(this.getAttribute('value'))
        || this._optionsEl.querySelector('input:not(:disabled)');
      if (target) target.focus(options);
    }

    /* -------------------------- Internals -------------------------- */

    _normalize(list) {
      return (Array.isArray(list) ? list : [])
        .map((raw, i) => (raw !== null && typeof raw === 'object' ? raw : { value: raw }))
        .filter((it) => it && it.value != null)
        .map((it, i) => ({
          value: String(it.value),
          label: it.label != null ? String(it.label) : String(it.value),
          hint: it.hint != null ? String(it.hint) : '',
          disabled: !!it.disabled,
          index: i,
        }));
    }

    _readItems() {
      const raw = this.getAttribute('list-data');
      let list = null;
      if (raw) {
        try {
          list = JSON.parse(raw);
        } catch (err) {
          console.error(`<${TAG_NAME}> failed to parse list-data as JSON:`, err);
        }
      }
      this._items = this._normalize(list);
    }

    _inputFor(value) {
      if (value == null || value === '') return null;
      return Array.from(this._optionsEl.querySelectorAll('input')).find((i) => i.value === value) || null;
    }

    _render() {
      const name = this.getAttribute('name') || this._name;
      const disabled = this.hasAttribute('disabled');
      this._optionsEl.textContent = '';
      this._items.forEach((it, i) => {
        const label = document.createElement('label');
        label.className = it.disabled || disabled ? 'option is-disabled' : 'option';
        label.dataset.index = String(i);
        label.dataset.value = it.value;

        const control = document.createElement('span');
        control.className = 'control';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = it.value;
        input.required = this.hasAttribute('required');
        input.disabled = disabled || it.disabled;
        input.checked = this.getAttribute('value') === it.value;
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.setAttribute('aria-hidden', 'true');
        control.append(input, dot);

        const text = document.createElement('span');
        text.className = 'text';
        const labelEl = document.createElement('span');
        labelEl.className = 'option-label';
        labelEl.textContent = it.label;
        const hintEl = document.createElement('span');
        hintEl.className = 'option-hint';
        hintEl.textContent = it.hint;
        text.append(labelEl, hintEl);

        label.append(control, text);
        this._optionsEl.append(label);
      });
    }

    _sync() {
      const label = this.getAttribute('label') || '';
      this._legendEl.textContent = label;
      const hint = this.getAttribute('hint') || '';
      const error = this.getAttribute('error') || '';
      this._hintEl.textContent = hint;
      this._errorEl.textContent = error;
      const describedBy = [hint && this._hintEl.id, error && this._errorEl.id].filter(Boolean).join(' ');
      Array.from(this._optionsEl.querySelectorAll('input')).forEach((input) => {
        if (label) input.setAttribute('aria-label', `${label}: ${input.closest('.option').querySelector('.option-label').textContent}`);
        else input.removeAttribute('aria-label');
        if (describedBy) input.setAttribute('aria-describedby', describedBy);
        else input.removeAttribute('aria-describedby');
        if (error) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      });
      this._syncChecked();
      this._syncForm();
    }

    _syncChecked() {
      const value = this.getAttribute('value');
      Array.from(this._optionsEl.querySelectorAll('input')).forEach((input) => {
        input.checked = input.value === value;
      });
    }

    _syncForm() {
      if (!this._internals) return;
      const checked = this._optionsEl.querySelector('input:checked');
      this._internals.setFormValue(checked ? checked.value : null);
      const error = this.getAttribute('error');
      const anchor = this._optionsEl.querySelector('input');
      if (error) this._internals.setValidity({ customError: true }, error, anchor || undefined);
      else if (this.hasAttribute('required') && !checked) this._internals.setValidity({ valueMissing: true }, 'Please choose one.', anchor || undefined);
      else this._internals.setValidity({});
    }

    _onChange(e) {
      const input = e.target;
      if (!input || input.type !== 'radio' || !input.checked) return;
      const previous = this.getAttribute('value') || '';
      this._reflecting = true;
      this.setAttribute('value', input.value);
      this._reflecting = false;
      const item = this._items.find((it) => it.value === input.value);
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      this.dispatchEvent(new CustomEvent('radio-change', {
        bubbles: true,
        composed: true,
        detail: { value: input.value, label: item ? item.label : input.value, previous },
      }));
      this._syncForm();
    }
  }

  customElements.define(TAG_NAME, KakaoRadioGroup);
})();
