/**
 * <kakao-stack>
 * ============================================================================
 * A pile of cards: the newest child in front, the older ones behind it, each a
 * little smaller, paler and tilted back, peeking out past the front card.
 * Pointing at the pile or moving focus into it fans the cards out into a list.
 * Cards slide in when added and out when dismissed. Vanilla JS, Shadow DOM,
 * no deps.
 *
 * It is also the scaffold other components build on: <kakao-toast> is a
 * kakao-stack of alerts with timers and a live region. A component that needs
 * the same pile (upload progress, a queue of notices) extends KakaoStack
 * instead of copying the mechanics (see EXTENDING). Load stack.js before it.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        A pile of cards, newest in front; the base of kakao-toast.
 *  not for    Page layout: kakao-page, kakao-grid; vertical spacing: kakao-flow.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     stack.js
 *  css        none
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="stack.js" defer><\/script>
 *
 *   In the page flow:
 *   <kakao-stack position="inline" label="Recent uploads">
 *     <kakao-card>Older</kakao-card>
 *     <kakao-card>Newest (in front)</kakao-card>
 *   </kakao-stack>
 *
 *   In a corner of the viewport:
 *   <kakao-stack position="bottom-left"></kakao-stack>
 *   stack.append(card);                          // slides in at the front
 *   stack.dismiss(card).then((reason) => …);     // slides out, then removed
 *
 * Every element child is a card (the newest is the last child). Children with
 * the hidden attribute are skipped until it is removed. Cards should have an
 * opaque background: the ones behind are clipped to their peeking strip.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  position   inline (default) · bottom-right · bottom-left · top-right ·
 *             top-left. inline sits in the page flow, the cards peek out
 *             below; a corner fixes it to that corner of the viewport
 *             (bottom corners peek above). Below 30rem a corner stack spans
 *             the viewport width.
 *  max        How many cards are visible at once (default 3). Older ones
 *             wait hidden behind the pile.
 *  label      Accessible name; with it the stack is a named region.
 *  expanded   Set while the pile is fanned out (the stack toggles it).
 *
 * ----------------------------------------------------------------------------
 * SLOTS
 * ----------------------------------------------------------------------------
 *  (default)   The cards: every element child (the newest is the last).
 *
 * ----------------------------------------------------------------------------
 * PROPERTIES / METHODS
 * ----------------------------------------------------------------------------
 *  max                  Same as the attribute.
 *  expanded             Read only.
 *  items                The cards, newest first (leaving ones left out).
 *  dismiss(el, reason)  Slides the card out and removes it; returns a
 *                       promise of the reason (default "method").
 *
 * ----------------------------------------------------------------------------
 * BEHAVIOUR
 * ----------------------------------------------------------------------------
 *  - Fans out while the pointer is over the pile or focus is inside it; on
 *    touch a tap on the pile toggles it, a tap elsewhere collapses it. Taps
 *    on buttons and links inside a card don't toggle.
 *  - A card that holds focus stays visible even past max.
 *  - Corner stacks keep the safe-area insets, sit below the header bar in top
 *    corners (--kakao-header-bar-rendered-height) and move beside an aside
 *    menu that opens on their side when there is room (aside-open /
 *    aside-close triggers).
 *  - Reduced motion: no sliding, fading or fanning animation.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed; also emitted as triggers)
 * ----------------------------------------------------------------------------
 *  stack-add       { item }            a card joined the pile.
 *  stack-removed   { item, reason }    a card left and was removed.
 *  stack-expand    { expanded }        the pile fanned out or collapsed.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-stack-width / -gutter / -gap / -peek
 *  --kakao-stack-scale-step / -fade-step / -tilt / -perspective
 *  --kakao-stack-radius / -shadow / -z-index / -motion-duration / -ease
 *
 * ----------------------------------------------------------------------------
 * EXTENDING
 * ----------------------------------------------------------------------------
 *   class MyPile extends KakaoStack {
 *     static get stackStyles() { return `:host { --_width: var(--kakao-my-pile-width, 18rem); }`; }
 *     _isItem(el) { return el.localName === 'my-card'; }
 *     _itemAdded(rec) { … }   _itemRemoved(rec, reason) { … }
 *   }
 *   customElements.define('kakao-my-pile', MyPile);
 *
 * The subclass gets the whole pile: layout, fanning, max, enter and leave
 * motion, corner placement and the aside shift. Hooks (override, call super
 * where it does something):
 *  static stackStyles   CSS added to the shadow root after the stack's own.
 *                       Redefine the --_* values there (the subclass's own
 *                       settings block), style ::slotted([data-stack-item]).
 *  _isItem(el)          Which children are cards. Default: every element.
 *  _itemAdded(rec)      A card was adopted (rec.el). Default: stack-add.
 *  _itemRemoved(rec, reason)  It left and was removed. Default: stack-removed.
 *  _expandedChanged(expanded) Default: stack-expand.
 *  _updated()           After every layout pass (rec.index and rec.visible
 *                       are current): run timers here.
 *  _fade(rec, paler)    Paint a card behind the front one; paler is 1 at the
 *                       front and drops by the fade step per card behind.
 *                       Default: desaturates the card (filter). Override to
 *                       fade something of the card's own (alerts: their tint).
 *  _leaveTransform(rec) Where a leaving card goes: { x, y } as CSS lengths,
 *                       { s } a scale. Default: out sideways towards the
 *                       corner's edge; inline it shrinks and fades.
 *  _position()          "inline" or a corner. Default: the position
 *                       attribute, inline when it is missing or unknown.
 * Records (rec) are { el, index, visible, leaving }; this._records maps an
 * element to its record and this._order holds them oldest first. A subclass
 * that animates the card's exit itself (as the toast lets the alert fade)
 * calls this._leave(el) when it starts and this._finish(el, reason) when it
 * is over, instead of dismiss().
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-stack';
  if (customElements.get(TAG_NAME)) return;

  const DEFAULT_MAX = 3;

  const STYLE = `
      :host([hidden]) { display: none; }
      :host {
        /* @kakao-settings:start prefix=--kakao-stack- (written by construction.html, edit there) */
        --_width: var(--kakao-stack-width, 22rem);
        --_gutter: var(--kakao-stack-gutter, 1rem);
        --_gap: var(--kakao-stack-gap, 0.5rem);
        --_peek: var(--kakao-stack-peek, 10px);
        --_scale-step: var(--kakao-stack-scale-step, 0.05);
        --_fade-step: var(--kakao-stack-fade-step, 0.18);
        --_tilt: var(--kakao-stack-tilt, 6deg);
        --_perspective: var(--kakao-stack-perspective, 1000px);
        --_radius: var(--kakao-stack-radius, var(--kakao-radius-lg, 14px));
        --_shadow: var(--kakao-stack-shadow, 0 8px 24px rgb(0 0 0 / .08));
        --_z-index: var(--kakao-stack-z-index, 70);
        --_motion-duration: var(--kakao-stack-motion-duration, var(--kakao-motion-duration, 320ms));
        --_ease: var(--kakao-stack-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        --_inset-x: calc(var(--_gutter) + env(safe-area-inset-right, 0px));
        --_inset-x-start: calc(var(--_gutter) + env(safe-area-inset-left, 0px));
        position: relative;
        box-sizing: border-box;
        display: block;
        width: min(100%, var(--_width));
        height: var(--_stack-height, 0px);
        perspective: var(--_perspective);
        transition: height var(--_motion-duration) var(--_ease);
        font-family: inherit;
      }
      :host([data-v="top"]), :host([data-v="bottom"]) {
        position: fixed;
        z-index: var(--_z-index);
        right: var(--_inset-x);
        width: min(var(--_width), calc(100vw - 2 * var(--_gutter)));
        pointer-events: var(--_hit, none);
        translate: var(--_shift, 0px) 0;
        transition: translate var(--_motion-duration) var(--_ease);
        /* A page margin on the host (a card's "> * + * { margin-top }") would
           shift the fixed box. Normal page declarations beat :host, so only
           !important holds. */
        margin: 0 !important;
      }
      :host([data-v="bottom"]) { bottom: calc(var(--_gutter) + env(safe-area-inset-bottom, 0px)); }
      :host([data-v="top"]) {
        top: calc(var(--_gutter) + env(safe-area-inset-top, 0px) + var(--kakao-header-bar-rendered-height, 0px));
      }
      :host([data-v][data-h="left"]) { right: auto; left: var(--_inset-x-start); }
      @media (max-width: 30rem) {
        :host([data-v]), :host([data-v][data-h="left"]) { left: var(--_inset-x-start); right: var(--_inset-x); width: auto; }
      }

      ::slotted(*) { display: none; }
      ::slotted([data-stack-item]) {
        display: block;
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        margin: 0;
        box-sizing: border-box;
        pointer-events: auto;
        border-radius: var(--_radius);
        box-shadow: var(--_shadow);
        transform-origin: 50% 100%;
        transform:
          translate3d(var(--_stack-x, 0px), var(--_stack-y, 0px), 0)
          rotateX(var(--_stack-tilt, 0deg))
          scale(var(--_stack-s, 1));
        opacity: var(--_stack-o, 1);
        z-index: var(--_stack-z, 1);
        clip-path: var(--_stack-clip, none);
        filter: var(--_stack-filter, none);
        transition:
          transform var(--_motion-duration) var(--_ease),
          opacity var(--_motion-duration) var(--_ease),
          clip-path var(--_motion-duration) var(--_ease),
          filter var(--_motion-duration) var(--_ease),
          visibility 0s;
      }
      :host([data-v="bottom"]) ::slotted([data-stack-item]) { top: auto; bottom: 0; transform-origin: 50% 0; }
      ::slotted([data-stack-state="hidden"]) {
        visibility: hidden;
        pointer-events: none;
        transition:
          transform var(--_motion-duration) var(--_ease),
          opacity var(--_motion-duration) var(--_ease),
          clip-path var(--_motion-duration) var(--_ease),
          filter var(--_motion-duration) var(--_ease),
          visibility 0s linear var(--_motion-duration);
      }
      ::slotted([data-stack-state="leaving"]) { pointer-events: none; }
      ::slotted([hidden]) { display: none; }

      /* Lengths from the settings, measured in px by the script. */
      .probe { position: absolute; visibility: hidden; pointer-events: none; height: 0; overflow: hidden; }
      .probe > span { display: block; height: 0; }
      .p-gap { width: var(--_gap); }
      .p-peek { width: var(--_peek); }

      @media (prefers-reduced-motion: reduce) {
        :host, ::slotted([data-stack-item]), ::slotted([data-stack-state="hidden"]) { transition: none; }
      }
      @media (forced-colors: active) {
        ::slotted([data-stack-item]) { box-shadow: none; }
      }
  `;

  /** "320ms", "0.3s" → milliseconds. */
  function toMs(value) {
    const v = String(value).trim();
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return NaN;
    return /[^m]s$/.test(v) ? n * 1000 : n;
  }

  /** "280px", "20rem", "80vw" → px (for the aside width). */
  function toPx(value) {
    const v = String(value || '').trim();
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return 0;
    if (v.endsWith('rem')) return n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
    if (v.endsWith('vw')) return (n * window.innerWidth) / 100;
    return n;
  }

  const CONTROLS = 'button, a, input, select, textarea, kakao-button, [role="button"]';

  class KakaoStack extends HTMLElement {
    static get observedAttributes() { return ['position', 'max', 'label']; }

    /** CSS a subclass adds after the stack's own (its settings, card styles). */
    static get stackStyles() { return ''; }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      const extra = this.constructor.stackStyles;
      shadow.innerHTML = `<style>${STYLE}</style>${extra ? `<style>${extra}</style>` : ''}`
        + '<style class="dyn"></style>'
        + '<div class="probe" aria-hidden="true"><span class="p-gap"></span><span class="p-peek"></span></div>'
        + '<slot></slot>';
      this._dyn = shadow.querySelector('.dyn');
      this._probeGap = shadow.querySelector('.p-gap');
      this._probePeek = shadow.querySelector('.p-peek');
      this._slot = shadow.querySelector('slot');

      this._records = new Map();   // element → record
      this._order = [];            // records, oldest first
      this._hover = false;
      this._focus = false;
      this._touchOpen = false;
      this._expanded = false;
      this._asideShift = 0;
      this._aside = null;          // { position, width } of an open aside menu on any side
      this._height = 0;
      this._frame = 0;

      this._slot.addEventListener('slotchange', () => this._scan());

      this.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'touch') return;
        this._hover = true;
        this._update();
      });
      this.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'touch') return;
        this._hover = false;
        this._update();
      });
      this.addEventListener('pointerup', (e) => {
        if (e.pointerType !== 'touch') return;
        const onControl = e.composedPath().some((n) => n !== this && n.matches && n.matches(CONTROLS));
        if (onControl) return;
        this._touchOpen = !this._touchOpen;
        this._update();
      });
      this._onOutside = (e) => {
        if (!this._touchOpen || e.composedPath().includes(this)) return;
        this._touchOpen = false;
        this._update();
      };
      this.addEventListener('focusin', () => { this._focus = true; this._update(); });
      this.addEventListener('focusout', () => queueMicrotask(() => {
        this._focus = this.matches(':focus-within');
        this._update();
      }));

      this._onResize = () => { this._applyAside(); this._schedule(); };
      this._resizeObserver = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => this._schedule())
        : null;
    }

    connectedCallback() {
      this._renderAttrs();
      document.addEventListener('pointerdown', this._onOutside, true);
      window.addEventListener('resize', this._onResize);
      if (typeof KakaoComponents !== 'undefined') {
        this._offAside = [
          KakaoComponents.on('aside-open', (d) => { this._aside = { position: d.position, width: d.width }; this._applyAside(); }),
          KakaoComponents.on('aside-close', () => { this._aside = null; this._applyAside(); }),
        ];
      }
      this._scan();
    }

    disconnectedCallback() {
      document.removeEventListener('pointerdown', this._onOutside, true);
      window.removeEventListener('resize', this._onResize);
      if (this._offAside) this._offAside.forEach((off) => off());
      this._offAside = null;
    }

    attributeChangedCallback() {
      if (!this.isConnected) return;
      this._renderAttrs();
      this._applyAside();
      this._update();
    }

    /* ------------------------------ API ------------------------------- */

    get max() {
      const n = parseInt(this.getAttribute('max'), 10);
      return Number.isFinite(n) && n >= 1 ? n : DEFAULT_MAX;
    }
    set max(value) { this.setAttribute('max', value); }

    get expanded() { return this._expanded; }

    /** The cards, newest first, without the ones on their way out. */
    get items() { return this._order.filter((r) => !r.leaving).reverse().map((r) => r.el); }

    /** Slide a card out and remove it; resolves with the reason. */
    dismiss(el, reason = 'method') {
      const rec = this._records.get(el);
      if (!rec) return Promise.resolve(null);
      if (!rec.dismissed) {
        rec.dismissed = new Promise((resolve) => { rec.resolveDismiss = resolve; });
        this._leave(el);
        const ms = this._reducedMotion() ? 0 : toMs(getComputedStyle(this).getPropertyValue('--_motion-duration'));
        setTimeout(() => this._finish(el, reason), Number.isFinite(ms) ? ms : 0);
      }
      return rec.dismissed;
    }

    /* ------------------------------ Hooks ----------------------------- */

    _isItem(el) { return el instanceof Element; }

    _itemAdded(rec) { this._dispatch('stack-add', { item: rec.el }); }

    _itemRemoved(rec, reason) { this._dispatch('stack-removed', { item: rec.el, reason }); }

    _expandedChanged(expanded) { this._dispatch('stack-expand', { expanded }); }

    _updated() {}

    _fade(rec, paler) {
      if (paler < 1) rec.el.style.setProperty('--_stack-filter', `saturate(${paler})`);
      else rec.el.style.removeProperty('--_stack-filter');
    }

    _leaveTransform() {
      // Inline, a card sliding sideways would widen the page: it shrinks away.
      if (!this.dataset.h) return { s: 0.96 };
      return { x: this.dataset.h === 'left' ? '-110%' : '110%' };
    }

    /* --------------------------- Records ------------------------------ */

    /** Adopt new card children; forget removed ones. */
    _scan() {
      if (!this.isConnected) return;
      Array.from(this.children).forEach((el) => {
        if (this._records.has(el) || el.hidden || !this._isItem(el)) return;
        this._adopt(el);
      });
      this._order = this._order.filter((rec) => {
        if (rec.el.parentNode === this) return true;
        this._drop(rec, 'method');
        return false;
      });
      this._update();
    }

    _adopt(el) {
      const rec = { el, index: 0, visible: true, leaving: false };
      this._records.set(el, rec);
      this._order.push(rec);
      el.setAttribute('data-stack-item', '');
      if (this._resizeObserver) this._resizeObserver.observe(el);

      // Start just past the front edge, then let the layout move it in.
      const top = this.dataset.v !== 'bottom';
      el.style.setProperty('--_stack-y', `${top ? -16 : 16}px`);
      el.style.setProperty('--_stack-s', '0.96');
      el.style.setProperty('--_stack-o', '0');
      el.style.setProperty('--_stack-z', '200');
      void el.offsetHeight;

      this._itemAdded(rec);
      return rec;
    }

    /** Start a card's exit: it slides out, the others move into place. */
    _leave(el) {
      const rec = this._records.get(el);
      if (!rec || rec.leaving) return;
      rec.leaving = true;
      el.setAttribute('data-stack-state', 'leaving');
      const to = this._leaveTransform(rec);
      if (to.x != null) el.style.setProperty('--_stack-x', to.x);
      if (to.y != null) el.style.setProperty('--_stack-y', to.y);
      if (to.s != null) el.style.setProperty('--_stack-s', String(to.s));
      el.style.setProperty('--_stack-o', '0');
      this._update();
    }

    /** End a card's exit: remove it from the stack and the page. */
    _finish(el, reason = 'method') {
      const rec = this._records.get(el);
      if (!rec) return;
      this._order = this._order.filter((r) => r !== rec);
      el.remove();
      this._drop(rec, reason);
      if (!this._order.length) { this._hover = false; this._touchOpen = false; }
      this._update();
    }

    _drop(rec, reason) {
      if (!this._records.has(rec.el)) return;
      this._records.delete(rec.el);
      if (this._resizeObserver) this._resizeObserver.unobserve(rec.el);
      rec.el.removeAttribute('data-stack-item');
      rec.el.removeAttribute('data-stack-state');
      ['x', 'y', 's', 'o', 'z', 'tilt', 'clip', 'filter'].forEach((p) => rec.el.style.removeProperty(`--_stack-${p}`));
      this._itemRemoved(rec, reason);
      if (rec.resolveDismiss) rec.resolveDismiss(reason);
    }

    /* ----------------------------- Layout ----------------------------- */

    /** The placement: "inline" or a corner. A subclass may default to a corner. */
    _position() {
      const pos = (this.getAttribute('position') || '').trim().toLowerCase();
      return /^(top|bottom)-(left|right)$/.test(pos) ? pos : 'inline';
    }

    _renderAttrs() {
      const pos = this._position();
      if (pos !== 'inline') {
        this.dataset.v = pos.startsWith('top') ? 'top' : 'bottom';
        this.dataset.h = pos.endsWith('left') ? 'left' : 'right';
      } else {
        delete this.dataset.v;
        delete this.dataset.h;
      }
      const label = this.getAttribute('label');
      if (label) {
        if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
        this.setAttribute('aria-label', label);
      }
    }

    _reducedMotion() {
      return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    _schedule() {
      if (this._frame) return;
      this._frame = requestAnimationFrame(() => { this._frame = 0; this._layout(); this._updated(); });
    }

    /** Recompute the expanded state and the layout. */
    _update() {
      const expanded = this._order.some((r) => !r.leaving) && (this._hover || this._focus || this._touchOpen);
      if (expanded !== this._expanded) {
        this._expanded = expanded;
        this.toggleAttribute('expanded', expanded);
        this._expandedChanged(expanded);
      }
      this._layout();
      this._updated();
    }

    _layout() {
      // Bottom corners pile upwards from the bottom edge; inline stacks and
      // top corners pile downwards from the top edge.
      const down = this.dataset.v !== 'bottom';
      const dir = down ? 1 : -1;
      const cs = getComputedStyle(this);
      const step = parseFloat(cs.getPropertyValue('--_scale-step')) || 0;
      const fade = parseFloat(cs.getPropertyValue('--_fade-step')) || 0;
      const tilt = parseFloat(cs.getPropertyValue('--_tilt')) || 0;
      const gap = this._probeGap.getBoundingClientRect().width;
      const peek = this._probePeek.getBoundingClientRect().width;
      const max = this.max;

      const active = this._order.filter((r) => !r.leaving).reverse(); // newest first
      const heights = active.map((r) => r.el.offsetHeight);
      const front = heights[0] || 0;
      const shown = Math.min(active.length, max);
      let offset = 0;

      active.forEach((rec, i) => {
        const el = rec.el;
        const h = heights[i];
        // A card that holds focus stays visible even past max, so focus is
        // never left on a hidden card.
        const visible = i < max || el.matches(':focus-within');
        const k = Math.min(i, max - 1) + (visible ? 0 : 1);
        rec.index = i;
        rec.visible = visible;
        let y; let s = 1; let o = 1; let t = 0; let clip = 0; let paler = 1;
        if (this._expanded && visible) {
          y = dir * offset;
          offset += h + gap;
        } else {
          s = Math.max(0.5, 1 - k * step);
          o = visible ? 1 : 0;
          paler = Math.max(0, 1 - k * fade);
          t = k * tilt * (down ? -1 : 1);
          // Its far edge peeks k × peek past the front card.
          y = down ? front + k * peek - h : h - front - k * peek;
          // A card behind shows only its peeking strip (plus 2px under the
          // next card's rounded corners), so no text peeks out.
          clip = k ? Math.max(0, h - (peek + 2) / s) : 0;
        }
        const out = -60;
        const c = clip > 0 ? clip : out;
        el.style.setProperty('--_stack-x', '0px');
        el.style.setProperty('--_stack-y', `${y}px`);
        el.style.setProperty('--_stack-s', String(s));
        el.style.setProperty('--_stack-o', String(o));
        el.style.setProperty('--_stack-tilt', `${t}deg`);
        el.style.setProperty('--_stack-z', String(100 - i));
        el.style.setProperty('--_stack-clip', down
          ? `inset(${c}px ${out}px ${out}px ${out}px)`
          : `inset(${out}px ${out}px ${c}px ${out}px)`);
        this._fade(rec, paler);
        if (visible) el.removeAttribute('data-stack-state');
        else el.setAttribute('data-stack-state', 'hidden');
      });

      const height = !shown ? 0 : this._expanded ? Math.max(0, offset - gap) : front + (shown - 1) * peek;
      this._height = height;
      this._writeDyn();
    }

    _writeDyn() {
      const hit = this._order.some((r) => !r.leaving) ? 'auto' : 'none';
      this._dyn.textContent = `:host { --_stack-height: ${this._height}px; --_hit: ${hit}; --_shift: ${this._asideShift}px; }`;
    }

    /** Move beside an aside panel that opened on our side, if there is room. */
    _applyAside() {
      let shift = 0;
      const a = this._aside;
      if (a && this.dataset.h && a.position === this.dataset.h) {
        const panel = Math.min(toPx(a.width), window.innerWidth);
        const gutter = parseFloat(getComputedStyle(this).getPropertyValue('--_gutter')) || 16;
        const width = this.getBoundingClientRect().width;
        if (window.innerWidth - panel - 2 * gutter >= width) shift = this.dataset.h === 'left' ? panel : -panel;
      }
      if (shift !== this._asideShift) {
        this._asideShift = shift;
        this._writeDyn();
      }
    }

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
      if (typeof KakaoComponents !== 'undefined') KakaoComponents.emit(this, name, detail);
    }
  }

  customElements.define(TAG_NAME, KakaoStack);
  window.KakaoStack = KakaoStack;

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, {
      triggers: ['stack-add', 'stack-removed', 'stack-expand'],
      reactions: { 'aside-open': 'a corner stack moves beside the panel on its side', 'aside-close': 'moves back' },
    });
  }
})();
