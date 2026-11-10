/**
 * <kakao-text-input>
 * ============================================================================
 * A single-line text field: label, leading icon, optional clear button, hint
 * and error message, three sizes. Form-associated: `name`, `value`, `required`
 * are submitted with the surrounding form. Vanilla JS, Shadow DOM, no deps
 * (no icon font either: the icon is the page's own, see SLOTS).
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="text-input.js"><\/script>
 *
 *   <kakao-text-input label="Email" type="email" name="email"
 *                     placeholder="you@example.com" required></kakao-text-input>
 *   <kakao-text-input label="Search" type="search" clearable hint="Press Enter to search">
 *     <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
 *          stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg>
 *   </kakao-text-input>
 *   <kakao-text-input label="Workspace" value="acme" error="That name is taken"></kakao-text-input>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  type          text (default), email, password, search, url, tel, number…
 *  label         Visible label above the field.
 *  aria-label    Used when there is no visible label (e.g. the label sits beside the field).
 *  hint          Helper text below the field (hidden while there is an error).
 *  error         Error text: red field and message; the field gets
 *                aria-invalid and the message aria-describedby.
 *  placeholder   Placeholder text.
 *  value         The current value (reflected back on input).
 *  name · required · disabled · readonly   Form participation.
 *                The field's validity follows the inner input: required,
 *                type="email" / "url", pattern, minlength / maxlength and
 *                min / max / step make it invalid with the browser's message
 *                (an error summary lists it); `error` takes precedence.
 *  size          "sm" | "md" (default) | "lg".
 *  icon          Optional shortcut for an icon-font icon in front of the field, e.g.
 *                "fas fa-magnifying-glass": the component adds an
 *                <i slot="icon" data-kakao-icon> child with those classes to its own
 *                light DOM, so it only draws when the page loads that icon font (Font
 *                Awesome is not part of the library). Ignored while the page gives its
 *                own slot="icon" child; removing the attribute removes the <i>.
 *  clearable     Show a clear (×) button while the field has a value.
 *  maxlength · minlength · pattern · min · max · step · autocomplete · inputmode · spellcheck
 *                Passed through to the field (and to its validity).
 *
 *  data-* attributes on the host are mirrored onto the field for form
 *  frameworks (Yii data-confirm and friends).
 *
 * ----------------------------------------------------------------------------
 * SLOTS
 * ----------------------------------------------------------------------------
 *  icon          An icon in front of the field: an inline <svg> (sized 1em,
 *                coloured with currentColor; the muted field colour), an <img>,
 *                or an icon-font element such as <i slot="icon" class="fas fa-at">.
 *                Slotted content stays in the page's DOM, so page CSS reaches it.
 *                No icon, no space reserved. The box is aria-hidden: icons are
 *                decoration, the label names the field.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value                 Get / set the value.
 *  focus() · blur()      Forwarded to the field.
 *  checkValidity() · reportValidity() · validity · validationMessage · form
 *  select()              Select the whole value.
 *  disabled · readOnly   Property mirrors.
 *
 *  Calls made before the element is connected are queued.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  input        every keystroke (value already updated)
 *  change       when the field loses focus or Enter is pressed
 *  text-input-clear   the clear button was pressed: { value, previous }
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  - A real <label> is tied to the field; hint and error are described by
 *    aria-describedby, the error sets aria-invalid.
 *  - The clear button is a labelled button and only rendered when useful.
 *  - Focus is the shared 2px ring, on the field.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-text-input';
  if (customElements.get(TAG_NAME)) return;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-text-input- (written by construction.html, edit there) */
        --_bg: var(--kakao-text-input-bg, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-text-input-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-text-input-muted, var(--kakao-color-muted, #62626c));
        --_border: var(--kakao-text-input-border, var(--kakao-color-field-border, #ececef));
        --_line: var(--kakao-text-input-line, var(--kakao-color-line, #e5e7eb));
        --_hover-bg: var(--kakao-text-input-hover-bg, var(--kakao-color-subtle, #f0f0f1));
        --_focus: var(--kakao-text-input-focus, var(--kakao-color-focus, #2563eb));
        --_danger: var(--kakao-text-input-danger, var(--kakao-color-danger, #dc2626));
        --_font: var(--kakao-text-input-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_height: var(--kakao-text-input-height, 44px);
        --_padding-x: var(--kakao-text-input-padding-x, 12px);
        --_radius: var(--kakao-text-input-radius, 10px);
        --_icon-size: var(--kakao-text-input-icon-size, 15px);
        --_clear-size: var(--kakao-text-input-clear-size, 22px);
        --_label-gap: var(--kakao-text-input-label-gap, 6px);
        --_message-gap: var(--kakao-text-input-message-gap, 5px);
        --_label-weight: var(--kakao-text-input-label-weight, 600);
        --_focus-width: var(--kakao-text-input-focus-width, 2px);
        --_focus-offset: var(--kakao-text-input-focus-offset, 2px);
        --_disabled-opacity: var(--kakao-text-input-disabled-opacity, 0.55);
        /* @kakao-settings:end */
        display: block;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) { --_height: var(--kakao-text-input-sm-height, 36px); --_padding-x: var(--kakao-text-input-sm-padding-x, 10px); }
      :host([size="lg"]) { --_height: var(--kakao-text-input-lg-height, 52px); --_padding-x: var(--kakao-text-input-lg-padding-x, 14px); }

      .label {
        display: block;
        margin: 0 0 var(--_label-gap);
        font-weight: var(--_label-weight);
        font-size: 0.82rem;
        color: var(--_text);
        cursor: pointer;
      }
      .label:empty { display: none; }

      .field {
        display: flex;
        align-items: center;
        gap: calc(var(--_padding-x) * 0.6);
        box-sizing: border-box;
        min-height: var(--_height);
        padding: 0 var(--_padding-x);
        background: var(--_bg);
        color: var(--_text);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        transition: border-color 150ms ease, background-color 150ms ease;
      }
      :host([error]) .field { border-color: var(--_danger); }
      :host([disabled]) { opacity: var(--_disabled-opacity); }

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
      :host([size="sm"]) input { font-size: 0.875rem; }
      :host([size="lg"]) input { font-size: 1rem; }

      .field:has(input:focus-visible) {
        border-color: var(--_focus);
        outline: var(--_focus-width) solid var(--_focus);
        outline-offset: var(--_focus-offset);
      }
      :host([error]) .field:has(input:focus-visible) { border-color: var(--_danger); outline-color: var(--_danger); }

      .icon {
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.2em;
        color: var(--_muted);
        font-size: var(--_icon-size);
      }
      .icon:not(.has-icon) { display: none; }
      ::slotted(svg) { width: 1em; height: 1em; flex: none; }

      .clear {
        flex: none;
        display: none;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: var(--_clear-size);
        height: var(--_clear-size);
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: var(--_hover-bg);
        color: var(--_muted);
        cursor: pointer;
        font-size: 0.78rem;
        line-height: 1;
      }
      .clear:hover { color: var(--_text); }
      .clear:focus-visible { outline: var(--_focus-width) solid var(--_focus); outline-offset: var(--_focus-offset); }
      :host([clearable]) .clear.has-value { display: inline-flex; }

      .hint, .error {
        margin: var(--_message-gap) 0 0;
        font-size: 0.78rem;
        color: var(--_muted);
      }
      .hint:empty, .error:empty { display: none; }
      .error { color: var(--_danger); }
      :host([error]) .hint { display: none; }

      @media (prefers-reduced-motion: reduce) {
        .field { transition: none; }
      }
    </style>
    <label class="label" part="label"></label>
    <div class="field" part="field">
      <span class="icon" part="icon" aria-hidden="true"><slot name="icon"></slot></span>
      <input part="input" />
      <button class="clear" part="clear" type="button" tabindex="-1" aria-label="Clear">✕</button>
    </div>
    <p class="hint" part="hint" id="hint"></p>
    <p class="error" part="error" id="error" role="alert"></p>
  `;

  /* The ValidityState flags the inner field's validity is copied from. */
  const VALIDITY_FLAGS = ['valueMissing', 'typeMismatch', 'patternMismatch', 'tooLong', 'tooShort',
    'rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'badInput'];
  let seq = 0;

  class KakaoTextInput extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['type', 'label', 'hint', 'error', 'placeholder', 'value', 'name',
        'required', 'disabled', 'readonly', 'size', 'icon', 'clearable',
        'maxlength', 'minlength', 'pattern', 'min', 'max', 'step', 'autocomplete', 'inputmode', 'spellcheck', 'aria-label'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._labelEl = shadow.querySelector('.label');
      this._fieldEl = shadow.querySelector('.field');
      this._input = shadow.querySelector('input');
      this._iconEl = shadow.querySelector('.icon');
      this._iconSlot = shadow.querySelector('slot[name="icon"]');
      this._iconSlot.addEventListener('slotchange', () => {
        this._syncIconShortcut();
        this._iconEl.classList.toggle('has-icon', this._iconSlot.assignedElements().length > 0);
      });
      this._clearBtn = shadow.querySelector('.clear');
      this._hintEl = shadow.querySelector('#hint');
      this._errorEl = shadow.querySelector('#error');
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;

      this._id = `kakao-text-input-${++seq}`;
      this._input.id = this._id;
      this._hintEl.id = `${this._id}-hint`;
      this._errorEl.id = `${this._id}-error`;
      this._labelEl.htmlFor = this._id;

      this._connected = false;
      this._pending = [];
      this._reflecting = false;
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      this._connected = true;
      this._input.addEventListener('input', () => {
        this._reflectValue(this._input.value);
        this._syncClear();
        this._syncForm();
        this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        this._mirrorDataAttrs();
      });
      this._input.addEventListener('change', () => {
        this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      });
      this._clearBtn.addEventListener('click', () => this._clear());
      this._labelEl.addEventListener('click', (e) => {
        e.preventDefault();
        this._input.focus();
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
        if (this._input) this._input.value = newValue == null ? '' : newValue;
        this._syncClear();
        this._syncForm();
        return;
      }
      if (this._connected) this._sync();
    }

    /* -------------------------- Public API -------------------------- */

    get value() {
      return this._input ? this._input.value : '';
    }

    set value(v) {
      if (!this._connected) {
        this._pending.push({ method: 'setValue', args: [v] });
        return;
      }
      this._input.value = v == null ? '' : String(v);
      this._reflectValue(this._input.value);
      this._syncClear();
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

    get form() { return this._internals ? this._internals.form : null; }
    get validity() { return this._internals ? this._internals.validity : this._input.validity; }
    get validationMessage() { return this._internals ? this._internals.validationMessage : this._input.validationMessage; }
    checkValidity() { return this._internals ? this._internals.checkValidity() : this._input.checkValidity(); }
    reportValidity() { return this._internals ? this._internals.reportValidity() : this._input.reportValidity(); }

    focus(options) {
      this._input.focus(options);
    }

    blur() {
      this._input.blur();
    }

    select() {
      this._input.select();
    }

    /* -------------------------- Rendering -------------------------- */

    _sync() {
      const type = (this.getAttribute('type') || 'text').toLowerCase();
      this._input.type = type;
      this._input.placeholder = this.getAttribute('placeholder') || '';
      this._input.name = this.getAttribute('name') || '';
      this._input.disabled = this.hasAttribute('disabled');
      this._input.readOnly = this.hasAttribute('readonly');
      this._input.required = this.hasAttribute('required');
      ['maxlength', 'minlength', 'pattern', 'min', 'max', 'step', 'autocomplete', 'inputmode', 'spellcheck'].forEach((attr) => {
        const v = this.getAttribute(attr);
        if (v == null) this._input.removeAttribute(attr);
        else this._input.setAttribute(attr, v);
      });
      if (this.hasAttribute('value') && !this._reflecting) this._input.value = this.getAttribute('value') || '';

      const label = this.getAttribute('label') || '';
      this._labelEl.textContent = label;
      this._input.setAttribute('aria-label', label || this.getAttribute('aria-label') || this.getAttribute('placeholder') || 'Text');

      this._syncIconShortcut();

      const hint = this.getAttribute('hint') || '';
      const error = this.getAttribute('error') || '';
      this._hintEl.textContent = hint;
      this._errorEl.textContent = error;

      const describedBy = [hint && this._hintEl.id, error && this._errorEl.id].filter(Boolean).join(' ');
      if (describedBy) this._input.setAttribute('aria-describedby', describedBy);
      else this._input.removeAttribute('aria-describedby');
      if (error) this._input.setAttribute('aria-invalid', 'true');
      else this._input.removeAttribute('aria-invalid');
      this._input.setCustomValidity(error);

      this._syncClear();
      this._syncForm();
      this._mirrorDataAttrs();
    }

    /**
     * The `icon` attribute shortcut: an <i slot="icon"> in the host's light DOM
     * carries the classes, so a page icon font can draw it (CSS from the page
     * cannot reach into the shadow root). Gone while the page slots its own icon.
     */
    _syncIconShortcut() {
      const cls = (this.getAttribute('icon') || '').trim();
      let made = this.querySelector(':scope > i[data-kakao-icon]');
      const own = Array.from(this.children).some((c) => c !== made && c.getAttribute('slot') === 'icon');
      if (!cls || own) {
        if (made) made.remove();
        return;
      }
      if (!made) {
        made = document.createElement('i');
        made.setAttribute('slot', 'icon');
        made.setAttribute('data-kakao-icon', '');
        made.setAttribute('aria-hidden', 'true');
        this.prepend(made);
      }
      if (made.className !== cls) made.className = cls;
    }

    _syncClear() {
      this._clearBtn.classList.toggle('has-value', this._input.value !== '');
    }

    /**
     * Form value and validity. The `error` attribute wins (customError);
     * otherwise the inner field's own validity is copied, so type="email" /
     * "url", pattern, minlength / maxlength, min / max / step and required
     * count with the browser's message. Only spaces counts as missing too.
     */
    _syncForm() {
      if (!this._internals) return;
      this._internals.setFormValue(this._input.value);
      const error = this.getAttribute('error');
      if (error) { this._internals.setValidity({ customError: true }, error, this._input); return; }
      const v = this._input.validity;
      const flags = {};
      VALIDITY_FLAGS.forEach((k) => { if (v[k]) flags[k] = true; });
      if (Object.keys(flags).length) {
        this._internals.setValidity(flags, this._input.validationMessage || 'Please check this field.', this._input);
      } else if (this.hasAttribute('required') && !this._input.value.trim()) {
        this._internals.setValidity({ valueMissing: true }, 'Please fill out this field.', this._input);
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

    _clear() {
      const previous = this._input.value;
      if (!previous) return;
      this._input.value = '';
      this._reflectValue('');
      this._syncClear();
      this._syncForm();
      this._input.focus();
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      this.dispatchEvent(new CustomEvent('text-input-clear', {
        bubbles: true,
        composed: true,
        detail: { value: '', previous },
      }));
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

  customElements.define(TAG_NAME, KakaoTextInput);
})();
