/**
 * <kakao-tooltip>
 * ============================================================================
 * A small themed label next to a control: the name of an icon-only button, or
 * a short hint. Unlike the native `title` it also shows for keyboard focus and
 * for touch (long-press), and it takes the theme's colours. Vanilla JS,
 * Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     tooltip.js
 *  css        none
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="tooltip.js" defer><\/script>
 *
 *   Any element, by attribute (one shared label, created by the script):
 *     <a href="/export" data-tooltip="Download as CSV">Export</a>
 *
 *   A dedicated element for one anchor (its text is the label):
 *     <button id="save" aria-label="Save">…</button>
 *     <kakao-tooltip for="save" hidden>Save draft (not published)</kakao-tooltip>
 *     (`hidden` only keeps the text out of sight before the script runs;
 *     the component removes it.)
 *
 *   Icon-only kakao-buttons get it by themselves: with this script loaded, the
 *   button puts its name in data-tooltip instead of title (see button.js).
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  On any element:
 *   data-tooltip            The label (plain text). data-tooltip="" turns the
 *                           tooltip off for that element.
 *   data-tooltip-placement  top (default) | bottom | left | right.
 *  On <kakao-tooltip>:
 *   for        Id of the anchor (in the same document or shadow root). It may
 *              be added later. A dedicated tooltip wins over data-tooltip.
 *   placement  top (default) | bottom | left | right.
 *   inline     Boolean. Draws the label in the text flow, always visible and
 *              tied to nothing (previews, documentation).
 *  Set by the component: role="tooltip" and an id on <kakao-tooltip>;
 *  data-kakao-tooltip-anchor on a dedicated tooltip's anchor; while a label
 *  shows, the anchor's own title is kept in data-kakao-tooltip-title.
 *
 * ----------------------------------------------------------------------------
 * SLOTS · kakao-tooltip
 * ----------------------------------------------------------------------------
 *  (default)   The label (plain text is best; it is read as the description).
 *
 * ----------------------------------------------------------------------------
 * BEHAVIOUR
 * ----------------------------------------------------------------------------
 *  Mouse / pen  Shows after KakaoTooltip.delays.hover (400ms) on the anchor, at
 *               once when another label was showing a moment before. Stays
 *               while the pointer is on the anchor or on the label, hides when
 *               it has left both. Pressing the anchor hides it until the
 *               pointer leaves.
 *  Keyboard     Shows on :focus-visible, hides on blur.
 *  Escape       Hides a visible label and is consumed (a surrounding dialog
 *               stays open; the next Escape reaches it).
 *  Touch        A long-press (delays.longPress, 500ms; cancelled by moving
 *               more than 10px, scrolling or lifting the finger) shows it. The
 *               click after the release is swallowed (capture phase on window)
 *               so the control does not act; the context menu is prevented,
 *               and the iOS callout and text selection are switched off on
 *               anchors. Hides on the next touch or click, on scroll and after
 *               delays.touchHide (3000ms).
 *  One label at a time. Placement flips to the other side when there is no
 *  room and shifts to stay 8px inside the viewport. The label sits in the top
 *  layer (popover API), so it is above modal dialogs too.
 *  The anchor's own title is put aside while its label shows, so the browser
 *  does not draw its native tooltip as well.
 *
 * ACCESSIBILITY: the label is never the accessible name: aria-label stays the
 * name. aria-describedby points at the label only when its text differs from
 * the anchor's name (aria-label, else its text) and both are in the same root.
 *
 * ----------------------------------------------------------------------------
 * API
 * ----------------------------------------------------------------------------
 *  element.show() / element.hide()           a dedicated tooltip
 *  KakaoTooltip.show(anchor, text, placement?) / KakaoTooltip.hide()
 *  KakaoTooltip.delays = { hover, longPress, touchHide }   (milliseconds)
 *
 * EVENTS (on the anchor; bubble, composed)
 *  tooltip-show  { text, reason }   reason: hover | focus | touch | api
 *  tooltip-hide  { text, reason }
 *  Trigger "tooltip-ready" through KakaoComponents (shared/component-api.js)
 *  when the element is defined, registered for discovery: kakao-button
 *  reacts to it.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-tooltip-bg / -text / -border
 *  --kakao-tooltip-font-size / -font-weight / -padding-x / -padding-y
 *  --kakao-tooltip-radius / -shadow / -max-width / -offset / -z-index
 *  --kakao-tooltip-anim-duration / -anim-easing
 *
 * Parts: bubble.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-tooltip';
  if (customElements.get(TAG_NAME)) return;

  const delays = { hover: 400, longPress: 500, touchHide: 3000 };
  const PLACEMENTS = ['top', 'bottom', 'left', 'right'];
  const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  const MOVE_TOLERANCE = 10; // px a finger may move during a long-press
  const MARGIN = 8; // px kept from the viewport edge
  const HIDE_GRACE = 120; // ms to move from the anchor onto the label
  const WARM = 300; // ms after a hide in which the next label shows at once
  const SWALLOW = 800; // ms after the release in which the click is swallowed
  const ANCHOR_ATTR = 'data-kakao-tooltip-anchor';
  const TITLE_ATTR = 'data-kakao-tooltip-title';
  let seq = 0;

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clean = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-tooltip- (written by construction.html, edit there) */
        --_bg: var(--kakao-tooltip-bg, var(--kakao-color-ink, #18181b));
        --_text: var(--kakao-tooltip-text, var(--kakao-color-on-ink, #fafafa));
        --_border: var(--kakao-tooltip-border, var(--kakao-color-ink, #18181b));
        --_font-size: var(--kakao-tooltip-font-size, 0.8125rem);
        --_font-weight: var(--kakao-tooltip-font-weight, 500);
        --_padding-x: var(--kakao-tooltip-padding-x, 0.5rem);
        --_padding-y: var(--kakao-tooltip-padding-y, 0.25rem);
        --_radius: var(--kakao-tooltip-radius, var(--kakao-radius-sm, 6px));
        --_shadow: var(--kakao-tooltip-shadow, 0 8px 24px rgb(0 0 0 / .08), 0 0 0 1px color-mix(in srgb, var(--kakao-color-text, #18181b) 10%, transparent));
        --_max-width: var(--kakao-tooltip-max-width, 16rem);
        --_offset: var(--kakao-tooltip-offset, 6px);
        --_z-index: var(--kakao-tooltip-z-index, 2147483000);
        --_anim-duration: var(--kakao-tooltip-anim-duration, 150ms);
        --_anim-easing: var(--kakao-tooltip-anim-easing, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        display: contents;
      }
      .bubble {
        position: fixed;
        inset: auto;
        top: 0;
        left: 0;
        z-index: var(--_z-index);
        display: none;
        box-sizing: border-box;
        width: max-content;
        height: auto;
        max-width: min(var(--_max-width), calc(100vw - 16px));
        margin: 0;
        padding: var(--_padding-y) var(--_padding-x);
        overflow: visible;
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        box-shadow: var(--_shadow);
        background: var(--_bg);
        color: var(--_text);
        font-family: var(--kakao-font-family, system-ui, -apple-system, sans-serif);
        font-size: var(--_font-size);
        font-weight: var(--_font-weight);
        line-height: 1.35;
        text-align: start;
        white-space: normal;
        overflow-wrap: anywhere;
        pointer-events: auto;
        -webkit-user-select: none;
        user-select: none;
      }
      .bubble[data-open] { display: block; }
      :host([inline]) { display: inline-block; vertical-align: middle; }
      :host([inline]) .bubble { position: static; display: block; max-width: var(--_max-width); }
      @media (forced-colors: active) {
        .bubble { border-color: CanvasText; background: Canvas; color: CanvasText; box-shadow: none; }
      }
    </style>
    <div class="bubble" part="bubble"><slot></slot></div>
  `;

  /* -------------------------------------------------------------------------
   * Controller: one set of document listeners for every anchor.
   * ---------------------------------------------------------------------- */
  const dedicated = new Set(); // connected <kakao-tooltip for> elements
  let shared = null; // the label for data-tooltip anchors
  const cur = { anchor: null, tip: null, text: '', reason: null, describedBy: false, title: undefined };
  let showTimer = 0;
  let hideTimer = 0;
  let touchHideTimer = 0;
  let pendingAnchor = null; // hover show scheduled for it
  let suppressed = null; // anchor dismissed by press / Escape, until left
  let lastHiddenAt = 0;
  let press = null; // { id, target, x, y, timer, fired }
  let swallow = null; // { anchor, until }

  function sharedTip() {
    if (!shared || !shared.isConnected) {
      shared = document.createElement(TAG_NAME);
      shared.setAttribute('data-kakao-tooltip-shared', '');
      document.body.appendChild(shared);
    }
    return shared;
  }

  /**
   * The tooltip target in an event path: a dedicated tooltip's anchor wins,
   * then the nearest element with data-tooltip (an empty one turns it off).
   * @returns {{anchor: Element, tip: Element|null, text: string, placement: string}|null}
   */
  function resolve(path) {
    if (dedicated.size) {
      const map = new Map();
      dedicated.forEach((t) => { const a = t._link(); if (a) map.set(a, t); });
      for (const node of path) {
        const t = node instanceof Element ? map.get(node) : null;
        if (t) {
          const text = clean(t.textContent);
          return text ? { anchor: node, tip: t, text, placement: t.getAttribute('placement') } : null;
        }
      }
    }
    for (const node of path) {
      if (!(node instanceof Element)) continue;
      if (node.localName === TAG_NAME) return null;
      if (node.hasAttribute('data-tooltip')) {
        const text = clean(node.getAttribute('data-tooltip'));
        return text ? { anchor: node, tip: null, text, placement: node.getAttribute('data-tooltip-placement') } : null;
      }
    }
    return null;
  }

  function accessibleName(el) {
    return clean(el.getAttribute('aria-label') || el.textContent);
  }

  function addDescribedBy(anchor, id) {
    const ids = (anchor.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (ids.includes(id)) return false;
    ids.push(id);
    anchor.setAttribute('aria-describedby', ids.join(' '));
    return true;
  }

  function removeDescribedBy(anchor, id) {
    const ids = (anchor.getAttribute('aria-describedby') || '').split(/\s+/).filter((x) => x && x !== id);
    if (ids.length) anchor.setAttribute('aria-describedby', ids.join(' '));
    else anchor.removeAttribute('aria-describedby');
  }

  function emitDom(anchor, type, detail) {
    anchor.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
  }

  function clearTimers() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    clearTimeout(touchHideTimer);
    pendingAnchor = null;
  }

  function show(target, reason) {
    clearTimers();
    if (cur.anchor === target.anchor && cur.text === target.text) {
      if (reason === 'touch') touchHideTimer = setTimeout(hide, delays.touchHide);
      cur.reason = reason;
      return;
    }
    if (cur.anchor) hide();
    const anchor = target.anchor;
    const tip = target.tip || sharedTip();
    if (!target.tip) tip.textContent = target.text;

    // No native tooltip as well: the anchor's own title goes aside, and an
    // empty title stops the browser from using an ancestor's.
    cur.title = anchor.hasAttribute('title') ? anchor.getAttribute('title') : null;
    const parent = anchor.parentElement;
    if (cur.title !== null || (parent && parent.closest('[title]:not([title=""])'))) {
      if (cur.title !== null) anchor.setAttribute(TITLE_ATTR, cur.title);
      anchor.setAttribute('title', '');
    } else {
      cur.title = undefined; // nothing to restore
    }

    // The shared label describes the anchor only while it shows, and only
    // when it adds something to the name.
    cur.describedBy = !target.tip && tip.getRootNode() === anchor.getRootNode()
      && target.text !== accessibleName(anchor) && addDescribedBy(anchor, tip.id);

    cur.anchor = anchor;
    cur.tip = tip;
    cur.text = target.text;
    cur.reason = reason;
    const placement = PLACEMENTS.includes(target.placement) ? target.placement : 'top';
    tip._open(anchor, placement);
    if (reason === 'touch') touchHideTimer = setTimeout(hide, delays.touchHide);
    emitDom(anchor, 'tooltip-show', { text: target.text, reason });
  }

  function hide() {
    clearTimeout(hideTimer); // a show scheduled for another anchor stays
    clearTimeout(touchHideTimer);
    if (!cur.anchor) return;
    const { anchor, tip, text, reason } = cur;
    tip._close();
    if (cur.title !== undefined) {
      if (cur.title === null) anchor.removeAttribute('title');
      else anchor.setAttribute('title', cur.title);
      anchor.removeAttribute(TITLE_ATTR);
    }
    if (cur.describedBy) removeDescribedBy(anchor, tip.id);
    cur.anchor = null;
    cur.tip = null;
    cur.text = '';
    cur.reason = null;
    cur.describedBy = false;
    cur.title = undefined;
    lastHiddenAt = Date.now();
    emitDom(anchor, 'tooltip-hide', { text, reason });
  }

  function cancelPress() {
    if (press) clearTimeout(press.timer);
    press = null;
  }

  function firePress() {
    if (!press || press.fired) return;
    clearTimeout(press.timer);
    press.fired = true;
    swallow = { anchor: press.target.anchor, until: Infinity };
    show(press.target, 'touch');
  }

  // ---- mouse / pen ----
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;
    const path = e.composedPath();
    if (cur.tip && path.includes(cur.tip)) {
      clearTimeout(hideTimer);
      return;
    }
    const target = resolve(path);
    const anchor = target && target.anchor;
    if (suppressed && suppressed !== anchor) suppressed = null;
    if (anchor && anchor === cur.anchor) {
      clearTimeout(hideTimer);
      return;
    }
    if (anchor && anchor === pendingAnchor) return;
    clearTimeout(showTimer);
    pendingAnchor = null;
    const warm = (cur.anchor && cur.reason === 'hover') || Date.now() - lastHiddenAt < WARM;
    // Off every anchor: hide after a grace period (time to reach the label).
    // Onto another anchor: its show replaces the label.
    if (cur.anchor && cur.reason !== 'focus' && !anchor) {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, HIDE_GRACE);
    }
    if (anchor && anchor !== suppressed) {
      pendingAnchor = anchor;
      showTimer = setTimeout(() => {
        pendingAnchor = null;
        show(target, 'hover');
      }, warm ? 0 : delays.hover);
    }
  }, true);

  document.addEventListener('pointerout', (e) => {
    if (e.pointerType === 'touch' || e.relatedTarget) return;
    // The pointer left the window.
    clearTimeout(showTimer);
    pendingAnchor = null;
    suppressed = null;
    if (cur.reason === 'hover') hide();
  }, true);

  // ---- press: any press hides; a touch press may become a long-press ----
  document.addEventListener('pointerdown', (e) => {
    const path = e.composedPath();
    clearTimeout(showTimer);
    pendingAnchor = null;
    if (cur.anchor && !path.includes(cur.tip)) {
      if (path.includes(cur.anchor)) suppressed = cur.anchor;
      hide();
    }
    cancelPress();
    if (e.pointerType !== 'touch' || !e.isPrimary) return;
    const target = resolve(path);
    if (!target) return;
    press = { id: e.pointerId, target, x: e.clientX, y: e.clientY, fired: false, timer: 0 };
    press.timer = setTimeout(firePress, delays.longPress);
  }, true);

  document.addEventListener('pointermove', (e) => {
    if (!press || press.fired || e.pointerId !== press.id) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > MOVE_TOLERANCE) cancelPress();
  }, true);

  const release = (e) => {
    if (!press || e.pointerId !== press.id) return;
    if (press.fired && swallow) swallow.until = Date.now() + SWALLOW;
    cancelPress();
  };
  document.addEventListener('pointerup', release, true);
  document.addEventListener('pointercancel', release, true);

  // Before any page or component handler sees it (window, capture phase).
  window.addEventListener('click', (e) => {
    if (!swallow) return;
    const { anchor, until } = swallow;
    if (Date.now() > until) {
      swallow = null;
      return;
    }
    if (e.composedPath().includes(anchor)) {
      swallow = null;
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  document.addEventListener('contextmenu', (e) => {
    if (press) {
      e.preventDefault();
      firePress(); // the browser's own long-press came first: show now
    } else if (swallow && Date.now() <= swallow.until) {
      e.preventDefault();
    }
  }, true);

  // ---- keyboard ----
  document.addEventListener('focusin', (e) => {
    const path = e.composedPath();
    const target = resolve(path);
    const el = path[0];
    let visible = false;
    try { visible = el instanceof Element && el.matches(':focus-visible'); } catch (_) { /* old engine */ }
    if (target && visible && target.anchor !== suppressed) show(target, 'focus');
    else if (cur.reason === 'focus' && (!target || target.anchor !== cur.anchor)) hide();
  }, true);

  document.addEventListener('focusout', (e) => {
    const path = e.composedPath();
    if (suppressed && path.includes(suppressed)) suppressed = null;
    if ((cur.reason === 'focus' || cur.reason === 'api') && path.includes(cur.anchor)) hide();
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !cur.anchor) return;
    clearTimeout(showTimer);
    pendingAnchor = null;
    suppressed = cur.anchor;
    hide();
    e.preventDefault();
    e.stopPropagation();
  }, true);

  // ---- scroll and resize ----
  document.addEventListener('scroll', () => {
    cancelPress();
    if (!cur.anchor) return;
    if (cur.reason === 'focus') cur.tip._place();
    else hide();
  }, { capture: true, passive: true });

  window.addEventListener('resize', () => {
    if (cur.anchor) cur.tip._place();
  });

  // ---- no callout, no selection on anchors (touch) ----
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      [data-tooltip]:not([data-tooltip=""]), [${ANCHOR_ATTR}] { -webkit-touch-callout: none; }
      @media (any-pointer: coarse) {
        [data-tooltip]:not([data-tooltip=""]), [${ANCHOR_ATTR}] { -webkit-user-select: none; user-select: none; }
      }
    `);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  } catch (_) { /* no constructable sheets: the long-press still works */ }

  /* -------------------------------------------------------------------------
   * The element: a label. A dedicated one (with `for`) belongs to one anchor;
   * the shared one is created by the controller for data-tooltip anchors.
   * ---------------------------------------------------------------------- */
  class KakaoTooltip extends HTMLElement {
    static get observedAttributes() {
      return ['for'];
    }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.appendChild(TEMPLATE.content.cloneNode(true));
      this._bubble = root.querySelector('.bubble');
      this._hasPopover = typeof this._bubble.showPopover === 'function';
      if (this._hasPopover) this._bubble.setAttribute('popover', 'manual');
      this._linked = null; // the anchor it is linked to
      this._anchorRef = null; // the anchor it is showing for
      this._placement = 'top';
    }

    connectedCallback() {
      if (this.hasAttribute('inline')) return; // a sample: tied to nothing
      if (!this.hasAttribute('role')) this.setAttribute('role', 'tooltip');
      if (!this.id) this.id = `kakao-tooltip-${++seq}`;
      if (!this.hasAttribute('data-kakao-tooltip-shared')) {
        this.removeAttribute('hidden'); // only kept the text out of sight until now
        dedicated.add(this);
        this._link();
      }
    }

    disconnectedCallback() {
      dedicated.delete(this);
      if (cur.tip === this) hide();
      this._unlink();
    }

    attributeChangedCallback() {
      if (this.isConnected && dedicated.has(this)) {
        if (cur.tip === this) hide();
        this._link();
      }
    }

    /** The anchor named by `for`, linked (marked, described) once found. */
    _link() {
      const id = this.getAttribute('for');
      const root = this.getRootNode();
      const anchor = id && typeof root.getElementById === 'function' ? root.getElementById(id) : null;
      if (anchor !== this._linked) {
        this._unlink();
        if (anchor) {
          this._linked = anchor;
          anchor.setAttribute(ANCHOR_ATTR, '');
          this._describes = clean(this.textContent) !== accessibleName(anchor) && addDescribedBy(anchor, this.id);
        }
      }
      return this._linked;
    }

    _unlink() {
      const a = this._linked;
      if (!a) return;
      a.removeAttribute(ANCHOR_ATTR);
      if (this._describes) removeDescribedBy(a, this.id);
      this._linked = null;
      this._describes = false;
    }

    show() {
      const anchor = this._link();
      const text = clean(this.textContent);
      if (anchor && text) show({ anchor, tip: this, text, placement: this.getAttribute('placement') }, 'api');
    }

    hide() {
      if (cur.tip === this) hide();
    }

    _open(anchor, placement) {
      this._anchorRef = anchor;
      this._placement = placement;
      const b = this._bubble;
      b.setAttribute('data-open', '');
      if (this._hasPopover) {
        try { b.showPopover(); } catch (_) { /* already open */ }
      }
      const side = this._place();
      if (!reduceMotion() && typeof b.animate === 'function') {
        const d = 4;
        const from = { top: `0 ${d}px`, bottom: `0 -${d}px`, left: `${d}px 0`, right: `-${d}px 0` }[side];
        const cs = getComputedStyle(b);
        const raw = cs.getPropertyValue('--_anim-duration').trim();
        const ms = parseFloat(raw) * (/ms$/.test(raw) ? 1 : 1000);
        b.animate(
          [{ opacity: 0, translate: from }, { opacity: 1, translate: '0 0' }],
          { duration: Number.isFinite(ms) ? ms : 150, easing: cs.getPropertyValue('--_anim-easing').trim() || 'ease-out' }
        );
      }
    }

    _close() {
      const b = this._bubble;
      if (this._hasPopover) {
        try { b.hidePopover(); } catch (_) { /* already closed */ }
      }
      b.removeAttribute('data-open');
      this._anchorRef = null;
    }

    /** Positions the label by its anchor. @returns {string} the side used */
    _place() {
      const anchor = this._anchorRef;
      const b = this._bubble;
      if (!anchor) return this._placement;
      const r = anchor.getBoundingClientRect();
      const w = b.offsetWidth;
      const h = b.offsetHeight;
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const gap = parseFloat(getComputedStyle(b).getPropertyValue('--_offset')) || 6;
      const fits = {
        top: r.top - gap - h >= MARGIN,
        bottom: r.bottom + gap + h <= vh - MARGIN,
        left: r.left - gap - w >= MARGIN,
        right: r.right + gap + w <= vw - MARGIN,
      };
      const want = this._placement;
      const side = fits[want] || !fits[OPPOSITE[want]] ? want : OPPOSITE[want];
      let x;
      let y;
      if (side === 'top' || side === 'bottom') {
        x = r.left + r.width / 2 - w / 2;
        y = side === 'top' ? r.top - gap - h : r.bottom + gap;
      } else {
        x = side === 'left' ? r.left - gap - w : r.right + gap;
        y = r.top + r.height / 2 - h / 2;
      }
      x = Math.max(MARGIN, Math.min(x, vw - MARGIN - w));
      y = Math.max(MARGIN, Math.min(y, vh - MARGIN - h));
      b.style.left = `${Math.round(x)}px`;
      b.style.top = `${Math.round(y)}px`;
      b.dataset.side = side;
      return side;
    }
  }

  KakaoTooltip.delays = delays;
  KakaoTooltip.show = (anchor, text, placement) => {
    const t = clean(text);
    if (anchor instanceof Element && t) show({ anchor, tip: null, text: t, placement }, 'api');
  };
  KakaoTooltip.hide = () => hide();

  window.KakaoTooltip = KakaoTooltip;
  customElements.define(TAG_NAME, KakaoTooltip);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: ['tooltip-ready'] });
    KakaoComponents.emit(document, 'tooltip-ready');
  }
})();
