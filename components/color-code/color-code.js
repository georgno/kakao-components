/**
 * <kakao-color-code>
 * ============================================================================
 * A colour value as a small badge-like label, with a swatch of the colour
 * before the text: "#18181b", "oklch(70% 0.15 145)", "var(--kakao-color-ink)".
 * Made for documentation (palette tables, contrast pairs). Not interactive.
 * Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="color-code.js"><\/script>
 *
 *   <kakao-color-code>#18181b</kakao-color-code>
 *   <kakao-color-code>rgb(79 70 229 / 50%)</kakao-color-code>
 *   <kakao-color-code value="var(--kakao-color-ink)">ink</kakao-color-code>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (observed)
 * ----------------------------------------------------------------------------
 *  value   The colour to paint. Without it, the text content is painted.
 *
 *  Any CSS <color> works: hex (3/4/6/8 digits), rgb(), hsl(), hwb(), lab(),
 *  lch(), oklab(), oklch(), color(), color-mix(), named colours,
 *  transparent, currentColor (the colour of the text around the element)
 *  and var(--…). The swatch has a 1px inset ring, so it shows on any fill,
 *  and sits on a checkerboard, so transparency reads. A value that is not a
 *  colour paints nothing: the swatch becomes an empty dashed box with a
 *  slash and the element gets the custom state :state(invalid). A var()
 *  that is not defined cannot be detected; it shows as transparent.
 *  The text and the value are watched: changing either repaints.
 *
 * ----------------------------------------------------------------------------
 * PROPERTIES
 * ----------------------------------------------------------------------------
 *  value   Reflects the attribute.
 *  color   The colour being painted (value or text), read-only.
 *  valid   false when that is not a CSS colour (or empty), read-only.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  Read as its text; the swatch is a pseudo-element, hidden from assistive
 *  technology. Never focusable. Under forced colours the swatch keeps its
 *  colour (it is the content), the box gets a CanvasText border.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-color-code-radius / -padding-y / -padding-x / -gap
 *  --kakao-color-code-font-family / -font-size / -font-weight
 *  --kakao-color-code-fill / -text
 *  --kakao-color-code-swatch-size / -swatch-radius / -ring
 *  --kakao-color-code-checker / -checker-bg / -invalid
 *
 * Parts: code, label.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-color-code';
  if (customElements.get(TAG_NAME)) return;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-color-code- (written by construction.html, edit there) */
        --_radius: var(--kakao-color-code-radius, 999px);
        --_padding-y: var(--kakao-color-code-padding-y, 0.05rem);
        --_padding-x: var(--kakao-color-code-padding-x, 0.5rem);
        --_gap: var(--kakao-color-code-gap, 0.35rem);
        --_font-family: var(--kakao-color-code-font-family, ui-monospace, "SF Mono", Menlo, monospace);
        --_font-size: var(--kakao-color-code-font-size, 0.75rem);
        --_font-weight: var(--kakao-color-code-font-weight, 500);
        --_fill: var(--kakao-color-code-fill, var(--kakao-color-subtle, #f0f0f1));
        --_text: var(--kakao-color-code-text, var(--kakao-color-text, #18181b));
        --_swatch-size: var(--kakao-color-code-swatch-size, 0.625rem);
        --_swatch-radius: var(--kakao-color-code-swatch-radius, 2px);
        --_ring: var(--kakao-color-code-ring, color-mix(in srgb, var(--kakao-color-text, #18181b) 24%, transparent));
        --_checker: var(--kakao-color-code-checker, var(--kakao-color-subtle-strong, #e6e6e8));
        --_checker-bg: var(--kakao-color-code-checker-bg, var(--kakao-color-bg, #ffffff));
        --_invalid: var(--kakao-color-code-invalid, var(--kakao-color-muted, #62626c));
        /* @kakao-settings:end */
        display: inline-block;
        vertical-align: 0.1em;
        max-width: 100%;
      }
      :host([hidden]) { display: none; }

      /* No color here: the swatch inherits the colour of the text around the
         element, so currentColor means that colour. The label sets its own. */
      .code {
        display: inline-flex;
        align-items: center;
        gap: var(--_gap);
        box-sizing: border-box;
        max-width: 100%;
        padding: var(--_padding-y) var(--_padding-x);
        border: 1px solid transparent;
        border-radius: var(--_radius);
        background: var(--_fill);
        font-family: var(--_font-family);
        font-size: var(--_font-size);
        font-weight: var(--_font-weight);
        line-height: 1.45;
        white-space: nowrap;
      }
      .label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--_text);
      }

      /* The swatch: the colour over a checkerboard (an opaque colour covers
         it), with an inset ring so it shows on a fill of the same colour. */
      .code::before {
        content: "";
        flex: none;
        width: var(--_swatch-size);
        height: var(--_swatch-size);
        box-sizing: border-box;
        border-radius: var(--_swatch-radius);
        background:
          linear-gradient(var(--_color, transparent), var(--_color, transparent)),
          repeating-conic-gradient(var(--_checker) 0 25%, var(--_checker-bg) 0 50%) 0 0 / 0.3125rem 0.3125rem;
        box-shadow: inset 0 0 0 1px var(--_ring);
        forced-color-adjust: none;
      }
      /* Not a colour: an empty dashed box with a slash. */
      .code.invalid::before {
        border: 1px dashed var(--_invalid);
        background: linear-gradient(to top right,
          transparent calc(50% - 0.5px), var(--_invalid) calc(50% - 0.5px),
          var(--_invalid) calc(50% + 0.5px), transparent calc(50% + 0.5px));
        box-shadow: none;
      }

      @media (forced-colors: active) {
        .code { border-color: CanvasText; }
        .code.invalid::before { border-color: CanvasText; }
      }
    </style>
    <span class="code" part="code"><span class="label" part="label"><slot></slot></span></span>
  `;

  class KakaoColorCode extends HTMLElement {
    static get observedAttributes() { return ['value']; }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).appendChild(TEMPLATE.content.cloneNode(true));
      this._code = this.shadowRoot.querySelector('.code');
      try { this._internals = this.attachInternals(); } catch { this._internals = null; }
      this._observer = new MutationObserver(() => this._render());
    }

    connectedCallback() {
      this._observer.observe(this, { characterData: true, childList: true, subtree: true });
      this._render();
    }

    disconnectedCallback() { this._observer.disconnect(); }

    attributeChangedCallback() { if (this.isConnected) this._render(); }

    get value() { return this.getAttribute('value') || ''; }
    set value(v) {
      if (v == null || v === '') this.removeAttribute('value');
      else this.setAttribute('value', String(v));
    }

    get color() { return (this.getAttribute('value') || this.textContent || '').trim(); }

    get valid() {
      const colour = this.color;
      try { return colour !== '' && CSS.supports('color', colour); } catch { return false; }
    }

    _render() {
      const colour = this.color;
      const valid = this.valid;
      if (valid) this._code.style.setProperty('--_color', colour);
      else this._code.style.removeProperty('--_color');
      this._code.classList.toggle('invalid', !valid);
      const states = this._internals && this._internals.states;
      if (states) {
        try {
          if (valid) states.delete('invalid');
          else states.add('invalid');
        } catch { /* custom states not supported */ }
      }
    }
  }

  customElements.define(TAG_NAME, KakaoColorCode);
})();
