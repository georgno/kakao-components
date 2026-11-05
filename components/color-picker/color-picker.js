/**
 * <kakao-color-picker>
 * ============================================================================
 * A colour field with a picker popover: saturation/brightness area, hue slider,
 * optional alpha slider, preset swatches and (where supported) an eyedropper.
 * The value is set live while picking: the field, `value` and the form value
 * follow the pointer or keys at once, and `input` fires on every step;
 * `change` fires when the pick is done. Escape reverts to the colour from
 * before the picker opened. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="color-picker.js"><\/script>
 *
 *   <kakao-color-picker label="Brand colour" name="brand" value="#4f46e5"></kakao-color-picker>
 *   <kakao-color-picker alpha value="#4f46e580"></kakao-color-picker>
 *   <kakao-color-picker compact value="#0d9488" aria-label="Accent"></kakao-color-picker>
 *   <kakao-color-picker list-data='["#4f46e5", "#0d9488", {"value":"#dc2626","label":"Danger"}]'></kakao-color-picker>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  value      Any CSS colour; normalised to #rrggbb (#rrggbbaa with alpha < 1).
 *  label      Visible label above the field.
 *  alpha      Adds the alpha slider and keeps transparency in the value.
 *  compact    Swatch button only, no hex field (e.g. next to your own input).
 *  list-data  JSON array of preset swatches (never "data"):
 *               ["#4f46e5", { "value": "#dc2626", "label": "Danger" }, …]
 *  disabled · required · name   Form participation (form-associated).
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value            Get / set (any CSS colour in, normalised hex out).
 *  open() · close() Show / hide the picker (close(false) reverts).
 *  Calls made before the element is connected are queued.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  input         every live step while picking (value already updated)
 *  change        when a pick is done (release, Enter, preset, close)
 *  color-input   { value, rgb: {r,g,b,a}, hsv: {h,s,v} }   with every input
 *  color-change  { value, previous }                       with every change
 *  color-open / color-close
 *
 * ----------------------------------------------------------------------------
 * KEYBOARD
 * ----------------------------------------------------------------------------
 *  Field: Enter / Space / Alt+↓ on the swatch opens the picker; the hex field
 *  takes typed colours (#abc, #aabbcc, rgb(), names…).
 *  Area: arrows move saturation / brightness by 1 (Shift: 10).
 *  Sliders: ← / → (or ↓ / ↑) by 1 (Shift: 10), Home / End.
 *  Escape: close and revert · Enter: close and keep · Tab moves through.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-color-picker';
  if (customElements.get(TAG_NAME)) return;

  /* ---------------------------------------------------------------------- */
  /* Colour maths                                                           */
  /* ---------------------------------------------------------------------- */

  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const hex2 = (n) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');

  function hsvToRgb(h, s, v) {
    const f = (n) => {
      const k = (n + h / 60) % 6;
      return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    };
    return { r: f(5) * 255, g: f(3) * 255, b: f(1) * 255 };
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s: max ? d / max : 0, v: max };
  }

  const probe = document.createElement('span');
  /** Any CSS colour → {r,g,b,a} (0–255, a 0–1), or null. */
  function parseColor(input) {
    if (input == null) return null;
    const str = String(input).trim();
    let m = str.match(/^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
    if (m) {
      let h = m[1];
      if (h.length <= 4) h = [...h].map((c) => c + c).join('');
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
      };
    }
    probe.style.color = '';
    probe.style.color = str;
    if (!probe.style.color) return null;
    document.documentElement.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }

  /* Relative luminance, for a readable checkmark on swatches */
  const isLight = ({ r, g, b }) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6;

  /* ---------------------------------------------------------------------- */
  /* Template                                                               */
  /* ---------------------------------------------------------------------- */

  const CHECKER = 'repeating-conic-gradient(#c8c8c8 0 25%, #ffffff 0 50%) 0 0 / 10px 10px';
  const EYEDROPPER = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l4 4M13.5 6.5l4 4L9 19H5v-4z"/><path d="M14 4l6 6"/></svg>';

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-color-picker- (written by construction.html, edit there) */
        --_bg: var(--kakao-color-picker-bg, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-color-picker-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-color-picker-muted, var(--kakao-color-muted, #62626c));
        --_border: var(--kakao-color-picker-border, var(--kakao-color-field-border, #ececef));
        --_line: var(--kakao-color-picker-line, var(--kakao-color-line, #e5e7eb));
        --_hover-bg: var(--kakao-color-picker-hover-bg, var(--kakao-color-subtle, #f0f0f1));
        --_focus: var(--kakao-color-picker-focus, var(--kakao-color-focus, #2563eb));
        --_font: var(--kakao-color-picker-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_height: var(--kakao-color-picker-height, 44px);
        --_radius: var(--kakao-color-picker-radius, 10px);
        --_swatch-size: var(--kakao-color-picker-swatch-size, 28px);
        --_swatch-radius: var(--kakao-color-picker-swatch-radius, 7px);
        --_popup-width: var(--kakao-color-picker-popup-width, 248px);
        --_popup-radius: var(--kakao-color-picker-popup-radius, 14px);
        --_popup-padding: var(--kakao-color-picker-popup-padding, 12px);
        --_popup-shadow: var(--kakao-color-picker-popup-shadow, 0 8px 24px rgba(0, 0, 0, 0.12));
        --_area-height: var(--kakao-color-picker-area-height, 160px);
        --_area-radius: var(--kakao-color-picker-area-radius, 8px);
        --_slider-height: var(--kakao-color-picker-slider-height, 14px);
        --_thumb-size: var(--kakao-color-picker-thumb-size, 18px);
        --_preset-size: var(--kakao-color-picker-preset-size, 24px);
        --_disabled-opacity: var(--kakao-color-picker-disabled-opacity, 0.45);
        /* @kakao-settings:end */
        display: inline-block;
        position: relative;
        max-width: 100%;
        font: var(--_font);
        color: var(--_text);
      }
      :host([hidden]) { display: none; }
      :host([disabled]) { opacity: var(--_disabled-opacity); }

      .label { display: block; margin-bottom: 0.4rem; font-weight: 600; }
      .label:empty { display: none; }

      /* ---- field: | swatch | #hex | ---- */
      .field {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        box-sizing: border-box;
        height: var(--_height);
        padding: 0 10px 0 calc((var(--_height) - var(--_swatch-size)) / 2 - 1px);
        background: var(--_bg);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
      }
      .field:focus-within { outline: 2px solid var(--_focus); outline-offset: 2px; }
      :host([compact]) .field {
        padding: 0;
        border: 0;
        background: none;
        height: auto;
      }
      :host([compact]) .field:focus-within { outline: none; }
      :host([compact]) .hex { display: none; }

      .swatch-btn {
        position: relative;
        flex: none;
        width: var(--_swatch-size);
        height: var(--_swatch-size);
        padding: 0;
        border: 0;
        border-radius: var(--_swatch-radius);
        background: ${CHECKER};
        cursor: pointer;
        overflow: hidden;
        outline: none;
      }
      .swatch-btn::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: var(--_current, transparent);
        box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.14);
      }
      :host([compact]) .swatch-btn:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; }
      :host([disabled]) .swatch-btn { cursor: not-allowed; }

      .hex {
        width: 7.5ch;
        min-width: 0;
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        font-family: ui-monospace, "SF Mono", Menlo, monospace;
        font-size: 0.9em;
        text-transform: none;
        outline: none;
      }
      :host([alpha]) .hex { width: 9.5ch; }

      /* ---- popover ---- */
      .popup {
        position: absolute;
        z-index: 40;
        top: calc(100% + 6px);
        left: 0;
        box-sizing: border-box;
        width: var(--_popup-width);
        padding: var(--_popup-padding);
        display: grid;
        gap: 10px;
        background: var(--_bg);
        border: 1px solid var(--_line);
        border-radius: var(--_popup-radius);
        box-shadow: var(--_popup-shadow);
        transform-origin: top left;
        animation: kakao-cp-pop 160ms cubic-bezier(.34, 1.3, .64, 1);
      }
      .popup[hidden] { display: none; }
      :host([data-up]) .popup { top: auto; bottom: calc(100% + 6px); transform-origin: bottom left; }
      @keyframes kakao-cp-pop { from { opacity: 0; transform: translateY(-4px) scale(0.97); } }

      .area {
        position: relative;
        height: var(--_area-height);
        border-radius: var(--_area-radius);
        background:
          linear-gradient(to top, #000, transparent),
          linear-gradient(to right, #fff, hsl(var(--_hue, 0) 100% 50%));
        cursor: crosshair;
        touch-action: none;
        outline: none;
      }
      .track {
        position: relative;
        height: var(--_slider-height);
        border-radius: 999px;
        cursor: pointer;
        touch-action: none;
        outline: none;
      }
      .hue {
        background: linear-gradient(to right, #f00 0%, #ff0 16.67%, #0f0 33.33%, #0ff 50%, #00f 66.67%, #f0f 83.33%, #f00 100%);
      }
      .alpha {
        background:
          linear-gradient(to right, transparent, var(--_opaque, #000)),
          ${CHECKER};
      }
      .alpha[hidden] { display: none; }

      /* Thumbs: white ring + dark halo, visible on any colour */
      .thumb {
        position: absolute;
        width: var(--_thumb-size);
        height: var(--_thumb-size);
        box-sizing: border-box;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 0 1px rgb(0 0 0 / 0.35), 0 1px 4px rgb(0 0 0 / 0.3);
        background: var(--_thumb-color, transparent);
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
      .track .thumb { top: 50%; }
      .area:focus-visible .thumb,
      .track:focus-visible .thumb {
        box-shadow: 0 0 0 2px var(--_focus), 0 0 0 4px #fff, 0 1px 4px rgb(0 0 0 / 0.3);
      }

      .tools { display: flex; align-items: center; gap: 8px; }
      .preview {
        flex: none;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: ${CHECKER};
        position: relative;
        overflow: hidden;
      }
      .preview::after {
        content: "";
        position: absolute;
        inset: 0;
        background: var(--_current, transparent);
        box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.14);
        border-radius: inherit;
      }
      .readout {
        flex: 1;
        min-width: 0;
        font-family: ui-monospace, "SF Mono", Menlo, monospace;
        font-size: 0.82em;
        color: var(--_muted);
        line-height: 1.35;
      }
      .readout b { display: block; color: var(--_text); font-weight: 600; font-size: 1.1em; }
      .icon-btn {
        flex: none;
        width: 32px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: 0;
        border-radius: 8px;
        background: var(--_hover-bg);
        color: var(--_text);
        cursor: pointer;
      }
      .icon-btn[hidden] { display: none; }
      .icon-btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      .icon-btn:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; }

      .presets {
        display: grid;
        grid-template-columns: repeat(auto-fill, var(--_preset-size));
        gap: 6px;
        padding-top: 10px;
        border-top: 1px solid var(--_line);
      }
      .presets:empty { display: none; }
      .preset {
        position: relative;
        width: var(--_preset-size);
        height: var(--_preset-size);
        padding: 0;
        border: 0;
        border-radius: 6px;
        background: ${CHECKER};
        cursor: pointer;
        overflow: hidden;
      }
      .preset::after {
        content: "";
        position: absolute;
        inset: 0;
        background: var(--_c);
        box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.14);
        border-radius: inherit;
      }
      .preset[aria-pressed="true"]::before {
        content: "";
        position: absolute;
        z-index: 1;
        left: 50%;
        top: 46%;
        width: 5px;
        height: 9px;
        border: solid var(--_mark, #fff);
        border-width: 0 2px 2px 0;
        transform: translate(-50%, -50%) rotate(45deg);
      }
      .preset:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; }

      .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

      @media (prefers-reduced-motion: reduce) {
        .popup { animation: none; }
      }
    </style>
    <span class="label" id="label" part="label"></span>
    <div class="field" part="field">
      <button type="button" class="swatch-btn" part="swatch" aria-haspopup="dialog" aria-expanded="false"></button>
      <input class="hex" part="input" type="text" spellcheck="false" autocomplete="off" />
    </div>
    <div class="popup" part="popup" role="dialog" aria-label="Colour picker" hidden>
      <div class="area" role="slider" tabindex="0" aria-label="Saturation and brightness"
        aria-valuemin="0" aria-valuemax="100"><div class="thumb"></div></div>
      <div class="track hue" role="slider" tabindex="0" aria-label="Hue"
        aria-valuemin="0" aria-valuemax="360"><div class="thumb"></div></div>
      <div class="track alpha" role="slider" tabindex="0" aria-label="Opacity"
        aria-valuemin="0" aria-valuemax="100" hidden><div class="thumb"></div></div>
      <div class="tools">
        <span class="preview" aria-hidden="true"></span>
        <span class="readout" aria-hidden="true"><b></b><span></span></span>
        <button type="button" class="icon-btn eyedropper" title="Pick a colour from the screen" aria-label="Pick a colour from the screen" hidden>${EYEDROPPER}</button>
      </div>
      <div class="presets" role="group" aria-label="Presets"></div>
    </div>
    <span class="sr" role="status" aria-live="polite"></span>
  `;

  /* ---------------------------------------------------------------------- */
  /* Element                                                                */
  /* ---------------------------------------------------------------------- */

  class KakaoColorPicker extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['value', 'label', 'alpha', 'compact', 'list-data', 'disabled', 'required', 'name', 'aria-label'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      const $ = (sel) => shadow.querySelector(sel);
      this._labelEl = $('.label');
      this._swatchBtn = $('.swatch-btn');
      this._hexInput = $('.hex');
      this._popup = $('.popup');
      this._area = $('.area');
      this._areaThumb = $('.area .thumb');
      this._hue = $('.hue');
      this._hueThumb = $('.hue .thumb');
      this._alpha = $('.alpha');
      this._alphaThumb = $('.alpha .thumb');
      this._previewReadout = $('.readout b');
      this._previewSub = $('.readout span');
      this._eyedropper = $('.eyedropper');
      this._presets = $('.presets');
      this._status = $('.sr[role="status"]');

      // h 0–360, s/v 0–1, a 0–1. HSV is the source of truth while picking,
      // so hue survives greys and black.
      this._hsv = { h: 0, s: 0, v: 0 };
      this._a = 1;
      this._value = '#000000';
      this._openValue = null;   // value when the picker opened (Escape reverts)
      this._dragStart = null;   // value when a drag started (change on release)
      this._connected = false;
      this._pending = [];
      this._reflecting = false;

      this._onDocPointerDown = this._onDocPointerDown.bind(this);
    }

    /* ---------------- lifecycle ---------------- */

    connectedCallback() {
      this._connected = true;
      if (!this._wired) this._wire();
      this._syncLabel();
      this._readPresets();
      this._syncAlpha();
      this._eyedropper.hidden = typeof window.EyeDropper !== 'function';
      if (this._default === undefined) this._default = this.getAttribute('value') || '#000000';
      this._setFrom(parseColor(this.getAttribute('value') || this._value) || { r: 0, g: 0, b: 0, a: 1 }, { emit: false, reflect: false });
      this._syncDisabled();
      while (this._pending.length) {
        const { method, args } = this._pending.shift();
        this[method](...args);
      }
    }

    disconnectedCallback() {
      this._connected = false;
      document.removeEventListener('pointerdown', this._onDocPointerDown, true);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this._connected) return;
      switch (name) {
        case 'value':
          if (this._reflecting) return;
          {
            const c = parseColor(newValue);
            if (c) this._setFrom(c, { emit: false, reflect: false });
          }
          break;
        case 'label':
        case 'aria-label':
          this._syncLabel();
          break;
        case 'alpha':
          this._syncAlpha();
          this._render();
          break;
        case 'list-data':
          this._readPresets();
          break;
        case 'disabled':
          this._syncDisabled();
          break;
        default:
          this._syncForm();
      }
    }

    formResetCallback() {
      this._setFrom(parseColor(this._default) || { r: 0, g: 0, b: 0, a: 1 }, { emit: false });
    }

    formDisabledCallback(disabled) {
      this._formDisabled = disabled;
      this._syncDisabled();
    }

    /* ---------------- public API ---------------- */

    get value() {
      return this._value;
    }

    set value(v) {
      const c = parseColor(v);
      if (!c) return;
      if (!this._connected) {
        this.setAttribute('value', String(v));
        return;
      }
      this._setFrom(c, { emit: false });
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }

    set disabled(v) {
      this.toggleAttribute('disabled', !!v);
    }

    open() {
      if (!this._connected) {
        this._pending.push({ method: 'open', args: [] });
        return;
      }
      if (!this._popup.hidden || this._isDisabled()) return;
      this._openValue = this._value;
      this._popup.hidden = false;
      this._swatchBtn.setAttribute('aria-expanded', 'true');
      // Open upwards when there is no room below
      const r = this.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      this.toggleAttribute('data-up', below < this._popup.offsetHeight + 16 && r.top > below);
      this._render();
      document.addEventListener('pointerdown', this._onDocPointerDown, true);
      this._area.focus({ preventScroll: true });
      this.dispatchEvent(new CustomEvent('color-open', { bubbles: true, composed: true }));
    }

    /** keep = false reverts to the colour from before opening. */
    close(keep = true, refocus = true) {
      if (!this._connected) {
        this._pending.push({ method: 'close', args: [keep, refocus] });
        return;
      }
      if (this._popup.hidden) return;
      if (!keep && this._openValue && this._openValue !== this._value) {
        this._setFrom(parseColor(this._openValue), { emit: true });
      }
      const changed = this._openValue !== null && this._openValue !== this._value;
      const previous = this._openValue;
      this._openValue = null;
      this._popup.hidden = true;
      this._swatchBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('pointerdown', this._onDocPointerDown, true);
      if (refocus) this._swatchBtn.focus({ preventScroll: true });
      if (changed && keep) this._emitChange(previous);
      this.dispatchEvent(new CustomEvent('color-close', { bubbles: true, composed: true }));
    }

    /* ---------------- state ---------------- */

    _isDisabled() {
      return this.hasAttribute('disabled') || !!this._formDisabled;
    }

    _hasAlpha() {
      return this.hasAttribute('alpha');
    }

    _rgb() {
      return hsvToRgb(this._hsv.h, this._hsv.s, this._hsv.v);
    }

    _format() {
      const { r, g, b } = this._rgb();
      const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
      return this._hasAlpha() && this._a < 1 ? base + hex2(this._a * 255) : base;
    }

    /** Set from {r,g,b,a}; keeps the current hue for greys. */
    _setFrom(c, { emit = true, reflect = true } = {}) {
      const hsv = rgbToHsv(c.r, c.g, c.b);
      if (hsv.s === 0 || hsv.v === 0) hsv.h = this._hsv.h;
      this._hsv = hsv;
      this._a = this._hasAlpha() ? clamp(c.a ?? 1, 0, 1) : 1;
      this._commit({ emit, reflect });
    }

    /** After any change of _hsv / _a: value, field, form, events. */
    _commit({ emit = true, reflect = true } = {}) {
      const before = this._value;
      this._value = this._format();
      if (reflect && this.getAttribute('value') !== this._value) {
        this._reflecting = true;
        this.setAttribute('value', this._value);
        this._reflecting = false;
      }
      this._render();
      this._syncForm();
      if (emit && before !== this._value) {
        // Live: the value is already set while the user is still picking.
        this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        const { r, g, b } = this._rgb();
        this.dispatchEvent(new CustomEvent('color-input', {
          bubbles: true,
          composed: true,
          detail: {
            value: this._value,
            rgb: { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: +this._a.toFixed(3) },
            hsv: { h: Math.round(this._hsv.h), s: Math.round(this._hsv.s * 100), v: Math.round(this._hsv.v * 100) },
          },
        }));
      }
    }

    _emitChange(previous) {
      if (previous === this._value) return;
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      this.dispatchEvent(new CustomEvent('color-change', {
        bubbles: true,
        composed: true,
        detail: { value: this._value, previous },
      }));
      this._status.textContent = `Colour ${this._value}`;
    }

    /** A discrete step (key, preset, typed): input + change at once (unless the picker is open). */
    _step(update) {
      const previous = this._value;
      update();
      this._commit();
      if (this._popup.hidden) this._emitChange(previous);
    }

    /* ---------------- rendering ---------------- */

    _render() {
      const { h, s, v } = this._hsv;
      const { r, g, b } = this._rgb();
      const opaque = `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
      const current = `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${this._a})`;
      this._swatchBtn.style.setProperty('--_current', current);
      this._popup.style.setProperty('--_current', current);
      this._popup.style.setProperty('--_hue', String(h));
      this._alpha.style.setProperty('--_opaque', opaque);

      this._areaThumb.style.left = `${s * 100}%`;
      this._areaThumb.style.top = `${(1 - v) * 100}%`;
      this._areaThumb.style.setProperty('--_thumb-color', opaque);
      this._hueThumb.style.left = `${(h / 360) * 100}%`;
      this._hueThumb.style.setProperty('--_thumb-color', `hsl(${h} 100% 50%)`);
      this._alphaThumb.style.left = `${this._a * 100}%`;
      this._alphaThumb.style.setProperty('--_thumb-color', current);

      this._area.setAttribute('aria-valuenow', String(Math.round(s * 100)));
      this._area.setAttribute('aria-valuetext', `Saturation ${Math.round(s * 100)}%, brightness ${Math.round(v * 100)}%`);
      this._hue.setAttribute('aria-valuenow', String(Math.round(h)));
      this._hue.setAttribute('aria-valuetext', `${Math.round(h)} degrees`);
      this._alpha.setAttribute('aria-valuenow', String(Math.round(this._a * 100)));
      this._alpha.setAttribute('aria-valuetext', `${Math.round(this._a * 100)}%`);

      if (this.shadowRoot.activeElement !== this._hexInput) this._hexInput.value = this._value;
      this._previewReadout.textContent = this._value;
      this._previewSub.textContent = `rgb ${Math.round(r)} ${Math.round(g)} ${Math.round(b)}${this._a < 1 ? ` · ${Math.round(this._a * 100)}%` : ''}`;

      const name = this.getAttribute('label') || this.getAttribute('aria-label') || 'Colour';
      this._swatchBtn.setAttribute('aria-label', `${name}: ${this._value}. Open colour picker`);

      this._presets.querySelectorAll('.preset').forEach((btn) => {
        btn.setAttribute('aria-pressed', String(btn.dataset.value.toLowerCase() === this._value.toLowerCase()));
      });
    }

    _syncLabel() {
      this._labelEl.textContent = this.getAttribute('label') || '';
      const name = this.getAttribute('label') || this.getAttribute('aria-label') || 'Colour';
      this._hexInput.setAttribute('aria-label', `${name}, hex value`);
      this._popup.setAttribute('aria-label', `${name} picker`);
      this._render && this._connected && this._render();
    }

    _syncAlpha() {
      this._alpha.hidden = !this._hasAlpha();
      if (!this._hasAlpha()) this._a = 1;
    }

    _syncDisabled() {
      const off = this._isDisabled();
      this._swatchBtn.disabled = off;
      this._hexInput.disabled = off;
      if (off) this.close(true, false);
    }

    _syncForm() {
      if (!this._internals) return;
      this._internals.setFormValue(this._value);
      if (this.hasAttribute('required') && !this._value) {
        this._internals.setValidity({ valueMissing: true }, 'Please choose a colour.', this._hexInput);
      } else {
        this._internals.setValidity({});
      }
    }

    _readPresets() {
      let list = [];
      const raw = this.getAttribute('list-data');
      if (raw) {
        try {
          list = JSON.parse(raw);
        } catch (err) {
          console.error(`<${TAG_NAME}> failed to parse list-data as JSON:`, err);
        }
      }
      this._presets.textContent = '';
      (Array.isArray(list) ? list : []).forEach((item) => {
        const value = typeof item === 'object' && item !== null ? item.value : item;
        const c = parseColor(value);
        if (!c) return;
        const label = typeof item === 'object' && item && item.label ? String(item.label) : String(value);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'preset';
        btn.dataset.value = `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}${c.a < 1 && this._hasAlpha() ? hex2(c.a * 255) : ''}`;
        btn.style.setProperty('--_c', `rgb(${c.r} ${c.g} ${c.b} / ${c.a})`);
        btn.style.setProperty('--_mark', isLight(c) ? '#18181b' : '#ffffff');
        btn.setAttribute('aria-label', label);
        btn.title = label;
        this._presets.append(btn);
      });
      if (this._connected) this._render();
    }

    /* ---------------- interaction ---------------- */

    _wire() {
      this._wired = true;

      this._swatchBtn.addEventListener('click', () => {
        if (this._popup.hidden) this.open();
        else this.close(true);
      });
      this._swatchBtn.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'ArrowDown') {
          e.preventDefault();
          this.open();
        }
      });

      // Hex field: typed colours apply live when valid; normalised on blur
      this._hexInput.addEventListener('input', () => {
        const c = parseColor(this._hexInput.value);
        if (!c) return;
        const previous = this._value;
        this._setFrom(c);
        this._typedFrom = this._typedFrom ?? previous;
      });
      const finishTyping = () => {
        this._hexInput.value = this._value;
        if (this._typedFrom !== undefined) this._emitChange(this._typedFrom);
        this._typedFrom = undefined;
      };
      this._hexInput.addEventListener('change', finishTyping);
      this._hexInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') finishTyping();
        if (e.key === 'Escape' && this._typedFrom !== undefined) {
          this._setFrom(parseColor(this._typedFrom));
          this._typedFrom = undefined;
        }
      });

      // 2D area and sliders: pointer drags update the value live
      this._drag(this._area, (x, y) => {
        this._hsv = { ...this._hsv, s: x, v: 1 - y };
      });
      this._drag(this._hue, (x) => {
        this._hsv = { ...this._hsv, h: x * 360 };
      });
      this._drag(this._alpha, (x) => {
        this._a = x;
      });

      this._area.addEventListener('keydown', (e) => {
        const d = e.shiftKey ? 0.1 : 0.01;
        const moves = {
          ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d],
        };
        const m = moves[e.key];
        if (!m) return;
        e.preventDefault();
        this._step(() => {
          this._hsv = { ...this._hsv, s: clamp(this._hsv.s + m[0], 0, 1), v: clamp(this._hsv.v + m[1], 0, 1) };
        });
      });
      this._sliderKeys(this._hue, 360, () => this._hsv.h, (v) => { this._hsv = { ...this._hsv, h: v }; });
      this._sliderKeys(this._alpha, 100, () => this._a * 100, (v) => { this._a = v / 100; });

      this._presets.addEventListener('click', (e) => {
        const btn = e.target.closest('.preset');
        if (!btn) return;
        this._step(() => {
          const c = parseColor(btn.dataset.value);
          const hsv = rgbToHsv(c.r, c.g, c.b);
          if (hsv.s === 0 || hsv.v === 0) hsv.h = this._hsv.h;
          this._hsv = hsv;
          if (this._hasAlpha()) this._a = c.a;
        });
      });

      this._eyedropper.addEventListener('click', async () => {
        try {
          const { sRGBHex } = await new window.EyeDropper().open();
          const c = parseColor(sRGBHex);
          if (c) this._step(() => {
            const hsv = rgbToHsv(c.r, c.g, c.b);
            if (hsv.s === 0 || hsv.v === 0) hsv.h = this._hsv.h;
            this._hsv = hsv;
          });
        } catch { /* cancelled */ }
      });

      // Escape reverts, Enter keeps; focus leaving the component keeps
      this._popup.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          this.close(false);
        } else if (e.key === 'Enter' && e.target.localName !== 'button') {
          e.preventDefault();
          this.close(true);
        }
      });
      // Focus moving to something outside closes (and keeps). Focus inside our
      // shadow root shows up here as the host itself; no relatedTarget means
      // a click on something unfocusable, which the document listener handles.
      this.addEventListener('focusout', (e) => {
        const to = e.relatedTarget;
        if (this._popup.hidden || !to || to === this || this.contains(to)) return;
        this.close(true, false);
      });
    }

    /** Pointer drag on a surface: x / y as 0–1, live input, change on release. */
    _drag(surface, apply) {
      const at = (e) => {
        const r = surface.getBoundingClientRect();
        apply(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1));
        this._commit();
      };
      surface.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        surface.focus({ preventScroll: true });
        surface.setPointerCapture(e.pointerId);
        this._dragStart = this._value;
        at(e);
      });
      surface.addEventListener('pointermove', (e) => {
        if (this._dragStart === null || !surface.hasPointerCapture(e.pointerId)) return;
        at(e);
      });
      const end = (e) => {
        if (this._dragStart === null) return;
        if (surface.hasPointerCapture(e.pointerId)) surface.releasePointerCapture(e.pointerId);
        const previous = this._dragStart;
        this._dragStart = null;
        // While the picker is open, "change" waits for it to close (one pick, one change);
        // the drag itself is already live through "input".
        if (this._popup.hidden) this._emitChange(previous);
      };
      surface.addEventListener('pointerup', end);
      surface.addEventListener('pointercancel', end);
    }

    _sliderKeys(el, max, get, set) {
      el.addEventListener('keydown', (e) => {
        const step = e.shiftKey ? 10 : 1;
        let v = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = get() + step;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = get() - step;
        else if (e.key === 'Home') v = 0;
        else if (e.key === 'End') v = max;
        if (v === null) return;
        e.preventDefault();
        this._step(() => set(clamp(v, 0, max)));
      });
    }

    _onDocPointerDown(e) {
      if (!e.composedPath().includes(this)) this.close(true, false);
    }
  }

  customElements.define(TAG_NAME, KakaoColorPicker);
})();
