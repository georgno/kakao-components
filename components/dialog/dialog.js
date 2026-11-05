/**
 * <kakao-dialog>
 * ============================================================================
 * A modal dialog: covered page, centred panel, focus kept inside. Built from a
 * plain fixed overlay, not from <dialog> + showModal(), so it behaves the same
 * on phone, tablet and desktop — one implementation, no mobile fallback.
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
 *   dialog-close   detail: { returnValue } — what data-close carried, or what
 *                  close() was given ("cancel" / "dismiss" for Escape and the
 *                  scrim).
 *
 * Triggers (KakaoComponents, see shared/component-api.js):
 *   dialog-open, dialog-close — same details.
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
 * dims nothing — there the raised panel and its edge carry the separation.
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

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-dialog- (written by construction.html, edit there) */
        --kakao-dialog-scrim: color-mix(in srgb, #000 45%, transparent);
        --kakao-dialog-bg: var(--kakao-color-raised, #ffffff);
        --kakao-dialog-text: var(--kakao-color-text, #18181b);
        --kakao-dialog-radius: 14px;
        --kakao-dialog-padding: 1.25rem;
        --kakao-dialog-gap: 0.75rem;
        --kakao-dialog-footer-gap: 0.5rem;
        --kakao-dialog-footer-spacing: 1.25rem;
        /* one line: the construction parser reads one setting per line */
        --kakao-dialog-shadow: 0 8px 24px rgb(0 0 0 / .08), 0 0 0 1px color-mix(in srgb, var(--kakao-color-text, #18181b) 10%, transparent);
        --kakao-dialog-focus: var(--kakao-color-focus, #2563eb);
        --kakao-dialog-z: 60;
        --kakao-dialog-width-sm: 22rem;
        --kakao-dialog-width-md: 30rem;
        --kakao-dialog-width-lg: 42rem;
        --kakao-dialog-max-height: 85vh;
        --kakao-dialog-title-size: 1.125rem;
        --kakao-dialog-title-weight: 600;
        --kakao-dialog-duration: 200ms;
        --kakao-dialog-easing: cubic-bezier(.2, 0, 0, 1);
        /* @kakao-settings:end */

        /* The host is the covered page: fixed, so it takes no room in the flow
           and is immune to the page's stacking. Late for visibility, so the
           panel can finish its exit animation before everything disappears. */
        position: fixed;
        inset: 0;
        z-index: var(--kakao-dialog-z, 60);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        box-sizing: border-box;
        visibility: hidden;
        pointer-events: none;
        transition: visibility 0s linear var(--kakao-dialog-duration, 200ms);
      }
      :host([open]) {
        visibility: visible;
        pointer-events: auto;
        transition: visibility 0s;
      }

      .scrim {
        position: absolute;
        inset: 0;
        background: var(--kakao-dialog-scrim, rgb(0 0 0 / .45));
        opacity: 0;
        transition: opacity var(--kakao-dialog-duration, 200ms) var(--kakao-dialog-easing, ease);
      }
      :host([open]) .scrim { opacity: 1; }

      .panel {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: var(--kakao-dialog-gap, 0.75rem);
        box-sizing: border-box;
        width: 100%;
        max-width: var(--kakao-dialog-width-md, 30rem);
        max-height: var(--kakao-dialog-max-height, 85vh);
        padding: var(--kakao-dialog-padding, 1.25rem);
        overflow: hidden;
        background: var(--kakao-dialog-bg, #fff);
        color: var(--kakao-dialog-text, inherit);
        border-radius: var(--kakao-dialog-radius, 14px);
        box-shadow: var(--kakao-dialog-shadow, 0 8px 24px rgb(0 0 0 / .08));
        opacity: 0;
        transform: translateY(8px) scale(.98);
        transition:
          opacity var(--kakao-dialog-duration, 200ms) var(--kakao-dialog-easing, ease),
          transform var(--kakao-dialog-duration, 200ms) var(--kakao-dialog-easing, ease);
      }
      :host([open]) .panel { opacity: 1; transform: none; }
      :host([size="sm"]) .panel { max-width: var(--kakao-dialog-width-sm, 22rem); }
      :host([size="lg"]) .panel { max-width: var(--kakao-dialog-width-lg, 42rem); }

      /* The panel takes focus itself when it opens, so Tab starts here. */
      .panel:focus { outline: none; }
      .panel:focus-visible {
        outline: 2px solid var(--kakao-dialog-focus, #2563eb);
        outline-offset: 2px;
      }

      .header-box, .footer-box { flex-shrink: 0; }
      .header-box[hidden], .footer-box[hidden] { display: none; }
      ::slotted([slot="header"]) {
        margin: 0;
        font-size: var(--kakao-dialog-title-size, 1.125rem);
        font-weight: var(--kakao-dialog-title-weight, 600);
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
        gap: var(--kakao-dialog-gap, 0.75rem);
      }
      .body ::slotted(*) { margin-block: 0; }

      .footer-box {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: center;
        gap: var(--kakao-dialog-footer-gap, 0.5rem);
        padding-top: calc(var(--kakao-dialog-footer-spacing, 1.25rem) - var(--kakao-dialog-gap, 0.75rem));
      }
      ::slotted(kakao-button[slot="footer"]) { display: inline-flex; }

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
      return ['open', 'label', 'size', 'no-dismiss'];
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
      this._headerSlot.addEventListener('slotchange', this._onSlotChange);
      this._footerSlot.addEventListener('slotchange', this._onSlotChange);
      this._onSlotChange();
      this._syncLabel();
      this._apply(this.hasAttribute('open'));
    }

    disconnectedCallback() {
      this._headerSlot.removeEventListener('slotchange', this._onSlotChange);
      this._footerSlot.removeEventListener('slotchange', this._onSlotChange);
      if (this._applied) this._apply(false);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'open') {
        this._apply(this.hasAttribute('open'));
        return;
      }
      if (name === 'label') this._syncLabel();
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

      if (on) {
        this._returnFocus = document.activeElement;
        this._returnValue = '';
        lockScroll();
        document.addEventListener('keydown', this._onKeydown);
        // After the attribute lands, so the panel is visible and focusable.
        requestAnimationFrame(() => {
          if (this._applied) this._panel.focus({ preventScroll: true });
        });
        this._dispatch('dialog-open', {});
        return;
      }

      unlockScroll();
      document.removeEventListener('keydown', this._onKeydown);
      const target = this._returnFocus;
      this._returnFocus = null;
      if (target && target !== document.body && document.contains(target) && typeof target.focus === 'function') {
        target.focus({ preventScroll: true });
      }
      this._dispatch('dialog-close', { returnValue: this._returnValue });
    }

    /* ------------------------------ Parts ------------------------------ */

    _onSlotChange() {
      this._headerBox.hidden = this._headerSlot.assignedElements().length === 0;
      this._footerBox.hidden = this._footerSlot.assignedElements().length === 0;
      this._syncLabel();
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
