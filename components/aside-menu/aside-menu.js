/**
 * <kakao-aside-menu>
 * ============================================================================
 * A slide-in side menu that is completely hidden until opened. Its hamburger
 * button opens it; the panel then pushes the whole page (the <body>) to the
 * side to make room, slides in, and shows its content — any markup placed
 * inside the element, which the component moves into the panel (it is light
 * DOM, so a <slot> would not work). A close button inside the panel header
 * closes it again.
 * Vanilla JS, no dependencies.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="aside-menu.css">
 *   <link rel="stylesheet" href="../button/button.css">
 *   <script src="../button/button.js" defer><\/script>
 *   <script src="aside-menu.js" defer><\/script>
 *
 *   <kakao-aside-menu label="Site menu">
 *     <nav>
 *       <a href="#">Home</a>
 *       <a href="#">Library</a>
 *       <a href="#">Account</a>
 *     </nav>
 *   </kakao-aside-menu>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *   label         Accessible name / visible title of the panel.
 *                 Default "Menu".
 *   position      "left" (default) or "right". The side the panel slides in
 *                 from; the body is pushed to the opposite side.
 *   width         Panel width as a CSS length, e.g. "320px" or "18rem".
 *                 Default 280px. Also settable via the --kakao-aside-width
 *                 custom property; the attribute wins while present.
 *   open          Boolean. Present = panel open, absent = closed. Observed,
 *                 so el.setAttribute('open', '') / el.toggleAttribute('open')
 *                 both work. The component keeps it in sync when the user
 *                 clicks the open/close buttons or presses Escape.
 *   no-open-button
 *                 Hide the built-in hamburger button (when the page provides
 *                 its own trigger and calls .open() / sets `open`).
 *   list-data     Optional JSON array of nav items, e.g.
 *                 [{"value":"home","label":"Home","disabled":false}, …]
 *                 When present, the menu renders a vertical nav list above
 *                 the slotted content and manages the current item itself.
 *   selected      Value of the nav item marked as current (aria-current).
 *                 Updated on pick.
 *
 * Methods:
 *   open()        Open the panel.
 *   close()       Close the panel.
 *   toggle()      Toggle the panel.
 *
 * Events (both bubble and are composed):
 *   aside-change  detail: { open: boolean }
 *   aside-select  detail: { value, item } — a nav item was picked
 *
 * ----------------------------------------------------------------------------
 * THEMING
 * ----------------------------------------------------------------------------
 * Every --kakao-aside-* property in the settings block of aside-menu.css can
 * be set on <kakao-aside-menu> or any ancestor. The defaults live in that
 * block: change them on construction.html.
 *
 * The push effect works on the page itself, so aside-menu.css must be loaded
 * (like the button and number-input, the panel is light DOM). While a menu is
 * open, <html> carries data-kakao-aside-open="<position>"; the stylesheet
 * gives the <body> a matching animated margin.
 */

