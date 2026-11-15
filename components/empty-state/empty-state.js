/**
 * <kakao-empty-state>
 * ============================================================================
 * The quiet block shown where content is missing: a list with no rows, a
 * search with no results, a card with nothing in it yet. An icon, a heading,
 * a short message and actions, centred. It has no frame and no background:
 * it sits on the surface of the card, list or table area around it. For an
 * error that fills the page, use kakao-error-page.
 * Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="empty-state.js"><\/script>
 *
 *   <kakao-empty-state heading="No invoices yet" message="Invoices you create appear here.">
 *     <kakao-button slot="actions" label="New invoice"></kakao-button>
 *   </kakao-empty-state>
 *
 *   <kakao-empty-state size="sm" heading="No results">
 *     <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
 *          stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>
 *     Try another word, or <a href="?">clear the filters</a>.
 *   </kakao-empty-state>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  heading          The title. Without it no heading element is rendered.
 *  heading-level    Level of the heading element, 1 to 6, default 3: the block
 *                   usually sits in a section or card that has its own heading.
 *  message          The explanation. Content in the default slot replaces it.
 *  size             sm for tight places (a table body, a popover, a small
 *                   card). Anything else is the default size.
 *  no-icon          Shows no icon.
 *
 * SLOTS: default (the message), icon (replaces the built-in tray glyph; an
 * inline SVG in currentColor is best), actions (buttons or links, in a
 * wrapping centred row).
 *
 * The built-in glyph is decoration (aria-hidden); the heading and message
 * carry the meaning. Give a slotted icon aria-hidden too, or an accessible
 * name if it says something the text does not. The block does not announce
 * itself: a page that empties a list while the user watches puts it in its
 * own live region.
 *
 * To centre the block in a tall area, centre the element there (the area as a
 * grid with place-items: center); it has no minimum height of its own.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-empty-state-text / -muted / -icon-color / -icon-surface
 *  --kakao-empty-state-icon-size / -icon-box-size / -icon-radius
 *  --kakao-empty-state-heading-size / -heading-weight / -font-size
 *  --kakao-empty-state-padding-y / -padding-x / -gap / -actions-gap / -max-width
 *  --kakao-empty-state-sm-icon-size / -sm-icon-box-size / -sm-heading-size
 *  --kakao-empty-state-sm-font-size / -sm-padding-y / -sm-padding-x / -sm-gap
 *  A larger illustration in the icon slot: raise -icon-size and -icon-box-size
 *  and set -icon-surface to transparent.
 *
 * Parts: box, icon, heading, message, actions.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-empty-state';
  if (customElements.get(TAG_NAME)) return;

  const DEFAULT_LEVEL = 3;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-empty-state- (written by construction.html, edit there) */
        --_text: var(--kakao-empty-state-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-empty-state-muted, var(--kakao-color-muted, #62626c));
        --_icon-color: var(--kakao-empty-state-icon-color, var(--kakao-color-muted, #62626c));
        --_icon-surface: var(--kakao-empty-state-icon-surface, var(--kakao-color-subtle, #f0f0f1));
        --_icon-size: var(--kakao-empty-state-icon-size, 1.5rem);
        --_icon-box-size: var(--kakao-empty-state-icon-box-size, 3rem);
        --_icon-radius: var(--kakao-empty-state-icon-radius, 999px);
        --_heading-size: var(--kakao-empty-state-heading-size, 1.0625rem);
        --_heading-weight: var(--kakao-empty-state-heading-weight, 600);
        --_font-size: var(--kakao-empty-state-font-size, var(--kakao-font-size, 0.95rem));
        --_padding-y: var(--kakao-empty-state-padding-y, 2rem);
        --_padding-x: var(--kakao-empty-state-padding-x, 1rem);
        --_gap: var(--kakao-empty-state-gap, 0.375rem);
        --_actions-gap: var(--kakao-empty-state-actions-gap, 0.5rem);
        --_max-width: var(--kakao-empty-state-max-width, 24rem);
        --_sm-icon-size: var(--kakao-empty-state-sm-icon-size, 1.125rem);
        --_sm-icon-box-size: var(--kakao-empty-state-sm-icon-box-size, 2.25rem);
        --_sm-heading-size: var(--kakao-empty-state-sm-heading-size, 0.95rem);
        --_sm-font-size: var(--kakao-empty-state-sm-font-size, 0.875rem);
        --_sm-padding-y: var(--kakao-empty-state-sm-padding-y, 1rem);
        --_sm-padding-x: var(--kakao-empty-state-sm-padding-x, 0.75rem);
        --_sm-gap: var(--kakao-empty-state-sm-gap, 0.25rem);
        /* @kakao-settings:end */
        display: block;
        color: var(--_text);
        font-size: var(--_font-size);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) {
        --_icon-size: var(--_sm-icon-size);
        --_icon-box-size: var(--_sm-icon-box-size);
        --_heading-size: var(--_sm-heading-size);
        --_font-size: var(--_sm-font-size);
        --_padding-y: var(--_sm-padding-y);
        --_padding-x: var(--_sm-padding-x);
        --_gap: var(--_sm-gap);
      }

      .box {
        display: grid;
        justify-items: center;
        gap: var(--_gap);
        box-sizing: border-box;
        padding: var(--_padding-y) var(--_padding-x);
        text-align: center;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .box > * { min-width: 0; max-width: min(100%, var(--_max-width)); }

      .icon {
        display: grid;
        place-items: center;
        width: var(--_icon-box-size);
        height: var(--_icon-box-size);
        margin-bottom: var(--_gap);
        border-radius: var(--_icon-radius);
        background: var(--_icon-surface);
        color: var(--_icon-color);
      }
      .icon svg, ::slotted([slot="icon"]) {
        display: block;
        width: var(--_icon-size);
        height: var(--_icon-size);
      }
      ::slotted([slot="icon"]) { font-size: var(--_icon-size); line-height: 1; }

      .heading {
        margin: 0;
        font-size: var(--_heading-size);
        font-weight: var(--_heading-weight);
        line-height: 1.3;
      }
      .message { color: var(--_muted); }
      .message ::slotted(*) { margin-block: 0; }
      .message ::slotted(* + *) { margin-top: 0.5em; }

      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--_actions-gap);
        margin-top: calc(var(--_gap) * 2);
      }
      .icon[hidden], .message[hidden], .actions[hidden], .message-text[hidden] { display: none; }

      @media (forced-colors: active) {
        .icon { color: CanvasText; background: none; }
      }
    </style>
    <div class="box" part="box">
      <span class="icon" part="icon"><slot name="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 13.5 6.2 5.6a1 1 0 0 1 .95-.68h9.7a1 1 0 0 1 .95.68l2.7 7.9v4.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"/><path d="M3.5 13.5h5l1.2 2.25h4.6l1.2-2.25h5"/></svg></slot></span>
      <div class="message" part="message"><span class="message-text"></span><slot></slot></div>
      <div class="actions" part="actions" hidden><slot name="actions"></slot></div>
    </div>
  `;

  class KakaoEmptyState extends HTMLElement {
    static get observedAttributes() {
      return ['heading', 'heading-level', 'message', 'size', 'no-icon'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._icon = shadow.querySelector('.icon');
      this._heading = null;
      this._messageBox = shadow.querySelector('.message');
      this._messageText = shadow.querySelector('.message-text');
      this._actions = shadow.querySelector('.actions');
      this._slots = {
        message: shadow.querySelector('slot:not([name])'),
        actions: shadow.querySelector('slot[name="actions"]'),
      };
      Object.values(this._slots).forEach((slot) => slot.addEventListener('slotchange', () => this._renderSlots()));
    }

    connectedCallback() {
      this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || oldValue === newValue) return;
      this._render();
    }

    _render() {
      this._icon.hidden = this.hasAttribute('no-icon');
      this._renderHeading();
      this._renderSlots();
    }

    /** One heading element of the asked level, or none without a heading. */
    _renderHeading() {
      const title = (this.getAttribute('heading') || '').trim();
      if (!title) {
        if (this._heading) this._heading.remove();
        this._heading = null;
        return;
      }
      const raw = parseInt(this.getAttribute('heading-level'), 10);
      const tag = `h${raw >= 1 && raw <= 6 ? raw : DEFAULT_LEVEL}`;
      if (!this._heading || this._heading.localName !== tag) {
        const next = document.createElement(tag);
        next.className = 'heading';
        next.setAttribute('part', 'heading');
        if (this._heading) this._heading.replaceWith(next);
        else this._messageBox.before(next);
        this._heading = next;
      }
      this._heading.textContent = title;
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
    }
  }

  customElements.define(TAG_NAME, KakaoEmptyState);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }
})();
