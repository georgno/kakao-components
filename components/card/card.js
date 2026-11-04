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
 *  no-glow   Never show the glow.
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
        --_glow-strength: var(--kakao-card-glow-strength, 14%);
        --_glow-size: var(--kakao-card-glow-size, 320px);
        --_glow-blur: var(--kakao-card-glow-blur, 28px);
        --_glow-x: var(--kakao-card-glow-x, calc(var(--_padding) + 3rem));
        --_glow-y: var(--kakao-card-glow-y, calc(var(--_padding) + 22px));
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
      this._onSlotChange = this._onSlotChange.bind(this);
    }

    connectedCallback() {
      ensurePageStyles();
      this._headerSlot.addEventListener('slotchange', this._onSlotChange);
      this._footerSlot.addEventListener('slotchange', this._onSlotChange);
      this._onSlotChange();
    }

    disconnectedCallback() {
      this._headerSlot.removeEventListener('slotchange', this._onSlotChange);
      this._footerSlot.removeEventListener('slotchange', this._onSlotChange);
    }

    /** Empty header / footer areas take no space. */
    _onSlotChange() {
      this._headerBox.hidden = this._headerSlot.assignedElements().length === 0;
      this._footerBox.hidden = this._footerSlot.assignedElements().length === 0;
    }
  }

  customElements.define(TAG_NAME, KakaoCard);
})();
