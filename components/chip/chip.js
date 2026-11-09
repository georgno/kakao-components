/**
 * <kakao-chip>
 * ============================================================================
 * A compact label for file types, tokens, tags or filters. Optional colour
 * swatch, icon and muted secondary text. It can be a link or an action button,
 * removable, or both.
 * Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="chip.js"><\/script>
 *
 *   <kakao-chip>PDF</kakao-chip>
 *   <kakao-chip swatch="#4f46e5">Primary <span slot="meta">#4f46e5</span></kakao-chip>
 *   <kakao-chip href="/tags/sci-fi"><i slot="icon" class="fas fa-hashtag"></i>Sci-fi</kakao-chip>
 *   <kakao-chip removable value="hd">HD only</kakao-chip>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  tone          neutral (default) · primary · success · danger · ink
 *  swatch        A CSS colour: a small square before the label.
 *  href          Renders the label as a real link; target and rel pass through.
 *  action        Renders the label as a button that fires chip-action (ignored with href).
 *  removable     Adds a remove button (see EVENTS).
 *  remove-label  Accessible name of the remove button. Default "Remove <label>".
 *  value         Passed back in the chip-remove event.
 *
 * SLOTS: default (label, cut off with an ellipsis when it does not fit),
 *        icon (e.g. <i slot="icon" class="fas fa-file">), meta (muted text after the label).
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  chip-action   { label, value }   the action button was activated.
 *  chip-remove   { label, value }   cancelable. Unless cancelled, the chip
 *                removes itself and focus moves to the next removable chip's
 *                remove button, else the previous one's.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-chip-radius / -height / -padding-x / -gap / -font-size / -font-weight
 *  --kakao-chip-bg / -text / -meta-text / -focus
 *  --kakao-chip-tint / -text-mix, tone colours, swatch size and radius
 *
 * Parts: chip, main (the <a> or <span>), swatch, label, meta, remove.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-chip';
  if (customElements.get(TAG_NAME)) return;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-chip- (written by construction.html, edit there) */
        --_radius: var(--kakao-chip-radius, 4px);
        --_height: var(--kakao-chip-height, 1.5rem);
        --_padding-x: var(--kakao-chip-padding-x, 0.45rem);
        --_gap: var(--kakao-chip-gap, 0.35rem);
        --_font-size: var(--kakao-chip-font-size, 0.75rem);
        --_font-weight: var(--kakao-chip-font-weight, 600);
        --_bg: var(--kakao-chip-bg, var(--kakao-color-subtle-strong, #e6e6e8));
        --_text: var(--kakao-chip-text, var(--kakao-color-text, #18181b));
        --_meta-text: var(--kakao-chip-meta-text, var(--kakao-color-muted, #62626c));
        --_focus: var(--kakao-chip-focus, var(--kakao-color-focus, #2563eb));
        --_surface: var(--kakao-chip-surface, var(--kakao-color-bg, #ffffff));
        --_tint: var(--kakao-chip-tint, 16%);
        --_text-mix: var(--kakao-chip-text-mix, 72%);
        --_primary: var(--kakao-chip-primary, var(--kakao-color-primary, #4f46e5));
        --_success: var(--kakao-chip-success, var(--kakao-color-success, #15803d));
        --_danger: var(--kakao-chip-danger, var(--kakao-color-danger, #dc2626));
        --_ink: var(--kakao-chip-ink, var(--kakao-color-ink, #18181b));
        --_on-ink: var(--kakao-chip-on-ink, var(--kakao-color-on-ink, #fafafa));
        --_swatch-size: var(--kakao-chip-swatch-size, 0.75rem);
        --_swatch-radius: var(--kakao-chip-swatch-radius, 2px);
        /* @kakao-settings:end */
        display: inline-flex;
        vertical-align: middle;
        min-width: 0;
        max-width: 100%;
      }
      :host([hidden]) { display: none; }

      .chip {
        --_fill: var(--_bg);
        --_ink-text: var(--_text);
        --_meta: var(--_meta-text);
        display: inline-flex;
        align-items: center;
        box-sizing: border-box;
        min-width: 0;
        max-width: 100%;
        width: 100%;
        height: var(--_height);
        border-radius: var(--_radius);
        background: var(--_fill);
        color: var(--_ink-text);
        font-family: inherit;
        font-size: var(--_font-size);
        font-weight: var(--_font-weight);
        line-height: 1;
      }
      :host([tone="primary"]) { --_tone: var(--_primary); }
      :host([tone="success"]) { --_tone: var(--_success); }
      :host([tone="danger"])  { --_tone: var(--_danger); }
      :host(:is([tone="primary"], [tone="success"], [tone="danger"])) .chip {
        --_fill: color-mix(in srgb, var(--_tone) var(--_tint), var(--_surface));
        --_ink-text: color-mix(in srgb, var(--_tone) var(--_text-mix), var(--_text));
        --_meta: var(--_ink-text);
      }
      :host([tone="ink"]) .chip {
        --_fill: var(--_ink);
        --_ink-text: var(--_on-ink);
        --_meta: var(--_on-ink);
      }

      .main {
        display: inline-flex;
        align-items: center;
        gap: var(--_gap);
        flex: 1;
        min-width: 0;
        height: 100%;
        padding: 0 var(--_padding-x);
        border-radius: inherit;
        color: inherit;
        text-decoration: none;
        outline: none;
      }
      button.main { margin: 0; border: 0; background: transparent; font: inherit; text-align: start; }
      :is(a, button).main { cursor: pointer; }
      :is(a, button).main:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
      .chip:has(:is(a, button).main:focus-visible) { outline: 2px solid var(--_focus); outline-offset: 2px; }

      .swatch {
        flex: none;
        width: var(--_swatch-size);
        height: var(--_swatch-size);
        border-radius: var(--_swatch-radius);
        box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.15);
      }
      .swatch[hidden] { display: none; }
      ::slotted([slot="icon"]) { flex: none; font-size: 0.9em; }
      .label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.3;
      }
      .meta {
        flex: none;
        margin-left: auto;
        color: var(--_meta);
        font-weight: 500;
        white-space: nowrap;
      }
      .meta:not(.has-meta) { display: none; }

      .remove {
        position: relative;
        flex: none;
        display: inline-grid;
        place-items: center;
        width: calc(var(--_height) - 6px);
        height: calc(var(--_height) - 6px);
        margin: 0 3px 0 calc(var(--_padding-x) * -0.5);
        padding: 0;
        border: 0;
        border-radius: calc(var(--_radius) - 1px);
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
        opacity: 0.7;
      }
      .remove:hover { opacity: 1; background: color-mix(in srgb, currentColor 12%, transparent); }
      .remove:focus-visible { opacity: 1; outline: 2px solid var(--_focus); outline-offset: 2px; }
      /* The drawn button stays small; the tap target is at least 24 × 24px (WCAG 2.5.8). */
      .remove::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: max(100%, 24px);
        height: max(100%, 24px);
        transform: translate(-50%, -50%);
      }
      .remove[hidden] { display: none; }
      .remove svg { width: 0.7em; height: 0.7em; }

      @media (forced-colors: active) {
        .chip { border: 1px solid CanvasText; }
      }
    </style>
    <span class="chip" part="chip"><span class="main" part="main"><span class="swatch" part="swatch" hidden></span><slot name="icon"></slot><span class="label" part="label"><slot></slot></span><span class="meta" part="meta"><slot name="meta"></slot></span></span><button class="remove" part="remove" type="button" hidden><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></span>
  `;

  class KakaoChip extends HTMLElement {
    static get observedAttributes() {
      return ['href', 'target', 'rel', 'action', 'swatch', 'removable', 'remove-label'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._chip = shadow.querySelector('.chip');
      this._main = shadow.querySelector('.main');
      this._remove = shadow.querySelector('.remove');
      this._remove.addEventListener('click', () => this._requestRemove());
      shadow.addEventListener('click', (e) => {
        if (this._main.tagName === 'BUTTON' && e.composedPath().includes(this._main)) {
          this.dispatchEvent(new CustomEvent('chip-action', {
            bubbles: true, composed: true, detail: { label: this.label, value: this.getAttribute('value') },
          }));
        }
      });
      shadow.querySelector('slot:not([name])').addEventListener('slotchange', () => this._render());
      const meta = shadow.querySelector('slot[name="meta"]');
      meta.addEventListener('slotchange', () => {
        shadow.querySelector('.meta').classList.toggle('has-meta', meta.assignedNodes().length > 0);
      });
    }

    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    /** The visible label text, without icon and meta content. */
    get label() {
      return [...this.childNodes]
        .filter((n) => !(n.nodeType === 1 && n.hasAttribute('slot')))
        .map((n) => n.textContent)
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
    }

    /** Focuses the chip's link or action button, else its remove button. */
    focus(options) {
      if (this._main.tagName !== 'SPAN') this._main.focus(options);
      else if (!this._remove.hidden) this._remove.focus(options);
    }

    /** Moves focus to the remove button (no-op unless removable). */
    focusRemove() {
      if (!this._remove.hidden) this._remove.focus();
    }

    _render() {
      // The main part is an <a> with href, a <button> with action, else a <span>;
      // swapping keeps the children.
      const href = this.getAttribute('href');
      const wantLink = href != null;
      const tag = wantLink ? 'a' : this.hasAttribute('action') ? 'button' : 'span';
      if (this._main.localName !== tag) {
        const next = document.createElement(tag);
        if (tag === 'button') next.type = 'button';
        next.className = 'main';
        next.setAttribute('part', 'main');
        while (this._main.firstChild) next.appendChild(this._main.firstChild);
        this._main.replaceWith(next);
        this._main = next;
      }
      if (wantLink) {
        this._main.setAttribute('href', href);
        ['target', 'rel'].forEach((a) => {
          const v = this.getAttribute(a);
          if (v == null) this._main.removeAttribute(a);
          else this._main.setAttribute(a, v);
        });
      }

      const swatch = this.shadowRoot.querySelector('.swatch');
      const colour = this.getAttribute('swatch');
      swatch.hidden = !colour;
      swatch.style.background = colour || '';

      const removable = this.hasAttribute('removable');
      this._remove.hidden = !removable;
      if (removable) {
        this._remove.setAttribute('aria-label', this.getAttribute('remove-label') || `Remove ${this.label}`.trim());
      }
    }

    _requestRemove() {
      const allowed = this.dispatchEvent(new CustomEvent('chip-remove', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { label: this.label, value: this.getAttribute('value') },
      }));
      if (!allowed) return;

      // Hand focus on before leaving, so keyboard users keep their place.
      const isRemovable = (el) => el && el.localName === TAG_NAME && el.hasAttribute('removable') && el !== this;
      const siblings = this.parentElement ? [...this.parentElement.children] : [];
      const i = siblings.indexOf(this);
      const next = siblings.slice(i + 1).find(isRemovable) || siblings.slice(0, i).reverse().find(isRemovable);
      this.remove();
      if (next) next.focusRemove();
    }
  }

  customElements.define(TAG_NAME, KakaoChip);
})();
