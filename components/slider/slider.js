/**
 * @element kakao-slider
 * @version 2.0.0
 *
 * A production-ready, accessible value slider Web Component with animated
 * friction points, a numeric input, and a unit append.
 * Visual design: system-native, plain — no gradients on interactive elements,
 * no drop shadows, borders for separation.
 *
 * ---
 * ## Attributes
 *
 * | Attribute | Type    | Default | Description                                           |
 * |-----------|---------|---------|-------------------------------------------------------|
 * | min       | number  | 0       | Minimum value                                         |
 * | max       | number  | 100     | Maximum value                                         |
 * | value     | number  | 0       | Current value                                         |
 * | step      | number  | 1       | Step increment (controls friction point density)      |
 * | unit      | string  | ""      | Unit label appended to the number input (e.g. "px")   |
 * | label     | string  | "Value" | Accessible label for the slider                       |
 * | disabled  | boolean | false   | Disables all interaction                              |
 * | scroll-input | boolean | auto | When `kakao-number-input` is registered on the page, wrap
 * |              |         |      | the numeric field with it (stepper arrows). Set
 * |              |         |      | `scroll-input="false"` to force the native input.
 * |              |         |      | Set `scroll-input="true"` to prefer kakao-number-input
 * |              |         |      | (falls back to native if the component is not loaded).
 *
 * Load order when using kakao-number-input:
 *   <script src="number-input.js"><\/script>
 *   <script src="slider.js"><\/script>
 *
 * ---
 * ## CSS Custom Properties
 *
 * Set them on the element or any ancestor. Their defaults live in the settings
 * block of this file: change them on construction.html.
 *
 * | Property                  | Default                              | Description                    |
 * |---------------------------|--------------------------------------|--------------------------------|
 * | --kakao-slider-font-family          | --kakao-font-family, else system-ui  | Font family                    |
 * | --kakao-slider-accent               | #111                                 | Fill, active thumb border      |
 * | --kakao-slider-track-bg             | #e0e0e0                              | Unfilled track colour          |
 * | --kakao-slider-track-height         | 4px                                  | Track height                   |
 * | --kakao-slider-thumb-size           | 16px                                 | Thumb diameter                 |
 * | --kakao-slider-tick-color           | #ccc                                 | Friction point tick colour     |
 * | --kakao-slider-tick-active-color    | #999                                 | Tick colour behind fill        |
 * | --kakao-slider-input-bg             | #fff                                 | Number input background        |
 * | --kakao-slider-input-border         | #ccc                                 | Input / unit border colour     |
 * | --kakao-slider-unit-bg              | #f7f7f7                              | Unit badge background          |
 * | --kakao-slider-unit-color           | #555                                 | Unit badge text colour         |
 * | --kakao-slider-label-color          | #111                                 | Label text colour              |
 * | --kakao-slider-range-color          | #999                                 | Min/max range label colour     |
 * | --kakao-slider-disabled-opacity     | 0.4                                  | Opacity when disabled          |
 * | --kakao-slider-transition-speed     | 150ms                                | Thumb / fill transition speed  |
 * | --kakao-slider-range-font-size      | 11px                                 | Min/max range label size       |
 *
 * ---
 * ## Public Methods
 *
 * | Method   | Signature                     | Description                       |
 * |----------|-------------------------------|-----------------------------------|
 * | setValue | (v: number) => void           | Programmatically set the value    |
 * | setData  | (opts: SliderOptions) => void | Bulk-configure min/max/step/value |
 * | getValue | () => number                  | Return current numeric value      |
 *
 * SliderOptions: { min?, max?, step?, value?, unit?, label? }
 *
 * ---
 * ## Events
 *
 * | Event     | Detail                             | Description                    |
 * |-----------|------------------------------------|--------------------------------|
 * | slider-change | { value, min, max, step, percent } | Fired on every committed change|
 * | slider-input  | { value, min, max, step, percent } | Fired continuously while dragging |
 * | slider-focus  | { value }                          | Slider thumb received focus    |
 * | slider-blur   | { value }                          | Slider thumb lost focus        |
 *
 * ---
 * ## Usage
 *
 * ```html
 * <script src="slider.js"><\/script>
 * <kakao-slider min="0" max="200" step="10" value="60" unit="px" label="Width"></kakao-slider>
 * ```
 */

