/**
 * <kakao-popover></kakao-popover>
 * =====================================================================
 * A production-ready, theme-able popover/tooltip Web Component built
 * with vanilla JS and Shadow DOM. Anchors itself to any element on the
 * page via an `for` attribute (an element id, in the spirit of
 * <label for="...">) and opens on click or hover, positioned on any
 * of four sides with automatic flipping when it would overflow the
 * viewport.
 *
 * ---------------------------------------------------------------------
 * BASIC USAGE
 * ---------------------------------------------------------------------
 *   <button id="info-btn">Account info</button>
 *
 *   <kakao-popover for="info-btn" trigger="click" placement="bottom">
 *     <div slot="content">
 *       <strong>Plan:</strong> Pro<br>
 *       <strong>Renews:</strong> Aug 4
 *     </div>
 *   </kakao-popover>
 *
 * Popover content can also be supplied as data via the `list-data`
 * attribute (a JSON array of { label, value } rows rendered as a
 * simple definition list) for cases where markup isn't convenient:
 *
 *   <kakao-popover for="info-btn" list-data='[{"label":"Plan","value":"Pro"}]'>
 *   </kakao-popover>
 *
 * If both a `slot="content"` child and `list-data` are present, the
 * slotted content takes priority and `list-data` is ignored.
 *
 * ---------------------------------------------------------------------
 * ATTRIBUTES (all observed; all reflect to/from the public API)
 * ---------------------------------------------------------------------
 *   for          string   Id of the element this popover is anchored
 *                          to. Required for the popover to position
 *                          itself. Re-resolved automatically if the
 *                          target element is added to the DOM later.
 *
 *   trigger      string   "click" | "hover" | "manual"
 *                          Default: "click".
 *                          - click:  toggles open/closed on click of
 *                                    the anchor, closes on outside
 *                                    click or Escape.
 *                          - hover:  opens on mouseenter/focus of the
 *                                    anchor, closes on mouseleave/blur
 *                                    (with a small close-delay so the
 *                                    pointer can travel into the
 *                                    popover itself).
 *                          - manual: no automatic triggers; use the
 *                                    open()/close()/toggle() methods.
 *
 *   placement    string   "top" | "bottom" | "left" | "right"
 *                          Default: "bottom". Preferred side of the
 *                          anchor the popover appears on. Flips to
 *                          the opposite side automatically if there
 *                          is not enough viewport space, and nudges
 *                          along the cross-axis to stay on-screen.
 *
 *   open         boolean  Reflects current open state. Can be set
 *                          directly (open="" / removeAttribute) to
 *                          control the popover declaratively, e.g.
 *                          from another script or framework binding.
 *
 *   disabled     boolean  Blocks all interaction (the popover will
 *                          not open via any trigger) and sets
 *                          aria-disabled="true" on the host.
 *
 *   close-delay  number   Milliseconds to wait before closing on
 *                          "hover" trigger, so users can move the
 *                          pointer from the anchor into the popover.
 *                          Default: 150.
 *
 *   offset       number   Pixel gap between the anchor and the
 *                          popover. Default: 8.
 *
 *   list-data    string   JSON array of { label, value } objects
 *                          rendered as a simple list when no
 *                          slot="content" element is provided.
 *                          (Named `list-data`, not `data`, because
 *                          `data` is a reserved attribute name.)
 *
 * Attributes always take priority over the equivalent JS property /
 * method call; if you set both, the attribute wins on next render.
 * Methods remain available as a fallback for environments where
 * attribute mutation is inconvenient (e.g. imperative frameworks).
 *
 * ---------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES
 * ---------------------------------------------------------------------
 *  Set them on the element or any ancestor. Their defaults live in the
 *  settings block of this file: change them on construction.html (some
 *  follow the main variables in shared/tokens.css).
 *
 *   --kakao-popover-bg                Background color.   Default #fff
 *   --kakao-popover-text-color        Text color.          Default #111
 *   --kakao-popover-label-color       Label/meta color.    Default #666
 *   --kakao-popover-border-color      Border color.        Default #eee
 *   --kakao-popover-header-bg         Header bg (if used). Default #f7f7f7
 *   --kakao-popover-hover-bg          Row hover bg.        Default #f5f5f5
 *   --kakao-popover-active-bg         Row active/press bg. Default #ebebeb
 *   --kakao-popover-font-family       Font stack.
 *                          Default: system-ui, -apple-system,
 *                          BlinkMacSystemFont, sans-serif
 *   --kakao-popover-font-size         Content font size.   Default 14px
 *   --kakao-popover-label-font-size   Label font size.      Default 11px
 *   --kakao-popover-radius            Corner radius.        Default 4px
 *   --kakao-popover-spacing           Base spacing unit.    Default 8px
 *   --kakao-popover-max-width         Max width.            Default 280px
 *   --kakao-popover-z-index           Stacking context.     Default 1000
 *   --kakao-popover-transition-speed  Open/close fade.       Default 150ms
 *   --kakao-popover-focus-ring-color  Focus-visible outline. Default #111
 *
 * ---------------------------------------------------------------------
 * PUBLIC METHODS
 * ---------------------------------------------------------------------
 *   open()                  Opens the popover.
 *   close()                 Closes the popover.
 *   toggle()                Toggles open/closed.
 *   setData(rows)            Sets list content imperatively.
 *                            `rows` is an array of { label, value }.
 *                            Equivalent to setting `list-data`, but
 *                            accepts a real array/object instead of a
 *                            JSON string. Sets aria-busy briefly
 *                            while the list re-renders.
 *   reposition()             Forces a recalculation of position.
 *                            Called automatically on resize/scroll;
 *                            exposed for manual use after layout
 *                            changes you control (e.g. content
 *                            mutated via the default slot).
 *
 * Calls made before the element is connected to the DOM are queued
 * and flushed automatically once connectedCallback runs.
 *
 * ---------------------------------------------------------------------
 * EVENTS (all bubble, all composed — they cross the Shadow DOM
 * boundary so ordinary addEventListener on an ancestor works)
 * ---------------------------------------------------------------------
 *   kakao-popover-open     Fired after the popover opens.
 *                         detail: { name, trigger }
 *   kakao-popover-close    Fired after the popover closes.
 *                         detail: { name, trigger }
 *   kakao-popover-item-select
 *                         Fired when a list-data row is activated
 *                         (click or Enter/Space while focused).
 *                         detail: { name, index, label, value }
 *
 *   `name` in each detail is the popover's `for` attribute value (or
 *   the host's id, if set, as a fallback), so a single listener on
 *   document can disambiguate multiple popovers.
 *
 * ---------------------------------------------------------------------
 * ACCESSIBILITY
 * ---------------------------------------------------------------------
 *   - The popover surface has role="dialog" (click trigger) or
 *     role="tooltip" (hover trigger), matching the interaction
 *     pattern, with aria-hidden toggled alongside the open state.
 *   - The anchor element receives aria-describedby (hover/tooltip
 *     pattern) or aria-expanded + aria-haspopup="dialog" (click
 *     pattern) automatically — nothing to wire up by hand.
 *   - List rows use role="list"/"listbox" + role="option" with
 *     roving tabindex: only the active row has tabindex="0", everything
 *     else is -1, and ArrowUp/ArrowDown move focus and update
 *     aria-posinset/aria-setsize bookkeeping. Home/End jump to the
 *     first/last row.
 *   - Escape closes the popover and returns focus to the anchor.
 *   - aria-busy="true" is set on the content region while setData()
 *     is repopulating it asynchronously.
 *   - Icon-only close button carries aria-label="Close".
 *   - All interactive elements get a visible focus-visible outline;
 *     this is never suppressed.
 * <\/script-safe-note> escaping reminder: this file may be inlined
 * directly into an HTML page inside a <script> tag; any occurrence of
 * the sequence "</" followed by "script" in comments elsewhere in this
 * file is written as "<\/script" to avoid prematurely closing an
 * inlining <script> block.
 * =====================================================================
 */

