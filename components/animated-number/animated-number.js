/**
 * <kakao-animated-number>
 * Odometer-style rolling digits when the value changes (vanilla, no external deps).
 *
 * Attributes:
 *   value          - initial number (also observed)
 *   locale         - BCP 47 locale for Intl (default: en-US)
 *   decimals       - fixed fraction digits (optional)
 *   duration       - transition ms (default: 600)
 *   sign-display   - auto | always | except-zero | negative (maps to Intl signDisplay)
 *
 * Methods:
 *   update(n)      - animate to number n (same as setting value)
 *
 * CSS custom properties (on the element or any ancestor; defaults live in the
 * settings block of this file, change them on construction.html):
 *   --kakao-animated-number-font-family, --kakao-animated-number-font-size, --kakao-animated-number-font-weight, --kakao-animated-number-color, --kakao-animated-number-duration
 */

const BLANK = 10; // strip slot after the last digit: rolls a digit out of view

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
    this._pending = null;
  }

  connectedCallback() {
    this._renderShell();
    const v = this._pending != null ? this._pending : this._parseInput(this.getAttribute('value'));
    this._pending = null;
    this._displayValue = v;
    this._targetValue = v;
    this._buildColumns(v);
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
    // Not built yet: on upgrade the value attribute arrives before
    // connectedCallback has made the shadow parts. Keep it; connectedCallback
    // shows it without a roll from 0.
    if (!this.isConnected || !this._row) {
      this._pending = next;
      return;
    }

    const from = this._displayValue;
    this._targetValue = next;
    if (from === next && !this._animating) {
      this._buildColumns(next);
      return;
    }

    if (this._prefersReducedMotion()) {
      this._displayValue = next;
      this._buildColumns(next);
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

  _formatOptions() {
    const opts = { signDisplay: this._intlSignDisplay() };
    const decAttr = this.getAttribute('decimals');
    if (decAttr != null && decAttr !== '') {
      const d = parseInt(decAttr, 10);
      if (!isNaN(d)) {
        opts.minimumFractionDigits = d;
        opts.maximumFractionDigits = d;
      }
    }
    return opts;
  }

  _formatParts(num) {
    const locale = this.getAttribute('locale') || 'en-US';
    return new Intl.NumberFormat(locale, this._formatOptions()).formatToParts(num);
  }

  _announce(num) {
    const locale = this.getAttribute('locale') || 'en-US';
    const formatted = new Intl.NumberFormat(locale, this._formatOptions()).format(num);
    this._sr.textContent = formatted;
    this.setAttribute('aria-label', formatted);
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

  /** One rolling digit column; slot BLANK after the last digit is empty. */
  _makeColumn(digit) {
    const wrap = document.createElement('span');
    wrap.className = 'char digit-col';
    const strip = document.createElement('span');
    strip.className = 'strip';
    for (let d = 0; d <= BLANK; d++) {
      const s = document.createElement('span');
      s.textContent = d < BLANK ? String(d) : '';
      strip.appendChild(s);
    }
    strip.style.transform = `translateY(${-digit * 1.1}em)`;
    wrap.appendChild(strip);
    return wrap;
  }

  _makeSep(text) {
    const el = document.createElement('span');
    el.className = 'char sep';
    el.textContent = text;
    return el;
  }

  /** Formatted number as a flat list of digits and separators. Digits keep their
   *  section so the integer part aligns from the right and the fraction from the left. */
  _items(num) {
    const items = [];
    this._formatParts(num).forEach((part) => {
      if (part.type === 'integer' || part.type === 'fraction') {
        for (const ch of part.value) {
          items.push(/\d/.test(ch) ? { digit: parseInt(ch, 10), section: part.type } : { text: ch });
        }
        return;
      }
      items.push({ text: part.value, sign: part.type === 'minusSign' || part.type === 'plusSign' });
    });
    return items;
  }

  _elements(items) {
    return items.map((it) => (it.section ? this._makeColumn(it.digit) : this._makeSep(it.text)));
  }

  _buildColumns(num) {
    if (!this._row) return [];
    this._row.innerHTML = '';
    const els = this._elements(this._items(num));
    els.forEach((el) => this._row.appendChild(el));
    this._announce(num);
    return els;
  }

  _roll(col, digit, duration, ease) {
    const strip = col.firstElementChild;
    strip.style.transition = duration ? `transform ${duration}ms ${ease}` : 'none';
    strip.style.transform = `translateY(${-digit * 1.1}em)`;
  }

  _runTransition(from, to) {
    const duration = this._duration();
    const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
    const fromItems = this._items(from);
    const toItems = this._items(to);

    this._displayValue = to;
    this._animating = true;
    this._announce(to);
    const els = this._buildColumns(to); // final layout: from here only digits and widths move

    const sectionOf = (items, section) =>
      items.reduce((acc, it, i) => (it.section === section ? acc.concat(i) : acc), []);
    const fromInt = sectionOf(fromItems, 'integer');
    const toInt = sectionOf(toItems, 'integer');
    const fromFrac = sectionOf(fromItems, 'fraction');
    const toFrac = sectionOf(toItems, 'fraction');
    const offset = toInt.length - fromInt.length; // > 0: columns appeared on the left

    // A column that has a digit in the old number rolls from it; one without just
    // opens up. Kept item indices bound the parts that exist on one side only.
    const rolls = []; // [column, old digit, new digit]
    const keptFrom = [];
    const keptTo = [];
    toInt.forEach((ti, k) => {
      const fi = k - offset;
      if (fi < 0) return;
      keptFrom.push(fromInt[fi]);
      keptTo.push(ti);
      rolls.push([els[ti], fromItems[fromInt[fi]].digit, toItems[ti].digit]);
    });
    toFrac.forEach((ti, k) => {
      if (k >= fromFrac.length) return;
      keptFrom.push(fromFrac[k]);
      keptTo.push(ti);
      rolls.push([els[ti], fromItems[fromFrac[k]].digit, toItems[ti].digit]);
    });

    // Digits left of the first kept one (sign, leading digits and their separators)
    // or right of the last kept one have no place in the new number: they roll on
    // into BLANK and their space closes. Parts of the new number that did not exist
    // before do the opposite, so the row never snaps to a new width.
    const fromSign = fromItems.find((it) => it.sign)?.text || '';
    const keepSign = fromSign && fromSign === (toItems.find((it) => it.sign)?.text || '');
    const firstKept = keptFrom.length ? Math.min(...keptFrom) : fromItems.length;
    const lastKept = keptFrom.length ? Math.max(...keptFrom) : -1;
    const firstKeptTo = keptTo.length ? Math.min(...keptTo) : toItems.length;
    const lastKeptTo = keptTo.length ? Math.max(...keptTo) : -1;

    const signAt = toItems.findIndex((it) => it.sign);
    const entering = [];
    for (let i = 0; i < firstKeptTo; i++) entering.push(i);
    for (let i = lastKeptTo + 1; i < toItems.length; i++) entering.push(i);
    const enteringEls = entering.filter((i) => !(keepSign && i === signAt)).map((i) => els[i]);

    const leaving = this._elements([
      ...fromItems.slice(0, firstKept),
      ...fromItems.slice(lastKept + 1),
    ]).filter((el) => !(keepSign && el.textContent === fromSign && el.classList.contains('sep')));

    // Outgoing parts go in as elements at their natural width, then collapse.
    const lead = leaving.slice(0, leaving.length - fromItems.slice(lastKept + 1).length);
    const tail = leaving.slice(lead.length);
    const before = this._row.querySelector('.digit-col'); // keep a surviving sign in front
    lead.forEach((el) => this._row.insertBefore(el, before));
    tail.forEach((el) => this._row.appendChild(el));

    const resized = []; // [element, width to animate to]
    enteringEls.forEach((el) => {
      const width = el.getBoundingClientRect().width;
      el.style.width = '0px';
      el.style.minWidth = '0';
      resized.push([el, `${width}px`]);
    });
    leaving.forEach((el) => {
      const width = el.getBoundingClientRect().width;
      el.style.width = `${width}px`;
      el.style.minWidth = '0';
      resized.push([el, '0px']);
    });
    rolls.forEach(([el, oldDigit]) => this._roll(el, oldDigit, 0, ease));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        rolls.forEach(([el, , newDigit]) => this._roll(el, newDigit, duration, ease));
        leaving.filter((el) => el.classList.contains('digit-col')).forEach((el) => this._roll(el, BLANK, duration, ease));
        resized.forEach(([el, width]) => {
          el.style.transition = `width ${duration}ms ${ease}`;
          el.style.width = width;
        });
      });
    });

    clearTimeout(this._finishTimer);
    this._finishTimer = setTimeout(() => {
      this._animating = false;
      this._buildColumns(to);
      this._emitChange();
    }, duration + 50);
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