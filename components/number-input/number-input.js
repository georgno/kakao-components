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
 *   size — "sm" for a compact control (styling hook via number-input.css)
 *
 * The inner input keeps min, max, step, value, disabled, and class names
 * (e.g. your form framework). Changes bubble as input/change on the input.
 */

class KakaoNumberInput extends HTMLElement {
  static get observedAttributes() {
    return ['size'];
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
      arrows.innerHTML = '<span class="kakao-number-input-up" role="presentation">▲</span><span class="kakao-number-input-dn" role="presentation">▼</span>';
      this.appendChild(arrows);
      this._arrows = arrows;

      this._onUp = (e) => {
        e.preventDefault();
        this._adjust(+1);
      };
      this._onDown = (e) => {
        e.preventDefault();
        this._adjust(-1);
      };
      this._onWheel = (e) => {
        e.preventDefault();
        this._adjust(e.deltaY < 0 ? +1 : -1);
      };

      arrows.querySelector('.kakao-number-input-up').addEventListener('mousedown', this._onUp);
      arrows.querySelector('.kakao-number-input-dn').addEventListener('mousedown', this._onDown);
      arrows.addEventListener('wheel', this._onWheel, { passive: false });
    }
    this._initialized = true;
  }

  disconnectedCallback() {
    const arrows = this._arrows;
    if (!arrows) return;
    arrows.querySelector('.kakao-number-input-up')?.removeEventListener('mousedown', this._onUp);
    arrows.querySelector('.kakao-number-input-dn')?.removeEventListener('mousedown', this._onDown);
    arrows.removeEventListener('wheel', this._onWheel);
    this._initialized = false;
  }

  attributeChangedCallback(name) {
    if (name === 'size') this._applySize();
  }

  _applySize() {
    if (!this._input) return;
    const size = this.getAttribute('size');
    this._input.classList.toggle('kakao-number-input-sm', size === 'sm');
  }

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