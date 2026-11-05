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
 * Menu (dropdown) form — works with every variant and size:
 *   list-data       JSON array of items (never "data"):
 *                     [{ "value": "light", "label": "Light", "disabled"?: true }, …]
 *                   Turns the button into a menu button: a trailing chevron, and a
 *                   click (or ↓ / ↑ / Enter / Space) opens the list below it.
 *   selected        Value of the checked item (role="menuitemradio"). Updated on pick.
 *   show-selected   Show the selected item's label instead of `label`
 *                   (`label` is then the menu's accessible name: "Theme: Dark").
 *   no-chevron      Hide the chevron (e.g. a "⋯" actions button). An icon-only
 *                   dropdown then stays a circle; with the chevron it is a pill.
 *   Keyboard in the open menu: ↑ / ↓ / Home / End move, a letter jumps,
 *   Enter / Space pick, Escape closes and returns focus, Tab closes.
 *
 * data-* attributes on the host are mirrored onto the inner <button> so Yii
 * (data-confirm / data-method) and any custom data-* hooks keep working.
 *
 * Events:
 *   kakao-button-action — bubbles on click (not while loading; not for menu buttons)
 *   kakao-button-select — bubbles when a menu item is picked:
 *                         { value, label, previous, x, y } (x / y: viewport point
 *                         of the pick, for effects that start there)
 *   kakao-button-menu   — bubbles when the menu opens or closes: { open }
 *   kakao-button-menu-hover — bubbles when the pointer moves onto a different
 *                         menu item: { value, label, index }. Mouse only (keys
 *                         and taps don't fire it), so a listener can follow the
 *                         pointer, e.g. a theme menu switching the page as the
 *                         pointer passes. It fires again after the pointer left
 *                         the menu or the menu was reopened.
 *
 * Public methods:
 *   run(promiseOrFactory, { successHold? }) — loading → success/fail animation
 *   openMenu(), closeMenu()                 — menu buttons only
 */
(function () {
  'use strict';

  if (customElements.get('kakao-button')) {
    return;
  }

  const BOUNCE = 'cubic-bezier(0.34, 1.3, 0.64, 1)';
  const SOFT = 'cubic-bezier(0.25, 1.0, 0.5, 1)';
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  let menuSeq = 0;

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
        'list-data',
        'selected',
        'show-selected',
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
      this._items = [];
      this._menuOpen = false;
      this._typed = '';
      this._typedAt = 0;
      this._hovered = -1; // menu item the pointer is over (for kakao-button-menu-hover)
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
      this._eventsWired = false;
      this._menuOpen = false;
      if (this._menu) this._menu.hidden = true;
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this._initialized) {
        return;
      }
      // Newly pressed: play the brief settle shadow (segmented toggles).
      if (name === 'pressed' && oldValue === null && newValue !== null && this.isConnected) {
        this.classList.add('kakao-button-settling'); // a class, so it isn't mirrored like data-*
        clearTimeout(this._settleTimer);
        const ms = parseFloat(getComputedStyle(this).getPropertyValue('--_segment-settle-duration')) || 700;
        this._settleTimer = setTimeout(() => this.classList.remove('kakao-button-settling'), ms + 50);
      }
      if (name === 'disabled' || name === 'pressed') {
        this._btn.setAttribute('aria-pressed', this.hasAttribute('pressed') ? 'true' : 'false');
        this._btn.disabled = this.hasAttribute('disabled');
        this._mirrorButtonAttrs();
      } else if (name === 'list-data' || name === 'selected' || name === 'show-selected') {
        if (name === 'list-data') this._readItems();
        this._syncMenu();
        this._syncFromAttributes();
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

      const chevron = document.createElement('span');
      chevron.className = 'kakao-button-chevron';
      chevron.innerHTML = CHEVRON;

      btn.append(content, chevron, spinner, check);
      this.appendChild(btn);

      // Menu (only shown with list-data)
      const menu = document.createElement('div');
      menu.className = 'kakao-button-menu';
      menu.setAttribute('role', 'menu');
      menu.id = `kakao-button-menu-${++menuSeq}`;
      menu.hidden = true;
      this.appendChild(menu);
      this._menu = menu;

      this._btn = btn;
      this._content = content;
      this._iconLeft = iconLeft;
      this._iconLeftGlyph = iconLeftGlyph;
      this._label = label;
      this._iconRight = iconRight;
      this._iconRightGlyph = iconRightGlyph;
      this._spinner = spinner;
      this._check = check;

      // After the refs above: _readItems → _syncMenu marks the host as a menu
      // button (chevron, aria-haspopup) right away.
      this._readItems();
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
        if (this._isMenu()) {
          if (this._menuOpen) this.closeMenu();
          else this.openMenu();
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

      // ---- menu wiring ----
      this._on(btn, 'keydown', (e) => {
        if (!this._isMenu() || btn.disabled) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          this.openMenu(e.key === 'ArrowUp' ? 'last' : 'selected');
        }
      });
      this._on(this._menu, 'click', (e) => {
        const el = e.target.closest('[role="menuitemradio"]');
        if (el) this._pick(Number(el.dataset.index), e);
      });
      this._on(this._menu, 'keydown', (e) => this._onMenuKey(e));
      this._on(this._menu, 'pointermove', (e) => {
        const el = e.target.closest('[role="menuitemradio"]');
        const usable = el && el.getAttribute('aria-disabled') !== 'true';
        if (usable && el !== document.activeElement) el.focus({ preventScroll: true });
        this._reportHover(usable ? Number(el.dataset.index) : -1);
      });
      this._on(this._menu, 'pointerleave', () => this._reportHover(-1));
      this._on(this, 'focusout', (e) => {
        if (this._menuOpen && !this.contains(e.relatedTarget)) this.closeMenu(false);
      });
      this._onDocPointer = (e) => {
        if (this._menuOpen && !e.composedPath().includes(this)) this.closeMenu(false);
      };
      this._on(document, 'pointerdown', this._onDocPointer, true);
    }

    // ---- menu ----
    _isMenu() {
      return this._items.length > 0;
    }

    _readItems() {
      const raw = this.getAttribute('list-data');
      let list = [];
      if (raw) {
        try {
          list = JSON.parse(raw);
        } catch (err) {
          console.error('<kakao-button> failed to parse list-data as JSON:', err);
        }
      }
      this._items = (Array.isArray(list) ? list : [])
        .map((it) => (typeof it === 'object' && it !== null ? it : { value: it }))
        .filter((it) => it.value != null)
        .map((it) => ({ value: String(it.value), label: it.label != null ? String(it.label) : String(it.value), disabled: !!it.disabled }));
      if (this._menu) this._renderMenu();
    }

    _renderMenu() {
      const menu = this._menu;
      menu.textContent = '';
      this._items.forEach((it, i) => {
        const el = document.createElement('div');
        el.className = 'kakao-button-menu-item';
        el.setAttribute('role', 'menuitemradio');
        el.tabIndex = -1;
        el.dataset.index = String(i);
        el.dataset.value = it.value;
        if (it.disabled) el.setAttribute('aria-disabled', 'true');
        const mark = document.createElement('span');
        mark.className = 'kakao-button-menu-check';
        mark.innerHTML = CHECK;
        const text = document.createElement('span');
        text.textContent = it.label;
        el.append(mark, text);
        menu.append(el);
      });
      this._syncMenu();
    }

    _selectedItem() {
      const v = this.getAttribute('selected');
      return this._items.find((it) => it.value === v) || null;
    }

    _syncMenu() {
      if (!this._btn) return;
      const isMenu = this._isMenu();
      this.toggleAttribute('data-menu', isMenu);
      if (!isMenu) {
        this._btn.removeAttribute('aria-haspopup');
        this._btn.removeAttribute('aria-expanded');
        this._btn.removeAttribute('aria-controls');
        this._menu.hidden = true;
        this._menuOpen = false;
        return;
      }
      this._btn.setAttribute('aria-haspopup', 'menu');
      this._btn.setAttribute('aria-expanded', String(this._menuOpen));
      this._btn.setAttribute('aria-controls', this._menu.id);
      this._menu.setAttribute('aria-label', this.getAttribute('label') || this.getAttribute('aria-label') || 'Menu');
      const sel = this.getAttribute('selected');
      this._menu.querySelectorAll('[role="menuitemradio"]').forEach((el) => {
        el.setAttribute('aria-checked', String(el.dataset.value === sel));
      });
    }

    /**
     * Announces the menu item the pointer is over, once per item: mouse only, so
     * a listener can follow the pointer (the theme menu previews the theme the
     * pointer is on). Disabled items and the gap between items report -1.
     * @param {number} index item index, or -1 for "none"
     */
    _reportHover(index) {
      if (index === this._hovered) return;
      this._hovered = index;
      const it = this._items[index];
      if (!it || !this._menuOpen) return;
      this.dispatchEvent(new CustomEvent('kakao-button-menu-hover', {
        bubbles: true,
        detail: { value: it.value, label: it.label, index },
      }));
    }

    _menuItems() {
      return Array.from(this._menu.querySelectorAll('[role="menuitemradio"]:not([aria-disabled="true"])'));
    }

    openMenu(focus = 'selected') {
      if (!this._isMenu() || this._menuOpen || this._btn.disabled) return;
      this._menuOpen = true;
      this._hovered = -1;
      this._menu.hidden = false;
      // Open upwards when there is no room below.
      const r = this._btn.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      this.toggleAttribute('data-menu-up', below < this._menu.offsetHeight + 16 && r.top > below);
      this._syncMenu();
      if (!reduceMotion()) {
        this._menu.animate(
          [{ opacity: 0, transform: 'translateY(var(--_menu-from, -4px)) scale(0.97)' }, { opacity: 1, transform: 'none' }],
          { duration: 180, easing: BOUNCE }
        );
      }
      const items = this._menuItems();
      const sel = items.find((el) => el.dataset.value === this.getAttribute('selected'));
      const target = focus === 'last' ? items[items.length - 1] : (sel || items[0]);
      if (target) target.focus({ preventScroll: true });
      this.dispatchEvent(new CustomEvent('kakao-button-menu', { bubbles: true, detail: { open: true } }));
    }

    closeMenu(returnFocus = true) {
      if (!this._menuOpen) return;
      this._menuOpen = false;
      this._hovered = -1;
      this._menu.hidden = true;
      this._syncMenu();
      if (returnFocus) this._btn.focus();
      this.dispatchEvent(new CustomEvent('kakao-button-menu', { bubbles: true, detail: { open: false } }));
    }

    _pick(index, e) {
      const it = this._items[index];
      if (!it || it.disabled) return;
      const el = this._menu.querySelector(`[data-index="${index}"]`);
      const rect = el ? el.getBoundingClientRect() : this._btn.getBoundingClientRect();
      const fromPointer = e && e.detail > 0 && (e.clientX || e.clientY);
      const previous = this.getAttribute('selected');
      this.setAttribute('selected', it.value);
      this.closeMenu(true);
      this.dispatchEvent(new CustomEvent('kakao-button-select', {
        bubbles: true,
        detail: {
          value: it.value,
          label: it.label,
          previous,
          x: fromPointer ? e.clientX : rect.left + rect.width / 2,
          y: fromPointer ? e.clientY : rect.top + rect.height / 2,
        },
      }));
    }

    _onMenuKey(e) {
      const items = this._menuItems();
      const i = items.indexOf(document.activeElement);
      const go = (n) => {
        e.preventDefault();
        const t = items[(n + items.length) % items.length];
        if (t) t.focus();
      };
      switch (e.key) {
        case 'ArrowDown': go(i + 1); break;
        case 'ArrowUp': go(i < 0 ? items.length - 1 : i - 1); break;
        case 'Home': go(0); break;
        case 'End': go(items.length - 1); break;
        case 'Escape': e.preventDefault(); this.closeMenu(true); break;
        case 'Tab': this.closeMenu(false); break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (i >= 0) this._pick(Number(items[i].dataset.index), e);
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const now = Date.now();
            this._typed = (now - this._typedAt > 700 ? '' : this._typed) + e.key.toLowerCase();
            this._typedAt = now;
            const start = i < 0 ? 0 : i + (this._typed.length === 1 ? 1 : 0);
            const order = items.slice(start).concat(items.slice(0, start));
            const hit = order.find((el) => el.textContent.trim().toLowerCase().startsWith(this._typed));
            if (hit) hit.focus();
          }
      }
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
      const shownItem = this.hasAttribute('show-selected') ? this._selectedItem() : null;

      // Write it back only when it really changes: icon-position is observed, so an
      // unconditional set would call attributeChangedCallback → this method → set…
      // again, recursing hundreds of times per button (a visible stutter on load).
      if (this.getAttribute('icon-position') !== iconPos) this.setAttribute('icon-position', iconPos);

      const label = shownItem ? shownItem.label : labelText;
      if (this._label.textContent !== label) this._label.textContent = label;
      this._label.style.display = iconPos === 'only' ? 'none' : '';

      this._iconLeft.style.display =
        iconClass && (iconPos === 'left' || iconPos === 'only') ? 'inline-flex' : 'none';
      this._iconRight.style.display = iconClass && iconPos === 'right' ? 'inline-flex' : 'none';
      if (iconClass) {
        this._iconLeftGlyph.className = iconClass;
        this._iconRightGlyph.className = iconClass;
      }

      const aria = this.getAttribute('aria-label')
        || (shownItem && labelText ? `${labelText}: ${shownItem.label}` : '')
        || (iconPos === 'only' ? labelText : '');
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
