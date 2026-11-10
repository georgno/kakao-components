/**
 * <kakao-range-slider>
 * ============================================================================
 * A two-thumb slider that picks a span (from-to) between min and max. It
 * looks and moves like <kakao-slider>: the same track, friction-point ticks,
 * min / max labels and number fields with a unit badge; the fill runs between
 * the two thumbs. Form-associated. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="range-slider.js"><\/script>
 *
 *   <kakao-range-slider label="Price" name="price" min="0" max="500" step="10"
 *     value="100,300" unit="€" min-gap="50"></kakao-range-slider>
 *
 *   Load number-input.js first and the two number fields get stepper arrows
 *   (as on kakao-slider):
 *     <script src="number-input.js"><\/script>
 *     <script src="range-slider.js"><\/script>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  min · max     The range (default 0 · 100).
 *  step          Step (default 1). Also sets the friction points: one tick per
 *                step, drawn when there are 2 to 60 of them.
 *  value         "low,high", e.g. "20,80" (comma-separated, like
 *                kakao-select multiple). Default: "min,max". Missing or
 *                unreadable parts fall back to min / max. The values are
 *                sorted, snapped to step and kept min-gap apart. Form reset
 *                goes back to this attribute.
 *  min-gap       Smallest distance between low and high (default 0, so the
 *                thumbs may meet). Capped at max - min.
 *  unit          Unit shown in the badges and min / max labels ("px", "€").
 *  label         Visible label (default "Range").
 *  label-low · label-high   Accessible names of the thumbs and fields.
 *                Default "<label>, minimum" / "<label>, maximum".
 *  name          Form field name. Submits TWO entries under this one name,
 *                low first: price=20&price=80 (FormData.getAll('price')
 *                → ["20", "80"]). Without a name nothing is submitted.
 *  disabled      Dims the control, takes the thumbs out of the tab order.
 *  scroll-input  As on kakao-slider: "false" keeps native number fields even
 *                when kakao-number-input is on the page; "true" waits for it.
 *  touch-steppers  Always show the big | < | value | > | step buttons on both
 *                fields (they show on touch screens anyway; the fields then
 *                take their own row under the label). Hold to repeat.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value               Get / set "low,high".
 *  low · high          Get / set one end (clamped, kept apart).
 *  setValue(low, high) Set both ends.
 *  getValue()          { low, high }
 *  setData(opts)       { min?, max?, step?, low?, high?, minGap?, unit?, label? }
 *  name · disabled · form · validity · checkValidity() · reportValidity()
 *
 *  Setting values from script never fires events.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  range-slider-input   { low, high, value, min, max, step }  while dragging
 *                       or typing (with a plain `input` event).
 *  range-slider-change  { low, high, value, min, max, step }  on release, on
 *                       each key press, when a typed value is committed
 *                       (with a plain `change` event). Fires only if the
 *                       values changed.
 *  range-slider-focus   { thumb: "low" | "high", low, high }
 *  range-slider-blur    { thumb: "low" | "high", low, high }
 *
 * ----------------------------------------------------------------------------
 * POINTER AND KEYBOARD
 * ----------------------------------------------------------------------------
 *  A press anywhere on the track moves the NEARER thumb there and drags it.
 *  When both thumbs sit on the same spot, the first movement picks the thumb
 *  (left: low, right: high). Thumbs never cross; the one moved last is drawn
 *  on top.
 *  Thumbs: ← ↓ / → ↑ one step · Page Down / Up ten steps · Home / End the
 *  thumb's own limits (low: min … high - gap; high: low + gap … max).
 *  Number fields: typing moves the thumb as soon as the number is within
 *  reach; Enter or leaving the field clamps and commits it.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  - The control is a group named by the label. Each thumb is role="slider"
 *    with aria-valuenow, aria-valuetext ("20 €"), and aria-valuemin /
 *    aria-valuemax set to what it can reach (the other thumb, less the gap).
 *  - Focus: the shared 2px outline with 2px offset on the thumb.
 *  - Reduced motion: no glide. Forced colours: Highlight fill, outlined
 *    track and thumbs.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES
 * ----------------------------------------------------------------------------
 *  Defaults live in the settings block below; change them on
 *  construction.html. Every --kakao-range-slider-* setting falls back to the
 *  matching --kakao-slider-* setting, so a page that restyles the slider
 *  restyles this one too. Set the range-slider one to make them differ.
 *
 *  font-family · accent · track-bg · track-height · thumb-size · tick-color ·
 *  tick-active-color · transition-speed · disabled-opacity · label-color ·
 *  input-bg · input-border · unit-bg · unit-color · range-color ·
 *  range-font-size · input-color · input-font-size · thumb-bg · thumb-border ·
 *  stepper-color · stepper-hover-bg · stepper-hover-color ·
 *  stepper-active-bg · touch-step-size · touch-radius (the touch steppers)
 *
 *  Parts: root, label, fields, input-wrap, input, unit, step-dec, step-inc,
 *  track-area, track, fill, ticks, thumb, thumb-low, thumb-high.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-range-slider';
  if (customElements.get(TAG_NAME)) return;

  const MAX_TICKS = 60;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      :host {
        /* @kakao-settings:start prefix=--kakao-range-slider- (written by construction.html, edit there) */
        --_font-family: var(--kakao-range-slider-font-family, var(--kakao-slider-font-family, var(--kakao-font-family, system-ui, -apple-system, BlinkMacSystemFont, sans-serif)));
        --_accent: var(--kakao-range-slider-accent, var(--kakao-slider-accent, var(--kakao-color-ink, #111)));
        --_track-bg: var(--kakao-range-slider-track-bg, var(--kakao-slider-track-bg, var(--kakao-color-subtle-strong, #e0e0e0)));
        --_track-height: var(--kakao-range-slider-track-height, var(--kakao-slider-track-height, 4px));
        --_thumb-size: var(--kakao-range-slider-thumb-size, var(--kakao-slider-thumb-size, 16px));
        --_tick-color: var(--kakao-range-slider-tick-color, var(--kakao-slider-tick-color, var(--kakao-color-border, #ccc)));
        --_tick-active-color: var(--kakao-range-slider-tick-active-color, var(--kakao-slider-tick-active-color, var(--kakao-color-muted, #999)));
        --_transition-speed: var(--kakao-range-slider-transition-speed, var(--kakao-slider-transition-speed, 150ms));
        --_disabled-opacity: var(--kakao-range-slider-disabled-opacity, var(--kakao-slider-disabled-opacity, 0.4));
        --_label-color: var(--kakao-range-slider-label-color, var(--kakao-slider-label-color, var(--kakao-color-text, #111)));
        --_input-bg: var(--kakao-range-slider-input-bg, var(--kakao-slider-input-bg, var(--kakao-color-bg, #fff)));
        --_input-border: var(--kakao-range-slider-input-border, var(--kakao-slider-input-border, var(--kakao-color-field-border, #ececef)));
        --_unit-bg: var(--kakao-range-slider-unit-bg, var(--kakao-slider-unit-bg, var(--kakao-color-subtle, #f7f7f7)));
        --_unit-color: var(--kakao-range-slider-unit-color, var(--kakao-slider-unit-color, var(--kakao-color-text-soft, #555)));
        --_range-color: var(--kakao-range-slider-range-color, var(--kakao-slider-range-color, var(--kakao-color-muted, #999)));
        --_range-font-size: var(--kakao-range-slider-range-font-size, var(--kakao-slider-range-font-size, 11px));
        --_input-color: var(--kakao-range-slider-input-color, var(--kakao-slider-input-color, var(--kakao-color-text, #111)));
        --_input-font-size: var(--kakao-range-slider-input-font-size, var(--kakao-slider-input-font-size, 14px));
        --_thumb-bg: var(--kakao-range-slider-thumb-bg, var(--kakao-slider-thumb-bg, #fff));
        --_thumb-border: var(--kakao-range-slider-thumb-border, var(--kakao-slider-thumb-border, var(--kakao-color-border, #aaa)));
        --_stepper-color: var(--kakao-range-slider-stepper-color, var(--kakao-slider-stepper-color, var(--kakao-color-muted, #888)));
        --_stepper-hover-bg: var(--kakao-range-slider-stepper-hover-bg, var(--kakao-slider-stepper-hover-bg, var(--kakao-color-subtle, #f0f0f0)));
        --_stepper-hover-color: var(--kakao-range-slider-stepper-hover-color, var(--kakao-slider-stepper-hover-color, var(--kakao-color-text, #111)));
        --_stepper-active-bg: var(--kakao-range-slider-stepper-active-bg, var(--kakao-slider-stepper-active-bg, var(--kakao-color-subtle-strong, #e0e0e0)));
        --_touch-step-size: var(--kakao-range-slider-touch-step-size, var(--kakao-slider-touch-step-size, 44px));
        --_touch-radius: var(--kakao-range-slider-touch-radius, var(--kakao-slider-touch-radius, 10px));
        /* @kakao-settings:end */
        display: block;
        font-family: var(--_font-family);
        user-select: none;
        -webkit-user-select: none;
      }

      :host([hidden]) { display: none; }

      :host([disabled]),
      :host(:state(form-disabled)) {
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

      /* ── Header row: label + the two fields ── */
      .header {
        display: flex;
        flex-wrap: wrap;
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

      .fields {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: auto;
      }

      .dash {
        color: var(--_range-color);
        font-size: var(--_input-font-size);
        line-height: 1;
      }

      /* ── Number input + unit badge (as on kakao-slider) ── */
      .input-wrap {
        display: flex;
        align-items: stretch;
        border: 1px solid var(--_input-border);
        border-radius: 3px;
        background: var(--_input-bg);
        overflow: hidden;
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
        appearance: textfield;
        outline: none;
        cursor: text;
      }

      .number-input::-webkit-outer-spin-button,
      .number-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
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

      .unit-badge:empty { display: none; }

      .input-field {
        flex: 0 1 auto;
        min-width: 0;
      }

      /* kakao-number-input inside the shadow root (when number-input.js is on the page) */
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

      kakao-number-input .number-input {
        width: 100%;
        padding-right: var(--kakao-number-input-input-padding-right);
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

      /* ── Touch steppers: | < | value unit | > | per field (as on kakao-slider) ──
         Hidden with a mouse; shown on touch screens (or with the touch-steppers
         attribute), replacing the number fields' small arrows. The fields then
         take a row of their own and share it, or stack when it is too narrow
         for both (the dash is left out; the fields' names say which is which). */
      .step {
        display: none;
        align-items: center;
        justify-content: center;
        flex: 0 0 var(--_touch-step-size);
        width: var(--_touch-step-size);
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--_stepper-color);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .step svg {
        width: 18px;
        height: 18px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2.4;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .step:hover { background: var(--_stepper-hover-bg); color: var(--_stepper-hover-color); }
      .step:active { background: var(--_stepper-active-bg); }
      .step:disabled { opacity: 0.35; cursor: default; background: transparent; }
      .step-dec { border-right: 1px solid var(--_input-border); }
      .step-inc { border-left: 1px solid var(--_input-border); }

      @media (pointer: coarse) {
        :host .step { display: flex; }
        :host .fields { flex: 1 1 100%; flex-wrap: wrap; gap: 8px; }
        :host .dash { display: none; }
        :host .input-wrap { flex: 1 1 10rem; min-width: 0; min-height: var(--_touch-step-size); border-radius: var(--_touch-radius); }
        :host .input-field { flex: 1 1 auto; display: flex; align-items: stretch; }
        :host .number-input { width: 100%; min-width: 2.5em; font-size: 16px; padding-right: 8px; height: 100%; }
        :host kakao-number-input { width: 100%; height: 100%; }
        :host kakao-number-input .number-input { padding-right: 8px; }
        :host kakao-number-input .kakao-number-input-arrows { display: none; }
        :host .unit-badge { font-size: 13px; padding: 0 8px; }
      }

      :host([touch-steppers]) .step { display: flex; }
      :host([touch-steppers]) .fields { flex: 1 1 100%; flex-wrap: wrap; gap: 8px; }
      :host([touch-steppers]) .dash { display: none; }
      :host([touch-steppers]) .input-wrap { flex: 1 1 10rem; min-width: 0; min-height: var(--_touch-step-size); border-radius: var(--_touch-radius); }
      :host([touch-steppers]) .input-field { flex: 1 1 auto; display: flex; align-items: stretch; }
      :host([touch-steppers]) .number-input { width: 100%; min-width: 2.5em; font-size: 16px; padding-right: 8px; height: 100%; }
      :host([touch-steppers]) kakao-number-input { width: 100%; height: 100%; }
      :host([touch-steppers]) kakao-number-input .number-input { padding-right: 8px; }
      :host([touch-steppers]) kakao-number-input .kakao-number-input-arrows { display: none; }
      :host([touch-steppers]) .unit-badge { font-size: 13px; padding: 0 8px; }

      /* ── Track area ── */
      .track-area {
        position: relative;
        height: calc(var(--_thumb-size) + 12px);
        cursor: pointer;
        touch-action: none;
        padding: 0 calc(var(--_thumb-size) / 2);
      }

      .track-bg {
        position: absolute;
        left:  calc(var(--_thumb-size) / 2);
        right: calc(var(--_thumb-size) / 2);
        top: 50%;
        height: var(--_track-height);
        transform: translateY(-50%) translateY(-5px);
        background: var(--_track-bg);
        border-radius: 1px;
        pointer-events: none;
      }

      /* Filled span between the thumbs - flat colour, no gradient */
      .track-fill {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0%;
        width: 0%;
        background: var(--_accent);
        border-radius: 1px;
        transition:
          left  var(--_transition-speed) linear,
          width var(--_transition-speed) linear;
        will-change: left, width;
      }

      /* No transitions while dragging: fill, ticks and thumb follow the pointer */
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

      /* Ticks inside the selected span - slightly darker */
      .tick.active { background: var(--_tick-active-color); }

      /* Ticks at either value - full height, accent colour */
      .tick.at-value {
        height: 6px;
        top: 1px;
        background: var(--_accent);
      }

      /* ── Thumbs ── */
      .thumb {
        position: absolute;
        top: 50%;
        width:  var(--_thumb-size);
        height: var(--_thumb-size);
        transform: translateY(-50%) translateX(-50%) translateY(-5px);
        border-radius: 50%;
        background: var(--_thumb-bg);
        border: 1.5px solid var(--_thumb-border);
        cursor: grab;
        outline: none;
        left: 0%;
        z-index: 2;
        transition:
          left         var(--_transition-speed) linear,
          border-color var(--_transition-speed) linear;
        will-change: left;
      }

      /* The thumb moved last sits on top, so it can be picked up again */
      .thumb[data-top] { z-index: 3; }

      .thumb:active,
      .thumb[data-dragging] {
        cursor: grabbing;
        border-color: var(--_accent);
        border-width: 2px;
      }

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

      @media (prefers-reduced-motion: reduce) {
        .track-fill, .tick, .thumb { transition: none; }
      }

      @media (forced-colors: active) {
        .track-bg { background: Canvas; outline: 1px solid CanvasText; }
        .track-fill { forced-color-adjust: none; background: Highlight; }
        .tick { forced-color-adjust: none; background: GrayText; }
        .tick.active { background: CanvasText; }
        .tick.at-value { background: Highlight; }
        .thumb { forced-color-adjust: none; background: Canvas; border-color: CanvasText; }
        .thumb:focus-visible { outline-color: Highlight; }
        .input-wrap:focus-within { outline-color: Highlight; }
      }
    </style>

    <div class="root" part="root" role="group" aria-labelledby="label">
      <div class="header">
        <span class="slider-label" id="label" part="label"></span>
        <div class="fields" part="fields">
          <div class="input-wrap" part="input-wrap">
            <button type="button" class="step step-dec" part="step-dec" tabindex="-1" data-thumb="low" data-dir="-1"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 6l-6 6 6 6"/></svg></button>
            <div class="input-field"><input class="number-input" part="input" type="number" inputmode="decimal" data-thumb="low" /></div>
            <span class="unit-badge" part="unit"></span>
            <button type="button" class="step step-inc" part="step-inc" tabindex="-1" data-thumb="low" data-dir="1"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6l6 6-6 6"/></svg></button>
          </div>
          <span class="dash" aria-hidden="true">–</span>
          <div class="input-wrap" part="input-wrap">
            <button type="button" class="step step-dec" part="step-dec" tabindex="-1" data-thumb="high" data-dir="-1"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 6l-6 6 6 6"/></svg></button>
            <div class="input-field"><input class="number-input" part="input" type="number" inputmode="decimal" data-thumb="high" /></div>
            <span class="unit-badge" part="unit"></span>
            <button type="button" class="step step-inc" part="step-inc" tabindex="-1" data-thumb="high" data-dir="1"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6l6 6-6 6"/></svg></button>
          </div>
        </div>
      </div>

      <div class="track-area" part="track-area">
        <div class="track-bg" part="track"><div class="track-fill" part="fill"></div></div>
        <div class="ticks" part="ticks" aria-hidden="true"></div>
        <div class="thumb" part="thumb thumb-low" role="slider" tabindex="0" data-thumb="low"></div>
        <div class="thumb" part="thumb thumb-high" role="slider" tabindex="0" data-thumb="high" data-top></div>
      </div>

      <div class="range-labels" aria-hidden="true">
        <span class="range-label min-label"></span>
        <span class="range-label max-label"></span>
      </div>
    </div>
  `;

  const num = (v, fallback) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  };

  class KakaoRangeSlider extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['min', 'max', 'step', 'value', 'min-gap', 'unit', 'label', 'label-low', 'label-high',
        'name', 'disabled', 'scroll-input', 'touch-steppers'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;

      this._root = shadow.querySelector('.root');
      this._labelEl = shadow.querySelector('.slider-label');
      this._trackArea = shadow.querySelector('.track-area');
      this._fill = shadow.querySelector('.track-fill');
      this._ticks = shadow.querySelector('.ticks');
      this._minLabel = shadow.querySelector('.min-label');
      this._maxLabel = shadow.querySelector('.max-label');
      this._units = [...shadow.querySelectorAll('.unit-badge')];
      this._thumbs = {
        low: shadow.querySelector('.thumb[data-thumb="low"]'),
        high: shadow.querySelector('.thumb[data-thumb="high"]'),
      };
      this._inputs = {
        low: shadow.querySelector('input[data-thumb="low"]'),
        high: shadow.querySelector('input[data-thumb="high"]'),
      };

      this._min = 0;
      this._max = 100;
      this._step = 1;
      this._gap = 0;
      this._low = 0;
      this._high = 100;
      this._unit = '';
      this._label = 'Range';
      this._formDisabled = false;
      this._initialised = false;
      this._drag = null; // { thumb: 'low'|'high'|null, tieAt, startLow, startHigh, pointerId }
      this._frame = 0;

      this._onPointerDown = this._onPointerDown.bind(this);
      this._onPointerMove = this._onPointerMove.bind(this);
      this._onPointerUp = this._onPointerUp.bind(this);

      this._trackArea.addEventListener('pointerdown', this._onPointerDown);
      ['low', 'high'].forEach((which) => {
        const thumb = this._thumbs[which];
        thumb.addEventListener('keydown', (e) => this._onKeyDown(e, which));
        thumb.addEventListener('focus', () => this._emitFocus('range-slider-focus', which));
        thumb.addEventListener('blur', () => this._emitFocus('range-slider-blur', which));
        this._bindInput(this._inputs[which], which);
      });
      this._steps = [...shadow.querySelectorAll('.step')];
      this._bindSteps();
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      if (!this._initialised) {
        this._initialised = true;
        this._readAttributes();
        this._readValue(this.getAttribute('value'));
        this._mountNumberFields();
      }
      // After the attributes are read, so a value set before upgrade is clamped to them
      ['disabled', 'name', 'value', 'low', 'high'].forEach((p) => this._upgrade(p));
      this._render();
    }

    disconnectedCallback() {
      this._endDrag(false);
      this._stopRepeat();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this._initialised) return;
      if (name === 'value') {
        this._readValue(newValue);
      } else if (name === 'scroll-input' || name === 'touch-steppers') {
        return;
      } else {
        this._readAttributes();
        this._setPair(this._low, this._high);
      }
      this._render();
    }

    formResetCallback() {
      this._readValue(this.getAttribute('value'));
      this._render();
    }

    formDisabledCallback(disabled) {
      this._formDisabled = disabled;
      this._setState('form-disabled', disabled);
      this._render();
    }

    formStateRestoreCallback(state) {
      if (typeof state === 'string') {
        this._readValue(state);
        this._render();
      }
    }

    /* -------------------------- Public API -------------------------- */

    get value() { return `${this._low},${this._high}`; }
    set value(v) {
      this._readValue(Array.isArray(v) ? v.join(',') : v == null ? '' : String(v));
      this._render();
    }

    get low() { return this._low; }
    set low(v) { this.setValue(v, this._high); }

    get high() { return this._high; }
    set high(v) { this.setValue(this._low, v); }

    get name() { return this.getAttribute('name') || ''; }
    set name(v) { this.setAttribute('name', v); }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(v) { this.toggleAttribute('disabled', !!v); }

    get form() { return this._internals ? this._internals.form : null; }
    get validity() { return this._internals ? this._internals.validity : null; }
    get validationMessage() { return this._internals ? this._internals.validationMessage : ''; }
    get willValidate() { return this._internals ? this._internals.willValidate : false; }
    checkValidity() { return this._internals ? this._internals.checkValidity() : true; }
    reportValidity() { return this._internals ? this._internals.reportValidity() : true; }

    /** Set both ends (clamped, snapped, kept min-gap apart). Fires no events. */
    setValue(low, high) {
      const l = num(low, this._low);
      const h = num(high, this._high);
      this._setPair(Math.min(l, h), Math.max(l, h));
      this._render();
    }

    /** { low, high } */
    getValue() {
      return { low: this._low, high: this._high };
    }

    /** Bulk-configure: { min?, max?, step?, low?, high?, minGap?, unit?, label? }. Fires no events. */
    setData(opts = {}) {
      if (opts.min !== undefined) this._min = num(opts.min, this._min);
      if (opts.max !== undefined) this._max = num(opts.max, this._max);
      if (this._max < this._min) this._max = this._min;
      if (opts.step !== undefined) this._step = Math.max(0.0001, num(opts.step, this._step));
      if (opts.minGap !== undefined) this._gap = Math.max(0, num(opts.minGap, 0));
      if (opts.unit !== undefined) this._unit = opts.unit == null ? '' : String(opts.unit);
      if (opts.label !== undefined) this._label = opts.label || 'Range';
      this.setValue(opts.low !== undefined ? opts.low : this._low, opts.high !== undefined ? opts.high : this._high);
    }

    /* -------------------------- Reading -------------------------- */

    _readAttributes() {
      this._min = num(this.getAttribute('min'), 0);
      this._max = num(this.getAttribute('max'), 100);
      if (this._max < this._min) this._max = this._min;
      this._step = Math.max(0.0001, num(this.getAttribute('step'), 1));
      this._gap = Math.max(0, num(this.getAttribute('min-gap'), 0));
      this._unit = this.getAttribute('unit') || '';
      this._label = this.getAttribute('label') || 'Range';
    }

    /** "low,high" → both values; missing parts fall back to min / max. */
    _readValue(text) {
      const parts = String(text || '').split(',');
      const a = num(parts[0], this._min);
      const b = num(parts[1], this._max);
      this._setPair(Math.min(a, b), Math.max(a, b));
    }

    /* -------------------------- Value maths -------------------------- */

    _gapSize() {
      return Math.min(this._gap, this._max - this._min);
    }

    _snap(v) {
      const snapped = Math.round((v - this._min) / this._step) * this._step + this._min;
      return parseFloat(Math.min(this._max, Math.max(this._min, snapped)).toFixed(10));
    }

    /** The values a thumb can reach, given where the other one is. */
    _limits(which) {
      const gap = this._gapSize();
      if (which === 'low') {
        const hi = this._high - gap;
        // Highest grid value not above hi
        const grid = Math.floor((hi - this._min) / this._step + 1e-9) * this._step + this._min;
        return { lo: this._min, hi: parseFloat(Math.max(this._min, Math.min(hi, grid)).toFixed(10)) };
      }
      const lo = this._low + gap;
      const grid = Math.ceil((lo - this._min) / this._step - 1e-9) * this._step + this._min;
      return { lo: parseFloat(Math.min(this._max, Math.max(lo, grid)).toFixed(10)), hi: this._max };
    }

    /** Moves one thumb, clamped to its limits. Returns true when it moved. */
    _move(which, v) {
      const { lo, hi } = this._limits(which);
      const next = Math.min(hi, Math.max(lo, this._snap(v)));
      const key = which === 'low' ? '_low' : '_high';
      if (next === this[key]) return false;
      this[key] = next;
      return true;
    }

    /** Sets both values from scratch: snapped, sorted, min-gap apart. */
    _setPair(low, high) {
      const gap = this._gapSize();
      let l = this._snap(low);
      let h = this._snap(high);
      if (h - l < gap - 1e-9) {
        // Keep low where asked if possible, push high up; at the top, push low down.
        h = this._snap(Math.min(this._max, l + gap));
        if (h - l < gap - 1e-9) h = this._max;
        if (h - l < gap - 1e-9) l = this._snap(Math.max(this._min, h - gap));
        if (h - l < gap - 1e-9) l = this._min;
      }
      this._low = l;
      this._high = h;
    }

    _percent(v) {
      const range = this._max - this._min;
      if (range === 0) return 0;
      return Math.min(100, Math.max(0, ((v - this._min) / range) * 100));
    }

    _format(v) {
      const decimals = this._step % 1 !== 0 ? String(this._step).replace(/^[^.]*\.?/, '').length : 0;
      return parseFloat(v.toFixed(decimals));
    }

    _isDisabled() {
      return this.hasAttribute('disabled') || this._formDisabled;
    }

    /* -------------------------- Drawing -------------------------- */

    _thumbName(which) {
      const own = this.getAttribute(which === 'low' ? 'label-low' : 'label-high');
      return own || `${this._label}, ${which === 'low' ? 'minimum' : 'maximum'}`;
    }

    _render(skipInput) {
      if (!this._initialised) return;
      const disabled = this._isDisabled();
      const lowPct = this._percent(this._low);
      const highPct = this._percent(this._high);
      const unitText = (v) => `${this._format(v)}${this._unit ? ' ' + this._unit : ''}`;

      this._labelEl.textContent = this._label;
      this._units.forEach((u) => { u.textContent = this._unit; });

      ['low', 'high'].forEach((which) => {
        const v = which === 'low' ? this._low : this._high;
        const { lo, hi } = this._limits(which);
        const thumb = this._thumbs[which];
        thumb.style.left = `${which === 'low' ? lowPct : highPct}%`;
        thumb.setAttribute('aria-label', this._thumbName(which));
        thumb.setAttribute('aria-valuemin', String(lo));
        thumb.setAttribute('aria-valuemax', String(hi));
        thumb.setAttribute('aria-valuenow', String(v));
        thumb.setAttribute('aria-valuetext', unitText(v));
        thumb.setAttribute('aria-disabled', String(disabled));
        thumb.setAttribute('tabindex', disabled ? '-1' : '0');

        const input = this._inputs[which];
        input.min = String(lo);
        input.max = String(hi);
        input.step = String(this._step);
        input.disabled = disabled;
        input.setAttribute('aria-label', this._thumbName(which));
        if (skipInput !== which) input.value = String(this._format(v));
      });

      this._steps.forEach((btn) => {
        const which = btn.dataset.thumb;
        const v = which === 'low' ? this._low : this._high;
        const { lo, hi } = this._limits(which);
        const down = btn.dataset.dir === '-1';
        btn.setAttribute('aria-label', `${down ? 'Decrease' : 'Increase'} ${this._thumbName(which)}`);
        btn.disabled = disabled || (down ? v <= lo : v >= hi);
      });

      this._fill.style.left = `${lowPct}%`;
      this._fill.style.width = `${highPct - lowPct}%`;

      this._minLabel.textContent = `${this._format(this._min)}${this._unit}`;
      this._maxLabel.textContent = `${this._format(this._max)}${this._unit}`;

      this._renderTicks(lowPct, highPct);
      this._syncForm();
    }

    _renderTicks(lowPct, highPct) {
      const steps = Math.round((this._max - this._min) / this._step);
      if (steps < 2 || steps > MAX_TICKS) {
        this._ticks.innerHTML = '';
        return;
      }
      const near = this._step * 0.01;
      const html = [];
      for (let i = 0; i <= steps; i++) {
        const pct = (i / steps) * 100;
        const v = this._min + i * this._step;
        const cls = ['tick'];
        if (pct >= lowPct - 1e-9 && pct <= highPct + 1e-9) cls.push('active');
        if (Math.abs(v - this._low) < near || Math.abs(v - this._high) < near) cls.push('at-value');
        html.push(`<span class="${cls.join(' ')}" style="left:${pct}%"></span>`);
      }
      this._ticks.innerHTML = html.join('');
    }

    _raise(which) {
      this._thumbs.low.toggleAttribute('data-top', which === 'low');
      this._thumbs.high.toggleAttribute('data-top', which === 'high');
    }

    /* -------------------------- Form -------------------------- */

    _syncForm() {
      if (!this._internals) return;
      const name = this.getAttribute('name');
      const state = this.value;
      if (!name) {
        this._internals.setFormValue(null, state);
        return;
      }
      const data = new FormData();
      data.append(name, String(this._low));
      data.append(name, String(this._high));
      this._internals.setFormValue(data, state);
    }

    _setState(name, on) {
      const states = this._internals && this._internals.states;
      if (!states) return;
      try {
        if (on) states.add(name); else states.delete(name);
      } catch (_) {
        // Older engines only accept the legacy --name form.
        try { if (on) states.add(`--${name}`); else states.delete(`--${name}`); } catch (__) { /* no custom states */ }
      }
    }

    /* -------------------------- Events -------------------------- */

    _detail() {
      return { low: this._low, high: this._high, value: this.value, min: this._min, max: this._max, step: this._step };
    }

    _emit(kind) {
      this.dispatchEvent(new CustomEvent(`range-slider-${kind}`, { bubbles: true, composed: true, detail: this._detail() }));
      this.dispatchEvent(new Event(kind, { bubbles: true, composed: true }));
    }

    _emitFocus(name, which) {
      this.dispatchEvent(new CustomEvent(name, {
        bubbles: true, composed: true, detail: { thumb: which, low: this._low, high: this._high },
      }));
    }

    /* -------------------------- Pointer -------------------------- */

    _valueFromPointer(e) {
      const rect = this._trackArea.getBoundingClientRect();
      // Measured, so any unit works for the thumb size
      const r = (this._thumbs.low.offsetWidth || 16) / 2;
      const w = Math.max(1, rect.width - r * 2);
      const x = Math.min(Math.max(e.clientX - rect.left - r, 0), w);
      return this._min + (x / w) * (this._max - this._min);
    }

    /** The thumb a press at v belongs to; null when both sit on the spot pressed. */
    _pick(v) {
      if (this._low === this._high) {
        if (v < this._low - this._step / 2) return 'low';
        if (v > this._high + this._step / 2) return 'high';
        return null;
      }
      if (v <= this._low) return 'low';
      if (v >= this._high) return 'high';
      return v - this._low <= this._high - v ? 'low' : 'high';
    }

    _onPointerDown(e) {
      if (this._isDisabled() || this._drag) return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();

      const v = this._valueFromPointer(e);
      this._drag = {
        thumb: this._pick(v),
        tieAt: v,
        startLow: this._low,
        startHigh: this._high,
        pointerId: e.pointerId,
      };
      try { this._trackArea.setPointerCapture(e.pointerId); } catch (_) { /* synthetic pointer */ }
      this._root.classList.add('is-dragging');
      window.addEventListener('pointermove', this._onPointerMove);
      window.addEventListener('pointerup', this._onPointerUp);
      window.addEventListener('pointercancel', this._onPointerUp);

      const which = this._drag.thumb;
      if (which) {
        this._grab(which);
        if (this._move(which, v)) {
          this._render();
          this._emit('input');
        }
      } else {
        // Both thumbs here: focus the one on top until the movement decides
        this._thumbs[this._thumbs.low.hasAttribute('data-top') ? 'low' : 'high'].focus({ preventScroll: true });
      }
    }

    _grab(which) {
      const other = which === 'low' ? 'high' : 'low';
      this._thumbs[other].removeAttribute('data-dragging');
      this._thumbs[which].setAttribute('data-dragging', '');
      this._raise(which);
      this._thumbs[which].focus({ preventScroll: true });
    }

    _onPointerMove(e) {
      if (!this._drag || e.pointerId !== this._drag.pointerId) return;
      if (this._frame) cancelAnimationFrame(this._frame);
      const x = { clientX: e.clientX };
      this._frame = requestAnimationFrame(() => {
        this._frame = 0;
        if (!this._drag) return;
        const v = this._valueFromPointer(x);
        if (!this._drag.thumb) {
          const d = v - this._drag.tieAt;
          if (Math.abs(d) < 1e-9) return;
          this._drag.thumb = d < 0 ? 'low' : 'high';
          this._grab(this._drag.thumb);
        }
        if (this._move(this._drag.thumb, v)) {
          this._render();
          this._emit('input');
        }
      });
    }

    _onPointerUp(e) {
      if (!this._drag || (e && e.pointerId !== this._drag.pointerId)) return;
      this._endDrag(true);
    }

    _endDrag(commit) {
      if (this._frame) { cancelAnimationFrame(this._frame); this._frame = 0; }
      window.removeEventListener('pointermove', this._onPointerMove);
      window.removeEventListener('pointerup', this._onPointerUp);
      window.removeEventListener('pointercancel', this._onPointerUp);
      if (!this._drag) return;
      const { startLow, startHigh } = this._drag;
      this._drag = null;
      this._root.classList.remove('is-dragging');
      this._thumbs.low.removeAttribute('data-dragging');
      this._thumbs.high.removeAttribute('data-dragging');
      if (commit && (startLow !== this._low || startHigh !== this._high)) this._emit('change');
    }

    /* -------------------------- Keyboard -------------------------- */

    _onKeyDown(e, which) {
      if (this._isDisabled()) return;
      const v = which === 'low' ? this._low : this._high;
      const { lo, hi } = this._limits(which);
      let target;
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowDown': target = v - this._step; break;
        case 'ArrowRight':
        case 'ArrowUp': target = v + this._step; break;
        case 'PageDown': target = v - this._step * 10; break;
        case 'PageUp': target = v + this._step * 10; break;
        case 'Home': target = lo; break;
        case 'End': target = hi; break;
        default: return;
      }
      e.preventDefault();
      this._raise(which);
      if (this._move(which, target)) {
        this._render();
        this._emit('input');
        this._emit('change');
      }
    }

    /* -------------------------- Number fields -------------------------- */

    _bindInput(input, which) {
      input.addEventListener('input', (e) => {
        // The native event is composed and would leave the shadow root next to ours.
        e.stopPropagation();
        const v = parseFloat(input.value);
        if (!Number.isFinite(v)) return;
        const { lo, hi } = this._limits(which);
        // Only while the typed number is within reach, so typing "8" on the way
        // to "80" doesn't snap the field to the other thumb.
        if (v < lo || v > hi) return;
        this._raise(which);
        if (this._move(which, v)) {
          this._render(which);
          this._emit('input');
          this._typed = true;
        }
      });
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const v = parseFloat(input.value);
        const moved = Number.isFinite(v) && this._move(which, v);
        this._render();
        if (moved) this._emit('input');
        if (moved || this._typed) this._emit('change');
        this._typed = false;
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
      });
    }

    /* -------------------------- Touch steppers (hold to repeat) -------------------------- */

    _bindSteps() {
      this._stopRepeat = () => {
        clearTimeout(this._repeatDelay);
        clearInterval(this._repeatTimer);
      };
      this._steps.forEach((btn) => {
        const which = btn.dataset.thumb;
        const dir = Number(btn.dataset.dir);
        const step = () => {
          const v = which === 'low' ? this._low : this._high;
          this._raise(which);
          if (this._move(which, v + dir * this._step)) {
            this._render();
            this._emit('input');
            this._emit('change');
          }
        };
        btn.addEventListener('pointerdown', (e) => {
          if (btn.disabled) return;
          e.preventDefault(); // keep focus where it is, no text selection
          this._stopRepeat();
          step();
          this._repeatDelay = setTimeout(() => {
            this._repeatTimer = setInterval(() => {
              if (btn.disabled) this._stopRepeat();
              else step();
            }, 70);
          }, 400);
        });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => btn.addEventListener(t, this._stopRepeat));
        // Keyboard / assistive tech activation (no pointer)
        btn.addEventListener('click', (e) => { if (e.detail === 0 && !btn.disabled) step(); });
      });
    }

    _scrollInputPreference() {
      const attr = this.getAttribute('scroll-input');
      if (attr == null || attr === '') return 'auto';
      const v = attr.toLowerCase();
      if (['false', '0', 'off', 'no', 'native'].includes(v)) return 'off';
      if (['true', '1', 'on', 'yes', 'scroll'].includes(v)) return 'on';
      return 'auto';
    }

    /** Wraps both fields in kakao-number-input when it is on the page. */
    _mountNumberFields() {
      const pref = this._scrollInputPreference();
      if (pref === 'off') return;
      const wrap = () => {
        ['low', 'high'].forEach((which) => {
          const input = this._inputs[which];
          if (input.parentElement && input.parentElement.localName === 'kakao-number-input') return;
          const field = input.parentElement;
          const sn = document.createElement('kakao-number-input');
          sn.setAttribute('size', 'sm');
          sn.appendChild(input); // the same input: its listeners stay
          field.appendChild(sn);
        });
      };
      if (customElements.get('kakao-number-input')) wrap();
      else if (pref === 'on') customElements.whenDefined('kakao-number-input').then(wrap);
    }

    /* -------------------------- Helpers -------------------------- */

    /** A property set before the element was upgraded goes through the setter. */
    _upgrade(prop) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const v = this[prop];
        delete this[prop];
        this[prop] = v;
      }
    }
  }

  customElements.define(TAG_NAME, KakaoRangeSlider);
})();
