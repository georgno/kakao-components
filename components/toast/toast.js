/**
 * <kakao-toast>
 * ============================================================================
 * A notification region fixed to a corner of the viewport. Its toasts are
 * <kakao-alert> elements, drawn as a stack of cards: the newest in front, the
 * older ones behind it, a little smaller, fainter and tilted back. Hovering
 * the stack or moving focus into it fans the cards out into a list. Vanilla
 * JS, Shadow DOM, no deps; needs alert.js (load it first).
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="alert.js" defer><\/script>
 *   <script src="toast.js" defer><\/script>
 *
 *   KakaoToast.show({ tone: 'success', message: 'Settings saved.' });
 *   const t = KakaoToast.show({
 *     tone: 'danger', heading: 'Upload failed', message: 'The file is too big.',
 *     action: { label: 'Retry', onClick: (toast) => retry() },
 *   });
 *   t.close();  t.closed.then((reason) => …);
 *
 *   Written into the page (e.g. server flash messages), adopted on load:
 *   <kakao-toast position="top-right">
 *     <kakao-alert tone="success">Your profile was updated.</kakao-alert>
 *   </kakao-toast>
 *
 * KakaoToast.show(options) uses options.region (an element or a selector),
 * else the first <kakao-toast> in the page, else adds one to the body.
 * element.show(options) adds a toast to that region. Options:
 *   tone          info (default) · success · warning · danger (alias error)
 *   heading       Title above the message.
 *   message       Text, or a Node.
 *   duration      ms. Without it: info and success leave after
 *                 --kakao-alert-duration (8s), warning and danger stay.
 *                 0 = stays until closed.
 *   dismissible   Close button. Default true.
 *   closeLabel    Accessible name of the close button. Default "Close".
 *   action        { label, onClick(handle) } - a button under the message.
 *                 It closes the toast (reason "action") unless onClick
 *                 returns false. A kakao-button when button.js is loaded.
 * Returns a handle: { element, close(), closed } - closed is a promise that
 * resolves with the reason the toast left.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  position   bottom-right (default) · bottom-left · top-right · top-left.
 *             Below 30rem the stack spans the viewport width.
 *  max        How many toasts are visible at once (default 3). Older ones
 *             wait hidden behind the stack; their timers don't run.
 *  label      Accessible name of the region. Default "Notifications".
 *  expanded   Set while the stack is fanned out (the region toggles it).
 *
 * BEHAVIOUR
 *  - Fans out while the pointer is over the stack or focus is inside it; on
 *    touch a tap on the stack toggles it, a tap elsewhere collapses it.
 *  - The timers of the whole stack pause while it is fanned out and while
 *    the page is hidden. (The region runs them and turns the alerts' own
 *    timers off with duration="0", using the same rule and setting.)
 *  - Escape closes the toast that has focus; focus goes back where it came
 *    from. Showing a toast never moves focus.
 *  - The region is a polite live region (role="region", aria-live="polite")
 *    and each toast keeps the alert's role (status / alert), so new toasts
 *    are announced. Toasts already in the page at load are not announced.
 *  - Keeps the safe-area insets, sits below the header bar in top corners
 *    (--kakao-header-bar-rendered-height) and moves beside an aside menu that
 *    opens on its side when there is room (aside-open / aside-close triggers).
 *  - Reduced motion: no sliding, fading or fanning animation.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed; also emitted as triggers)
 * ----------------------------------------------------------------------------
 *  toast-show    { toast }           a toast was added.
 *  toast-hidden  { toast, reason }   it left and was removed. reason: close
 *                                    (button or Escape), timeout, method
 *                                    (handle / alert close()), action.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-toast-width / -gutter / -gap / -peek
 *  --kakao-toast-scale-step / -fade-step / -tilt / -perspective
 *  --kakao-toast-shadow / -z-index / -motion-duration / -ease
 *  The cards themselves are alerts: --kakao-alert-* applies (set them on
 *  kakao-toast to change toasts only).
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-toast';
  if (customElements.get(TAG_NAME)) return;

  const ASSERTIVE = ['warning', 'danger', 'error'];
  const DEFAULT_MAX = 3;
  const FRESH_DELAY = 150; // a new live region needs a moment before content

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-toast- (written by construction.html, edit there) */
        --_width: var(--kakao-toast-width, 22rem);
        --_gutter: var(--kakao-toast-gutter, 1rem);
        --_gap: var(--kakao-toast-gap, 0.5rem);
        --_peek: var(--kakao-toast-peek, 10px);
        --_scale-step: var(--kakao-toast-scale-step, 0.05);
        --_fade-step: var(--kakao-toast-fade-step, 0.18);
        --_tilt: var(--kakao-toast-tilt, 6deg);
        --_perspective: var(--kakao-toast-perspective, 1000px);
        --_shadow: var(--kakao-toast-shadow, 0 8px 24px rgb(0 0 0 / .08), 0 0 0 1px color-mix(in srgb, var(--kakao-color-text, #18181b) 10%, transparent));
        --_z-index: var(--kakao-toast-z-index, 70);
        --_motion-duration: var(--kakao-toast-motion-duration, var(--kakao-motion-duration, 320ms));
        --_ease: var(--kakao-toast-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        --_inset-x: calc(var(--_gutter) + env(safe-area-inset-right, 0px));
        --_inset-x-start: calc(var(--_gutter) + env(safe-area-inset-left, 0px));
        position: fixed;
        z-index: var(--_z-index);
        right: var(--_inset-x);
        bottom: calc(var(--_gutter) + env(safe-area-inset-bottom, 0px));
        box-sizing: border-box;
        display: block;
        width: min(var(--_width), calc(100vw - 2 * var(--_gutter)));
        height: var(--_stack-height, 0px);
        perspective: var(--_perspective);
        pointer-events: var(--_hit, none);
        translate: var(--_shift, 0px) 0;
        transition: translate var(--_motion-duration) var(--_ease);
        font-family: inherit;
        /* A page margin on the host (a card's "> * + * { margin-top }") would
           shift the fixed box. Normal page declarations beat :host, so only
           !important holds. */
        margin: 0 !important;
      }
      :host([data-h="left"]) { right: auto; left: var(--_inset-x-start); }
      :host([data-v="top"]) {
        bottom: auto;
        top: calc(var(--_gutter) + env(safe-area-inset-top, 0px) + var(--kakao-header-bar-rendered-height, 0px));
      }
      @media (max-width: 30rem) {
        :host, :host([data-h="left"]) { left: var(--_inset-x-start); right: var(--_inset-x); width: auto; }
      }

      ::slotted(*) { display: none; }
      ::slotted(kakao-alert) {
        display: block;
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        margin: 0;
        pointer-events: auto;
        border-radius: var(--kakao-alert-radius, 10px);
        box-shadow: var(--_shadow);
        transform-origin: 50% 0;
        transform:
          translate3d(var(--_toast-x, 0px), var(--_toast-y, 0px), 0)
          rotateX(var(--_toast-tilt, 0deg))
          scale(var(--_toast-s, 1));
        opacity: var(--_toast-o, 1);
        z-index: var(--_toast-z, 1);
        clip-path: var(--_toast-clip, none);
        transition:
          transform var(--_motion-duration) var(--_ease),
          opacity var(--_motion-duration) var(--_ease),
          clip-path var(--_motion-duration) var(--_ease),
          visibility 0s;
      }
      :host([data-v="top"]) ::slotted(kakao-alert) { bottom: auto; top: 0; transform-origin: 50% 100%; }
      ::slotted(kakao-alert[data-toast-state="hidden"]) {
        visibility: hidden;
        pointer-events: none;
        transition:
          transform var(--_motion-duration) var(--_ease),
          opacity var(--_motion-duration) var(--_ease),
          clip-path var(--_motion-duration) var(--_ease),
          visibility 0s linear var(--_motion-duration);
      }
      ::slotted(kakao-alert[data-toast-state="leaving"]) { pointer-events: none; }
      ::slotted(kakao-alert[hidden]) { display: none; }

      /* Lengths from the settings, measured in px by the script. */
      .probe { position: absolute; visibility: hidden; pointer-events: none; height: 0; overflow: hidden; }
      .probe > span { display: block; height: 0; }
      .p-gap { width: var(--_gap); }
      .p-peek { width: var(--_peek); }

      @media (prefers-reduced-motion: reduce) {
        :host, ::slotted(kakao-alert), ::slotted(kakao-alert[data-toast-state="hidden"]) { transition: none; }
      }
      @media (forced-colors: active) {
        ::slotted(kakao-alert) { box-shadow: none; }
      }
    </style>
    <style class="dyn"></style>
    <div class="probe" aria-hidden="true"><span class="p-gap"></span><span class="p-peek"></span></div>
    <slot></slot>
  `;

  /** "8000ms", "8s", "8000" → milliseconds. */
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

  let warnedAlert = false;

  class KakaoToast extends HTMLElement {
    static get observedAttributes() { return ['position', 'max', 'label']; }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._dyn = shadow.querySelector('.dyn');
      this._probeGap = shadow.querySelector('.p-gap');
      this._probePeek = shadow.querySelector('.p-peek');
      this._slot = shadow.querySelector('slot');

      this._records = new Map();   // alert → record
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
        const onControl = e.composedPath().some((n) => n !== this && n.matches && n.matches('button, a, input, kakao-button, [role="button"]'));
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
      this.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const alert = e.composedPath().find((n) => this._records.has(n));
        if (!alert) return;
        e.preventDefault();
        this._records.get(alert).reason = 'close';
        alert.close();
      });

      // Hiding comes from the alert: its close button, close(), our timer.
      this.addEventListener('alert-hide', (e) => {
        const rec = this._records.get(e.target);
        if (!rec) return;
        queueMicrotask(() => {
          if (e.defaultPrevented) { rec.reason = null; return; }
          this._leave(rec, e.detail && e.detail.reason);
        });
      });
      this.addEventListener('alert-hidden', (e) => {
        const rec = this._records.get(e.target);
        if (!rec) return;
        this._leave(rec, e.detail && e.detail.reason);
        this._finish(rec);
      });

      this._onVisibility = () => this._syncTimers();
      this._onResize = () => { this._applyAside(); this._schedule(); };
      this._resizeObserver = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => this._schedule())
        : null;
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
      if (!this.hasAttribute('aria-live')) this.setAttribute('aria-live', 'polite');
      this._renderAttrs();
      document.addEventListener('visibilitychange', this._onVisibility);
      document.addEventListener('pointerdown', this._onOutside, true);
      window.addEventListener('resize', this._onResize);
      if (typeof KakaoComponents !== 'undefined') {
        this._offAside = [
          KakaoComponents.on('aside-open', (d) => { this._aside = { position: d.position, width: d.width }; this._applyAside(); }),
          KakaoComponents.on('aside-close', () => { this._aside = null; this._applyAside(); }),
        ];
      }
      if (!customElements.get('kakao-alert') && !warnedAlert) {
        warnedAlert = true;
        console.warn('kakao-toast: load alert.js (kakao-alert) for the toasts to render.');
      }
      customElements.whenDefined('kakao-alert').then(() => this._scan());
      this._scan();
    }

    disconnectedCallback() {
      document.removeEventListener('visibilitychange', this._onVisibility);
      document.removeEventListener('pointerdown', this._onOutside, true);
      window.removeEventListener('resize', this._onResize);
      if (this._offAside) this._offAside.forEach((off) => off());
      this._offAside = null;
      this._order.forEach((rec) => this._stopTimer(rec));
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

    /** Adds a toast; returns { element, close(), closed }. */
    show(options = {}, _fresh = false) {
      const alert = document.createElement('kakao-alert');
      const tone = options.tone || 'info';
      alert.setAttribute('tone', tone);
      if (options.heading) alert.setAttribute('heading', options.heading);
      if (options.dismissible !== false) alert.setAttribute('dismissible', '');
      if (options.closeLabel) alert.setAttribute('close-label', options.closeLabel);
      if (options.duration != null && options.duration !== '') alert.setAttribute('duration', String(options.duration));
      const message = options.message;
      if (message instanceof Node) alert.append(message);
      else if (message != null) alert.append(String(message));

      const rec = this._record(alert);
      if (options.action && options.action.label) this._addAction(rec, options.action);

      const insert = () => { if (!rec.cancelled) this.append(alert); };
      if (_fresh) setTimeout(insert, FRESH_DELAY);
      else insert();
      return rec.handle;
    }

    /* --------------------------- Records ------------------------------ */

    _record(alert) {
      let resolve;
      const closed = new Promise((r) => { resolve = r; });
      const rec = {
        el: alert, resolve, reason: null, leaving: false, done: false, cancelled: false,
        adopted: false, remaining: 0, timer: 0, deadline: 0, index: 0,
      };
      rec.handle = {
        element: alert,
        closed,
        close: () => {
          if (rec.done || rec.leaving) return;
          if (!rec.adopted) { rec.cancelled = true; this._settle(rec, 'method'); return; }
          rec.reason = rec.reason || 'method';
          alert.close();
        },
      };
      this._records.set(alert, rec);
      return rec;
    }

    _addAction(rec, action) {
      const row = document.createElement('div');
      row.setAttribute('data-toast-action', '');
      row.style.cssText = 'display:flex;gap:.5rem;margin-top:.5rem';
      let button;
      let eventName;
      if (customElements.get('kakao-button')) {
        button = document.createElement('kakao-button');
        button.setAttribute('label', action.label);
        button.setAttribute('size', 'sm');
        button.setAttribute('variant', 'secondary');
        eventName = 'kakao-button-action';
      } else {
        button = document.createElement('button');
        button.type = 'button';
        button.textContent = action.label;
        eventName = 'click';
      }
      button.addEventListener(eventName, () => {
        if (rec.leaving || rec.done) return;
        const result = typeof action.onClick === 'function' ? action.onClick(rec.handle) : undefined;
        if (result === false) return;
        rec.reason = 'action';
        rec.el.close();
      });
      row.append(button);
      rec.el.append(row);
    }

    /** Adopt new <kakao-alert> children; forget removed ones. */
    _scan() {
      if (!this.isConnected) return;
      const children = Array.from(this.children).filter((el) => el.localName === 'kakao-alert');
      children.forEach((el) => {
        let rec = this._records.get(el);
        if (rec && rec.adopted) return;
        if (!rec) {
          if (el.hidden) return;
          rec = this._record(el);
        }
        this._adopt(rec);
      });
      this._order = this._order.filter((rec) => {
        if (rec.el.parentNode === this) return true;
        if (!rec.done) { this._stopTimer(rec); this._settle(rec, rec.reason || 'method'); }
        return false;
      });
      this._update();
    }

    _adopt(rec) {
      const el = rec.el;
      rec.adopted = true;
      rec.remaining = this._durationFor(el);
      const acs = getComputedStyle(el);
      rec.tint = parseFloat(acs.getPropertyValue('--_tint') || acs.getPropertyValue('--kakao-alert-tint')) || 10;
      el.setAttribute('duration', '0');  // the region runs the timer
      this._order.push(rec);
      if (this._resizeObserver) this._resizeObserver.observe(el);

      // Start just past the corner, then let the layout move it in.
      const top = this.dataset.v === 'top';
      el.style.setProperty('--_toast-y', `${top ? -16 : 16}px`);
      el.style.setProperty('--_toast-s', '0.96');
      el.style.setProperty('--_toast-o', '0');
      el.style.setProperty('--_toast-z', '200');
      void el.offsetHeight;

      this._dispatch('toast-show', { toast: el });
    }

    _durationFor(el) {
      const raw = el.getAttribute('duration');
      if (raw != null && raw !== '') {
        const ms = toMs(raw);
        if (Number.isFinite(ms) && ms >= 0) return ms;
      }
      const tone = (el.getAttribute('tone') || '').trim().toLowerCase();
      if (ASSERTIVE.includes(tone)) return 0;
      const cs = getComputedStyle(el);
      const ms = toMs(cs.getPropertyValue('--_duration') || cs.getPropertyValue('--kakao-alert-duration'));
      return Number.isFinite(ms) && ms > 0 ? ms : 8000;
    }

    _leave(rec, alertReason) {
      if (rec.leaving) return;
      rec.leaving = true;
      rec.reason = rec.reason || (alertReason === 'close' ? 'close' : alertReason === 'timeout' ? 'timeout' : 'method');
      this._stopTimer(rec);
      rec.remaining = 0;
      rec.el.setAttribute('data-toast-state', 'leaving');
      const left = this.dataset.h === 'left';
      rec.el.style.setProperty('--_toast-x', left ? '-110%' : '110%');
      rec.el.style.setProperty('--_toast-o', '0');
      this._update();
    }

    _finish(rec) {
      if (rec.done) return;
      if (this._resizeObserver) this._resizeObserver.unobserve(rec.el);
      this._order = this._order.filter((r) => r !== rec);
      const reason = rec.reason || 'method';
      rec.el.remove();
      this._settle(rec, reason);
      this._dispatch('toast-hidden', { toast: rec.el, reason });
      if (!this._order.length) { this._hover = false; this._touchOpen = false; }
      this._update();
    }

    _settle(rec, reason) {
      if (rec.done) return;
      rec.done = true;
      this._records.delete(rec.el);
      rec.resolve(reason);
    }

    /* ----------------------------- Layout ----------------------------- */

    _renderAttrs() {
      const pos = (this.getAttribute('position') || '').trim().toLowerCase();
      this.dataset.v = pos.startsWith('top') ? 'top' : 'bottom';
      this.dataset.h = pos.endsWith('left') ? 'left' : 'right';
      this.setAttribute('aria-label', this.getAttribute('label') || 'Notifications');
    }

    _schedule() {
      if (this._frame) return;
      this._frame = requestAnimationFrame(() => { this._frame = 0; this._layout(); });
    }

    /** Recompute the expanded state, the layout and the timers. */
    _update() {
      const expanded = this._order.some((r) => !r.leaving) && (this._hover || this._focus || this._touchOpen);
      if (expanded !== this._expanded) {
        this._expanded = expanded;
        this.toggleAttribute('expanded', expanded);
      }
      this._layout();
      this._syncTimers();
    }

    _layout() {
      const top = this.dataset.v === 'top';
      const dir = top ? 1 : -1;
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
        let y; let s = 1; let o = 1; let t = 0; let clip = 0; let paler = 1;
        if (this._expanded && visible) {
          y = dir * offset;
          offset += h + gap;
        } else {
          s = Math.max(0.5, 1 - k * step);
          o = visible ? 1 : 0;
          paler = Math.max(0, 1 - k * fade);
          t = k * tilt * (top ? -1 : 1);
          // Its far edge peeks k × peek past the front card.
          y = top ? front + k * peek - h : h - front - k * peek;
          // A card behind shows only its peeking strip (plus 2px under the
          // next card's rounded corners), so no text peeks out.
          clip = k ? Math.max(0, h - (peek + 2) / s) : 0;
        }
        const out = -60;
        const c = clip > 0 ? clip : out;
        el.style.setProperty('--_toast-x', '0px');
        el.style.setProperty('--_toast-y', `${y}px`);
        el.style.setProperty('--_toast-s', String(s));
        el.style.setProperty('--_toast-o', String(o));
        el.style.setProperty('--_toast-tilt', `${t}deg`);
        el.style.setProperty('--_toast-z', String(100 - i));
        el.style.setProperty('--_toast-clip', top
          ? `inset(${c}px ${out}px ${out}px ${out}px)`
          : `inset(${out}px ${out}px ${c}px ${out}px)`);
        // Cards further back are paler: less tone in the fill. They
        // stay opaque, so nothing behind the stack shows through them.
        if (paler < 1) {
          el.style.setProperty('--kakao-alert-tint', `${rec.tint * paler}%`);
        } else {
          el.style.removeProperty('--kakao-alert-tint');
        }
        if (visible) el.removeAttribute('data-toast-state');
        else el.setAttribute('data-toast-state', 'hidden');
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
      if (a && a.position === this.dataset.h) {
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

    /* ------------------------------ Timers ---------------------------- */

    _syncTimers() {
      const paused = this._expanded || document.hidden;
      const max = this.max;
      this._order.forEach((rec) => {
        if (rec.leaving || rec.remaining <= 0) return;
        const run = !paused && rec.index < max;
        if (!run) {
          if (rec.timer) {
            clearTimeout(rec.timer);
            rec.timer = 0;
            rec.remaining = Math.max(1, rec.deadline - Date.now());
          }
        } else if (!rec.timer) {
          rec.deadline = Date.now() + rec.remaining;
          rec.timer = setTimeout(() => {
            rec.timer = 0;
            rec.remaining = 0;
            rec.reason = 'timeout';
            rec.el.close();
          }, rec.remaining);
        }
      });
    }

    _stopTimer(rec) {
      clearTimeout(rec.timer);
      rec.timer = 0;
    }

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
      if (typeof KakaoComponents !== 'undefined') KakaoComponents.emit(this, name, detail);
    }
  }

  customElements.define(TAG_NAME, KakaoToast);

  /** Page helper: KakaoToast.show(options) → handle. */
  window.KakaoToast = {
    show(options = {}) {
      let region = options.region;
      if (typeof region === 'string') region = document.querySelector(region);
      if (!region) region = document.querySelector(TAG_NAME);
      let fresh = false;
      if (!region) {
        region = document.createElement(TAG_NAME);
        document.body.append(region);
        fresh = true;
      }
      return region.show(options, fresh);
    },
  };

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, {
      triggers: ['toast-show', 'toast-hidden'],
      reactions: { 'aside-open': 'moves beside the panel on its side', 'aside-close': 'moves back' },
    });
  }
})();
