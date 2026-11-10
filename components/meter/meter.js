/**
 * <kakao-meter>
 * ============================================================================
 * A gauge, like native <meter>: a measurement within a known range ("55 GB of
 * 100 GB used"). One bar, styled as a sibling of <kakao-progress>; the fill
 * colour shows whether the value is good (optimum region), so-so (suboptimal)
 * or bad (even less good), with the native low / high / optimum rules.
 * Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="meter.js"><\/script>
 *
 *   <kakao-meter label="Battery" value="0.7"></kakao-meter>
 *   <kakao-meter label="Storage" value="55" max="100" low="30" high="80"
 *                optimum="20" show-value value-text="55 GB of 100 GB"></kakao-meter>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  value       Current amount, default 0, clamped to min…max.
 *  min, max    The range, default 0 and 1 (as native). max below min = min.
 *  low, high   Region boundaries: low defaults to min (clamped to min…max),
 *              high to max (clamped to low…max).
 *  optimum     Where the best value lies, default the middle of the range.
 *              Decides which region is good, as on native <meter>:
 *                low < optimum < high: low…high good, outside so-so
 *                optimum <= low:       up to low good, up to high so-so, above bad
 *                optimum >= high:      from high good, from low so-so, below bad
 *              good = success colour, so-so = warning, bad = danger.
 *  label       Text above the bar; also the accessible name unless the page
 *              set aria-label. Without a visible label, give it aria-label.
 *  show-value  Shows the percentage of the range (or value-text) at the end
 *              of the label row, in tabular figures.
 *  value-text  Text for the value instead of the percentage; also becomes
 *              aria-valuetext ("92 GB of 100 GB, almost full").
 *  size        sm · md (default) · lg: bar height and label text size.
 *
 * ----------------------------------------------------------------------------
 * PROPERTIES
 * ----------------------------------------------------------------------------
 *  value, min, max, low, high, optimum   numbers (clamped), reflect the attributes.
 *  position    (value − min) / (max − min), 0…1 (read-only).
 *  region      "optimum" · "suboptimal" · "bad" (read-only).
 *
 * ----------------------------------------------------------------------------
 * MOTION
 * ----------------------------------------------------------------------------
 *  After the first render, the fill length slides to a new value over
 *  --kakao-meter-fill-duration (the standard motion duration,
 *  --kakao-motion-duration) with standard easing: a size change. The colour
 *  switches at once, so a region change never passes through muddy mixes.
 *  prefers-reduced-motion: at once.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  The element gets role="meter" (unless the page wrote a role),
 *  aria-valuemin, aria-valuemax, aria-valuenow and aria-valuetext from
 *  value-text. The visible label row is hidden from assistive technology, so
 *  nothing is read twice. Never focusable. The region is shown by colour
 *  only (as on native <meter>): put its meaning in value-text when it matters.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-meter-height / -sm-height / -lg-height / -radius
 *  --kakao-meter-font-size / -sm-font-size / -lg-font-size / -label-weight / -label-gap
 *  --kakao-meter-track / -label-color / -value-color
 *  --kakao-meter-success / -warning / -danger
 *  --kakao-meter-fill-duration / -fill-ease
 *
 * Parts: head, label, value, bar, fill.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-meter';
  if (customElements.get(TAG_NAME)) return;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-meter- (written by construction.html, edit there) */
        --_height: var(--kakao-meter-height, 8px);
        --_sm-height: var(--kakao-meter-sm-height, 4px);
        --_lg-height: var(--kakao-meter-lg-height, 12px);
        --_radius: var(--kakao-meter-radius, 999px);
        --_font-size: var(--kakao-meter-font-size, 0.875rem);
        --_sm-font-size: var(--kakao-meter-sm-font-size, 0.8125rem);
        --_lg-font-size: var(--kakao-meter-lg-font-size, 0.9375rem);
        --_label-weight: var(--kakao-meter-label-weight, 550);
        --_label-gap: var(--kakao-meter-label-gap, 0.4rem);
        --_track: var(--kakao-meter-track, var(--kakao-color-subtle-strong, #e6e6e8));
        --_label-color: var(--kakao-meter-label-color, var(--kakao-color-text, #18181b));
        --_value-color: var(--kakao-meter-value-color, var(--kakao-color-muted, #62626c));
        --_success: var(--kakao-meter-success, var(--kakao-color-success, #15803d));
        --_warning: var(--kakao-meter-warning, var(--kakao-color-warning, #b45309));
        --_danger: var(--kakao-meter-danger, var(--kakao-color-danger, #dc2626));
        --_fill-duration: var(--kakao-meter-fill-duration, var(--kakao-motion-duration, 320ms));
        --_fill-ease: var(--kakao-meter-fill-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
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
        --_tone: var(--_success);
        position: relative;
        height: var(--_h);
        overflow: hidden;
        border-radius: var(--_radius);
        background: var(--_track);
      }
      .bar[data-region="suboptimal"] { --_tone: var(--_warning); }
      .bar[data-region="bad"]        { --_tone: var(--_danger); }

      /* The fill slides in from the left, so its leading edge stays round. */
      .fill {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: var(--_tone);
        transform: translateX(calc((var(--p, 0) - 1) * 100%));
      }
      .bar.ready .fill {
        transition: transform var(--_fill-duration) var(--_fill-ease);
      }
      @media (prefers-reduced-motion: reduce) {
        .bar.ready .fill { transition: none; }
      }

      @media (forced-colors: active) {
        .bar { background: Canvas; outline: 1px solid CanvasText; outline-offset: -1px; }
        .fill { forced-color-adjust: none; background: Highlight; }
      }
    </style>
    <div class="head" part="head" aria-hidden="true" hidden>
      <span class="label" part="label"></span>
      <span class="value" part="value"></span>
    </div>
    <div class="bar" part="bar"><span class="fill" part="fill"></span></div>
  `;

  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  class KakaoMeter extends HTMLElement {
    static get observedAttributes() {
      return ['value', 'min', 'max', 'low', 'high', 'optimum', 'label', 'show-value', 'value-text', 'aria-label'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._head = shadow.querySelector('.head');
      this._label = shadow.querySelector('.label');
      this._valueEl = shadow.querySelector('.value');
      this._bar = shadow.querySelector('.bar');
      this._ownsRole = null;    // decided on first connect
      this._ownsLabel = null;
      this._writingLabel = false;
      this._raf = 0;
    }

    // ---------------------------------------------------------------- API

    get value() { return this._state().value; }
    set value(v) { this.setAttribute('value', String(v)); }
    get min() { return this._state().min; }
    set min(v) { this.setAttribute('min', String(v)); }
    get max() { return this._state().max; }
    set max(v) { this.setAttribute('max', String(v)); }
    get low() { return this._state().low; }
    set low(v) { this.setAttribute('low', String(v)); }
    get high() { return this._state().high; }
    set high(v) { this.setAttribute('high', String(v)); }
    get optimum() { return this._state().optimum; }
    set optimum(v) { this.setAttribute('optimum', String(v)); }
    get position() { return this._state().position; }
    get region() { return this._state().region; }

    // ---------------------------------------------------------- lifecycle

    connectedCallback() {
      if (this._ownsRole === null) {
        this._ownsRole = !this.hasAttribute('role');
        this._ownsLabel = !this.hasAttribute('aria-label');
      }
      if (this._ownsRole) this.setAttribute('role', 'meter');
      this._render();
      // Animate only changes after the first render, not the page load.
      if (!this._bar.classList.contains('ready')) {
        this._raf = requestAnimationFrame(() => {
          this._raf = requestAnimationFrame(() => { this._raf = 0; this._bar.classList.add('ready'); });
        });
      }
    }

    disconnectedCallback() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'aria-label') {
        // The page wrote its own name: from now on, leave it alone.
        if (!this._writingLabel && this._ownsLabel !== null) this._ownsLabel = false;
        return;
      }
      if (!this.isConnected || oldValue === newValue) return;
      this._render();
    }

    // ------------------------------------------------------------ reading

    _num(name, fallback) {
      const raw = this.getAttribute(name);
      if (raw === null || raw.trim() === '') return fallback;
      const n = Number(raw);
      return Number.isFinite(n) ? n : fallback;
    }

    /** The native <meter> algorithm: clamped values, position and region. */
    _state() {
      const min = this._num('min', 0);
      const max = Math.max(this._num('max', 1), min);
      const value = clamp(this._num('value', 0), min, max);
      const low = clamp(this._num('low', min), min, max);
      const high = clamp(this._num('high', max), low, max);
      const optimum = clamp(this._num('optimum', (min + max) / 2), min, max);
      const position = max > min ? (value - min) / (max - min) : 0;
      let region;
      if (low < optimum && optimum < high) {
        region = value >= low && value <= high ? 'optimum' : 'suboptimal';
      } else if (optimum <= low) {
        region = value <= low ? 'optimum' : value <= high ? 'suboptimal' : 'bad';
      } else {
        region = value >= high ? 'optimum' : value >= low ? 'suboptimal' : 'bad';
      }
      return { min, max, value, low, high, optimum, position, region };
    }

    // ------------------------------------------------------------- render

    _render() {
      const s = this._state();
      this._bar.dataset.region = s.region;
      this._bar.style.setProperty('--p', s.position.toFixed(4));

      this.setAttribute('aria-valuemin', String(s.min));
      this.setAttribute('aria-valuemax', String(s.max));
      this.setAttribute('aria-valuenow', String(+s.value.toFixed(6)));
      const custom = this.getAttribute('value-text');
      if (custom) this.setAttribute('aria-valuetext', custom);
      else this.removeAttribute('aria-valuetext');

      const label = (this.getAttribute('label') || '').trim();
      if (this._ownsLabel) {
        this._writingLabel = true;
        if (label) this.setAttribute('aria-label', label);
        else this.removeAttribute('aria-label');
        this._writingLabel = false;
      }
      let valueText = '';
      if (this.hasAttribute('show-value')) {
        if (custom) valueText = custom;
        else {
          const lang = (this.closest('[lang]') || document.documentElement).getAttribute('lang') || undefined;
          try {
            valueText = new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 0 }).format(s.position);
          } catch (e) {
            valueText = `${Math.round(s.position * 100)}%`;
          }
        }
      }
      this._label.textContent = label;
      this._valueEl.textContent = valueText;
      this._head.hidden = !label && !valueText;
    }
  }

  customElements.define(TAG_NAME, KakaoMeter);
})();
