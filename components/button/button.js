/**
 * @element kakao-button
 *
 * Light-DOM button web component with variants, sizes, icons, toggle and
 * async loading states (via .run(promise)).
 *
 * Attributes:
 *   label, icon, icon-position (left|right|only), variant (primary|secondary|ghost|danger),
 *   size (sm|md|lg), disabled, toggle, pressed, type (button|submit), name, value, form,
 *   href, aria-label
 *
 * data-* attributes on the host are mirrored onto the inner <button> so Yii
 * (data-confirm / data-method) and any custom data-* hooks keep working.
 *
 * Events:
 *   kakao-button-action — bubbles on click (not while loading)
 *
 * Public methods:
 *   run(promiseOrFactory, { successHold? }) — loading → success/fail animation
 */
(function () {
  'use strict';

  if (customElements.get('kakao-button')) {
    return;
  }

  const BOUNCE = 'cubic-bezier(0.34, 1.3, 0.64, 1)';
  const SOFT = 'cubic-bezier(0.25, 1.0, 0.5, 1)';
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Host attributes mirrored onto the native button for forms / a11y. */
  const MIRROR_ATTRS = ['type', 'name', 'value', 'form', 'disabled', 'title'];

  class KakaoButton extends HTMLElement {
    static get observedAttributes() {
      return [
        'label',
        'icon',
        'icon-position',
        'disabled',
        'pressed',
        'aria-label',
        'type',
        'name',
        'value',
        'form',
        'href',
        'title',
      ];
    }

    constructor() {
      super();
      this._initialized = false;
      this._listeners = new Map();
      this._pressAnim = null;
      this._contentAnim = null;
      this._rafId = null;
      this._loading = false;
      this._dataObserver = null;
    }

    connectedCallback() {
      if (!this._initialized) {
        this._initialized = true;
        this._buildDom();
        this._observeDataAttrs();
      }
      this._wireEvents();
      this._rafId = requestAnimationFrame(() => {
        this._syncFromAttributes();
        this._mirrorButtonAttrs();
        this._mirrorDataAttrs();
      });
    }

    disconnectedCallback() {
      for (const [el, handlers] of this._listeners) {
        for (const [type, fn, opts] of handlers) {
          el.removeEventListener(type, fn, opts);
        }
      }
      this._listeners.clear();
      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
      }
      if (this._pressAnim) {
        this._pressAnim.cancel();
      }
      if (this._contentAnim) {
        this._contentAnim.cancel();
      }
      if (this._dataObserver) {
        this._dataObserver.disconnect();
        this._dataObserver = null;
      }
    }

    attributeChangedCallback(name) {
      if (!this._initialized) {
        return;
      }
      if (name === 'disabled' || name === 'pressed') {
        this._btn.setAttribute('aria-pressed', this.hasAttribute('pressed') ? 'true' : 'false');
        this._btn.disabled = this.hasAttribute('disabled');
        this._mirrorButtonAttrs();
      } else if (MIRROR_ATTRS.indexOf(name) !== -1 || name === 'href') {
        this._mirrorButtonAttrs();
      } else {
        this._syncFromAttributes();
      }
    }

    // ---- internal DOM (light DOM only) ----
    _buildDom() {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'kakao-button-inner';

      const content = document.createElement('span');
      content.className = 'kakao-button-content';

      const iconLeft = document.createElement('span');
      iconLeft.className = 'kakao-button-icon kakao-button-icon-left';
      const iconLeftGlyph = document.createElement('i');
      iconLeft.appendChild(iconLeftGlyph);

      const label = document.createElement('span');
      label.className = 'kakao-button-label';

      const iconRight = document.createElement('span');
      iconRight.className = 'kakao-button-icon kakao-button-icon-right';
      const iconRightGlyph = document.createElement('i');
      iconRight.appendChild(iconRightGlyph);

      content.append(iconLeft, label, iconRight);

      const spinner = document.createElement('span');
      spinner.className = 'kakao-button-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      spinner.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>';

      const check = document.createElement('span');
      check.className = 'kakao-button-check';
      check.setAttribute('aria-hidden', 'true');
      check.innerHTML = '<i class="fas fa-check"></i>';

      btn.append(content, spinner, check);
      this.appendChild(btn);

      this._btn = btn;
      this._content = content;
      this._iconLeft = iconLeft;
      this._iconLeftGlyph = iconLeftGlyph;
      this._label = label;
      this._iconRight = iconRight;
      this._iconRightGlyph = iconRightGlyph;
      this._spinner = spinner;
      this._check = check;
    }

    _on(el, type, fn, opts) {
      el.addEventListener(type, fn, opts);
      if (!this._listeners.has(el)) {
        this._listeners.set(el, []);
      }
      this._listeners.get(el).push([type, fn, opts]);
    }

    _wireEvents() {
      if (this._eventsWired) {
        return;
      }
      this._eventsWired = true;

      const btn = this._btn;

      this._on(btn, 'pointerdown', (e) => {
        if (btn.disabled || this._loading) {
          return;
        }
        try {
          btn.setPointerCapture(e.pointerId);
        } catch (_) { /* ignore */ }
        this._animatePress(0.94);
      });
      const release = () => {
        if (!btn.disabled) {
          this._animatePress(1);
        }
      };
      this._on(btn, 'pointerup', release);
      this._on(btn, 'pointercancel', release);
      this._on(btn, 'pointerleave', release);

      this._on(btn, 'click', (e) => {
        if (this._loading) {
          e.preventDefault();
          return;
        }
        if (this.hasAttribute('toggle')) {
          this.toggleAttribute('pressed');
        }
        this.dispatchEvent(new CustomEvent('kakao-button-action', { bubbles: true }));

        // Link-style navigation when not a submit control and Yii won't handle it
        const href = this.getAttribute('href');
        const type = (this.getAttribute('type') || 'button').toLowerCase();
        if (href && type !== 'submit' && !btn.hasAttribute('data-method') && !btn.hasAttribute('data-confirm')) {
          e.preventDefault();
          window.location.assign(href);
        }
      });
    }

    _mirrorButtonAttrs() {
      if (!this._btn) {
        return;
      }
      const type = (this.getAttribute('type') || 'button').toLowerCase();
      this._btn.type = type === 'submit' ? 'submit' : 'button';

      if (this.hasAttribute('name')) {
        this._btn.setAttribute('name', this.getAttribute('name'));
      } else {
        this._btn.removeAttribute('name');
      }
      if (this.hasAttribute('value')) {
        this._btn.setAttribute('value', this.getAttribute('value'));
      } else {
        this._btn.removeAttribute('value');
      }
      if (this.hasAttribute('form')) {
        this._btn.setAttribute('form', this.getAttribute('form'));
      } else {
        this._btn.removeAttribute('form');
      }
      this._btn.disabled = this.hasAttribute('disabled');

      if (this.hasAttribute('title')) {
        this._btn.setAttribute('title', this.getAttribute('title'));
      } else {
        this._btn.removeAttribute('title');
      }

      // Expose href on the native button so Yii handleAction can read it
      if (this.hasAttribute('href')) {
        this._btn.setAttribute('href', this.getAttribute('href'));
      } else {
        this._btn.removeAttribute('href');
      }
    }

    _mirrorDataAttrs() {
      if (!this._btn) {
        return;
      }
      // Drop previous mirrored data-* that are no longer on the host
      Array.from(this._btn.attributes).forEach((attr) => {
        if (attr.name.indexOf('data-') === 0 && !this.hasAttribute(attr.name)) {
          this._btn.removeAttribute(attr.name);
        }
      });
      Array.from(this.attributes).forEach((attr) => {
        if (attr.name.indexOf('data-') === 0) {
          this._btn.setAttribute(attr.name, attr.value);
        }
      });
    }

    _observeDataAttrs() {
      if (typeof MutationObserver === 'undefined') {
        return;
      }
      this._dataObserver = new MutationObserver(() => this._mirrorDataAttrs());
      this._dataObserver.observe(this, {
        attributes: true,
        attributeFilter: undefined,
      });
    }

    _syncFromAttributes() {
      const iconPos = this.getAttribute('icon-position') || (this.getAttribute('label') ? 'left' : 'only');
      const iconClass = this.getAttribute('icon');
      const labelText = this.getAttribute('label') || '';

      this.setAttribute('icon-position', iconPos);

      this._label.textContent = labelText;
      this._label.style.display = iconPos === 'only' ? 'none' : '';

      this._iconLeft.style.display =
        iconClass && (iconPos === 'left' || iconPos === 'only') ? 'inline-flex' : 'none';
      this._iconRight.style.display = iconClass && iconPos === 'right' ? 'inline-flex' : 'none';
      if (iconClass) {
        this._iconLeftGlyph.className = iconClass;
        this._iconRightGlyph.className = iconClass;
      }

      const aria = this.getAttribute('aria-label') || (iconPos === 'only' ? labelText : '');
      if (aria) {
        this._btn.setAttribute('aria-label', aria);
      } else {
        this._btn.removeAttribute('aria-label');
      }

      this._btn.disabled = this.hasAttribute('disabled');
      if (this.hasAttribute('toggle')) {
        this._btn.setAttribute('aria-pressed', this.hasAttribute('pressed') ? 'true' : 'false');
      }
    }

    // ---- press squash animation, interruption-safe ----
    _currentScale() {
      const t = getComputedStyle(this._btn).transform;
      if (!t || t === 'none') {
        return 1;
      }
      const m = t.match(/matrix\(([^)]+)\)/);
      if (!m) {
        return 1;
      }
      const parts = m[1].split(',').map(parseFloat);
      return parts[0] || 1;
    }

    _animatePress(target) {
      if (reduceMotion()) {
        this._btn.style.transform = `scale(${target})`;
        return;
      }
      const from = this._currentScale();
      if (this._pressAnim) {
        this._pressAnim.cancel();
      }
      this._pressAnim = this._btn.animate(
        [{ transform: `scale(${from})` }, { transform: `scale(${target})` }],
        { duration: target < 1 ? 110 : 220, easing: target < 1 ? SOFT : BOUNCE, fill: 'forwards' }
      );
    }

    // ---- public API: wire a promise to the loading/success animation ----
    run(promiseOrFactory, opts) {
      opts = opts || {};
      const successHold = opts.successHold ?? 900;
      const p = typeof promiseOrFactory === 'function' ? promiseOrFactory() : promiseOrFactory;

      this._startLoading();
      return Promise.resolve(p)
        .then(() => this._finishLoading(true, successHold))
        .catch((err) => {
          this._finishLoading(false, successHold);
          throw err;
        });
    }

    _startLoading() {
      if (this._loading) {
        return;
      }
      this._loading = true;
      const btn = this._btn;

      // Lock the layout width so the label swap can't resize the button. Read the
      // computed width, not getBoundingClientRect(): the latter includes the
      // press-squash scale still animating at click time, which would shrink the
      // button and shift its neighbours.
      btn.style.width = getComputedStyle(btn).width;

      btn.disabled = true;
      btn.setAttribute('data-loading', '');

      if (this._contentAnim) {
        this._contentAnim.cancel();
      }
      const dur = reduceMotion() ? 1 : 180;

      this._contentAnim = this._content.animate(
        [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.9)' },
        ],
        { duration: dur, easing: SOFT, fill: 'forwards' }
      );
      this._spinner.animate(
        [
          { opacity: 0, transform: 'scale(0.85)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: dur, delay: dur * 0.3, easing: BOUNCE, fill: 'forwards' }
      );
    }

    _finishLoading(success, hold) {
      const btn = this._btn;
      const dur = reduceMotion() ? 1 : 160;

      this._spinner.animate(
        [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.85)' },
        ],
        { duration: dur, easing: SOFT, fill: 'forwards' }
      );

      const showBack = () => {
        this._check.animate(
          [
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0, transform: 'scale(0.85)' },
          ],
          { duration: dur, easing: SOFT, fill: 'forwards' }
        );
        this._content.animate(
          [
            { opacity: 0, transform: 'scale(0.9)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          { duration: 220, easing: BOUNCE, fill: 'forwards' }
        );
        btn.removeAttribute('data-loading');
        btn.disabled = this.hasAttribute('disabled');
        btn.style.width = '';
        this._loading = false;
      };

      if (success) {
        this._check.animate(
          [
            { opacity: 0, transform: 'scale(0.7)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          { duration: dur, delay: dur * 0.3, easing: BOUNCE, fill: 'forwards' }
        );
        setTimeout(showBack, hold);
      } else {
        this._content.animate(
          [
            { opacity: 0, transform: 'scale(0.9)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          { duration: 220, delay: dur, easing: BOUNCE, fill: 'forwards' }
        );
        btn.removeAttribute('data-loading');
        btn.disabled = this.hasAttribute('disabled');
        btn.style.width = '';
        this._loading = false;
      }
    }
  }

  customElements.define('kakao-button', KakaoButton);
})();
