/**
 * <kakao-accordion>
 * ============================================================================
 * A card that opens and closes to show any content. The header row holds a
 * title, an optional description, optional trailing meta and a chevron that
 * turns; the body takes anything. Built on native <details> / <summary>, so
 * the header is a real disclosure button. Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="accordion.js"><\/script>
 *
 *   <kakao-accordion heading="Billing" description="Card and invoices" open>
 *     <p>Any content.</p>
 *   </kakao-accordion>
 *
 *   <kakao-accordion name="faq">
 *     <span slot="title">Can I cancel anytime?</span>
 *     <kakao-badge slot="meta">Billing</kakao-badge>
 *     <p>Yes, at the end of the billing period.</p>
 *   </kakao-accordion>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  heading       Title text (or use slot="title").
 *  description   Subline below the title (or slot="description"). Takes no
 *                space when absent.
 *  open          Shown open. Reflected by the open property.
 *  name          Group: of the accordions with the same name in the same
 *                document (or shadow root) at most one is open, like
 *                <details name>. Opening one closes the others.
 *  variant       card · tile · row. Forces a look; without it the look comes
 *                from the nesting depth (see NESTING).
 *  no-animate    Opens and closes at once.
 *
 * SLOTS: default (the body), title, description, meta (short text or a badge
 * after the title; never controls, since the whole header is one button),
 * actions (controls such as a small kakao-button, shown in the header row
 * before the chevron; they sit outside the header button, so clicking them
 * doesn't open or close the accordion, and they stay visible while closed).
 *
 * ----------------------------------------------------------------------------
 * METHODS
 * ----------------------------------------------------------------------------
 *  show() · hide() · toggle(force?)   force true / false sets the state.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  accordion-toggle   { open, name }   every change after the first render:
 *                     header, method, attribute or the browser (find in page).
 *                     Also emitted as a trigger (shared/component-api.js).
 *                     Nested accordions' events bubble through their parents;
 *                     check event.target.
 *
 * ----------------------------------------------------------------------------
 * NESTING
 * ----------------------------------------------------------------------------
 *  The look steps down with the number of kakao-accordion ancestors, so an
 *  accordion inside an accordion is never a card in a card:
 *    level 1   card   surface, hairline border, 14px radius, card padding
 *    level 2   tile   no border, subtle fill, 10px radius, smaller padding
 *    level 3+  row    flat, a hairline above, no side padding (the tile's
 *                     padding is the indent); from level 4 indented further
 *  variant overrides it, e.g. variant="tile" for an accordion in a kakao-card.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  The header is a <summary>: one tab stop, a button with an expanded state,
 *  Enter and Space toggle it. A closed body is not focusable or read. HTML
 *  allows a heading inside <summary>, but the button role makes its children
 *  presentational, so no heading reaches the accessibility tree; put a group
 *  of accordions under a real section heading. Focus shows a 2px outline in
 *  the focus colour around the accordion.
 *
 * MOTION: the body's height glides open and closed on --kakao-motion-duration
 * with the standard easing (a size change), the chevron turns in step. None on
 * first render, with no-animate or under prefers-reduced-motion.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-accordion-bg / -border / -text / -muted / -focus
 *  --kakao-accordion-radius / -padding-x / -padding-y / -gap
 *  --kakao-accordion-title-size / -title-weight / -description-size / -chevron-size
 *  --kakao-accordion-tile-bg / -tile-radius / -tile-padding-x / -tile-padding-y
 *  --kakao-accordion-row-line / -row-padding-y / -row-indent / -nested-title-size
 *  --kakao-accordion-duration / -ease
 *
 * Parts: accordion, header, title, description, meta, actions, chevron, panel, body.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-accordion';
  if (customElements.get(TAG_NAME)) return;

  const LOOKS = ['card', 'tile', 'row'];

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-accordion- (written by construction.html, edit there) */
        --_bg: var(--kakao-accordion-bg, var(--kakao-color-bg, #ffffff));
        --_border: var(--kakao-accordion-border, var(--kakao-color-line, #e5e7eb));
        --_text: var(--kakao-accordion-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-accordion-muted, var(--kakao-color-muted, #62626c));
        --_focus: var(--kakao-accordion-focus, var(--kakao-color-focus, #2563eb));
        --_radius: var(--kakao-accordion-radius, 14px);
        --_padding-x: var(--kakao-accordion-padding-x, 1.25rem);
        --_padding-y: var(--kakao-accordion-padding-y, 1rem);
        --_gap: var(--kakao-accordion-gap, 0.75rem);
        --_title-size: var(--kakao-accordion-title-size, 1rem);
        --_title-weight: var(--kakao-accordion-title-weight, 600);
        --_description-size: var(--kakao-accordion-description-size, 0.875rem);
        --_chevron-size: var(--kakao-accordion-chevron-size, 1rem);
        --_tile-bg: var(--kakao-accordion-tile-bg, var(--kakao-color-subtle, #f0f0f1));
        --_tile-radius: var(--kakao-accordion-tile-radius, 10px);
        --_tile-padding-x: var(--kakao-accordion-tile-padding-x, 1rem);
        --_tile-padding-y: var(--kakao-accordion-tile-padding-y, 0.75rem);
        --_row-line: var(--kakao-accordion-row-line, color-mix(in srgb, var(--kakao-color-text, #18181b) 12%, transparent));
        --_row-padding-y: var(--kakao-accordion-row-padding-y, 0.75rem);
        --_row-indent: var(--kakao-accordion-row-indent, 1rem);
        --_nested-title-size: var(--kakao-accordion-nested-title-size, 0.9375rem);
        --_duration: var(--kakao-accordion-duration, var(--kakao-motion-duration, 320ms));
        --_ease: var(--kakao-accordion-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        display: block;
        min-width: 0;
      }
      :host([hidden]) { display: none; }

      /* ---- looks: one set of internal values per nesting step, set on the
         frame so the actions (outside the <details>) read them too ---- */
      .frame {
        --_l-bg: var(--_bg);
        --_l-border: var(--_border);
        --_l-radius: var(--_radius);
        --_l-px: var(--_padding-x);
        --_l-py: var(--_padding-y);
        --_l-title: var(--_title-size);
        position: relative;
      }
      .frame[data-look="tile"] {
        --_l-bg: var(--_tile-bg);
        --_l-border: transparent;
        --_l-radius: var(--_tile-radius);
        --_l-px: var(--_tile-padding-x);
        --_l-py: var(--_tile-padding-y);
        --_l-title: var(--_nested-title-size);
        /* Secondary buttons share the subtle fill; on a tile they take the
           surface colour so they stay visible (also in the actions slot). */
        --kakao-button-secondary-bg: var(--kakao-color-bg, #ffffff);
      }
      .frame[data-look="row"] {
        --_l-bg: transparent;
        --_l-radius: 6px;
        --_l-px: 0px;
        --_l-py: var(--_row-padding-y);
        --_l-title: var(--_nested-title-size);
      }
      .acc {
        box-sizing: border-box;
        margin: 0;
        background: var(--_l-bg);
        color: var(--_text);
        border: 1px solid var(--_l-border);
        border-radius: var(--_l-radius);
        line-height: 1.5;
      }
      .acc[data-look="tile"] { border: 0; }
      .acc[data-look="row"] {
        border: 0;
        border-top: 1px solid var(--_row-line);
        border-radius: 0;
      }
      .acc[data-look="row"][data-indent] { margin-inline-start: var(--_row-indent); }

      /* Focus: the ring goes around the whole accordion, since the header
         fills its top edge and an offset ring there would cross the border. */
      .acc:has(> summary:focus-visible) {
        outline: 2px solid var(--_focus);
        outline-offset: 2px;
      }
      .acc[data-look="row"]:has(> summary:focus-visible) { border-radius: var(--_l-radius); }

      /* ---- header ---- */
      summary {
        display: flex;
        align-items: center;
        gap: var(--_gap);
        padding: var(--_l-py) var(--_l-px);
        cursor: pointer;
        list-style: none;
        border-radius: inherit;
        -webkit-tap-highlight-color: transparent;
      }
      summary::-webkit-details-marker { display: none; }
      summary::marker { content: ""; }
      summary:focus-visible { outline: none; }
      .text { flex: 1; min-width: 0; display: grid; gap: 0.125rem; }
      .title {
        font-size: var(--_l-title);
        font-weight: var(--_title-weight);
        overflow-wrap: anywhere;
      }
      ::slotted([slot="title"]) { margin: 0; font: inherit; color: inherit; }
      .description { font-size: var(--_description-size); color: var(--_muted); overflow-wrap: anywhere; }
      ::slotted([slot="description"]) { margin: 0; font: inherit; color: inherit; }
      .description[hidden], .meta[hidden] { display: none; }
      .meta {
        flex: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--_muted);
        font-size: var(--_description-size);
      }
      /* ---- actions: controls shown in the header row, before the chevron.
         Buttons may not sit inside the <summary> (it is one button), so the
         slot lies over the header from outside the <details>, and a spacer
         in the summary keeps the room free. ---- */
      .actions {
        position: absolute;
        top: 0;
        inset-inline-end: calc(var(--_l-px) + var(--_chevron-size) + var(--_gap));
        height: var(--_head-h, auto);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .actions-space { flex: none; width: var(--_actions-w, 0px); }
      .actions[hidden], .actions-space[hidden] { display: none; }
      .chevron {
        flex: none;
        display: inline-grid;
        place-items: center;
        width: var(--_chevron-size);
        height: var(--_chevron-size);
        color: var(--_muted);
        transition: transform var(--_duration) var(--_ease), color var(--_duration) var(--_ease);
      }
      .chevron svg { width: 100%; height: 100%; }
      summary:hover .chevron { color: var(--_text); }
      .acc.is-open > summary .chevron { transform: rotate(180deg); }

      /* ---- body: clipped only while the height animates ---- */
      .panel.animating { overflow: clip; }
      .body {
        display: flex;
        flex-direction: column;
        gap: var(--_gap);
        min-width: 0;
        padding: 0 var(--_l-px) var(--_l-py);
      }
      .body ::slotted(*) { margin-block: 0; }

      @media (prefers-reduced-motion: reduce) {
        .chevron { transition: none; }
      }
      @media (forced-colors: active) {
        .acc { border-color: CanvasText; }
        .chevron { color: CanvasText; }
      }
    </style>
    <div class="frame" data-look="card">
    <details class="acc" part="accordion" data-look="card">
      <summary part="header">
        <span class="text">
          <span class="title" part="title"><slot name="title"><span class="heading"></span></slot></span>
          <span class="description" part="description" hidden><slot name="description"><span class="description-text"></span></slot></span>
        </span>
        <span class="meta" part="meta" hidden><slot name="meta"></slot></span>
        <span class="actions-space" hidden></span>
        <span class="chevron" part="chevron" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg></span>
      </summary>
      <div class="panel" part="panel"><div class="body" part="body"><slot></slot></div></div>
    </details>
    <span class="actions" part="actions" hidden><slot name="actions"></slot></span>
    </div>
  `;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class KakaoAccordion extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'heading', 'description', 'variant'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._details = shadow.querySelector('details');
      this._summary = shadow.querySelector('summary');
      this._panel = shadow.querySelector('.panel');
      this._heading = shadow.querySelector('.heading');
      this._descBox = shadow.querySelector('.description');
      this._descText = shadow.querySelector('.description-text');
      this._descSlot = shadow.querySelector('slot[name="description"]');
      this._metaBox = shadow.querySelector('.meta');
      this._metaSlot = shadow.querySelector('slot[name="meta"]');
      this._frame = shadow.querySelector('.frame');
      this._actionsBox = shadow.querySelector('.actions');
      this._actionsSpace = shadow.querySelector('.actions-space');
      this._actionsSlot = shadow.querySelector('slot[name="actions"]');
      // Keeps the actions centred on the header and their room free in it.
      this._sizer = new ResizeObserver(() => this._syncActions());
      this._state = false; // the open state the element is in (or moving to)
      this._rendered = false; // false until a frame after the first connect
      this._anim = null;
      this._onSummaryClick = this._onSummaryClick.bind(this);
      this._onNativeToggle = this._onNativeToggle.bind(this);
      this._updateText = this._updateText.bind(this);
    }

    connectedCallback() {
      this._summary.addEventListener('click', this._onSummaryClick);
      this._details.addEventListener('toggle', this._onNativeToggle);
      this._descSlot.addEventListener('slotchange', this._updateText);
      this._metaSlot.addEventListener('slotchange', this._updateText);
      this._actionsSlot.addEventListener('slotchange', this._updateText);
      this._sizer.observe(this._summary);
      this._sizer.observe(this._actionsBox);
      this._updateText();
      this._updateLook();
      // Two open in one group on load: the first one wins, as with <details name>.
      if (this.hasAttribute('open') && this._groupMembers().some((el) => el.hasAttribute('open') && this._precedes(el))) {
        this.removeAttribute('open');
      }
      this._state = this.hasAttribute('open');
      this._apply(this._state, true);
      if (!this._rendered) requestAnimationFrame(() => { this._rendered = true; });
    }

    disconnectedCallback() {
      this._summary.removeEventListener('click', this._onSummaryClick);
      this._details.removeEventListener('toggle', this._onNativeToggle);
      this._descSlot.removeEventListener('slotchange', this._updateText);
      this._metaSlot.removeEventListener('slotchange', this._updateText);
      this._actionsSlot.removeEventListener('slotchange', this._updateText);
      this._sizer.disconnect();
      if (this._anim) this._anim.cancel();
    }

    attributeChangedCallback(name) {
      if (name === 'open') {
        const open = this.hasAttribute('open');
        if (open === this._state) return;
        this._state = open;
        if (!this.isConnected) return; // connectedCallback applies it
        if (open) this._closeOthers();
        this._apply(open, !this._rendered);
        if (this._rendered) this._emit(open);
      } else if (name === 'variant') {
        this._updateLook();
      } else {
        this._updateText();
      }
    }

    /* ------------------------------- API ------------------------------- */

    get open() { return this.hasAttribute('open'); }
    set open(value) { this.toggleAttribute('open', Boolean(value)); }

    get name() { return this.getAttribute('name') || ''; }
    set name(value) {
      if (value) this.setAttribute('name', value);
      else this.removeAttribute('name');
    }

    show() { this.open = true; }
    hide() { this.open = false; }
    toggle(force) {
      this.open = typeof force === 'boolean' ? force : !this.open;
      return this.open;
    }

    /* ----------------------------- internals ----------------------------- */

    _onSummaryClick(event) {
      // Keyboard activation (Enter / Space) fires this click too.
      event.preventDefault();
      this.toggle();
    }

    /** The browser opened or closed the details itself (find in page). */
    _onNativeToggle() {
      if (this._anim) return;
      const open = this._details.open;
      if (open === this._state) return;
      this._state = open;
      this.toggleAttribute('open', open);
      this._details.classList.toggle('is-open', open);
      if (open) this._closeOthers();
      this._emit(open);
    }

    /** Opens or closes the details, gliding the panel's height. */
    _apply(open, instant) {
      const details = this._details;
      const panel = this._panel;
      const shown = panel.getBoundingClientRect().height; // where it is on screen now
      const wasAnimating = Boolean(this._anim);
      if (this._anim) { this._anim.cancel(); this._anim = null; }
      details.classList.toggle('is-open', open);

      if (instant || this.hasAttribute('no-animate') || reducedMotion() || !this.isConnected) {
        panel.classList.remove('animating');
        details.open = open;
        return;
      }

      const from = open && !wasAnimating && !details.open ? 0 : shown;
      details.open = true;
      const to = open ? panel.getBoundingClientRect().height : 0;
      if (Math.abs(to - from) < 0.5) {
        details.open = open;
        return;
      }
      const style = getComputedStyle(this);
      const duration = parseFloat(style.getPropertyValue('--_duration')) || 320;
      const easing = style.getPropertyValue('--_ease').trim() || 'ease';
      panel.classList.add('animating');
      const anim = panel.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration, easing });
      this._anim = anim;
      anim.onfinish = () => {
        if (this._anim !== anim) return;
        this._anim = null;
        panel.classList.remove('animating');
        details.open = open;
      };
    }

    _emit(open) {
      const detail = { open, name: this.name };
      this.dispatchEvent(new CustomEvent('accordion-toggle', { detail, bubbles: true, composed: true }));
      if (typeof KakaoComponents !== 'undefined') KakaoComponents.emit(this, 'accordion-toggle', detail);
    }

    /** Other accordions with the same name in the same document or shadow root. */
    _groupMembers() {
      const name = this.getAttribute('name');
      if (!name) return [];
      const root = this.getRootNode();
      if (!root.querySelectorAll) return [];
      const escaped = window.CSS && CSS.escape ? CSS.escape(name) : name.replace(/"/g, '\\"');
      return Array.from(root.querySelectorAll(`${TAG_NAME}[name="${escaped}"]`)).filter((el) => el !== this);
    }

    _precedes(other) {
      return Boolean(other.compareDocumentPosition(this) & Node.DOCUMENT_POSITION_FOLLOWING);
    }

    _closeOthers() {
      this._groupMembers().forEach((el) => { if (el.hasAttribute('open')) el.removeAttribute('open'); });
    }

    /** Number of kakao-accordion ancestors, across shadow roots. */
    _depth() {
      let depth = 0;
      let node = this.parentElement || (this.parentNode && this.parentNode.host) || null;
      while (node) {
        if (node.localName === TAG_NAME) depth++;
        node = node.parentElement || (node.parentNode && node.parentNode.host) || null;
      }
      return depth;
    }

    _updateLook() {
      const variant = (this.getAttribute('variant') || '').trim().toLowerCase();
      const depth = this._depth();
      const look = LOOKS.includes(variant) ? variant : LOOKS[Math.min(depth, 2)];
      this._details.dataset.look = look;
      this._frame.dataset.look = look;
      // Rows from the fourth level on step in, so level 4 differs from level 3.
      this._details.toggleAttribute('data-indent', look === 'row' && depth >= 3);
      this._frame.toggleAttribute('data-indent', look === 'row' && depth >= 3);
    }

    _syncActions() {
      if (this._actionsBox.hidden) return;
      this._frame.style.setProperty('--_head-h', `${this._summary.offsetHeight}px`);
      this._frame.style.setProperty('--_actions-w', `${this._actionsBox.offsetWidth}px`);
    }

    _updateText() {
      this._heading.textContent = this.getAttribute('heading') || '';
      const description = this.getAttribute('description') || '';
      this._descText.textContent = description;
      this._descBox.hidden = !description && this._descSlot.assignedNodes().length === 0;
      this._metaBox.hidden = this._metaSlot.assignedNodes().length === 0;
      const actions = this._actionsSlot.assignedElements().length > 0;
      this._actionsBox.hidden = !actions;
      this._actionsSpace.hidden = !actions;
      this._syncActions();
    }
  }

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, {
      triggers: ['accordion-toggle'],
      reactions: {},
    });
  }

  customElements.define(TAG_NAME, KakaoAccordion);
})();
