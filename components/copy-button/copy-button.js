/**
 * <kakao-copy-button>
 * ============================================================================
 * A button that copies a text to the clipboard and says so: the icon turns
 * into a check, the label into "Copied", and a screen reader hears it. After a
 * moment it is a copy button again. When the browser refuses, it shows and
 * announces that instead. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        Copies a text to the clipboard and confirms it.
 *  not for    Any other action: kakao-button.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     copy-button.js
 *  css        none
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="copy-button.js"><\/script>
 *
 *   <kakao-copy-button value="npm install kakao"></kakao-copy-button>          icon only, named "Copy"
 *   <kakao-copy-button value="https://example.org/i/42" label="Copy link"></kakao-copy-button>
 *   <kakao-copy-button for="api-key" aria-label="Copy API key" variant="ghost" size="sm"></kakao-copy-button>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  value         The text to copy. Wins over `for`.
 *  for           The id of an element whose text is copied, read at the moment
 *                of the click: the `value` of a field (input, textarea, select,
 *                the kakao inputs), otherwise the element's text without the
 *                white space around it. Looked up in the button's own tree
 *                first (so it works inside a shadow root), then in the page.
 *  label         The visible label. Without it the button is icon only, a
 *                circle, like an icon-only kakao-button.
 *  aria-label    The button's name for assistive technology. Default: the
 *                label, or "Copy" for an icon-only button. Say what is copied
 *                when several sit on one page ("Copy API key").
 *  copied-label  Shown in place of the label and announced after a successful
 *                copy. Default "Copied".
 *  error-label   The same when copying failed. Default "Copy failed".
 *  variant       secondary (default) · ghost. secondary is a quiet fill;
 *                ghost has no fill until hovered.
 *  size          sm · md (default) · lg: the heights of kakao-button.
 *  reset-delay   Milliseconds the confirmation (or the failure) stays before
 *                the button is a copy button again. Default 1600. 0 keeps it
 *                until reset() is called.
 *  disabled      Not clickable, not focusable, dimmed.
 *
 * ----------------------------------------------------------------------------
 * SLOTS
 * ----------------------------------------------------------------------------
 *  icon          Replaces the copy glyph, e.g. a link icon: an inline <svg>
 *                (sized by the button, drawn in currentColor). The check and
 *                the failure mark stay the component's own.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  copy-success  detail { value }            the text is on the clipboard
 *  copy-error    detail { value, reason }    reason: "empty" (no value, or the
 *                `for` element is missing or has no text) or "failed" (the
 *                browser refused: no permission, no clipboard access)
 *
 * ----------------------------------------------------------------------------
 * PROPERTIES AND METHODS
 * ----------------------------------------------------------------------------
 *  value         get / set, reflects the attribute
 *  text          the text a click would copy right now (read-only)
 *  state         "idle" | "copied" | "error" (read-only); also on the host as
 *                data-state="copied" / "error" for page CSS
 *  copy()        copies now; resolves to true or false. Browsers only allow
 *                it in answer to a user action (a click, a key press).
 *  reset()       back to the copy state at once
 *  focus()       focuses the button
 *
 * ----------------------------------------------------------------------------
 * HOW IT COPIES
 * ----------------------------------------------------------------------------
 *  navigator.clipboard.writeText() where there is one. Where there is none (a
 *  page not served over HTTPS) or it refuses, a hidden read-only textarea and
 *  document.execCommand('copy'); focus returns to where it was.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  A native <button type="button">: Enter and Space copy, and it never submits
 *  a form. Its name stays the same in every state; the result is announced
 *  through a polite live region (role="status") inside the component, so it
 *  is heard once and focus does not move. Success and failure differ by icon
 *  and text, not only by colour. Focus shows the styleguide outline.
 *  Reduced motion: the icons swap without the scale and fade.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-copy-button-font / -label-weight
 *  --kakao-copy-button-ink                    ghost hover tint is mixed from it
 *  --kakao-copy-button-secondary-bg / -secondary-text / -secondary-hover-bg
 *  --kakao-copy-button-ghost-text / -ghost-hover-mix
 *  --kakao-copy-button-copied / -error        the check and the failure mark
 *  --kakao-copy-button-focus
 *  --kakao-copy-button-sm-height / -sm-padding-x / -sm-font-size / -sm-radius / -sm-gap
 *  --kakao-copy-button-md-… / -lg-…           the same per size
 *  --kakao-copy-button-icon-size              in em of the label size
 *  --kakao-copy-button-disabled-opacity / -transition
 *
 * Parts: button, icon, label, status.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-copy-button';
  if (customElements.get(TAG_NAME)) return;

  const DEFAULT_RESET = 1600;

  const svg = (paths) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
  const COPY = svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>');
  const CHECK = svg('<path d="M20 6 9 17l-5-5"/>');
  const FAILED = svg('<path d="M18 6 6 18M6 6l12 12"/>');

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-copy-button- (written by construction.html, edit there) */
        --_font: var(--kakao-copy-button-font, var(--kakao-font-family, inherit));
        --_label-weight: var(--kakao-copy-button-label-weight, 550);
        --_ink: var(--kakao-copy-button-ink, var(--kakao-color-ink, #18181b));
        --_secondary-bg: var(--kakao-copy-button-secondary-bg, var(--kakao-color-subtle, #f0f0f1));
        --_secondary-text: var(--kakao-copy-button-secondary-text, var(--kakao-color-ink, #18181b));
        --_secondary-hover-bg: var(--kakao-copy-button-secondary-hover-bg, var(--kakao-color-subtle-strong, #e6e6e8));
        --_ghost-text: var(--kakao-copy-button-ghost-text, var(--kakao-color-text-soft, #3f3f46));
        --_ghost-hover-mix: var(--kakao-copy-button-ghost-hover-mix, 4.5%);
        --_copied: var(--kakao-copy-button-copied, var(--kakao-color-success, #15803d));
        --_error: var(--kakao-copy-button-error, var(--kakao-color-danger, #dc2626));
        --_focus: var(--kakao-copy-button-focus, var(--kakao-color-focus, #2563eb));
        --_sm-height: var(--kakao-copy-button-sm-height, 36px);
        --_sm-padding-x: var(--kakao-copy-button-sm-padding-x, 16px);
        --_sm-font-size: var(--kakao-copy-button-sm-font-size, 13px);
        --_sm-radius: var(--kakao-copy-button-sm-radius, var(--kakao-radius-md, 10px));
        --_sm-gap: var(--kakao-copy-button-sm-gap, 6px);
        --_md-height: var(--kakao-copy-button-md-height, 44px);
        --_md-padding-x: var(--kakao-copy-button-md-padding-x, 22px);
        --_md-font-size: var(--kakao-copy-button-md-font-size, 14.5px);
        --_md-radius: var(--kakao-copy-button-md-radius, var(--kakao-radius-lg, 14px));
        --_md-gap: var(--kakao-copy-button-md-gap, 8px);
        --_lg-height: var(--kakao-copy-button-lg-height, 52px);
        --_lg-padding-x: var(--kakao-copy-button-lg-padding-x, 28px);
        --_lg-font-size: var(--kakao-copy-button-lg-font-size, 16px);
        --_lg-radius: var(--kakao-copy-button-lg-radius, var(--kakao-radius-lg, 14px));
        --_lg-gap: var(--kakao-copy-button-lg-gap, 10px);
        --_icon-size: var(--kakao-copy-button-icon-size, 1.15em);
        --_disabled-opacity: var(--kakao-copy-button-disabled-opacity, 0.45);
        --_transition: var(--kakao-copy-button-transition, 0.2s);
        /* @kakao-settings:end */
        --_height: var(--_md-height);
        --_padding-x: var(--_md-padding-x);
        --_font-size: var(--_md-font-size);
        --_radius: var(--_md-radius);
        --_gap: var(--_md-gap);
        display: inline-flex;
        /* Keeps the out-of-flow .sr span from escaping a page's scroller. */
        position: relative;
        vertical-align: middle;
        max-width: 100%;
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) {
        --_height: var(--_sm-height);
        --_padding-x: var(--_sm-padding-x);
        --_font-size: var(--_sm-font-size);
        --_radius: var(--_sm-radius);
        --_gap: var(--_sm-gap);
      }
      :host([size="lg"]) {
        --_height: var(--_lg-height);
        --_padding-x: var(--_lg-padding-x);
        --_font-size: var(--_lg-font-size);
        --_radius: var(--_lg-radius);
        --_gap: var(--_lg-gap);
      }

      .button {
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--_gap);
        max-width: 100%;
        height: var(--_height);
        margin: 0;
        padding: 0 var(--_padding-x);
        border: 0;
        border-radius: var(--_radius);
        background: var(--_secondary-bg);
        color: var(--_secondary-text);
        font-family: var(--_font);
        font-size: var(--_font-size);
        line-height: 1;
        letter-spacing: -0.01em;
        white-space: nowrap;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: background-color var(--_transition) ease, color var(--_transition) ease, opacity var(--_transition) ease;
      }
      .button:hover { background: var(--_secondary-hover-bg); }
      .button:focus { outline: none; }
      .button:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; }

      :host([variant="ghost"]) .button {
        background: transparent;
        color: var(--_ghost-text);
      }
      :host([variant="ghost"]) .button:hover {
        background: color-mix(in srgb, var(--_ink) var(--_ghost-hover-mix), transparent);
      }

      /* icon only: a circle, as an icon-only kakao-button */
      .button.icon-only {
        width: var(--_height);
        padding: 0;
        border-radius: 50%;
      }

      .button:disabled {
        opacity: var(--_disabled-opacity);
        cursor: not-allowed;
        pointer-events: none;
      }

      /* The icons share one cell and the labels another, so the button keeps
         its width when it confirms. The failure label only takes room while
         it shows: a rare state should not widen every button. */
      .icon, .label {
        display: inline-grid;
        align-items: center;
        justify-items: center;
      }
      .icon > *, .label > * { grid-area: 1 / 1; }

      .icon { flex: none; }
      .icon svg, ::slotted([slot="icon"]) {
        display: block;
        width: var(--_icon-size);
        height: var(--_icon-size);
      }
      .icon svg {
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .glyph {
        display: inline-flex;
        transition: opacity var(--_transition) ease, transform var(--_transition) cubic-bezier(0.34, 1.3, 0.64, 1);
      }
      .glyph.copied { color: var(--_copied); }
      .glyph.error { color: var(--_error); }

      .label { min-width: 0; font-weight: var(--_label-weight); }
      .label[hidden] { display: none; }
      .text { transition: opacity var(--_transition) ease; }

      /* which of the three shows */
      .glyph.copied, .glyph.error { opacity: 0; transform: scale(0.5); }
      .text.copied { opacity: 0; visibility: hidden; }
      .text.error { display: none; }
      .button[data-state] .glyph.idle { opacity: 0; transform: scale(0.5); }
      .button[data-state] .text.idle { opacity: 0; visibility: hidden; }
      .button[data-state="copied"] .glyph.copied,
      .button[data-state="error"] .glyph.error { opacity: 1; transform: none; }
      .button[data-state="copied"] .text.copied { opacity: 1; visibility: visible; }
      .button[data-state="error"] .text.error { display: block; }

      .sr {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      @media (prefers-reduced-motion: reduce) {
        .button, .glyph, .text { transition: none; }
        .glyph.copied, .glyph.error, .button[data-state] .glyph.idle { transform: none; }
      }

      @media (forced-colors: active) {
        .button { border: 1px solid ButtonText; }
        .button:disabled { border-color: GrayText; color: GrayText; opacity: 1; }
        .glyph.copied, .glyph.error { color: inherit; }
      }
    </style>
    <button class="button" part="button" type="button">
      <span class="icon" part="icon" aria-hidden="true">
        <span class="glyph idle"><slot name="icon">${COPY}</slot></span>
        <span class="glyph copied">${CHECK}</span>
        <span class="glyph error">${FAILED}</span>
      </span>
      <span class="label" part="label" aria-hidden="true">
        <span class="text idle"></span>
        <span class="text copied"></span>
        <span class="text error"></span>
      </span>
    </button>
    <span class="sr" part="status" role="status"></span>
  `;

  class KakaoCopyButton extends HTMLElement {
    static get observedAttributes() {
      return ['label', 'aria-label', 'copied-label', 'error-label', 'disabled'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).appendChild(TEMPLATE.content.cloneNode(true));
      const root = this.shadowRoot;
      this._button = root.querySelector('.button');
      this._label = root.querySelector('.label');
      this._texts = {
        idle: root.querySelector('.text.idle'),
        copied: root.querySelector('.text.copied'),
        error: root.querySelector('.text.error'),
      };
      this._status = root.querySelector('[role="status"]');
      this._state = 'idle';
      this._timer = 0;
      this._frame = 0;
      this._button.addEventListener('click', () => this.copy());
    }

    connectedCallback() {
      this._render();
    }

    disconnectedCallback() {
      this.reset();
    }

    attributeChangedCallback() {
      this._render();
    }

    get value() {
      return this.getAttribute('value') || '';
    }

    set value(text) {
      if (text === null || text === undefined) this.removeAttribute('value');
      else this.setAttribute('value', String(text));
    }

    get state() {
      return this._state;
    }

    /** The text a click would copy right now ('' when there is none). */
    get text() {
      if (this.hasAttribute('value')) return this.getAttribute('value');
      const id = this.getAttribute('for');
      if (!id) return '';
      const root = this.getRootNode();
      const source = (root && root.getElementById && root.getElementById(id)) || document.getElementById(id);
      if (!source) return '';
      if (typeof source.value === 'string') return source.value;
      return (source.textContent || '').trim();
    }

    focus(options) {
      this._button.focus(options);
    }

    /** Copies now. Resolves to true when the text is on the clipboard. */
    async copy() {
      if (this.hasAttribute('disabled')) return false;
      const value = this.text;
      if (!value) {
        this._finish(false, value, 'empty');
        return false;
      }
      let ok = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(value);
          ok = true;
        } catch (error) {
          ok = false;
        }
      }
      if (!ok) ok = copyWithTextarea(value);
      this._finish(ok, value, 'failed');
      return ok;
    }

    /** Back to the copy state at once. */
    reset() {
      clearTimeout(this._timer);
      cancelAnimationFrame(this._frame);
      this._timer = 0;
      this._setState('idle');
      this._status.textContent = '';
    }

    _finish(ok, value, reason) {
      clearTimeout(this._timer);
      cancelAnimationFrame(this._frame);
      this._setState(ok ? 'copied' : 'error');
      /* Emptied first, written a frame later: the same words are announced
         again when the button is used twice in a row. */
      const words = this._texts[ok ? 'copied' : 'error'].textContent;
      this._status.textContent = '';
      this._frame = requestAnimationFrame(() => {
        this._status.textContent = words;
      });
      const delay = this._resetDelay();
      if (delay > 0) this._timer = setTimeout(() => this.reset(), delay);
      this.dispatchEvent(
        new CustomEvent(ok ? 'copy-success' : 'copy-error', {
          bubbles: true,
          composed: true,
          detail: ok ? { value } : { value, reason },
        }),
      );
    }

    _resetDelay() {
      if (!this.hasAttribute('reset-delay')) return DEFAULT_RESET;
      const ms = parseFloat(this.getAttribute('reset-delay'));
      return Number.isFinite(ms) && ms >= 0 ? ms : DEFAULT_RESET;
    }

    _setState(state) {
      this._state = state;
      if (state === 'idle') {
        this._button.removeAttribute('data-state');
        this.removeAttribute('data-state');
      } else {
        this._button.setAttribute('data-state', state);
        this.setAttribute('data-state', state);
      }
    }

    _render() {
      const label = (this.getAttribute('label') || '').trim();
      this._texts.idle.textContent = label;
      this._texts.copied.textContent = this.getAttribute('copied-label') || 'Copied';
      this._texts.error.textContent = this.getAttribute('error-label') || 'Copy failed';
      this._label.hidden = !label;
      this._button.classList.toggle('icon-only', !label);
      /* The name does not change with the state: the status says what happened. */
      this._button.setAttribute('aria-label', (this.getAttribute('aria-label') || '').trim() || label || 'Copy');
      this._button.disabled = this.hasAttribute('disabled');
    }
  }

  /* For pages without the async clipboard (not served over HTTPS) or where it
     refused: a hidden textarea and the old copy command. */
  function copyWithTextarea(text) {
    let active = document.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.setAttribute('aria-hidden', 'true');
    area.tabIndex = -1;
    area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (error) {
      ok = false;
    }
    area.remove();
    if (active && active.focus) active.focus({ preventScroll: true });
    return ok;
  }

  customElements.define(TAG_NAME, KakaoCopyButton);
})();
