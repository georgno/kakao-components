/**
 * <kakao-multi-dropdown>
 * ============================================================================
 * Several separate dropdowns joined into one input group that holds a single
 * value, e.g. a date "dd.mm.yyyy" (Day | Month | Year) or a product variant
 * "Size / Colour". Segments can
 * offer an "Unknown" choice, so a partly known date such as 00.00.1990
 * ("sometime in 1990") is a valid value. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="multi-dropdown.js"><\/script>
 *
 *   <!-- date preset: day . month . year, day and month may be unknown -->
 *   <kakao-multi-dropdown type="date" label="Date of birth" name="dob"
 *     allow-unknown="day,month" value="00.00.1990"></kakao-multi-dropdown>
 *
 *   <!-- custom segments -->
 *   <kakao-multi-dropdown label="Variant" separator=" / " list-data='[
 *     {"name":"size","label":"Size","options":["S","M","L","XL"]},
 *     {"name":"color","label":"Colour","options":[{"value":"blk","label":"Black"},{"value":"wht","label":"White"}]}
 *   ]'></kakao-multi-dropdown>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  label          Visible label. Default "Value".
 *  type           "date" builds day / month / year segments (dd.mm.yyyy).
 *                 Without it, segments come from list-data.
 *  list-data      JSON array of segments (never "data"):
 *                   { name, label?, placeholder?, options, unknown?, separator? }
 *                 options: strings or { value, label?, disabled? }.
 *                 unknown: true, or { value, label } to add an "Unknown" choice.
 *                 separator: text after this segment (overrides the attribute).
 *  value          The joined value, e.g. "00.00.1990". Reflects the current
 *                 value once every segment has one, "" while incomplete.
 *  separator      Text between the parts in the joined value (not drawn; the
 *                 boxes sit edge to edge). Default "." for type="date", " " else.
 *  allow-unknown  Adds an "Unknown" option. Empty / "true" = every segment, or a
 *                 comma list of segment names ("day,month"). For dates the unknown
 *                 value is zeros ("00", "0000"); for custom segments "?" unless
 *                 the segment sets its own.
 *  min-year       type="date": first year in the list. Default 1900.
 *  max-year       type="date": last year. Default: the current year.
 *  disabled       Blocks all interaction.
 *  required       With a form: an incomplete value fails validation.
 *  name           Form field name (the element is form-associated).
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  value                 Get / set the joined value ("" while incomplete).
 *  getParts()            { [segmentName]: value | null }
 *  setPart(name, value)  Set one segment.
 *  setData(segments)     Replace the segments (same shape as list-data).
 *  clear()               Unset every segment.
 *  focus()               Focus the first segment.
 *
 *  Calls made before the element is connected are queued.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  dropdown-change   { value, parts, complete, unknown: [segment names] }
 *                    after any segment changed (also when a day was clamped).
 *  dropdown-open     { segment }    a segment's list opened.
 *  dropdown-close    { segment }
 *
 * ----------------------------------------------------------------------------
 * KEYBOARD (on a segment)
 * ----------------------------------------------------------------------------
 *  Closed:  ↑ / ↓ step the value · Enter, Space, Alt+↓ open the list ·
 *           ← / → previous / next segment · digits / letters type-ahead
 *           (a complete entry moves on to the next segment) · Delete clears.
 *  Open:    ↑ / ↓ / Home / End / PageUp / PageDown move · Enter or Space pick ·
 *           Escape or Tab close · type-ahead jumps.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES
 * ----------------------------------------------------------------------------
 *  Set them on the element or any ancestor. Their defaults live in the
 *  settings block of this file: change them on construction.html (some
 *  follow the main variables in shared/tokens.css).
 *
 *  --kakao-multi-dropdown-accent        #4f46e5   focus ring, selected option
 *  --kakao-multi-dropdown-bg            #ffffff
 *  --kakao-multi-dropdown-border        #d1d5db
 *  --kakao-multi-dropdown-radius        10px
 *  --kakao-multi-dropdown-text          #111827
 *  --kakao-multi-dropdown-muted         #9ca3af   placeholders, unknown values
 *  --kakao-multi-dropdown-hover-bg      #f3f4f6
 *  --kakao-multi-dropdown-popup-height  16rem     max height of an open list
 *  --kakao-multi-dropdown-font          0.95rem/1.4 --kakao-font-family (else system-ui)
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  - The field is role="group" labelled by the visible label. Each segment is a
 *    button with aria-haspopup="listbox" and aria-expanded, named
 *    "<segment label>, <current value>".
 *  - Lists are role="listbox"; focus stays on the segment and the highlighted
 *    option is exposed with aria-activedescendant.
 *  - Disabled options (impossible days) are aria-disabled and skipped.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-multi-dropdown';
  if (customElements.get(TAG_NAME)) return;

  /** Type-ahead buffer is cleared after this pause (ms). */
  const TYPEAHEAD_MS = 900;
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  const pad = (n, len) => String(n).padStart(len, '0');
  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysIn = (month, year) => {
    if (month === 2) return year == null ? 29 : isLeap(year) ? 29 : 28;
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
  };

  const CHEVRON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>';

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        /* @kakao-settings:start prefix=--kakao-multi-dropdown- (written by construction.html, edit there) */
        --_accent: var(--kakao-multi-dropdown-accent, var(--kakao-color-primary, #4f46e5));
        --_bg: var(--kakao-multi-dropdown-bg, var(--kakao-color-bg, #ffffff));
        --_border: var(--kakao-multi-dropdown-border, var(--kakao-color-border, #d1d5db));
        --_radius: var(--kakao-multi-dropdown-radius, 10px);
        --_text: var(--kakao-multi-dropdown-text, var(--kakao-color-text, #111827));
        --_muted: var(--kakao-multi-dropdown-muted, #9ca3af);
        --_hover-bg: var(--kakao-multi-dropdown-hover-bg, #f3f4f6);
        --_popup-height: var(--kakao-multi-dropdown-popup-height, 16rem);
        --_font: var(--kakao-multi-dropdown-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_disabled-opacity: var(--kakao-multi-dropdown-disabled-opacity, 0.55);
        --_label-gap: var(--kakao-multi-dropdown-label-gap, 0.4rem);
        --_padding: var(--kakao-multi-dropdown-padding, 0.45rem 0.55rem 0.45rem 0.75rem);
        --_chevron-gap: var(--kakao-multi-dropdown-chevron-gap, 0.6rem);
        --_chevron-size: var(--kakao-multi-dropdown-chevron-size, 0.9em);
        --_focus-ring-width: var(--kakao-multi-dropdown-focus-ring-width, 3px);
        --_popup-offset: var(--kakao-multi-dropdown-popup-offset, 0.45rem);
        --_popup-padding: var(--kakao-multi-dropdown-popup-padding, 0.25rem);
        --_popup-shadow: var(--kakao-multi-dropdown-popup-shadow, 0 8px 24px rgba(0, 0, 0, 0.08));
        --_option-padding: var(--kakao-multi-dropdown-option-padding, 0.35rem 0.6rem);
        --_option-radius: var(--kakao-multi-dropdown-option-radius, 6px);
        /* @kakao-settings:end */
        display: inline-block;
        max-width: 100%;
        font: var(--_font);
        color: var(--_text);
      }

      :host([disabled]) { opacity: var(--_disabled-opacity); }

      .label {
        display: block;
        margin-bottom: var(--_label-gap);
        font-weight: 600;
      }

      /* ---- Input group: one dropdown box per segment, joined edge to edge ---- */
      .field {
        display: inline-flex;
        align-items: stretch;
        max-width: 100%;
      }

      /* Boxes keep their natural width but may shrink (labels then get an ellipsis),
         so the group never overflows its container. */
      .seg { position: relative; display: flex; flex: 0 1 auto; min-width: 0; }

      /* Neighbours overlap by one border width so shared edges are a single line. */
      .seg + .seg { margin-left: -1px; }

      .trigger {
        position: relative;
        display: inline-flex;
        width: 100%;
        min-width: 0;
        align-items: center;
        justify-content: space-between;
        gap: var(--_chevron-gap);
        padding: var(--_padding);
        font: inherit;
        font-variant-numeric: tabular-nums;
        color: inherit;
        background: var(--_bg);
        border: 1px solid var(--_border);
        border-radius: 0;
        cursor: pointer;
        outline: none;
        white-space: nowrap;
        transition: background-color 120ms ease, border-color 150ms ease, box-shadow 150ms ease;
      }

      /* Only the outer corners of the group are rounded. */
      .seg:first-child .trigger {
        border-top-left-radius: var(--_radius);
        border-bottom-left-radius: var(--_radius);
      }
      .seg:last-child .trigger {
        border-top-right-radius: var(--_radius);
        border-bottom-right-radius: var(--_radius);
      }

      .trigger:hover { background: var(--_hover-bg); }

      /* The focused / open box draws its full accent border above its neighbours. */
      .trigger:focus-visible,
      .trigger[aria-expanded="true"] {
        z-index: 1;
        border-color: var(--_accent);
        box-shadow: 0 0 0 var(--_focus-ring-width) color-mix(in srgb, var(--_accent) 14%, transparent);
      }

      :host([disabled]) .trigger { cursor: not-allowed; background: var(--_bg); }

      /* Each box is as wide as its longest entry, so it doesn't jump when the value changes. */
      /* All labels are stacked in one grid cell: .current shows, the .sizer copies
         only take up space. Still allowed to shrink (ellipsis) when space is short. */
      .text {
        display: grid;
        flex: 0 1 auto;
        min-width: 0;
        text-align: left;
      }
      .text > span {
        grid-area: 1 / 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .text > .sizer { visibility: hidden; }
      .text > .sizer.is-unknown { font-style: italic; }
      .trigger[data-state="empty"] .text { color: var(--_muted); }
      .trigger[data-state="unknown"] .text {
        color: var(--_muted);
        font-style: italic;
      }

      .trigger svg {
        flex-shrink: 0;
        width: var(--_chevron-size);
        height: var(--_chevron-size);
        fill: none;
        stroke: var(--_muted);
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        transition: transform 180ms ease;
      }
      .trigger[aria-expanded="true"] svg { transform: rotate(180deg); }

      /* ---- Popup list ---- */
      .popup {
        position: absolute;
        z-index: 20;
        top: calc(100% + var(--_popup-offset));
        left: 0;
        min-width: max(100%, 8rem);
        max-height: var(--_popup-height);
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: var(--_popup-padding);
        list-style: none;
        background: var(--_bg);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        box-shadow: var(--_popup-shadow);
        transform-origin: top left;
        animation: kakao-md-pop 140ms ease-out;
      }
      .popup[hidden] { display: none; }

      @keyframes kakao-md-pop {
        from { opacity: 0; transform: translateY(-4px) scale(0.98); }
      }

      .option {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: var(--_option-padding);
        border-radius: var(--_option-radius);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        cursor: pointer;
      }

      .option .hint { color: var(--_muted); font-size: 0.85em; }
      .option[data-active="true"] { background: var(--_hover-bg); }
      .option[aria-selected="true"] { color: var(--_accent); font-weight: 600; }
      .option[aria-disabled="true"] { color: var(--_muted); cursor: not-allowed; text-decoration: line-through; }
      .option.is-unknown { font-style: italic; border-bottom: 1px solid var(--_hover-bg); margin-bottom: 0.15rem; }

      @media (prefers-reduced-motion: reduce) {
        .popup { animation: none; }
        .trigger svg { transition: none; }
      }
    </style>
    <div class="root">
      <span class="label" id="label" part="label"></span>
      <div class="field" part="field" role="group" aria-labelledby="label"></div>
    </div>
  `;

  class KakaoMultiDropdown extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['label', 'type', 'list-data', 'value', 'separator', 'allow-unknown', 'min-year', 'max-year', 'disabled', 'required', 'name'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      this._labelEl = shadow.querySelector('.label');
      this._fieldEl = shadow.querySelector('.field');

      this._segments = []; // normalized: { name, label, placeholder, options, unknown, separator, width }
      this._values = {}; // name -> value | null
      this._open = null; // name of the open segment
      this._active = -1; // highlighted option index in the open list
      this._typed = ''; // type-ahead buffer
      this._typedAt = 0;
      this._connected = false;
      this._pending = [];
      this._customData = null; // segments from setData(), overriding list-data
      this._formDisabled = false;
      this._reflecting = false; // true while we write the value attribute ourselves
      this._wantedDay = null; // type="date": the day the user picked, before any clamping

      this._onClick = this._onClick.bind(this);
      this._onKeydown = this._onKeydown.bind(this);
      this._onDocPointerDown = this._onDocPointerDown.bind(this);
      this._onFocusOut = this._onFocusOut.bind(this);
      this._onMouseDown = this._onMouseDown.bind(this);
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      this._connected = true;
      this._fieldEl.addEventListener('click', this._onClick);
      this._fieldEl.addEventListener('keydown', this._onKeydown);
      this._fieldEl.addEventListener('focusout', this._onFocusOut);
      this._fieldEl.addEventListener('mousedown', this._onMouseDown);
      this._labelEl.addEventListener('click', () => this.focus());

      this._syncLabel();
      this._buildSegments();
      if (this._defaultValue === undefined) this._defaultValue = this.getAttribute('value'); // for form reset
      this._applyValue(this.getAttribute('value'));
      this._render();
      this._syncForm();

      while (this._pending.length) {
        const { method, args } = this._pending.shift();
        this[method](...args);
      }
    }

    disconnectedCallback() {
      this._connected = false;
      this._fieldEl.removeEventListener('click', this._onClick);
      this._fieldEl.removeEventListener('keydown', this._onKeydown);
      this._fieldEl.removeEventListener('focusout', this._onFocusOut);
      this._fieldEl.removeEventListener('mousedown', this._onMouseDown);
      document.removeEventListener('pointerdown', this._onDocPointerDown, true);
      this._open = null;
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this._connected) return;
      switch (name) {
        case 'label':
          this._syncLabel();
          break;
        case 'value':
          if (this._reflecting) return;
          this._applyValue(this.getAttribute('value'));
          this._render();
          this._syncForm();
          break;
        case 'disabled':
          this._close();
          this._render();
          break;
        case 'required':
        case 'name':
          this._syncForm();
          break;
        default: // type, list-data, separator, allow-unknown, min-year, max-year
          this._close();
          this._buildSegments();
          this._applyValue(this.getAttribute('value'));
          this._render();
          this._syncForm();
      }
    }

    formResetCallback() {
      this._applyValue(this._defaultValue);
      this._render();
      this._syncForm();
    }

    formDisabledCallback(disabled) {
      this._formDisabled = disabled;
      this._close();
      if (this._connected) this._render();
    }

    /* -------------------------- Public API -------------------------- */

    get value() {
      return this._joined();
    }
    set value(v) {
      this.setAttribute('value', v == null ? '' : String(v));
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }
    set disabled(val) {
      if (val) this.setAttribute('disabled', '');
      else this.removeAttribute('disabled');
    }

    /** @returns {Object<string, string|null>} */
    getParts() {
      const parts = {};
      this._segments.forEach((s) => { parts[s.name] = this._values[s.name] ?? null; });
      return parts;
    }

    setPart(name, value) {
      if (!this._connected) {
        this._pending.push({ method: 'setPart', args: [name, value] });
        return;
      }
      const seg = this._segments.find((s) => s.name === name);
      if (seg) this._choose(seg, value == null ? null : String(value));
    }

    /** @param {Array} segments same shape as list-data */
    setData(segments) {
      if (!this._connected) {
        this._pending.push({ method: 'setData', args: [segments] });
        return;
      }
      this._customData = Array.isArray(segments) ? segments : [];
      this._close();
      this._buildSegments();
      this._render();
      this._syncForm();
      this._emitChange();
    }

    clear() {
      if (!this._connected) {
        this._pending.push({ method: 'clear', args: [] });
        return;
      }
      this._segments.forEach((s) => { this._values[s.name] = null; });
      this._render();
      this._syncForm();
      this._emitChange();
    }

    focus(options) {
      const first = this._fieldEl.querySelector('.trigger');
      if (first) first.focus(options);
    }

    /* -------------------------- Segments -------------------------- */

    _isDisabled() {
      return this.disabled || this._formDisabled;
    }

    /** Which segment names get an "Unknown" option (null = none, true = all). */
    _unknownSet() {
      const raw = this.getAttribute('allow-unknown');
      if (raw === null || ['false', 'off', '0', 'no'].includes(raw.trim().toLowerCase())) return null;
      if (raw.trim() === '' || raw.trim().toLowerCase() === 'true') return true;
      return new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
    }

    _buildSegments() {
      const unknownFor = this._unknownSet();
      const wantsUnknown = (name, own) => {
        if (own === false) return false;
        if (own) return true;
        return unknownFor === true || (unknownFor instanceof Set && unknownFor.has(name));
      };
      const isDate = (this.getAttribute('type') || '').toLowerCase() === 'date';
      const sepAttr = this.getAttribute('separator');
      const defaultSep = sepAttr !== null ? sepAttr : isDate ? '.' : ' ';

      let raw;
      if (this._customData) {
        raw = this._customData;
      } else if (isDate) {
        raw = this._dateSegments();
      } else {
        try {
          raw = JSON.parse(this.getAttribute('list-data') || '[]');
        } catch (err) {
          console.error(`<${TAG_NAME}> failed to parse list-data as JSON:`, err);
          raw = [];
        }
      }

      this._segments = (Array.isArray(raw) ? raw : []).map((s, i) => {
        const name = s && s.name != null ? String(s.name) : `part${i + 1}`;
        const options = (s.options || []).map((o) =>
          typeof o === 'object' && o !== null
            ? { value: String(o.value), label: o.label != null ? String(o.label) : String(o.value), hint: o.hint || '', disabled: !!o.disabled }
            : { value: String(o), label: String(o), hint: '', disabled: false }
        );
        let unknown = null;
        if (wantsUnknown(name, s.unknown)) {
          const own = typeof s.unknown === 'object' && s.unknown !== null ? s.unknown : {};
          unknown = {
            value: String(own.value ?? s.unknownValue ?? '?'),
            label: String(own.label ?? 'Unknown'),
          };
        }
        const placeholder = s.placeholder != null ? String(s.placeholder) : (s.label || name);
        return {
          name,
          label: s.label != null ? String(s.label) : name,
          placeholder,
          options,
          unknown,
          separator: i < raw.length - 1 ? (s.separator != null ? String(s.separator) : defaultSep) : '',
        };
      });

      // Keep values that still exist, drop the rest.
      const next = {};
      this._segments.forEach((seg) => {
        const v = this._values[seg.name];
        next[seg.name] = v != null && this._allValues(seg).includes(v) ? v : null;
      });
      this._values = next;
    }

    /** Day / month / year segments for type="date". Unknown values are zeros. */
    _dateSegments() {
      const now = new Date().getFullYear();
      const minY = parseInt(this.getAttribute('min-year'), 10) || 1900;
      const maxY = parseInt(this.getAttribute('max-year'), 10) || now;
      const lo = Math.min(minY, maxY);
      const hi = Math.max(minY, maxY);
      const years = [];
      for (let y = hi; y >= lo; y--) years.push({ value: String(y), label: String(y) });
      return [
        {
          name: 'day', label: 'Day', placeholder: 'Day', unknownValue: '00',
          options: Array.from({ length: 31 }, (_, i) => ({ value: pad(i + 1, 2), label: pad(i + 1, 2) })),
        },
        {
          name: 'month', label: 'Month', placeholder: 'Month', unknownValue: '00',
          // Shown by name in the box; the number is the hint in the list and the stored value.
          options: MONTH_NAMES.map((m, i) => ({ value: pad(i + 1, 2), label: m, hint: pad(i + 1, 2) })),
        },
        { name: 'year', label: 'Year', placeholder: 'Year', unknownValue: '0000', options: years },
      ];
    }

    _allValues(seg) {
      const vals = seg.options.map((o) => o.value);
      if (seg.unknown) vals.unshift(seg.unknown.value);
      return vals;
    }

    /** Options as shown in a list: Unknown first, then the regular ones (with live disabling for dates). */
    _listFor(seg) {
      const list = [];
      if (seg.unknown) list.push({ value: seg.unknown.value, label: seg.unknown.label, hint: seg.unknown.value, disabled: false, unknown: true });
      const maxDay = seg.name === 'day' && this._isDate() ? this._maxDay() : null;
      seg.options.forEach((o) => {
        const disabled = o.disabled || (maxDay !== null && Number(o.value) > maxDay);
        list.push({ ...o, disabled, unknown: false });
      });
      return list;
    }

    _isDate() {
      return !this._customData && (this.getAttribute('type') || '').toLowerCase() === 'date';
    }

    /** Last valid day for the chosen month/year; 31 while either is unset or unknown. */
    _maxDay() {
      const m = Number(this._values.month);
      const y = Number(this._values.year);
      if (!m) return 31;
      return daysIn(m, y ? y : null);
    }

    /* -------------------------- Value -------------------------- */

    _joined() {
      if (!this._segments.length) return '';
      let out = '';
      for (const seg of this._segments) {
        const v = this._values[seg.name];
        if (v == null) return '';
        out += v + seg.separator;
      }
      return out;
    }

    /** Parses a joined value into the segments, walking separator by separator. */
    _applyValue(raw) {
      this._segments.forEach((s) => { this._values[s.name] = null; });
      this._wantedDay = null;
      if (!raw) return;
      let rest = raw;
      this._segments.forEach((seg) => {
        let part = rest;
        if (seg.separator) {
          const i = rest.indexOf(seg.separator);
          part = i === -1 ? rest : rest.slice(0, i);
          rest = i === -1 ? '' : rest.slice(i + seg.separator.length);
        } else {
          rest = '';
        }
        if (this._allValues(seg).includes(part)) this._values[seg.name] = part;
      });
      this._rememberDay();
      this._clampDay();
    }

    /**
     * For dates: shows the chosen day, or the month's last day if it is shorter.
     * Works from the day the user actually picked (_wantedDay), so passing through
     * a short month or non-leap year (e.g. while typing a year) never loses it:
     * 31 → February → 29 → back to a 31-day month → 31 again.
     */
    _clampDay() {
      if (!this._isDate()) return;
      const wanted = this._wantedDay;
      if (!wanted) return;
      this._values.day = pad(Math.min(wanted, this._maxDay()), 2);
    }

    /** Remembers a real (non-unknown) day as the one to aim for. */
    _rememberDay() {
      if (!this._isDate()) return;
      const d = Number(this._values.day);
      this._wantedDay = d > 0 ? d : null;
    }

    _choose(seg, value) {
      if (value !== null && !this._allValues(seg).includes(value)) return;
      if (this._values[seg.name] === value) return;
      this._values[seg.name] = value;
      if (seg.name === 'day') this._rememberDay();
      this._clampDay();
      this._render();
      this._syncForm();
      this._emitChange();
    }

    _syncForm() {
      const value = this._joined();
      // Reflect the complete value (or "" while incomplete) without re-parsing it.
      this._reflecting = true;
      if (this.getAttribute('value') !== value && (value || this.hasAttribute('value'))) {
        if (value) this.setAttribute('value', value);
        else this.removeAttribute('value');
      }
      this._reflecting = false;

      if (!this._internals) return;
      this._internals.setFormValue(value || null);
      const anySet = this._segments.some((s) => this._values[s.name] != null);
      const first = this._fieldEl.querySelector('.trigger');
      if (this.hasAttribute('required') && !value) {
        this._internals.setValidity({ valueMissing: true }, 'Please complete every part.', first || undefined);
      } else if (anySet && !value) {
        this._internals.setValidity({ badInput: true }, 'Please complete every part.', first || undefined);
      } else {
        this._internals.setValidity({});
      }
    }

    _emitChange() {
      const parts = this.getParts();
      this._dispatch('dropdown-change', {
        value: this._joined(),
        parts,
        complete: this._joined() !== '',
        unknown: this._segments.filter((s) => s.unknown && parts[s.name] === s.unknown.value).map((s) => s.name),
      });
    }

    /* -------------------------- Rendering -------------------------- */

    _syncLabel() {
      this._labelEl.textContent = this.getAttribute('label') || 'Value';
    }

    _render() {
      const focusedName = this.shadowRoot.activeElement && this.shadowRoot.activeElement.dataset.seg;
      this._fieldEl.textContent = '';
      const off = this._isDisabled();

      this._segments.forEach((seg) => {
        const wrap = document.createElement('div');
        wrap.className = 'seg';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'trigger';
        trigger.dataset.seg = seg.name;
        trigger.disabled = off;
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', `list-${seg.name}`);

        const v = this._values[seg.name];
        const isUnknown = v != null && seg.unknown && v === seg.unknown.value;
        trigger.dataset.state = v == null ? 'empty' : isUnknown ? 'unknown' : 'set';
        // The visible label sits on top of invisible copies of every label this box
        // can show, so the box is exactly as wide as its widest label in the real
        // font and never changes size when the value changes.
        const text = document.createElement('span');
        text.className = 'text';
        const current = document.createElement('span');
        current.className = 'current';
        current.textContent = v == null ? seg.placeholder : isUnknown ? seg.unknown.label : this._optionLabel(seg, v);
        text.append(current);
        const sizes = new Set([seg.placeholder, ...seg.options.map((o) => o.label)]);
        sizes.forEach((label) => {
          const sizer = document.createElement('span');
          sizer.className = 'sizer';
          sizer.textContent = label;
          text.append(sizer);
        });
        if (seg.unknown) {
          const sizer = document.createElement('span');
          sizer.className = 'sizer is-unknown'; // italic like the shown Unknown label
          sizer.textContent = seg.unknown.label;
          text.append(sizer);
        }
        trigger.append(text);
        trigger.insertAdjacentHTML('beforeend', CHEVRON);

        const shown = v == null ? 'not set' : isUnknown ? seg.unknown.label : this._labelOf(seg, v);
        trigger.setAttribute('aria-label', `${seg.label}, ${shown}`);
        if (isUnknown) trigger.title = `${seg.label}: ${seg.unknown.label}`;

        const popup = document.createElement('ul');
        popup.className = 'popup';
        popup.id = `list-${seg.name}`;
        popup.setAttribute('role', 'listbox');
        popup.setAttribute('aria-label', seg.label);
        popup.hidden = true;

        wrap.append(trigger, popup);
        this._fieldEl.append(wrap);

      });

      if (focusedName) {
        const t = this._trigger(focusedName);
        if (t) t.focus();
      }
      if (this._open) this._renderPopup();
    }

    /** The label shown in a segment's box. */
    _optionLabel(seg, value) {
      const o = seg.options.find((x) => x.value === value);
      return o ? o.label : value;
    }

    _labelOf(seg, value) {
      const o = seg.options.find((x) => x.value === value);
      if (!o) return value;
      return o.hint ? `${o.label} (${o.hint})` : o.label;
    }

    _trigger(name) {
      return this._fieldEl.querySelector(`.trigger[data-seg="${CSS.escape(name)}"]`);
    }

    _renderPopup() {
      const seg = this._segments.find((s) => s.name === this._open);
      const trigger = seg && this._trigger(seg.name);
      if (!trigger) return;
      const popup = trigger.nextElementSibling;
      const list = this._listFor(seg);
      const current = this._values[seg.name];
      popup.textContent = '';
      list.forEach((o, i) => {
        const li = document.createElement('li');
        li.className = o.unknown ? 'option is-unknown' : 'option';
        li.id = `opt-${seg.name}-${i}`;
        li.setAttribute('role', 'option');
        li.dataset.index = String(i);
        li.setAttribute('aria-selected', String(o.value === current));
        if (o.disabled) li.setAttribute('aria-disabled', 'true');
        if (i === this._active) li.dataset.active = 'true';
        const label = document.createElement('span');
        label.textContent = o.label;
        li.append(label);
        if (o.hint) {
          const hint = document.createElement('span');
          hint.className = 'hint';
          hint.textContent = o.hint;
          li.append(hint);
        }
        popup.append(li);
      });
      popup.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      this._syncActive(popup, trigger);
    }

    /** Marks the highlighted option, keeps it in view, and points aria-activedescendant at it. */
    _syncActive(popup, trigger) {
      popup.querySelectorAll('.option').forEach((li) => {
        if (Number(li.dataset.index) === this._active) li.dataset.active = 'true';
        else delete li.dataset.active;
      });
      const active = popup.querySelector(`.option[data-index="${this._active}"]`);
      if (active) {
        trigger.setAttribute('aria-activedescendant', active.id);
        const top = active.offsetTop;
        const bottom = top + active.offsetHeight;
        if (top < popup.scrollTop) popup.scrollTop = top - 4;
        else if (bottom > popup.scrollTop + popup.clientHeight) popup.scrollTop = bottom - popup.clientHeight + 4;
      } else {
        trigger.removeAttribute('aria-activedescendant');
      }
    }

    /* -------------------------- Open / close -------------------------- */

    _openSeg(name) {
      if (this._isDisabled()) return;
      if (this._open && this._open !== name) this._close();
      const seg = this._segments.find((s) => s.name === name);
      if (!seg) return;
      const list = this._listFor(seg);
      const current = list.findIndex((o) => o.value === this._values[name]);
      this._open = name;
      this._active = current >= 0 ? current : list.findIndex((o) => !o.disabled && !o.unknown);
      this._renderPopup();
      // Centre the current value in the list on open.
      const popup = this._trigger(name).nextElementSibling;
      const active = popup.querySelector(`.option[data-index="${this._active}"]`);
      if (active) popup.scrollTop = active.offsetTop - popup.clientHeight / 2 + active.offsetHeight / 2;
      document.addEventListener('pointerdown', this._onDocPointerDown, true);
      this._dispatch('dropdown-open', { segment: name });
    }

    _close() {
      if (!this._open) return;
      const name = this._open;
      this._open = null;
      this._active = -1;
      const trigger = this._trigger(name);
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.removeAttribute('aria-activedescendant');
        trigger.nextElementSibling.hidden = true;
      }
      document.removeEventListener('pointerdown', this._onDocPointerDown, true);
      this._dispatch('dropdown-close', { segment: name });
    }

    _onDocPointerDown(evt) {
      if (!evt.composedPath().includes(this)) this._close();
    }

    /** Pressing inside an open list must not move focus away, or focusout would close it before the click. */
    _onMouseDown(evt) {
      if (evt.target.closest('.popup')) evt.preventDefault();
    }

    _onFocusOut(evt) {
      // Focus left the whole field (not just moved to another segment).
      if (!evt.relatedTarget || !this.shadowRoot.contains(evt.relatedTarget)) this._close();
    }

    /* -------------------------- Interaction -------------------------- */

    _onClick(evt) {
      if (this._isDisabled()) return;
      const option = evt.target.closest('.option');
      if (option) {
        const seg = this._segments.find((s) => s.name === this._open);
        const o = seg && this._listFor(seg)[Number(option.dataset.index)];
        if (!o || o.disabled) return;
        this._pick(seg, o.value);
        return;
      }
      const trigger = evt.target.closest('.trigger');
      if (!trigger) return;
      const name = trigger.dataset.seg;
      if (this._open === name) this._close();
      else this._openSeg(name);
    }

    /** Choose a value from the open list, close it, and keep focus on the segment. */
    _pick(seg, value) {
      this._close();
      this._choose(seg, value);
      const t = this._trigger(seg.name);
      if (t) t.focus();
    }

    _onKeydown(evt) {
      const trigger = evt.target.closest('.trigger');
      if (!trigger || this._isDisabled()) return;
      const seg = this._segments.find((s) => s.name === trigger.dataset.seg);
      if (!seg) return;
      const isOpen = this._open === seg.name;
      const list = this._listFor(seg);

      if (isOpen) {
        switch (evt.key) {
          case 'ArrowDown': evt.preventDefault(); this._moveActive(list, 1); return;
          case 'ArrowUp': evt.preventDefault(); this._moveActive(list, -1); return;
          case 'PageDown': evt.preventDefault(); this._moveActive(list, 8); return;
          case 'PageUp': evt.preventDefault(); this._moveActive(list, -8); return;
          case 'Home': evt.preventDefault(); this._active = -1; this._moveActive(list, 1); return;
          case 'End': evt.preventDefault(); this._active = list.length; this._moveActive(list, -1); return;
          case 'Enter':
          case ' ': {
            evt.preventDefault();
            const o = list[this._active];
            if (o && !o.disabled) this._pick(seg, o.value);
            return;
          }
          case 'Escape': evt.preventDefault(); this._close(); return;
          case 'Tab': this._close(); return;
          default: break;
        }
      } else {
        switch (evt.key) {
          case 'ArrowDown':
            evt.preventDefault();
            if (evt.altKey) this._openSeg(seg.name);
            else this._step(seg, list, 1);
            return;
          case 'ArrowUp': evt.preventDefault(); this._step(seg, list, -1); return;
          case 'Enter':
          case ' ': evt.preventDefault(); this._openSeg(seg.name); return;
          case 'ArrowRight': evt.preventDefault(); this._focusSibling(seg, 1); return;
          case 'ArrowLeft': evt.preventDefault(); this._focusSibling(seg, -1); return;
          case 'Delete':
          case 'Backspace': evt.preventDefault(); this._choose(seg, null); return;
          default: break;
        }
      }

      if (evt.key.length === 1 && !evt.ctrlKey && !evt.metaKey && !evt.altKey) {
        evt.preventDefault();
        this._typeahead(seg, list, evt.key, isOpen);
      }
    }

    _moveActive(list, dir) {
      if (!list.length) return;
      let i = this._active;
      const step = Math.sign(dir);
      let remaining = Math.abs(dir);
      let target = i;
      while (remaining > 0) {
        i += step;
        if (i < 0 || i >= list.length) break;
        if (!list[i].disabled) {
          target = i;
          remaining--;
        }
      }
      this._active = target;
      const trigger = this._trigger(this._open);
      if (trigger) this._syncActive(trigger.nextElementSibling, trigger);
    }

    /** ↑/↓ on a closed segment: step to the previous / next enabled value. */
    _step(seg, list, dir) {
      let i = list.findIndex((o) => o.value === this._values[seg.name]);
      if (i === -1) i = dir > 0 ? (seg.unknown ? 0 : -1) : list.length;
      for (let n = 0; n < list.length; n++) {
        i += dir;
        if (i < 0 || i >= list.length) return;
        if (!list[i].disabled) break;
      }
      if (list[i]) this._choose(seg, list[i].value);
    }

    _focusSibling(seg, dir) {
      const i = this._segments.indexOf(seg) + dir;
      const next = this._segments[i];
      if (next) this._trigger(next.name).focus();
    }

    /**
     * Type-ahead. Matches the typed characters against values and labels; with
     * a single possible match left (or a full-length entry) the value is taken
     * and focus moves to the next segment, like a native date input.
     */
    _typeahead(seg, list, key, isOpen) {
      const now = performance.now();
      this._typed = now - this._typedAt > TYPEAHEAD_MS ? key : this._typed + key;
      this._typedAt = now;
      const typed = this._typed.toLowerCase();

      const candidates = list.filter((o) => !o.disabled && (
        o.value.toLowerCase().startsWith(typed) ||
        o.label.toLowerCase().startsWith(typed) ||
        (/^\d+$/.test(typed) && /^\d+$/.test(o.value) && String(Number(o.value)).startsWith(String(Number(typed))) && !o.unknown)
      ));
      if (!candidates.length) {
        this._typed = key; // start over with just this key next time
        return;
      }
      // Prefer an exact numeric/value match ("3" → "03"), else the first candidate.
      // An exact value wins ("00" = Unknown, "3" = "03"); otherwise prefer a real
      // value over Unknown, so typing "0" on the way to "03" doesn't flash Unknown.
      const exact = candidates.find((o) => o.value.toLowerCase() === typed || (/^\d+$/.test(typed) && Number(o.value) === Number(typed) && !o.unknown));
      const pick = exact || candidates.find((o) => !o.unknown) || candidates[0];

      if (isOpen) {
        this._active = list.indexOf(pick);
        const trigger = this._trigger(seg.name);
        this._syncActive(trigger.nextElementSibling, trigger);
        return;
      }
      this._choose(seg, pick.value);
      // Done with this segment when nothing longer could still match.
      const longer = candidates.filter((o) => o !== pick && (o.value.toLowerCase().startsWith(typed) || String(Number(o.value)).startsWith(String(Number(typed)))));
      if (!longer.length || typed.length >= pick.value.length) {
        this._typed = '';
        this._focusSibling(seg, 1);
      }
    }

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
  }

  customElements.define(TAG_NAME, KakaoMultiDropdown);
})();
