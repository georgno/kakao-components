/**
 * <kakao-number-input>
 * Wraps a child <input type="number"> with custom stepper arrows and wheel
 * on the arrow strip. Native browser spin buttons are hidden.
 *
 * Usage:
 *   <link rel="stylesheet" href="number-input.css">
 *   <script src="number-input.js"><\/script>
 *   <kakao-number-input>
 *     <input type="number" min="0" max="100" step="1" value="10" />
 *   </kakao-number-input>
 *
 * Attributes (on <kakao-number-input>):
 *   size            "sm" for a compact control (styling hook via number-input.css)
 *   touch-steppers  always use the touch layout (it is used on touch screens
 *                   anyway): 44px − and + buttons instead of the stacked ▲▼
 *   plus            Where the + button sits in the touch layout:
 *                     "left" | "right"  that side
 *                     (no value)        the default side, right
 *                     "false" | "off" | "0" | "no"   no + button
 *   minus           Same for the − button. Default: right.
 *   grouped         Keep the two buttons together as one joined cluster (the
 *                   default). "false" / "off" / "0" / "no" gives two separate
 *                   buttons with a gap instead. A visible group sits on
 *                   group-position, whatever plus / minus say.
 *   group-position  "left" | "right" (default right): the side of that group.
 *
 *   Defaults reproduce the first layout: | value | − + |, one joined pair on
 *   the right. On a fine pointer (a mouse) the arrows stay stacked on the right
 *   and only the hiding options apply; the sides are the touch layout's.
 *
 *   Examples:
 *     <kakao-number-input touch-steppers group-position="left">…</kakao-number-input>
 *     <kakao-number-input touch-steppers grouped="false" plus="left">…</kakao-number-input>
 *     <kakao-number-input touch-steppers minus="false">…</kakao-number-input>
 *
 * Hold a button to repeat the step.
 *
 * The inner input keeps min, max, step, value, disabled, and class names
 * (e.g. your form framework). Changes bubble as input/change on the input.
 */

class KakaoNumberInput extends HTMLElement {
  static get observedAttributes() {
    return ['size', 'touch-steppers', 'plus', 'minus', 'grouped', 'group-position'];
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
        this._adjust(dir);
        this._repeatDelay = setTimeout(() => {
          this._repeatTimer = setInterval(() => this._adjust(dir), 70);
        }, 400);
      };
      this._stopRepeat = () => {
        clearTimeout(this._repeatDelay);
        clearInterval(this._repeatTimer);
      };
      this._onWheel = (e) => {
        e.preventDefault();
        this._adjust(e.deltaY < 0 ? +1 : -1);
      };

      arrows.addEventListener('pointerdown', this._onPress);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => arrows.addEventListener(t, this._stopRepeat));
      arrows.addEventListener('wheel', this._onWheel, { passive: false });
    }

    if (this._coarse) {
      if (this._coarse.addEventListener) this._coarse.addEventListener('change', this._onPointerMode);
      else if (this._coarse.addListener) this._coarse.addListener(this._onPointerMode);
    }
    this._applyLayout();
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
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => arrows.removeEventListener(t, this._stopRepeat));
    arrows.removeEventListener('wheel', this._onWheel);
    this._stopRepeat();
    this._initialized = false;
  }

  attributeChangedCallback(name) {
    if (name === 'size') this._applySize();
    if (this._initialized) this._applyLayout();
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
        btn.removeAttribute('data-edge');
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

    const joined = grouped && !!plus && plus === minus;
    arrows.toggleAttribute('data-grouped', joined);
    [up, dn].forEach((b) => b.removeAttribute('data-edge'));
    if (joined) {
      // The first of the pair keeps the outer left edge, the last the right one.
      const first = (Number(dn.style.order) || 0) <= (Number(up.style.order) || 0) ? dn : up;
      first.dataset.edge = 'start';
      (first === dn ? up : dn).dataset.edge = 'end';
    }
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
    input.value = parseFloat(clamped.toFixed(this._decimals()));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

if (!customElements.get('kakao-number-input')) {
  customElements.define('kakao-number-input', KakaoNumberInput);
}
