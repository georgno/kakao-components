/**
 * <kakao-number-input>
 * ============================================================================
 * A number field: wraps a child <input type="number"> with stepper buttons
 * (stacked arrows with a mouse, 44px − / + on touch screens) and the wheel on
 * them, plus an optional label, hint and error like the other fields. Native
 * spin buttons are hidden. Vanilla JS, light DOM: load number-input.css.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        A number field with − / + steppers (44px on touch), label, hint and error.
 *  not for    A value on a scale: kakao-slider; a number typed, never stepped: kakao-text-input.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     number-input.js
 *  css        number-input.css   (light DOM: load it in the page head)
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="number-input.css">
 *   <script src="number-input.js"><\/script>
 *
 *   <kakao-number-input>
 *     <input type="number" min="0" max="100" step="1" value="10" />
 *   </kakao-number-input>
 *
 *   <kakao-number-input label="Height" hint="In centimetres">
 *     <input type="number" name="height" min="100" max="250" value="170" />
 *   </kakao-number-input>
 *
 *   <kakao-number-input touch-steppers group-position="left">…</kakao-number-input>
 *   <kakao-number-input touch-steppers grouped="false" plus="left">…</kakao-number-input>
 *   <kakao-number-input touch-steppers minus="false">…</kakao-number-input>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  size            sm · md (default). sm is a compact control (styling hook
 *                  via number-input.css).
 *  label           Visible label above the field: a <label for> tied to the
 *                  child input (which gets an id if it has none).
 *  hint            Helper text below the field (hidden while there is an error).
 *  error           Error text: red border and message; the input gets
 *                  aria-invalid, the message its aria-describedby, and the
 *                  input's custom validity (an error summary lists it).
 *                  Without label, hint and error the markup is the bare
 *                  input and steppers, as before; name the input yourself
 *                  (aria-label or a <label for>).
 *  touch-steppers  Always use the touch layout (it is used on touch screens
 *                  anyway): 44px − and + buttons instead of the stacked ▲▼.
 *  plus            left · right · false: where the + button sits in the touch
 *                  layout ("off", "0" and "no" also hide it). Default right.
 *  minus           left · right · false: the same for the − button.
 *  grouped         Keep the two buttons together as one joined cluster (the
 *                  default). "false" / "off" / "0" / "no" gives two separate
 *                  buttons with a gap instead. A visible group sits on
 *                  group-position, whatever plus / minus say.
 *  group-position  left · right (default): the side of that group.
 *
 *  Defaults reproduce the first layout: | value | − + |, one joined pair on
 *  the right. On a fine pointer (a mouse) the arrows stay stacked on the right
 *  and only the hiding options apply; the sides are the touch layout's.
 *
 * ----------------------------------------------------------------------------
 * BEHAVIOUR
 * ----------------------------------------------------------------------------
 *  Hold a button to repeat the step. The inner input keeps min, max, step,
 *  value, disabled, and class names (e.g. your form framework). Changes bubble
 *  from the input as a native field's do: input on every step (each repeat of
 *  a held button, each wheel notch), change once when the press ends or the
 *  wheel rests, and only if the value moved. A step at min or max sends nothing.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */

class KakaoNumberInput extends HTMLElement {
  static get observedAttributes() {
    return ['size', 'touch-steppers', 'plus', 'minus', 'grouped', 'group-position', 'label', 'hint', 'error'];
  }