class KakaoSlider extends HTMLElement {
  static get observedAttributes() {
    return ['min', 'max', 'value', 'step', 'unit', 'label', 'disabled'];
  }

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._pending = [];
    this._initialized = false;
    this._dragging = false;
    this._animFrame = null;

    this._min   = 0;
    this._max   = 100;
    this._step  = 1;
    this._value = 0;
    this._unit  = '';
    this._label = 'Value';

    this._onTrackPointerDown = this._onTrackPointerDown.bind(this);
    this._onPointerMove      = this._onPointerMove.bind(this);
    this._onPointerUp        = this._onPointerUp.bind(this);
    this._onThumbKeyDown     = this._onThumbKeyDown.bind(this);
    this._onInputChange      = this._onInputChange.bind(this);
    this._onInputKeyDown     = this._onInputKeyDown.bind(this);
    this._onThumbFocus       = this._onThumbFocus.bind(this);
    this._onThumbBlur        = this._onThumbBlur.bind(this);
    this._onResize           = this._onResize.bind(this);
    this._onNumberInput      = this._onNumberInput.bind(this);

    this._usesNumberInput = false;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async connectedCallback() {
    this._render();
    await this._mountNumberField();
    this._bindDOM();
    this._initialized = true;
    this._syncFromAttributes();

    for (const [method, args] of this._pending) this[method](...args);
    this._pending = [];

    this._resizeObserver = new ResizeObserver(this._onResize);
    this._resizeObserver.observe(this);
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();

    this._shadow.querySelector('.track-area')
      ?.removeEventListener('pointerdown', this._onTrackPointerDown);

    const thumb = this._shadow.querySelector('.thumb');
    thumb?.removeEventListener('keydown', this._onThumbKeyDown);
    thumb?.removeEventListener('focus',   this._onThumbFocus);
    thumb?.removeEventListener('blur',    this._onThumbBlur);

    this._unbindNumberInput();

    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup',   this._onPointerUp);

    if (this._animFrame) cancelAnimationFrame(this._animFrame);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (!this._initialized) return;

    switch (name) {
      case 'min':      this._min   = this._parseNum(newVal, 0); break;
      case 'max':      this._max   = this._parseNum(newVal, 100); break;
      case 'step':     this._step  = Math.max(0.0001, this._parseNum(newVal, 1)); break;
      case 'value':    this._value = this._clamp(this._parseNum(newVal, 0)); break;
      case 'unit':     this._unit  = newVal ?? ''; break;
      case 'label':    this._label = newVal || 'Value'; break;
      case 'disabled': break; // visual handled by :host([disabled])
    }
    this._updateUI();
  }

  // ─── Rendering ──────────────────────────────────────────────────────────────

