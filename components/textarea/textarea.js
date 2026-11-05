/**
 * <kakao-textarea>
 * ============================================================================
 * A multi-line text field: label, hint, error, an optional character counter
 * and optional auto-growing (up to max-height). Form-associated. Vanilla JS,
 * Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="textarea.js"><\/script>
 *
 *   <kakao-textarea label="Message" name="message" rows="4"
 *                   placeholder="Write a message…"></kakao-textarea>
 *   <kakao-textarea label="Bio" maxlength="140" counter autosize
 *                   hint="Shown on your profile"></kakao-textarea>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  label         Visible label above the field.
 *  hint          Helper text below the field (hidden while there is an error).
 *  error         Error text: red field and message; aria-invalid, describedby.
 *  placeholder   Placeholder text.
 *  value         The current value (reflected back on input).
 *  rows          Initial visible rows (default 3).
 *  maxlength     Maximum characters; with counter it shows "n / max".
 *  counter       Show the character counter (needs maxlength for the total).
 *  autosize      Grow with the content (up to max-height), no scrollbar until then.
 *  max-height    Height cap for autosize (any CSS length, default 18rem).
 *  resize        "vertical" (default) | "none" | "both" | "horizontal".
 *  name · required · disabled · readonly   Form participation.
 *  size          "sm" | "md" (default) | "lg".
 *
 *  data-* attributes on the host are mirrored onto the field.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value                 Get / set the value.
 *  focus() · blur() · select()
 *  disabled · readOnly   Property mirrors.
 *
 *  Calls made before the element is connected are queued.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  input        every keystroke (value and counter already updated)
 *  change       when the field loses focus
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-textarea';
  if (customElements.get(TAG_NAME)) return;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-textarea- (written by construction.html, edit there) */
        --_bg: var(--kakao-textarea-bg, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-textarea-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-textarea-muted, var(--kakao-color-muted, #62626c));
        --_border: var(--kakao-textarea-border, var(--kakao-color-border, #82828b));
        --_line: var(--kakao-textarea-line, var(--kakao-color-line, #e5e7eb));
        --_focus: var(--kakao-textarea-focus, var(--kakao-color-focus, #2563eb));
        --_danger: var(--kakao-textarea-danger, var(--kakao-color-danger, #dc2626));
        --_font: var(--kakao-textarea-font, 0.95rem/1.5 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_padding: var(--kakao-textarea-padding, 10px 12px);
        --_radius: var(--kakao-textarea-radius, 10px);
        --_min-height: var(--kakao-textarea-min-height, 88px);
        --_max-height: var(--kakao-textarea-max-height, 18rem);
        --_label-gap: var(--kakao-textarea-label-gap, 6px);
        --_message-gap: var(--kakao-textarea-message-gap, 5px);
        --_label-weight: var(--kakao-textarea-label-weight, 600);
        --_focus-width: var(--kakao-textarea-focus-width, 2px);
        --_disabled-opacity: var(--kakao-textarea-disabled-opacity, 0.55);
        /* @kakao-settings:end */
        display: block;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) { --_padding: var(--kakao-textarea-sm-padding, 7px 10px); font-size: 0.875rem; }
      :host([size="lg"]) { --_padding: var(--kakao-textarea-lg-padding, 12px 14px); font-size: 1rem; }
      :host([disabled]) { opacity: var(--_disabled-opacity); }

      .label {
        display: block;
        margin: 0 0 var(--_label-gap);
        font-weight: var(--_label-weight);
        font-size: 0.82rem;
        cursor: pointer;
      }
      .label:empty { display: none; }

      .field {
        display: flex;
        box-sizing: border-box;
        background: var(--_bg);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        transition: box-shadow 150ms ease, border-color 150ms ease;
      }
      :host([error]) .field { border-color: var(--_danger); }
      .field:has(textarea:focus-visible) {
        border-color: var(--_focus);
        box-shadow: 0 0 0 var(--_focus-width) color-mix(in srgb, var(--_focus) 22%, transparent);
      }
      :host([error]) .field:has(textarea:focus-visible) {
        border-color: var(--_danger);
        box-shadow: 0 0 0 var(--_focus-width) color-mix(in srgb, var(--_danger) 22%, transparent);
      }

      textarea {
        box-sizing: border-box;
        flex: 1;
        min-width: 0;
        min-height: var(--_min-height);
        margin: 0;
        padding: var(--_padding);
        border: 0;
        outline: none;
        background: none;
        color: inherit;
        font: inherit;
        line-height: 1.5;
        resize: vertical;
        field-sizing: content;
      }
      textarea::placeholder { color: var(--_muted); opacity: 1; }
      textarea:disabled { cursor: not-allowed; }
      :host([resize="none"]) textarea { resize: none; }
      :host([resize="both"]) textarea { resize: both; }
      :host([resize="horizontal"]) textarea { resize: horizontal; }
      :host([autosize]) textarea {
        resize: none;
        field-sizing: content;
        max-height: var(--_max-height);
        overflow-y: auto;
      }

      .below {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        justify-content: space-between;
      }
      .hint, .error {
        margin: var(--_message-gap) 0 0;
        font-size: 0.78rem;
        color: var(--_muted);
        flex: 1;
        min-width: 0;
      }
      .hint:empty, .error:empty { display: none; }
      .error { color: var(--_danger); }
      :host([error]) .hint { display: none; }
      .counter {
        display: none;
        margin: var(--_message-gap) 0 0 0;
        font-size: 0.78rem;
        color: var(--_muted);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      :host([counter]) .counter { display: block; }
      .counter.is-over { color: var(--_danger); }

      @media (prefers-reduced-motion: reduce) {
        .field { transition: none; }
      }
    </style>
    <label class="label" part="label"></label>
    <div class="field" part="field">
      <textarea part="textarea"></textarea>
    </div>
    <div class="below">
      <p class="hint" part="hint" id="hint"></p>
      <p class="error" part="error" id="error" role="alert"></p>
      <span class="counter" part="counter"></span>
    </div>
  `;

  let seq = 0;

  class KakaoTextarea extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['label', 'hint', 'error', 'placeholder', 'value', 'rows', 'maxlength',
        'counter', 'autosize', 'max-height', 'resize', 'name', 'required',
        'disabled', 'readonly', 'size'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._labelEl = shadow.querySelector('.label');
      this._fieldEl = shadow.querySelector('.field');
      this._area = shadow.querySelector('textarea');
      this._hintEl = shadow.querySelector('#hint');
      this._errorEl = shadow.querySelector('#error');
      this._counterEl = shadow.querySelector('.counter');
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;

      this._id = `kakao-textarea-${++seq}`;
      this._area.id = this._id;
      this._hintEl.id = `${this._id}-hint`;
      this._errorEl.id = `${this._id}-error`;
      this._labelEl.htmlFor = this._id;

      this._connected = false;
      this._pending = [];
      this._reflecting = false;
    }

    connectedCallback() {
      this._connected = true;
      this._area.addEventListener('input', () => {
        this._reflectValue(this._area.value);
        this._syncCounter();
        this._grow();
        this._syncForm();
        this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        this._mirrorDataAttrs();
      });
      this._area.addEventListener('change', () => {
        this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      });
      this._labelEl.addEventListener('click', (e) => {
        e.preventDefault();
        this._area.focus();
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
      if (name === 'value') {
        if (this._reflecting) return;
        if (this._area) this._area.value = newValue == null ? '' : newValue;
        this._syncCounter();
        this._grow();
        this._syncForm();
        return;
      }
      if (this._connected) this._sync();
    }

    /* -------------------------- Public API -------------------------- */

    get value() {
      return this._area ? this._area.value : '';
    }

    set value(v) {
      if (!this._connected) {
        this._pending.push({ method: 'setValue', args: [v] });
        return;
      }
      this._area.value = v == null ? '' : String(v);
      this._reflectValue(this._area.value);
      this._syncCounter();
      this._grow();
      this._syncForm();
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

    get readOnly() {
      return this.hasAttribute('readonly');
    }

    set readOnly(v) {
      this.toggleAttribute('readonly', !!v);
    }

    focus(options) {
      this._area.focus(options);
    }

    blur() {
      this._area.blur();
    }

    select() {
      this._area.select();
    }

    /* -------------------------- Rendering -------------------------- */

    _sync() {
      this._area.placeholder = this.getAttribute('placeholder') || '';
      this._area.name = this.getAttribute('name') || '';
      this._area.disabled = this.hasAttribute('disabled');
      this._area.readOnly = this.hasAttribute('readonly');
      this._area.required = this.hasAttribute('required');
      this._area.rows = Math.max(1, parseInt(this.getAttribute('rows') || '3', 10) || 3);
      const max = this.getAttribute('maxlength');
      if (max == null) this._area.removeAttribute('maxlength');
      else this._area.setAttribute('maxlength', max);
      if (this.hasAttribute('max-height')) this.style.setProperty('--kakao-textarea-max-height', this.getAttribute('max-height'));

      const label = this.getAttribute('label') || '';
      this._labelEl.textContent = label;
      this._area.setAttribute('aria-label', label || this.getAttribute('placeholder') || 'Text');

      const hint = this.getAttribute('hint') || '';
      const error = this.getAttribute('error') || '';
      this._hintEl.textContent = hint;
      this._errorEl.textContent = error;
      const describedBy = [hint && this._hintEl.id, error && this._errorEl.id].filter(Boolean).join(' ');
      if (describedBy) this._area.setAttribute('aria-describedby', describedBy);
      else this._area.removeAttribute('aria-describedby');
      if (error) this._area.setAttribute('aria-invalid', 'true');
      else this._area.removeAttribute('aria-invalid');
      this._area.setCustomValidity(error);

      if (this.hasAttribute('value') && !this._reflecting) this._area.value = this.getAttribute('value') || '';
      this._syncCounter();
      this._grow();
      this._syncForm();
      this._mirrorDataAttrs();
    }

    _syncCounter() {
      const max = this.getAttribute('maxlength');
      const len = this._area.value.length;
      this._counterEl.textContent = max ? `${len} / ${max}` : String(len);
      this._counterEl.classList.toggle('is-over', !!max && len > Number(max));
    }

    _grow() {
      if (!this.hasAttribute('autosize')) {
        this._area.style.height = '';
        return;
      }
      this._area.style.height = 'auto';
      this._area.style.height = `${this._area.scrollHeight}px`;
    }

    _syncForm() {
      if (!this._internals) return;
      this._internals.setFormValue(this._area.value);
      const error = this.getAttribute('error');
      if (error) this._internals.setValidity({ customError: true }, error, this._area);
      else if (this.hasAttribute('required') && !this._area.value.trim()) {
        this._internals.setValidity({ valueMissing: true }, 'Please fill in this field.', this._area);
      } else {
        this._internals.setValidity({});
      }
    }

    _reflectValue(value) {
      if (this.getAttribute('value') === value) return;
      this._reflecting = true;
      this.setAttribute('value', value);
      this._reflecting = false;
    }

    _mirrorDataAttrs() {
      Array.from(this._area.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-') && !this.hasAttribute(attr.name)) this._area.removeAttribute(attr.name);
      });
      Array.from(this.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-')) this._area.setAttribute(attr.name, attr.value);
      });
    }
  }

  customElements.define(TAG_NAME, KakaoTextarea);
})();
