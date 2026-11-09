/**
 * <kakao-checkbox>
 * ============================================================================
 * A checkbox with a label, optional hint, indeterminate state and three sizes.
 * Form-associated: `name` / `value` are submitted while checked. Vanilla JS,
 * Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="checkbox.js"><\/script>
 *
 *   <kakao-checkbox label="Send me the newsletter"></kakao-checkbox>
 *   <kakao-checkbox label="Select all" indeterminate></kakao-checkbox>
 *   <kakao-checkbox name="terms" value="yes" label="I accept the terms" required></kakao-checkbox>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  label         Visible label next to the box (also its accessible name).
 *  hint          Smaller line under the label.
 *  checked       Checked state; reflected when the user toggles.
 *  indeterminate Partial state (a dash); cleared as soon as the user clicks.
 *  disabled · required · name · value   Form participation.
 *  size          "sm" | "md" (default) | "lg".
 *  error         Error text under the box (red) - also the validation message.
 *
 *  data-* attributes on the host are mirrored onto the inner checkbox.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  checked · indeterminate · disabled · value   Property mirrors.
 *  focus() · blur()
 *
 *  Calls made before the element is connected are queued.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  input · change        native events, as a checkbox fires them
 *  checkbox-change       { checked, indeterminate, value, previous }
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-checkbox';
  if (customElements.get(TAG_NAME)) return;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-checkbox- (written by construction.html, edit there) */
        --_text: var(--kakao-checkbox-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-checkbox-muted, var(--kakao-color-muted, #62626c));
        --_box-bg: var(--kakao-checkbox-box-bg, var(--kakao-color-bg, #ffffff));
        --_box-border: var(--kakao-checkbox-box-border, var(--kakao-color-border, #82828b));
        --_box-checked-bg: var(--kakao-checkbox-box-checked-bg, var(--kakao-color-ink, #18181b));
        --_box-checked-border: var(--kakao-checkbox-box-checked-border, var(--kakao-color-ink, #18181b));
        --_mark: var(--kakao-checkbox-mark, var(--kakao-color-on-ink, #fafafa));
        --_focus: var(--kakao-checkbox-focus, var(--kakao-color-focus, #2563eb));
        --_danger: var(--kakao-checkbox-danger, var(--kakao-color-danger, #dc2626));
        --_font: var(--kakao-checkbox-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_box-size: var(--kakao-checkbox-box-size, 20px);
        --_box-radius: var(--kakao-checkbox-box-radius, 6px);
        --_gap: var(--kakao-checkbox-gap, 10px);
        --_label-weight: var(--kakao-checkbox-label-weight, 450);
        --_focus-width: var(--kakao-checkbox-focus-width, 2px);
        --_focus-offset: var(--kakao-checkbox-focus-offset, 2px);
        --_disabled-opacity: var(--kakao-checkbox-disabled-opacity, 0.55);
        /* @kakao-settings:end */
        display: inline-block;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) { --_box-size: var(--kakao-checkbox-sm-box-size, 16px); --_box-radius: var(--kakao-checkbox-sm-box-radius, 5px); font-size: 0.875rem; }
      :host([size="lg"]) { --_box-size: var(--kakao-checkbox-lg-box-size, 24px); --_box-radius: var(--kakao-checkbox-lg-box-radius, 7px); font-size: 1rem; }
      :host([disabled]) { opacity: var(--_disabled-opacity); }

      .wrap {
        display: inline-flex;
        align-items: flex-start;
        vertical-align: top; /* no baseline gap under the row */
        gap: var(--_gap);
        cursor: pointer;
        user-select: none;
      }
      :host([disabled]) .wrap { cursor: not-allowed; }

      /* One label line tall, box centred in it: the box sits on the first
         line of the label whatever follows (hint, error, wrapped lines). */
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
      .box {
        box-sizing: border-box;
        width: var(--_box-size);
        height: var(--_box-size);
        border: 1px solid var(--_box-border);
        border-radius: var(--_box-radius);
        background: var(--_box-bg);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--_mark);
        transition: background-color 120ms ease, border-color 120ms ease;
      }
      .box svg { width: 72%; height: 72%; display: none; }
      input:checked + .box,
      input:indeterminate + .box {
        background: var(--_box-checked-bg);
        border-color: var(--_box-checked-border);
      }
      input:checked + .box .check { display: block; }
      input:indeterminate + .box .dash { display: block; }
      input:focus-visible + .box { outline: var(--_focus-width) solid var(--_focus); outline-offset: var(--_focus-offset); }
      :host([error]) .box { border-color: var(--_danger); }

      .text { display: grid; gap: 2px; min-width: 0; }
      .label { font-weight: var(--_label-weight); }
      .label:empty { display: none; }
      .hint { font-size: 0.78rem; color: var(--_muted); }
      .hint:empty { display: none; }
      .error { display: none; font-size: 0.78rem; color: var(--_danger); }
      :host([error]) .error { display: block; }

      @media (prefers-reduced-motion: reduce) {
        .box { transition: none; }
      }
    </style>
    <label class="wrap" part="wrap">
      <span class="control">
        <input type="checkbox" part="input" />
        <span class="box" part="box" aria-hidden="true">
          <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
          <svg class="dash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M6 12h12"/></svg>
        </span>
      </span>
      <span class="text">
        <span class="label" part="label"></span>
        <span class="hint" part="hint"></span>
        <span class="error" part="error"></span>
      </span>
    </label>
  `;

  class KakaoCheckbox extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['label', 'hint', 'error', 'checked', 'indeterminate', 'disabled', 'required', 'name', 'value', 'size'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._input = shadow.querySelector('input');
      this._labelEl = shadow.querySelector('.label');
      this._hintEl = shadow.querySelector('.hint');
      this._errorEl = shadow.querySelector('.error');
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      this._connected = false;
      this._pending = [];
      this._reflecting = false;
    }

    connectedCallback() {
      this._connected = true;
      this._input.addEventListener('change', () => {
        // Clicking a box leaves the indeterminate state, as native checkboxes do.
        if (this._input.indeterminate) {
          this._input.indeterminate = false;
          this.removeAttribute('indeterminate');
        }
        this._reflectChecked(this._input.checked);
        this._syncForm();
        const previous = !this._input.checked;
        this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('checkbox-change', {
          bubbles: true,
          composed: true,
          detail: { checked: this._input.checked, indeterminate: false, value: this.value, previous },
        }));
        this._mirrorDataAttrs();
      });
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
      if (name === 'checked') {
        if (this._reflecting) return;
        if (this._input) this._input.checked = newValue !== null;
        this._syncForm();
        return;
      }
      if (this._connected) this._sync();
    }

    /* -------------------------- Public API -------------------------- */

    get checked() {
      return this._input ? this._input.checked : this.hasAttribute('checked');
    }

    set checked(v) {
      if (!this._connected) {
        this._pending.push({ method: 'setChecked', args: [v] });
        return;
      }
      this._input.checked = !!v;
      this._reflectChecked(this._input.checked);
      this._syncForm();
    }

    setChecked(v) {
      this.checked = v;
    }

    get indeterminate() {
      return this._input ? this._input.indeterminate : this.hasAttribute('indeterminate');
    }

    set indeterminate(v) {
      if (!this._connected) {
        this._pending.push({ method: 'setIndeterminate', args: [v] });
        return;
      }
      this._input.indeterminate = !!v;
      this.toggleAttribute('indeterminate', !!v);
      this._syncForm();
    }

    setIndeterminate(v) {
      this.indeterminate = v;
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }

    set disabled(v) {
      this.toggleAttribute('disabled', !!v);
    }

    get value() {
      return this.getAttribute('value') || 'on';
    }

    set value(v) {
      this.setAttribute('value', v == null ? '' : String(v));
    }

    focus(options) {
      this._input.focus(options);
    }

    blur() {
      this._input.blur();
    }

    /* -------------------------- Rendering -------------------------- */

    _sync() {
      this._input.checked = this.hasAttribute('checked');
      this._input.indeterminate = this.hasAttribute('indeterminate');
      this._input.disabled = this.hasAttribute('disabled');
      this._input.required = this.hasAttribute('required');
      this._input.name = this.getAttribute('name') || '';
      this._input.value = this.value;
      this._labelEl.textContent = this.getAttribute('label') || '';
      this._hintEl.textContent = this.getAttribute('hint') || '';
      this._errorEl.textContent = this.getAttribute('error') || '';
      this._input.setAttribute('aria-label', this.getAttribute('label') || this.getAttribute('hint') || 'Checkbox');
      this._syncForm();
      this._mirrorDataAttrs();
    }

    _syncForm() {
      if (!this._internals) return;
      this._internals.setFormValue(this._input.checked ? this.value : null);
      const error = this.getAttribute('error');
      if (error) this._internals.setValidity({ customError: true }, error, this._input);
      else if (this.hasAttribute('required') && !this._input.checked) this._internals.setValidity({ valueMissing: true }, 'Please tick this box.', this._input);
      else this._internals.setValidity({});
    }

    _reflectChecked(checked) {
      if (this.hasAttribute('checked') === checked) return;
      this._reflecting = true;
      this.toggleAttribute('checked', checked);
      this._reflecting = false;
    }

    _mirrorDataAttrs() {
      Array.from(this._input.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-') && !this.hasAttribute(attr.name)) this._input.removeAttribute(attr.name);
      });
      Array.from(this.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-')) this._input.setAttribute(attr.name, attr.value);
      });
    }
  }

  customElements.define(TAG_NAME, KakaoCheckbox);
})();