  _render() {
    this._shadow.innerHTML = `
      <style>
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        :host {
          /* @kakao-settings:start prefix=--kakao-slider- (written by construction.html, edit there) */
          --_font-family: var(--kakao-slider-font-family, var(--kakao-font-family, system-ui, -apple-system, BlinkMacSystemFont, sans-serif));
          --_accent: var(--kakao-slider-accent, #111);
          --_track-bg: var(--kakao-slider-track-bg, #e0e0e0);
          --_track-height: var(--kakao-slider-track-height, 4px);
          --_thumb-size: var(--kakao-slider-thumb-size, 16px);
          --_tick-color: var(--kakao-slider-tick-color, #ccc);
          --_tick-active-color: var(--kakao-slider-tick-active-color, #999);
          --_transition-speed: var(--kakao-slider-transition-speed, 150ms);
          --_disabled-opacity: var(--kakao-slider-disabled-opacity, 0.4);
          --_label-color: var(--kakao-slider-label-color, #111);
          --_input-bg: var(--kakao-slider-input-bg, #fff);
          --_input-border: var(--kakao-slider-input-border, #ccc);
          --_unit-bg: var(--kakao-slider-unit-bg, #f7f7f7);
          --_unit-color: var(--kakao-slider-unit-color, #555);
          --_range-color: var(--kakao-slider-range-color, #999);
          --_range-font-size: var(--kakao-slider-range-font-size, 11px);
          --_input-color: var(--kakao-slider-input-color, #111);
          --_input-font-size: var(--kakao-slider-input-font-size, 14px);
          --_thumb-bg: var(--kakao-slider-thumb-bg, #fff);
          --_thumb-border: var(--kakao-slider-thumb-border, #aaa);
          --_stepper-color: var(--kakao-slider-stepper-color, #888);
          --_stepper-hover-bg: var(--kakao-slider-stepper-hover-bg, #f0f0f0);
          --_stepper-hover-color: var(--kakao-slider-stepper-hover-color, #111);
          --_stepper-active-bg: var(--kakao-slider-stepper-active-bg, #e0e0e0);
          /* @kakao-settings:end */
          display: block;
          font-family: var(--_font-family);
          user-select: none;
          -webkit-user-select: none;
        }

        :host([disabled]) {
          opacity: var(--_disabled-opacity);
          pointer-events: none;
        }

        /* ── Layout ── */
        .root {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        /* ── Header row: label + input ── */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .slider-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--_label-color);
          line-height: 1;
        }

        /* ── Number input + unit badge ── */
        .input-wrap {
          display: flex;
          align-items: stretch;
          border: 1px solid var(--_input-border);
          border-radius: 3px;
          background: var(--_input-bg);
          overflow: hidden;
          /* no box-shadow */
        }

        .input-wrap:focus-within {
          outline: 2px solid var(--_accent);
          outline-offset: 0px;
        }

        .number-input {
          width: 56px;
          padding: 4px 6px;
          border: none;
          background: transparent;
          font-family: inherit;
          font-size: var(--_input-font-size);
          font-weight: 400;
          color: var(--_input-color);
          text-align: right;
          -moz-appearance: textfield;
          outline: none;
          cursor: text;
        }

        .number-input::-webkit-outer-spin-button,
        .number-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
        }

        .unit-badge {
          display: flex;
          align-items: center;
          padding: 0 6px;
          background: var(--_unit-bg);
          color: var(--_unit-color);
          font-size: 11px;
          font-weight: 400;
          border-left: 1px solid var(--_input-border);
          white-space: nowrap;
        }

        .unit-badge:empty {
          display: none;
        }

        .input-field {
          flex: 0 1 auto;
          min-width: 0;
        }

        /* kakao-number-input inside shadow (when number-input.js is on the page) */
        kakao-number-input {
          position: relative;
          display: block;
          width: 72px;
          --kakao-number-input-arrow-width: 18px;
          --kakao-number-input-input-padding-right: 22px;
          --kakao-number-input-arrow-border: var(--_input-border);
          --kakao-number-input-arrow-color: var(--_stepper-color);
          --kakao-number-input-arrow-hover-bg: var(--_stepper-hover-bg);
          --kakao-number-input-arrow-hover-color: var(--_stepper-hover-color);
          --kakao-number-input-arrow-active-bg: var(--_stepper-active-bg);
          --kakao-number-input-input-radius: 0;
          --kakao-number-input-font-size: var(--_input-font-size);
        }

        kakao-number-input input[type="number"]::-webkit-inner-spin-button,
        kakao-number-input input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        kakao-number-input input[type="number"] {
          -moz-appearance: textfield;
          appearance: textfield;
          width: 100%;
          padding: 4px 6px;
          padding-right: var(--kakao-number-input-input-padding-right);
          border: none;
          background: transparent;
          font-family: inherit;
          font-size: var(--_input-font-size);
          font-weight: 400;
          color: var(--_input-color);
          text-align: right;
          outline: none;
          cursor: text;
          box-sizing: border-box;
          border-radius: 0;
        }

        kakao-number-input .kakao-number-input-arrows {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: var(--kakao-number-input-arrow-width);
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--kakao-number-input-arrow-border);
          overflow: hidden;
        }

        kakao-number-input .kakao-number-input-arrows span {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 7px;
          line-height: 1;
          color: var(--kakao-number-input-arrow-color);
          cursor: pointer;
          user-select: none;
        }

        kakao-number-input .kakao-number-input-arrows span:first-child {
          border-bottom: 1px solid var(--kakao-number-input-arrow-border);
        }

        kakao-number-input .kakao-number-input-arrows span:hover {
          background: var(--kakao-number-input-arrow-hover-bg);
          color: var(--kakao-number-input-arrow-hover-color);
        }

        kakao-number-input .kakao-number-input-arrows span:active {
          background: var(--kakao-number-input-arrow-active-bg);
        }

        /* ── Track area ── */
        .track-area {
          position: relative;
          /* height = thumb + room for ticks below */
          height: calc(var(--_thumb-size) + 12px);
          cursor: pointer;
          touch-action: none;
          /* horizontal padding keeps thumb within bounds */
          padding: 0 calc(var(--_thumb-size) / 2);
        }

        /* The flat track bar */
        .track-bg {
          position: absolute;
          left:  calc(var(--_thumb-size) / 2);
          right: calc(var(--_thumb-size) / 2);
          top: 50%;
          height: var(--_track-height);
          /* nudge up to sit above the tick row */
          transform: translateY(-50%) translateY(-5px);
          background: var(--_track-bg);
          border-radius: 1px;
          overflow: visible; /* ticks overflow below */
          pointer-events: none;
        }

        /* Filled portion — flat colour, no gradient */
        .track-fill {
          position: absolute;
          inset: 0 auto 0 0;
          background: var(--_accent);
          border-radius: 1px;
          width: 0%;
          transition: width var(--_transition-speed) linear;
          will-change: width;
        }

        /* Strip all transitions while the user is dragging so fill,
           ticks, and thumb track the pointer with zero lag */
        .root.is-dragging .track-fill,
        .root.is-dragging .tick,
        .root.is-dragging .thumb {
          transition: none;
        }

        /* ── Friction-point ticks ── */
        .ticks {
          position: absolute;
          left:  calc(var(--_thumb-size) / 2);
          right: calc(var(--_thumb-size) / 2);
          top: 50%;
          /* sit just below the track */
          transform: translateY(-50%) translateY(5px);
          height: 8px;
          pointer-events: none;
        }

        .tick {
          position: absolute;
          top: 3px;
          width: 1px;
          height: 4px;
          background: var(--_tick-color);
          transform: translateX(-50%);
          transition: background var(--_transition-speed) linear, height var(--_transition-speed) linear;
        }

        /* Ticks the fill has passed — slightly darker */
        .tick.active {
          background: var(--_tick-active-color);
        }

        /* Tick at the exact current value — full height, accent colour */
        .tick.at-value {
          height: 6px;
          top: 1px;
          background: var(--_accent);
        }

        /* ── Thumb ── */
        .thumb {
          position: absolute;
          top: 50%;
          width:  var(--_thumb-size);
          height: var(--_thumb-size);
          /* vertical centre on the track, above ticks */
          transform: translateY(-50%) translateX(-50%) translateY(-5px);
          border-radius: 50%;
          background: var(--_thumb-bg);
          border: 1.5px solid var(--_thumb-border);
          cursor: grab;
          outline: none;
          left: 0%;
          z-index: 2;
          /* only transition position & border — no scale, no shadow */
          transition:
            left         var(--_transition-speed) linear,
            border-color var(--_transition-speed) linear;
          will-change: left;
        }

        /* Active / dragging: border goes accent, no scale */
        .thumb:active,
        .thumb[data-dragging] {
          cursor: grabbing;
          border-color: var(--_accent);
          border-width: 2px;
        }

        /* Keyboard focus ring — plain 2px outline offset */
        .thumb:focus-visible {
          outline: 2px solid var(--_accent);
          outline-offset: 2px;
        }

        /* ── Range labels ── */
        .range-labels {
          display: flex;
          justify-content: space-between;
          padding: 0 calc(var(--_thumb-size) / 2);
        }

        .range-label {
          font-size: var(--_range-font-size);
          font-weight: 400;
          color: var(--_range-color);
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
      </style>

      <div class="root" part="root">
        <div class="header">
          <span class="slider-label" part="label"></span>
          <div class="input-wrap" part="input-wrap">
            <div class="input-field" part="input-field">
              <input
                class="number-input"
                part="input"
                type="number"
                inputmode="numeric"
              />
            </div>
            <span class="unit-badge" part="unit"></span>
          </div>
        </div>

        <div
          class="track-area"
          part="track-area"
          role="none"
        >
          <div class="track-bg" part="track">
            <div class="track-fill" part="fill"></div>
          </div>
          <div class="ticks" part="ticks" aria-hidden="true"></div>
          <div
            class="thumb"
            part="thumb"
            role="slider"
            tabindex="0"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="0"
            aria-label="Value"
          ></div>
        </div>

        <div class="range-labels" aria-hidden="true">
          <span class="range-label min-label"></span>
          <span class="range-label max-label"></span>
        </div>
      </div>
    `;
  }

