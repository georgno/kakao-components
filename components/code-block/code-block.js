/**
 * <kakao-code-block>
 * ============================================================================
 * Preformatted text: a snippet of code, a config file, a command's output, a
 * running log. Monospace in the theme's colours, scrolling past a maximum
 * height (or wrapping long lines), with an optional label row and a copy
 * button. In log mode it follows the end as lines arrive, unless the reader
 * scrolled up. The content is always shown as text, never as HTML.
 * Vanilla JS, Shadow DOM; the copy button is kakao-copy-button.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        Code, preformatted text or a running log, with copy.
 *  not for    Code in a sentence (file:line): kakao-code; editable text: kakao-textarea.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     code-block.js
 *  css        none
 *  requires   copy-button
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="../copy-button/copy-button.js" defer><\/script>
 *   <script src="code-block.js" defer><\/script>
 *
 *   <kakao-code-block label="Install" language="sh"><pre>
 *   npm install
 *   npm test
 *   </pre></kakao-code-block>
 *
 *   <kakao-code-block mode="log" label="Build output" max-lines="500"></kakao-code-block>
 *   log.append('Compiling 12 files…\n');
 *
 * The content is the element's text: leading and trailing blank lines and the
 * indentation all lines share are removed, so it can be indented with the
 * markup. Write < and & as &lt; and &amp; (a server's HTML escaping does
 * that); a <pre> inside keeps the line breaks before the script runs. Tags in
 * the content are not shown, only their text. From a script, set `text` or
 * call append(): both take plain text and never parse it as HTML.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  label         The label row's title (a file name, "Output") and the
 *                scroller's accessible name. Default name "Code" ("Log").
 *  language      Shown in the label row ("sh", "json"); display only, there
 *                is no highlighting.
 *  mode          code (default) · log. log: follows the end, drops old lines
 *                past max-lines, overwrites a line on a carriage return and
 *                drops ANSI colour codes.
 *  wrap          Wraps long lines instead of scrolling sideways.
 *  max-height    Height cap, any CSS length ("none": no cap). Default from
 *                the settings (24rem). Taller content scrolls.
 *  max-lines     Log mode: the most lines it keeps; older ones are dropped.
 *                Default 1000; 0 keeps all.
 *  no-copy       No copy button.
 *  copy-label    The copy button's name. Default "Copy" + the label, else
 *                "Copy code" ("Copy log").
 *  latest-label  The button that scrolls a log back to its end. Default
 *                "Jump to latest".
 *  announce      Log mode: screen readers read new lines as they arrive (a
 *                polite live log). Off by default: a busy log would talk
 *                without pause.
 *  hidden        Not shown.
 *
 * ----------------------------------------------------------------------------
 * PROPERTIES
 * ----------------------------------------------------------------------------
 *  text          get / set: the whole text. Setting replaces it (as plain
 *                text; the markup's text is not read again until it changes).
 *  following     true while a log stays at its end (read-only).
 *
 * ----------------------------------------------------------------------------
 * METHODS
 * ----------------------------------------------------------------------------
 *  append(text)   Adds text at the end, as plain text. Include the "\n": a
 *                 chunk without one continues the last line.
 *  clear()        Empties the block (and follows the end again).
 *  scrollToEnd()  Scrolls to the end; a log follows again.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  follow-change  detail { following }   a log stopped following the end
 *                                         (the reader scrolled up) or follows
 *                                         again
 *
 * ----------------------------------------------------------------------------
 * BEHAVIOUR
 * ----------------------------------------------------------------------------
 *  - The label row shows with a label or a language. The copy button sits at
 *    its end, or in the top corner without one; it copies the whole text,
 *    also what is scrolled out of view, and hides while the block is empty.
 *  - The scroller takes focus (Tab) only while its content overflows, with
 *    the focus outline; the arrow keys, Page Up / Down, Home and End scroll it.
 *  - Log mode follows the end while text is appended. Scrolling up stops it
 *    and keeps the reader's place, also when old lines are dropped above; a
 *    "Jump to latest" button then brings it back (as do End and scrolling to
 *    the end). The button fades in; under reduced motion it does not move.
 *  - Text set through markup after load replaces what is shown.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-code-block-font / -font-size / -line-height / -tab-size
 *  --kakao-code-block-bg / -text / -border / -radius
 *  --kakao-code-block-padding-x / -padding-y / -max-height
 *  --kakao-code-block-head-text / -head-size / -head-weight / -language / -divider
 *  --kakao-code-block-copy-inset         space around the copy button
 *  --kakao-code-block-latest-bg / -latest-text / -latest-shadow / -focus / -duration
 *
 * Parts: box, head, label, language, scroller, pre, code, copy, latest.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-code-block';
  if (customElements.get(TAG_NAME)) return;

  const DEFAULT_MAX_LINES = 1000;
  const END_SLACK = 4; // px from the end that still count as "at the end"
  // ANSI escape sequences (colours, cursor moves) a log may carry.
  const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g;

  const ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 3v10M4 9l4 4 4-4"/></svg>';

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-code-block- (written by construction.html, edit there) */
        --_font: var(--kakao-code-block-font, var(--kakao-font-mono, ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace));
        --_font-size: var(--kakao-code-block-font-size, 0.875rem);
        --_line-height: var(--kakao-code-block-line-height, 1.6);
        --_tab-size: var(--kakao-code-block-tab-size, 4);
        --_bg: var(--kakao-code-block-bg, var(--kakao-color-subtle, #f0f0f1));
        --_text: var(--kakao-code-block-text, var(--kakao-color-text, #18181b));
        --_border: var(--kakao-code-block-border, var(--kakao-color-line, #e5e7eb));
        --_radius: var(--kakao-code-block-radius, var(--kakao-radius-md, 10px));
        --_padding-x: var(--kakao-code-block-padding-x, 1rem);
        --_padding-y: var(--kakao-code-block-padding-y, 0.75rem);
        --_max-height: var(--kakao-code-block-max-height, 24rem);
        --_head-text: var(--kakao-code-block-head-text, var(--kakao-color-text-soft, #3f3f46));
        --_head-size: var(--kakao-code-block-head-size, 0.8125rem);
        --_head-weight: var(--kakao-code-block-head-weight, 550);
        --_language: var(--kakao-code-block-language, var(--kakao-color-muted, #62626c));
        --_divider: var(--kakao-code-block-divider, var(--kakao-color-line, #e5e7eb));
        --_copy-inset: var(--kakao-code-block-copy-inset, 4px);
        --_latest-bg: var(--kakao-code-block-latest-bg, var(--kakao-color-ink, #18181b));
        --_latest-text: var(--kakao-code-block-latest-text, var(--kakao-color-on-ink, #fafafa));
        --_latest-shadow: var(--kakao-code-block-latest-shadow, 0 4px 12px rgb(0 0 0 / .14), 0 0 0 1px color-mix(in srgb, var(--kakao-color-text, #18181b) 10%, transparent));
        --_focus: var(--kakao-code-block-focus, var(--kakao-color-focus, #2563eb));
        --_duration: var(--kakao-code-block-duration, 150ms);
        /* @kakao-settings:end */
        /* The copy button is kakao-copy-button at size sm: room is kept for it. */
        --_copy-size: var(--kakao-copy-button-sm-height, 36px);
        --_scrollbar: 0px;
        display: block;
        min-width: 0;
      }
      :host([hidden]) { display: none; }

      .box {
        position: relative;
        box-sizing: border-box;
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        background: var(--_bg);
        color: var(--_text);
      }

      .head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        box-sizing: border-box;
        min-height: calc(var(--_copy-size) + 2 * var(--_copy-inset));
        padding: 0.25rem var(--_padding-x);
        border-bottom: 1px solid var(--_divider);
        font-family: var(--kakao-font-family, system-ui, -apple-system, "Segoe UI", sans-serif);
        font-size: var(--_head-size);
        line-height: 1.35;
      }
      .head[hidden] { display: none; }
      .box.copy-on .head { padding-inline-end: calc(var(--_copy-size) + 2 * var(--_copy-inset)); }
      .label {
        flex: 1 1 auto;
        min-width: 0;
        color: var(--_head-text);
        font-weight: var(--_head-weight);
        overflow-wrap: anywhere;
      }
      .language {
        flex: none;
        margin-inline-start: auto;
        color: var(--_language);
      }
      .label:empty, .language:empty { display: none; }

      .scroller {
        overflow: auto;
        max-height: var(--_max-height);
        border-radius: inherit;
        /* The script keeps a scrolled-up reader's place when old lines go;
           the browser's own scroll anchoring would move it a second time. */
        overflow-anchor: none;
        /* The keyboard can scroll it; the outline marks where. */
        outline: none;
      }
      .box.has-head .scroller { border-start-start-radius: 0; border-start-end-radius: 0; }
      .scroller:focus-visible { outline: 2px solid var(--_focus); outline-offset: -2px; }

      pre {
        box-sizing: border-box;
        width: max-content;
        min-width: 100%;
        margin: 0;
        padding: var(--_padding-y) var(--_padding-x);
        font-family: var(--_font);
        font-size: var(--_font-size);
        line-height: var(--_line-height);
        letter-spacing: normal;
        tab-size: var(--_tab-size);
        white-space: pre;
        color: inherit;
      }
      /* Without a label row the copy button sits in the corner: keep the text clear of it. */
      .box.copy-on:not(.has-head) pre {
        padding-inline-end: calc(var(--_copy-size) + 2 * var(--_copy-inset));
      }
      :host([wrap]) pre {
        width: auto;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      code { font: inherit; }

      .copy {
        position: absolute;
        top: 0;
        right: var(--_scrollbar);
        display: flex;
        padding: var(--_copy-inset);
        border-start-end-radius: var(--_radius);
        /* Lines scrolled sideways pass under it: the block's fill, fading in
           from the left, keeps them from showing through around the button. */
        background: var(--_bg);
      }
      .copy::before {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        right: 100%;
        width: 0.75rem;
        background: linear-gradient(to right, transparent, var(--_bg));
        pointer-events: none;
      }
      .copy[hidden], kakao-copy-button:not(:defined) { display: none; }
      .box.has-head .copy { right: 0; background: none; }
      .box.has-head .copy::before { display: none; }

      .latest {
        position: absolute;
        left: 50%;
        bottom: 0.75rem;
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        height: 32px;
        margin: 0;
        padding: 0 0.875rem 0 0.75rem;
        border: 0;
        border-radius: var(--kakao-radius-pill, 999px);
        background: var(--_latest-bg);
        color: var(--_latest-text);
        box-shadow: var(--_latest-shadow);
        font-family: var(--kakao-font-family, system-ui, -apple-system, "Segoe UI", sans-serif);
        font-size: 0.8125rem;
        font-weight: 550;
        line-height: 1;
        white-space: nowrap;
        cursor: pointer;
        transform: translateX(-50%);
        animation: latest-in var(--_duration) var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1));
      }
      .latest[hidden] { display: none; }
      .latest:focus { outline: none; }
      .latest:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; }
      .latest svg {
        width: 14px;
        height: 14px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      @keyframes latest-in {
        from { opacity: 0; transform: translate(-50%, 6px); }
      }
      @keyframes latest-fade {
        from { opacity: 0; }
      }

      @media (prefers-reduced-motion: reduce) {
        .latest { animation-name: latest-fade; }
      }
      @media (forced-colors: active) {
        .box { border-color: CanvasText; }
        .latest { border: 1px solid ButtonText; }
      }
    </style>
    <div class="box" part="box">
      <div class="head" part="head" hidden>
        <span class="label" part="label"></span>
        <span class="language" part="language"></span>
      </div>
      <div class="scroller" part="scroller">
        <pre part="pre"><code part="code"></code></pre>
      </div>
      <span class="copy" hidden><kakao-copy-button part="copy" variant="ghost" size="sm"></kakao-copy-button></span>
      <button class="latest" part="latest" type="button" hidden>${ARROW}<span></span></button>
    </div>
  `;

  /** The markup's text: blank lines around it and the shared indentation removed. */
  function fromMarkup(raw) {
    const lines = raw.replace(/\r\n?/g, '\n').split('\n');
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    let cut = Infinity;
    for (const line of lines) {
      if (line.trim()) cut = Math.min(cut, line.match(/^[ \t]*/)[0].length);
    }
    if (!Number.isFinite(cut)) cut = 0;
    return lines.map((line) => line.slice(cut)).join('\n');
  }

  class KakaoCodeBlock extends HTMLElement {
    static get observedAttributes() {
      return ['label', 'language', 'mode', 'max-height', 'max-lines', 'no-copy', 'copy-label', 'latest-label', 'announce', 'wrap'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._box = shadow.querySelector('.box');
      this._head = shadow.querySelector('.head');
      this._label = shadow.querySelector('.label');
      this._language = shadow.querySelector('.language');
      this._scroller = shadow.querySelector('.scroller');
      this._code = shadow.querySelector('code');
      this._copyWrap = shadow.querySelector('.copy');
      this._copy = shadow.querySelector('kakao-copy-button');
      this._latest = shadow.querySelector('.latest');
      this._latestText = this._latest.querySelector('span');

      this._following = true;
      this._lastTop = 0;
      this._exactTop = null;
      this._crPending = false;
      this._frame = 0;
      this._ready = false;

      // The copy button copies what the block holds at the moment of the click
      // (capture: before the button's own handler reads its value).
      this._copyWrap.addEventListener('click', () => { this._copy.value = this.text; }, true);
      this._scroller.addEventListener('scroll', () => this._onScroll(), { passive: true });
      this._latest.addEventListener('click', () => {
        this.scrollToEnd();
        this._scroller.focus({ preventScroll: true });
      });
      this._observer = new MutationObserver(() => this._readMarkup());
      this._resize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this._queueLayout()) : null;
    }

    connectedCallback() {
      this._ready = true;
      this._render();
      this._readMarkup();
      this._observer.observe(this, { childList: true, characterData: true, subtree: true });
      if (this._resize) {
        this._resize.observe(this._scroller);
        this._resize.observe(this._code);
      }
    }

    disconnectedCallback() {
      this._ready = false;
      this._observer.disconnect();
      if (this._resize) this._resize.disconnect();
      cancelAnimationFrame(this._frame);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this._ready || oldValue === newValue) return;
      if (name === 'max-lines') this._trim();
      this._render();
      this._queueLayout();
    }

    /* ------------------------------ API ------------------------------- */

    get text() { return this._code.textContent; }
    set text(value) {
      this._replace(value === null || value === undefined ? '' : String(value));
    }

    get following() { return this._following; }

    append(text) {
      if (text === null || text === undefined) return;
      this._write(String(text));
      this._afterWrite();
    }

    clear() {
      this._replace('');
    }

    scrollToEnd() {
      const s = this._scroller;
      s.scrollTop = s.scrollHeight;
      this._lastTop = s.scrollTop;
      this._setFollowing(true);
    }

    /* ---------------------------- Content ----------------------------- */

    _isLog() { return this.getAttribute('mode') === 'log'; }

    _maxLines() {
      if (!this._isLog()) return 0;
      if (!this.hasAttribute('max-lines')) return DEFAULT_MAX_LINES;
      const n = parseInt(this.getAttribute('max-lines'), 10);
      return Number.isFinite(n) && n >= 0 ? n : DEFAULT_MAX_LINES;
    }

    _readMarkup() {
      if (!this._ready) return;
      this._replace(fromMarkup(this.textContent || ''));
    }

    _replace(text) {
      this._code.replaceChildren();
      this._crPending = false;
      this._write(text);
      this._following = true;
      this._afterWrite(true);
    }

    /**
     * Writes plain text at the end, one text node per line (a finished line
     * ends with "\n"; the last one may be open). Only text nodes: nothing in
     * the text is ever parsed as HTML.
     */
    _write(text) {
      const log = this._isLog();
      let input = text.replace(/\r\n/g, '\n');
      if (log) input = input.replace(ANSI, '');
      else input = input.replace(/\r/g, '\n');
      const parts = input.split('\n');
      parts.forEach((piece, i) => {
        const closes = i < parts.length - 1;
        let node = this._code.lastChild;
        const open = node && !node.data.endsWith('\n');
        if (!open) {
          if (!closes && piece === '') return; // nothing after the last line break
          node = document.createTextNode('');
          this._code.append(node);
        }
        const line = log ? this._overwrite(open ? node.data : '', piece) : (open ? node.data : '') + piece;
        if (closes) this._crPending = false;
        node.data = closes ? `${line}\n` : line;
      });
      this._trim();
    }

    /** A carriage return starts the line again (progress counters). */
    _overwrite(current, piece) {
      if (!piece) return current;
      const segments = piece.split('\r');
      let line = this._crPending ? '' : current;
      this._crPending = false;
      line += segments[0];
      for (let i = 1; i < segments.length; i++) {
        if (i === segments.length - 1 && segments[i] === '') {
          // A trailing return: the line stays until the next text replaces it.
          this._crPending = true;
          break;
        }
        line = segments[i];
      }
      return line;
    }

    /** Log mode: drops the oldest lines past max-lines, keeping a scrolled-up reader's place. */
    _trim() {
      const max = this._maxLines();
      const code = this._code;
      const drop = code.childNodes.length - max;
      if (!max || drop <= 0) return;
      const s = this._scroller;
      const keepPlace = !this._following && s.scrollTop > 0;
      // The first kept line moves up by the height of what goes: measured on
      // the line itself, in fractions (scrollHeight is rounded).
      const range = keepPlace ? document.createRange() : null;
      let before = 0;
      if (range) {
        range.selectNode(code.childNodes[drop]);
        before = range.getBoundingClientRect().top;
      }
      while (code.childNodes.length > max) code.firstChild.remove();
      if (range) {
        const moved = before - range.getBoundingClientRect().top;
        const exact = this._exactTop !== null && Math.abs(this._exactTop - s.scrollTop) < 1 ? this._exactTop : s.scrollTop;
        this._exactTop = Math.max(0, exact - moved);
        s.scrollTop = this._exactTop;
        this._lastTop = s.scrollTop;
      }
    }

    _afterWrite(replaced) {
      this._copyWrap.hidden = this.hasAttribute('no-copy') || !this._code.firstChild;
      this._box.classList.toggle('copy-on', !this._copyWrap.hidden);
      if (replaced) this._scroller.scrollTop = this._isLog() ? this._scroller.scrollHeight : 0;
      this._queueLayout();
    }

    /* --------------------------- Rendering ---------------------------- */

    _render() {
      const label = (this.getAttribute('label') || '').trim();
      const language = (this.getAttribute('language') || '').trim();
      const log = this._isLog();
      this._label.textContent = label;
      this._language.textContent = language;
      this._head.hidden = !label && !language;
      this._box.classList.toggle('has-head', !this._head.hidden);

      const maxHeight = (this.getAttribute('max-height') || '').trim();
      this._scroller.style.maxHeight = maxHeight;

      const name = label || (log ? 'Log' : 'Code');
      this._scroller.setAttribute('aria-label', name);
      if (log) {
        this._scroller.setAttribute('role', 'log');
        this._scroller.setAttribute('aria-live', this.hasAttribute('announce') ? 'polite' : 'off');
      } else {
        this._scroller.removeAttribute('aria-live');
      }

      const copyLabel = (this.getAttribute('copy-label') || '').trim()
        || (label ? `Copy ${label}` : log ? 'Copy log' : 'Copy code');
      this._copy.setAttribute('aria-label', copyLabel);
      this._copyWrap.hidden = this.hasAttribute('no-copy') || !this._code.firstChild;
      this._box.classList.toggle('copy-on', !this._copyWrap.hidden);

      this._latestText.textContent = (this.getAttribute('latest-label') || '').trim() || 'Jump to latest';
    }

    _queueLayout() {
      cancelAnimationFrame(this._frame);
      this._frame = requestAnimationFrame(() => this._layout());
    }

    /** After a write or a resize: follow the end, and make an overflowing scroller reachable. */
    _layout() {
      const s = this._scroller;
      if (this._isLog() && this._following) {
        s.scrollTop = s.scrollHeight;
        this._lastTop = s.scrollTop;
      }
      const overflows = s.scrollHeight > s.clientHeight + 1 || s.scrollWidth > s.clientWidth + 1;
      if (overflows) {
        s.tabIndex = 0;
        if (!this._isLog()) s.setAttribute('role', 'region');
      } else {
        s.removeAttribute('tabindex');
        if (!this._isLog()) s.removeAttribute('role');
      }
      this._box.style.setProperty('--_scrollbar', `${Math.max(0, s.offsetWidth - s.clientWidth)}px`);
      this._syncLatest(overflows);
    }

    _onScroll() {
      if (!this._isLog()) return;
      const s = this._scroller;
      const top = s.scrollTop;
      const atEnd = s.scrollHeight - top - s.clientHeight <= END_SLACK;
      // Only the reader scrolling up stops following; growth below never does.
      if (atEnd) this._setFollowing(true);
      else if (top < this._lastTop) this._setFollowing(false);
      this._lastTop = top;
    }

    _setFollowing(value) {
      if (this._following === value) {
        this._syncLatest();
        return;
      }
      this._following = value;
      this._syncLatest();
      this.dispatchEvent(new CustomEvent('follow-change', {
        bubbles: true,
        composed: true,
        detail: { following: value },
      }));
    }

    _syncLatest(overflows) {
      const s = this._scroller;
      const over = overflows === undefined ? s.scrollHeight > s.clientHeight + 1 : overflows;
      const show = this._isLog() && !this._following && over;
      if (!show && this._latest.hidden) return;
      // Focus on the button when it goes: keep it in the log.
      if (!show && this.shadowRoot.activeElement === this._latest) s.focus({ preventScroll: true });
      this._latest.hidden = !show;
    }
  }

  customElements.define(TAG_NAME, KakaoCodeBlock);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }
})();
