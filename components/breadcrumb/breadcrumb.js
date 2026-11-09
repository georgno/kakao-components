/**
 * <kakao-breadcrumb>
 * ============================================================================
 * Where the current page sits in a hierarchy, built from title/url pairs.
 * The trail starts with a home item: a house icon by default, or the start
 * text. The last item is the current page. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="breadcrumb.js"><\/script>
 *
 *   <kakao-breadcrumb list-data='[["Settings", "/settings"], ["Plan"]]'></kakao-breadcrumb>
 *
 *   <kakao-breadcrumb start="text" list-data='[
 *     { "title": "Library", "url": "/library" },
 *     { "title": "Sci-fi", "url": "/library/sci-fi" },
 *     { "title": "Arrival" }
 *   ]'></kakao-breadcrumb>
 *
 *   el.items = [['Settings', '/settings'], ['Plan']];   // from script
 *
 *   KakaoBreadcrumb.startText = 'Home';   // the start text for every breadcrumb
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  list-data   JSON array of items (never "data"). Each item is
 *              { "title": "…", "url": "…" } or a pair ["Title", "/url"].
 *              The url is optional; the last item is always the current page
 *              (aria-current="page", not a link).
 *  start       "icon" (default): a house icon, named by the start text.
 *              "text": the start text. "none": no start item.
 *  start-text  The start text for this breadcrumb. Default: KakaoBreadcrumb.startText,
 *              which starts as START_TEXT ("Start").
 *  start-url   Where the start item links. Default "/".
 *  label       Accessible name of the navigation landmark. Default "Breadcrumb".
 *
 * PROPERTIES: items (get / set, same shapes as list-data).
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  breadcrumb-navigate  { title, url, index }  cancelable; index is the position
 *                       in the trail (0 is the start item unless start="none"). preventDefault() keeps the browser from following
 *                       the link (for single-page apps).
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-breadcrumb-text / -current / -hover / -hover-bg / -separator / -focus
 *  --kakao-breadcrumb-font-size / -current-weight / -gap / -padding-x / -radius
 *  --kakao-breadcrumb-icon-size / -max-item-width
 *
 * Parts: list, item, link, current, separator, start.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-breadcrumb';
  if (customElements.get(TAG_NAME)) return;

  /** The default start text. Change it for every breadcrumb with KakaoBreadcrumb.startText. */
  const START_TEXT = 'Start';

  const HOUSE = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 7.2 8 2.5l5.5 4.7V13a.9.9 0 0 1-.9.9H10V10H6v3.9H3.4a.9.9 0 0 1-.9-.9z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  const CHEVRON = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m6 3.5 4.5 4.5L6 12.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-breadcrumb- (written by construction.html, edit there) */
        --_text: var(--kakao-breadcrumb-text, var(--kakao-color-muted, #62626c));
        --_current: var(--kakao-breadcrumb-current, var(--kakao-color-text, #18181b));
        --_hover: var(--kakao-breadcrumb-hover, var(--kakao-color-text, #18181b));
        --_hover-bg: var(--kakao-breadcrumb-hover-bg, var(--kakao-color-subtle, #f0f0f1));
        --_separator: var(--kakao-breadcrumb-separator, var(--kakao-color-border, #82828b));
        --_focus: var(--kakao-breadcrumb-focus, var(--kakao-color-focus, #2563eb));
        --_font-size: var(--kakao-breadcrumb-font-size, 0.875rem);
        --_current-weight: var(--kakao-breadcrumb-current-weight, 600);
        --_gap: var(--kakao-breadcrumb-gap, 0.125rem);
        --_padding-x: var(--kakao-breadcrumb-padding-x, 0.375rem);
        --_radius: var(--kakao-breadcrumb-radius, 6px);
        --_icon-size: var(--kakao-breadcrumb-icon-size, 1rem);
        --_max-item-width: var(--kakao-breadcrumb-max-item-width, 16rem);
        /* @kakao-settings:end */
        display: block;
        min-width: 0;
        font-size: var(--_font-size);
        line-height: 1.4;
      }
      :host([hidden]) { display: none; }

      ol {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--_gap);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      li {
        display: inline-flex;
        align-items: center;
        gap: var(--_gap);
        min-width: 0;
        max-width: 100%; /* a long title shrinks to its row instead of overflowing */
      }

      .link, .current {
        display: inline-flex;
        align-items: center;
        min-height: 1.75rem;
        max-width: var(--_max-item-width);
        min-width: 0;
        flex: 0 1 auto;
        padding: 0 var(--_padding-x);
        border-radius: var(--_radius);
        box-sizing: border-box;
      }
      .text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .link {
        color: var(--_text);
        text-decoration: none;
        transition: color 150ms var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)),
                    background-color 150ms var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1));
      }
      .link:hover { color: var(--_hover); background: var(--_hover-bg); }
      .link:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; }
      .plain { color: var(--_text); }
      .current { color: var(--_current); font-weight: var(--_current-weight); }

      .start svg {
        display: block;
        width: var(--_icon-size);
        height: var(--_icon-size);
      }
      .start.is-icon { padding: 0 calc(var(--_padding-x) * 0.75); }

      .separator {
        display: inline-flex;
        color: var(--_separator);
      }
      .separator svg { width: 0.85em; height: 0.85em; }

      @media (prefers-reduced-motion: reduce) {
        .link { transition: none; }
      }
      @media (forced-colors: active) {
        .link:focus-visible { outline-color: Highlight; }
      }
    </style>
    <nav part="nav"><ol part="list"></ol></nav>
  `;

  /** Normalises one item: { title, url } or ["Title", "/url"] (or a plain string). */
  function toItem(raw) {
    if (Array.isArray(raw)) return { title: String(raw[0] ?? ''), url: raw[1] == null ? '' : String(raw[1]) };
    if (raw && typeof raw === 'object') return { title: String(raw.title ?? ''), url: raw.url == null ? '' : String(raw.url) };
    return { title: String(raw ?? ''), url: '' };
  }

  const instances = new Set(); // connected breadcrumbs, redrawn when the start text changes
  let startText = START_TEXT;

  class KakaoBreadcrumb extends HTMLElement {
    /** The start text every breadcrumb uses unless it has start-text. */
    static get startText() { return startText; }
    static set startText(value) {
      startText = value ? String(value) : START_TEXT;
      instances.forEach((el) => el._render());
    }

    static get observedAttributes() {
      return ['list-data', 'start', 'start-text', 'start-url', 'label'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._nav = shadow.querySelector('nav');
      this._list = shadow.querySelector('ol');
      this._items = [];
      this._list.addEventListener('click', (e) => this._onClick(e));
    }

    connectedCallback() {
      instances.add(this);
      this._readListData();
      this._render();
    }

    disconnectedCallback() {
      instances.delete(this);
    }

    attributeChangedCallback(name) {
      if (name === 'list-data') this._readListData();
      if (this.isConnected) this._render();
    }

    get items() {
      return this._items.map((i) => ({ ...i }));
    }

    set items(list) {
      this._items = Array.isArray(list) ? list.map(toItem).filter((i) => i.title) : [];
      if (this.isConnected) this._render();
    }

    _readListData() {
      const raw = this.getAttribute('list-data');
      if (raw == null) return;
      try {
        const parsed = JSON.parse(raw);
        this._items = Array.isArray(parsed) ? parsed.map(toItem).filter((i) => i.title) : [];
      } catch (err) {
        console.warn(`${TAG_NAME}: list-data is not valid JSON`, err);
        this._items = [];
      }
    }

    _startText() {
      return this.getAttribute('start-text') || KakaoBreadcrumb.startText || START_TEXT;
    }

    /** The full trail: start item (unless start="none") plus the items. */
    _trail() {
      const mode = this.getAttribute('start') || 'icon';
      const trail = [];
      if (mode !== 'none') {
        trail.push({ title: this._startText(), url: this.getAttribute('start-url') || '/', start: mode === 'text' ? 'text' : 'icon' });
      }
      return trail.concat(this._items);
    }

    _render() {
      this._nav.setAttribute('aria-label', this.getAttribute('label') || 'Breadcrumb');
      this._trailCache = this._trail();
      const last = this._trailCache.length - 1;
      this._list.replaceChildren(...this._trailCache.map((item, index) => {
        const li = document.createElement('li');
        li.setAttribute('part', 'item');
        if (index > 0) {
          const sep = document.createElement('span');
          sep.className = 'separator';
          sep.setAttribute('part', 'separator');
          sep.setAttribute('aria-hidden', 'true');
          sep.innerHTML = CHEVRON;
          li.append(sep);
        }

        const isCurrent = index === last;
        let el;
        if (isCurrent) {
          el = document.createElement('span');
          el.className = 'current';
          el.setAttribute('part', 'current');
          el.setAttribute('aria-current', 'page');
        } else if (item.url) {
          el = document.createElement('a');
          el.className = 'link';
          el.setAttribute('part', 'link');
          el.href = item.url;
          el.dataset.index = String(index);
        } else {
          el = document.createElement('span');
          el.className = 'link plain';
        }

        if (item.start === 'icon') {
          el.classList.add('start', 'is-icon');
          el.setAttribute('part', `${el.getAttribute('part') || 'link'} start`);
          el.setAttribute('aria-label', item.title);
          el.title = item.title;
          el.innerHTML = HOUSE;
        } else {
          if (item.start) {
            el.classList.add('start');
            el.setAttribute('part', `${el.getAttribute('part') || 'link'} start`);
          }
          const text = document.createElement('span');
          text.className = 'text';
          text.textContent = item.title;
          if (!isCurrent) text.title = item.title; // full title when cut off
          el.append(text);
        }
        li.append(el);
        return li;
      }));
    }

    _onClick(e) {
      const link = e.target.closest('a.link');
      if (!link) return;
      const index = Number(link.dataset.index);
      const item = (this._trailCache || [])[index];
      if (!item) return;
      const allowed = this.dispatchEvent(new CustomEvent('breadcrumb-navigate', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { title: item.title, url: item.url, index },
      }));
      if (!allowed) e.preventDefault();
    }
  }

  KakaoBreadcrumb.START_TEXT = START_TEXT; // the built-in default, read-only by convention

  window.KakaoBreadcrumb = KakaoBreadcrumb;
  customElements.define(TAG_NAME, KakaoBreadcrumb);
})();
