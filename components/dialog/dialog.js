/**
 * <kakao-dialog>
 * ============================================================================
 * A modal dialog: covered page, centred panel, focus kept inside. Built from a
 * plain fixed overlay, not from <dialog> + showModal(), so it behaves the same
 * on phone, tablet and desktop - one implementation, no mobile fallback.
 * Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="../button/button.css">
 *   <script src="../button/button.js" defer><\/script>
 *   <script src="dialog.js" defer><\/script>
 *
 *   <kakao-dialog id="confirm" label="Delete account">
 *     <h2 slot="header">Delete account?</h2>
 *     <p>Your watch history and profiles will be gone.</p>
 *     <div slot="footer">
 *       <kakao-button label="Keep it" variant="secondary" data-close="cancel"><\/kakao-button>
 *       <kakao-button label="Delete" variant="danger" data-close="delete"><\/kakao-button>
 *     </div>
 *   </kakao-dialog>
 *
 *   <kakao-button label="Delete account" …></kakao-button>
 *   … addEventListener('kakao-button-action', () => confirm.open())
 *
 * The body is the default slot, so plain children work without a slot name.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *   open          Boolean. Present = shown. Observed, so setting the attribute
 *                 from a template or framework opens it. The component keeps it
 *                 in sync with open() / close() / Escape / the scrim.
 *   label         Accessible name. Used as aria-label when there is no
 *                 slot="header" element; with one, that element is the name.
 *   size          "sm" | "md" (default) | "lg": the panel's max width.
 *   no-dismiss    Escape and a click on the covered page do nothing. Only a
 *                 button with data-close (or close()) ends the dialog.
 *   button-position  "left" | "center" | "right" (default): where the footer
 *                 buttons sit.
 *   full-width    Footer buttons share the full width in equal parts (one
 *                 button covers it all). Overrides button-position.

 *   contained     Render inside the nearest positioned ancestor instead of over
 *                 the viewport, and drop the modal machinery: no page scroll
 *                 lock, no focus move, no focus trap, no Escape. For previews
 *                 and embedded shells that show a dialog as part of the page.
 *                 Read when the dialog opens.
 *
 * FOOTER RULE: with more than one footer button, the main (filled) button
 * sits in the corner: last for right (default) and full-width, first for
 * left; centred, it comes last. Its corner then rounds to match it.
 *
 * ----------------------------------------------------------------------------
 * METHODS
 * ----------------------------------------------------------------------------
 *   open()                Show the dialog.
 *   close(returnValue?)   Hide it; returnValue reaches dialog-close.
 *   toggle()
 *   isOpen                Getter, boolean.
 *
 * ----------------------------------------------------------------------------
 * EVENTS
 * ----------------------------------------------------------------------------
 *   dialog-open    detail: {}
 *   dialog-close   detail: { returnValue } - what data-close carried, or what
 *                  close() was given ("cancel" / "dismiss" for Escape and the
 *                  scrim).
 *
 * Triggers (KakaoComponents, see shared/component-api.js):
 *   dialog-open, dialog-close - same details.
 *
 * ----------------------------------------------------------------------------
 * ANY ELEMENT WITH data-close CLOSES IT
 * ----------------------------------------------------------------------------
 *   data-close            closes, returnValue "".
 *   data-close="delete"   closes, returnValue "delete".
 * Any click inside the dialog on an element carrying it works, including a
 * <kakao-button> (the click on its inner button bubbles to the host).
 *
 * ----------------------------------------------------------------------------
 * THEMING
 * ----------------------------------------------------------------------------
 * Every --kakao-dialog-* property in the settings block of the template can be
 * set on <kakao-dialog> or any ancestor. The defaults live in that block:
 * change them on construction.html.
 *
 * shortcut: the covered page is 45% black, so on amoled (a pure #000 page) it
 * dims nothing - there the raised panel and its edge carry the separation.
 * Upgrade to a per-theme scrim if amoled needs the page to recede.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-dialog';
  if (customElements.get(TAG_NAME)) return;

  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /*
   * One page scroll lock for all dialogs: closing the inner one must not
   * unlock the page while the outer one is still open.
   */
  let openCount = 0;
  let savedOverflow = '';
  let savedPadding = '';
  let seq = 0;

  function lockScroll() {
    if (openCount++ > 0) return;
    const html = document.documentElement;
    savedOverflow = html.style.overflow;
    savedPadding = html.style.paddingRight;
    // The scrollbar disappears: hold its width so the page does not shift.
    const gap = window.innerWidth - html.clientWidth;
    if (gap > 0) html.style.paddingRight = `${gap}px`;
    html.style.overflow = 'hidden';
  }

  function unlockScroll() {
    if (openCount === 0) return;
    openCount -= 1;
    if (openCount > 0) return;
    const html = document.documentElement;
    html.style.overflow = savedOverflow;
    html.style.paddingRight = savedPadding;
  }

  /*
   * Page-level rules for full-width: the buttons inside a footer wrapper and the
   * buttons' own faces are light DOM that ::slotted can't reach. Added once,
   * first in <head>, so page styles can still override them.
   */
  const PAGE_CSS = `
    kakao-dialog[full-width] > [slot="footer"]:not(kakao-button) > kakao-button { flex: 1 1 0; min-width: 0; }
    kakao-dialog[full-width] > kakao-button[slot="footer"] .kakao-button-inner,
    kakao-dialog[full-width] > [slot="footer"] > kakao-button .kakao-button-inner { width: 100%; }
  `;
  function ensurePageStyles() {
    if (document.getElementById('kakao-dialog-footer')) return;
    const style = document.createElement('style');
    style.id = 'kakao-dialog-footer';
    style.textContent = PAGE_CSS;
    document.head.prepend(style);
  }

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-dialog- (written by construction.html, edit there) */
        --_scrim: var(--kakao-dialog-scrim, rgb(0 0 0 / .45));
        --_bg: var(--kakao-dialog-bg, var(--kakao-color-raised, #ffffff));
        --_text: var(--kakao-dialog-text, var(--kakao-color-text, #18181b));
        --_radius: var(--kakao-dialog-radius, 14px);
        --_padding: var(--kakao-dialog-padding, 1.25rem);
        --_gap: var(--kakao-dialog-gap, 0.75rem);
        --_footer-gap: var(--kakao-dialog-footer-gap, 0.5rem);
        --_footer-spacing: var(--kakao-dialog-footer-spacing, 1.25rem);
        --_shadow: var(--kakao-dialog-shadow, 0 8px 24px rgb(0 0 0 / .08), 0 0 0 1px color-mix(in srgb, var(--kakao-color-text, #18181b) 10%, transparent));
        --_focus: var(--kakao-dialog-focus, var(--kakao-color-focus, #2563eb));
        --_z: var(--kakao-dialog-z, 60);
        --_width-sm: var(--kakao-dialog-width-sm, 22rem);
        --_width-md: var(--kakao-dialog-width-md, 30rem);
        --_width-lg: var(--kakao-dialog-width-lg, 42rem);
        --_max-height: var(--kakao-dialog-max-height, 85vh);
        --_title-size: var(--kakao-dialog-title-size, 1.125rem);
        --_title-weight: var(--kakao-dialog-title-weight, 600);
        --_duration: var(--kakao-dialog-duration, 200ms);
        --_easing: var(--kakao-dialog-easing, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */

        /* The host is the covered page: fixed, so it takes no room in the flow
           and is immune to the page's stacking. Late for visibility, so the
           panel can finish its exit animation before everything disappears. */
        position: fixed;
        inset: 0;
        z-index: var(--_z);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        box-sizing: border-box;
        visibility: hidden;
        pointer-events: none;
        transition: visibility 0s linear var(--_duration);
      }
      :host([contained]) {
        /* Scoped to a positioned ancestor: the page owns the size. */
        position: absolute;
      }
      :host([open]) {
        visibility: visible;
        pointer-events: auto;
        transition: visibility 0s;
      }

      .scrim {
        position: absolute;
        inset: 0;
        background: var(--_scrim);
        opacity: 0;
        transition: opacity var(--_duration) var(--_easing);
      }
      :host([open]) .scrim { opacity: 1; }

      .panel {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: var(--_gap);
        box-sizing: border-box;
        width: 100%;
        max-width: var(--_width-md);
        max-height: var(--_max-height);
        padding: var(--_padding);
        overflow: hidden;
        background: var(--_bg);
        color: var(--_text);
        /* A bottom corner with a footer button in it follows the nesting rule:
           that button's radius + the padding, so they sit concentric. The script
           measures which corners hold a button and sets --_corner-bl / -br. */
        border-radius: var(--_radius);
        /* Elliptical when the padding differs per side ("r+padX r+padY"). */
        border-bottom-right-radius: var(--_corner-br, var(--_radius));
        border-bottom-left-radius: var(--_corner-bl, var(--_radius));
        box-shadow: var(--_shadow);
        opacity: 0;
        transform: translateY(8px) scale(.98);
        transition:
          opacity var(--_duration) var(--_easing),
          transform var(--_duration) var(--_easing);
      }
      :host([open]) .panel { opacity: 1; transform: none; }
      :host([size="sm"]) .panel { max-width: var(--_width-sm); }
      :host([size="lg"]) .panel { max-width: var(--_width-lg); }

      /* The panel takes focus itself when it opens, so Tab starts here. */
      .panel:focus { outline: none; }
      .panel:focus-visible {
        outline: 2px solid var(--_focus);
        outline-offset: 2px;
      }

      .header-box, .footer-box { flex-shrink: 0; }
      .header-box[hidden], .footer-box[hidden] { display: none; }
      /* Normal page declarations beat ::slotted, so a page rule like
         "h2 { margin-top: 2.75rem }" would push the title down. Only !important
         from the shadow tree wins over them: the panel's spacing comes from its
         gap and padding alone. */
      ::slotted([slot="header"]) {
        margin: 0 !important;
        font-size: var(--_title-size);
        font-weight: var(--_title-weight);
        letter-spacing: -0.01em;
        line-height: 1.3;
      }

      /* The body is the only part that scrolls, so header and footer stay put. */
      .body {
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        display: flex;
        flex-direction: column;
        gap: var(--_gap);
      }
      .body ::slotted(*) { margin-block: 0 !important; }

      :host { --_justify: flex-end; }
      :host([button-position="left"]) { --_justify: flex-start; }
      :host([button-position="center"]) { --_justify: center; }
      .footer-box {
        display: flex;
        flex-wrap: wrap;
        justify-content: var(--_justify);
        align-items: center;
        gap: var(--_footer-gap);
        padding-top: calc(var(--_footer-spacing) - var(--_gap));
      }
      ::slotted([slot="footer"]) { margin-block: 0 !important; }
      ::slotted(kakao-button[slot="footer"]) { display: inline-flex; }
      /* A wrapper (<div slot="footer">) is a row of its own across the footer, so
         its buttons follow button-position and the footer gap too. */
      ::slotted([slot="footer"]:not(kakao-button)) {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: var(--_justify);
        gap: var(--_footer-gap);
        flex: 1 1 100%;
        min-width: 0;
      }
      :host([full-width]) ::slotted(kakao-button[slot="footer"]) { flex: 1 1 0; min-width: 0; }
      :host([full-width]) ::slotted([slot="footer"]:not(kakao-button)) { flex-wrap: nowrap; }

      @media (prefers-reduced-motion: reduce) {
        :host, .scrim, .panel { transition: none; }
        .panel { transform: none; }
      }
    </style>
    <div class="scrim" part="scrim"></div>
    <div class="panel" part="panel" role="dialog" aria-modal="true" tabindex="-1">
      <div class="header-box" part="header" hidden><slot name="header"></slot></div>
      <div class="body" part="body"><slot></slot></div>
      <div class="footer-box" part="footer" hidden><slot name="footer"></slot></div>
    </div>
  `;

  class KakaoDialog extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'label', 'size', 'no-dismiss', 'button-position', 'full-width'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));

      this._panel = shadow.querySelector('.panel');
      this._scrim = shadow.querySelector('.scrim');
      this._headerBox = shadow.querySelector('.header-box');
      this._footerBox = shadow.querySelector('.footer-box');
      this._headerSlot = shadow.querySelector('slot[name="header"]');
      this._footerSlot = shadow.querySelector('slot[name="footer"]');

      this._applied = false; // the open attribute we last acted on
      this._returnFocus = null;
      this._returnValue = '';

      this._onKeydown = this._onKeydown.bind(this);
      this._onSlotChange = this._onSlotChange.bind(this);
      this._fitCorners = this._fitCorners.bind(this);
      // Footer wrapping, label changes, late-upgrading buttons: refit the corners.
      this._resize = new ResizeObserver(this._fitCorners);
      // A footer button turning ghost (or changing size) changes no box size: refit.
      this._buttonAttrs = new MutationObserver(this._fitCorners);

      this._scrim.addEventListener('click', () => {
        if (!this.hasAttribute('no-dismiss')) this.close('dismiss');
      });
      // Any element carrying data-close ends the dialog; one delegated listener
      // keeps it working for content added later.
      this.addEventListener('click', (e) => {
        const target = e.target instanceof Element ? e.target.closest('[data-close]') : null;
        if (!target || !this.contains(target)) return;
        this.close(target.getAttribute('data-close') || '');
      });
    }

    /* ---------------------------- Lifecycle ---------------------------- */

    connectedCallback() {
      ensurePageStyles();
      this._headerSlot.addEventListener('slotchange', this._onSlotChange);
      this._footerSlot.addEventListener('slotchange', this._onSlotChange);
      this._onSlotChange();
      this._syncLabel();
      this._apply(this.hasAttribute('open'));
      this._resize.observe(this._panel);
      this._resize.observe(this._footerBox);
      this._buttonAttrs.observe(this, { subtree: true, attributes: true, attributeFilter: ['variant', 'size'] });
    }

    disconnectedCallback() {
      this._headerSlot.removeEventListener('slotchange', this._onSlotChange);
      this._footerSlot.removeEventListener('slotchange', this._onSlotChange);
      if (this._applied) this._apply(false);
      this._resize.disconnect();
      this._buttonAttrs.disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'open') {
        this._apply(this.hasAttribute('open'));
        if (this.isOpen) {
          this._fitCorners(); // before the first frame, so the corners never jump in
          requestAnimationFrame(this._fitCorners);
        }
        return;
      }
      if (name === 'label') this._syncLabel();
      // The buttons move to other corners (or fill both): refit them.
      if (name === 'button-position' || name === 'full-width') requestAnimationFrame(this._fitCorners);
    }

    /* ------------------------------ Open ------------------------------- */

    get isOpen() {
      return this.hasAttribute('open');
    }

    open() {
      this.setAttribute('open', '');
    }

    close(returnValue = '') {
      this._returnValue = returnValue == null ? '' : String(returnValue);
      this.removeAttribute('open');
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    /**
     * Apply the open state. The look is pure CSS (the `open` attribute); this
     * only does what CSS cannot: scroll lock, focus, keyboard.
     * @param {boolean} on
     */
    _apply(on) {
      if (on === this._applied) return;
      this._applied = on;

      // A contained dialog is part of the page, not on top of it: the visual
      // state is all it owns, so the page stays scrollable and tabbable.
      const modal = !this.hasAttribute('contained');
      if (modal) this._panel.setAttribute('aria-modal', 'true');
      else this._panel.removeAttribute('aria-modal'); // it is not on top of anything

      if (on) {
        this._returnValue = '';
        if (modal) {
          this._returnFocus = document.activeElement;
          lockScroll();
          document.addEventListener('keydown', this._onKeydown);
          // After the attribute lands, so the panel is visible and focusable.
          requestAnimationFrame(() => {
            if (this._applied) this._panel.focus({ preventScroll: true });
          });
        }
        this._dispatch('dialog-open', {});
        return;
      }

      if (modal) {
        unlockScroll();
        document.removeEventListener('keydown', this._onKeydown);
        const target = this._returnFocus;
        this._returnFocus = null;
        if (target && target !== document.body && document.contains(target) && typeof target.focus === 'function') {
          target.focus({ preventScroll: true });
        }
      }
      this._dispatch('dialog-close', { returnValue: this._returnValue });
    }

    /* ------------------------------ Parts ------------------------------ */

    _onSlotChange() {
      this._headerBox.hidden = this._headerSlot.assignedElements().length === 0;
      this._footerBox.hidden = this._footerSlot.assignedElements().length === 0;
      this._syncLabel();
      this._fitCorners();
    }

    /**
     * Nesting rule for the bottom corners: a corner gets (button radius +
     * padding) only when a filled footer button (not ghost) sits right in it, so the two curves
     * are concentric. Measured, so it follows the button's size (sm/md/lg),
     * the footer's alignment and wrapping. Other corners keep --_radius.
     */
    _fitCorners() {
      // Only while open. Closing is often a click on a footer button, which is
      // squashed (scaled) at that moment and would read as "not in the corner":
      // the corners keep their shape through the exit animation.
      if (!this.isOpen) return;
      const panel = this._panel;
      const corners = { bl: null, br: null };
      if (!this._footerBox.hidden && panel.offsetWidth) {
        const box = panel.getBoundingClientRect();
        const scale = box.width / panel.offsetWidth || 1; // the open animation scales the panel
        const cs = getComputedStyle(panel);
        const pad = { left: parseFloat(cs.paddingLeft), right: parseFloat(cs.paddingRight), bottom: parseFloat(cs.paddingBottom) };
        const near = (a, b) => Math.abs(a - b) <= 1.5;
        const buttons = this._footerSlot.assignedElements()
          .flatMap((el) => (el.localName === 'kakao-button' ? [el] : [...el.querySelectorAll('kakao-button')]));
        buttons.forEach((btn) => {
          // A ghost button has no fill, so there is no shape for the corner to follow.
          if (btn.getAttribute('variant') === 'ghost') return;
          const face = btn.querySelector('.kakao-button-inner') || btn;
          const r = face.getBoundingClientRect();
          if (!r.width) return;
          if (!near((box.bottom - r.bottom) / scale, pad.bottom)) return;
          const fs = getComputedStyle(face);
          const radiusOf = (v) => (v.trim().endsWith('%')
            ? (Math.min(face.offsetWidth, face.offsetHeight) * parseFloat(v)) / 100
            : parseFloat(v) || 0);
          if (near((box.right - r.right) / scale, pad.right)) {
            const rr = radiusOf(fs.borderBottomRightRadius);
            corners.br = `${rr + pad.right}px ${rr + pad.bottom}px`;
          }
          if (near((r.left - box.left) / scale, pad.left)) {
            const rl = radiusOf(fs.borderBottomLeftRadius);
            corners.bl = `${rl + pad.left}px ${rl + pad.bottom}px`;
          }
        });
      }
      Object.entries(corners).forEach(([corner, radius]) => {
        if (radius == null) panel.style.removeProperty(`--_corner-${corner}`);
        else panel.style.setProperty(`--_corner-${corner}`, radius);
      });
    }

    /** Name the dialog after its header element, or after the label attribute. */
    _syncLabel() {
      const [header] = this._headerSlot.assignedElements();
      if (header) {
        if (!header.id) header.id = `kakao-dialog-title-${++seq}`;
        this._panel.setAttribute('aria-labelledby', header.id);
        this._panel.removeAttribute('aria-label');
        return;
      }
      const label = this.getAttribute('label');
      this._panel.removeAttribute('aria-labelledby');
      if (label) this._panel.setAttribute('aria-label', label);
      else this._panel.removeAttribute('aria-label');
    }

    /* ---------------------------- Keyboard ----------------------------- */

    _onKeydown(e) {
      if (e.key === 'Escape') {
        if (this.hasAttribute('no-dismiss')) return;
        e.preventDefault();
        this.close('cancel');
        return;
      }
      if (e.key === 'Tab') this._trapTab(e);
    }

    /** Keep Tab (and Shift+Tab) inside the panel. */
    _trapTab(e) {
      const focusables = Array.from(this.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      if (!focusables.length) {
        // Nothing to focus inside: hold on the panel instead of leaving.
        e.preventDefault();
        this._panel.focus({ preventScroll: true });
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const shadowActive = this.shadowRoot.activeElement;
      const active = shadowActive === this._panel ? this._panel : this.querySelector(':focus');

      if (e.shiftKey && (active === first || !active || active === this._panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || active === this._panel)) {
        e.preventDefault();
        first.focus();
      } else if (!active) {
        e.preventDefault();
        first.focus();
      }
    }

    /* ----------------------------- Events ------------------------------ */

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
      if (typeof KakaoComponents !== 'undefined') {
        KakaoComponents.emit(this, name, detail);
      }
    }
  }

  customElements.define(TAG_NAME, KakaoDialog);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, {
      triggers: ['dialog-open', 'dialog-close'],
    });
  }
})();