  _bindDOM() {
    const s = this._shadow;

    s.querySelector('.track-area').addEventListener('pointerdown', this._onTrackPointerDown);

    const thumb = s.querySelector('.thumb');
    thumb.addEventListener('keydown', this._onThumbKeyDown);
    thumb.addEventListener('focus',   this._onThumbFocus);
    thumb.addEventListener('blur',    this._onThumbBlur);

    this._bindNumberInput();
  }

  // ─── Number field (native vs kakao-number-input) ─────────────────────────────────

  _scrollInputPreference() {
    const attr = this.getAttribute('scroll-input');
    if (attr == null || attr === '') return 'auto';
    const v = attr.toLowerCase();
    if (['false', '0', 'off', 'no', 'native'].includes(v)) return 'off';
    if (['true', '1', 'on', 'yes', 'scroll'].includes(v)) return 'on';
    return 'auto';
  }

  async _mountNumberField() {
    const pref = this._scrollInputPreference();
    if (pref === 'off') {
      this._usesNumberInput = false;
      return;
    }

    if (pref === 'on') {
      try {
        if (!customElements.get('kakao-number-input')) {
          await customElements.whenDefined('kakao-number-input');
        }
      } catch {
        this._usesNumberInput = false;
        return;
      }
    }

    if (!customElements.get('kakao-number-input')) {
      this._usesNumberInput = false;
      return;
    }

    const field = this._shadow.querySelector('.input-field');
    if (!field) return;

    field.innerHTML = '';
    const sn = document.createElement('kakao-number-input');
    sn.setAttribute('size', 'sm');
    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'numeric';
    input.className = 'number-input';
    input.setAttribute('part', 'input');
    sn.appendChild(input);
    field.appendChild(sn);
    this._usesNumberInput = true;
  }