(() => {
  'use strict';

  const TAG_NAME = 'kakao-popover';
  if (customElements.get(TAG_NAME)) return;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      /* ---- full reset, scoped to this shadow root only ---- */
      *,
      *::before,
      *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      :host {
        /* @kakao-settings:start prefix=--kakao-popover- (written by construction.html, edit there) */
        --_bg: var(--kakao-popover-bg, #fff);
        --_text-color: var(--kakao-popover-text-color, #111);
        --_label-color: var(--kakao-popover-label-color, #666);
        --_border-color: var(--kakao-popover-border-color, #eee);
        --_header-bg: var(--kakao-popover-header-bg, #f7f7f7);
        --_hover-bg: var(--kakao-popover-hover-bg, #f5f5f5);
        --_active-bg: var(--kakao-popover-active-bg, #ebebeb);
        --_font-family: var(--kakao-popover-font-family, var(--kakao-font-family, system-ui, -apple-system, BlinkMacSystemFont, sans-serif));
        --_font-size: var(--kakao-popover-font-size, 14px);
        --_label-font-size: var(--kakao-popover-label-font-size, 11px);
        --_radius: var(--kakao-popover-radius, 4px);
        --_spacing: var(--kakao-popover-spacing, 8px);
        --_max-width: var(--kakao-popover-max-width, 280px);
        --_z-index: var(--kakao-popover-z-index, 1000);
        --_transition-speed: var(--kakao-popover-transition-speed, 150ms);
        --_focus-ring-color: var(--kakao-popover-focus-ring-color, #111);
        --_min-width: var(--kakao-popover-min-width, 120px);
        --_shadow: var(--kakao-popover-shadow, none);
        /* @kakao-settings:end */

        display: contents;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      .surface {
        /* Position (left/top, written directly as px by JS on every
           scroll/resize/reposition tick) is NEVER transitioned — only
           opacity is. This keeps tracking instant during scroll while
           still allowing a fade-in on open. */
        position: fixed;
        top: 0;
        left: 0;
        z-index: var(--_z-index);
        background: var(--_bg);
        color: var(--_text-color);
        border: 1px solid var(--_border-color);
        border-radius: var(--_radius);
        font-family: var(--_font-family);
        font-size: var(--_font-size);
        font-weight: 400;
        line-height: 1.5;
        max-width: var(--_max-width);
        min-width: var(--_min-width);
        box-shadow: var(--_shadow);
        margin: 0;
        opacity: 0;
        visibility: hidden;
        transition: opacity var(--_transition-speed) ease;
        will-change: opacity;
      }

      .surface[data-state='open'] {
        opacity: 1;
        visibility: visible;
      }

      @media (prefers-reduced-motion: reduce) {
        .surface {
          transition: none;
        }
      }

      .surface::before,
      .surface::after {
        content: none;
      }

      /* ---- arrow ---- */
      .arrow {
        position: absolute;
        width: 8px;
        height: 8px;
        background: var(--_bg);
        border: 1px solid var(--_border-color);
        transform: rotate(45deg);
      }
      .surface[data-placement='top'] .arrow {
        bottom: -5px;
        left: calc(50% - 4px);
        border-top: none;
        border-left: none;
      }
      .surface[data-placement='bottom'] .arrow {
        top: -5px;
        left: calc(50% - 4px);
        border-bottom: none;
        border-right: none;
      }
      .surface[data-placement='left'] .arrow {
        right: -5px;
        top: calc(50% - 4px);
        border-bottom: none;
        border-left: none;
      }
      .surface[data-placement='right'] .arrow {
        left: -5px;
        top: calc(50% - 4px);
        border-top: none;
        border-right: none;
      }

      /* ---- header (shown only if a slot="header" is provided) ---- */
      .header {
        display: none;
        align-items: center;
        justify-content: space-between;
        gap: var(--_spacing);
        background: var(--_header-bg);
        border-bottom: 1px solid var(--_border-color);
        padding: var(--_spacing) calc(var(--_spacing) * 1.5);
        font-weight: 600;
        font-size: var(--_font-size);
        border-radius: var(--_radius) var(--_radius) 0 0;
      }
      .header.has-content {
        display: flex;
      }

      .close-btn {
        appearance: none;
        background: transparent;
        border: 1px solid transparent;
        border-radius: var(--_radius);
        color: var(--_label-color);
        cursor: pointer;
        font-family: inherit;
        font-size: 14px;
        line-height: 1;
        padding: 2px 6px;
      }
      .close-btn:hover {
        background: var(--_hover-bg);
      }
      .close-btn:active {
        background: var(--_active-bg);
      }
      .close-btn:focus-visible {
        outline: 2px solid var(--_focus-ring-color);
        outline-offset: 1px;
      }

      /* ---- body ---- */
      .body {
        padding: calc(var(--_spacing) * 1.5);
      }
      .body.no-pad {
        padding: 0;
      }

      ::slotted([slot='content']) {
        font-size: var(--_font-size);
        color: var(--_text-color);
      }

      /* ---- generated list-data rows ---- */
      .rows {
        list-style: none;
      }
      .row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: calc(var(--_spacing) * 1.5);
        padding: var(--_spacing) calc(var(--_spacing) * 1.5);
        border-bottom: 1px solid var(--_border-color);
        cursor: pointer;
        outline-offset: -2px;
      }
      .rows .row:last-child {
        border-bottom: none;
      }
      .row:hover {
        background: var(--_hover-bg);
      }
      .row:active {
        background: var(--_active-bg);
      }
      .row:focus-visible {
        outline: 2px solid var(--_focus-ring-color);
      }
      .row .label {
        font-size: var(--_label-font-size);
        font-weight: 600;
        color: var(--_label-color);
        text-transform: uppercase;
        letter-spacing: 0.02em;
        white-space: nowrap;
      }
      .row .value {
        font-size: var(--_font-size);
        font-weight: 400;
        color: var(--_text-color);
        text-align: right;
        word-break: break-word;
      }

      .empty {
        padding: calc(var(--_spacing) * 1.5);
        color: var(--_label-color);
        font-size: var(--_font-size);
        text-align: center;
      }
    </style>

    <div class="surface" part="surface" role="dialog" aria-hidden="true" data-state="closed">
      <div class="arrow" part="arrow"></div>
      <div class="header" part="header">
        <slot name="header"></slot>
        <button type="button" class="close-btn" part="close-button" aria-label="Close">&#10005;</button>
      </div>
      <div class="body" part="body">
        <slot name="content"></slot>
        <div class="generated" hidden></div>
      </div>
    </div>
  `;

  /** @type {ReadonlyArray<'click'|'hover'|'manual'>} */
  const TRIGGER_MODES = Object.freeze(['click', 'hover', 'manual']);
  /** @type {ReadonlyArray<'top'|'bottom'|'left'|'right'>} */
  const PLACEMENTS = Object.freeze(['top', 'bottom', 'left', 'right']);
  const VIEWPORT_PADDING = 8;

  class KakaoPopover extends HTMLElement {
    static get observedAttributes() {
      return ['for', 'trigger', 'placement', 'open', 'disabled', 'close-delay', 'offset', 'list-data'];
    }

    constructor() {
      super();

      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));

      /** @type {Array<() => void>} Queued calls made before connectedCallback. */
      this._pending = [];
      this._connected = false;

      this._anchorEl = null;
      this._anchorObserver = null; // MutationObserver watching for the anchor appearing later
      this._resizeObserver = null;
      this._closeTimer = null;
      this._activeRowIndex = -1;
      this._rowCount = 0;
      this._outsideHandlerBound = this._handleOutsideInteraction.bind(this);
      this._keydownBound = this._handleKeydown.bind(this);
      this._anchorClickBound = this._handleAnchorClick.bind(this);
      this._anchorEnterBound = this._handleAnchorEnter.bind(this);
      this._anchorLeaveBound = this._handleAnchorLeave.bind(this);
      this._anchorFocusBound = this._handleAnchorEnter.bind(this);
      this._anchorBlurBound = this._handleAnchorLeave.bind(this);
      this._surfaceEnterBound = () => this._cancelCloseTimer();
      this._surfaceLeaveBound = () => this._scheduleHoverClose();
      this._scrollOrResizeBound = () => this.reposition();

      this._surfaceEl = shadow.querySelector('.surface');
      this._headerEl = shadow.querySelector('.header');
      this._bodyEl = shadow.querySelector('.body');
      this._generatedEl = shadow.querySelector('.generated');
      this._closeBtn = shadow.querySelector('.close-btn');
      this._headerSlot = shadow.querySelector('slot[name="header"]');

      this._closeBtn.addEventListener('click', () => this.close());
      this._headerSlot.addEventListener('slotchange', () => this._syncHeaderVisibility());
      this._surfaceEl.addEventListener('mouseenter', this._surfaceEnterBound);
      this._surfaceEl.addEventListener('mouseleave', this._surfaceLeaveBound);
      this._surfaceEl.addEventListener('keydown', this._keydownBound);
    }

    // ----- lifecycle ---------------------------------------------------

    connectedCallback() {
      this._connected = true;

      if (!this.hasAttribute('trigger')) this.setAttribute('trigger', 'click');
      if (!this.hasAttribute('placement')) this.setAttribute('placement', 'bottom');
      if (!this.hasAttribute('close-delay')) this.setAttribute('close-delay', '150');
      if (!this.hasAttribute('offset')) this.setAttribute('offset', '8');

      this._resolveAnchor();
      this._syncDisabled();
      this._syncHeaderVisibility();
      this._renderListData();

      this._resizeObserver = new ResizeObserver(() => {
        if (this._isOpen()) this.reposition();
      });
      this._resizeObserver.observe(this._surfaceEl);
      if (this._anchorEl) this._resizeObserver.observe(this._anchorEl);

      window.addEventListener('scroll', this._scrollOrResizeBound, { passive: true, capture: true });
      window.addEventListener('resize', this._scrollOrResizeBound, { passive: true });

      if (this.hasAttribute('open')) this._open({ silent: true });

      // Flush anything queued via the public API before we were connected.
      const queued = this._pending;
      this._pending = [];
      queued.forEach((fn) => fn());
    }

    disconnectedCallback() {
      this._connected = false;

      this._detachAnchorListeners();
      if (this._anchorObserver) {
        this._anchorObserver.disconnect();
        this._anchorObserver = null;
      }
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }
      window.removeEventListener('scroll', this._scrollOrResizeBound, { capture: true });
      window.removeEventListener('resize', this._scrollOrResizeBound);
      document.removeEventListener('pointerdown', this._outsideHandlerBound, true);
      document.removeEventListener('keydown', this._keydownBound, true);
      this._cancelCloseTimer();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;

      // If we're not connected yet, queue the side effect so it runs once
      // we are, in the same order attributes arrived.
      if (!this._connected) {
        this._pending.push(() => this._applyAttributeChange(name, newValue));
        return;
      }
      this._applyAttributeChange(name, newValue);
    }

    _applyAttributeChange(name, newValue) {
      switch (name) {
        case 'for':
          this._resolveAnchor();
          break;
        case 'trigger':
          this._attachAnchorListeners();
          break;
        case 'disabled':
          this._syncDisabled();
          break;
        case 'open':
          if (this.hasAttribute('open')) this._open({ silent: false });
          else this._close({ silent: false });
          break;
        case 'list-data':
          this._renderListData();
          break;
        case 'placement':
        case 'offset':
          if (this._isOpen()) this.reposition();
          break;
        default:
          break;
      }
    }

    // ----- anchor resolution -------------------------------------------

    _resolveAnchor() {
      this._detachAnchorListeners();
      const id = this.getAttribute('for');
      const el = id ? document.getElementById(id) : null;

      if (this._anchorObserver) {
        this._anchorObserver.disconnect();
        this._anchorObserver = null;
      }

      if (el) {
        this._anchorEl = el;
        this._attachAnchorListeners();
        if (this._resizeObserver) this._resizeObserver.observe(el);
      } else {
        this._anchorEl = null;
        // Watch the document for the anchor showing up later (e.g. it's
        // rendered asynchronously by a framework after this element).
        if (id) {
          this._anchorObserver = new MutationObserver(() => {
            const found = document.getElementById(id);
            if (found) {
              this._anchorObserver.disconnect();
              this._anchorObserver = null;
              this._resolveAnchor();
            }
          });
          this._anchorObserver.observe(document.body, { childList: true, subtree: true });
        }
      }
    }

    _attachAnchorListeners() {
      this._detachAnchorListeners();
      if (!this._anchorEl) return;

      const mode = this._triggerMode();
      if (mode === 'click') {
        this._anchorEl.addEventListener('click', this._anchorClickBound);
        this._anchorEl.setAttribute('aria-haspopup', 'dialog');
        this._anchorEl.setAttribute('aria-expanded', this._isOpen() ? 'true' : 'false');
        this._surfaceEl.setAttribute('role', 'dialog');
      } else if (mode === 'hover') {
        this._anchorEl.addEventListener('mouseenter', this._anchorEnterBound);
        this._anchorEl.addEventListener('mouseleave', this._anchorLeaveBound);
        this._anchorEl.addEventListener('focus', this._anchorFocusBound);
        this._anchorEl.addEventListener('blur', this._anchorBlurBound);
        this._anchorEl.setAttribute('aria-describedby', this._surfaceId());
        this._surfaceEl.setAttribute('role', 'tooltip');
      }
      // 'manual' mode: no listeners attached.
    }

    _detachAnchorListeners() {
      if (!this._anchorEl) return;
      this._anchorEl.removeEventListener('click', this._anchorClickBound);
      this._anchorEl.removeEventListener('mouseenter', this._anchorEnterBound);
      this._anchorEl.removeEventListener('mouseleave', this._anchorLeaveBound);
      this._anchorEl.removeEventListener('focus', this._anchorFocusBound);
      this._anchorEl.removeEventListener('blur', this._anchorBlurBound);
      this._anchorEl.removeAttribute('aria-haspopup');
      this._anchorEl.removeAttribute('aria-expanded');
      this._anchorEl.removeAttribute('aria-describedby');
    }

    _surfaceId() {
      if (!this._surfaceEl.id) {
        this._surfaceEl.id = `kakao-popover-surface-${Math.random().toString(36).slice(2, 9)}`;
      }
      return this._surfaceEl.id;
    }

    // ----- trigger handlers ---------------------------------------------

    _handleAnchorClick(event) {
      if (this._isDisabled()) return;
      event.stopPropagation();
      this.toggle();
    }

    _handleAnchorEnter() {
      if (this._isDisabled()) return;
      this._cancelCloseTimer();
      this.open();
    }

    _handleAnchorLeave() {
      this._scheduleHoverClose();
    }

    _scheduleHoverClose() {
      if (this._triggerMode() !== 'hover') return;
      this._cancelCloseTimer();
      const delay = Number(this.getAttribute('close-delay')) || 0;
      this._closeTimer = setTimeout(() => this.close(), delay);
    }

    _cancelCloseTimer() {
      if (this._closeTimer) {
        clearTimeout(this._closeTimer);
        this._closeTimer = null;
      }
    }

    _handleOutsideInteraction(event) {
      const path = event.composedPath();
      if (path.includes(this) || (this._anchorEl && path.includes(this._anchorEl))) return;
      this.close();
    }

    _handleKeydown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        this.close();
        if (this._anchorEl) this._anchorEl.focus();
        return;
      }

      const rows = this._getRowElements();
      if (!rows.length) return;

      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        this._moveActiveRow(rows, 1);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        this._moveActiveRow(rows, -1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        this._setActiveRow(rows, 0);
      } else if (event.key === 'End') {
        event.preventDefault();
        this._setActiveRow(rows, rows.length - 1);
      } else if (event.key === 'Enter' || event.key === ' ') {
        const focused = rows.find((r) => r === this.shadowRoot.activeElement);
        if (focused) {
          event.preventDefault();
          focused.click();
        }
      }
    }

    // ----- roving tabindex -----------------------------------------------

    _getRowElements() {
      return Array.from(this._generatedEl.querySelectorAll('.row'));
    }

    _moveActiveRow(rows, delta) {
      const next = (this._activeRowIndex + delta + rows.length) % rows.length;
      this._setActiveRow(rows, next);
    }

    _setActiveRow(rows, index) {
      rows.forEach((row, i) => {
        row.tabIndex = i === index ? 0 : -1;
      });
      this._activeRowIndex = index;
      rows[index].focus();
    }

    // ----- positioning -----------------------------------------------------

    reposition() {
      if (!this._anchorEl || !this._isOpen()) return;

      const anchorRect = this._anchorEl.getBoundingClientRect();
      const surfaceRect = this._surfaceEl.getBoundingClientRect();
      const offset = Number(this.getAttribute('offset')) || 8;
      let placement = this.getAttribute('placement') || 'bottom';
      if (!PLACEMENTS.includes(placement)) placement = 'bottom';

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const fits = {
        top: anchorRect.top - surfaceRect.height - offset >= VIEWPORT_PADDING,
        bottom: anchorRect.bottom + surfaceRect.height + offset <= vh - VIEWPORT_PADDING,
        left: anchorRect.left - surfaceRect.width - offset >= VIEWPORT_PADDING,
        right: anchorRect.right + surfaceRect.width + offset <= vw - VIEWPORT_PADDING,
      };

      if (!fits[placement]) {
        const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
        if (fits[opposite[placement]]) placement = opposite[placement];
      }

      let top = 0;
      let left = 0;

      if (placement === 'top' || placement === 'bottom') {
        left = anchorRect.left + anchorRect.width / 2 - surfaceRect.width / 2;
        top = placement === 'top' ? anchorRect.top - surfaceRect.height - offset : anchorRect.bottom + offset;
      } else {
        top = anchorRect.top + anchorRect.height / 2 - surfaceRect.height / 2;
        left = placement === 'left' ? anchorRect.left - surfaceRect.width - offset : anchorRect.right + offset;
      }

      // Clamp to viewport on the cross-axis so the popover never goes off-screen.
      left = Math.min(Math.max(left, VIEWPORT_PADDING), vw - surfaceRect.width - VIEWPORT_PADDING);
      top = Math.min(Math.max(top, VIEWPORT_PADDING), vh - surfaceRect.height - VIEWPORT_PADDING);

      // Plain left/top, not transform — this property is never subject to
      // the CSS transition (only opacity is), so position tracking during
      // scroll/resize is instant with zero lag, and the very first
      // position write (in _open, before opacity flips) is correct before
      // anything becomes visible, eliminating any fly-in.
      this._surfaceEl.style.left = `${left}px`;
      this._surfaceEl.style.top = `${top}px`;
      this._surfaceEl.dataset.placement = placement;
    }

    // ----- open / close state machine -------------------------------------

    _isOpen() {
      return this._surfaceEl.dataset.state === 'open' || this._surfaceEl.dataset.state === 'measuring';
    }

    _isDisabled() {
      return this.hasAttribute('disabled');
    }

    _syncDisabled() {
      const disabled = this._isDisabled();
      this.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      if (disabled && this._isOpen()) this._close({ silent: true });
    }

    _triggerMode() {
      const mode = this.getAttribute('trigger');
      return TRIGGER_MODES.includes(mode) ? mode : 'click';
    }

    _open({ silent }) {
      if (this._isDisabled()) return;
      if (this._isOpen()) return;

      // Make the surface measurable (but still invisible — opacity is
      // still 0 from the base .surface rule) so getBoundingClientRect in
      // reposition() returns real dimensions, then position it correctly
      // BEFORE flipping to data-state="open". Only the opacity transition
      // is animated, and position is plain left/top (never transitioned),
      // so by the time it fades in it is already sitting in its final
      // spot — no fly-in from (0,0) or from a stale position.
      this._surfaceEl.dataset.state = 'measuring';
      this._surfaceEl.style.visibility = 'hidden';
      this.reposition();

      this._surfaceEl.dataset.state = 'open';
      this._surfaceEl.style.visibility = '';
      this._surfaceEl.setAttribute('aria-hidden', 'false');

      if (!this.hasAttribute('open')) this.setAttribute('open', '');
      if (this._anchorEl && this._triggerMode() === 'click') {
        this._anchorEl.setAttribute('aria-expanded', 'true');
      }

      if (this._triggerMode() === 'click') {
        document.addEventListener('pointerdown', this._outsideHandlerBound, true);
      }
      document.addEventListener('keydown', this._keydownBound, true);

      const rows = this._getRowElements();
      if (rows.length) this._setActiveRow(rows, 0);

      if (!silent) {
        this.dispatchEvent(
          new CustomEvent('kakao-popover-open', {
            bubbles: true,
            composed: true,
            detail: { name: this._eventName(), trigger: this._triggerMode() },
          })
        );
      }
    }

    _close({ silent }) {
      if (!this._isOpen()) return;

      this._surfaceEl.dataset.state = 'closed';
      this._surfaceEl.setAttribute('aria-hidden', 'true');

      if (this.hasAttribute('open')) this.removeAttribute('open');
      if (this._anchorEl && this._triggerMode() === 'click') {
        this._anchorEl.setAttribute('aria-expanded', 'false');
      }

      document.removeEventListener('pointerdown', this._outsideHandlerBound, true);
      document.removeEventListener('keydown', this._keydownBound, true);
      this._activeRowIndex = -1;

      if (!silent) {
        this.dispatchEvent(
          new CustomEvent('kakao-popover-close', {
            bubbles: true,
            composed: true,
            detail: { name: this._eventName(), trigger: this._triggerMode() },
          })
        );
      }
    }

    _eventName() {
      return this.getAttribute('for') || this.id || null;
    }

    _syncHeaderVisibility() {
      const assigned = this._headerSlot.assignedNodes({ flatten: true });
      const hasContent = assigned.some((n) => n.nodeType !== Node.TEXT_NODE || n.textContent.trim().length > 0);
      this._headerEl.classList.toggle('has-content', hasContent);
    }

    // ----- list-data rendering -------------------------------------------

    _renderListData() {
      const raw = this.getAttribute('list-data');
      if (!raw) {
        this._generatedEl.hidden = true;
        this._generatedEl.innerHTML = '';
        return;
      }

      let rows;
      try {
        rows = JSON.parse(raw);
      } catch (err) {
        console.error(`<${TAG_NAME}> list-data is not valid JSON:`, err);
        return;
      }
      this._renderRows(Array.isArray(rows) ? rows : []);
    }

    _renderRows(rows) {
      this._generatedEl.setAttribute('aria-busy', 'true');

      const hasSlottedContent = this._bodyEl.querySelector('slot[name="content"]').assignedNodes().length > 0;
      if (hasSlottedContent) {
        this._generatedEl.hidden = true;
        this._generatedEl.removeAttribute('aria-busy');
        return;
      }

      this._generatedEl.hidden = false;
      this._generatedEl.innerHTML = '';

      if (!rows.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No data';
        this._generatedEl.appendChild(empty);
        this._generatedEl.removeAttribute('aria-busy');
        this._rowCount = 0;
        return;
      }

      const list = document.createElement('ul');
      list.className = 'rows';
      list.setAttribute('role', 'listbox');

      rows.forEach((row, index) => {
        const li = document.createElement('li');
        li.className = 'row';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-posinset', String(index + 1));
        li.setAttribute('aria-setsize', String(rows.length));
        li.tabIndex = index === 0 ? 0 : -1;

        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = row.label != null ? String(row.label) : '';

        const value = document.createElement('span');
        value.className = 'value';
        value.textContent = row.value != null ? String(row.value) : '';

        li.appendChild(label);
        li.appendChild(value);

        const activate = () => {
          this.dispatchEvent(
            new CustomEvent('kakao-popover-item-select', {
              bubbles: true,
              composed: true,
              detail: { name: this._eventName(), index, label: row.label, value: row.value },
            })
          );
        };
        li.addEventListener('click', activate);

        list.appendChild(li);
      });

      this._generatedEl.appendChild(list);
      this._rowCount = rows.length;
      this._generatedEl.removeAttribute('aria-busy');
    }

    // ----- public API -------------------------------------------------------

    /** Opens the popover. Queued if called before the element is connected. */
    open() {
      if (!this._connected) {
        this._pending.push(() => this.open());
        return;
      }
      this._open({ silent: false });
    }

    /** Closes the popover. Queued if called before the element is connected. */
    close() {
      if (!this._connected) {
        this._pending.push(() => this.close());
        return;
      }
      this._close({ silent: false });
    }

    /** Toggles open/closed. Queued if called before the element is connected. */
    toggle() {
      if (!this._connected) {
        this._pending.push(() => this.toggle());
        return;
      }
      if (this._isOpen()) this._close({ silent: false });
      else this._open({ silent: false });
    }

    /**
     * Sets list content imperatively, equivalent to the `list-data`
     * attribute but accepting a real array instead of a JSON string.
     * @param {Array<{label: string, value: string}>} rows
     */
    setData(rows) {
      if (!this._connected) {
        this._pending.push(() => this.setData(rows));
        return;
      }
      this._renderRows(Array.isArray(rows) ? rows : []);
    }

  }

  customElements.define(TAG_NAME, KakaoPopover);
})();

