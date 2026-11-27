/**
 * <kakao-toast>
 * ============================================================================
 * A notification region fixed to a corner of the viewport. Its toasts are
 * <kakao-alert> elements, drawn as a stack of cards: the newest in front, the
 * older ones behind it, a little smaller, fainter and tilted back. Hovering
 * the stack or moving focus into it fans the cards out into a list. Vanilla
 * JS, Shadow DOM; built on <kakao-stack> (the pile, fanning, max, motion,
 * corner placement) and needs alert.js. Load stack.js and alert.js first.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        Brief notices in a corner that go away by themselves.
 *  not for    Lasting messages: kakao-alert; a decision: kakao-dialog.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     toast.js
 *  css        none
 *  requires   stack, alert   (load these first, in this order)
 *  enhanced   button   (used when loaded, optional)
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="stack.js" defer><\/script>
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
 *  The stacking, fanning, max and motion are <kakao-stack>'s (stack.js);
 *  the toast adds the alerts, their timers, Escape and the live region. It
 *  fires toast-show / toast-hidden instead of the stack's events.
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
 *  These replace the --kakao-stack-* settings for toasts. The cards
 *  themselves are alerts: --kakao-alert-* applies (set them on kakao-toast
 *  to change toasts only); the card radius is the alert's.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-toast';
  if (customElements.get(TAG_NAME)) return;
  if (typeof KakaoStack === 'undefined') {
    console.warn('kakao-toast: load stack.js (kakao-stack) before toast.js.');
    return;
  }

  const ASSERTIVE = ['warning', 'danger', 'error'];
  const FRESH_DELAY = 150; // a new live region needs a moment before content

  // Replaces the stack's settings (same aliases, toast names) and makes the
  // cards' corners the alert's.
  const STYLE = `
      :host([hidden]) { display: none; }
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
        --_shadow: var(--kakao-toast-shadow, 0 8px 24px rgb(0 0 0 / .08));
        --_z-index: var(--kakao-toast-z-index, 70);
        --_motion-duration: var(--kakao-toast-motion-duration, var(--kakao-motion-duration, 320ms));
        --_ease: var(--kakao-toast-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        --_radius: var(--kakao-alert-radius, var(--kakao-radius-md, 10px));
      }
  `;

  /** "8000ms", "8s", "8000" → milliseconds. */
  function toMs(value) {
    const v = String(value).trim();
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return NaN;
    return /[^m]s$/.test(v) ? n * 1000 : n;
  }

  let warnedAlert = false;

  class KakaoToast extends KakaoStack {
    static get stackStyles() { return STYLE; }

    constructor() {
      super();
      this._toasts = new Map();    // alert → toast record (handle, timer, reason)

      this.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const alert = e.composedPath().find((n) => this._toasts.has(n));
        if (!alert) return;
        e.preventDefault();
        this._toasts.get(alert).reason = 'close';
        alert.close();
      });

      // Hiding comes from the alert: its close button, close(), our timer.
      // The stack slides the card out while the alert fades, and removes it
      // once the alert is hidden.
      this.addEventListener('alert-hide', (e) => {
        const t = this._toasts.get(e.target);
        if (!t) return;
        queueMicrotask(() => {
          if (e.defaultPrevented) { t.reason = null; return; }
          this._startLeaving(t, e.detail && e.detail.reason);
        });
      });
      this.addEventListener('alert-hidden', (e) => {
        const t = this._toasts.get(e.target);
        if (!t) return;
        this._startLeaving(t, e.detail && e.detail.reason);
        this._finish(t.el, t.reason || 'method');
      });

      this._onVisibility = () => this._syncTimers();
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
      if (!this.hasAttribute('aria-live')) this.setAttribute('aria-live', 'polite');
      document.addEventListener('visibilitychange', this._onVisibility);
      if (!customElements.get('kakao-alert') && !warnedAlert) {
        warnedAlert = true;
        console.warn('kakao-toast: load alert.js (kakao-alert) for the toasts to render.');
      }
      customElements.whenDefined('kakao-alert').then(() => this._scan());
      super.connectedCallback();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      document.removeEventListener('visibilitychange', this._onVisibility);
      this._toasts.forEach((t) => this._stopTimer(t));
    }

    /* ------------------------------ API ------------------------------- */

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

      const t = this._toast(alert);
      if (options.action && options.action.label) this._addAction(t, options.action);

      const insert = () => { if (!t.cancelled) this.append(alert); };
      if (_fresh) setTimeout(insert, FRESH_DELAY);
      else insert();
      return t.handle;
    }

    /** A toast leaves through its alert, so the alert's fade plays too. */
    dismiss(el, reason = 'method') {
      const t = this._toasts.get(el);
      if (!t || !t.adopted) return super.dismiss(el, reason);
      t.reason = t.reason || reason;
      el.close();
      return t.handle.closed;
    }

    /* ------------------------ Stack hooks ----------------------------- */

    _position() {
      const pos = (this.getAttribute('position') || '').trim().toLowerCase();
      return /^(top|bottom)-(left|right)$/.test(pos) ? pos : 'bottom-right';
    }

    _renderAttrs() {
      super._renderAttrs();
      this.setAttribute('aria-label', this.getAttribute('label') || 'Notifications');
    }

    _isItem(el) { return el.localName === 'kakao-alert' && !!customElements.get('kakao-alert'); }

    _itemAdded(rec) {
      const el = rec.el;
      const t = this._toasts.get(el) || this._toast(el);
      t.adopted = true;
      t.remaining = this._durationFor(el);
      const acs = getComputedStyle(el);
      t.tint = parseFloat(acs.getPropertyValue('--_tint') || acs.getPropertyValue('--kakao-alert-tint')) || 10;
      el.setAttribute('duration', '0');  // the region runs the timer
      this._dispatch('toast-show', { toast: el });
    }

    _itemRemoved(rec, reason) {
      const t = this._toasts.get(rec.el);
      rec.el.style.removeProperty('--kakao-alert-tint');
      if (!t) return;
      this._stopTimer(t);
      const why = t.reason || reason || 'method';
      const wasShown = t.adopted && t.leaving;
      this._settle(t, why);
      if (wasShown) this._dispatch('toast-hidden', { toast: rec.el, reason: why });
    }

    _expandedChanged() {}

    _updated() { this._syncTimers(); }

    // Cards further back are paler: less tone in the fill. They stay opaque,
    // so nothing behind the stack shows through them.
    _fade(rec, paler) {
      const t = this._toasts.get(rec.el);
      if (paler < 1 && t) rec.el.style.setProperty('--kakao-alert-tint', `${t.tint * paler}%`);
      else rec.el.style.removeProperty('--kakao-alert-tint');
    }

    /* --------------------------- Records ------------------------------ */

    _toast(alert) {
      let resolve;
      const closed = new Promise((r) => { resolve = r; });
      const t = {
        el: alert, resolve, reason: null, leaving: false, done: false, cancelled: false,
        adopted: false, remaining: 0, timer: 0, deadline: 0, tint: 10,
      };
      t.handle = {
        element: alert,
        closed,
        close: () => {
          if (t.done || t.leaving) return;
          if (!t.adopted) { t.cancelled = true; this._settle(t, 'method'); return; }
          t.reason = t.reason || 'method';
          alert.close();
        },
      };
      this._toasts.set(alert, t);
      return t;
    }

    _addAction(t, action) {
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
        if (t.leaving || t.done) return;
        const result = typeof action.onClick === 'function' ? action.onClick(t.handle) : undefined;
        if (result === false) return;
        t.reason = 'action';
        t.el.close();
      });
      row.append(button);
      t.el.append(row);
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

    _startLeaving(t, alertReason) {
      if (t.leaving) return;
      t.leaving = true;
      t.reason = t.reason || (alertReason === 'close' ? 'close' : alertReason === 'timeout' ? 'timeout' : 'method');
      this._stopTimer(t);
      t.remaining = 0;
      this._leave(t.el);
    }

    _settle(t, reason) {
      if (t.done) return;
      t.done = true;
      this._toasts.delete(t.el);
      t.resolve(reason);
    }

    /* ------------------------------ Timers ---------------------------- */

    _syncTimers() {
      if (!this._toasts) return; // the stack lays out before our constructor ends
      const paused = this.expanded || document.hidden;
      const max = this.max;
      this._toasts.forEach((t) => {
        if (!t.adopted || t.leaving || t.remaining <= 0) return;
        const rec = this._records.get(t.el);
        const run = !paused && !!rec && rec.index < max;
        if (!run) {
          if (t.timer) {
            clearTimeout(t.timer);
            t.timer = 0;
            t.remaining = Math.max(1, t.deadline - Date.now());
          }
        } else if (!t.timer) {
          t.deadline = Date.now() + t.remaining;
          t.timer = setTimeout(() => {
            t.timer = 0;
            t.remaining = 0;
            t.reason = 'timeout';
            t.el.close();
          }, t.remaining);
        }
      });
    }

    _stopTimer(t) {
      clearTimeout(t.timer);
      t.timer = 0;
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
