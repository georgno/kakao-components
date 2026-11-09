/**
 * <kakao-header-bar>
 * ============================================================================
 * The page's top bar: a sticky <header> (the banner landmark) with a start,
 * a centre (title) and an end region, plus an optional navigation region.
 * Transparent at the top of the page; once the page is scrolled, a translucent
 * page-coloured background with a backdrop blur and a hairline below it.
 * Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="header-bar.js" defer><\/script>
 *
 *   <body>
 *     <kakao-header-bar>
 *       <kakao-aside-menu slot="start" label="Menu">…</kakao-aside-menu>
 *       <strong>Library</strong>                         (default slot: the title)
 *       <a slot="nav" href="/films">Films</a>
 *       <a slot="nav" href="/series">Series</a>
 *       <kakao-theme-switch slot="end"></kakao-theme-switch>
 *     </kakao-header-bar>
 *     <main>…</main>
 *   </body>
 *
 * Put it first in <body>: it is sticky (top 0) within its parent, so it
 * sticks for the whole page only as a direct child of <body>. Page CSS on the
 * element wins over its own, e.g. kakao-header-bar { position: relative } for
 * a preview that should not stick.
 *
 * ----------------------------------------------------------------------------
 * SLOTS
 * ----------------------------------------------------------------------------
 *  start     At the inline start (left): a menu button, a logo.
 *  (default) The title, centred in the bar while there is room.
 *  nav       Links, wrapped in a <nav> after the title. Without children no
 *            <nav> landmark is exposed.
 *  end       At the inline end (right): theme switch, settings, account.
 *  Empty regions take no space.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  nav-label        Accessible name of the navigation region. Default "Main".
 *  scrolled         Set while the window is scrolled down (the bar toggles it).
 *  no-scroll-watch  Don't watch the window: the page sets / removes scrolled
 *                   itself (previews, pages that scroll inside a container).
 *
 * The scroll watch is one passive window scroll listener, coalesced to one
 * check per frame; the attribute only changes when the state does.
 *
 * Links that don't fit scroll sideways; the nav's edge fades on each side
 * where there is more to scroll (none when everything fits).
 *
 * The page bar (a bar that is a direct child of <body>) publishes its
 * rendered height as --kakao-header-bar-rendered-height (px) on the root
 * element, so page CSS can offset anchors and sticky content below it:
 *   html { scroll-padding-top: var(--kakao-header-bar-rendered-height, 0px); }
 * It is kept current while the bar resizes and removed with the bar.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-header-bar-bg / -line                       at the top of the page
 *  --kakao-header-bar-scrolled-bg / -scrolled-opacity / -scrolled-line
 *  --kakao-header-bar-blur / -saturate                 the frosted look
 *  --kakao-header-bar-color / -height / -padding-x / -padding-y / -gap
 *  --kakao-header-bar-title-size / -title-weight / -z-index / -duration
 *  --kakao-header-bar-nav-fade                         edge fade of overflowing links
 *
 * Solid instead of translucent under prefers-reduced-transparency and where
 * backdrop-filter is not supported; no transition under reduced motion.
 *
 * Parts: bar, surface, start, center, title, nav, end.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-header-bar';
  if (customElements.get(TAG_NAME)) return;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-header-bar- (written by construction.html, edit there) */
        --_bg: var(--kakao-header-bar-bg, transparent);
        --_line: var(--kakao-header-bar-line, transparent);
        --_scrolled-bg: var(--kakao-header-bar-scrolled-bg, var(--kakao-color-page, #f6f7f9));
        --_scrolled-opacity: var(--kakao-header-bar-scrolled-opacity, 78%);
        --_scrolled-line: var(--kakao-header-bar-scrolled-line, var(--kakao-color-line, #e5e7eb));
        --_blur: var(--kakao-header-bar-blur, 14px);
        --_saturate: var(--kakao-header-bar-saturate, 1.5);
        --_color: var(--kakao-header-bar-color, var(--kakao-color-text, #18181b));
        --_height: var(--kakao-header-bar-height, 4rem);
        --_padding-x: var(--kakao-header-bar-padding-x, 1.25rem);
        --_padding-y: var(--kakao-header-bar-padding-y, 0.5rem);
        --_gap: var(--kakao-header-bar-gap, 0.5rem);
        --_title-size: var(--kakao-header-bar-title-size, 1rem);
        --_title-weight: var(--kakao-header-bar-title-weight, 600);
        --_z-index: var(--kakao-header-bar-z-index, 30);
        --_duration: var(--kakao-header-bar-duration, 200ms);
        --_nav-fade: var(--kakao-header-bar-nav-fade, var(--kakao-scroll-fade, 1.5rem));
        /* @kakao-settings:end */
        /* Only position and layer here: a filter, transform or backdrop-filter
           on the host or the <header> would make them the containing block of
           fixed-position slotted content (an aside menu's panel). The frosted
           background lives on .surface, which holds no slot. */
        position: sticky;
        top: 0;
        z-index: var(--_z-index);
        display: block;
        color: var(--_color);
      }
      :host([hidden]) { display: none; }

      header {
        position: relative;
        box-sizing: border-box;
        display: grid;
        /* Equal outer columns keep the title centred; each is at least as wide
           as its content, so tools never overlap when space is tight (the
           title then gives way first). */
        grid-template-columns: minmax(max-content, 1fr) minmax(0, auto) minmax(max-content, 1fr);
        align-items: center;
        gap: var(--_gap);
        min-height: var(--_height);
        padding: var(--_padding-y) var(--_padding-x);
      }

      .surface {
        position: absolute;
        inset: 0;
        z-index: -1;
        background: var(--_bg);
        border-bottom: 1px solid var(--_line);
        pointer-events: none;
        transition:
          background-color var(--_duration) var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)),
          border-color var(--_duration) var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1));
      }
      :host([scrolled]) .surface {
        background: color-mix(in srgb, var(--_scrolled-bg) var(--_scrolled-opacity), transparent);
        border-bottom-color: var(--_scrolled-line);
        -webkit-backdrop-filter: blur(var(--_blur)) saturate(var(--_saturate));
        backdrop-filter: blur(var(--_blur)) saturate(var(--_saturate));
      }
      /* The <header> is its own stacking context so the surface (z -1) stays
         inside it, behind the regions and above the page. */
      header { isolation: isolate; }

      .region { display: flex; align-items: center; gap: var(--_gap); min-width: 0; }
      .start { justify-content: flex-start; }
      .end { justify-content: flex-end; }
      .center {
        justify-content: center;
        font-size: var(--_title-size);
        font-weight: var(--_title-weight);
        white-space: nowrap;
      }
      /* A long title is cut at its region's edge. */
      .title { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
      .title[hidden] { display: none; }
      /* Links that don't fit scroll sideways instead of being cut off; the
         padding leaves room for their focus rings inside the scroll box. */
      nav {
        display: flex;
        align-items: center;
        gap: var(--_gap);
        min-width: 0;
        margin: -4px 0;
        padding: 4px;
        overflow-x: auto;
        scrollbar-width: none;
        font-weight: 400;
      }
      nav::-webkit-scrollbar { display: none; }
      /* More links past an edge: that edge fades out (set by the script, in
         physical sides, so it holds in right-to-left too). */
      nav[data-more-left] {
        -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--_nav-fade));
        mask-image: linear-gradient(to right, transparent, #000 var(--_nav-fade));
      }
      nav[data-more-right] {
        -webkit-mask-image: linear-gradient(to left, transparent, #000 var(--_nav-fade));
        mask-image: linear-gradient(to left, transparent, #000 var(--_nav-fade));
      }
      nav[data-more-left][data-more-right] {
        -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--_nav-fade), #000 calc(100% - var(--_nav-fade)), transparent);
        mask-image: linear-gradient(to right, transparent, #000 var(--_nav-fade), #000 calc(100% - var(--_nav-fade)), transparent);
      }
      nav[hidden] { display: none; }

      /* Solid where translucency is unwanted or the blur is unavailable. */
      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        :host([scrolled]) .surface { background: var(--_scrolled-bg); }
      }
      @media (prefers-reduced-transparency: reduce) {
        :host([scrolled]) .surface {
          background: var(--_scrolled-bg);
          -webkit-backdrop-filter: none;
          backdrop-filter: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .surface { transition: none; }
      }
      @media (forced-colors: active) {
        :host([scrolled]) .surface {
          background: Canvas;
          border-bottom-color: CanvasText;
          backdrop-filter: none;
        }
      }
    </style>
    <header part="bar">
      <div class="surface" part="surface"></div>
      <div class="region start" part="start"><slot name="start"></slot></div>
      <div class="region center" part="center"><span class="title" part="title"><slot></slot></span><nav part="nav" hidden><slot name="nav"></slot></nav></div>
      <div class="region end" part="end"><slot name="end"></slot></div>
    </header>
  `;

  class KakaoHeaderBar extends HTMLElement {
    static get observedAttributes() {
      return ['nav-label', 'no-scroll-watch'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._nav = shadow.querySelector('nav');
      this._navSlot = shadow.querySelector('slot[name="nav"]');
      this._title = shadow.querySelector('.title');
      this._titleSlot = this._title.querySelector('slot');
      this._navSlot.addEventListener('slotchange', () => { this._syncNav(); this._queueFade(); });
      this._titleSlot.addEventListener('slotchange', () => this._syncNav());
      this._fadeFrame = 0;
      this._queueFade = () => {
        if (this._fadeFrame) return;
        this._fadeFrame = requestAnimationFrame(() => {
          this._fadeFrame = 0;
          this._syncFade();
        });
      };
      this._nav.addEventListener('scroll', this._queueFade, { passive: true });
      this._sizes = typeof ResizeObserver === 'function' ? new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === this._nav) this._syncFade();
          else this._publishHeight();
        }
      }) : null;
      this._frame = 0;
      this._onScroll = () => {
        if (this._frame) return;
        this._frame = requestAnimationFrame(() => {
          this._frame = 0;
          this._check();
        });
      };
    }

    connectedCallback() {
      this._syncNav();
      this._watch();
      // The page bar (a direct child of <body>) tells the page its height.
      this._isPageBar = this.parentElement === document.body;
      if (this._sizes) {
        this._sizes.observe(this._nav);
        if (this._isPageBar) this._sizes.observe(this);
      }
    }

    disconnectedCallback() {
      this._unwatch();
      if (this._sizes) this._sizes.disconnect();
      cancelAnimationFrame(this._fadeFrame);
      this._fadeFrame = 0;
      if (this._isPageBar) document.documentElement.style.removeProperty('--kakao-header-bar-rendered-height');
      this._isPageBar = false;
    }

    attributeChangedCallback(name) {
      if (name === 'nav-label') this._syncNav();
      if (name === 'no-scroll-watch' && this.isConnected) this._watch();
    }

    /** Empty regions take no space: no gap for a missing title, no empty nav landmark. */
    _syncNav() {
      const filled = (slot) => slot.assignedNodes().some((n) => n.nodeType === 1 || n.textContent.trim());
      this._title.hidden = !filled(this._titleSlot);
      this._nav.hidden = !filled(this._navSlot);
      this._nav.setAttribute('aria-label', this.getAttribute('nav-label') || 'Main');
    }

    /** Fade the nav's edge on each side with more to scroll; attributes change only when the state does. */
    _syncFade() {
      const nav = this._nav;
      const max = nav.scrollWidth - nav.clientWidth;
      let left = false;
      let right = false;
      if (!nav.hidden && max > 1) {
        // From the left edge, 0..max: right-to-left scrollLeft runs from 0 down to -max.
        const x = getComputedStyle(nav).direction === 'rtl' ? max + nav.scrollLeft : nav.scrollLeft;
        left = x > 1;
        right = x < max - 1;
      }
      if (left !== nav.hasAttribute('data-more-left')) nav.toggleAttribute('data-more-left', left);
      if (right !== nav.hasAttribute('data-more-right')) nav.toggleAttribute('data-more-right', right);
    }

    _publishHeight() {
      if (!this._isPageBar) return;
      const height = this.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--kakao-header-bar-rendered-height', `${Math.round(height * 100) / 100}px`);
    }

    _watch() {
      this._unwatch();
      if (this.hasAttribute('no-scroll-watch')) return;
      window.addEventListener('scroll', this._onScroll, { passive: true });
      this._watching = true;
      this._check();
    }

    _unwatch() {
      if (this._watching) window.removeEventListener('scroll', this._onScroll);
      this._watching = false;
      cancelAnimationFrame(this._frame);
      this._frame = 0;
    }

    _check() {
      const scrolled = window.scrollY > 0;
      if (scrolled !== this.hasAttribute('scrolled')) this.toggleAttribute('scrolled', scrolled);
    }
  }

  window.KakaoHeaderBar = KakaoHeaderBar;
  customElements.define(TAG_NAME, KakaoHeaderBar);
})();
