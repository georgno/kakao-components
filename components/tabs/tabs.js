/**
 * Tab Switcher web components: <kakao-tabs> and <kakao-tab>
 * Dispatches a bubbling "tab-change" event with detail: { controls, item, url }
 */
(function () {
  'use strict';

  if (customElements.get('kakao-tab')) {
    return;
  }

  // ─── KakaoTab ────────────────────────────────────────────────────────────────
  class KakaoTab extends HTMLElement {
    static get observedAttributes() {
      return ['selected', 'disabled'];
    }

    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      const glow = document.createElement('div');
      glow.className = 'hold-glow';
      const label = document.createElement('span');
      label.className = 'label';
      label.append(...this.childNodes);
      this.appendChild(glow);
      this.appendChild(label);

      this.setAttribute('role', 'tab');
      this._syncAria();

      if (!this.hasAttribute('tabindex')) {
        this.setAttribute('tabindex', this.hasAttribute('disabled') ? '-1' : '0');
      }
    }

    attributeChangedCallback() {
      this._syncAria();
    }

    _syncAria() {
      const disabled = this.hasAttribute('disabled');
      const selected = this.hasAttribute('selected');
      this.setAttribute('aria-selected', selected);
      this.setAttribute('aria-disabled', disabled);
      this.setAttribute('tabindex', disabled ? '-1' : (selected ? '0' : '-1'));
    }

    get selected() {
      return this.hasAttribute('selected');
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }

    get controls() {
      // data-controls preferred (Yii Html treats "controls" as a boolean attribute)
      return this.getAttribute('data-controls') || this.getAttribute('controls');
    }

    get url() {
      return this.getAttribute('data-url') || this.getAttribute('href') || '';
    }

    get glow() {
      return this.querySelector('.hold-glow');
    }

    setSelected(val) {
      if (val) this.setAttribute('selected', '');
      else this.removeAttribute('selected');
    }

    shake() {
      this.classList.remove('shaking');
      void this.offsetWidth;
      this.classList.add('shaking');
      const labelEl = this.querySelector('.label');
      if (labelEl) {
        labelEl.addEventListener('animationend', () => this.classList.remove('shaking'), { once: true });
      }
    }

    focus(options) {
      super.focus(options);
    }
  }

  // ─── KakaoTabs ─────────────────────────────────────────────────────────────
  class KakaoTabs extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      this._thumb = document.createElement('div');
      this._thumb.className = 'thumb';
      this.prepend(this._thumb);

      this._currentItem = null;
      this._currentAnim = null;
      this._listeners = new Map();
      this._holdState = new Map();
      this._ro = null;
      this._mo = null;

      customElements.whenDefined('kakao-tab').then(() => {
        this._ro = new ResizeObserver(() => this._repositionThumb());
        this._ro.observe(this);
        this._setupItems();
        this._observeMutations();
      });
    }

    disconnectedCallback() {
      this._ro?.disconnect();
      this._mo?.disconnect();
      this._listeners.forEach((_, item) => this._removeListeners(item));
      this._listeners.clear();
      if (this._keyHandler) {
        this.removeEventListener('keydown', this._keyHandler);
      }
    }

    /** Programmatically select a tab by controls value, data-url, or kakao-tab element */
    select(target) {
      const item = typeof target === 'string'
        ? this._items().find(i => i.controls === target || i.url === target)
        : target;
      if (item) this._selectItem(item);
    }

    _items() {
      return [...this.querySelectorAll('kakao-tab')];
    }

    _enabledItems() {
      return this._items().filter(i => !i.disabled);
    }

    _getPos(item) {
      const tr = this.getBoundingClientRect();
      const ir = item.getBoundingClientRect();
      // The thumb's own offset is the container padding (a theming setting)
      return { x: ir.left - tr.left - this._thumb.offsetLeft, w: ir.width };
    }

    _repositionThumb() {
      if (!this._currentItem) return;
      const { x, w } = this._getPos(this._currentItem);
      if (!w) return;
      if (!this._thumb._x) {
        this._thumb.style.transform = `translateX(${x}px)`;
        this._thumb.style.width = w + 'px';
      }
      this._thumb._x = x;
      this._thumb._w = w;
    }

    _moveThumb(item) {
      const all = this._items();
      const enabled = this._enabledItems();
      const toIdx = enabled.indexOf(item);
      const fromIdx = enabled.indexOf(this._currentItem);
      const dir = Math.sign(toIdx - fromIdx);
      const allIdx = all.indexOf(item);
      const hitsWall = (allIdx === all.length - 1 && dir > 0) || (allIdx === 0 && dir < 0);

      const BOUNCE = { easing: 'cubic-bezier(0.34, 1.3, 0.64, 1)', duration: 400, fill: 'forwards' };
      const SOFT = { easing: 'cubic-bezier(0.25, 1.0, 0.5, 1)', duration: 400, fill: 'forwards' };
      const opts = hitsWall ? SOFT : BOUNCE;

      const { x: targetX, w: targetW } = this._getPos(item);
      let fromX = this._thumb._x ?? targetX;
      let fromW = this._thumb._w ?? targetW;

      if (this._currentAnim) {
        const tr = this._thumb.getBoundingClientRect();
        const pr = this.getBoundingClientRect();
        fromX = tr.left - pr.left - 4;
        fromW = tr.width;
        this._currentAnim.cancel();
      }

      this._currentAnim = this._thumb.animate([
        { transform: `translateX(${fromX}px) scaleX(1.15) scaleY(0.8)`, width: fromW + 'px' },
        { transform: `translateX(${targetX}px) scaleX(1) scaleY(1)`, width: targetW + 'px' }
      ], opts);

      this._currentAnim.onfinish = () => {
        this._thumb.style.transform = `translateX(${targetX}px)`;
        this._thumb.style.width = targetW + 'px';
        this._currentAnim = null;
      };

      this._thumb._x = targetX;
      this._thumb._w = targetW;
    }

    _selectItem(item) {
      if (!item || item.disabled || item === this._currentItem) return;
      this._moveThumb(item);
      this._items().forEach(i => {
        i.setSelected(i === item);
        if (i.controls) {
          const panel = document.getElementById(i.controls);
          if (panel) panel.hidden = i !== item;
        }
      });
      this._currentItem = item;
      this.dispatchEvent(new CustomEvent('tab-change', {
        detail: { controls: item.controls, item, url: item.url },
        bubbles: true,
        composed: true
      }));
    }

    _startHold(item) {
      if (item.disabled) return;
      this._cancelHold(item);
      const t0 = performance.now();
      const state = { raf: null };
      this._holdState.set(item, state);
      if (item.glow) {
        item.glow.style.transition = 'none';
      }
      const tick = (now) => {
        const t = Math.min((now - t0) / 600, 1);
        if (item.glow) {
          item.glow.style.opacity = t * t;
        }
        if (t < 1) state.raf = requestAnimationFrame(tick);
      };
      state.raf = requestAnimationFrame(tick);
    }

    _cancelHold(item) {
      const s = this._holdState.get(item);
      if (s) {
        cancelAnimationFrame(s.raf);
        this._holdState.delete(item);
      }
    }

    _releaseHold(item) {
      this._cancelHold(item);
      if (!item.glow) return;
      item.glow.style.transition = 'opacity 0.08s ease-out';
      item.glow.style.opacity = 0;
    }

    _addListeners(item) {
      const inIframe = window.self !== window.top;
      const handlers = {};

      if (item.disabled) {
        handlers.click = () => item.shake();
        handlers.pointerdown = (e) => {
          if (!inIframe) {
            e.preventDefault();
            item.shake();
          }
        };
      } else if (item.hasAttribute('data-no-select')) {
        // Host for an embedded control (e.g. a dropdown). Don't steal the gesture.
      } else {
        if (inIframe) {
          handlers.click = () => this._selectItem(item);
        } else {
          handlers.pointerdown = (e) => {
            e.preventDefault();
            this._selectItem(item);
            this._startHold(item);
          };
        }
        handlers.pointerdown_hold = () => {
          if (inIframe) this._startHold(item);
        };
        handlers.pointerup = () => this._releaseHold(item);
        handlers.pointerleave = () => this._releaseHold(item);
        handlers.pointercancel = () => this._releaseHold(item);
      }

      if (handlers.click) item.addEventListener('click', handlers.click);
      if (handlers.pointerdown) item.addEventListener('pointerdown', handlers.pointerdown);
      if (handlers.pointerdown_hold) item.addEventListener('pointerdown', handlers.pointerdown_hold);
      if (handlers.pointerup) item.addEventListener('pointerup', handlers.pointerup);
      if (handlers.pointerleave) item.addEventListener('pointerleave', handlers.pointerleave);
      if (handlers.pointercancel) item.addEventListener('pointercancel', handlers.pointercancel);

      this._listeners.set(item, handlers);
    }

    _removeListeners(item) {
      const handlers = this._listeners.get(item);
      if (!handlers) return;
      if (handlers.click) item.removeEventListener('click', handlers.click);
      if (handlers.pointerdown) item.removeEventListener('pointerdown', handlers.pointerdown);
      if (handlers.pointerdown_hold) item.removeEventListener('pointerdown', handlers.pointerdown_hold);
      if (handlers.pointerup) item.removeEventListener('pointerup', handlers.pointerup);
      if (handlers.pointerleave) item.removeEventListener('pointerleave', handlers.pointerleave);
      if (handlers.pointercancel) item.removeEventListener('pointercancel', handlers.pointercancel);
      this._listeners.delete(item);
    }

    _setupKeyboard() {
      this._keyHandler = (e) => {
        const items = this._enabledItems();
        const index = items.indexOf(document.activeElement);
        if (index === -1) return;
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const n = items[index + 1];
          if (n) {
            n.focus();
            this._selectItem(n);
          }
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const p = items[index - 1];
          if (p) {
            p.focus();
            this._selectItem(p);
          }
        }
      };
      this.addEventListener('keydown', this._keyHandler);
    }

    _setupItems() {
      this._items().forEach(item => this._addListeners(item));
      this._setupKeyboard();

      const first = this._items().find(i => i.hasAttribute('selected')) || this._enabledItems()[0];
      if (first) {
        requestAnimationFrame(() => {
          const { x, w } = this._getPos(first);
          this._thumb.style.transform = `translateX(${x}px)`;
          this._thumb.style.width = w + 'px';
          this._thumb._x = x;
          this._thumb._w = w;
          this._items().forEach(i => {
            i.setSelected(i === first);
            if (i.controls) {
              const panel = document.getElementById(i.controls);
              if (panel) panel.hidden = i !== first;
            }
          });
          this._currentItem = first;
        });
      }
    }

    _observeMutations() {
      this._mo = new MutationObserver((mutations) => {
        mutations.forEach(m => {
          m.addedNodes.forEach(node => {
            if (node instanceof KakaoTab || (node.tagName && node.tagName.toLowerCase() === 'kakao-tab')) {
              customElements.upgrade(node);
              this._addListeners(node);
            }
          });
          m.removedNodes.forEach(node => {
            if (node instanceof KakaoTab || (node.tagName && node.tagName.toLowerCase() === 'kakao-tab')) {
              this._removeListeners(node);
              this._cancelHold(node);
              if (node === this._currentItem) {
                const next = this._enabledItems()[0];
                if (next) this._selectItem(next);
              }
            }
          });
        });
      });
      this._mo.observe(this, { childList: true });
    }
  }

  customElements.define('kakao-tab', KakaoTab);
  customElements.define('kakao-tabs', KakaoTabs);
})();