  _getNumberInput() {
    return this._shadow.querySelector('.number-input');
  }

  _bindNumberInput() {
    const input = this._getNumberInput();
    if (!input) return;
    input.addEventListener('change', this._onInputChange);
    input.addEventListener('input', this._onNumberInput);
    input.addEventListener('keydown', this._onInputKeyDown);
  }

  _unbindNumberInput() {
    const input = this._getNumberInput();
    if (!input) return;
    input.removeEventListener('change', this._onInputChange);
    input.removeEventListener('input', this._onNumberInput);
    input.removeEventListener('keydown', this._onInputKeyDown);
  }

  _onNumberInput(e) {
    const v = this._snap(parseFloat(e.target.value));
    if (!isNaN(v) && v !== this._value) {
      this._setValue(v, true);
      this._dispatch('slider-input');
    }
  }

  // ─── Attribute sync ─────────────────────────────────────────────────────────

  _syncFromAttributes() {
    this._min   = this._parseNum(this.getAttribute('min'),   0);
    this._max   = this._parseNum(this.getAttribute('max'),   100);
    this._step  = Math.max(0.0001, this._parseNum(this.getAttribute('step'), 1));
    this._value = this._clamp(this._parseNum(this.getAttribute('value'), this._min));
    this._unit  = this.getAttribute('unit')  ?? '';
    this._label = this.getAttribute('label') || 'Value';
    this._updateUI();
  }