(function () {
  'use strict';

  const TAG_NAME = 'kakao-aside-menu';
  if (customElements.get(TAG_NAME)) {
    return;
  }

  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  class KakaoAsideMenu extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'label', 'position', 'width', 'no-open-button', 'list-data', 'selected'];
    }

    constructor() {
      super();
      this._built = false;
      this._returnFocus = null;
      this._closeTimer = null;
      this._onKeydown = this._onKeydown.bind(this);
    }

    /* ---------------------------- Lifecycle ---------------------------- */

    connectedCallback() {
      this._ensureDom();
      this._sync();
      this._renderList();
      if (this.hasAttribute('open')) {
        // The attribute may already be set in the HTML: open without stealing focus.
        this._apply(true, { focus: false });
      }
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this._onKeydown);
      if (this._mo) this._mo.disconnect();
      clearTimeout(this._closeTimer);
      document.documentElement.removeAttribute('data-kakao-aside-open');
      document.documentElement.style.removeProperty('--kakao-aside-push');
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this._built || oldValue === newValue) {
        return;
      }
      if (name === 'open') {
        this._apply(this.hasAttribute('open'), { focus: true });
      } else if (name === 'list-data' || name === 'selected') {
        this._renderList();
      } else {
        this._sync();
        if (this.hasAttribute('open')) {
          this._apply(true, { focus: false }); // width/position changed mid-flight
        }
      }
    }

    /* ------------------------------- DOM ------------------------------- */

    _ensureDom() {
      if (this._built) {
        return;
      }
      this._built = true;

      // Hamburger trigger (stays in place while the panel is hidden).
      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'kakao-aside-open';
      openBtn.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path d="M4 6h16M4 12h16M4 18h16"/></svg>';
      openBtn.addEventListener('click', () => this.toggle());
      this._openBtn = openBtn;

      // Sliding panel with a header (title + close button) and a content slot.
      const panel = document.createElement('div');
      panel.className = 'kakao-aside-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'false');
      panel.innerHTML =
        '<div class="kakao-aside-head">' +
        '<span class="kakao-aside-title"></span>' +
        // A round <kakao-button>; CSS puts it in the panel's inner corner.
        '<kakao-button class="kakao-aside-close" variant="ghost" size="sm"' +
        ' label="\u2715" aria-label="Close menu"></kakao-button>' +
        '</div>' +
        '<div class="kakao-aside-content">' +
        '<nav class="kakao-aside-navlist"></nav>' +
        '</div>';
      this._panel = panel;

      this._closeBtn = panel.querySelector('.kakao-aside-close');
      this._titleEl = panel.querySelector('.kakao-aside-title');
      this._closeBtn.addEventListener('kakao-button-action', () => this.close());

      this._navList = panel.querySelector('.kakao-aside-navlist');
      this._navList.addEventListener('click', (e) => {
        const item = e.target.closest('.kakao-aside-navitem');
        if (!item || item.disabled) return;
        this.setAttribute('selected', item.dataset.value);
        this._dispatch('aside-select', { value: item.dataset.value, item });
      });

      this.append(openBtn, panel);

      // Light DOM: a <slot> only works inside a shadow root, so the user's
      // markup is moved into the panel's content area — now and whenever
      // more is added later.
      this._mo = new MutationObserver(() => this._collectChildren());
      this._mo.observe(this, { childList: true });
      this._collectChildren();

      this._sync();
    }

    /* ------------------------------ Sync ------------------------------- */

    _sync() {
      if (!this._built) {
        return;
      }
      const label = this.getAttribute('label') || 'Menu';
      const position = this.getAttribute('position') === 'right' ? 'right' : 'left';

      this._openBtn.setAttribute('aria-label', 'Open ' + label.toLowerCase());
      this._openBtn.setAttribute('aria-expanded', String(this.hasAttribute('open')));
      this._openBtn.hidden = this.hasAttribute('no-open-button');
      this._titleEl.textContent = label;
      this._panel.setAttribute('aria-label', label);
      this._panel.dataset.position = position;

      if (this.hasAttribute('width')) {
        this.style.setProperty('--kakao-aside-width', this.getAttribute('width'));
      } else {
        this.style.removeProperty('--kakao-aside-width');
      }
    }

    /* ------------------------ Slotted content ---------------------------- */

    /** Move the user's children into the panel's content area. */
    _collectChildren() {
      if (!this._built) return;
      const content = this._panel.querySelector('.kakao-aside-content');
      Array.from(this.childNodes).forEach((node) => {
        if (node === this._openBtn || node === this._panel) return;
        if (node.nodeType === 3 && !node.textContent.trim()) return; // whitespace
        content.appendChild(node);
      });
    }

    /* --------------------------- Nav list ------------------------------- */

    /** Render the built-in nav list from the list-data attribute. */
    _renderList() {
      if (!this._built) return;
      const nav = this._navList;
      let rows = [];
      const raw = this.getAttribute('list-data');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) rows = parsed;
        } catch (err) {
          console.warn('<kakao-aside-menu> failed to parse list-data as JSON:', err);
        }
      }
      nav.toggleAttribute('hidden', rows.length === 0);
      nav.setAttribute('aria-label', this.getAttribute('label') || 'Menu');
      nav.textContent = '';
      const selected = this.getAttribute('selected');
      rows.forEach((it) => {
        const value = String(it.value != null ? it.value : it.label);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'kakao-aside-navitem';
        btn.dataset.value = value;
        btn.textContent = it.label != null ? String(it.label) : value;
        if (it.disabled) btn.disabled = true;
        if (value === selected) btn.setAttribute('aria-current', 'true');
        nav.appendChild(btn);
      });
    }

    /* ---------------------------- Open state ---------------------------- */

    get open() {
      return this.hasAttribute('open');
    }

    open() {
      this.setAttribute('open', '');
    }

    close() {
      this.removeAttribute('open');
    }

    toggle() {
      this.hasAttribute('open') ? this.close() : this.open();
    }

    /**
     * Apply the open state: slide the panel, push the body, manage focus.
     * @param {boolean} on
     * @param {{ focus?: boolean }} [options]
     */
    _apply(on, options = {}) {
      const position = this.getAttribute('position') === 'right' ? 'right' : 'left';
      const root = document.documentElement;

      if (on) {
        clearTimeout(this._closeTimer);
        // Only one menu may own the push at a time.
        document.querySelectorAll(TAG_NAME + '[open]').forEach((other) => {
          if (other !== this) {
            other.removeAttribute('open');
          }
        });

        const width = getComputedStyle(this)
          .getPropertyValue('--kakao-aside-width')
          .trim() || '280px';
        root.style.setProperty('--kakao-aside-push', width);
        root.setAttribute('data-kakao-aside-open', position);
        this._panel.removeAttribute('aria-hidden');
        this._panel.removeAttribute('inert');
        document.addEventListener('keydown', this._onKeydown);

        if (options.focus) {
          this._returnFocus = document.activeElement;
          this._closeBtn.focus();
        }
      } else {
        clearTimeout(this._closeTimer);
        if (root.getAttribute('data-kakao-aside-open')) {
          // Pull the body back to its origin: keep the html attribute so the
          // pushed-body styles (and their transition) still apply, and animate
          // the push to zero. Only when the slide is done remove everything.
          root.style.setProperty('--kakao-aside-push', '0px');
          const duration =
            parseFloat(getComputedStyle(this).getPropertyValue('--kakao-aside-duration')) || 320;
          this._closeTimer = setTimeout(() => {
            root.removeAttribute('data-kakao-aside-open');
            root.style.removeProperty('--kakao-aside-push');
          }, duration + 50);
        }
        this._panel.setAttribute('aria-hidden', 'true');
        this._panel.setAttribute('inert', '');
        document.removeEventListener('keydown', this._onKeydown);

        if (options.focus) {
          if (this._returnFocus && document.contains(this._returnFocus)) {
            this._returnFocus.focus();
          } else {
            this._openBtn.focus();
          }
          this._returnFocus = null;
        }
      }

      this._openBtn.setAttribute('aria-expanded', String(on));
      this._dispatch('aside-change', { open: on });
    }

    _isOpenOnHtml() {
      const root = document.documentElement;
      return (
        root.getAttribute('data-kakao-aside-open') !== null &&
        this.hasAttribute('open')
      );
    }

    /* ---------------------------- Keyboard ----------------------------- */

    _onKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        return;
      }
      if (e.key === 'Tab') {
        this._trapTab(e);
      }
    }

    /** Keep Tab (and Shift+Tab) inside the open panel. */
    _trapTab(e) {
      const focusables = Array.from(this._panel.querySelectorAll(FOCUSABLE))
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!focusables.length) {
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = this._panel.contains(document.activeElement)
        ? document.activeElement
        : null;

      if (e.shiftKey && (active === first || !active)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!active) {
        e.preventDefault();
        first.focus();
      }
    }

    /* ----------------------------- Events ------------------------------ */

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
  }

  customElements.define(TAG_NAME, KakaoAsideMenu);
})();
