/**
 * <kakao-pagination>
 * ============================================================================
 * Page links for a long list: previous / next, the page numbers with an
 * ellipsis window, and a compact form ("1–20 of 143" with previous / next)
 * that it falls back to by itself when it gets too narrow. It stands alone:
 * a table or grid puts one below itself and listens for `page-change`.
 * Vanilla JS, Shadow DOM, no deps.
 *
 * Two ways to work:
 *  - links (`url`): every control is a real <a href>, so a server-rendered
 *    page (Yii2 and friends) pages without any script of its own;
 *  - buttons (no `url`): controls are buttons, the page listens for
 *    `page-change` and loads the rows.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="pagination.js"><\/script>
 *
 *   <!-- server-rendered: real links -->
 *   <kakao-pagination page="3" total-pages="12" url="?page={page}"></kakao-pagination>
 *
 *   <!-- script-driven, from an item count -->
 *   <kakao-pagination id="pager" page="1" total-items="143" page-size="20"
 *     summary page-sizes="10,20,50"></kakao-pagination>
 *
 *   pager.addEventListener('page-change', (e) => load(e.detail.page));
 *   pager.addEventListener('page-size-change', (e) => load(e.detail.page, e.detail.pageSize));
 *
 *   KakaoPagination.texts = { previous: 'Vorherige Seite', range: '{from}–{to} von {total}' };
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  page         The current page, 1-based. Default 1. Clamped to the number of
 *               pages; the attribute reflects the state.
 *  total-pages  Number of pages. Or give:
 *  total-items  Number of items, with
 *  page-size    items per page (default 20). The page count is derived, and
 *               the summary can say "21–40 of 143". With neither total the
 *               pager is open-ended: the compact form with "Page 3", and next
 *               stays available until `last` is set.
 *  last         Open-ended only: marks the current page as the last one.
 *  siblings     Pages shown on each side of the current one. Default 1.
 *  boundaries   Pages always shown at the start and at the end. Default 1.
 *               The number of slots stays the same on every page, so the
 *               pager does not change width while paging.
 *  url          Link template: "{page}" is replaced by the page number and
 *               "{page-size}" by the page size ("?page={page}&per-page={page-size}").
 *               With it the controls are links; without it, buttons.
 *  first-last   Adds first-page and last-page controls (full form).
 *  summary      Shows the summary text in the full form too.
 *  page-sizes   Comma-separated page sizes ("10,20,50"): adds a "Rows per
 *               page" select. A native select, or a kakao-select where
 *               select.js is loaded.
 *  collapse     "auto" (default): compact when the page numbers do not fit the
 *               element's own width. "always": always compact. "never": the
 *               page numbers wrap instead.
 *  size         "sm" (36px) | "md" (44px, default) | "lg" (52px): the button heights.
 *  hide-single  Renders nothing while there is only one page.
 *  disabled     Nothing can be activated (while rows are loading).
 *  label        Accessible name of the navigation landmark. Default "Pagination".
 *               Give each pager on a page its own when there are several.
 *
 * PROPERTIES: page (get / set), pageSize (get / set), totalPages (get; set
 * writes total-pages), totalItems (get / set), disabled, from / to (1-based item range
 * of the page, or null), compact (read-only: the compact form is showing).
 * Setting a property or an attribute never fires an event.
 *
 * METHODS: next(), previous(), first(), last(), goTo(page). Each returns true
 * when the page changed.
 *
 * KakaoPagination.texts: the words for every pager: { label, previous, next,
 * first, last, page, range, pageOf, pageOnly, empty, pageSize }.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed, cancelable)
 * ----------------------------------------------------------------------------
 *  page-change       { page, previous, pageSize, source }  a control was
 *                    activated (source "user") or a method called ("api").
 *                    Unless preventDefault() is called the pager moves to that
 *                    page, and a link is followed. Cancel it to keep the page
 *                    (and, with `url`, to stop the navigation and route it
 *                    yourself).
 *  page-size-change  { pageSize, previous, page }  another page size was
 *                    picked; `page` is the page that keeps the first visible
 *                    item in view. Unless cancelled the pager takes both, and
 *                    with a `url` that contains "{page-size}" it goes there.
 *
 * Keyboard: Tab through the controls, Enter (and Space on buttons) activates.
 * Focus stays on the control that was used; after picking a number it sits on
 * the current page.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-pagination-text / -hover-bg / -current-bg / -current-text / -gap-color
 *  --kakao-pagination-summary / -focus / -select-bg / -select-border / -select-text
 *  --kakao-pagination-height / -radius / -font-size / -sm-height / -sm-radius / -sm-font-size
 *  --kakao-pagination-lg-height / -lg-radius / -lg-font-size / -padding-x
 *  --kakao-pagination-weight / -current-weight / -summary-font-size / -icon-size
 *  --kakao-pagination-gap / -section-gap / -select-width / -select-radius
 *  --kakao-pagination-disabled-opacity / -transition
 *
 * Parts: root, meta, page-size, summary, list, control, page, current, gap.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-pagination';
  if (customElements.get(TAG_NAME)) return;

  /** The built-in words. Change them for every pager with KakaoPagination.texts. */
  const TEXTS = Object.freeze({
    label: 'Pagination',
    previous: 'Previous page',
    next: 'Next page',
    first: 'First page',
    last: 'Last page',
    page: 'Page {page}',
    range: '{from}–{to} of {total}',
    pageOf: 'Page {page} of {total}',
    pageOnly: 'Page {page}',
    empty: 'No entries',
    pageSize: 'Rows per page',
  });

  const svg = (body) => `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const ICONS = {
    previous: svg('<path d="m10 3.5-4.5 4.5 4.5 4.5"/>'),
    next: svg('<path d="m6 3.5 4.5 4.5-4.5 4.5"/>'),
    first: svg('<path d="M4 3.5v9"/><path d="m12 3.5-4.5 4.5 4.5 4.5"/>'),
    last: svg('<path d="M12 3.5v9"/><path d="m4 3.5 4.5 4.5-4.5 4.5"/>'),
    gap: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="currentColor"><circle cx="3" cy="8" r="1.25"/><circle cx="8" cy="8" r="1.25"/><circle cx="13" cy="8" r="1.25"/></svg>',
    caret: svg('<path d="m4 6 4 4 4-4"/>'),
  };

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-pagination- (written by construction.html, edit there) */
        --_text: var(--kakao-pagination-text, var(--kakao-color-text-soft, #3f3f46));
        --_hover-bg: var(--kakao-pagination-hover-bg, var(--kakao-color-subtle, #f0f0f1));
        --_current-bg: var(--kakao-pagination-current-bg, var(--kakao-color-ink, #18181b));
        --_current-text: var(--kakao-pagination-current-text, var(--kakao-color-on-ink, #fafafa));
        --_gap-color: var(--kakao-pagination-gap-color, var(--kakao-color-muted, #62626c));
        --_summary: var(--kakao-pagination-summary, var(--kakao-color-muted, #62626c));
        --_focus: var(--kakao-pagination-focus, var(--kakao-color-focus, #2563eb));
        --_select-bg: var(--kakao-pagination-select-bg, var(--kakao-color-bg, #ffffff));
        --_select-border: var(--kakao-pagination-select-border, var(--kakao-color-field-border, #ececef));
        --_select-text: var(--kakao-pagination-select-text, var(--kakao-color-text, #18181b));
        --_height: var(--kakao-pagination-height, 44px);
        --_radius: var(--kakao-pagination-radius, 13px);
        --_font-size: var(--kakao-pagination-font-size, 14.5px);
        --_sm-height: var(--kakao-pagination-sm-height, 36px);
        --_sm-radius: var(--kakao-pagination-sm-radius, 11px);
        --_sm-font-size: var(--kakao-pagination-sm-font-size, 13px);
        --_lg-height: var(--kakao-pagination-lg-height, 52px);
        --_lg-radius: var(--kakao-pagination-lg-radius, 15px);
        --_lg-font-size: var(--kakao-pagination-lg-font-size, 16px);
        --_padding-x: var(--kakao-pagination-padding-x, 0.5em);
        --_weight: var(--kakao-pagination-weight, 500);
        --_current-weight: var(--kakao-pagination-current-weight, 600);
        --_summary-font-size: var(--kakao-pagination-summary-font-size, 0.875rem);
        --_icon-size: var(--kakao-pagination-icon-size, 1.15em);
        --_gap: var(--kakao-pagination-gap, 2px);
        --_section-gap: var(--kakao-pagination-section-gap, 1rem);
        --_select-width: var(--kakao-pagination-select-width, 5.5rem);
        --_select-radius: var(--kakao-pagination-select-radius, 10px);
        --_disabled-opacity: var(--kakao-pagination-disabled-opacity, 0.45);
        --_transition: var(--kakao-pagination-transition, 150ms);
        /* @kakao-settings:end */
        --_h: var(--_height);
        --_r: var(--_radius);
        --_fs: var(--_font-size);
        display: block;
        min-width: 0;
        font-family: var(--kakao-font-family, inherit);
        font-size: var(--_fs);
        line-height: 1.3;
        color: var(--_text);
      }
      :host([size="sm"]) { --_h: var(--_sm-height); --_r: var(--_sm-radius); --_fs: var(--_sm-font-size); }
      :host([size="lg"]) { --_h: var(--_lg-height); --_r: var(--_lg-radius); --_fs: var(--_lg-font-size); }
      :host([hidden]) { display: none; }

      .root {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem var(--_section-gap);
        min-width: 0;
      }
      .root.is-single { display: none; }
      .root.is-bare { justify-content: flex-start; }

      .meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem var(--_section-gap);
        min-width: 0;
      }
      .is-bare:not(.is-compact) .meta { display: none; }
      .size-slot { display: contents; }
      .summary {
        font-size: var(--_summary-font-size);
        color: var(--_summary);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .root:not(.is-compact):not(.has-summary) .summary { display: none; }

      .size {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: var(--_summary-font-size);
        color: var(--_summary);
      }
      .size-label { white-space: nowrap; }
      .select-box { position: relative; display: block; width: var(--_select-width); color: var(--_select-text); }
      .select-box select {
        appearance: none;
        -webkit-appearance: none;
        display: block;
        box-sizing: border-box;
        width: 100%;
        height: var(--_h);
        margin: 0;
        padding: 0 2em 0 0.75em;
        border: 1px solid var(--_select-border);
        border-radius: var(--_select-radius);
        background: var(--_select-bg);
        color: inherit;
        font: inherit;
        font-size: var(--_fs);
        font-variant-numeric: tabular-nums;
        cursor: pointer;
      }
      .select-box select:focus { outline: none; }
      .select-box select:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; border-color: var(--_focus); }
      .select-box select:disabled { cursor: default; }
      .select-box svg {
        position: absolute;
        inset-inline-end: 0.6em;
        top: 50%;
        width: 1em;
        height: 1em;
        margin-top: -0.5em;
        font-size: var(--_fs);
        pointer-events: none;
      }
      .select-box kakao-select { font-size: var(--_fs); }

      ul {
        display: flex;
        align-items: center;
        gap: var(--_gap);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .root:not(.is-bare) ul { margin-inline-start: auto; } /* stays at the end when it wraps below the summary */
      .root.is-wrapping ul { flex-wrap: wrap; }
      li { flex: none; display: block; }
      .is-compact li:is(.is-page, .is-gap, .is-edge) { display: none; }

      .control {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        min-width: var(--_h);
        height: var(--_h);
        margin: 0;
        padding: 0 var(--_padding-x);
        border: 0;
        border-radius: var(--_r);
        background: transparent;
        color: var(--_text);
        font: inherit;
        font-weight: var(--_weight);
        font-variant-numeric: tabular-nums;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background-color var(--_transition), color var(--_transition);
      }
      .control:hover { background: var(--_hover-bg); }
      .control:focus { outline: none; }
      .control:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; }
      .control[aria-current] {
        background: var(--_current-bg);
        color: var(--_current-text);
        font-weight: var(--_current-weight);
        cursor: default;
      }
      .control[aria-disabled="true"] { opacity: var(--_disabled-opacity); cursor: default; }
      .control[aria-disabled="true"]:not([aria-current]) { background: transparent; }
      .control svg { display: block; width: var(--_icon-size); height: var(--_icon-size); }
      .control:dir(rtl) svg { transform: scaleX(-1); }

      .gap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: var(--_h);
        height: var(--_h);
        color: var(--_gap-color);
      }
      .gap svg { display: block; width: 1em; height: 1em; }

      .is-disabled .meta { opacity: var(--_disabled-opacity); }

      @media (prefers-reduced-motion: reduce) {
        .control { transition: none; }
      }
      @media (forced-colors: active) {
        .control[aria-current] { forced-color-adjust: none; background: Highlight; color: HighlightText; }
        .control[aria-disabled="true"] { opacity: 1; color: GrayText; }
        .control:focus-visible, .select-box select:focus-visible { outline-color: Highlight; }
      }
    </style>
    <nav class="root" part="root">
      <div class="meta" part="meta"><span class="size-slot"></span><span class="summary" part="summary" role="status"></span></div>
      <ul part="list" role="list"></ul>
    </nav>
  `;

  const fill = (text, values) => String(text).replace(/\{([a-z-]+)\}/gi, (all, key) => (key in values ? values[key] : all));

  /** A whole number from an attribute, or the fallback. */
  function toInt(raw, fallback, min) {
    if (raw == null || String(raw).trim() === '') return fallback;
    const number = Math.trunc(Number(raw));
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, number);
  }

  const range = (from, to) => Array.from({ length: Math.max(0, to - from + 1) }, (unused, i) => from + i);

  /**
   * The pages to show: numbers, and 'gap' where pages are left out. The count
   * of slots is the same for every current page (boundaries * 2 + siblings * 2 + 3),
   * a gap that would hide a single page shows that page instead.
   */
  function windowOf(page, total, siblings, boundaries) {
    if (total <= boundaries * 2 + siblings * 2 + 3) return range(1, total);
    const start = range(1, boundaries);
    const end = range(total - boundaries + 1, total);
    const from = Math.max(Math.min(page - siblings, total - boundaries - siblings * 2 - 1), boundaries + 2);
    const to = Math.min(Math.max(page + siblings, boundaries + siblings * 2 + 2), total - boundaries - 1);
    return [
      ...start,
      ...(from > boundaries + 2 ? ['gap'] : boundaries + 1 < total - boundaries ? [boundaries + 1] : []),
      ...range(from, to),
      ...(to < total - boundaries - 1 ? ['gap'] : total - boundaries > boundaries ? [total - boundaries] : []),
      ...end,
    ];
  }

  const instances = new Set(); // connected pagers, redrawn when the texts change
  let texts = { ...TEXTS };

  class KakaoPagination extends HTMLElement {
    /** The words every pager uses. Setting it merges into the built-in ones. */
    static get texts() { return { ...texts }; }
    static set texts(value) {
      texts = { ...TEXTS, ...(value && typeof value === 'object' ? value : {}) };
      instances.forEach((el) => el._render());
    }

    static get observedAttributes() {
      return ['page', 'total-pages', 'total-items', 'page-size', 'last', 'siblings', 'boundaries', 'url',
        'first-last', 'summary', 'page-sizes', 'collapse', 'size', 'hide-single', 'disabled', 'label'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._root = shadow.querySelector('.root');
      this._meta = shadow.querySelector('.meta');
      this._list = shadow.querySelector('ul');
      this._sizeSlot = shadow.querySelector('.size-slot');
      this._summary = shadow.querySelector('.summary'); // a status region: it stays in place so page changes are read out
      this._sizeKey = '';
      this._compact = false;
      this._reflecting = false;
      this._list.addEventListener('click', (e) => this._onClick(e));
      this._meta.addEventListener('change', (e) => this._onSizePicked(e));
      this._meta.addEventListener('select-change', (e) => e.stopPropagation()); // the inner kakao-select's own event stays inside
      this._observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this._measure()) : null;
    }

    connectedCallback() {
      instances.add(this);
      this._render();
      if (this._observer) this._observer.observe(this);
      // a kakao-select that loads later replaces the native select
      if (!customElements.get('kakao-select')) {
        customElements.whenDefined('kakao-select').then(() => { if (this.isConnected) this._render(); });
      }
    }

    disconnectedCallback() {
      instances.delete(this);
      if (this._observer) this._observer.disconnect();
    }

    attributeChangedCallback() {
      if (this._reflecting || !this.isConnected) return;
      this._render();
    }

    /* ---------------------------------------------------------------- API */

    /** The current page, 1-based, clamped to the number of pages. */
    get page() {
      const page = toInt(this.getAttribute('page'), 1, 1);
      const total = this.totalPages;
      return total == null ? page : Math.min(page, Math.max(1, total));
    }
    set page(value) { this._setAttr('page', String(toInt(value, 1, 1))); }

    get pageSize() { return toInt(this.getAttribute('page-size'), 20, 1); }
    set pageSize(value) { this._setAttr('page-size', String(toInt(value, 20, 1))); }

    /** Number of items, or null when it is not known. */
    get totalItems() {
      const raw = this.getAttribute('total-items');
      return raw == null ? null : toInt(raw, null, 0);
    }
    set totalItems(value) {
      if (value == null) this.removeAttribute('total-items');
      else this.setAttribute('total-items', String(value));
    }

    /** Number of pages (from total-pages, or from total-items and page-size), or null when open-ended. */
    get totalPages() {
      const pages = toInt(this.getAttribute('total-pages'), null, 0);
      if (pages != null) return pages;
      const items = this.totalItems;
      return items == null ? null : Math.ceil(items / this.pageSize);
    }
    set totalPages(value) {
      if (value == null) this.removeAttribute('total-pages');
      else this.setAttribute('total-pages', String(value));
    }

    /** 1-based number of the first item on the page, or null without total-items (0 when there are none). */
    get from() {
      const items = this.totalItems;
      if (items == null) return null;
      return items === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
    }

    /** 1-based number of the last item on the page, or null without total-items. */
    get to() {
      const items = this.totalItems;
      return items == null ? null : Math.min(items, this.page * this.pageSize);
    }

    get disabled() { return this._isDisabled(); }
    set disabled(value) { this.toggleAttribute('disabled', Boolean(value)); }

    /** Whether the compact form (summary with previous / next) is showing. */
    get compact() { return this._compact; }

    next() { return this._go(this.page + 1, 'api'); }
    previous() { return this._go(this.page - 1, 'api'); }
    first() { return this._go(1, 'api'); }
    last() {
      const total = this.totalPages;
      return total == null ? false : this._go(total, 'api');
    }
    goTo(page) {
      const target = toInt(page, null, 1);
      return target == null ? false : this._go(target, 'api');
    }

    /* ----------------------------------------------------------- internals */

    _setAttr(name, value) {
      if (this.getAttribute(name) !== value) this.setAttribute(name, value);
    }

    /** The highest page that can be gone to; Infinity while open-ended and not on the last page. */
    _lastPage() {
      const total = this.totalPages;
      if (total != null) return Math.max(1, total);
      return this.hasAttribute('last') ? this.page : Infinity;
    }

    _isDisabled() {
      return this.hasAttribute('disabled') && this.getAttribute('disabled') !== 'false';
    }

    /** The link for a page, or '' in button mode. */
    _href(page, pageSize) {
      const template = this.getAttribute('url');
      if (!template) return '';
      return fill(template, { page, 'page-size': pageSize == null ? this.pageSize : pageSize });
    }

    /** Fires page-change and, unless it was cancelled, moves. Returns whether the page changed. */
    _go(target, source) {
      const previous = this.page;
      const page = Math.max(1, Math.min(this._lastPage(), target));
      if (page === previous) return false;
      const allowed = this.dispatchEvent(new CustomEvent('page-change', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { page, previous, pageSize: this.pageSize, source },
      }));
      if (!allowed) return false;
      this._reflecting = true;
      this.setAttribute('page', String(page));
      this.removeAttribute('last'); // open-ended: the page that was the last one has been left
      this._reflecting = false;
      this._render();
      return true;
    }

    _onClick(e) {
      const control = e.target.closest('.control');
      if (!control) return;
      const target = Number(control.dataset.page);
      const inactive = this._isDisabled() || control.getAttribute('aria-disabled') === 'true' || control.hasAttribute('aria-current');
      if (inactive) {
        e.preventDefault();
        return;
      }
      const isLink = control.localName === 'a';
      // a link opened in a new tab or window is the browser's business
      if (isLink && (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
      const moved = this._go(target, 'user');
      if (!moved && isLink) e.preventDefault();
    }

    _onSizePicked(e) {
      const field = e.target;
      if (!field || !field.matches || !field.matches('select, kakao-select')) return;
      e.stopPropagation();
      const pageSize = toInt(field.value, null, 1);
      const previous = this.pageSize;
      if (pageSize == null || pageSize === previous) return;
      // the page that still shows the first item of the current one
      const page = Math.floor(((this.page - 1) * previous) / pageSize) + 1;
      const allowed = this.dispatchEvent(new CustomEvent('page-size-change', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { pageSize, previous, page },
      }));
      if (!allowed) {
        field.value = String(previous);
        return;
      }
      this._reflecting = true;
      this.setAttribute('page-size', String(pageSize));
      this.setAttribute('page', String(page));
      this._reflecting = false;
      this._render();
      const template = this.getAttribute('url') || '';
      if (template.includes('{page-size}')) window.location.assign(this._href(page, pageSize));
    }

    _summaryText() {
      const page = this.page;
      const items = this.totalItems;
      const total = this.totalPages;
      if (items != null) {
        if (items === 0) return texts.empty;
        return fill(texts.range, { from: this.from, to: this.to, total: items });
      }
      if (total != null) return total === 0 ? texts.empty : fill(texts.pageOf, { page, total });
      return fill(texts.pageOnly, { page });
    }

    _sizes() {
      const raw = this.getAttribute('page-sizes');
      if (!raw) return [];
      const sizes = raw.split(/[\s,;]+/).map((s) => toInt(s, null, 1)).filter((n) => n != null);
      if (!sizes.length) return [];
      const all = new Set(sizes);
      all.add(this.pageSize); // the size in use is always on the list
      return Array.from(all).sort((a, b) => a - b);
    }

    /** One control: a link with `url`, otherwise a button. */
    _control(kind, target, enabled) {
      const disabled = this._isDisabled();
      const href = this._href(target);
      const asLink = Boolean(href);
      const el = document.createElement(asLink ? 'a' : 'button');
      el.className = 'control';
      el.dataset.key = kind === 'page' ? `page-${target}` : kind;
      el.dataset.page = String(target);
      if (asLink) {
        // a link without href is not focusable and not followed: the disabled form of a link
        if (enabled && !disabled) el.setAttribute('href', href);
        else el.setAttribute('role', 'link');
        if (kind === 'previous') el.rel = 'prev';
        if (kind === 'next') el.rel = 'next';
      } else {
        el.type = 'button';
      }
      if (!enabled || disabled) el.setAttribute('aria-disabled', 'true');
      return el;
    }

    _render() {
      const active = this.shadowRoot.activeElement;
      const focusKey = active ? (active.dataset.key || (active.closest('.size') ? 'size' : '')) : '';

      const page = this.page;
      const total = this.totalPages;
      const lastPage = this._lastPage();
      const disabled = this._isDisabled();
      const mode = this.getAttribute('collapse') || 'auto';
      const sizes = this._sizes();
      const showSummary = this.hasAttribute('summary');

      // an out-of-range page attribute is written back clamped
      if (this.hasAttribute('page') && this.getAttribute('page') !== String(page)) {
        this._reflecting = true;
        this.setAttribute('page', String(page));
        this._reflecting = false;
      }

      this._root.setAttribute('aria-label', this.getAttribute('label') || texts.label);
      this._root.classList.toggle('is-single', this.hasAttribute('hide-single') && total != null && total <= 1);
      this._root.classList.toggle('is-disabled', disabled);
      this._root.classList.toggle('has-summary', showSummary);
      this._root.classList.toggle('is-wrapping', mode === 'never');
      this._root.classList.toggle('is-bare', !sizes.length && !showSummary);

      /* ---- meta: page-size select and summary ---- */
      // the select is only rebuilt when something about it changes, so it keeps its focus and open state
      const sizeKey = sizes.length
        ? [sizes.join(','), disabled, this.getAttribute('size'), texts.pageSize, Boolean(customElements.get('kakao-select'))].join('|')
        : '';
      if (sizeKey !== this._sizeKey) {
        this._sizeKey = sizeKey;
        this._sizeSlot.replaceChildren(...(sizes.length ? [this._sizeField(sizes, disabled)] : []));
      }
      const field = this._sizeSlot.querySelector('select, kakao-select');
      if (field && field.value !== String(this.pageSize)) field.value = String(this.pageSize);
      const summaryText = this._summaryText();
      if (this._summary.textContent !== summaryText) this._summary.textContent = summaryText;

      /* ---- the controls ---- */
      const items = [];
      const add = (el, cls) => {
        const li = document.createElement('li');
        li.className = cls;
        li.append(el);
        items.push(li);
      };
      const iconControl = (kind, target, enabled) => {
        const el = this._control(kind, target, enabled);
        el.setAttribute('part', 'control');
        el.setAttribute('aria-label', texts[kind]);
        el.innerHTML = ICONS[kind];
        return el;
      };
      const edges = this.hasAttribute('first-last') && total != null;

      if (edges) add(iconControl('first', 1, page > 1), 'is-edge');
      add(iconControl('previous', Math.max(1, page - 1), page > 1), 'is-step');
      if (total != null) {
        windowOf(page, Math.max(1, total), toInt(this.getAttribute('siblings'), 1, 0), toInt(this.getAttribute('boundaries'), 1, 0)).forEach((entry) => {
          if (entry === 'gap') {
            const gap = document.createElement('span');
            gap.className = 'gap';
            gap.setAttribute('part', 'gap');
            gap.innerHTML = ICONS.gap;
            add(gap, 'is-gap');
            items[items.length - 1].setAttribute('aria-hidden', 'true');
            return;
          }
          const el = this._control('page', entry, true);
          el.setAttribute('part', entry === page ? 'control page current' : 'control page');
          el.setAttribute('aria-label', fill(texts.page, { page: entry }));
          if (entry === page) el.setAttribute('aria-current', 'page');
          el.textContent = String(entry);
          add(el, 'is-page');
        });
      }
      add(iconControl('next', page + 1, page < lastPage), 'is-step');
      if (edges) add(iconControl('last', lastPage, page < lastPage), 'is-edge');
      this._list.replaceChildren(...items);

      this._measure();

      if (focusKey) {
        const target = focusKey === 'size'
          ? this._meta.querySelector('select, kakao-select')
          : this._list.querySelector(`[data-key="${focusKey}"]`) || this._list.querySelector('[aria-current]');
        const shown = target && target.closest('li') ? target.closest('li').offsetParent !== null : Boolean(target);
        if (shown && target.matches('button, [href], select, kakao-select')) target.focus();
        else {
          const fallback = this._list.querySelector('.is-step .control:not([aria-disabled="true"])');
          if (fallback) fallback.focus();
        }
      }
    }

    /** "Rows per page" with a native select, or a kakao-select where that element is defined. */
    _sizeField(sizes, disabled) {
      const label = document.createElement('label');
      label.className = 'size';
      const text = document.createElement('span');
      text.className = 'size-label';
      text.textContent = texts.pageSize;
      const box = document.createElement('span');
      box.className = 'select-box';
      const current = String(this.pageSize);
      if (customElements.get('kakao-select')) {
        const select = document.createElement('kakao-select');
        select.setAttribute('part', 'page-size');
        select.setAttribute('aria-label', texts.pageSize);
        select.setAttribute('size', this.getAttribute('size') === 'lg' ? 'lg' : this.getAttribute('size') === 'sm' ? 'sm' : 'md');
        select.setAttribute('list-data', JSON.stringify(sizes.map(String)));
        select.setAttribute('value', current);
        if (disabled) select.setAttribute('disabled', '');
        box.append(select);
      } else {
        const select = document.createElement('select');
        select.setAttribute('part', 'page-size');
        sizes.forEach((size) => {
          const option = document.createElement('option');
          option.value = String(size);
          option.textContent = String(size);
          select.append(option);
        });
        select.value = current;
        select.disabled = disabled;
        box.append(select);
        box.insertAdjacentHTML('beforeend', ICONS.caret);
      }
      label.append(text, box);
      return label;
    }

    /** Compact when asked for, when open-ended, or when the page numbers do not fit the element. */
    _measure() {
      const mode = this.getAttribute('collapse') || 'auto';
      let compact = false;
      if (this.totalPages == null || mode === 'always') compact = true;
      else if (mode !== 'never') {
        this._root.classList.remove('is-compact'); // measured in the full form
        const available = this._root.clientWidth;
        if (available > 0) {
          const gap = parseFloat(getComputedStyle(this._list).columnGap) || 0;
          const children = Array.from(this._list.children);
          const needed = children.reduce((sum, li) => sum + li.getBoundingClientRect().width, 0) + gap * Math.max(0, children.length - 1);
          compact = needed > available + 0.5;
        }
      }
      this._compact = compact;
      this._root.classList.toggle('is-compact', compact);
    }
  }

  KakaoPagination.TEXTS = TEXTS; // the built-in words, read-only

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }

  window.KakaoPagination = KakaoPagination;
  customElements.define(TAG_NAME, KakaoPagination);
})();
