/**
 * <kakao-alert>
 * ============================================================================
 * An inline message in the page content: "Settings saved", "Payment failed".
 * A tinted box with an icon, an optional title and the message, optionally
 * closable, optionally hiding itself after a while. Vanilla JS, Shadow DOM,
 * no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="alert.js"><\/script>
 *
 *   <kakao-alert tone="success">Settings saved.</kakao-alert>
 *   <kakao-alert tone="danger" heading="Payment failed" dismissible>
 *     Your card was declined. <a href="/billing">Update it</a>.
 *   </kakao-alert>
 *   <kakao-alert duration="0">Stays until it is closed or hidden.</kakao-alert>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  tone          info (default) · success · warning · danger. "error" is an
 *                alias of danger; unknown values fall back to info. Observed:
 *                changing it restyles the alert and updates its role.
 *  heading       Title text above the message (or use slot="title").
 *  dismissible   Shows a close button.
 *  close-label   Accessible name of the close button. Default "Close".
 *  duration      Auto-hide time in ms. "0" turns auto-hide off. Without it,
 *                info and success hide after --kakao-alert-duration (8000ms);
 *                warning and danger stay until closed.
 *  no-icon       Shows no icon.
 *  hidden        Hidden. Set by hide() / the timer / the close button,
 *                removed by show().
 *
 * SLOTS: default (the message), title, icon (replaces the tone's icon).
 *
 * ROLES: the element gets role="alert" for warning and danger (assertive)
 * and role="status" for info and success (polite), kept in step with tone,
 * unless the page wrote a role itself. A screen reader announces an alert
 * when it is inserted or shown, not one that is already in the page on load.
 *
 * AUTO-HIDE AND ACCESSIBILITY: a message that disappears on a timer may be
 * gone before someone using a screen reader or magnifier, or reading slowly,
 * reaches it (WCAG 2.2.1). So only info and success hide by default, the timer
 * pauses while the pointer is over the alert, while focus is inside it and
 * while the tab is hidden, and duration="0" turns it off. Don't put the only
 * copy of important information in an auto-hiding alert.
 *
 * ----------------------------------------------------------------------------
 * METHODS
 * ----------------------------------------------------------------------------
 *  show()           Shows the alert (fades in) and restarts its timer.
 *  hide() / close() Requests hiding, reason "method".
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  alert-show     {}                 shown by show().
 *  alert-hide     { reason }         cancelable, before hiding. reason is
 *                                    "close" (button), "timeout" or "method".
 *  alert-hidden   { reason }         after the fade, once hidden is set.
 *  The same names are emitted as triggers (shared/component-api.js); a
 *  cancelled alert-hide is not.
 *
 * Focus: if focus was inside the alert when it hides, it goes back to the
 * element it came from. Pages that want the element gone call remove() on
 * alert-hidden.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-alert-radius / -padding-y / -padding-x / -gap / -font-size
 *  --kakao-alert-title-weight / -icon-size
 *  --kakao-alert-surface / -text / -info / -success / -warning / -danger / -focus
 *  --kakao-alert-tint / -border-mix / -icon-mix
 *  --kakao-alert-duration / -fade-duration / -ease
 *
 * Parts: alert, icon, title, message, close.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-alert';
  if (customElements.get(TAG_NAME)) return;

  const TONES = ['info', 'success', 'warning', 'danger'];
  const ALIASES = { error: 'danger' };
  const ASSERTIVE = ['warning', 'danger'];

  /* 16px stroked glyphs, the stroke style of the chip's remove icon. */
  const svg = (inner) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  const ICONS = {
    info: svg('<circle cx="8" cy="8" r="6.25"/><path d="M8 7.25v3.75"/><circle cx="8" cy="4.9" r=".2" fill="currentColor"/>'),
    success: svg('<circle cx="8" cy="8" r="6.25"/><path d="M5.4 8.2l1.8 1.8 3.4-3.6"/>'),
    warning: svg('<path d="M7.1 2.6a1 1 0 0 1 1.8 0l5.2 9.6a1 1 0 0 1-.9 1.5H2.8a1 1 0 0 1-.9-1.5z"/><path d="M8 6.4v3"/><circle cx="8" cy="11.4" r=".2" fill="currentColor"/>'),
    danger: svg('<circle cx="8" cy="8" r="6.25"/><path d="M8 4.9v3.6"/><circle cx="8" cy="11" r=".2" fill="currentColor"/>'),
  };

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-alert- (written by construction.html, edit there) */
        --_radius: var(--kakao-alert-radius, 10px);
        --_padding-y: var(--kakao-alert-padding-y, 0.75rem);
        --_padding-x: var(--kakao-alert-padding-x, 0.875rem);
        --_gap: var(--kakao-alert-gap, 0.625rem);
        --_font-size: var(--kakao-alert-font-size, var(--kakao-font-size, 0.95rem));
        --_title-weight: var(--kakao-alert-title-weight, 600);
        --_icon-size: var(--kakao-alert-icon-size, 1.125rem);
        --_surface: var(--kakao-alert-surface, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-alert-text, var(--kakao-color-text, #18181b));
        --_info: var(--kakao-alert-info, var(--kakao-color-primary, #4f46e5));
        --_success: var(--kakao-alert-success, var(--kakao-color-success, #15803d));
        --_warning: var(--kakao-alert-warning, var(--kakao-color-warning, #b45309));
        --_danger: var(--kakao-alert-danger, var(--kakao-color-danger, #dc2626));
        --_focus: var(--kakao-alert-focus, var(--kakao-color-focus, #2563eb));
        --_tint: var(--kakao-alert-tint, 10%);
        --_border-mix: var(--kakao-alert-border-mix, 28%);
        --_icon-mix: var(--kakao-alert-icon-mix, 72%);
        --_duration: var(--kakao-alert-duration, 8000ms);
        --_fade-duration: var(--kakao-alert-fade-duration, var(--kakao-motion-duration, 320ms));
        --_ease: var(--kakao-alert-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        display: block;
        font-size: var(--_font-size);
      }
      :host([hidden]) { display: none; }

      /* Hiding fades and collapses together: the row shrinks to 0fr. */
      .frame {
        display: grid;
        grid-template-rows: 1fr;
        opacity: 1;
        transition: grid-template-rows var(--_fade-duration) var(--_ease), opacity var(--_fade-duration) var(--_ease);
      }
      .frame.out { grid-template-rows: 0fr; opacity: 0; }
      .frame.out .clip { overflow: hidden; }
      .clip { min-height: 0; }

      .alert {
        --_tone: var(--_info);
        display: flex;
        align-items: flex-start;
        gap: var(--_gap);
        box-sizing: border-box;
        padding: var(--_padding-y) var(--_padding-x);
        border: 1px solid color-mix(in srgb, var(--_tone) var(--_border-mix), var(--_surface));
        border-radius: var(--_radius);
        background: color-mix(in srgb, var(--_tone) var(--_tint), var(--_surface));
        color: var(--_text);
        font-family: inherit;
        line-height: 1.5;
      }
      .alert[data-tone="success"] { --_tone: var(--_success); }
      .alert[data-tone="warning"] { --_tone: var(--_warning); }
      .alert[data-tone="danger"]  { --_tone: var(--_danger); }

      /* One line box high, so the icon centres on the first line of text. */
      .icon {
        flex: none;
        display: inline-grid;
        place-items: center;
        height: 1.5em;
        color: color-mix(in srgb, var(--_tone) var(--_icon-mix), var(--_text));
      }
      .icon svg, ::slotted([slot="icon"]) { width: var(--_icon-size); height: var(--_icon-size); }
      ::slotted([slot="icon"]) { display: inline-grid; place-items: center; font-size: var(--_icon-size); }
      .icon[hidden] { display: none; }

      .body { flex: 1; min-width: 0; overflow-wrap: anywhere; }
      .title { font-weight: var(--_title-weight); }
      .title[hidden] { display: none; }
      ::slotted([slot="title"]) { margin: 0; font: inherit; font-weight: var(--_title-weight); }
      .message ::slotted(*) { margin-block: 0; }
      .message ::slotted(* + *) { margin-top: 0.4em; }
      .message ::slotted(a) { color: inherit; }

      .close {
        position: relative;
        flex: none;
        display: inline-grid;
        place-items: center;
        width: 1.5em;
        height: 1.5em;
        margin: 0 calc(var(--_padding-x) * -0.35) 0 0;
        padding: 0;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
        opacity: 0.7;
      }
      .close:hover { opacity: 1; background: color-mix(in srgb, currentColor 12%, transparent); }
      .close:focus-visible { opacity: 1; outline: 2px solid var(--_focus); outline-offset: 1px; }
      /* The tap target is at least 24 × 24px (WCAG 2.5.8). */
      .close::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: max(100%, 24px);
        height: max(100%, 24px);
        transform: translate(-50%, -50%);
      }
      .close svg { width: 0.7em; height: 0.7em; }
      .close[hidden] { display: none; }

      @media (prefers-reduced-motion: reduce) {
        .frame { transition: none; }
      }
      @media (forced-colors: active) {
        .alert { border-color: CanvasText; }
        .icon { color: CanvasText; }
      }
    </style>
    <div class="frame"><div class="clip">
      <div class="alert" part="alert">
        <span class="icon" part="icon"><slot name="icon"><span class="default-icon"></span></slot></span>
        <div class="body">
          <div class="title" part="title" hidden><slot name="title"><span class="heading"></span></slot></div>
          <div class="message" part="message"><slot></slot></div>
        </div>
        <button class="close" part="close" type="button" hidden><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      </div>
    </div></div>
  `;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** "8000ms", "8s", "8000" → milliseconds. */
  function toMs(value) {
    const v = String(value).trim();
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return NaN;
    return /[^m]s$/.test(v) ? n * 1000 : n;
  }

  class KakaoAlert extends HTMLElement {
    static get observedAttributes() {
      return ['tone', 'heading', 'dismissible', 'close-label', 'duration', 'no-icon', 'hidden'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._frame = shadow.querySelector('.frame');
      this._alert = shadow.querySelector('.alert');
      this._iconBox = shadow.querySelector('.icon');
      this._defaultIcon = shadow.querySelector('.default-icon');
      this._title = shadow.querySelector('.title');
      this._heading = shadow.querySelector('.heading');
      this._titleSlot = shadow.querySelector('slot[name="title"]');
      this._close = shadow.querySelector('.close');

      this._ownsRole = null;   // decided on first connect
      this._timer = 0;
      this._remaining = 0;     // ms left; 0 = no timer
      this._deadline = 0;
      this._hover = false;
      this._closing = false;
      this._selfHidden = false;
      this._focusOrigin = null;

      this._close.addEventListener('click', () => this._requestHide('close'));
      this._titleSlot.addEventListener('slotchange', () => this._renderTitle());

      this.addEventListener('pointerenter', () => { this._hover = true; this._syncPause(); });
      this.addEventListener('pointerleave', () => { this._hover = false; this._syncPause(); });
      this.addEventListener('focusin', (e) => {
        const from = e.relatedTarget;
        if (from && !this.contains(from) && from !== this) this._focusOrigin = from;
        this._syncPause();
      });
      // focus-within is only settled once focusout is over.
      this.addEventListener('focusout', () => queueMicrotask(() => this._syncPause()));
      this._onVisibility = () => this._syncPause();
    }

    connectedCallback() {
      if (this._ownsRole === null) this._ownsRole = !this.hasAttribute('role');
      document.addEventListener('visibilitychange', this._onVisibility);
      this._render();
      this._startTimer();
    }

    disconnectedCallback() {
      document.removeEventListener('visibilitychange', this._onVisibility);
      this._stopTimer();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || oldValue === newValue) return;
      if (name === 'hidden') {
        if (this._selfHidden) return;
        // Hidden or shown by the page: stop, or start over.
        if (newValue === null) { this._cancelClosing(); this._startTimer(); } else this._stopTimer();
        return;
      }
      this._render();
      if (name === 'duration' || name === 'tone') this._startTimer();
    }

    /* ------------------------------ API ------------------------------- */

    /** The tone in use: info, success, warning or danger. */
    get tone() {
      const raw = (this.getAttribute('tone') || '').trim().toLowerCase();
      const tone = ALIASES[raw] || raw;
      return TONES.includes(tone) ? tone : 'info';
    }
    set tone(value) { this.setAttribute('tone', value); }

    show() {
      const wasHidden = this.hidden || this._closing;
      this._cancelClosing();
      if (this.hidden) {
        this._selfHidden = true;
        this.hidden = false;
        this._selfHidden = false;
        if (!reducedMotion()) {
          // Start collapsed and transparent, then let the transition open it.
          this._frame.classList.add('out');
          void this._frame.offsetHeight;
          this._frame.classList.remove('out');
        }
      }
      this._startTimer();
      if (wasHidden) this._dispatch('alert-show', {});
    }

    hide() { this._requestHide('method'); }
    close() { this._requestHide('method'); }

    /* ---------------------------- Rendering --------------------------- */

    _render() {
      const tone = this.tone;
      this._alert.dataset.tone = tone;
      this._defaultIcon.innerHTML = ICONS[tone];
      this._iconBox.hidden = this.hasAttribute('no-icon');
      if (this._ownsRole) this.setAttribute('role', ASSERTIVE.includes(tone) ? 'alert' : 'status');

      const dismissible = this.hasAttribute('dismissible');
      this._close.hidden = !dismissible;
      this._close.setAttribute('aria-label', this.getAttribute('close-label') || 'Close');
      this._renderTitle();
    }

    _renderTitle() {
      const text = this.getAttribute('heading') || '';
      this._heading.textContent = text;
      this._title.hidden = !text && this._titleSlot.assignedNodes().length === 0;
    }

    /* ------------------------------ Timer ----------------------------- */

    _duration() {
      if (this.hasAttribute('duration')) {
        const ms = toMs(this.getAttribute('duration'));
        if (Number.isFinite(ms) && ms >= 0) return ms;
      }
      if (ASSERTIVE.includes(this.tone)) return 0;
      const ms = toMs(getComputedStyle(this).getPropertyValue('--_duration'));
      return Number.isFinite(ms) && ms > 0 ? ms : 8000;
    }

    _startTimer() {
      this._stopTimer();
      if (this.hidden || this._closing) return;
      this._remaining = this._duration();
      this._syncPause();
    }

    _stopTimer() {
      clearTimeout(this._timer);
      this._timer = 0;
      this._remaining = 0;
    }

    _isPaused() {
      return this._hover || this.matches(':focus-within') || document.hidden;
    }

    /** Runs the timer unless something pauses it; keeps the time left. */
    _syncPause() {
      if (this._remaining <= 0) return;
      if (this._isPaused()) {
        if (this._timer) {
          clearTimeout(this._timer);
          this._timer = 0;
          this._remaining = Math.max(1, this._deadline - Date.now());
        }
      } else if (!this._timer) {
        this._deadline = Date.now() + this._remaining;
        this._timer = setTimeout(() => {
          this._timer = 0;
          this._remaining = 0;
          this._requestHide('timeout');
        }, this._remaining);
      }
    }

    /* ------------------------------ Hiding ---------------------------- */

    _requestHide(reason) {
      if (this.hidden || this._closing) return;
      const allowed = this.dispatchEvent(new CustomEvent('alert-hide', {
        bubbles: true, composed: true, cancelable: true, detail: { reason },
      }));
      if (!allowed) return;
      if (typeof KakaoComponents !== 'undefined') KakaoComponents.emit(this, 'alert-hide', { reason });

      this._stopTimer();
      this._closing = true;
      const hadFocus = this.matches(':focus-within');
      const token = this._closeToken = {};
      const finish = () => {
        if (!this._closing || this._closeToken !== token) return;
        clearTimeout(this._fallback);
        this._frame.removeEventListener('transitionend', onEnd);
        this._closing = false;
        this._selfHidden = true;
        this.hidden = true;
        this._selfHidden = false;
        this._frame.classList.remove('out');
        if (hadFocus) this._restoreFocus();
        this._dispatch('alert-hidden', { reason });
      };
      const onEnd = (e) => { if (e.target === this._frame) finish(); };
      this._offEnd = () => this._frame.removeEventListener('transitionend', onEnd);

      if (reducedMotion() || !this.isConnected) { finish(); return; }
      const fade = toMs(getComputedStyle(this).getPropertyValue('--_fade-duration'));
      this._frame.addEventListener('transitionend', onEnd);
      this._fallback = setTimeout(finish, (Number.isFinite(fade) ? fade : 320) + 80);
      this._frame.classList.add('out');
    }

    _cancelClosing() {
      if (!this._closing) return;
      this._closing = false;
      this._closeToken = null;
      clearTimeout(this._fallback);
      if (this._offEnd) this._offEnd();
      this._frame.classList.remove('out');
    }

    _restoreFocus() {
      const origin = this._focusOrigin;
      this._focusOrigin = null;
      if (origin && origin.isConnected && typeof origin.focus === 'function') origin.focus({ preventScroll: true });
    }

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
      if (typeof KakaoComponents !== 'undefined') KakaoComponents.emit(this, name, detail);
    }
  }

  customElements.define(TAG_NAME, KakaoAlert);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, {
      triggers: ['alert-show', 'alert-hide', 'alert-hidden'],
    });
  }
})();