  constructor() {
    super();
    this._coarse = typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)')
      : null;
    this._onPointerMode = () => this._applyLayout();
  }

  connectedCallback() {
    if (this._initialized) return;
    const input = this.querySelector('input[type="number"]');
    if (!input) {
      console.warn('kakao-number-input: expected a child input[type="number"]');
      return;
    }

    this._input = input;
    this._applySize();

    if (!this.querySelector('.kakao-number-input-arrows')) {
      const arrows = document.createElement('div');
      arrows.className = 'kakao-number-input-arrows';
      arrows.setAttribute('aria-hidden', 'true');
      arrows.innerHTML = '<span class="kakao-number-input-up" data-step="1" role="presentation">▲</span>'
        + '<span class="kakao-number-input-dn" data-step="-1" role="presentation">▼</span>';
      this.appendChild(arrows);
      this._arrows = arrows;

      // Press: one step at once, then repeat while held (mouse, touch, pen).
      // Delegated, so it keeps working when the layout moves the buttons.
      this._onPress = (e) => {
        const btn = e.target.closest('[data-step]');
        if (!btn) return;
        e.preventDefault(); // keep focus in the input, no text selection
        const dir = Number(btn.dataset.step);
        this._stopRepeat();
        this._pressFrom = this._input.value;
        this._adjust(dir);
        this._repeatDelay = setTimeout(() => {
          this._repeatTimer = setInterval(() => this._adjust(dir), 70);
        }, 400);
      };
      this._stopRepeat = () => {
        clearTimeout(this._repeatDelay);
        clearInterval(this._repeatTimer);
      };
      // The press ends: one change, if the steps moved the value.
      this._onPressEnd = () => {
        this._stopRepeat();
        if (this._pressFrom === undefined) return;
        const from = this._pressFrom;
        this._pressFrom = undefined;
        this._commit(from);
      };
      // Wheel: input per notch, one change once the wheel rests.
      this._onWheel = (e) => {
        e.preventDefault();
        if (this._wheelFrom === undefined) this._wheelFrom = this._input.value;
        this._adjust(e.deltaY < 0 ? +1 : -1);
        clearTimeout(this._wheelTimer);
        this._wheelTimer = setTimeout(() => {
          const from = this._wheelFrom;
          this._wheelFrom = undefined;
          this._commit(from);
        }, 400);
      };

      arrows.addEventListener('pointerdown', this._onPress);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => arrows.addEventListener(t, this._onPressEnd));
      arrows.addEventListener('wheel', this._onWheel, { passive: false });
    }

    if (this._coarse) {
      if (this._coarse.addEventListener) this._coarse.addEventListener('change', this._onPointerMode);
      else if (this._coarse.addListener) this._coarse.addListener(this._onPointerMode);
    }
    this._applyLayout();
    this._syncField();
    this._initialized = true;
  }

  disconnectedCallback() {
    const arrows = this._arrows;
    if (this._coarse) {
      if (this._coarse.removeEventListener) this._coarse.removeEventListener('change', this._onPointerMode);
      else if (this._coarse.removeListener) this._coarse.removeListener(this._onPointerMode);
    }
    if (!arrows) return;
    arrows.removeEventListener('pointerdown', this._onPress);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => arrows.removeEventListener(t, this._onPressEnd));
    arrows.removeEventListener('wheel', this._onWheel);
    this._stopRepeat();
    clearTimeout(this._wheelTimer);
    this._pressFrom = undefined;
    this._wheelFrom = undefined;
    this._initialized = false;
  }

  attributeChangedCallback(name) {
    if (name === 'size') this._applySize();
    if (name === 'label' || name === 'hint' || name === 'error') { this._syncField(); return; }
    if (this._initialized) this._applyLayout();
  }

  /* ------------------------ Label, hint, error ------------------------ */

  /**
   * Builds the field's parts on first use, so a bare number input keeps its
   * markup: | label | field box (input + steppers) | hint | error |. The box
   * is the steppers' positioning parent, as the host is without it.
   */
  _syncField() {
    const input = this._input;
    if (!input) return;
    const label = this.getAttribute('label') || '';
    const hint = this.getAttribute('hint') || '';
    const error = this.getAttribute('error') || '';
    if (!this._field && !label && !hint && !error) return;

    if (!this._field) {
      if (!input.id) input.id = `kakao-number-input-${++KakaoNumberInput._ids}`;
      const box = document.createElement('div');
      box.className = 'kakao-number-input-field';
      input.before(box);
      box.append(input);
      if (this._arrows) box.append(this._arrows);
      const labelEl = document.createElement('label');
      labelEl.className = 'kakao-number-input-label';
      const hintEl = document.createElement('p');
      hintEl.className = 'kakao-number-input-hint';
      const errorEl = document.createElement('p');
      errorEl.className = 'kakao-number-input-error';
      errorEl.setAttribute('role', 'alert');
      box.before(labelEl);
      box.after(hintEl, errorEl);
      this._field = { box, labelEl, hintEl, errorEl, ours: [] };
    }

    const { labelEl, hintEl, errorEl } = this._field;
    labelEl.htmlFor = input.id;
    hintEl.id = `${input.id}-hint`;
    errorEl.id = `${input.id}-error`;
    labelEl.textContent = label;
    hintEl.textContent = hint;
    errorEl.textContent = error;
    labelEl.hidden = !label;
    hintEl.hidden = !hint || !!error;
    errorEl.hidden = !error;

    // aria-describedby: the page's own ids stay, ours follow what is shown.
    const own = (input.getAttribute('aria-describedby') || '').split(/\s+/)
      .filter((id) => id && !this._field.ours.includes(id));
    const ours = error ? [errorEl.id] : (hint ? [hintEl.id] : []);
    this._field.ours = ours;
    const ids = own.concat(ours);
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    else input.removeAttribute('aria-describedby');

    if (error) input.setAttribute('aria-invalid', 'true');
    else if (this._field.invalid) input.removeAttribute('aria-invalid');
    this._field.invalid = !!error;
    if (error || this._field.validity) input.setCustomValidity(error);
    this._field.validity = !!error;
  }

  _applySize() {
    if (!this._input) return;
    const size = this.getAttribute('size');
    this._input.classList.toggle('kakao-number-input-sm', size === 'sm');
  }

  /* ------------------------ Stepper layout ------------------------ */

  /** A stepper's side from its attribute: "left" | "right" | null (hidden). */
  _side(name) {
    const raw = this.getAttribute(name);
    if (raw == null) return 'right';
    const v = raw.trim().toLowerCase();
    if (v === '' || v === 'true' || v === 'on' || v === 'yes' || v === '1') return 'right';
    if (v === 'left' || v === 'right') return v;
    if (v === 'false' || v === 'off' || v === '0' || v === 'no' || v === 'none') return null;
    return 'right'; // a typo shouldn't remove a control
  }

  /** A boolean attribute, on unless it says otherwise. */
  _flag(name) {
    const raw = this.getAttribute(name);
    if (raw == null) return true;
    const v = raw.trim().toLowerCase();
    return !(v === 'false' || v === 'off' || v === '0' || v === 'no' || v === 'none');
  }

  _applyLayout() {
    const arrows = this._arrows;
    if (!arrows) return;

    const touch = this.hasAttribute('touch-steppers') || !!(this._coarse && this._coarse.matches);
    this.toggleAttribute('data-touch', touch);

    let plus = this._side('plus');
    let minus = this._side('minus');
    const grouped = this._flag('grouped');

    if (grouped && plus && minus) {
      // A visible group is one unit on group-position, its buttons side by side.
      const group = (this.getAttribute('group-position') || '').trim().toLowerCase() === 'left' ? 'left' : 'right';
      plus = group;
      minus = group;
    }

    const up = arrows.querySelector('.kakao-number-input-up');
    const dn = arrows.querySelector('.kakao-number-input-dn');
    const set = (btn, side, order) => {
      btn.hidden = !side;
      if (!side) {
        btn.removeAttribute('data-side');
        btn.style.removeProperty('order');
        return;
      }
      btn.dataset.side = side;
      // − before + within a side; left first. Only the touch layout reorders:
      // the stacked desktop arrows keep up over down.
      if (touch) btn.style.order = String(side === 'left' ? order : order + 2);
      else btn.style.removeProperty('order');
    };
    set(dn, minus, 0);
    set(up, plus, 1);

    const left = [plus, minus].filter((s) => s === 'left').length;
    const right = [plus, minus].filter((s) => s === 'right').length;
    this.style.setProperty('--_steps-left', String(left));
    this.style.setProperty('--_steps-right', String(right));

    arrows.dataset.align = plus && minus && plus !== minus ? 'split' : (left ? 'left' : 'right');

    arrows.toggleAttribute('data-grouped', grouped && !!plus && plus === minus);
  }

  /* ------------------------ Stepping ------------------------ */

  _getStep() {
    const step = parseFloat(this._input.step);
    return Number.isFinite(step) && step > 0 ? step : 1;
  }

  _getMin() {
    return this._input.min !== '' ? parseFloat(this._input.min) : -Infinity;
  }

  _getMax() {
    return this._input.max !== '' ? parseFloat(this._input.max) : Infinity;
  }

  _decimals() {
    const s = this._getStep();
    if (s % 1 === 0) return 0;
    const part = s.toString().split('.')[1];
    return part ? part.length : 0;
  }

  _adjust(direction) {
    const input = this._input;
    if (!input || input.disabled) return;

    const current = parseFloat(input.value);
    const base = Number.isFinite(current) ? current : 0;
    const next = base + direction * this._getStep();
    const clamped = Math.min(this._getMax(), Math.max(this._getMin(), next));
    const value = String(parseFloat(clamped.toFixed(this._decimals())));
    if (value === input.value) return; // at min or max: nothing moved
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /** change once a press or a wheel turn is over, like a native field on leave. */
  _commit(from) {
    if (this._input && this._input.value !== from) {
      this._input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

KakaoNumberInput._ids = 0;

if (!customElements.get('kakao-number-input')) {
  customElements.define('kakao-number-input', KakaoNumberInput);
}
