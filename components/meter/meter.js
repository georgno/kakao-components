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
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        A measurement in a known range ("55 GB of 100 GB used"), or on a scale of named bands (BMI).
 *  not for    The progress of a task: kakao-progress.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     meter.js
 *  css        none
 *  requires   none
 *  enhanced   none
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
 *   Named bands (a scale with categories), drawn under the bar:
 *   <kakao-meter label="BMI" min="10" max="40" value="23.1" show-value list-data='[
 *     {"to": 18.5, "label": "Underweight", "tone": "warning"},
 *     {"to": 25,   "label": "Normal",      "tone": "success"},
 *     {"to": 30,   "label": "Overweight",  "tone": "warning"},
 *     {"label": "Obese", "tone": "danger"}]'></kakao-meter>
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
 *  list-data   JSON array of bands (never "data"), in order from min:
 *              [{ "to": 18.5, "label": "Underweight", "tone": "warning" }, …]
 *              A band runs from the previous band's "to" (or min) up to its
 *              own "to", which it does not include; the last band's "to"
 *              defaults to max and includes it. tone: neutral (default) ·
 *              primary · success · warning · danger. With bands the fill takes
 *              the tone of the band the value is in (low, high and optimum are
 *              ignored), the bar gets a mark at each boundary, and under it go
 *              the boundary values and the band names, the current one in
 *              weight. aria-valuetext becomes "23.1, Normal" (value-text still
 *              wins), and show-value shows the band name. A band without "to"
 *              before the last, or a "to" not above the one before, is dropped.
 *              Without list-data nothing changes.
 *
 * ----------------------------------------------------------------------------
 * PROPERTIES
 * ----------------------------------------------------------------------------
 *  value, min, max, low, high, optimum   numbers (clamped), reflect the attributes.
 *  position    (value − min) / (max − min), 0…1 (read-only).
 *  region      "optimum" · "suboptimal" · "bad" (read-only).
 *  band        The band the value is in, { index, label, tone, from, to }, or
 *              null without list-data (read-only).
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
 *  With list-data the band name is in aria-valuetext by default, and the
 *  scale under the bar is hidden from assistive technology.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-meter-height / -sm-height / -lg-height / -radius
 *  --kakao-meter-font-size / -sm-font-size / -lg-font-size / -label-weight / -label-gap
 *  --kakao-meter-track / -label-color / -value-color
 *  --kakao-meter-success / -warning / -danger / -primary / -neutral
 *  --kakao-meter-mark-color / -mark-width / -scale-gap / -scale-font-size / -scale-color
 *  --kakao-meter-fill-duration / -fill-ease
 *
 * Parts: head, label, value, bar, fill, scale, ticks, names.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
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
        --_radius: var(--kakao-meter-radius, var(--kakao-radius-pill, 999px));
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
        --_primary: var(--kakao-meter-primary, var(--kakao-color-primary, #2563eb));
        --_neutral: var(--kakao-meter-neutral, var(--kakao-color-muted, #62626c));
        --_mark-color: var(--kakao-meter-mark-color, var(--kakao-color-bg, #ffffff));
        --_mark-width: var(--kakao-meter-mark-width, 2px);
        --_scale-gap: var(--kakao-meter-scale-gap, 0.35rem);
        --_scale-font-size: var(--kakao-meter-scale-font-size, 0.8125em);
        --_scale-color: var(--kakao-meter-scale-color, var(--kakao-color-muted, #62626c));
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
      .bar[data-tone="success"] { --_tone: var(--_success); }
      .bar[data-tone="warning"] { --_tone: var(--_warning); }
      .bar[data-tone="danger"]  { --_tone: var(--_danger); }
      .bar[data-tone="primary"] { --_tone: var(--_primary); }
      .bar[data-tone="neutral"] { --_tone: var(--_neutral); }

      /* Bands: a gap in the bar at each boundary, values and names under it. */
      .mark {
        position: absolute;
        top: 0;
        bottom: 0;
        width: var(--_mark-width);
        margin-left: calc(var(--_mark-width) / -2);
        background: var(--_mark-color);
      }
      .scale {
        margin-top: var(--_scale-gap);
        font-size: var(--_scale-font-size);
        line-height: 1.35;
        color: var(--_scale-color);
      }
      .scale[hidden] { display: none; }
      .ticks { position: relative; height: 1.35em; font-variant-numeric: tabular-nums; }
      .ticks span { position: absolute; top: 0; transform: translateX(-50%); white-space: nowrap; }
      .names { display: grid; }
      /* Columns follow the band widths but never get narrower than a name's
         longest word (minmax(min-content, …fr)): names wrap between words, not inside one. */
      .names span { padding: 0 0.15rem; text-align: center; }
      .names span[aria-current] { color: var(--_label-color); font-weight: var(--_label-weight); }

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
        .mark { forced-color-adjust: none; background: CanvasText; }
      }
    </style>
    <div class="head" part="head" aria-hidden="true" hidden>
      <span class="label" part="label"></span>
      <span class="value" part="value"></span>
    </div>
    <div class="bar" part="bar"><span class="fill" part="fill"></span></div>
    <div class="scale" part="scale" aria-hidden="true" hidden>
      <div class="ticks" part="ticks"></div>
      <div class="names" part="names"></div>
    </div>
  `;

  const TONES = ['neutral', 'primary', 'success', 'warning', 'danger'];

  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  class KakaoMeter extends HTMLElement {
    static get observedAttributes() {
      return ['value', 'min', 'max', 'low', 'high', 'optimum', 'label', 'show-value', 'value-text', 'aria-label', 'list-data'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._head = shadow.querySelector('.head');
      this._label = shadow.querySelector('.label');
      this._valueEl = shadow.querySelector('.value');
      this._bar = shadow.querySelector('.bar');
      this._scale = shadow.querySelector('.scale');
      this._ticks = shadow.querySelector('.ticks');
      this._names = shadow.querySelector('.names');
      this._bandsKey = null;
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
    get band() {
      const s = this._state();
      const b = s.bands[s.bandIndex];
      return b ? { index: s.bandIndex, label: b.label, tone: b.tone, from: b.from, to: b.to } : null;
    }

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
      const bands = this._bands({ min, max });
      let bandIndex = -1;
      if (bands.length) {
        bandIndex = bands.findIndex((b, i) => value < b.to || i === bands.length - 1);
      }
      return { min, max, value, low, high, optimum, position, region, bands, bandIndex };
    }

    /** The bands from list-data, inside min…max: [{ label, tone, from, to }]. */
    _bands({ min, max }) {
      const raw = this.getAttribute('list-data');
      if (!raw) return [];
      let list;
      try { list = JSON.parse(raw); } catch (e) {
        if (this._warned !== raw) { this._warned = raw; console.warn('kakao-meter: list-data is not valid JSON', e); }
        return [];
      }
      if (!Array.isArray(list)) return [];
      const out = [];
      let from = min;
      list.forEach((item, i) => {
        if (!item || typeof item !== 'object' || from >= max) return;
        const last = i === list.length - 1;
        let to = item.to === undefined || item.to === null ? (last ? max : NaN) : Number(item.to);
        if (!Number.isFinite(to) || to <= from) return;
        to = Math.min(to, max);
        const tone = TONES.includes(item.tone) ? item.tone : 'neutral';
        out.push({ label: String(item.label ?? ''), tone, from, to });
        from = to;
      });
      // A list that stops short of max: its last band runs on to max.
      if (out.length) out[out.length - 1].to = max;
      return out;
    }

    _fmt(n) {
      const lang = (this.closest('[lang]') || document.documentElement).getAttribute('lang') || undefined;
      try { return new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(n); } catch (e) { return String(n); }
    }

    /** Marks in the bar and the scale under it, rebuilt only when the bands change. */
    _renderBands(s) {
      const span = s.max - s.min;
      const pct = (v) => `${(span > 0 ? ((v - s.min) / span) * 100 : 0).toFixed(4)}%`;
      const key = JSON.stringify([s.min, s.max, s.bands]);
      if (key !== this._bandsKey) {
        this._bandsKey = key;
        this._bar.querySelectorAll('.mark').forEach((m) => m.remove());
        this._ticks.textContent = '';
        this._names.textContent = '';
        s.bands.slice(0, -1).forEach((b) => {
          const mark = document.createElement('span');
          mark.className = 'mark';
          mark.style.left = pct(b.to);
          this._bar.append(mark);
          const tick = document.createElement('span');
          tick.style.left = pct(b.to);
          tick.textContent = this._fmt(b.to);
          this._ticks.append(tick);
        });
        this._names.style.gridTemplateColumns = s.bands.map((b) => `minmax(min-content, ${b.to - b.from}fr)`).join(' ');
        s.bands.forEach((b) => {
          const name = document.createElement('span');
          name.textContent = b.label;
          this._names.append(name);
        });
        this._scale.hidden = !s.bands.length;
      }
      [...this._names.children].forEach((el, i) => el.toggleAttribute('aria-current', i === s.bandIndex));
    }

    // ------------------------------------------------------------- render

    _render() {
      const s = this._state();
      const band = s.bands[s.bandIndex];
      this._bar.dataset.region = s.region;
      if (band) this._bar.dataset.tone = band.tone;
      else delete this._bar.dataset.tone;
      this._renderBands(s);
      this._bar.style.setProperty('--p', s.position.toFixed(4));

      this.setAttribute('aria-valuemin', String(s.min));
      this.setAttribute('aria-valuemax', String(s.max));
      this.setAttribute('aria-valuenow', String(+s.value.toFixed(6)));
      const custom = this.getAttribute('value-text');
      if (custom) this.setAttribute('aria-valuetext', custom);
      else if (band && band.label) this.setAttribute('aria-valuetext', `${this._fmt(s.value)}, ${band.label}`);
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
        else if (band && band.label) valueText = band.label;
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
