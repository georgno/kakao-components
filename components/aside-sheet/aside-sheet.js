/**
 * <kakao-aside-sheet>
 * ============================================================================
 * A card that slides in from an edge of the viewport, over the page. Modal by
 * default: covered page, focus kept inside, Escape and a click on the covered
 * page close it. Built like <kakao-dialog>: a plain fixed overlay, not
 * <dialog> + showModal(), so phones, tablets and desktops behave the same.
 * Only the corners that face into the page are rounded, so the sheet reads as
 * pushed in from outside the view. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="../button/button.css">
 *   <script src="../button/button.js" defer><\/script>
 *   <script src="aside-sheet.js" defer><\/script>
 *
 *   <kakao-button id="filters-btn" label="Filters"></kakao-button>
 *
 *   <kakao-aside-sheet for="filters-btn" side="end" label="Filters">
 *     <h2 slot="header">Filters</h2>
 *     <p>Any content; the body scrolls when it is tall.</p>
 *     <div slot="footer">
 *       <kakao-button label="Reset" variant="ghost" data-close="reset"><\/kakao-button>
 *       <kakao-button label="Show results" data-close="apply"><\/kakao-button>
 *     </div>
 *   </kakao-aside-sheet>
 *
 * The body is the default slot, so plain children work without a slot name.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *   open          Boolean. Present = shown. Observed; kept in sync with
 *                 show() / hide() / Escape / the scrim / the close button.
 *   side          "bottom" (default) | "top" | "start" | "end". start and end
 *                 follow the writing direction (dir="rtl" swaps them);
 *                 "left" / "right" are physical aliases. Read on every open.
 *   for           Ids (space separated) of elements that toggle the sheet on
 *                 click, like <label for>. They get aria-haspopup="dialog"
 *                 and aria-expanded. Elements added later work too.
 *   label         Accessible name when there is no slot="header" element.
 *   modal         "false" = non-modal: no scrim, no focus trap, no scroll
 *                 lock; the page stays usable. Escape still closes it while
 *                 focus is inside. Read when the sheet opens.
 *   no-dismiss    Escape, the scrim and the close button do nothing (the
 *                 close button is not shown). Only data-close or hide().
 *   no-close-button  Hide the built-in close button in the header.
 *   close-label   Accessible name of the close button. Default "Close".
 *   handle        Bottom sheets: a drag handle above the header. Dragging it
 *                 (or the header) down far or fast enough closes the sheet.
 *   contained     Render inside the nearest positioned ancestor instead of
 *                 the viewport, without the modal machinery (no scroll lock,
 *                 focus move, trap or Escape). For previews.
 *
 * ----------------------------------------------------------------------------
 * METHODS
 * ----------------------------------------------------------------------------
 *   show()               Open it.
 *   hide(returnValue?)   Close it (cancelable through sheet-hide).
 *   toggle()
 *   isOpen               Getter, boolean.
 *
 * ANY ELEMENT WITH data-close CLOSES IT, as in the dialog:
 *   data-close            closes, returnValue "".
 *   data-close="apply"    closes, returnValue "apply".
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed; also emitted as triggers)
 * ----------------------------------------------------------------------------
 *   sheet-show     { side }                 it opened.
 *   sheet-hide     { reason, returnValue }  cancelable, before a close by the
 *                  user or hide(). reason: escape · scrim · button (close
 *                  button or data-close) · swipe · method.
 *   sheet-hidden   { reason, returnValue }  it has left (after the slide out).
 *                  Removing the open attribute directly skips sheet-hide;
 *                  sheet-hidden then has reason "attribute".
 *
 * ----------------------------------------------------------------------------
 * STACKING AND MOTION
 * ----------------------------------------------------------------------------
 * z-index 50: above the header bar (30) and the aside menu (40), below the
 * dialog (60), toasts (70) and popovers (1000) - a confirm dialog opened from
 * a sheet covers it. Slides in on the spring curve (a move into place along a
 * line) and leaves on the standard one; a skirt in the panel colour past the
 * outer edge hides the spring's overshoot. Reduced motion: a fade only.
 *
 * ----------------------------------------------------------------------------
 * THEMING
 * ----------------------------------------------------------------------------
 * Every --kakao-aside-sheet-* property in the settings block below can be set
 * on <kakao-aside-sheet> or any ancestor. Change the defaults on
 * construction.html. Parts: scrim, panel, handle, header, close, body, footer.
 *
 * shortcut: the page scroll lock is this component's own (components don't
 * share code). A dialog and a sheet closed out of order could restore each
 * other's saved overflow; nested use (open A, open B, close B, close A) works.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-aside-sheet';
  if (customElements.get(TAG_NAME)) return;

  const FOCUSABLE =
    'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, iframe, [contenteditable=""], [contenteditable="true"], [tabindex]';
  const SIDES = ['bottom', 'top', 'start', 'end', 'left', 'right'];
  const SWIPE_DISTANCE = 0.25; // of the sheet's height
  const SWIPE_SPEED = 0.5; // px per ms

  /* One page scroll lock for all sheets (see the shortcut note above). */
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

  /** The focused element, looking through open shadow roots. */
  function deepActive() {
    let a = document.activeElement;
    while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
    return a;
  }

  /** Longest duration in a computed transition-duration list, in ms. */
  function longestMs(list) {
    return Math.max(0, ...String(list).split(',').map((v) => {
      const n = parseFloat(v) || 0;
      return v.trim().endsWith('ms') ? n : n * 1000;
    }));
  }

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-aside-sheet- (written by construction.html, edit there) */
        --_scrim: var(--kakao-aside-sheet-scrim, rgb(0 0 0 / .45));
        --_bg: var(--kakao-aside-sheet-bg, var(--kakao-color-raised, #ffffff));
        --_text: var(--kakao-aside-sheet-text, var(--kakao-color-text, #18181b));
        --_line: var(--kakao-aside-sheet-line, var(--kakao-color-line, #e5e7eb));
        --_handle-color: var(--kakao-aside-sheet-handle-color, var(--kakao-color-border, #82828b));
        --_focus: var(--kakao-aside-sheet-focus, var(--kakao-color-focus, #2563eb));
        --_radius: var(--kakao-aside-sheet-radius, 14px);
        --_padding: var(--kakao-aside-sheet-padding, 1.25rem);
        --_gap: var(--kakao-aside-sheet-gap, 0.75rem);
        --_footer-gap: var(--kakao-aside-sheet-footer-gap, 0.5rem);
        --_footer-spacing: var(--kakao-aside-sheet-footer-spacing, 1.25rem);
        --_width: var(--kakao-aside-sheet-width, 24rem);
        --_max-width: var(--kakao-aside-sheet-max-width, 42rem);
        --_max-height: var(--kakao-aside-sheet-max-height, 85dvh);
        --_handle-width: var(--kakao-aside-sheet-handle-width, 2.25rem);
        --_handle-height: var(--kakao-aside-sheet-handle-height, 4px);
        --_close-size: var(--kakao-aside-sheet-close-size, 2rem);
        --_close-radius: var(--kakao-aside-sheet-close-radius, 6px);
        --_shadow: var(--kakao-aside-sheet-shadow, 0 8px 24px rgb(0 0 0 / .08), 0 0 0 1px color-mix(in srgb, var(--kakao-color-text, #18181b) 10%, transparent));
        --_z: var(--kakao-aside-sheet-z, 50);
        --_title-size: var(--kakao-aside-sheet-title-size, 1.125rem);
        --_title-weight: var(--kakao-aside-sheet-title-weight, 600);
        --_duration: var(--kakao-aside-sheet-duration, var(--kakao-motion-duration, 320ms));
        --_easing: var(--kakao-aside-sheet-easing, var(--kakao-ease-spring, cubic-bezier(.5, 1.8, .4, 1)));
        --_exit-duration: var(--kakao-aside-sheet-exit-duration, 200ms);
        --_exit-easing: var(--kakao-aside-sheet-exit-easing, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */

        /* Padding per edge; the edges the sheet touches keep the safe area. */
        --_pt: var(--_padding);
        --_pr: var(--_padding);
        --_pb: var(--_padding);
        --_pl: var(--_padding);

        /* The host is the covered page: fixed, so it takes no room in the flow.
           Late for visibility, so the panel can finish sliding out first. */
        position: fixed;
        inset: 0;
        /* A page margin on the host (a card's "> * + * { margin-top }") would
           shift the fixed box and leave a strip of the page uncovered at the
           top. Normal page declarations beat :host, so only !important holds. */
        margin: 0 !important;
        z-index: var(--_z);
        display: block;
        visibility: hidden;
        pointer-events: none;
        transition: visibility 0s linear var(--_exit-duration);
      }
      :host([contained]) { position: absolute; }
      :host([open]) {
        visibility: visible;
        transition: visibility 0s;
      }
      :host([open]:not([modal="false"])) { pointer-events: auto; }

      .scrim {
        position: absolute;
        inset: 0;
        background: var(--_scrim);
        opacity: 0;
        transition: opacity var(--_exit-duration) var(--_exit-easing);
      }
      :host([open]) .scrim {
        opacity: 1;
        transition: opacity var(--_duration) var(--_exit-easing);
      }
      :host([modal="false"]) .scrim { display: none; }

      .panel {
        position: absolute;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        padding-block: var(--_pt) var(--_pb);
        background: var(--_bg);
        color: var(--_text);
        box-shadow: var(--_shadow);
        pointer-events: auto;
        transition: transform var(--_exit-duration) var(--_exit-easing);
      }
      /* [data-edge] lifts it above the per-edge closed transforms below. */
      :host([open][data-edge]) .panel {
        transform: none;
        transition: transform var(--_duration) var(--_easing);
      }
      .panel.dragging { transition: none !important; }

      /* The skirt: the panel colour continues past the outer edge, so the
         spring's overshoot never lifts the sheet off its edge. */
      .panel::before {
        content: "";
        position: absolute;
        background: inherit;
      }

      /* ---- edges (data-edge is the physical side, set by the script) ---- */
      :host([data-edge="bottom"]) .panel,
      :host([data-edge="top"]) .panel {
        left: 0;
        right: 0;
        margin-inline: auto;
        width: 100%;
        max-width: var(--_max-width);
        max-height: var(--_max-height);
        --_pl: calc(var(--_padding) + env(safe-area-inset-left, 0px));
        --_pr: calc(var(--_padding) + env(safe-area-inset-right, 0px));
      }
      :host([data-edge="bottom"]) .panel {
        bottom: 0;
        border-radius: var(--_radius) var(--_radius) 0 0;
        transform: translateY(100%);
        --_pb: calc(var(--_padding) + env(safe-area-inset-bottom, 0px));
      }
      :host([data-edge="bottom"]) .panel::before { left: 0; right: 0; top: 100%; height: 100%; }
      :host([data-edge="top"]) .panel {
        top: 0;
        border-radius: 0 0 var(--_radius) var(--_radius);
        transform: translateY(-100%);
        --_pt: calc(var(--_padding) + env(safe-area-inset-top, 0px));
      }
      :host([data-edge="top"]) .panel::before { left: 0; right: 0; bottom: 100%; height: 100%; }

      :host([data-edge="left"]) .panel,
      :host([data-edge="right"]) .panel {
        top: 0;
        bottom: 0;
        width: min(var(--_width), 100%);
        --_pt: calc(var(--_padding) + env(safe-area-inset-top, 0px));
        --_pb: calc(var(--_padding) + env(safe-area-inset-bottom, 0px));
      }
      :host([data-edge="left"]) .panel {
        left: 0;
        border-radius: 0 var(--_radius) var(--_radius) 0;
        transform: translateX(-100%);
        --_pl: calc(var(--_padding) + env(safe-area-inset-left, 0px));
      }
      :host([data-edge="left"]) .panel::before { top: 0; bottom: 0; right: 100%; width: 100%; }
      :host([data-edge="right"]) .panel {
        right: 0;
        border-radius: var(--_radius) 0 0 var(--_radius);
        transform: translateX(100%);
        --_pr: calc(var(--_padding) + env(safe-area-inset-right, 0px));
      }
      :host([data-edge="right"]) .panel::before { top: 0; bottom: 0; left: 100%; width: 100%; }

      /* The panel takes focus itself when it opens, so Tab starts here. Its
         outer edge is off screen, so the ring sits inside. */
      .panel:focus { outline: none; }
      .panel:focus-visible {
        outline: 2px solid var(--_focus);
        outline-offset: -4px;
      }

      /* ---- handle ---- */
      .handle { display: none; }
      :host([handle][data-edge="bottom"]) .panel { padding-top: 0; }
      :host([handle][data-edge="bottom"]) .handle {
        display: flex;
        flex-shrink: 0;
        justify-content: center;
        align-items: center;
        height: calc(var(--_padding) + var(--_handle-height));
        cursor: grab;
        touch-action: none;
      }
      .handle::after {
        content: "";
        width: var(--_handle-width);
        height: var(--_handle-height);
        border-radius: 999px;
        background: var(--_handle-color);
      }
      :host([handle][data-edge="bottom"]) .header-box { touch-action: none; user-select: none; }

      /* ---- header ---- */
      .header-box {
        display: flex;
        align-items: center;
        gap: var(--_gap);
        flex-shrink: 0;
        padding: 0 var(--_pr) calc(var(--_gap) - 4px) var(--_pl);
        border-bottom: 1px solid transparent;
        transition: border-color var(--_exit-duration) var(--_exit-easing);
      }
      .header-box[hidden] { display: none; }
      .title { flex: 1 1 auto; min-width: 0; }
      /* Normal page declarations beat ::slotted, so only !important keeps a
         page rule like "h2 { margin-top: 2.75rem }" off the title. */
      ::slotted([slot="header"]) {
        margin: 0 !important;
        font-size: var(--_title-size);
        font-weight: var(--_title-weight);
        letter-spacing: -0.01em;
        line-height: 1.3;
      }
      .close {
        position: relative;
        flex: none;
        display: inline-grid;
        place-items: center;
        width: var(--_close-size);
        height: var(--_close-size);
        margin: calc(var(--_close-size) / -8) calc(var(--_close-size) / -4) calc(var(--_close-size) / -8) auto;
        padding: 0;
        border: 0;
        border-radius: var(--_close-radius);
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
        opacity: 0.7;
      }
      .close:hover { opacity: 1; background: color-mix(in srgb, currentColor 12%, transparent); }
      .close:focus-visible { opacity: 1; outline: 2px solid var(--_focus); outline-offset: 2px; }
      .close svg { width: 0.85rem; height: 0.85rem; }
      .close[hidden] { display: none; }

      /* ---- body: the only part that scrolls ---- */
      .body {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        display: flex;
        flex-direction: column;
        gap: var(--_gap);
        /* room for the focus rings of the first and last controls */
        padding: 4px var(--_pr) 4px var(--_pl);
      }
      .body ::slotted(*) { margin-block: 0 !important; }

      /* ---- footer ---- */
      .footer-box {
        display: flex;
        flex-wrap: wrap;
        flex-shrink: 0;
        justify-content: flex-end;
        align-items: center;
        gap: var(--_footer-gap);
        padding: calc(var(--_footer-spacing) - 4px) var(--_pr) 0 var(--_pl);
        border-top: 1px solid transparent;
        transition: border-color var(--_exit-duration) var(--_exit-easing);
      }
      .footer-box[hidden] { display: none; }
      ::slotted([slot="footer"]) { margin-block: 0 !important; }
      ::slotted(kakao-button[slot="footer"]) { display: inline-flex; }
      /* A wrapper (<div slot="footer">, a <form>) is a row across the footer. */
      ::slotted([slot="footer"]:not(kakao-button)) {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: var(--_footer-gap);
        flex: 1 1 100%;
        min-width: 0;
      }

      /* Hairlines while the body has content scrolled past header or footer. */
      .panel[data-scrolled] .header-box { border-bottom-color: var(--_line); }
      .panel[data-more] .footer-box { border-top-color: var(--_line); }

      @media (prefers-reduced-motion: reduce) {
        /* No slide: the sheet fades in and out where it rests. */
        :host([data-edge]) .panel, :host([open][data-edge]) .panel {
          transform: none;
          opacity: 0;
          transition: opacity var(--_exit-duration) var(--_exit-easing);
        }
        :host([open][data-edge]) .panel { opacity: 1; }
        .panel.dragging { opacity: 1; }
        .scrim, :host([open]) .scrim { transition-duration: var(--_exit-duration); }
      }
      @media (forced-colors: active) {
        .panel { border: 1px solid CanvasText; }
      }
    </style>
    <div class="scrim" part="scrim"></div>
    <div class="panel" part="panel" role="dialog" tabindex="-1">
      <div class="handle" part="handle" aria-hidden="true"></div>
      <div class="header-box" part="header" hidden>
        <div class="title"><slot name="header"></slot></div>
        <button class="close" part="close" type="button"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="body" part="body"><slot></slot></div>
      <div class="footer-box" part="footer" hidden><slot name="footer"></slot></div>
    </div>
  `;

  class KakaoAsideSheet extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'side', 'for', 'label', 'no-dismiss', 'no-close-button', 'close-label', 'handle'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));

      this._panel = shadow.querySelector('.panel');
      this._scrim = shadow.querySelector('.scrim');
      this._handle = shadow.querySelector('.handle');
      this._headerBox = shadow.querySelector('.header-box');
      this._footerBox = shadow.querySelector('.footer-box');
      this._body = shadow.querySelector('.body');
      this._closeBtn = shadow.querySelector('.close');
      this._headerSlot = shadow.querySelector('slot[name="header"]');
      this._footerSlot = shadow.querySelector('slot[name="footer"]');

      this._applied = false; // the open state we last acted on
      this._modal = false; // whether the current open is modal
      this._returnFocus = null;
      this._pending = null; // { reason, returnValue } of the close in progress
      this._hiddenTimer = 0;
      this._drag = null;

      this._onKeydown = this._onKeydown.bind(this);
      this._onDocClick = this._onDocClick.bind(this);
      this._onSlotChange = this._onSlotChange.bind(this);
      this._syncEdges = this._syncEdges.bind(this);
      this._resize = new ResizeObserver(this._syncEdges);

      this._scrim.addEventListener('click', () => {
        if (!this.hasAttribute('no-dismiss')) this._requestHide('scrim');
      });
      this._closeBtn.addEventListener('click', () => this._requestHide('button'));
      this._body.addEventListener('scroll', this._syncEdges, { passive: true });
      // Any element carrying data-close ends the sheet; delegated, so content
      // added later works too.
      this.addEventListener('click', (e) => {
        const target = e.target instanceof Element ? e.target.closest('[data-close]') : null;
        if (!target || !this.contains(target)) return;
        this._requestHide('button', target.getAttribute('data-close') || '');
      });

      // Swipe to close: from the handle and the header, never the body.
      const down = this._onPointerDown.bind(this);
      this._handle.addEventListener('pointerdown', down);
      this._headerBox.addEventListener('pointerdown', down);
      this._panel.addEventListener('pointermove', this._onPointerMove.bind(this));
      this._panel.addEventListener('pointerup', (e) => this._onPointerUp(e, true));
      this._panel.addEventListener('pointercancel', (e) => this._onPointerUp(e, false));
    }

    /* ---------------------------- Lifecycle ---------------------------- */

    connectedCallback() {
      this._headerSlot.addEventListener('slotchange', this._onSlotChange);
      this._footerSlot.addEventListener('slotchange', this._onSlotChange);
      document.addEventListener('click', this._onDocClick);
      this._resize.observe(this._body);
      this._syncEdge();
      this._syncClose();
      this._onSlotChange();
      this._apply(this.hasAttribute('open'));
      this._syncTriggers();
    }

    disconnectedCallback() {
      this._headerSlot.removeEventListener('slotchange', this._onSlotChange);
      this._footerSlot.removeEventListener('slotchange', this._onSlotChange);
      document.removeEventListener('click', this._onDocClick);
      this._resize.disconnect();
      if (this._applied) this._apply(false);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this.isConnected) return;
      switch (name) {
        case 'open': this._apply(this.hasAttribute('open')); break;
        case 'side': this._syncEdge(); break;
        case 'for': this._syncTriggers(oldValue); break;
        case 'label': this._syncLabel(); break;
        default: this._syncClose();
      }
    }

    /* ------------------------------ Open ------------------------------- */

    get isOpen() {
      return this.hasAttribute('open');
    }

    show() {
      this.setAttribute('open', '');
    }

    hide(returnValue = '') {
      return this._requestHide('method', returnValue);
    }

    toggle() {
      if (this.isOpen) this.hide();
      else this.show();
    }

    /** A close by the user or hide(): ask first (sheet-hide is cancelable). */
    _requestHide(reason, returnValue = '') {
      if (!this.isOpen) return false;
      const detail = { reason, returnValue: returnValue == null ? '' : String(returnValue) };
      const ok = this.dispatchEvent(new CustomEvent('sheet-hide', {
        detail, bubbles: true, composed: true, cancelable: true,
      }));
      if (!ok) return false;
      if (typeof KakaoComponents !== 'undefined') KakaoComponents.emit(this, 'sheet-hide', detail);
      this._pending = detail;
      this.removeAttribute('open');
      return true;
    }

    /**
     * Apply the open state. The look is CSS (the open attribute); this does
     * what CSS cannot: scroll lock, focus, keyboard, events.
     */
    _apply(on) {
      if (on === this._applied) return;
      this._applied = on;
      clearTimeout(this._hiddenTimer);

      if (on) {
        this._pending = null;
        this._syncEdge();
        this._modal = !this.hasAttribute('contained') && this.getAttribute('modal') !== 'false';
        if (this._modal) this._panel.setAttribute('aria-modal', 'true');
        else this._panel.removeAttribute('aria-modal');
        if (!this.hasAttribute('contained')) {
          this._returnFocus = deepActive();
          if (this._modal) lockScroll();
          document.addEventListener('keydown', this._onKeydown);
          // After the attribute lands, so the panel is visible and focusable.
          requestAnimationFrame(() => {
            if (this._applied) this._panel.focus({ preventScroll: true });
          });
        }
        this._syncTriggers();
        requestAnimationFrame(this._syncEdges);
        this._dispatch('sheet-show', { side: this._side() });
        return;
      }

      const detail = this._pending || { reason: 'attribute', returnValue: '' };
      this._pending = null;
      this._endDrag();
      if (!this.hasAttribute('contained')) {
        if (this._modal) unlockScroll();
        document.removeEventListener('keydown', this._onKeydown);
        const target = this._returnFocus;
        this._returnFocus = null;
        // Non-modal: only take focus back when it was still in the sheet.
        const active = deepActive();
        const focusInside = active && this._isInside(active);
        if ((this._modal || focusInside) && target && target !== document.body
          && target.isConnected && typeof target.focus === 'function') {
          target.focus({ preventScroll: true });
        }
      }
      this._syncTriggers();
      // sheet-hidden once the slide out is over (read from the computed style,
      // so a changed duration or reduced motion just works).
      const wait = longestMs(getComputedStyle(this._panel).transitionDuration) + 30;
      this._hiddenTimer = setTimeout(() => {
        if (!this._applied) this._dispatch('sheet-hidden', detail);
      }, wait);
    }

    /* ------------------------------ Parts ------------------------------ */

    _side() {
      const side = (this.getAttribute('side') || '').trim().toLowerCase();
      return SIDES.includes(side) ? side : 'bottom';
    }

    /** The physical edge: start / end follow the writing direction. */
    _syncEdge() {
      const side = this._side();
      let edge = side;
      if (side === 'start' || side === 'end') {
        const rtl = getComputedStyle(this).direction === 'rtl';
        edge = (side === 'start') !== rtl ? 'left' : 'right';
      }
      if (this.getAttribute('data-edge') !== edge) this.setAttribute('data-edge', edge);
    }

    _syncClose() {
      this._closeBtn.hidden = this.hasAttribute('no-close-button') || this.hasAttribute('no-dismiss');
      this._closeBtn.setAttribute('aria-label', this.getAttribute('close-label') || 'Close');
      this._onSlotChange();
    }

    _onSlotChange() {
      const hasHeader = this._headerSlot.assignedElements().length > 0;
      this._headerBox.hidden = !hasHeader && this._closeBtn.hidden;
      this._footerBox.hidden = this._footerSlot.assignedElements().length === 0;
      this._syncLabel();
      this._syncEdges();
    }

    /** Hairlines under the header / over the footer while content runs past. */
    _syncEdges() {
      const b = this._body;
      this._panel.toggleAttribute('data-scrolled', b.scrollTop > 0);
      this._panel.toggleAttribute('data-more', b.scrollTop + b.clientHeight < b.scrollHeight - 1);
    }

    /** Name the sheet after its header element, or after the label attribute. */
    _syncLabel() {
      const [header] = this._headerSlot.assignedElements();
      if (header) {
        if (!header.id) header.id = `kakao-aside-sheet-title-${++seq}`;
        this._panel.setAttribute('aria-labelledby', header.id);
        this._panel.removeAttribute('aria-label');
        return;
      }
      const label = this.getAttribute('label');
      this._panel.removeAttribute('aria-labelledby');
      if (label) this._panel.setAttribute('aria-label', label);
      else this._panel.removeAttribute('aria-label');
    }

    /* ----------------------------- Triggers ---------------------------- */

    _triggerIds(value = this.getAttribute('for')) {
      return (value || '').split(/\s+/).filter(Boolean);
    }

    _syncTriggers(oldFor) {
      if (oldFor !== undefined) {
        this._triggerIds(oldFor).forEach((id) => {
          const el = document.getElementById(id);
          if (el) { el.removeAttribute('aria-haspopup'); el.removeAttribute('aria-expanded'); }
        });
      }
      this._triggerIds().forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.setAttribute('aria-haspopup', 'dialog');
        el.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false');
      });
    }

    /** One listener on the document, so triggers added later work too. */
    _onDocClick(e) {
      const ids = this._triggerIds();
      if (!ids.length) return;
      const hit = e.composedPath().find((n) => n instanceof Element && n.id && ids.includes(n.id));
      if (!hit) return;
      this._syncTriggers(); // a trigger added since the last sync gets its aria
      this.toggle();
    }

    /* ---------------------------- Keyboard ----------------------------- */

    /** Is this node inside the sheet (light DOM, its shadow root, nested roots)? */
    _isInside(node) {
      for (let n = node; n; n = n.parentNode || n.host) {
        if (n === this) return true;
      }
      return false;
    }

    _onKeydown(e) {
      if (e.defaultPrevented) return;
      const active = deepActive();
      const inside = active && this._isInside(active);
      const nowhere = !active || active === document.body || active === document.documentElement;
      // Focus in something else (a dialog opened on top): not our key.
      if (!inside && !(this._modal && nowhere)) return;

      if (e.key === 'Escape') {
        if (this.hasAttribute('no-dismiss')) return;
        e.preventDefault();
        this._requestHide('escape');
        return;
      }
      if (e.key === 'Tab' && this._modal) this._trapTab(e, active);
    }

    /** Focusable elements in visual order, through slots and open shadow roots. */
    _focusables() {
      const out = [];
      const visit = (el) => {
        if (el.localName === 'slot') {
          el.assignedElements({ flatten: true }).forEach(visit);
          return;
        }
        if (el.hidden || el.inert) return;
        if (el.matches(FOCUSABLE) && el.tabIndex >= 0 && el.getClientRects().length > 0
          && !(el.localName === 'input' && el.type === 'radio' && !el.checked && this._radioGroupHasChecked(el))) {
          out.push(el);
        }
        const kids = el.shadowRoot ? el.shadowRoot.children : el.children;
        Array.from(kids).forEach(visit);
      };
      Array.from(this._panel.children).forEach(visit);
      return out;
    }

    /** Tab reaches only the checked radio of a group. */
    _radioGroupHasChecked(radio) {
      if (!radio.name) return false;
      const root = radio.form || radio.getRootNode();
      return Array.from(root.querySelectorAll('input[type="radio"]'))
        .some((r) => r.name === radio.name && r.checked);
    }

    /** Keep Tab (and Shift+Tab) inside the sheet. Moves focus itself, so the
        order is the sheet's, also through nested shadow roots. */
    _trapTab(e, active) {
      e.preventDefault();
      const list = this._focusables();
      if (!list.length) {
        this._panel.focus({ preventScroll: true });
        return;
      }
      const i = list.indexOf(active);
      let next;
      if (e.shiftKey) next = i <= 0 ? list[list.length - 1] : list[i - 1];
      else next = i === -1 || i === list.length - 1 ? list[0] : list[i + 1];
      next.focus();
    }

    /* ------------------------------ Swipe ------------------------------ */

    _onPointerDown(e) {
      if (!this.isOpen || !this.hasAttribute('handle') || this.getAttribute('data-edge') !== 'bottom') return;
      if (e.button !== 0) return;
      // Controls in the header keep their own clicks.
      const path = e.composedPath();
      const stop = path.indexOf(e.currentTarget);
      if (path.slice(0, stop).some((n) => n instanceof Element && n.matches(FOCUSABLE + ', kakao-button'))) return;
      this._drag = { id: e.pointerId, y0: e.clientY, dy: 0, v: 0, t: performance.now(), h: this._panel.offsetHeight };
      this._panel.setPointerCapture(e.pointerId);
      this._panel.classList.add('dragging');
    }

    _onPointerMove(e) {
      const d = this._drag;
      if (!d || e.pointerId !== d.id) return;
      const raw = e.clientY - d.y0;
      // Down follows the pointer; up resists (the sheet is already in place).
      const dy = raw >= 0 ? raw : Math.max(raw / 5, -12);
      const now = performance.now();
      d.v = (dy - d.dy) / Math.max(now - d.t, 1);
      d.dy = dy;
      d.t = now;
      this._panel.style.transform = `translateY(${dy}px)`;
    }

    _onPointerUp(e, release) {
      const d = this._drag;
      if (!d || e.pointerId !== d.id) return;
      const close = release && (d.dy > d.h * SWIPE_DISTANCE || (d.v > SWIPE_SPEED && d.dy > 10));
      this._endDrag();
      // Without the inline transform the panel transitions from where the
      // pointer left it: on out if closing, back into place otherwise.
      if (close) this._requestHide('swipe');
    }

    _endDrag() {
      if (!this._drag) return;
      if (this._panel.hasPointerCapture(this._drag.id)) this._panel.releasePointerCapture(this._drag.id);
      this._drag = null;
      this._panel.classList.remove('dragging');
      this._panel.style.removeProperty('transform');
    }

    /* ----------------------------- Events ------------------------------ */

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
      if (typeof KakaoComponents !== 'undefined') KakaoComponents.emit(this, name, detail);
    }
  }

  customElements.define(TAG_NAME, KakaoAsideSheet);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, {
      triggers: ['sheet-show', 'sheet-hide', 'sheet-hidden'],
    });
  }
})();
