/**
 * <kakao-theme-switch>
 * ============================================================================
 * A button that switches the page between colour themes: light and dark by
 * default, any number of themes via list-data. The new theme spreads over the
 * page as a ripple from the button. Vanilla JS, Shadow DOM, no deps.
 *
 * The themes themselves are CSS (shared/tokens.css + shared/themes.css). The
 * switch sets data-kakao-theme="<name>" on <html>, mirrors the theme's colour
 * scheme to data-bs-theme (so Bootstrap 5.3 follows), and remembers the choice
 * in localStorage. Until someone picks a theme, the page follows the operating
 * system and the switch shows that theme.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="shared/tokens.css">
 *   <link rel="stylesheet" href="shared/themes.css">
 *   <!-- in <head>, without defer: applies a saved theme before first paint -->
 *   <script src="theme-switch.js"><\/script>
 *
 *   <kakao-theme-switch></kakao-theme-switch>
 *   <kakao-theme-switch show-label list-data='[
 *     {"value":"light","label":"Light","scheme":"light"},
 *     {"value":"dark","label":"Dark","scheme":"dark"},
 *     {"value":"sepia","label":"Sepia","scheme":"light","icon":"sun"}
 *   ]'></kakao-theme-switch>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  list-data    JSON array of themes, in switching order (never "data"):
 *                 { value, label?, scheme?: "light" | "dark", icon?: "sun" | "moon" }
 *               Default: light, dark. scheme defaults to "dark" for a value
 *               containing "dark", else "light"; icon follows the scheme.
 *               (data-bs-theme always gets the colour-scheme the theme's CSS sets.)
 *  storage-key  localStorage key for the choice. Default "kakao-theme".
 *               Empty ("") = don't remember.
 *  show-label   Also show the current theme's name next to the icon.
 *  disabled     Blocks switching.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  theme                       Get / set the current theme by value (no ripple).
 *  themes                      The normalized theme list (read only).
 *  setTheme(value, options?)   options: { animate?: boolean, x?, y? } — x / y
 *                              (viewport px) is where the ripple starts.
 *  next(options?)              Switch to the following theme.
 *
 *  Page-level, for other controls (e.g. a <kakao-button> menu of themes):
 *    customElements.get('kakao-theme-switch').setTheme(value, { x, y, animate? })
 *    customElements.get('kakao-theme-switch').current()   → the theme on <html>
 *  Any theme in shared/themes.css can be set this way, also one that is not
 *  in a switch's list (the switch then shows the icon of its colour scheme).
 *
 *  Calls made before the element is connected are queued.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  theme-change   { theme, previous, scheme, source: "user" | "api" | "storage" }
 *                 after the theme on <html> changed: on the switch, or on
 *                 document for the page-level setTheme().
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES
 * ----------------------------------------------------------------------------
 *  Defaults live in the settings block below (edit on construction.html).
 *  Colours follow the main variables, so the switch is themed like the rest.
 *
 *  --kakao-theme-switch-size              40px     button height (and width without label)
 *  --kakao-theme-switch-bg / -hover-bg    subtle fills
 *  --kakao-theme-switch-color             icon and label colour
 *  --kakao-theme-switch-ripple-duration   700ms    page ripple
 *  --kakao-theme-switch-icon-duration     500ms    sun ↔ moon morph
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  - A native button named "Switch to <next> theme" (with show-label the visible
 *    theme name starts the name: "Light, switch to dark theme").
 *  - The new theme is announced in a polite live region.
 *  - Visible 2px focus outline (3:1 in every theme).
 *  - With prefers-reduced-motion the theme changes at once: no ripple, no morph.
 *  - Without View Transitions support the theme also changes at once.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-theme-switch';
  if (customElements.get(TAG_NAME)) return;

  const ROOT = document.documentElement;
  const THEME_ATTR = 'data-kakao-theme';
  const BS_ATTR = 'data-bs-theme';
  const DEFAULT_KEY = 'kakao-theme';
  const RIPPLE_CLASS = 'kakao-theme-ripple';
  const DEFAULT_THEMES = [
    { value: 'light', label: 'Light', scheme: 'light' },
    { value: 'dark', label: 'Dark', scheme: 'dark' },
  ];

  const storage = {
    get(key) {
      try { return key ? localStorage.getItem(key) : null; } catch { return null; }
    },
    set(key, value) {
      try { if (key) localStorage.setItem(key, value); } catch { /* storage blocked */ }
    },
  };

  // Apply a saved theme right away, so a page loading this script in <head>
  // paints in the right theme from the start (no flash).
  (function applySaved() {
    const saved = storage.get(DEFAULT_KEY);
    if (saved && !ROOT.hasAttribute(THEME_ATTR)) {
      ROOT.setAttribute(THEME_ATTR, saved);
      if (saved === 'light' || saved === 'dark') ROOT.setAttribute(BS_ATTR, saved);
      // Other themes: their colour scheme is known once the stylesheets are in.
      else window.addEventListener('DOMContentLoaded', () => ROOT.setAttribute(BS_ATTR, computedScheme()), { once: true });
    }
  })();

  const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /** Page-level styles for the ripple (view transitions live outside any shadow root). */
  function ensureRippleStyles() {
    if (document.getElementById('kakao-theme-switch-ripple')) return;
    const style = document.createElement('style');
    style.id = 'kakao-theme-switch-ripple';
    style.textContent = `
      html.${RIPPLE_CLASS}::view-transition-old(root),
      html.${RIPPLE_CLASS}::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
      html.${RIPPLE_CLASS}::view-transition-old(root) { z-index: 0; }
      /* Start clipped to nothing, so the new theme can't flash in full for a
         frame before the ripple animation takes over. */
      html.${RIPPLE_CLASS}::view-transition-new(root) {
        z-index: 1;
        clip-path: circle(0px at var(--kakao-ripple-x, 50%) var(--kakao-ripple-y, 50%));
      }
    `;
    document.head.append(style);
  }

  /** "dark" or "light": the colour-scheme the current theme's CSS sets on <html>. */
  function computedScheme() {
    return /dark/.test(getComputedStyle(ROOT).colorScheme || '') ? 'dark' : 'light';
  }

  function applyTheme(value) {
    ROOT.setAttribute(THEME_ATTR, value);
    ROOT.setAttribute(BS_ATTR, computedScheme());
  }

  function parseDuration(value, fallback) {
    const m = String(value).trim().match(/^(-?\d*\.?\d+)(ms|s)$/);
    if (!m) return fallback;
    return m[2] === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1]);
  }

  /*
   * Colour transitions that start because the theme changed would play inside
   * the newly revealed theme (it is the live page): components would fade from
   * their old colours while the ripple grows, which reads as flicker. Right
   * after a theme is applied they are finished at once, also inside open
   * shadow roots. Movement (transform, opacity: e.g. the icon morph) is kept.
   */
  const COLOR_TRANSITION = /color|background|border|shadow|fill|stroke|outline|^--/;

  function settleColorTransitions() {
    void ROOT.offsetWidth; // flush styles: the theme's transitions now exist
    if (typeof CSSTransition === 'undefined') return;
    const anims = new Set(document.getAnimations());
    const walk = (root) => {
      root.querySelectorAll('*').forEach((el) => {
        if (!el.shadowRoot) return;
        el.shadowRoot.getAnimations().forEach((a) => anims.add(a));
        walk(el.shadowRoot);
      });
    };
    walk(document);
    anims.forEach((a) => {
      if (a instanceof CSSTransition && COLOR_TRANSITION.test(a.transitionProperty)) a.finish();
    });
  }

  /*
   * One ripple at a time. A switch requested while a ripple runs is queued:
   * the running ripple completes, then one more ripple goes to the latest
   * requested theme (however many requests came in). Interrupting instead
   * would jump to the half-revealed theme and restart, which flickers.
   */
  const queue = {
    target: null,      // the theme the page is heading to (requested, maybe not applied yet)
    running: false,
    pending: null,     // { value, options } to run after the current ripple
    waiters: [],       // resolve() of callers waiting for the next apply
  };

  let pageRequest = 0; // latest page-level setTheme() call

  /** The theme the page shows or is about to show. */
  function targetTheme() {
    return queue.target || ROOT.getAttribute(THEME_ATTR);
  }

  /**
   * Sets a theme on <html>, with the ripple when wanted and possible, and
   * remembers it. Resolves once that theme (or a later request) is applied.
   */
  function switchTheme(value, options = {}) {
    queue.target = value;
    storage.set(options.storageKey === undefined ? DEFAULT_KEY : options.storageKey, value);
    // Switches show the target at once (icon, label), even while a ripple runs.
    document.querySelectorAll(TAG_NAME).forEach((el) => { if (typeof el._sync === 'function') el._sync(); });
    return new Promise((resolve) => {
      queue.waiters.push(resolve);
      if (queue.running) {
        queue.pending = { value, options };
        return;
      }
      runSwitch(value, options);
    });
  }

  function runSwitch(value, { animate = true, x, y, timing } = {}) {
    queue.running = true;
    const applied = () => {
      const waiters = queue.waiters.splice(0);
      waiters.forEach((resolve) => resolve());
    };
    const finished = () => {
      queue.running = false;
      const next = queue.pending;
      queue.pending = null;
      if (next && next.value !== ROOT.getAttribute(THEME_ATTR)) runSwitch(next.value, next.options);
      else {
        queue.target = null;
        applied(); // callers whose request turned out to be the current theme
      }
    };
    const update = () => {
      applyTheme(value);
      settleColorTransitions();
    };

    if (value === ROOT.getAttribute(THEME_ATTR)) {
      applied();
      finished();
      return;
    }
    if (!animate || reducedMotion() || typeof document.startViewTransition !== 'function') {
      update();
      applied();
      finished();
      return;
    }

    // Ripple: the new theme is revealed as a growing circle from (x, y).
    const cx = Number.isFinite(x) ? x : window.innerWidth / 2;
    const cy = Number.isFinite(y) ? y : window.innerHeight / 2;
    const radius = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
    const { duration, easing } = timing || rippleTiming(document.querySelector(TAG_NAME));

    ensureRippleStyles();
    ROOT.style.setProperty('--kakao-ripple-x', `${cx}px`);
    ROOT.style.setProperty('--kakao-ripple-y', `${cy}px`);
    ROOT.classList.add(RIPPLE_CLASS);
    let transition;
    try {
      transition = document.startViewTransition(update);
    } catch {
      ROOT.classList.remove(RIPPLE_CLASS);
      update();
      applied();
      finished();
      return;
    }
    transition.ready.then(() => {
      ROOT.animate(
        { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${radius}px at ${cx}px ${cy}px)`] },
        // forwards: stay fully revealed until the transition itself ends
        { duration, easing, fill: 'forwards', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => { /* skipped: the theme is applied anyway */ });
    transition.updateCallbackDone.then(applied, applied);
    transition.finished.finally(() => {
      ROOT.classList.remove(RIPPLE_CLASS);
      ROOT.style.removeProperty('--kakao-ripple-x');
      ROOT.style.removeProperty('--kakao-ripple-y');
      finished();
    });
  }

  /** Ripple duration / easing from a switch's settings (defaults without one). */
  function rippleTiming(el) {
    if (!el) return { duration: 700, easing: 'cubic-bezier(.4, 0, .2, 1)' };
    const style = getComputedStyle(el);
    return {
      duration: parseDuration(style.getPropertyValue('--_ripple-duration'), 700),
      easing: style.getPropertyValue('--_ripple-easing').trim() || 'ease-in-out',
    };
  }

  const ICON = `
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <defs>
        <mask id="moon-cut">
          <rect width="24" height="24" fill="white"></rect>
          <circle class="cut" cx="17" cy="7" r="6.5" fill="black"></circle>
        </mask>
      </defs>
      <circle class="core" cx="12" cy="12" r="8.5" mask="url(#moon-cut)"></circle>
      <g class="rays">
        <line x1="12" y1="1.5" x2="12" y2="3.5"></line>
        <line x1="12" y1="20.5" x2="12" y2="22.5"></line>
        <line x1="1.5" y1="12" x2="3.5" y2="12"></line>
        <line x1="20.5" y1="12" x2="22.5" y2="12"></line>
        <line x1="4.6" y1="4.6" x2="6" y2="6"></line>
        <line x1="18" y1="18" x2="19.4" y2="19.4"></line>
        <line x1="4.6" y1="19.4" x2="6" y2="18"></line>
        <line x1="18" y1="6" x2="19.4" y2="4.6"></line>
      </g>
    </svg>`;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-theme-switch- (written by construction.html, edit there) */
        --_size: var(--kakao-theme-switch-size, 40px);
        --_radius: var(--kakao-theme-switch-radius, 999px);
        --_padding-x: var(--kakao-theme-switch-padding-x, 14px);
        --_gap: var(--kakao-theme-switch-gap, 8px);
        --_icon-size: var(--kakao-theme-switch-icon-size, 20px);
        --_bg: var(--kakao-theme-switch-bg, var(--kakao-color-subtle, #f0f0f1));
        --_hover-bg: var(--kakao-theme-switch-hover-bg, var(--kakao-color-subtle-strong, #e6e6e8));
        --_color: var(--kakao-theme-switch-color, var(--kakao-color-text, #18181b));
        --_font: var(--kakao-theme-switch-font, 550 0.875rem/1 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_focus-color: var(--kakao-theme-switch-focus-color, var(--kakao-color-focus, #2563eb));
        --_focus-width: var(--kakao-theme-switch-focus-width, 2px);
        --_focus-offset: var(--kakao-theme-switch-focus-offset, 2px);
        --_disabled-opacity: var(--kakao-theme-switch-disabled-opacity, 0.45);
        --_icon-duration: var(--kakao-theme-switch-icon-duration, 500ms);
        --_icon-easing: var(--kakao-theme-switch-icon-easing, cubic-bezier(.5, 1.8, .4, 1));
        --_ripple-duration: var(--kakao-theme-switch-ripple-duration, 700ms);
        --_ripple-easing: var(--kakao-theme-switch-ripple-easing, cubic-bezier(.4, 0, .2, 1));
        /* @kakao-settings:end */
        display: inline-flex;
        vertical-align: middle;
      }
      :host([hidden]) { display: none; }
      :host([disabled]) { opacity: var(--_disabled-opacity); }

      button {
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--_gap);
        min-width: var(--_size);
        height: var(--_size);
        padding: 0;
        border: 0;
        border-radius: var(--_radius);
        background: var(--_bg);
        color: var(--_color);
        font: var(--_font);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background-color 150ms ease, transform 150ms ease;
      }
      :host([show-label]) button { padding: 0 var(--_padding-x) 0 calc(var(--_padding-x) - 4px); }
      button:hover { background: var(--_hover-bg); }
      button:active { transform: scale(0.94); }
      button:focus-visible { outline: var(--_focus-width) solid var(--_focus-color); outline-offset: var(--_focus-offset); }
      :host([disabled]) button { cursor: not-allowed; transform: none; background: var(--_bg); }

      .label { display: none; white-space: nowrap; }
      :host([show-label]) .label { display: inline; }

      /* ---- sun ↔ moon ---- */
      .icon {
        width: var(--_icon-size);
        height: var(--_icon-size);
        overflow: visible;
        transition: transform var(--_icon-duration) var(--_icon-easing);
      }
      .core { fill: currentColor; transform-box: fill-box; transform-origin: center; transition: transform var(--_icon-duration) var(--_icon-easing); }
      .cut { transition: transform var(--_icon-duration) var(--_icon-easing); }
      .rays { stroke: currentColor; stroke-width: 2; stroke-linecap: round; transform-origin: 12px 12px; transition: transform var(--_icon-duration) var(--_icon-easing), opacity calc(var(--_icon-duration) * 0.6) ease; }

      /* sun: small core, cut moved away, rays out */
      button[data-icon="sun"] .core { transform: scale(0.55); }
      button[data-icon="sun"] .cut { transform: translate(9px, -9px); }
      /* moon: full core with a bite, rays tucked in */
      button[data-icon="moon"] .icon { transform: rotate(-30deg); }
      button[data-icon="moon"] .rays { transform: scale(0.4) rotate(-45deg); opacity: 0; }

      .sr {
        position: absolute;
        width: 1px; height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      @media (prefers-reduced-motion: reduce) {
        .icon, .core, .cut, .rays, button { transition: none; }
      }
    </style>
    <button type="button" part="button">
      ${ICON}
      <span class="label" part="label"></span>
      <span class="sr hint"></span>
    </button>
    <span class="sr status" role="status" aria-live="polite"></span>
  `;

  class KakaoThemeSwitch extends HTMLElement {
    /** Page-level: set any theme (with the ripple from x / y). */
    static setTheme(value, options = {}) {
      const previous = targetTheme() || computedScheme();
      if (value === targetTheme()) return Promise.resolve();
      const request = ++pageRequest;
      return switchTheme(String(value), options).then(() => {
        // Only the latest request reports, and only if its theme is the one shown.
        if (request !== pageRequest || ROOT.getAttribute(THEME_ATTR) !== String(value)) return;
        document.dispatchEvent(new CustomEvent('theme-change', {
          detail: { theme: String(value), previous, scheme: computedScheme(), source: options.source || 'api' },
        }));
      });
    }

    /** Page-level: the theme on <html>, or the system's light / dark when none is chosen. */
    static current() {
      return targetTheme() || computedScheme();
    }

    static get observedAttributes() {
      return ['list-data', 'storage-key', 'show-label', 'disabled'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._button = shadow.querySelector('button');
      this._labelEl = shadow.querySelector('.label');
      this._hintEl = shadow.querySelector('.hint');
      this._statusEl = shadow.querySelector('.status');

      this._themes = DEFAULT_THEMES.slice();
      this._connected = false;
      this._pending = [];

      this._onClick = this._onClick.bind(this);
      this._sync = this._sync.bind(this);
      this._onStorage = this._onStorage.bind(this);
      this._observer = new MutationObserver(this._sync);
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      this._connected = true;
      this._button.addEventListener('click', this._onClick);
      this._observer.observe(ROOT, { attributes: true, attributeFilter: [THEME_ATTR] });
      if (darkQuery) darkQuery.addEventListener('change', this._sync);
      window.addEventListener('storage', this._onStorage);

      this._readThemes();
      // A remembered choice under a custom key (the default key is applied at load).
      const saved = storage.get(this._storageKey());
      if (saved && this._find(saved) && ROOT.getAttribute(THEME_ATTR) !== saved) this._apply(this._find(saved));
      this._sync();

      while (this._pending.length) {
        const { method, args } = this._pending.shift();
        this[method](...args);
      }
    }

    disconnectedCallback() {
      this._connected = false;
      this._button.removeEventListener('click', this._onClick);
      this._observer.disconnect();
      if (darkQuery) darkQuery.removeEventListener('change', this._sync);
      window.removeEventListener('storage', this._onStorage);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this._connected) return;
      if (name === 'list-data') this._readThemes();
      if (name === 'disabled') this._button.disabled = this.hasAttribute('disabled');
      this._sync();
    }

    /* -------------------------- Public API -------------------------- */

    get themes() {
      return this._themes.map((t) => ({ ...t }));
    }

    get theme() {
      return this._current().value;
    }

    set theme(value) {
      this.setTheme(value, { animate: false });
    }

    setTheme(value, options = {}) {
      if (!this._connected) {
        this._pending.push({ method: 'setTheme', args: [value, options] });
        return;
      }
      const theme = this._find(value);
      if (!theme) {
        console.warn(`<${TAG_NAME}> unknown theme "${value}"`);
        return;
      }
      this._switchTo(theme, { animate: options.animate !== false, x: options.x, y: options.y, source: options.source || 'api' });
    }

    next(options = {}) {
      if (!this._connected) {
        this._pending.push({ method: 'next', args: [options] });
        return;
      }
      this.setTheme(this._next().value, options);
    }

    /* -------------------------- Themes -------------------------- */

    _storageKey() {
      const key = this.getAttribute('storage-key');
      return key === null ? DEFAULT_KEY : key.trim();
    }

    _readThemes() {
      const raw = this.getAttribute('list-data');
      let list = null;
      if (raw) {
        try {
          list = JSON.parse(raw);
        } catch (err) {
          console.error(`<${TAG_NAME}> failed to parse list-data as JSON:`, err);
        }
      }
      const themes = (Array.isArray(list) ? list : [])
        .map((t) => (typeof t === 'string' ? { value: t } : t))
        .filter((t) => t && t.value != null)
        .map((t) => {
          const value = String(t.value);
          const scheme = t.scheme === 'dark' || t.scheme === 'light' ? t.scheme : /dark/i.test(value) ? 'dark' : 'light';
          return {
            value,
            label: t.label != null ? String(t.label) : value[0].toUpperCase() + value.slice(1),
            scheme,
            icon: t.icon === 'sun' || t.icon === 'moon' ? t.icon : scheme === 'dark' ? 'moon' : 'sun',
          };
        });
      this._themes = themes.length ? themes : DEFAULT_THEMES.map((t) => ({ ...t, icon: t.scheme === 'dark' ? 'moon' : 'sun' }));
    }

    _find(value) {
      return this._themes.find((t) => t.value === value) || null;
    }

    /** The theme in effect: the attribute on <html>, else the one matching the OS. */
    _current() {
      // The theme the page is heading to, so quick clicks keep toggling from it.
      const chosen = this._find(targetTheme());
      if (chosen) return chosen;
      // No theme chosen (follows the OS), or one this switch doesn't list:
      // show the theme with the same colour scheme.
      const scheme = computedScheme();
      return this._themes.find((t) => t.scheme === scheme) || this._themes[0];
    }

    _next() {
      const i = this._themes.indexOf(this._current());
      return this._themes[(i + 1) % this._themes.length];
    }

    _apply(theme) {
      applyTheme(theme.value);
    }

    _switchTo(theme, { animate, x, y, source }) {
      const previous = this._current();
      if (theme.value === targetTheme()) return;
      const request = (this._request = (this._request || 0) + 1);
      const r = this._button.getBoundingClientRect();
      switchTheme(theme.value, {
        animate,
        x: Number.isFinite(x) ? x : r.left + r.width / 2,
        y: Number.isFinite(y) ? y : r.top + r.height / 2,
        storageKey: this._storageKey(),
        timing: rippleTiming(this),
      }).then(() => {
        this._sync();
        // Only the latest request reports, and only if its theme is the one shown.
        if (request !== this._request || ROOT.getAttribute(THEME_ATTR) !== theme.value) return;
        if (source === 'user') this._statusEl.textContent = `${theme.label} theme`;
        this.dispatchEvent(new CustomEvent('theme-change', {
          bubbles: true,
          composed: true,
          detail: { theme: theme.value, previous: previous.value, scheme: computedScheme(), source },
        }));
      });
    }

    /* -------------------------- Rendering -------------------------- */

    _sync() {
      if (!this._connected) return;
      const current = this._current();
      const next = this._next();
      this._button.dataset.icon = current.icon;
      this._button.disabled = this.hasAttribute('disabled');
      this._labelEl.textContent = current.label;
      const action = `switch to ${next.label.toLowerCase()} theme`;
      if (this.hasAttribute('show-label')) {
        // Visible text first, so the accessible name contains what is shown.
        this._button.removeAttribute('aria-label');
        this._hintEl.textContent = `, ${action}`;
      } else {
        this._button.setAttribute('aria-label', action[0].toUpperCase() + action.slice(1));
        this._hintEl.textContent = '';
      }
      this._button.title = action[0].toUpperCase() + action.slice(1);
    }

    /* -------------------------- Events -------------------------- */

    _onClick(e) {
      if (this.hasAttribute('disabled')) return;
      // Keyboard clicks have no pointer position (detail 0): start at the button.
      const fromPointer = e.detail > 0 && (e.clientX || e.clientY);
      this._switchTo(this._next(), {
        animate: true,
        x: fromPointer ? e.clientX : undefined,
        y: fromPointer ? e.clientY : undefined,
        source: 'user',
      });
    }

    _onStorage(e) {
      if (e.key !== this._storageKey() || !e.newValue) return;
      const theme = this._find(e.newValue);
      if (theme) this._switchTo(theme, { animate: false, source: 'storage' });
    }
  }

  customElements.define(TAG_NAME, KakaoThemeSwitch);
})();
