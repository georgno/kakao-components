/**
 * <kakao-error-page>
 * ============================================================================
 * An error page: 404, 500, 503 maintenance … The page passes the facts as
 * attributes, the component draws them: the status code very large and as a
 * diagonal repeating pattern in the background, the error's heading, a
 * message, reference information in muted text, and the page's actions.
 * Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="error-page.js"><\/script>
 *
 *   <kakao-error-page code="404" message="The page may have moved or never existed."></kakao-error-page>
 *
 *   <kakao-error-page full code="500" heading="Something went wrong"
 *       reference="req-7f3a9c" time="2026-11-15T09:42:00Z">
 *     We have been told about it. Please try again in a few minutes.
 *     <kakao-button slot="actions" href="/" label="Go home"></kakao-button>
 *   </kakao-error-page>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  code             The status code or a short word ("404", "Offline").
 *                   Drawn large and as the background pattern.
 *  heading          The error's name. Without it, common codes get an English
 *                   default (400, 401, 403, 404, 405, 408, 410, 429, 500, 502,
 *                   503, 504), anything else "Something went wrong".
 *  heading-level    Level of the heading element, 1 (default) to 6. The error
 *                   is usually the page's main content, hence h1.
 *  code-label       Hidden word read before the code. Default "Error", so the
 *                   heading reads "Error 404: Page not found".
 *  message          The explanation. Content in the default slot replaces it.
 *  reference        A request or trace id for support. One click selects it.
 *  reference-label  Its label. Default "Reference".
 *  time             When it happened, or until when (maintenance). An ISO
 *                   date or date-time is shown in the nearest lang inside a
 *                   <time datetime>; any other text is shown as written.
 *  time-label       Its label. Default "Time".
 *  list-data        More label/value rows, JSON: [["Path", "/invoices/77"]].
 *  full             Fills the viewport height below the header bar, no frame,
 *                   on the page background. Default: an embedded box.
 *  no-pattern       No background pattern.
 *
 * SLOTS: default (the message), actions (buttons or links, in a wrapping
 * centred row), details (longer content below, aligned to the start).
 *
 * The heading element holds the big code and the title, so heading
 * navigation finds both. The background pattern is decorative: aria-hidden,
 * not selectable, ignores the pointer, and is left out in forced colours and
 * print. It is rows of the code text, rotated; the script only counts how
 * many rows cover the box (a ResizeObserver recounts on resize and when the
 * font or spacing settings change).
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-error-page-surface / -full-surface / -border / -text / -muted
 *  --kakao-error-page-code-color / -code-size / -code-weight
 *  --kakao-error-page-heading-size / -heading-weight / -font-size
 *  --kakao-error-page-pattern-color / -pattern-opacity / -pattern-size
 *  --kakao-error-page-pattern-weight / -pattern-angle / -pattern-gap
 *  --kakao-error-page-pattern-line-height
 *  --kakao-error-page-radius / -padding / -gap / -max-width
 *  --kakao-error-page-min-height / -full-height
 *  Keep the pattern opacity low: text sits on top of it.
 *
 * Parts: page, pattern, content, heading, code, title, message, info,
 * actions, details.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-error-page';
  if (customElements.get(TAG_NAME)) return;

  const HEADINGS = {
    400: 'Bad request',
    401: 'Sign-in required',
    403: 'Access denied',
    404: 'Page not found',
    405: 'Not allowed',
    408: 'Request timed out',
    410: 'Page gone',
    429: 'Too many requests',
    500: 'Something went wrong',
    502: 'Bad gateway',
    503: 'Service unavailable',
    504: 'Gateway timed out',
  };
  const FALLBACK_HEADING = 'Something went wrong';
  const MAX_COUNT = 200;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-error-page- (written by construction.html, edit there) */
        --_surface: var(--kakao-error-page-surface, var(--kakao-color-bg, #ffffff));
        --_full-surface: var(--kakao-error-page-full-surface, transparent);
        --_border: var(--kakao-error-page-border, var(--kakao-color-line, #e5e7eb));
        --_text: var(--kakao-error-page-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-error-page-muted, var(--kakao-color-muted, #62626c));
        --_code-color: var(--kakao-error-page-code-color, var(--kakao-color-primary, #4f46e5));
        --_code-size: var(--kakao-error-page-code-size, clamp(4.5rem, 20vw, 9rem));
        --_code-weight: var(--kakao-error-page-code-weight, 700);
        --_heading-size: var(--kakao-error-page-heading-size, 1.5rem);
        --_heading-weight: var(--kakao-error-page-heading-weight, 600);
        --_font-size: var(--kakao-error-page-font-size, var(--kakao-font-size, 0.95rem));
        --_pattern-color: var(--kakao-error-page-pattern-color, var(--kakao-color-primary, #4f46e5));
        --_pattern-opacity: var(--kakao-error-page-pattern-opacity, 0.07);
        --_pattern-size: var(--kakao-error-page-pattern-size, 1.75rem);
        --_pattern-weight: var(--kakao-error-page-pattern-weight, 700);
        --_pattern-angle: var(--kakao-error-page-pattern-angle, -30deg);
        --_pattern-gap: var(--kakao-error-page-pattern-gap, 1em);
        --_pattern-line-height: var(--kakao-error-page-pattern-line-height, 2.2);
        --_radius: var(--kakao-error-page-radius, 10px);
        --_padding: var(--kakao-error-page-padding, clamp(1.5rem, 6vw, 3rem));
        --_gap: var(--kakao-error-page-gap, 0.75rem);
        --_max-width: var(--kakao-error-page-max-width, 36rem);
        --_min-height: var(--kakao-error-page-min-height, 20rem);
        --_full-height: var(--kakao-error-page-full-height, calc(100dvh - var(--kakao-header-bar-rendered-height, 0px)));
        /* @kakao-settings:end */
        display: block;
        color: var(--_text);
        font-size: var(--_font-size);
      }
      :host([hidden]) { display: none; }

      .page {
        position: relative;
        display: grid;
        place-items: center;
        box-sizing: border-box;
        min-height: var(--_min-height);
        padding: var(--_padding);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        background: var(--_surface);
        overflow: hidden;
        isolation: isolate;
        line-height: 1.5;
      }
      :host([full]) .page {
        min-height: var(--_full-height);
        border: 0;
        border-radius: 0;
        background: var(--_full-surface);
      }

      /* ---- Pattern: rows of the code, rotated around the centre ---- */
      .pattern {
        position: absolute;
        inset: 0;
        z-index: -1;
        overflow: hidden;
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
        opacity: var(--_pattern-opacity);
        color: var(--_pattern-color);
      }
      .pattern[hidden] { display: none; }
      .tiles, .measure {
        font-size: var(--_pattern-size);
        font-weight: var(--_pattern-weight);
        line-height: var(--_pattern-line-height);
        word-spacing: var(--_pattern-gap);
        font-variant-numeric: tabular-nums;
        white-space: pre;
      }
      .tiles {
        position: absolute;
        top: 50%;
        left: 50%;
        width: var(--_side, 200%);
        height: var(--_side, 200%);
        transform: translate(-50%, -50%) rotate(var(--_pattern-angle));
      }
      .tiles div:nth-child(even) { margin-inline-start: calc(var(--_cell, 0px) * -0.5); }
      .measure {
        position: absolute;
        top: 0;
        left: 0;
        visibility: hidden;
      }

      /* ---- Content ---- */
      .content {
        display: grid;
        justify-items: center;
        gap: var(--_gap);
        width: 100%;
        max-width: var(--_max-width);
        min-width: 0;
        text-align: center;
        overflow-wrap: anywhere;
      }
      .heading {
        display: grid;
        justify-items: center;
        gap: calc(var(--_gap) * 0.5);
        margin: 0;
        font: inherit;
      }
      .code {
        display: block;
        color: var(--_code-color);
        font-size: var(--_code-size);
        font-weight: var(--_code-weight);
        line-height: 1;
        letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums;
      }
      .code[hidden] { display: none; }
      .title {
        display: block;
        font-size: var(--_heading-size);
        font-weight: var(--_heading-weight);
        line-height: 1.25;
      }
      .sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      .message { max-width: 32rem; }
      .message ::slotted(*) { margin-block: 0; }
      .message ::slotted(* + *) { margin-top: 0.5em; }
      .message[hidden] { display: none; }

      .info {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.25rem 1.25rem;
        margin: 0;
        color: var(--_muted);
        font-size: 0.875em;
      }
      .info[hidden] { display: none; }
      .info > div { display: flex; gap: 0.4em; min-width: 0; }
      .info dt { font-weight: 600; }
      .info dd { margin: 0; font-variant-numeric: tabular-nums; }
      .info dd[data-select] { user-select: all; -webkit-user-select: all; }

      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.5rem;
        margin-top: calc(var(--_gap) * 0.5);
      }
      .details {
        justify-self: stretch;
        text-align: start;
        margin-top: calc(var(--_gap) * 0.5);
      }
      .actions[hidden], .details[hidden] { display: none; }

      @media (forced-colors: active) {
        .pattern { display: none; }
        .code { color: CanvasText; }
      }
      @media print {
        .pattern { display: none; }
      }
    </style>
    <div class="page" part="page">
      <div class="pattern" part="pattern" aria-hidden="true">
        <div class="tiles"></div>
        <span class="measure"></span>
      </div>
      <div class="content" part="content">
        <h1 class="heading" part="heading"></h1>
        <div class="message" part="message"><span class="message-text"></span><slot></slot></div>
        <dl class="info" part="info" hidden></dl>
        <div class="actions" part="actions" hidden><slot name="actions"></slot></div>
        <div class="details" part="details" hidden><slot name="details"></slot></div>
      </div>
    </div>
  `;

  /** The language that applies to the element: nearest lang attribute. */
  function langOf(el) {
    const host = el.closest('[lang]');
    return (host && host.lang) || document.documentElement.lang || undefined;
  }

  class KakaoErrorPage extends HTMLElement {
    static get observedAttributes() {
      return ['code', 'heading', 'heading-level', 'code-label', 'message', 'reference',
        'reference-label', 'time', 'time-label', 'list-data', 'no-pattern'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._page = shadow.querySelector('.page');
      this._pattern = shadow.querySelector('.pattern');
      this._tiles = shadow.querySelector('.tiles');
      this._measure = shadow.querySelector('.measure');
      this._content = shadow.querySelector('.content');
      this._messageBox = shadow.querySelector('.message');
      this._messageText = shadow.querySelector('.message-text');
      this._info = shadow.querySelector('.info');
      this._actions = shadow.querySelector('.actions');
      this._details = shadow.querySelector('.details');
      this._slots = {
        message: shadow.querySelector('slot:not([name])'),
        actions: shadow.querySelector('slot[name="actions"]'),
        details: shadow.querySelector('slot[name="details"]'),
      };
      Object.values(this._slots).forEach((slot) => slot.addEventListener('slotchange', () => this._renderSlots()));
      this._patternKey = '';
      this._ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this._layoutPattern()) : null;
    }

    connectedCallback() {
      this._render();
      if (this._ro) {
        this._ro.observe(this._page);
        this._ro.observe(this._measure);
      }
    }

    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || oldValue === newValue) return;
      this._render();
    }

    /* ---------------------------- Rendering --------------------------- */

    get _code() { return (this.getAttribute('code') || '').trim(); }

    _render() {
      this._renderHeading();
      this._renderSlots();
      this._renderInfo();
      this._renderPattern();
    }

    _renderHeading() {
      const raw = parseInt(this.getAttribute('heading-level'), 10);
      const level = raw >= 1 && raw <= 6 ? raw : 1;
      let heading = this._content.firstElementChild;
      if (heading.localName !== `h${level}`) {
        const next = document.createElement(`h${level}`);
        next.className = 'heading';
        next.setAttribute('part', 'heading');
        heading.replaceWith(next);
        heading = next;
      }
      const code = this._code;
      const title = this.getAttribute('heading') || HEADINGS[code] || FALLBACK_HEADING;
      const label = this.getAttribute('code-label') ?? 'Error';
      const parts = [];
      if (code) {
        const codeEl = document.createElement('span');
        codeEl.className = 'code';
        codeEl.setAttribute('part', 'code');
        if (label) codeEl.append(this._sr(`${label} `));
        codeEl.append(code, this._sr(': '));
        parts.push(codeEl);
      }
      const titleEl = document.createElement('span');
      titleEl.className = 'title';
      titleEl.setAttribute('part', 'title');
      titleEl.textContent = title;
      parts.push(titleEl);
      heading.replaceChildren(...parts);
    }

    _sr(text) {
      const span = document.createElement('span');
      span.className = 'sr';
      span.textContent = text;
      return span;
    }

    _renderSlots() {
      const filled = (slot) => slot.assignedNodes().some((n) => n.nodeType === 1 || n.textContent.trim());
      // Slotted text replaces the attribute (whitespace between slotted
      // elements does not count, so it is not a <slot> fallback).
      const message = this.getAttribute('message') || '';
      const slotted = filled(this._slots.message);
      this._messageText.textContent = slotted ? '' : message;
      this._messageText.hidden = slotted;
      this._messageBox.hidden = !message && !slotted;
      this._actions.hidden = !filled(this._slots.actions);
      this._details.hidden = !filled(this._slots.details);
    }

    _renderInfo() {
      const rows = [];
      const reference = (this.getAttribute('reference') || '').trim();
      if (reference) rows.push({ label: this.getAttribute('reference-label') || 'Reference', value: reference, select: true });
      const time = (this.getAttribute('time') || '').trim();
      if (time) rows.push({ label: this.getAttribute('time-label') || 'Time', value: time, time: true });
      let extra = [];
      try {
        const parsed = JSON.parse(this.getAttribute('list-data') || '[]');
        if (Array.isArray(parsed)) extra = parsed;
      } catch (e) { /* invalid list-data is ignored */ }
      extra.forEach((row) => {
        if (!Array.isArray(row)) return;
        const [label, value] = row;
        if (value != null && String(value).trim()) rows.push({ label: label == null ? '' : String(label), value: String(value) });
      });

      this._info.replaceChildren(...rows.map((row) => {
        const wrap = document.createElement('div');
        const dt = document.createElement('dt');
        dt.textContent = row.label;
        const dd = document.createElement('dd');
        if (row.select) dd.dataset.select = '';
        if (row.time) dd.append(this._timeNode(row.value));
        else dd.textContent = row.value;
        wrap.append(dt, dd);
        return wrap;
      }));
      this._info.hidden = rows.length === 0;
    }

    /** An ISO date or date-time becomes a formatted <time>; other text stays. */
    _timeNode(value) {
      const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
      const isoDateTime = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value);
      const date = isoDate ? new Date(`${value}T00:00:00`) : new Date(value);
      if (!(isoDate || isoDateTime) || Number.isNaN(date.getTime())) return document.createTextNode(value);
      const el = document.createElement('time');
      el.setAttribute('datetime', value);
      try {
        el.textContent = new Intl.DateTimeFormat(langOf(this), isoDate
          ? { dateStyle: 'medium' }
          : { dateStyle: 'medium', timeStyle: 'short' }).format(date);
      } catch (e) {
        el.textContent = value;
      }
      return el;
    }

    /* ----------------------------- Pattern ---------------------------- */

    _renderPattern() {
      const code = this._code;
      const off = !code || this.hasAttribute('no-pattern');
      this._pattern.hidden = off;
      if (off) { this._tiles.replaceChildren(); this._patternKey = ''; return; }
      // Ten cells: their width / 10 is one cell (code + space + gap).
      this._measure.textContent = `${code} `.repeat(10);
      this._patternKey = '';
      this._layoutPattern();
    }

    /** Enough staggered rows to cover the rotated square over the box. */
    _layoutPattern() {
      if (this._pattern.hidden) return;
      const code = this._code;
      const box = this._page.getBoundingClientRect();
      const cell = this._measure.offsetWidth / 10;
      const line = this._measure.offsetHeight;
      if (!box.width || !box.height || !cell || !line) return;
      const side = Math.ceil(Math.hypot(box.width, box.height) + 2 * cell);
      const rows = Math.min(MAX_COUNT, Math.ceil(side / line) + 1);
      const per = Math.min(MAX_COUNT, Math.ceil(side / cell) + 2);
      this._tiles.style.setProperty('--_side', `${side}px`);
      this._tiles.style.setProperty('--_cell', `${cell}px`);
      const key = `${code}|${rows}|${per}`;
      if (key === this._patternKey) return;
      this._patternKey = key;
      const text = `${code} `.repeat(per);
      const lines = [];
      for (let i = 0; i < rows; i++) {
        const row = document.createElement('div');
        row.textContent = text;
        lines.push(row);
      }
      this._tiles.replaceChildren(...lines);
    }
  }

  customElements.define(TAG_NAME, KakaoErrorPage);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }
})();
