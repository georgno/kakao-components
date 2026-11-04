/**
 * <kakao-animated-number>
 * Odometer-style rolling digits when the value changes (vanilla, no external deps).
 *
 * Attributes:
 *   value          — initial number (also observed)
 *   locale         — BCP 47 locale for Intl (default: en-US)
 *   decimals       — fixed fraction digits (optional)
 *   duration       — transition ms (default: 600)
 *   sign-display   — auto | always | except-zero | negative (maps to Intl signDisplay)
 *
 * Methods:
 *   update(n)      — animate to number n (same as setting value)
 *
 * CSS custom properties (on the element or any ancestor; defaults live in the
 * settings block of this file, change them on construction.html):
 *   --kakao-animated-number-font-family, --kakao-animated-number-font-size, --kakao-animated-number-font-weight, --kakao-animated-number-color, --kakao-animated-number-duration
 */

class KakaoAnimatedNumber extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'locale', 'decimals', 'duration', 'sign-display'];
  }

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._displayValue = 0;
    this._targetValue = 0;
    this._animating = false;
    this._columns = [];
    this._pending = null;
  }

  connectedCallback() {
    this._renderShell();
    const v = this._pending != null ? this._pending : this._parseInput(this.getAttribute('value'));
    this._pending = null;
    this._displayValue = v;
    this._targetValue = v;
    this._buildColumns(v, false);
  }

  disconnectedCallback() {
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  attributeChangedCallback(name, _old, neu) {
    if (name === 'value' && neu != null) {
      this.update(this._parseInput(neu));
    }
  }

  get value() {
    return this._targetValue;
  }

  set value(v) {
    this.update(v);
  }

  /** Imperative API (matches kalorienrechner number-flow usage). */
  update(n) {
    const next = this._parseInput(n);
    if (!this.isConnected) {
      this._pending = next;
      return;
    }
    if (this._pending != null) this._pending = null;

    const from = this._displayValue;
    this._targetValue = next;
    if (from === next && !this._animating) {
      this._buildColumns(next, false);
      return;
    }

    if (this._prefersReducedMotion()) {
      this._displayValue = next;
      this._buildColumns(next, false);
      this._emitChange();
      return;
    }

    this._runTransition(from, next);
  }

  _parseInput(v) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  _prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  _formatParts(num) {
    const locale = this.getAttribute('locale') || 'en-US';
    const decAttr = this.getAttribute('decimals');
    const signDisplay = this._intlSignDisplay();

    const opts = { signDisplay };
    if (decAttr != null && decAttr !== '') {
      const d = parseInt(decAttr, 10);
      if (!isNaN(d)) {
        opts.minimumFractionDigits = d;
        opts.maximumFractionDigits = d;
      }
    }

    return new Intl.NumberFormat(locale, opts).formatToParts(num);
  }

  _intlSignDisplay() {
    const raw = (this.getAttribute('sign-display') || 'auto').toLowerCase();
    const map = {
      auto: 'auto',
      always: 'always',
      'except-zero': 'exceptZero',
      exceptzero: 'exceptZero',
      negative: 'negative',
    };
    return map[raw] || 'auto';
  }

  _duration() {
    const attr = this.getAttribute('duration');
    const d = attr != null ? parseInt(attr, 10) : NaN;
    if (!isNaN(d) && d >= 0) return d;
    const css = getComputedStyle(this).getPropertyValue('--_duration').trim();
    const fromCss = parseFloat(css);
    if (isNaN(fromCss)) return 600;
    return /\ds$/.test(css) && !/ms$/.test(css) ? fromCss * 1000 : fromCss;
  }

  _renderShell() {
    this._shadow.innerHTML = `
      <style>
        :host {
          /* @kakao-settings:start prefix=--kakao-animated-number- (written by construction.html, edit there) */
          --_font-family: var(--kakao-animated-number-font-family, ui-monospace, SFMono-Regular, Menlo, monospace);
          --_font-size: var(--kakao-animated-number-font-size, 1em);
          --_font-weight: var(--kakao-animated-number-font-weight, inherit);
          --_color: var(--kakao-animated-number-color, currentColor);
          --_duration: var(--kakao-animated-number-duration, 600ms);
          /* @kakao-settings:end */
          display: inline-block;
          vertical-align: baseline;
          font-family: var(--_font-family);
          font-size: var(--_font-size);
          font-weight: var(--_font-weight);
          color: var(--_color);
          font-variant-numeric: tabular-nums;
          line-height: 1.1;
        }
        .row {
          display: inline-flex;
          align-items: baseline;
          overflow: hidden;
        }
        .char {
          display: inline-block;
          overflow: hidden;
          height: 1.1em;
          line-height: 1.1em;
        }
        .char.sep {
          text-align: center;
          min-width: 0.35em;
        }
        .strip {
          display: flex;
          flex-direction: column;
          will-change: transform;
        }
        .strip span {
          height: 1.1em;
          line-height: 1.1em;
          display: block;
          text-align: center;
        }
        .digit-col {
          min-width: 0.55em;
        }
        .sr {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }
      </style>
      <span class="row" part="display" aria-hidden="true"></span>
      <span class="sr" part="sr"></span>
    `;
    this._row = this._shadow.querySelector('.row');
    this._sr = this._shadow.querySelector('.sr');
  }

  _buildColumns(num, animateStrip) {
    const parts = this._formatParts(num);
    const row = this._row;
    if (!row) return;

    row.innerHTML = '';
    this._columns = [];

    parts.forEach((part) => {
      if (part.type === 'minusSign') {
        const el = document.createElement('span');
        el.className = 'char sep';
        el.textContent = part.value;
        row.appendChild(el);
        return;
      }
      if (part.type === 'plusSign') {
        const el = document.createElement('span');
        el.className = 'char sep';
        el.textContent = part.value;
        row.appendChild(el);
        return;
      }
      if (part.type === 'group' || part.type === 'decimal' || part.type === 'literal') {
        const el = document.createElement('span');
        el.className = 'char sep';
        el.textContent = part.value;
        row.appendChild(el);
        return;
      }
      if (part.type === 'integer' || part.type === 'fraction') {
        for (const ch of part.value) {
          if (!/\d/.test(ch)) {
            const el = document.createElement('span');
            el.className = 'char sep';
            el.textContent = ch;
            row.appendChild(el);
            continue;
          }
          const wrap = document.createElement('span');
          wrap.className = 'char digit-col';
          const strip = document.createElement('span');
          strip.className = 'strip';
          for (let d = 0; d <= 9; d++) {
            const s = document.createElement('span');
            s.textContent = String(d);
            strip.appendChild(s);
          }
          const digit = parseInt(ch, 10);
          strip.style.transform = `translateY(${-digit * 1.1}em)`;
          if (animateStrip) {
            strip.style.transition = `transform ${this._duration()}ms cubic-bezier(0.22, 1, 0.36, 1)`;
          }
          wrap.appendChild(strip);
          row.appendChild(wrap);
          this._columns.push({ strip, digit });
        }
      }
    });

    const formatted = new Intl.NumberFormat(
      this.getAttribute('locale') || 'en-US',
      {
        signDisplay: this._intlSignDisplay(),
        ...(this.getAttribute('decimals') != null && this.getAttribute('decimals') !== ''
          ? {
              minimumFractionDigits: parseInt(this.getAttribute('decimals'), 10),
              maximumFractionDigits: parseInt(this.getAttribute('decimals'), 10),
            }
          : {}),
      }
    ).format(num);
    this._sr.textContent = formatted;
    this.setAttribute('aria-label', formatted);
  }

  _runTransition(from, to) {
    const duration = this._duration();
    const fromParts = this._formatParts(from);
    const toParts = this._formatParts(to);

    const fromDigits = this._extractDigits(fromParts);
    const toDigits = this._extractDigits(toParts);

    if (fromDigits.length !== toDigits.length) {
      this._displayValue = to;
      this._buildColumns(to, true);
      this._animating = true;
      clearTimeout(this._finishTimer);
      this._finishTimer = setTimeout(() => {
        this._animating = false;
        this._emitChange();
      }, duration);
      return;
    }

    this._buildColumns(from, false);
    this._animating = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const strips = this._row.querySelectorAll('.strip');
        strips.forEach((strip, i) => {
          const digit = toDigits[i] ?? 0;
          strip.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
          strip.style.transform = `translateY(${-digit * 1.1}em)`;
        });
        this._displayValue = to;
        const formatted = new Intl.NumberFormat(
          this.getAttribute('locale') || 'en-US',
          { signDisplay: this._intlSignDisplay() }
        ).format(to);
        this._sr.textContent = formatted;
        this.setAttribute('aria-label', formatted);
      });
    });

    clearTimeout(this._finishTimer);
    this._finishTimer = setTimeout(() => {
      this._animating = false;
      this._buildColumns(to, false);
      this._emitChange();
    }, duration + 50);
  }

  _extractDigits(parts) {
    const out = [];
    parts.forEach((p) => {
      if (p.type === 'integer' || p.type === 'fraction') {
        for (const ch of p.value) {
          if (/\d/.test(ch)) out.push(parseInt(ch, 10));
        }
      }
    });
    return out;
  }

  _emitChange() {
    this.dispatchEvent(new CustomEvent('kakao-animated-number-complete', {
      bubbles: true,
      composed: true,
      detail: { value: this._targetValue },
    }));
  }
}

if (!customElements.get('kakao-animated-number')) {
  customElements.define('kakao-animated-number', KakaoAnimatedNumber);
}