  // ─── UI update ──────────────────────────────────────────────────────────────

  _updateUI() {
    if (!this._initialized) return;
    const s   = this._shadow;
    const pct = this._percent();

    s.querySelector('.slider-label').textContent = this._label;

    const input = this._getNumberInput();
    if (!input) return;
    input.min   = this._min;
    input.max   = this._max;
    input.step  = this._step;
    input.value = this._formatValue(this._value);
    input.setAttribute('aria-label', `${this._label} input`);

    s.querySelector('.unit-badge').textContent = this._unit;

    const thumb = s.querySelector('.thumb');
    thumb.style.left = `${pct}%`;
    thumb.setAttribute('aria-valuemin',  this._min);
    thumb.setAttribute('aria-valuemax',  this._max);
    thumb.setAttribute('aria-valuenow',  this._value);
    thumb.setAttribute('aria-label',     this._label);
    thumb.setAttribute('aria-valuetext', `${this._formatValue(this._value)}${this._unit ? ' ' + this._unit : ''}`);

    const isDisabled = this.hasAttribute('disabled');
    thumb.setAttribute('aria-disabled', isDisabled);
    input.disabled = isDisabled;
    thumb.setAttribute('tabindex', isDisabled ? '-1' : '0');

    s.querySelector('.track-fill').style.width = `${pct}%`;

    s.querySelector('.min-label').textContent = `${this._formatValue(this._min)}${this._unit}`;
    s.querySelector('.max-label').textContent = `${this._formatValue(this._max)}${this._unit}`;

    this._renderTicks();
  }

  _renderTicks() {
    const container = this._shadow.querySelector('.ticks');
    if (!container) return;

    const range    = this._max - this._min;
    const steps    = Math.round(range / this._step);
    const maxTicks = 60;

    if (steps < 2 || steps > maxTicks) {
      container.innerHTML = '';
      return;
    }

    const pct   = this._percent();
    const frags = [];
    for (let i = 0; i <= steps; i++) {
      const tickPct = (i / steps) * 100;
      const tickVal = this._min + i * this._step;
      const isActive  = tickPct <= pct;
      const isAtValue = Math.abs(tickVal - this._value) < this._step * 0.01;
      const cls = ['tick', isActive ? 'active' : '', isAtValue ? 'at-value' : ''].filter(Boolean).join(' ');
      frags.push(`<span class="${cls}" style="left:${tickPct}%"></span>`);
    }
    container.innerHTML = frags.join('');
  }

  _onResize() {
    this._renderTicks();
  }

  // ─── Value helpers ──────────────────────────────────────────────────────────

  _percent() {
    const range = this._max - this._min;
    if (range === 0) return 0;
    return Math.min(100, Math.max(0, ((this._value - this._min) / range) * 100));
  }

  _clamp(v) {
    return Math.min(this._max, Math.max(this._min, v));
  }

  _snap(v) {
    const snapped = Math.round((v - this._min) / this._step) * this._step + this._min;
    return parseFloat(this._clamp(snapped).toFixed(10));
  }

  _parseNum(val, fallback) {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  }

  _formatValue(v) {
    const decimals = this._step % 1 !== 0
      ? Math.max(0, String(this._step).replace(/^[^.]*\.?/, '').length)
      : 0;
    return parseFloat(v.toFixed(decimals));
  }

  _valueFromPointer(e) {
    const trackArea = this._shadow.querySelector('.track-area');
    // Measured, so any unit (rem, em, calc) works for the thumb size
    const thumbEl   = this._shadow.querySelector('.thumb');
    const thumbR    = (thumbEl ? thumbEl.offsetWidth : 16) / 2;
    const rect   = trackArea.getBoundingClientRect();
    const trackW = rect.width - thumbR * 2;
    const x      = Math.min(Math.max(e.clientX - rect.left - thumbR, 0), trackW);
    return this._snap(this._min + (x / trackW) * (this._max - this._min));
  }

  // ─── Event handlers ─────────────────────────────────────────────────────────

