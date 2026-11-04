/**
 * <kakao-card>
 * ============================================================================
 * A content card: optional header, body, optional footer. When the footer
 * starts with a <kakao-button>, the card gets a very subtle, blurred radial
 * glow in that button's colour, centred on the button (bottom left, inside
 * the padding). Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="card.js"><\/script>
 *
 *   <kakao-card>
 *     <h3 slot="header">Upgrade to Pro</h3>
 *     <p>Unlimited projects and priority support.</p>
 *     <div slot="footer">
 *       <kakao-button label="Upgrade"></kakao-button>
 *       <kakao-button label="Later" variant="ghost"></kakao-button>
 *     </div>
 *   </kakao-card>
 *
 *   A single button can go straight into the footer: <kakao-button slot="footer">.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  no-glow   Never show the glow.
 *
 * ----------------------------------------------------------------------------
 * GLOW
 * ----------------------------------------------------------------------------
 *  Shown when the first element of the footer is a <kakao-button> (or a
 *  wrapper whose first element is one). Its colour is the button's background
 *  (for a ghost button, its text colour), so it follows the variant and the
 *  theme. It moves with the button on resize. It stays faint enough not to
 *  change text contrast; with prefers-reduced-motion it doesn't animate.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-card-bg / -border / -text      surface, hairline and text (theme)
 *  --kakao-card-radius / -padding / -gap
 *  --kakao-card-glow-strength   14%     colour mix at the centre
 *  --kakao-card-glow-size       320px   radius of the glow
 *  --kakao-card-glow-blur       28px    extra softness
 *
 * Parts: card, glow, header, body, footer.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-card';
  if (customElements.get(TAG_NAME)) return;

  const ROOT = document.documentElement;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-card- (written by construction.html, edit there) */
        --_bg: var(--kakao-card-bg, var(--kakao-color-bg, #ffffff));
        --_border: var(--kakao-card-border, var(--kakao-color-line, #e5e7eb));
        --_text: var(--kakao-card-text, var(--kakao-color-text, #18181b));
        --_radius: var(--kakao-card-radius, 14px);
        --_padding: var(--kakao-card-padding, 1.25rem);
        --_gap: var(--kakao-card-gap, 0.75rem);
        --_footer-gap: var(--kakao-card-footer-gap, 0.5rem);
        --_footer-spacing: var(--kakao-card-footer-spacing, 1.25rem);
        --_glow-strength: var(--kakao-card-glow-strength, 14%);
        --_glow-size: var(--kakao-card-glow-size, 320px);
        --_glow-blur: var(--kakao-card-glow-blur, 28px);
        --_glow-duration: var(--kakao-card-glow-duration, 400ms);
        /* @kakao-settings:end */
        display: block;
        min-width: 0;
      }
      :host([hidden]) { display: none; }

      .card {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: var(--_gap);
        box-sizing: border-box;
        height: 100%;
        padding: var(--_padding);
        background: var(--_bg);
        color: var(--_text);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
      }

      /* ---- glow: behind the content, from the first footer button ---- */
      .glow {
        position: absolute;
        z-index: -1;
        inset: calc(var(--_glow-blur) * -2);
        pointer-events: none;
        opacity: 0;
        background: radial-gradient(
          circle var(--_glow-size) at
            calc(var(--_glow-x, 0px) + var(--_glow-blur) * 2)
            calc(var(--_glow-y, 0px) + var(--_glow-blur) * 2),
          color-mix(in srgb, var(--_glow-color, transparent) var(--_glow-strength), transparent),
          transparent 70%
        );
        filter: blur(var(--_glow-blur));
        transition: opacity var(--_glow-duration) ease;
      }
      :host([data-glow]) .glow { opacity: 1; }

      .header-box:not([hidden]),
      .footer-box:not([hidden]) { display: block; }
      .header-box[hidden], .footer-box[hidden] { display: none; }

      .footer-box {
        margin-top: auto;
        padding-top: calc(var(--_footer-spacing) - var(--_gap));
      }
      ::slotted([slot="header"]) { margin: 0; }
      ::slotted([slot="footer"]) {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--_footer-gap);
      }
      ::slotted(kakao-button[slot="footer"]) { display: inline-flex; }

      /* Body children are spaced by the card's gap, not by their own margins */
      .body { min-width: 0; display: flex; flex-direction: column; gap: var(--_gap); }
      .body ::slotted(*) { margin-block: 0; }

      @media (prefers-reduced-motion: reduce) {
        .glow { transition: none; }
      }
    </style>
    <div class="card" part="card">
      <div class="glow" part="glow" aria-hidden="true"></div>
      <div class="header-box" part="header" hidden><slot name="header"></slot></div>
      <div class="body" part="body"><slot></slot></div>
      <div class="footer-box" part="footer" hidden><slot name="footer"></slot></div>
    </div>
  `;

  class KakaoCard extends HTMLElement {
    static get observedAttributes() {
      return ['no-glow'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._card = shadow.querySelector('.card');
      this._headerBox = shadow.querySelector('.header-box');
      this._footerBox = shadow.querySelector('.footer-box');
      this._headerSlot = shadow.querySelector('slot[name="header"]');
      this._footerSlot = shadow.querySelector('slot[name="footer"]');

      this._button = null;
      this._update = this._update.bind(this);
      this._schedule = this._schedule.bind(this);
      this._onSlotChange = this._onSlotChange.bind(this);
      this._resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(this._schedule) : null;
      this._buttonObserver = new MutationObserver(this._schedule);
      this._themeObserver = new MutationObserver(() => this._schedule(true));
      this._darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
      this._onScheme = () => this._schedule(true);
    }

    connectedCallback() {
      this._headerSlot.addEventListener('slotchange', this._onSlotChange);
      this._footerSlot.addEventListener('slotchange', this._onSlotChange);
      if (this._resizeObserver) this._resizeObserver.observe(this);
      // Theme changes recolour the button, so the glow follows.
      this._themeObserver.observe(ROOT, { attributes: true, attributeFilter: ['data-kakao-theme', 'data-bs-theme', 'class'] });
      if (this._darkQuery) this._darkQuery.addEventListener('change', this._onScheme);
      this._onSlotChange();
    }

    disconnectedCallback() {
      this._headerSlot.removeEventListener('slotchange', this._onSlotChange);
      this._footerSlot.removeEventListener('slotchange', this._onSlotChange);
      if (this._resizeObserver) this._resizeObserver.disconnect();
      this._buttonObserver.disconnect();
      this._themeObserver.disconnect();
      if (this._darkQuery) this._darkQuery.removeEventListener('change', this._onScheme);
      cancelAnimationFrame(this._frame);
      clearTimeout(this._late);
    }

    attributeChangedCallback() {
      this._schedule();
    }

    /* -------------------------- Slots -------------------------- */

    _onSlotChange() {
      this._headerBox.hidden = this._headerSlot.assignedElements().length === 0;
      const footer = this._footerSlot.assignedElements();
      this._footerBox.hidden = footer.length === 0;

      // The glow button: the footer's first element, or that wrapper's first element.
      const first = footer[0] || null;
      const button = first && (first.localName === 'kakao-button' ? first : first.firstElementChild);
      const next = button && button.localName === 'kakao-button' ? button : null;

      if (next !== this._button) {
        this._buttonObserver.disconnect();
        if (this._resizeObserver && this._button) this._resizeObserver.unobserve(this._button);
        this._button = next;
        if (next) {
          this._buttonObserver.observe(next, { attributes: true, attributeFilter: ['variant', 'disabled', 'class', 'style'] });
          if (this._resizeObserver) this._resizeObserver.observe(next);
        }
      }
      this._schedule();
    }

    /* -------------------------- Glow -------------------------- */

    /** Coalesce updates into one frame; theme changes re-check once their transitions settle. */
    _schedule(themeChange) {
      cancelAnimationFrame(this._frame);
      this._frame = requestAnimationFrame(this._update);
      if (themeChange === true) {
        clearTimeout(this._late);
        this._late = setTimeout(this._update, 450);
      }
    }

    _update() {
      const button = this._button;
      if (!button || this.hasAttribute('no-glow') || !button.isConnected) {
        this.removeAttribute('data-glow');
        return;
      }
      const inner = button.querySelector('.kakao-button-inner') || button;
      const style = getComputedStyle(inner);
      let color = style.backgroundColor;
      if (isTransparent(color)) color = style.color; // ghost: its text colour
      if (isTransparent(color)) {
        this.removeAttribute('data-glow');
        return;
      }
      const card = this._card.getBoundingClientRect();
      const b = inner.getBoundingClientRect();
      // Relative to the card's padding box (the glow's containing block).
      const x = b.left + b.width / 2 - card.left - this._card.clientLeft;
      const y = b.top + b.height / 2 - card.top - this._card.clientTop;
      this._card.style.setProperty('--_glow-x', `${Math.round(x)}px`);
      this._card.style.setProperty('--_glow-y', `${Math.round(y)}px`);
      this._card.style.setProperty('--_glow-color', color);
      this.setAttribute('data-glow', '');
    }
  }

  function isTransparent(color) {
    if (!color || color === 'transparent') return true;
    const m = color.match(/rgba?\(([^)]+)\)/);
    if (!m) return false;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    return parts.length === 4 && parseFloat(parts[3]) === 0;
  }

  customElements.define(TAG_NAME, KakaoCard);
})();
