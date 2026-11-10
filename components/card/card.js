/**
 * <kakao-card>
 * ============================================================================
 * A content card: optional header, body, optional footer. When the footer
 * starts with a <kakao-button>, the card gets a very subtle, blurred radial
 * glow in that button's colour, rising from the bottom left where the button
 * sits. Vanilla JS, Shadow DOM, no deps.
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
 *  no-glow      Never show the glow.
 *  theme-glow   Glow in the theme's primary colour after a theme change, when
 *               no footer button decides the colour (see THEME TRIGGER GLOW).
 *  no-animate   Don't animate height changes.
 *
 * ----------------------------------------------------------------------------
 * THEME TRIGGER GLOW
 * ----------------------------------------------------------------------------
 *  Opt-in with the theme-glow attribute; without it a theme change does
 *  nothing to the card. A theme-glow card with no footer button takes its
 *  glow colour from the theme. When a <kakao-theme-switch> reports a new theme through the trigger API
 *  (shared/component-api.js), the card reacts to "theme-change" and uses the
 *  colour it carries (--kakao-color-primary of the new theme) for the glow.
 *
 *    <script src="shared/component-api.js"><\/script>
 *    KakaoComponents.on('theme-change', (detail) => console.log(detail.color));
 *
 *  The card only glows this way after a theme change; a card without a footer
 *  button stays quiet on load. no-glow still wins, and a footer button still
 *  decides the colour through the CSS below.
 *
 * ----------------------------------------------------------------------------
 * HEIGHT CHANGES
 * ----------------------------------------------------------------------------
 *  When content is removed or added, the card glides to its new height
 *  instead of jumping. Not while the page loads (until two frames after the
 *  load event), and not for content that animates its own size (an opening
 *  kakao-accordion resizes the card every frame; the card follows it). A card whose height comes from outside (stretched in a
 *  grid row) or that changes width (window resize) doesn't animate. Off with
 *  prefers-reduced-motion or no-animate.
 *
 * ----------------------------------------------------------------------------
 * GLOW (pure CSS)
 * ----------------------------------------------------------------------------
 *  A page-level stylesheet (added once by this script) uses :has() to see
 *  whether the footer starts with a <kakao-button> and which variant it has,
 *  and sets --kakao-card-glow-color from the same variables the button uses
 *  (--kakao-button-primary-bg → --kakao-button-ink → --kakao-color-ink, …).
 *  So the glow appears and disappears with the button, follows variant
 *  changes and themes, and needs no JavaScript. The colour is a registered
 *  <color> property, so it fades smoothly instead of jumping.
 *
 *  Primary → ink, danger → danger, secondary → its fill. A ghost button has no
 *  colour of its own, so it gives no glow.
 *  Overrides of --kakao-button-* set on the card or an ancestor are followed;
 *  ones set only on the button itself are not (CSS can't read them upwards).
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-card-bg / -border / -text      surface, hairline and text (theme)
 *  --kakao-card-radius / -padding / -gap
 *  --kakao-card-glow-strength   14%     colour mix at the centre
 *  --kakao-card-glow-size       320px   radius of the glow
 *  --kakao-card-glow-blur       28px    extra softness
 *  --kakao-card-glow-x / -y             centre, from the bottom-left corner
 *  --kakao-card-glow-color              set by the page rules (override to force)
 *
 * Parts: card, glow, header, body, footer.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-card';
  if (customElements.get(TAG_NAME)) return;

  /*
   * Page-level rules. :has() has to look into the card's light DOM children,
   * which a shadow stylesheet can't do (:host(:has()) is not allowed).
   */
  const FIRST_BUTTON = (variant) => {
    const v = variant === 'primary' ? ':is(:not([variant]), [variant="primary"])' : `[variant="${variant}"]`;
    return `> kakao-button[slot="footer"]${v}, > [slot="footer"] > kakao-button:first-child${v}`;
  };
  const PAGE_CSS = `
    @property --kakao-card-glow-color {
      syntax: '<color>';
      inherits: true;
      initial-value: transparent;
    }
    kakao-card {
      --kakao-card-glow-color: transparent;
      transition: --kakao-card-glow-color var(--kakao-card-glow-duration, 400ms) ease;
    }
    kakao-card:not([no-glow]):has(${FIRST_BUTTON('primary')}) {
      --kakao-card-glow-color: var(--kakao-button-primary-bg, var(--kakao-button-ink, var(--kakao-color-ink, #18181b)));
    }
    kakao-card:not([no-glow]):has(${FIRST_BUTTON('secondary')}) {
      --kakao-card-glow-color: var(--kakao-button-secondary-bg, var(--kakao-color-subtle-strong, #e6e6e8));
    }
    kakao-card:not([no-glow]):has(${FIRST_BUTTON('danger')}) {
      --kakao-card-glow-color: var(--kakao-button-danger-bg, var(--kakao-color-danger, #dc2626));
    }
    @media (prefers-reduced-motion: reduce) {
      kakao-card { transition: none; }
    }
  `;

  function ensurePageStyles() {
    if (document.getElementById('kakao-card-glow')) return;
    const style = document.createElement('style');
    style.id = 'kakao-card-glow';
    style.textContent = PAGE_CSS;
    // First in <head>, so page styles can still override it.
    document.head.prepend(style);
  }

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
        --_glow-strength: var(--kakao-card-glow-strength, 8%);
        --_glow-size: var(--kakao-card-glow-size, 320px);
        --_glow-blur: var(--kakao-card-glow-blur, 28px);
        --_glow-x: var(--kakao-card-glow-x, calc(var(--_padding) + 3rem));
        --_glow-y: var(--kakao-card-glow-y, calc(var(--_padding) + 22px));
        --_resize-duration: var(--kakao-card-resize-duration, 280ms);
        --_resize-easing: var(--kakao-card-resize-easing, cubic-bezier(.25, 1, .5, 1));
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

      /* ---- glow: behind the content, bottom left, coloured by the page rules ---- */
      .glow {
        position: absolute;
        z-index: -1;
        inset: calc(var(--_glow-blur) * -2);
        pointer-events: none;
        background: radial-gradient(
          circle var(--_glow-size) at
            calc(var(--_glow-x) + var(--_glow-blur) * 2)
            calc(100% - var(--_glow-y) - var(--_glow-blur) * 2),
          color-mix(in srgb, var(--kakao-card-glow-color, transparent) var(--_glow-strength), transparent),
          transparent 70%
        );
        filter: blur(var(--_glow-blur));
      }

      .header-box[hidden], .footer-box[hidden] { display: none; }
      /* Content keeps its natural height while the card's height animates */
      .header-box, .body, .footer-box { flex-shrink: 0; }
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
    </style>
    <div class="card" part="card">
      <div class="glow" part="glow" aria-hidden="true"></div>
      <div class="header-box" part="header" hidden><slot name="header"></slot></div>
      <div class="body" part="body"><slot></slot></div>
      <div class="footer-box" part="footer" hidden><slot name="footer"></slot></div>
    </div>
  `;

  class KakaoCard extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._headerBox = shadow.querySelector('.header-box');
      this._footerBox = shadow.querySelector('.footer-box');
      this._headerSlot = shadow.querySelector('slot[name="header"]');
      this._footerSlot = shadow.querySelector('slot[name="footer"]');
      this._card = shadow.querySelector('.card');
      this._body = shadow.querySelector('.body');
      this._onSlotChange = this._onSlotChange.bind(this);
      this._onContentResize = this._onContentResize.bind(this);
      this._resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(this._onContentResize) : null;
      this._last = null; // { height, width } of the previous layout
      this._lastContentChange = -Infinity; // time of the last content resize
      this._settled = false; // true once the page has loaded and drawn
      this._anim = null;
      this._themeColor = null;
      this._updateGlowColor = this._updateGlowColor.bind(this);
    }

    static get observedAttributes() {
      return ['no-glow', 'theme-glow'];
    }

    attributeChangedCallback() {
      this._updateGlowColor();
    }

    connectedCallback() {
      ensurePageStyles();
      this._headerSlot.addEventListener('slotchange', this._onSlotChange);
      this._footerSlot.addEventListener('slotchange', this._onSlotChange);
      this._onSlotChange();
      if (!this._settled) {
        // Settled two frames after the window's load event (or after connect,
        // when the page has loaded already).
        const settle = () => requestAnimationFrame(() => requestAnimationFrame(() => { this._settled = true; }));
        if (document.readyState === 'complete') settle();
        else window.addEventListener('load', settle, { once: true });
      }
      if (this._resizeObserver) {
        [this._headerBox, this._body, this._footerBox, this._card].forEach((el) => this._resizeObserver.observe(el));
      }
      if (typeof KakaoComponents !== 'undefined') {
        this._offThemeTrigger = KakaoComponents.on('theme-change', (detail) => {
          this._themeColor = detail.color || null;
          this._updateGlowColor();
        });
      }
    }

    disconnectedCallback() {
      this._headerSlot.removeEventListener('slotchange', this._onSlotChange);
      this._footerSlot.removeEventListener('slotchange', this._onSlotChange);
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._anim) this._anim.cancel();
      this._last = null;
      if (this._offThemeTrigger) { this._offThemeTrigger(); this._offThemeTrigger = null; }
    }

    /* -------------------------- Height animation -------------------------- */

    /*
     * ResizeObserver runs after layout, before paint: the card already has its
     * new height, so it can glide there from the old one without a jump frame
     * (FLIP, for height). Only content changes animate; a change of the card
     * alone (window resize, grid row) just becomes the new baseline.
     */
    _onContentResize(entries) {
      const contentChanged = entries.some((e) => e.target !== this._card);
      if (this._anim && !contentChanged) return; // our own animation resizing the card

      // Where the card is on screen right now (mid-animation, or the last layout).
      const shown = this._anim ? this._card.getBoundingClientRect().height : (this._last && this._last.height);
      if (this._anim) this._anim.cancel(); // measure the real layout without it
      const rect = this._card.getBoundingClientRect();
      const last = this._last;
      this._last = { height: rect.height, width: rect.width };

      // Content that animates its own size (an opening accordion) resizes the
      // card on every frame: follow it, don't add a second, lagging glide.
      const now = performance.now();
      const streaming = contentChanged && now - this._lastContentChange < 100;
      if (contentChanged) this._lastContentChange = now;

      // While the page loads, components draw and content is added; the card
      // takes those heights as they come instead of gliding to each one.
      if (!this._settled || streaming) return;
      if (!last || !contentChanged) return;
      if (Math.abs(rect.width - last.width) > 0.5) return; // reflow from a width change
      if (Math.abs(rect.height - shown) < 0.5) return;
      if (this.hasAttribute('no-animate') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const style = getComputedStyle(this);
      const duration = parseFloat(style.getPropertyValue('--_resize-duration')) || 280;
      const easing = style.getPropertyValue('--_resize-easing').trim() || 'ease-out';
      const anim = this._card.animate(
        [{ height: `${shown}px` }, { height: `${rect.height}px` }],
        { duration, easing },
      );
      this._anim = anim;
      const done = () => { if (this._anim === anim) this._anim = null; };
      anim.onfinish = done;
      anim.oncancel = done;
    }

    /** Empty header / footer areas take no space. */
    _onSlotChange() {
      this._headerBox.hidden = this._headerSlot.assignedElements().length === 0;
      this._footerBox.hidden = this._footerSlot.assignedElements().length === 0;
      this._updateGlowColor();
    }

    /**
     * Glow colour for a card without a footer button: the colour of the last
     * theme change, only with theme-glow. A footer button keeps deciding
     * through the page CSS, and no-glow wins over both.
     */
    _updateGlowColor() {
      if (this.hasAttribute('no-glow') || !this.hasAttribute('theme-glow')) {
        this.style.removeProperty('--kakao-card-glow-color');
        return;
      }
      const hasButton = this.querySelector('kakao-button[slot="footer"], [slot="footer"] > kakao-button:first-child');
      if (!hasButton && this._themeColor) {
        this.style.setProperty('--kakao-card-glow-color', this._themeColor);
      } else {
        this.style.removeProperty('--kakao-card-glow-color');
      }
    }
  }

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register('kakao-card', {
      triggers: [],
      reactions: { 'theme-change': 'glow color' },
    });
  }

  customElements.define(TAG_NAME, KakaoCard);
})();
