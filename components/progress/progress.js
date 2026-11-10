/**
 * <kakao-progress>
 * ============================================================================
 * A segmented progress bar: "Uploading 3 of 8", "Step 2 of 4". The value fills
 * the segments in order; when the fill completes a segment, that segment
 * gives a short squash-and-stretch pop. Without a value it is indeterminate:
 * a highlight sweeps through the segments. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="progress.js"><\/script>
 *
 *   <kakao-progress label="Uploading" value="0.4"></kakao-progress>
 *   <kakao-progress label="Step 2 of 4" value="2" max="4" show-value></kakao-progress>
 *   <kakao-progress segments="1" value="62" max="100" aria-label="Storage"></kakao-progress>
 *   <kakao-progress label="Loading"></kakao-progress>        (indeterminate)
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  value       Current amount, clamped to 0…max. Missing or not a number =
 *              indeterminate.
 *  max         Positive number, default 1 (as on native <progress>).
 *  segments    Number of segments, 1…100, default 4. "1" = one plain bar.
 *  label       Text above the bar; also the accessible name unless the page
 *              set aria-label. Without a visible label, give it aria-label.
 *  show-value  Shows the percentage (or value-text) at the end of the label
 *              row, in tabular figures.
 *  value-text  Text for the value instead of the percentage; also becomes
 *              aria-valuetext. Shown while indeterminate too.
 *  size        sm · md (default) · lg: bar height and label text size.
 *  tone        primary (default) · success · warning · danger ("error" is an
 *              alias of danger). Colours the fill.
 *
 * ----------------------------------------------------------------------------
 * PROPERTIES
 * ----------------------------------------------------------------------------
 *  value       number, or null while indeterminate. Setting null removes the
 *              attribute (indeterminate).
 *  max, segments   numbers, reflect the attributes.
 *  position    value / max (0…1), or -1 while indeterminate (read-only).
 *
 * ----------------------------------------------------------------------------
 * MOTION AND THE POP RULE
 * ----------------------------------------------------------------------------
 *  A new value is reached by a smooth fill (--kakao-progress-fill-duration,
 *  standard easing), segment after segment, up or down. A change that
 *  completes several segments takes longer (half a fill duration per extra
 *  segment, at most 2.5×) so it reads as a sequence.
 *  When the moving fill reaches the end of a segment, that segment pops: it
 *  stretches, squashes, rebounds a little and settles (keyframes, each leg
 *  on the standard easing: a size change, so not spring). Pops are at least
 *  --kakao-progress-pop-stagger apart.
 *  A segment pops once per fill: after its pop it only pops again once the
 *  value has dropped to or below the segment's start (it emptied). Segments
 *  that are already full on the first render, when the bar leaves the
 *  indeterminate state, or when max or segments change, never pop. Going
 *  down never pops.
 *  prefers-reduced-motion: the value shows at once, no pop, and the
 *  indeterminate sweep becomes a slow fade in place.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  The element gets role="progressbar" (unless the page wrote a role),
 *  aria-valuemin="0", aria-valuemax, aria-valuenow (removed while
 *  indeterminate) and aria-valuetext from value-text. The visible label row
 *  is hidden from assistive technology, so nothing is read twice. Never
 *  focusable.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  progress-segment-complete  { index, segments, value }
 *      A segment completed by an increasing value: when its pop plays, or at
 *      once under reduced motion. Same rule as the pop, so never twice per
 *      fill. Also emitted as a trigger (shared/component-api.js).
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-progress-height / -sm-height / -lg-height / -gap / -radius
 *  --kakao-progress-font-size / -sm-font-size / -lg-font-size / -label-weight / -label-gap
 *  --kakao-progress-track / -label-color / -value-color
 *  --kakao-progress-primary / -success / -warning / -danger
 *  --kakao-progress-fill-duration / -fill-ease
 *  --kakao-progress-pop-duration / -pop-ease / -pop-scale / -pop-stagger
 *  --kakao-progress-sweep-duration / -sweep-ease
 *
 * Parts: head, label, value, bar, segment, fill.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-progress';
  if (customElements.get(TAG_NAME)) return;

  const TONES = ['primary', 'success', 'warning', 'danger'];
  const ALIASES = { error: 'danger' };
  const MAX_SEGMENTS = 100;
  const EPS = 1e-9;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-progress- (written by construction.html, edit there) */
        --_height: var(--kakao-progress-height, 8px);
        --_sm-height: var(--kakao-progress-sm-height, 4px);
        --_lg-height: var(--kakao-progress-lg-height, 12px);
        --_gap: var(--kakao-progress-gap, 4px);
        --_radius: var(--kakao-progress-radius, 999px);
        --_font-size: var(--kakao-progress-font-size, 0.875rem);
        --_sm-font-size: var(--kakao-progress-sm-font-size, 0.8125rem);
        --_lg-font-size: var(--kakao-progress-lg-font-size, 0.9375rem);
        --_label-weight: var(--kakao-progress-label-weight, 550);
        --_label-gap: var(--kakao-progress-label-gap, 0.4rem);
        --_track: var(--kakao-progress-track, var(--kakao-color-subtle-strong, #e6e6e8));
        --_label-color: var(--kakao-progress-label-color, var(--kakao-color-text, #18181b));
        --_value-color: var(--kakao-progress-value-color, var(--kakao-color-muted, #62626c));
        --_primary: var(--kakao-progress-primary, var(--kakao-color-primary, #4f46e5));
        --_success: var(--kakao-progress-success, var(--kakao-color-success, #15803d));
        --_warning: var(--kakao-progress-warning, var(--kakao-color-warning, #b45309));
        --_danger: var(--kakao-progress-danger, var(--kakao-color-danger, #dc2626));
        --_fill-duration: var(--kakao-progress-fill-duration, var(--kakao-motion-duration, 320ms));
        --_fill-ease: var(--kakao-progress-fill-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        --_pop-duration: var(--kakao-progress-pop-duration, 420ms);
        --_pop-ease: var(--kakao-progress-pop-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        --_pop-scale: var(--kakao-progress-pop-scale, 1.6);
        --_pop-stagger: var(--kakao-progress-pop-stagger, 70ms);
        --_sweep-duration: var(--kakao-progress-sweep-duration, 1600ms);
        --_sweep-ease: var(--kakao-progress-sweep-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        --_h: var(--_height);
        display: block;
        font-size: var(--_font-size);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) { --_h: var(--_sm-height); font-size: var(--_sm-font-size); }
      :host([size="lg"]) { --_h: var(--_lg-height); font-size: var(--_lg-font-size); }

      .head {
        display: flex;
        align-items: baseline;
        gap: 0.75rem;
        margin-bottom: var(--_label-gap);
        font-family: inherit;
        line-height: 1.4;
      }
      .head[hidden] { display: none; }
      .label { min-width: 0; color: var(--_label-color); font-weight: var(--_label-weight); overflow-wrap: anywhere; }
      .value {
        margin-left: auto;
        color: var(--_value-color);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }

      .bar {
        --_tone: var(--_primary);
        display: flex;
        gap: var(--_gap);
        height: var(--_h);
      }
      .bar[data-tone="success"] { --_tone: var(--_success); }
      .bar[data-tone="warning"] { --_tone: var(--_warning); }
      .bar[data-tone="danger"]  { --_tone: var(--_danger); }

      .seg {
        position: relative;
        flex: 1 1 0;
        min-width: 0;
        overflow: hidden;
        border-radius: var(--_radius);
        background: var(--_track);
      }
      /* The fill slides in from the left, so its leading edge stays round. */
      .fill {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: var(--_tone);
        transform: translateX(calc((var(--f, 0) - 1) * 100%));
      }

      /* Indeterminate: every segment's fill is as wide as the whole bar and
         shifted back by the segment's position, so one band sliding across
         all of them reads as a single highlight passing through the gaps. */
      .bar.indeterminate .fill {
        inset: 0 auto;
        left: calc(var(--i) * -1 * (100% + var(--_gap)));
        width: calc(var(--n) * 100% + (var(--n) - 1) * var(--_gap));
        border-radius: 0;
        background: none;
        transform: none;
      }
      .bar.indeterminate .fill::before {
        content: "";
        position: absolute;
        inset: 0 auto 0 0;
        width: 40%;
        border-radius: var(--_radius);
        background: var(--_tone);
        animation: sweep var(--_sweep-duration) var(--_sweep-ease) infinite;
      }
      @keyframes sweep {
        from { transform: translateX(-100%); }
        to   { transform: translateX(250%); }
      }

      @media (prefers-reduced-motion: reduce) {
        .bar.indeterminate .fill::before {
          width: 100%;
          transform: none;
          animation: breathe 2400ms ease-in-out infinite alternate;
        }
        @keyframes breathe {
          from { opacity: 0.25; }
          to   { opacity: 0.6; }
        }
      }

      @media (forced-colors: active) {
        .seg { background: Canvas; outline: 1px solid CanvasText; outline-offset: -1px; }
        .fill, .bar.indeterminate .fill::before { forced-color-adjust: none; background: Highlight; }
        .bar.indeterminate .fill { background: none; }
      }
    </style>
    <div class="head" part="head" aria-hidden="true" hidden>
      <span class="label" part="label"></span>
      <span class="value" part="value"></span>
    </div>
    <div class="bar" part="bar"></div>
  `;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** "320ms", "0.3s" → milliseconds. */
  function toMs(value, fallback) {
    const v = String(value).trim();
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return fallback;
    return /[^m]s$/.test(v) ? n * 1000 : n;
  }

  const KEYWORDS = {
    linear: [0, 0, 1, 1], ease: [0.25, 0.1, 0.25, 1], 'ease-in': [0.42, 0, 1, 1],
    'ease-out': [0, 0, 0.58, 1], 'ease-in-out': [0.42, 0, 0.58, 1],
  };
  const STANDARD = [0.2, 0, 0, 1];

  /** A CSS easing → function of time 0…1. Only cubic-bezier() and keywords. */
  function easing(css) {
    const v = String(css).trim();
    const m = v.match(/^cubic-bezier\(([^)]+)\)$/);
    let p = KEYWORDS[v] || (m && m[1].split(',').map(Number));
    if (!p || p.length !== 4 || p.some((n) => !Number.isFinite(n))) p = STANDARD;
    const [x1, y1, x2, y2] = p;
    const bez = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
    const dbez = (t, a, b) => 3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t * t;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let k = 0; k < 6; k++) {          // Newton
        const d = dbez(t, x1, x2);
        if (Math.abs(d) < 1e-6) break;
        t -= (bez(t, x1, x2) - x) / d;
      }
      if (!(t >= 0 && t <= 1) || Math.abs(bez(t, x1, x2) - x) > 1e-4) {
        let lo = 0, hi = 1;                   // bisection fallback
        for (let k = 0; k < 30; k++) { t = (lo + hi) / 2; if (bez(t, x1, x2) < x) lo = t; else hi = t; }
      }
      return bez(t, y1, y2);
    };
  }

  class KakaoProgress extends HTMLElement {
    static get observedAttributes() {
      return ['value', 'max', 'segments', 'label', 'show-value', 'value-text', 'tone', 'aria-label'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._head = shadow.querySelector('.head');
      this._label = shadow.querySelector('.label');
      this._valueEl = shadow.querySelector('.value');
      this._bar = shadow.querySelector('.bar');

      this._segs = [];          // segment elements
      this._armed = [];         // may this segment pop?
      this._n = 0;
      this._max = NaN;
      this._shown = null;       // position the fill is drawn at (0…1), null = indeterminate
      this._target = null;      // position it is heading for
      this._raf = 0;
      this._anim = null;        // { from, to, t0, dur, ease }
      this._lastPop = -Infinity;
      this._popTimers = new Set();
      this._ownsRole = null;    // decided on first connect
      this._ownsLabel = null;
      this._writingLabel = false;
    }

    // ---------------------------------------------------------------- API

    get value() {
      const p = this._position();
      return p < 0 ? null : p * this._readMax();
    }
    set value(v) {
      if (v === null || v === undefined || v === '') this.removeAttribute('value');
      else this.setAttribute('value', String(v));
    }
    get max() { return this._readMax(); }
    set max(v) { this.setAttribute('max', String(v)); }
    get segments() { return this._readSegments(); }
    set segments(v) { this.setAttribute('segments', String(v)); }
    get position() { return this._position(); }

    // ---------------------------------------------------------- lifecycle

    connectedCallback() {
      if (this._ownsRole === null) {
        this._ownsRole = !this.hasAttribute('role');
        this._ownsLabel = !this.hasAttribute('aria-label');
      }
      if (this._ownsRole) this.setAttribute('role', 'progressbar');
      this._renderText();
      this._sync(true);
    }

    disconnectedCallback() {
      this._stop();
      this._popTimers.forEach(clearTimeout);
      this._popTimers.clear();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'aria-label') {
        // The page wrote its own name: from now on, leave it alone.
        if (!this._writingLabel && this._ownsLabel !== null) this._ownsLabel = false;
        return;
      }
      if (!this.isConnected || oldValue === newValue) return;
      if (name === 'value' || name === 'max' || name === 'segments') this._sync(false);
      else this._renderText();
    }

    // ------------------------------------------------------------ reading

    _readMax() {
      const m = parseFloat(this.getAttribute('max'));
      return Number.isFinite(m) && m > 0 ? m : 1;
    }

    _readSegments() {
      const n = Number(this.getAttribute('segments'));
      return this.hasAttribute('segments') && Number.isInteger(n) && n >= 1 ? Math.min(n, MAX_SEGMENTS) : 4;
    }

    /** value / max in 0…1, or -1 when indeterminate. */
    _position() {
      if (!this.hasAttribute('value')) return -1;
      const raw = this.getAttribute('value').trim();
      const v = raw === '' ? NaN : Number(raw);
      if (!Number.isFinite(v)) return -1;
      return Math.min(Math.max(v / this._readMax(), 0), 1);
    }

    _tone() {
      const t = (this.getAttribute('tone') || '').trim().toLowerCase();
      const tone = ALIASES[t] || t;
      return TONES.includes(tone) ? tone : 'primary';
    }

    _css(name) { return getComputedStyle(this).getPropertyValue(name).trim(); }

    // ------------------------------------------------------------- render

    _buildSegments(n) {
      this._stop();
      this._bar.textContent = '';
      this._segs = [];
      for (let i = 0; i < n; i++) {
        const seg = document.createElement('span');
        seg.className = 'seg';
        seg.setAttribute('part', 'segment');
        seg.style.setProperty('--i', i);
        const fill = document.createElement('span');
        fill.className = 'fill';
        fill.setAttribute('part', 'fill');
        seg.append(fill);
        this._segs.push(seg);
        this._bar.append(seg);
      }
      this._bar.style.setProperty('--n', n);
      this._n = n;
    }

    _draw(p) {
      const n = this._n;
      for (let i = 0; i < n; i++) {
        const f = Math.min(Math.max(p * n - i, 0), 1);
        this._segs[i].style.setProperty('--f', f.toFixed(4));
      }
    }

    _isFull(i, p) { return p >= (i + 1) / this._n - EPS; }

    /** Arm and disarm without popping: full segments count as popped. */
    _baseline(p) {
      this._armed = this._segs.map((_, i) => !this._isFull(i, p));
    }

    _sync(initial) {
      const n = this._readSegments();
      const max = this._readMax();
      const p = this._position();
      const structural = initial || n !== this._n || max !== this._max;
      if (n !== this._n) this._buildSegments(n);
      this._max = max;
      this._bar.dataset.tone = this._tone();
      this._renderAria(p);
      this._renderText();

      if (p < 0) {                                      // indeterminate
        this._stop();
        this._target = this._shown = null;
        this._bar.classList.add('indeterminate');
        return;
      }
      this._bar.classList.remove('indeterminate');

      const fresh = structural || this._shown === null;
      this._target = p;
      if (fresh || reducedMotion()) {
        const from = this._shown;
        this._stop();
        this._shown = p;
        this._draw(p);
        if (fresh) { this._baseline(p); return; }
        // Reduced motion: same rule, no pop and no fill animation.
        this._rearm(p);
        if (from !== null && p > from) this._completeUpTo(p);
        return;
      }

      this._rearm(p);
      this._animate(this._shown, p);
    }

    /** A segment the value dropped to or below the start of may pop again. */
    _rearm(p) {
      for (let i = 0; i < this._n; i++) if (p <= i / this._n + EPS) this._armed[i] = true;
    }

    /** Pops every armed segment the shown value has filled (only while the target is past it too). */
    _completeUpTo(s) {
      const target = this._target;
      for (let i = 0; i < this._n; i++) {
        if (this._armed[i] && this._isFull(i, s) && this._isFull(i, target)) {
          this._armed[i] = false;
          this._queuePop(i);
        }
      }
    }

    _animate(from, to) {
      if (Math.abs(to - from) < EPS) { this._stop(); this._shown = to; this._draw(to); return; }
      let crossings = 0;
      if (to > from) {
        for (let i = 0; i < this._n; i++) if (this._armed[i] && this._isFull(i, to) && !this._isFull(i, from)) crossings++;
      }
      const base = toMs(this._css('--_fill-duration'), 320);
      const dur = base * Math.min(2.5, 1 + 0.5 * Math.max(0, crossings - 1));
      this._anim = { from, to, t0: performance.now(), dur, ease: easing(this._css('--_fill-ease')) };
      if (!this._raf) this._raf = requestAnimationFrame((t) => this._step(t));
    }

    _step(now) {
      this._raf = 0;
      const a = this._anim;
      if (!a) return;
      const t = a.dur > 0 ? Math.min((now - a.t0) / a.dur, 1) : 1;
      const s = Math.min(Math.max(a.from + (a.to - a.from) * a.ease(Math.max(t, 0)), 0), 1);
      this._shown = t >= 1 ? a.to : s;
      this._draw(this._shown);
      if (a.to > a.from) this._completeUpTo(this._shown);
      if (t >= 1) { this._anim = null; return; }
      this._raf = requestAnimationFrame((tt) => this._step(tt));
    }

    _stop() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
      this._anim = null;
    }

    _queuePop(i) {
      const seg = this._segs[i];
      const detail = { index: i, segments: this._n, value: this.value };
      if (reducedMotion()) { this._dispatch('progress-segment-complete', detail); return; }
      const now = performance.now();
      const stagger = toMs(this._css('--_pop-stagger'), 70);
      const at = Math.max(now, this._lastPop + stagger);
      this._lastPop = at;
      const fire = () => {
        if (!seg.isConnected) return;
        this._pop(seg);
        this._dispatch('progress-segment-complete', detail);
      };
      if (at <= now) { fire(); return; }
      const id = setTimeout(() => { this._popTimers.delete(id); fire(); }, at - now);
      this._popTimers.add(id);
    }

    _pop(seg) {
      if (typeof seg.animate !== 'function') return;
      const scale = parseFloat(this._css('--_pop-scale')) || 1.6;
      const ease = this._css('--_pop-ease') || 'ease-out';
      const rest = 'translateY(0) scale(1, 1)';
      // Stretch, squash, a small rebound, settle: the squash and stretch
      // lives in the keyframes, each leg on the standard easing.
      const squash = 1 - (scale - 1) * 0.35;
      const rebound = 1 + (scale - 1) * 0.1;
      seg.animate([
        { transform: rest, easing: ease },
        { offset: 0.28, transform: `translateY(-1px) scale(1, ${scale})`, easing: ease },
        { offset: 0.58, transform: `translateY(0) scale(1, ${squash})`, easing: ease },
        { offset: 0.8, transform: `translateY(0) scale(1, ${rebound})`, easing: ease },
        { transform: rest },
      ], { duration: toMs(this._css('--_pop-duration'), 420) });
    }

    _renderAria(p) {
      this.setAttribute('aria-valuemin', '0');
      this.setAttribute('aria-valuemax', String(this._readMax()));
      if (p < 0) this.removeAttribute('aria-valuenow');
      else this.setAttribute('aria-valuenow', String(+(p * this._readMax()).toFixed(6)));
      const text = this.getAttribute('value-text');
      if (text) this.setAttribute('aria-valuetext', text);
      else this.removeAttribute('aria-valuetext');
    }

    _renderText() {
      const label = (this.getAttribute('label') || '').trim();
      if (this._ownsLabel) {
        this._writingLabel = true;
        if (label) this.setAttribute('aria-label', label);
        else this.removeAttribute('aria-label');
        this._writingLabel = false;
      }
      const p = this._position();
      const custom = this.getAttribute('value-text');
      let valueText = '';
      if (this.hasAttribute('show-value')) {
        if (custom) valueText = custom;
        else if (p >= 0) {
          const lang = (this.closest('[lang]') || document.documentElement).getAttribute('lang') || undefined;
          try {
            valueText = new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 0 }).format(p);
          } catch (e) {
            valueText = `${Math.round(p * 100)}%`;
          }
        }
      }
      this._label.textContent = label;
      this._valueEl.textContent = valueText;
      this._head.hidden = !label && !valueText;
      this._renderAria(p);
      if (this._bar) this._bar.dataset.tone = this._tone();
    }

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
      if (typeof KakaoComponents !== 'undefined') KakaoComponents.emit(this, name, detail);
    }
  }

  customElements.define(TAG_NAME, KakaoProgress);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, {
      triggers: ['progress-segment-complete'],
    });
  }
})();
