/**
 * <kakao-toc>
 * ============================================================================
 * "On this page": a table of contents for a long page such as a blog article,
 * with a built-in scrollspy. It lists the headings of a target (or links you
 * write), marks the section the reader is in and scrolls there smoothly.
 * Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     toc.js
 *  css        none
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="toc.js" defer><\/script>
 *
 *   <aside><kakao-toc for="post" sticky></kakao-toc></aside>
 *   <article id="post"><h2>Intro</h2>…<h3>Setup</h3>…<h2>Outro</h2>…</article>
 *
 *   <kakao-toc list-data='[{"title": "Intro", "href": "#intro",
 *     "children": [{"title": "Setup", "id": "setup"}]}]'></kakao-toc>
 *
 *   <kakao-toc>                                 (hand-written, also the
 *     <ol><li><a href="#intro">Intro</a></li></ol>   no-script fallback)
 *   </kakao-toc>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  for            Where the headings are: an element id, else a CSS selector.
 *                 Default: the page's <main>, else <body>.
 *  levels         Heading levels to list: a range "2-3" (default) or a list "2,4".
 *  headings       A CSS selector for the headings instead of levels, e.g.
 *                 ".component-head h2". Their level comes from the tag (h1-h6)
 *                 or aria-level, else 2.
 *                 Left out: headings with or inside [data-toc-ignore], inside
 *                 the toc, and headings that are not rendered (closed dialog,
 *                 hidden). data-toc-title on a heading sets its entry text.
 *                 A listed heading without an id gets one from its text
 *                 ("Café & crème" -> "cafe-creme", "-2" for a duplicate).
 *  list-data      JSON array of hand-written entries (never "data"):
 *                 { "title", "href" | "id", "children" } or ["Title", "#id"].
 *                 Wins over the headings. Without it, a nested <ul>/<ol> of
 *                 links inside the element is read instead.
 *  label          Accessible name of the navigation landmark.
 *                 Default KakaoToc.texts.label ("On this page").
 *  heading        Visible title above the list (none by default).
 *  heading-level  Its heading level, default 2.
 *  offset         Pixels from the top of the viewport where a section starts
 *                 counting as current (and where a jump puts its heading).
 *                 Default: the page bar's height (--kakao-header-bar-rendered-height)
 *                 plus 16px, plus the toc's own bar when it is sticky and folded.
 *  sticky         Boolean. Sticks below the page bar (in a sidebar); a list
 *                 taller than the viewport scrolls inside, keeping the active
 *                 entry in view.
 *  nested         "all" (default) shows every level; "active" shows deeper
 *                 levels only under the active top-level entry.
 *  collapse       "never" (default), "always" or "auto": fold the list behind
 *                 a toggle that shows the title and the current section.
 *                 "auto" folds while the viewport is narrower than collapse-below.
 *  collapse-below CSS length for collapse="auto". Default "48rem".
 *  data-folded    Set by the component while the list is folded (for page CSS).
 *  force          A boolean attribute read only by the style checker
 *                 (tools/style-check.js). It marks this placement as a
 *                 deliberate exception to the style rules and has no effect
 *                 in the browser.
 *
 * PROPERTIES: items (get / set, same shapes as list-data); activeId (get / set:
 *             setting it marks an entry by hand until the reader scrolls).
 * METHODS:    refresh() reads the headings again; scrollToId(id) goes there.
 * KakaoToc.texts = { label } changes the default words for every toc.
 *
 * ----------------------------------------------------------------------------
 * BEHAVIOUR
 * ----------------------------------------------------------------------------
 * The current entry is the last listed heading whose top has passed the
 * offset line; at the bottom of the page the last one. It carries
 * aria-current="location". Headings added, removed or retitled in the target
 * rebuild the list (MutationObserver); hash navigation and back / forward
 * update the current entry. A click scrolls smoothly (instantly under
 * reduced motion), pushes the hash without a jump and moves focus to the
 * heading. Folded: Escape or picking an entry closes the list.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  toc-change   { id, title, level, previousId }  the current section changed
 *               (id null before the first section).
 *  Trigger "section-change" { id, title } through KakaoComponents
 *  (shared/component-api.js), registered for discovery.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-toc-text / -hover / -hover-bg / -active / -marker / -track / -title
 *  --kakao-toc-bg / -focus
 *  --kakao-toc-font-size / -title-size / -active-weight / -indent / -gap
 *  --kakao-toc-padding-x / -padding-y / -radius / -marker-width / -marker-radius
 *  --kakao-toc-marker-stretch-width (while moving) / -sticky-gap
 *  --kakao-toc-anim-duration / -anim-easing (the marker's move)
 *  --kakao-toc-panel-max-height
 *
 * Parts: nav, title, toggle, list, link, active, marker.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-toc';
  if (customElements.get(TAG_NAME)) return;

  const DEFAULT_TEXTS = Object.freeze({ label: 'On this page' });
  let texts = { ...DEFAULT_TEXTS };

  const CHEVRON = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3.5 6 4.5 4.5L12.5 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-toc- (written by construction.html, edit there) */
        --_text: var(--kakao-toc-text, var(--kakao-color-muted, #62626c));
        --_hover: var(--kakao-toc-hover, var(--kakao-color-text, #18181b));
        --_hover-bg: var(--kakao-toc-hover-bg, var(--kakao-color-subtle, #f0f0f1));
        --_active: var(--kakao-toc-active, var(--kakao-color-text, #18181b));
        --_marker: var(--kakao-toc-marker, var(--kakao-color-primary, #4f46e5));
        --_track: var(--kakao-toc-track, var(--kakao-color-line, #e5e7eb));
        --_title: var(--kakao-toc-title, var(--kakao-color-text, #18181b));
        --_bg: var(--kakao-toc-bg, var(--kakao-color-page, #f6f7f9));
        --_focus: var(--kakao-toc-focus, var(--kakao-color-focus, #2563eb));
        --_font-size: var(--kakao-toc-font-size, 0.875rem);
        --_title-size: var(--kakao-toc-title-size, 0.875rem);
        --_active-weight: var(--kakao-toc-active-weight, 600);
        --_indent: var(--kakao-toc-indent, 0.875rem);
        --_gap: var(--kakao-toc-gap, 0.125rem);
        --_padding-x: var(--kakao-toc-padding-x, 0.75rem);
        --_padding-y: var(--kakao-toc-padding-y, 0.3125rem);
        --_radius: var(--kakao-toc-radius, var(--kakao-radius-sm, 6px));
        --_marker-width: var(--kakao-toc-marker-width, 5px);
        --_marker-radius: var(--kakao-toc-marker-radius, var(--kakao-radius-pill, 999px));
        --_marker-stretch-width: var(--kakao-toc-marker-stretch-width, 3px);
        --_anim-duration: var(--kakao-toc-anim-duration, 200ms);
        --_anim-easing: var(--kakao-toc-anim-easing, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        --_sticky-gap: var(--kakao-toc-sticky-gap, 1rem);
        --_panel-max-height: var(--kakao-toc-panel-max-height, 60vh);
        /* @kakao-settings:end */
        --_top: calc(var(--kakao-header-bar-rendered-height, 0px) + var(--_sticky-gap));
        display: block;
        min-width: 0;
        font-size: var(--_font-size);
        line-height: 1.4;
        box-sizing: border-box;
      }
      :host([hidden]) { display: none; }
      :host([sticky]) {
        position: sticky;
        top: var(--_top);
        z-index: 2;
        max-height: calc(100vh - var(--_top) - var(--_sticky-gap));
        overflow: auto;
        overscroll-behavior: contain;
      }
      :host([sticky][data-folded]) {
        top: var(--kakao-header-bar-rendered-height, 0px);
        max-height: none;
        overflow: visible;
      }

      nav { display: block; }
      .title {
        margin: 0 0 0.5rem;
        padding-inline-start: calc(var(--_padding-x) + var(--_marker-width));
        font-size: var(--_title-size);
        font-weight: 600;
        color: var(--_title);
      }
      .title[hidden] { display: none; }

      ol {
        margin: 0;
        padding: 0;
        list-style: none;
      }
      /* Room for the part of the marker left of the track, so a scrolling
         (sticky) toc does not clip it. The marker overhangs the 1px track by
         (width - 1px) / 2 on each side: keep the width odd (3px, 5px) so that is
         whole pixels and the bar sits exactly centred on the line. */
      .rail { position: relative; padding-inline-start: calc((var(--_marker-width) - 1px) / 2); }
      .list { border-inline-start: 1px solid var(--_track); }

      /* The current-entry marker: one rounded bar on the track. On a move it
         stretches: the leading edge reaches the new entry first, the trailing
         edge follows, so for a moment it spans both (and thins to
         --kakao-toc-marker-stretch-width), then it is the new entry's size
         again (no overshoot, no bounce). Place, height and the move are set
         from script. */
      .marker {
        position: absolute;
        top: 0;
        inset-inline-start: 0;
        z-index: 1;
        width: var(--_marker-width);
        height: var(--_marker-h, 0px);
        border-radius: var(--_marker-radius);
        background: var(--_marker);
        transform: translateY(var(--_marker-y, 0px));
        opacity: 0;
        pointer-events: none;
      }
      .marker.is-on { opacity: 1; }
      .marker.is-moving { transition: opacity 150ms var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)); }
      li { margin: 0; }
      li + li, ol ol { margin-top: var(--_gap); }
      ol[hidden] { display: none; }

      .link {
        display: block;
        margin-inline-start: -1px;
        padding: var(--_padding-y) var(--_padding-x);
        padding-inline-start: calc(var(--_padding-x) + (var(--_marker-width) + 1px) / 2 + var(--depth, 0) * var(--_indent));
        border-start-end-radius: var(--_radius);
        border-end-end-radius: var(--_radius);
        color: var(--_text);
        text-decoration: none;
        overflow-wrap: anywhere;
        transition: color 150ms var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)),
                    background-color 150ms var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1));
      }
      .link:hover { color: var(--_hover); background: var(--_hover-bg); }
      .link:focus-visible { outline: 2px solid var(--_focus); outline-offset: -2px; }
      .link[aria-current="location"] {
        color: var(--_active);
        font-weight: var(--_active-weight);
      }

      /* Folded: a toggle that shows the title and the current section. */
      .toggle {
        display: none;
        width: 100%;
        min-height: 2.75rem;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem var(--_padding-x);
        border: 0;
        border-radius: var(--_radius);
        background: transparent;
        color: var(--_title);
        font: inherit;
        text-align: start;
        cursor: pointer;
      }
      .toggle:hover { background: var(--_hover-bg); }
      .toggle:focus-visible { outline: 2px solid var(--_focus); outline-offset: -2px; }
      .toggle-title { flex: none; font-weight: 600; }
      .toggle-current {
        flex: 1 1 auto;
        min-width: 0;
        color: var(--_text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .toggle-current:not(:empty)::before { content: "· "; }
      .toggle svg {
        flex: none;
        width: 1rem;
        height: 1rem;
        color: var(--_text);
        transition: transform 150ms var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1));
      }
      .toggle[aria-expanded="true"] svg { transform: rotate(180deg); }

      .is-folded .toggle { display: flex; }
      .is-folded .title { display: none; }
      :host([data-folded]) {
        background: var(--_bg);
        border-bottom: 1px solid var(--_track);
      }
      .is-folded .panel {
        max-height: var(--_panel-max-height);
        overflow: auto;
        overscroll-behavior: contain;
        padding: 0.25rem 0 0.75rem;
      }
      .is-folded .panel[hidden] { display: none; }

      @media (prefers-reduced-motion: reduce) {
        .link, .toggle svg, .marker.is-moving { transition: none; }
      }
      @media (forced-colors: active) {
        .marker { background: Highlight; }
        .link:focus-visible, .toggle:focus-visible { outline-color: Highlight; }
        .list { border-inline-start-color: CanvasText; }
      }
    </style>
    <nav part="nav">
      <div class="title" part="title" role="heading" aria-level="2" hidden></div>
      <button class="toggle" part="toggle" type="button" aria-expanded="false" aria-controls="panel">
        <span class="toggle-title"></span><span class="toggle-current"></span>${CHEVRON}
      </button>
      <div class="panel" id="panel"><div class="rail"><span class="marker" part="marker" aria-hidden="true"></span><ol class="list" part="list"></ol></div></div>
    </nav>
  `;

  /* ---------------------------------------------------------------------- */

  const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

  function slugify(text) {
    const slug = clean(text)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || 'section';
  }

  function uniqueId(base) {
    let id = base;
    for (let n = 2; document.getElementById(id); n += 1) id = `${base}-${n}`;
    return id;
  }

  function idFromHref(href) {
    if (!href || href[0] !== '#' || href.length < 2) return null;
    try { return decodeURIComponent(href.slice(1)); } catch (_) { return href.slice(1); }
  }

  /** Normalises a hand-written entry: { title, href | id, children } or ["Title", "#id"]. */
  function toEntry(raw) {
    let title = '';
    let href = '';
    let children = [];
    if (Array.isArray(raw)) {
      title = raw[0];
      href = raw[1] == null ? '' : String(raw[1]);
      if (Array.isArray(raw[2])) children = raw[2];
    } else if (raw && typeof raw === 'object') {
      title = raw.title;
      href = raw.href ? String(raw.href) : raw.id ? `#${raw.id}` : '';
      if (Array.isArray(raw.children)) children = raw.children;
    } else {
      title = raw;
    }
    return { title: clean(title), href, id: idFromHref(href), children: children.map(toEntry).filter((e) => e.title) };
  }

  /** Reads a nested <ul>/<ol> of links as entries. */
  function fromList(list) {
    return Array.from(list.children).filter((li) => li.tagName === 'LI').map((li) => {
      const a = li.querySelector(':scope > a');
      const sub = li.querySelector(':scope > ul, :scope > ol');
      const title = a ? a.textContent : Array.from(li.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ');
      const href = a ? a.getAttribute('href') || '' : '';
      return { title: clean(title), href, id: idFromHref(href), children: sub ? fromList(sub) : [] };
    }).filter((e) => e.title);
  }

  function parseLevels(value) {
    const out = new Set();
    String(value || '2-3').split(',').forEach((part) => {
      const m = part.trim().match(/^([1-6])(?:\s*-\s*([1-6]))?$/);
      if (!m) return;
      const a = Number(m[1]);
      const b = m[2] ? Number(m[2]) : a;
      for (let l = Math.min(a, b); l <= Math.max(a, b); l += 1) out.add(l);
    });
    return out.size ? [...out].sort() : [2, 3];
  }

  function headingLevel(el) {
    const m = el.tagName.match(/^H([1-6])$/);
    if (m) return Number(m[1]);
    const aria = Number(el.getAttribute('aria-level'));
    return aria >= 1 ? aria : 2;
  }

  const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const instances = new Set();

  /* ---------------------------------------------------------------------- */

  class KakaoToc extends HTMLElement {
    static get texts() { return { ...texts }; }
    static set texts(value) {
      texts = { ...DEFAULT_TEXTS, ...(value || {}) };
      instances.forEach((el) => el._renderChrome());
    }

    static get observedAttributes() {
      return ['for', 'levels', 'headings', 'list-data', 'label', 'heading', 'heading-level', 'offset', 'nested', 'collapse', 'collapse-below'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._nav = shadow.querySelector('nav');
      this._title = shadow.querySelector('.title');
      this._toggle = shadow.querySelector('.toggle');
      this._toggleTitle = shadow.querySelector('.toggle-title');
      this._toggleCurrent = shadow.querySelector('.toggle-current');
      this._panel = shadow.querySelector('.panel');
      this._list = shadow.querySelector('.list');
      this._rail = shadow.querySelector('.rail');
      this._marker = shadow.querySelector('.marker');
      // Entries can change height (wrapping, fonts, unfolding): keep the marker on its entry.
      if (typeof ResizeObserver !== 'undefined') {
        this._railObserver = new ResizeObserver(() => this._placeMarker(null));
        this._railObserver.observe(this._rail);
      }

      this._items = null;      // hand-written entries from the items property
      this._tree = [];         // entries as rendered
      this._flat = [];         // { id, title, level, link, target, top } in order
      this._signature = '';
      this._activeId = null;
      this._lock = null;       // { id, settled } while a click / hash jump owns the active entry
      this._folded = false;
      this._open = false;

      this._frame = 0;
      this._buildFrame = 0;
      this._settleTimer = 0;

      this._onScroll = () => this._onUserScroll();
      this._onResize = () => { this._lock = null; this._schedule(); };
      this._onHash = () => this._fromHash(true);
      this._onPop = () => { this._lock = null; this._schedule(); };
      this._onDocPointer = (e) => {
        if (this._folded && this._open && !e.composedPath().includes(this)) this._setOpen(false);
      };
      this._onReady = () => this._build();

      this._list.addEventListener('click', (e) => this._onClick(e));
      this._toggle.addEventListener('click', () => this._setOpen(!this._open));
      this._nav.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this._folded && this._open) {
          e.stopPropagation();
          this._setOpen(false);
          this._toggle.focus();
        }
      });
    }

    connectedCallback() {
      instances.add(this);
      window.addEventListener('scroll', this._onScroll, { passive: true });
      window.addEventListener('resize', this._onResize, { passive: true });
      window.addEventListener('hashchange', this._onHash);
      window.addEventListener('popstate', this._onPop);
      document.addEventListener('pointerdown', this._onDocPointer);
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', this._onReady, { once: true });
      if (document.readyState !== 'complete') window.addEventListener('load', this._onReady, { once: true });
      this._watchFold();
      this._renderChrome();
      this._build();
      if (location.hash) this._fromHash(false);
    }

    disconnectedCallback() {
      instances.delete(this);
      window.removeEventListener('scroll', this._onScroll);
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('hashchange', this._onHash);
      window.removeEventListener('popstate', this._onPop);
      document.removeEventListener('pointerdown', this._onDocPointer);
      document.removeEventListener('DOMContentLoaded', this._onReady);
      window.removeEventListener('load', this._onReady);
      this._unwatchFold();
      if (this._mo) this._mo.disconnect();
      if (this._io) this._io.disconnect();
      this._mo = this._io = null;
      cancelAnimationFrame(this._frame);
      cancelAnimationFrame(this._buildFrame);
      clearTimeout(this._settleTimer);
    }

    attributeChangedCallback(name) {
      if (!this.isConnected) return;
      if (name === 'collapse' || name === 'collapse-below') { this._watchFold(); return; }
      if (name === 'label' || name === 'heading' || name === 'heading-level') { this._renderChrome(); return; }
      if (name === 'nested') { this._applyNesting(); this._placeMarker(null); return; }
      if (name === 'offset') { this._observe(); this._schedule(); return; }
      this._signature = '';
      this._build();
    }

    /* ---- public API ---- */

    get items() { return this._tree.map(function copy(e) { return { title: e.title, href: e.href, children: e.children.map(copy) }; }); }
    set items(list) {
      this._items = Array.isArray(list) ? list.map(toEntry).filter((e) => e.title) : null;
      if (this.isConnected) { this._signature = ''; this._build(); }
    }

    get activeId() { return this._activeId; }
    /** Marks an entry current by hand; the scrollspy takes over again when the reader scrolls. */
    set activeId(id) {
      const known = id != null && this._flat.some((f) => f.id === String(id));
      this._lock = known ? { id: String(id), settled: true } : null;
      this._setActive(known ? String(id) : null);
    }

    refresh() { this._signature = ''; this._build(); }

    scrollToId(id) {
      const entry = this._flat.find((f) => f.id === id);
      const target = (entry && this._resolve(entry)) || document.getElementById(id);
      if (!target) return false;
      this._go(id, target);
      return true;
    }

    /* ---- sources ---- */

    _targetRoot() {
      const ref = this.getAttribute('for');
      if (ref) {
        const byId = document.getElementById(ref);
        if (byId) return byId;
        try { return document.querySelector(ref); } catch (_) { return null; }
      }
      return document.querySelector('main') || document.body;
    }

    _handWritten() {
      if (this._items) return this._items;
      const raw = this.getAttribute('list-data');
      if (raw != null) {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed.map(toEntry).filter((e) => e.title) : [];
        } catch (err) {
          console.warn(`${TAG_NAME}: list-data is not valid JSON`, err);
          return [];
        }
      }
      const list = Array.from(this.children).find((el) => el.tagName === 'UL' || el.tagName === 'OL');
      return list ? fromList(list) : null;
    }

    _fromHeadings(root) {
      if (!root) return [];
      const custom = this.getAttribute('headings');
      const selector = custom || parseLevels(this.getAttribute('levels')).map((l) => `h${l}`).join(',');
      let found;
      try { found = Array.from(root.querySelectorAll(selector)); } catch (err) {
        console.warn(`${TAG_NAME}: headings is not a valid selector`, err);
        return [];
      }
      const headings = found.filter((h) => !h.closest('[data-toc-ignore]') && !this.contains(h) && h.getClientRects().length > 0);

      const tree = [];
      const stack = []; // { level, entry }
      headings.forEach((h) => {
        const title = clean(h.dataset.tocTitle || h.textContent);
        if (!title) return;
        if (!h.id) h.id = uniqueId(slugify(title));
        const entry = { title, href: `#${h.id}`, id: h.id, level: headingLevel(h), target: h, children: [] };
        while (stack.length && stack[stack.length - 1].level >= entry.level) stack.pop();
        (stack.length ? stack[stack.length - 1].children : tree).push(entry);
        stack.push(entry);
      });
      return tree;
    }

    /* ---- build ---- */

    _build() {
      cancelAnimationFrame(this._buildFrame);
      const hand = this._handWritten();
      const root = hand ? null : this._targetRoot();
      const tree = hand || this._fromHeadings(root);
      this._watchMutations(root);

      const flat = [];
      (function walk(list, depth) {
        list.forEach((e) => {
          e.depth = depth;
          flat.push(e);
          walk(e.children, depth + 1);
        });
      })(tree, 0);

      const signature = JSON.stringify(flat.map((e) => [e.title, e.href, e.depth]));
      const sameTargets = flat.length === this._flat.length && flat.every((e, i) => e.target === this._flat[i].target);
      if (signature === this._signature && sameTargets) { this._schedule(); return; }
      this._signature = signature;
      this._tree = tree;
      this._render(flat);
      this._observe();
      this._schedule();
    }

    _render(flat) {
      const make = (list, depth) => {
        const ol = document.createElement('ol');
        list.forEach((e) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.className = 'link';
          a.setAttribute('part', 'link');
          a.href = e.href || '#';
          a.style.setProperty('--depth', String(depth));
          a.textContent = e.title;
          if (e.id) a.dataset.id = e.id;
          e.link = a;
          li.append(a);
          if (e.children.length) li.append(make(e.children, depth + 1));
          ol.append(li);
        });
        return ol;
      };
      const built = make(this._tree, 0);
      this._list.replaceChildren(...built.childNodes);
      this._flat = flat.filter((e) => e.id).map((e) => ({ id: e.id, title: e.title, level: e.level || e.depth + 1, link: e.link, target: e.target || null }));
      const keep = this._activeId;
      this._activeId = null;
      if (keep && this._flat.some((f) => f.id === keep)) this._setActive(keep, { silent: true });
      this._applyNesting();
      this._placeMarker(false);
    }

    _watchMutations(root) {
      if (this._moRoot === root) return;
      if (this._mo) this._mo.disconnect();
      this._mo = null;
      this._moRoot = root;
      if (!root) return;
      this._mo = new MutationObserver((records) => {
        if (records.every((r) => this.contains(r.target))) return;
        cancelAnimationFrame(this._buildFrame);
        this._buildFrame = requestAnimationFrame(() => this._build());
      });
      this._mo.observe(root, { childList: true, subtree: true, characterData: true });
    }

    _observe() {
      if (this._io) this._io.disconnect();
      this._io = null;
      if (typeof IntersectionObserver === 'undefined') return;
      const offset = Math.max(0, Math.round(this._offset()));
      this._io = new IntersectionObserver(() => this._schedule(), { rootMargin: `-${offset}px 0px 0px 0px`, threshold: [0, 1] });
      this._flat.forEach((f) => { const t = this._resolve(f); if (t) this._io.observe(t); });
    }

    _resolve(f) {
      if (!f.target || !f.target.isConnected) f.target = document.getElementById(f.id);
      return f.target;
    }

    /* ---- scrollspy ---- */

    _offset() {
      const own = this.getAttribute('offset');
      if (own != null && own !== '' && !Number.isNaN(Number(own))) return Number(own);
      const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kakao-header-bar-rendered-height')) || 0;
      const folded = this._folded && this.hasAttribute('sticky') ? this._toggle.offsetHeight : 0;
      return bar + folded + 16;
    }

    _schedule() {
      if (this._frame) return;
      this._frame = requestAnimationFrame(() => {
        this._frame = 0;
        this._spy();
      });
    }

    _onUserScroll() {
      if (this._lock) {
        if (this._lock.settled) this._lock = null; // the reader scrolls on: the scrollspy takes over again
        else { this._armSettle(); return; }
      }
      this._schedule();
    }

    _armSettle() {
      clearTimeout(this._settleTimer);
      this._settleTimer = setTimeout(() => { if (this._lock) this._lock.settled = true; }, 150);
    }

    _spy() {
      if (this._lock) return;
      const line = this._offset();
      if (!this._flat.some((f) => this._resolve(f))) return; // nothing of it on this page
      let active = null;
      for (const f of this._flat) {
        const t = this._resolve(f);
        if (!t) continue;
        if (t.getBoundingClientRect().top - line <= 1) active = f;
      }
      const doc = document.scrollingElement || document.documentElement;
      if (window.scrollY > 0 && Math.ceil(window.scrollY + window.innerHeight) >= doc.scrollHeight - 2) {
        for (let i = this._flat.length - 1; i >= 0; i -= 1) {
          if (this._resolve(this._flat[i])) { active = this._flat[i]; break; }
        }
      }
      this._setActive(active ? active.id : null);
    }

    _setActive(id, { silent = false } = {}) {
      if (id === this._activeId) return;
      const previousId = this._activeId;
      this._activeId = id;
      let current = null;
      this._flat.forEach((f) => {
        const on = f.id === id;
        if (on) current = f;
        if (on) {
          f.link.setAttribute('aria-current', 'location');
          f.link.setAttribute('part', 'link active');
        } else if (f.link.hasAttribute('aria-current')) {
          f.link.removeAttribute('aria-current');
          f.link.setAttribute('part', 'link');
        }
      });
      this._toggleCurrent.textContent = current ? current.title : '';
      this._applyNesting();
      this._placeMarker(true);
      this._revealActive(current);
      if (silent) return;
      this.dispatchEvent(new CustomEvent('toc-change', {
        bubbles: true,
        composed: true,
        detail: { id, title: current ? current.title : null, level: current ? current.level : null, previousId },
      }));
      if (typeof KakaoComponents !== 'undefined') {
        KakaoComponents.emit(this, 'section-change', { id, title: current ? current.title : null });
      }
    }

    /**
     * Moves the marker bar onto the current entry. animate true: stretch over
     * there (a new section); false: jump (first draw, rebuilt list); null: keep
     * whatever move is running (a resize must not cut it short).
     */
    _placeMarker(animate = false) {
      const m = this._marker;
      const current = this._activeId != null ? this._flat.find((f) => f.id === this._activeId) : null;
      const link = current && current.link;
      if (!link || !link.isConnected || !link.getClientRects().length) {
        m.classList.remove('is-on');
        return;
      }
      const rail = this._rail.getBoundingClientRect();
      const r = link.getBoundingClientRect();
      const wasOn = m.classList.contains('is-on');
      if (animate !== null) m.classList.toggle('is-moving', animate && wasOn);
      const y = r.top - rail.top;
      const h = r.height;
      if (animate === false && this._markerMove) { this._markerMove.cancel(); this._markerMove = null; }
      if (animate && wasOn && !reducedMotion()) {
        // Start from where the bar is drawn now, so a move that interrupts one
        // carries on from there instead of snapping back.
        const now = m.getBoundingClientRect();
        this._stretchMarker(now.top - rail.top, now.height, y, h);
      }
      m.style.setProperty('--_marker-y', `${y}px`);
      m.style.setProperty('--_marker-h', `${h}px`);
      m.classList.add('is-on');
    }

    /**
     * Squash & stretch from (y0, h0) to (y1, h1): the edge in the direction of
     * travel leads and the other edge trails, so the bar stretches over the gap,
     * then settles at the new entry's size. Edges only ever move forward.
     */
    _stretchMarker(y0, h0, y1, h1) {
      const m = this._marker;
      if (this._markerMove) this._markerMove.cancel();
      if (Math.abs(y1 - y0) < 1 && Math.abs(h1 - h0) < 1) return;
      const cs = getComputedStyle(m);
      const raw = cs.getPropertyValue('--_anim-duration').trim();
      const ms = raw.endsWith('ms') ? parseFloat(raw) : raw.endsWith('s') ? parseFloat(raw) * 1000 : 200;
      const easing = cs.getPropertyValue('--_anim-easing').trim() || 'cubic-bezier(.2, 0, 0, 1)';
      // Thinner while stretched (scaled about its centre, so it stays on the track).
      const w = m.offsetWidth || 1;
      const thin = parseFloat(cs.getPropertyValue('--_marker-stretch-width'));
      const sx = Number.isFinite(thin) && thin > 0 ? Math.min(1, thin / w) : 1;
      const down = y1 > y0;
      // Halfway: the leading edge is at its target, the trailing one barely moved.
      const top = down ? y0 + (y1 - y0) * 0.15 : y1;
      const bottom = down ? y1 + h1 : (y0 + h0) - ((y0 + h0) - (y1 + h1)) * 0.15;
      const frame = (ty, hh, s = 1) => ({ transform: `translateY(${ty}px) scaleX(${s})`, height: `${Math.max(0, hh)}px` });
      this._markerMove = m.animate([
        { ...frame(y0, h0), easing },
        { ...frame(top, bottom - top, sx), offset: 0.5, easing },
        frame(y1, h1),
      ], { duration: Number.isFinite(ms) ? ms : 200 });
      const move = this._markerMove;
      move.onfinish = move.oncancel = () => { if (this._markerMove === move) this._markerMove = null; };
    }

    /** Keeps the active entry in view when the toc scrolls inside itself. */
    _revealActive(current, center = false) {
      if (!current) return;
      const box = this._folded ? this._panel : this;
      if (box.scrollHeight <= box.clientHeight + 1) return;
      const r = current.link.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      if (center) box.scrollTop += r.top - b.top - (b.height - r.height) / 2;
      else if (r.top < b.top) box.scrollTop -= b.top - r.top + 8;
      else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom + 8;
    }

    _applyNesting() {
      const onlyActive = this.getAttribute('nested') === 'active';
      Array.from(this._list.children).forEach((li) => {
        const sub = li.querySelector(':scope > ol');
        if (!sub) return;
        const holds = this._activeId != null && Array.from(li.querySelectorAll('.link')).some((a) => a.dataset.id === this._activeId);
        sub.hidden = onlyActive && !holds;
      });
    }

    /* ---- navigation ---- */

    _onClick(e) {
      const a = e.target.closest('a.link');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const id = a.dataset.id;
      if (!id) return;
      const f = this._flat.find((x) => x.id === id);
      const target = f && this._resolve(f);
      if (!target) return; // not on this page: let the browser follow the link
      e.preventDefault();
      if (this._folded) this._setOpen(false);
      this._go(id, target);
    }

    _go(id, target) {
      const top = target.getBoundingClientRect().top + window.scrollY - this._offset() + 1;
      this._lock = { id, settled: false };
      this._setActive(id);
      this._armSettle();
      window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion() ? 'instant' : 'smooth' });
      if (location.hash !== `#${encodeURIComponent(id)}` && location.hash !== `#${id}`) {
        try { history.pushState(null, '', `#${encodeURIComponent(id)}`); } catch (_) { /* sandboxed page */ }
      }
      if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }

    _fromHash(lock) {
      const id = idFromHref(location.hash);
      if (!id || !this._flat.some((f) => f.id === id)) { this._schedule(); return; }
      if (lock) {
        this._lock = { id, settled: false };
        this._armSettle();
      }
      this._setActive(id);
    }

    /* ---- chrome and folding ---- */

    _renderChrome() {
      const label = this.getAttribute('label') || texts.label || DEFAULT_TEXTS.label;
      const heading = this.getAttribute('heading');
      this._nav.setAttribute('aria-label', label);
      this._title.textContent = heading || '';
      this._title.hidden = !heading;
      const level = Number(this.getAttribute('heading-level'));
      this._title.setAttribute('aria-level', String(level >= 1 && level <= 6 ? level : 2));
      this._toggleTitle.textContent = heading || label;
    }

    _watchFold() {
      this._unwatchFold();
      const mode = this.getAttribute('collapse') || 'never';
      if (mode === 'auto' && window.matchMedia) {
        const below = this.getAttribute('collapse-below') || '48rem';
        this._mq = window.matchMedia(`(width < ${below})`);
        this._mqHandler = () => this._setFolded(this._mq.matches);
        this._mq.addEventListener('change', this._mqHandler);
        this._setFolded(this._mq.matches);
      } else {
        this._setFolded(mode === 'always');
      }
    }

    _unwatchFold() {
      if (this._mq && this._mqHandler) this._mq.removeEventListener('change', this._mqHandler);
      this._mq = this._mqHandler = null;
    }

    _setFolded(folded) {
      this._folded = folded;
      this._nav.classList.toggle('is-folded', folded);
      this.toggleAttribute('data-folded', folded);
      this._setOpen(false);
      if (!folded) this._panel.hidden = false;
      this._schedule();
    }

    _setOpen(open) {
      this._open = open && this._folded;
      this._toggle.setAttribute('aria-expanded', String(this._open));
      if (this._folded) this._panel.hidden = !this._open;
      if (this._open) {
        const current = this._flat.find((f) => f.id === this._activeId);
        requestAnimationFrame(() => this._revealActive(current, true));
      }
    }
  }

  KakaoToc.DEFAULT_TEXTS = DEFAULT_TEXTS;

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: ['section-change'], reactions: {} });
  }

  window.KakaoToc = KakaoToc;
  customElements.define(TAG_NAME, KakaoToc);
})();