  _onTrackPointerDown(e) {
    if (this.hasAttribute('disabled')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    this._shadow.querySelector('.track-area').setPointerCapture(e.pointerId);
    this._dragging = true;
    this._shadow.querySelector('.root').classList.add('is-dragging');

    const thumb = this._shadow.querySelector('.thumb');
    thumb.setAttribute('data-dragging', '');
    thumb.focus({ preventScroll: true });

    this._setValue(this._valueFromPointer(e), true);

    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup',   this._onPointerUp);
  }

  _onPointerMove(e) {
    if (!this._dragging) return;
    if (this._animFrame) cancelAnimationFrame(this._animFrame);
    this._animFrame = requestAnimationFrame(() => {
      this._setValue(this._valueFromPointer(e), true);
      this._dispatch('slider-input');
    });
  }

  _onPointerUp() {
    if (!this._dragging) return;
    this._dragging = false;
    this._shadow.querySelector('.root').classList.remove('is-dragging');
    this._shadow.querySelector('.thumb').removeAttribute('data-dragging');
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup',   this._onPointerUp);
    this._dispatch('slider-change');
  }

  _onThumbKeyDown(e) {
    if (this.hasAttribute('disabled')) return;
    const big     = this._step * 10;
    let   changed = true;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':  this._setValue(this._snap(this._value - this._step)); break;
      case 'ArrowRight':
      case 'ArrowUp':    this._setValue(this._snap(this._value + this._step)); break;
      case 'PageDown':   this._setValue(this._snap(this._value - big)); break;
      case 'PageUp':     this._setValue(this._snap(this._value + big)); break;
      case 'Home':       this._setValue(this._min); break;
      case 'End':        this._setValue(this._max); break;
      default:           changed = false;
    }

    if (changed) {
      e.preventDefault();
      this._dispatch('slider-change');
    }
  }

  _onInputChange(e) {
    const v = this._snap(parseFloat(e.target.value));
    if (!isNaN(v)) {
      this._setValue(v);
      this._dispatch('slider-change');
    } else {
      e.target.value = this._formatValue(this._value);
    }
  }

  _onInputKeyDown(e) {
    if (e.key === 'Enter') this._getNumberInput()?.blur();
  }

  _onThumbFocus() { this._dispatch('slider-focus'); }
  _onThumbBlur()  { this._dispatch('slider-blur');  }

  // ─── Internal setValue ──────────────────────────────────────────────────────

  _setValue(v, suppressChange = false) {
    const clamped = this._snap(this._clamp(v));
    if (clamped === this._value && this._initialized) {
      this._updateUI();
      return;
    }
    this._value = clamped;
    this._updateUI();
    if (!suppressChange) this._dispatch('slider-change');
  }

  _dispatch(name) {
    const pct = this._percent();
    this.dispatchEvent(new CustomEvent(name, {
      bubbles:  true,
      composed: true,
      detail: {
        value:   this._value,
        min:     this._min,
        max:     this._max,
        step:    this._step,
        percent: parseFloat(pct.toFixed(4)),
      }
    }));
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** Programmatically set the value. */
  setValue(v) {
    if (!this._initialized) { this._pending.push(['setValue', [v]]); return; }
    this._setValue(v);
  }

  /** Return the current numeric value. */
  getValue() {
    return this._value;
  }

  /**
   * Bulk-configure the slider.
   * @param {{ min?:number, max?:number, step?:number, value?:number, unit?:string, label?:string }} opts
   */
  setData(opts = {}) {
    if (!this._initialized) { this._pending.push(['setData', [opts]]); return; }
    if (opts.min   !== undefined) this._min   = opts.min;
    if (opts.max   !== undefined) this._max   = opts.max;
    if (opts.step  !== undefined) this._step  = Math.max(0.0001, opts.step);
    if (opts.unit  !== undefined) this._unit  = opts.unit;
    if (opts.label !== undefined) this._label = opts.label;
    if (opts.value !== undefined) this._value = this._clamp(opts.value);
    this._updateUI();
  }
}

if (!customElements.get('kakao-slider')) {
  customElements.define('kakao-slider', KakaoSlider);
}
