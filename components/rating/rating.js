/**
 * <kakao-rating>
 * ============================================================================
 * A star rating: pick 1 to `max` symbols, with optional half steps, or show a
 * score read-only. Radio buttons underneath, so it works from the keyboard
 * and with a screen reader. Form-associated: the value is submitted under
 * `name`. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        A star rating to give, or a score to show.
 *  not for    A measurement: kakao-meter.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     rating.js
 *  css        none
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="rating.js"><\/script>
 *
 *   <kakao-rating label="Your rating" name="stars" value="4"></kakao-rating>
 *   <kakao-rating label="Quality" step="0.5" clearable></kakao-rating>
 *   <kakao-rating readonly value="4.3" show-value aria-label="Average"></kakao-rating>
 *
 *   <kakao-rating label="Liked it?" max="3">
 *     <svg slot="symbol" viewBox="0 0 24 24" fill="currentColor">...</svg>
 *   </kakao-rating>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  value         The rating, 0 (none) to max. Reflected when the user picks.
 *                Rounded to the step; read-only shows any fraction exactly.
 *  max           Number of symbols, 1 to 20. Default 5.
 *  step          "1" (default) | "0.5" for half symbols.
 *  name          Form field name (form-associated).
 *  label         Visible label above the symbols.
 *  hint          Helper text under the symbols.
 *  error         Error text: red, and the validation message.
 *  size          "sm" | "md" (default) | "lg".
 *  readonly      Display only: one image named "4 of 5", no tab stop.
 *                The value is still submitted.
 *  disabled      Not operable, dimmed, not submitted.
 *  required      With a form: blocks submitting without a rating.
 *  clearable     Picking the current value again, or Delete / Backspace,
 *                removes the rating.
 *  show-value    Shows the text ("4 of 5") beside the symbols.
 *  value-text    Pattern for that text and for each option's name.
 *                Default "{value} of {max}".
 *  aria-label    Used when there is no visible label.
 *
 * ----------------------------------------------------------------------------
 * SLOTS
 * ----------------------------------------------------------------------------
 *  symbol        Replaces the star: an inline SVG (in currentColor) or a text
 *                character. It is copied into every position, so page CSS
 *                does not reach the copies.
 *  symbol-empty  The symbol for an empty position (an outline version).
 *                Without it the empty one is the dimmed, greyed symbol.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value                   Number, 0 when there is no rating. Setting it keeps
 *                          the form-reset default (the `value` attribute as
 *                          written by the page).
 *  max · disabled · readOnly   Property mirrors.
 *  clear()                 Remove the rating (no events).
 *  focus()                 Focus the checked option (or the first one).
 *  checkValidity() · reportValidity() · validity · validationMessage · form
 *
 * ----------------------------------------------------------------------------
 * KEYBOARD
 * ----------------------------------------------------------------------------
 *  Tab                     One tab stop: the checked option, else the first.
 *  Arrow right / up        One step more (left / right swap in right-to-left).
 *  Arrow left / down       One step less.
 *  Home · End              Lowest · highest rating.
 *  Space                   Pick the focused option; with `clearable`, pick it
 *                          again to clear.
 *  Delete · Backspace      Clear (with `clearable`).
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  input · change          when the user picks or clears
 *  rating-change           { value, previous }
 *  rating-preview          { value } while the pointer hovers a symbol,
 *                          { value: null } when it leaves
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-rating';
  if (customElements.get(TAG_NAME)) return;

  const STAR_PATH = 'M12 3.2l2.7 5.6 6.1.85-4.45 4.3 1.08 6.05L12 17.1 6.57 20l1.08-6.05L3.2 9.65l6.1-.85z';
  const STAR_FULL = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" focusable="false"><path d="${STAR_PATH}"/></svg>`;
  const STAR_EMPTY = `<svg class="outline" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" focusable="false"><path d="${STAR_PATH}"/></svg>`;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-rating- (written by construction.html, edit there) */
        --_text: var(--kakao-rating-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-rating-muted, var(--kakao-color-muted, #62626c));
        --_fill: var(--kakao-rating-fill, var(--kakao-color-warning, #b45309));
        --_empty: var(--kakao-rating-empty, var(--kakao-color-border, #82828b));
        --_empty-fill: var(--kakao-rating-empty-fill, transparent);
        --_focus: var(--kakao-rating-focus, var(--kakao-color-focus, #2563eb));
        --_danger: var(--kakao-rating-danger, var(--kakao-color-danger, #dc2626));
        --_font: var(--kakao-rating-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_label-weight: var(--kakao-rating-label-weight, 600);
        --_size: var(--kakao-rating-size, 24px);
        --_sm-size: var(--kakao-rating-sm-size, 20px);
        --_lg-size: var(--kakao-rating-lg-size, 32px);
        --_gap: var(--kakao-rating-gap, 4px);
        --_value-gap: var(--kakao-rating-value-gap, 10px);
        --_radius: var(--kakao-rating-radius, var(--kakao-radius-sm, 6px));
        --_hover-scale: var(--kakao-rating-hover-scale, 1.12);
        --_symbol-empty-opacity: var(--kakao-rating-symbol-empty-opacity, 1);
        --_focus-width: var(--kakao-rating-focus-width, 2px);
        --_focus-offset: var(--kakao-rating-focus-offset, 0px);
        --_disabled-opacity: var(--kakao-rating-disabled-opacity, 0.55);
        /* @kakao-settings:end */
        display: block;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) { --_size: var(--_sm-size); font-size: 0.875rem; }
      :host([size="lg"]) { --_size: var(--_lg-size); font-size: 1rem; }

      .label {
        display: block;
        margin: 0 0 6px;
        font-weight: var(--_label-weight);
        font-size: 0.82rem;
      }
      .label:empty { display: none; }

      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 2px var(--_value-gap);
      }

      /* The gap between two symbols is padding of the cells, so the pointer
         never falls into a dead zone on its way along the row. */
      .stars {
        display: inline-flex;
        flex-wrap: wrap;
        margin-inline: calc(var(--_gap) / -2);
        border-radius: var(--_radius);
      }
      :host([disabled]) .stars, .stars.is-disabled { opacity: var(--_disabled-opacity); }

      .star {
        position: relative;
        flex: none;
        box-sizing: content-box;
        width: var(--_size);
        height: var(--_size);
        padding: 2px calc(var(--_gap) / 2);
        border-radius: var(--_radius);
      }
      .glyphs {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        transition: transform 120ms ease;
      }
      .layer {
        position: absolute;
        inset-block: 0;
        inset-inline-start: 0;
        overflow: hidden;
      }
      .layer.empty { width: 100%; color: var(--_empty); }
      .layer.full { width: var(--_part, 0%); color: var(--_fill); }
      .glyph {
        display: grid;
        place-items: center;
        width: var(--_size);
        height: var(--_size);
        font-size: calc(var(--_size) * 0.9);
        line-height: 1;
      }
      .glyph > * { max-width: 100%; max-height: 100%; }
      .glyph > svg { display: block; width: 100%; height: 100%; }
      .glyph > svg.outline { fill: var(--_empty-fill); }
      .layer.empty .glyph.is-copy { opacity: var(--_symbol-empty-opacity); filter: grayscale(1); }
      :host([error]) .layer.empty { color: var(--_danger); }

      input {
        position: absolute;
        inset-block: 0;
        inset-inline-start: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        opacity: 0;
        cursor: pointer;
      }
      .star.is-half input { width: 50%; }
      .star.is-half input + input { inset-inline-start: 50%; }
      input:disabled { cursor: not-allowed; }

      .star:has(input:focus-visible) {
        outline: var(--_focus-width) solid var(--_focus);
        outline-offset: var(--_focus-offset);
      }
      .stars.is-live .star.is-hot .glyphs { transform: scale(var(--_hover-scale)); }

      .value {
        font-size: 0.85rem;
        color: var(--_muted);
        font-variant-numeric: tabular-nums;
      }
      .value:empty, :host(:not([show-value])) .value { display: none; }

      .hint, .error { margin: 6px 0 0; font-size: 0.78rem; color: var(--_muted); }
      .hint:empty, .error:empty { display: none; }
      .error { color: var(--_danger); }
      :host([error]) .hint { display: none; }

      slot { display: none; }

      @media (prefers-reduced-motion: reduce) {
        .glyphs { transition: none; }
        .stars.is-live .star.is-hot .glyphs { transform: none; }
      }
      @media (forced-colors: active) {
        .layer.empty { color: CanvasText; }
        .layer.full { color: Highlight; }
        .layer.empty .glyph.is-copy { opacity: 0.5; }
        .star:has(input:focus-visible) { outline-color: CanvasText; }
        :host([disabled]) .stars, .stars.is-disabled { opacity: 1; }
        :host([disabled]) .layer, .stars.is-disabled .layer { color: GrayText; }
      }
    </style>
    <span class="label" part="label"></span>
    <div class="row">
      <div class="stars" part="symbols"></div>
      <span class="value" part="value" aria-hidden="true"></span>
    </div>
    <p class="hint" part="hint"></p>
    <p class="error" part="error" role="alert"></p>
    <slot name="symbol"></slot>
    <slot name="symbol-empty"></slot>
  `;

  let seq = 0;

  function formatNumber(n) {
    return String(Math.round(n * 100) / 100);
  }

  class KakaoRating extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['value', 'max', 'step', 'name', 'label', 'hint', 'error', 'size', 'readonly',
        'disabled', 'required', 'clearable', 'show-value', 'value-text', 'aria-label'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._starsEl = shadow.querySelector('.stars');
      this._labelEl = shadow.querySelector('.label');
      this._valueEl = shadow.querySelector('.value');
      this._hintEl = shadow.querySelector('.hint');
      this._errorEl = shadow.querySelector('.error');
      this._symbolSlot = shadow.querySelector('slot[name="symbol"]');
      this._emptySlot = shadow.querySelector('slot[name="symbol-empty"]');
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      this._base = `${TAG_NAME}-${++seq}`;
      this._labelEl.id = `${this._base}-label`;
      this._hintEl.id = `${this._base}-hint`;
      this._errorEl.id = `${this._base}-error`;
      this._connected = false;
      this._wired = false;
      this._reflecting = false;
      this._formDisabled = false;
      this._default = null;
      this._preview = null;
    }

    connectedCallback() {
      this._connected = true;
      if (this._default === null) this._default = this.getAttribute('value') || '';
      if (!this._wired) {
        this._wired = true;
        const stars = this._starsEl;
        stars.addEventListener('click', (e) => this._onClick(e));
        stars.addEventListener('keydown', (e) => this._onKeydown(e));
        // The radios' own events stay inside; the host sends its own.
        stars.addEventListener('input', (e) => e.stopPropagation());
        stars.addEventListener('change', (e) => e.stopPropagation());
        stars.addEventListener('pointerover', (e) => this._onPointer(e));
        stars.addEventListener('pointerleave', () => this._setPreview(null));
        this._symbolSlot.addEventListener('slotchange', () => this._render());
        this._emptySlot.addEventListener('slotchange', () => this._render());
      }
      this._render();
    }

    disconnectedCallback() {
      this._connected = false;
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'value') {
        if (this._reflecting) return;
        this._default = newValue || '';
        if (this._connected) this._paint();
        return;
      }
      if (!this._connected) return;
      if (name === 'size' || name === 'show-value') return;
      this._render();
    }

    formResetCallback() {
      this._setValue(this._round(Number(this._default) || 0));
    }

    formDisabledCallback(disabled) {
      this._formDisabled = disabled;
      if (this._connected) this._render();
    }

    formStateRestoreCallback(state) {
      this._setValue(this._round(Number(state) || 0));
    }

    /* -------------------------- Public API -------------------------- */

    get value() {
      return this._round(Number(this.getAttribute('value')) || 0);
    }

    set value(v) {
      // Like a native field: the property changes the value, not the reset default.
      this._setValue(this._round(Number(v) || 0));
    }

    get max() {
      const n = Math.round(Number(this.getAttribute('max')));
      return n >= 1 ? Math.min(n, 20) : 5;
    }

    set max(v) {
      this.setAttribute('max', String(v));
    }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(v) { this.toggleAttribute('disabled', !!v); }
    get readOnly() { return this.hasAttribute('readonly'); }
    set readOnly(v) { this.toggleAttribute('readonly', !!v); }

    clear() {
      this._setValue(0);
    }

    get form() { return this._internals ? this._internals.form : null; }
    get validity() { return this._internals ? this._internals.validity : undefined; }
    get validationMessage() { return this._internals ? this._internals.validationMessage : ''; }
    checkValidity() { return this._internals ? this._internals.checkValidity() : true; }
    reportValidity() { return this._internals ? this._internals.reportValidity() : true; }

    focus(options) {
      const target = this._starsEl.querySelector('input:checked:not(:disabled)')
        || this._starsEl.querySelector('input:not(:disabled)');
      if (target) target.focus(options);
    }

    /* -------------------------- Internals -------------------------- */

    get _step() {
      return Number(this.getAttribute('step')) === 0.5 ? 0.5 : 1;
    }

    get _off() {
      return this.hasAttribute('disabled') || this._formDisabled;
    }

    /* Clamp to 0..max; an operable rating also snaps to the step. */
    _round(n) {
      const clamped = Math.min(Math.max(n, 0), this.max);
      if (this.hasAttribute('readonly')) return Math.round(clamped * 100) / 100;
      const step = this._step;
      return Math.round(clamped / step) * step;
    }

    _text(value) {
      const pattern = this.getAttribute('value-text') || '{value} of {max}';
      return pattern.replace(/\{value\}/g, formatNumber(value)).replace(/\{max\}/g, String(this.max));
    }

    _glyph(slot, fallback, copy) {
      const span = document.createElement('span');
      span.className = 'glyph';
      const nodes = slot.assignedNodes();
      if (!nodes.length) {
        span.innerHTML = fallback;
        return span;
      }
      if (copy) span.classList.add('is-copy');
      nodes.forEach((node) => {
        const clone = node.cloneNode(true);
        clone.removeAttribute('slot');
        clone.removeAttribute('id');
        span.append(clone);
      });
      return span;
    }

    _render() {
      const stars = this._starsEl;
      const readonly = this.hasAttribute('readonly');
      const off = this._off;
      const half = this._step === 0.5 && !readonly;
      const max = this.max;
      const active = this.shadowRoot.activeElement;
      const focused = active && stars.contains(active) ? Number(active.value) : null;
      const ownEmpty = this._emptySlot.assignedNodes().length > 0;

      stars.textContent = '';
      stars.classList.toggle('is-live', !readonly && !off);
      stars.classList.toggle('is-disabled', off);
      for (let i = 1; i <= max; i++) {
        const star = document.createElement('span');
        star.className = half ? 'star is-half' : 'star';
        star.dataset.index = String(i);
        star.setAttribute('part', 'symbol');

        const glyphs = document.createElement('span');
        glyphs.className = 'glyphs';
        glyphs.setAttribute('aria-hidden', 'true');
        const empty = document.createElement('span');
        empty.className = 'layer empty';
        empty.append(ownEmpty
          ? this._glyph(this._emptySlot, STAR_EMPTY, false)
          : this._glyph(this._symbolSlot, STAR_EMPTY, true));
        const full = document.createElement('span');
        full.className = 'layer full';
        full.append(this._glyph(this._symbolSlot, STAR_FULL, false));
        glyphs.append(empty, full);
        star.append(glyphs);

        if (!readonly) {
          (half ? [i - 0.5, i] : [i]).forEach((v) => {
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'rating';
            input.value = String(v);
            input.disabled = off;
            star.append(input);
          });
        }
        stars.append(star);
      }

      this._labelEl.textContent = this.getAttribute('label') || '';
      this._hintEl.textContent = this.getAttribute('hint') || '';
      this._errorEl.textContent = this.getAttribute('error') || '';
      this._paint();

      if (focused !== null) {
        const again = this._inputFor(focused) || stars.querySelector('input:not(:disabled)');
        if (again) again.focus();
      }
    }

    _inputs() {
      return Array.from(this._starsEl.querySelectorAll('input'));
    }

    _inputFor(value) {
      return this._inputs().find((input) => Number(input.value) === value) || null;
    }

    /* Everything that follows the value: fill, checked radio, names, form. */
    _paint() {
      const stars = this._starsEl;
      const readonly = this.hasAttribute('readonly');
      const value = this.value;
      const shown = this._preview !== null ? this._preview : value;
      const label = this.getAttribute('label') || '';
      const name = label ? '' : (this.getAttribute('aria-label') || 'Rating');
      const hint = this.getAttribute('hint') || '';
      const error = this.getAttribute('error') || '';
      const describedBy = [hint && !error && this._hintEl.id, error && this._errorEl.id].filter(Boolean).join(' ');

      Array.from(stars.children).forEach((star, i) => {
        const part = Math.min(Math.max(shown - i, 0), 1);
        star.style.setProperty('--_part', `${Math.round(part * 1000) / 10}%`);
        star.classList.toggle('is-hot', this._preview !== null && Math.ceil(this._preview) === i + 1);
      });

      if (readonly) {
        stars.setAttribute('role', 'img');
        stars.removeAttribute('aria-labelledby');
        stars.removeAttribute('aria-required');
        stars.removeAttribute('aria-invalid');
        stars.setAttribute('aria-label', `${label || name}: ${value > 0 ? this._text(value) : this._text(0)}`);
      } else {
        stars.setAttribute('role', 'radiogroup');
        if (label) {
          stars.setAttribute('aria-labelledby', this._labelEl.id);
          stars.removeAttribute('aria-label');
        } else {
          stars.removeAttribute('aria-labelledby');
          stars.setAttribute('aria-label', name);
        }
        if (this.hasAttribute('required')) stars.setAttribute('aria-required', 'true');
        else stars.removeAttribute('aria-required');
        if (error) stars.setAttribute('aria-invalid', 'true');
        else stars.removeAttribute('aria-invalid');
        this._inputs().forEach((input) => {
          const v = Number(input.value);
          input.checked = v === value;
          input.setAttribute('aria-label', this._text(v));
        });
      }
      if (describedBy) stars.setAttribute('aria-describedby', describedBy);
      else stars.removeAttribute('aria-describedby');

      this._valueEl.textContent = shown > 0 || readonly ? this._text(shown) : '';
      this._syncForm();
    }

    _syncForm() {
      if (!this._internals) return;
      const value = this.value;
      const text = value > 0 ? formatNumber(value) : null;
      this._internals.setFormValue(this._off ? null : text, text || '');
      const error = this.getAttribute('error');
      const anchor = this._starsEl.querySelector('input') || undefined;
      if (error) this._internals.setValidity({ customError: true }, error, anchor);
      else if (this.hasAttribute('required') && !value && !this.hasAttribute('readonly')) {
        this._internals.setValidity({ valueMissing: true }, 'Please choose a rating.', anchor);
      } else this._internals.setValidity({});
    }

    /* Set the value without touching the reset default and without events. */
    _setValue(n) {
      this._reflecting = true;
      if (n > 0) this.setAttribute('value', formatNumber(n));
      else this.removeAttribute('value');
      this._reflecting = false;
      if (this._connected) this._paint();
    }

    _commit(n) {
      const previous = this.value;
      const value = this._round(n);
      if (value === previous) {
        this._paint();
        return;
      }
      this._setValue(value);
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      this.dispatchEvent(new CustomEvent('rating-change', {
        bubbles: true,
        composed: true,
        detail: { value, previous },
      }));
    }

    _setPreview(value) {
      if (value === this._preview) return;
      this._preview = value;
      this._paint();
      this.dispatchEvent(new CustomEvent('rating-preview', {
        bubbles: true,
        composed: true,
        detail: { value },
      }));
    }

    _onPointer(e) {
      if (e.pointerType === 'touch' || this._off) return;
      const input = e.target && e.target.closest ? e.target.closest('input') : null;
      if (input) this._setPreview(Number(input.value));
    }

    _onClick(e) {
      const input = e.target && e.target.closest ? e.target.closest('input') : null;
      if (!input) return;
      const picked = Number(input.value);
      if (picked === this.value) {
        if (this.hasAttribute('clearable')) {
          // Leave the preview, or the cleared symbols would still look filled.
          this._preview = null;
          this._commit(0);
        }
        return;
      }
      this._commit(picked);
    }

    _onKeydown(e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const inputs = this._inputs();
      if (!inputs.length || this._off) return;
      const rtl = getComputedStyle(this).direction === 'rtl';
      const step = this._step;
      const current = this.value;
      const at = Number((e.target && e.target.value) || 0);
      let next = null;
      switch (e.key) {
        case 'ArrowUp': next = (current || at - step) + step; break;
        case 'ArrowDown': next = (current || at + step) - step; break;
        case 'ArrowRight': next = rtl ? (current || at + step) - step : (current || at - step) + step; break;
        case 'ArrowLeft': next = rtl ? (current || at - step) + step : (current || at + step) - step; break;
        case 'Home': next = step; break;
        case 'End': next = this.max; break;
        case 'Delete':
        case 'Backspace':
          if (!this.hasAttribute('clearable')) return;
          e.preventDefault();
          this._commit(0);
          return;
        default: return;
      }
      e.preventDefault();
      next = Math.min(Math.max(next, step), this.max);
      const target = this._inputFor(next);
      if (target) target.focus();
      this._commit(next);
    }
  }

  customElements.define(TAG_NAME, KakaoRating);
})();
