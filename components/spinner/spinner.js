/**
 * <kakao-spinner>
 * ============================================================================
 * A turning ring for "something is loading and we don't know how long". The
 * same ring the button shows while it runs, on its own: inline next to text,
 * inside a card, or large in the middle of a panel. Not interactive: it never
 * takes focus. Vanilla JS, Shadow DOM, no deps.
 *
 * For a load with a known amount use <kakao-progress>; a spinner has no value.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     spinner.js
 *  css        none
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="spinner.js"><\/script>
 *
 *   <kakao-spinner></kakao-spinner>                              announced as "Loading"
 *   <kakao-spinner label="Saving draft" show-label></kakao-spinner>
 *   <kakao-spinner size="lg" tone="primary" stacked show-label label="Loading invoices"></kakao-spinner>
 *   <kakao-spinner delay="400"></kakao-spinner>                  stays invisible for 400 ms
 *
 *   Show and hide it with the `hidden` attribute, or add and remove the element.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  size        sm · md (default) · lg. md is the button's spinner.
 *  tone        none (default) · primary · success · warning · danger · muted.
 *              none: the ring takes the surrounding text colour; the others
 *              take a theme role. The label never takes the tone; it keeps
 *              the text colour.
 *  label       What is loading, for assistive technology. Default "Loading".
 *  show-label  Also shows the label, beside the ring.
 *  stacked     With show-label: the label goes under the ring, centred.
 *  delay       Milliseconds to wait before the spinner shows (also "0.4s",
 *              "400ms"). Default 0. Until then it is invisible and silent but
 *              keeps its space, so nothing moves when it appears; a load that
 *              finishes sooner never flashes a spinner. The wait starts when
 *              the element is added to the page and again each time `hidden`
 *              is removed.
 *  hidden      The native attribute: no spinner, no space, nothing announced.
 *
 * ----------------------------------------------------------------------------
 * PROPERTIES
 * ----------------------------------------------------------------------------
 *  shown       true once the delay has passed and the spinner is visible
 *              (read-only).
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  The spinner carries a status (role="status", a polite live region) whose
 *  text is the label, shown or not; the ring is hidden from assistive
 *  technology. The status text is written when the spinner shows, so a screen
 *  reader says "Loading" then, not while a delay is still running.
 *  Where something else already says what is going on (a button that is busy,
 *  a sentence next to the ring), write aria-hidden="true" on the spinner.
 *  Reduced motion: the ring does not turn; it fades in and out in place.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-spinner-size / -sm-size / -lg-size
 *  --kakao-spinner-stroke-width   of the ring, in 24ths of its size (3 = an eighth)
 *  --kakao-spinner-arc            how much of the circle is drawn, 0…100
 *  --kakao-spinner-ring-opacity / -track-opacity (0 = no track behind the arc)
 *  --kakao-spinner-duration       one turn
 *  --kakao-spinner-pulse-duration one fade in and out under reduced motion
 *  --kakao-spinner-appear-duration
 *  --kakao-spinner-color          the ring without a tone (currentColor)
 *  --kakao-spinner-primary / -success / -warning / -danger / -muted
 *  --kakao-spinner-gap / -label-font-size / -label-font-weight
 *
 * Parts: spinner (the whole), ring, label.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-spinner';
  if (customElements.get(TAG_NAME)) return;

  const DEFAULT_LABEL = 'Loading';

  /* "400", "400ms", "0.4s" → milliseconds; anything else → 0. */
  function parseDelay(value) {
    const match = /^\s*(\d*\.?\d+)\s*(ms|s)?\s*$/i.exec(value || '');
    if (!match) return 0;
    const n = parseFloat(match[1]) * (match[2] && match[2].toLowerCase() === 's' ? 1000 : 1);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-spinner- (written by construction.html, edit there) */
        --_size: var(--kakao-spinner-size, 18px);
        --_sm-size: var(--kakao-spinner-sm-size, 14px);
        --_lg-size: var(--kakao-spinner-lg-size, 32px);
        --_stroke-width: var(--kakao-spinner-stroke-width, 3);
        --_arc: var(--kakao-spinner-arc, 74);
        --_ring-opacity: var(--kakao-spinner-ring-opacity, 0.9);
        --_track-opacity: var(--kakao-spinner-track-opacity, 0);
        --_duration: var(--kakao-spinner-duration, 0.85s);
        --_pulse-duration: var(--kakao-spinner-pulse-duration, 1.1s);
        --_appear-duration: var(--kakao-spinner-appear-duration, 180ms);
        --_color: var(--kakao-spinner-color, currentColor);
        --_primary: var(--kakao-spinner-primary, var(--kakao-color-primary, #4f46e5));
        --_success: var(--kakao-spinner-success, var(--kakao-color-success, #15803d));
        --_warning: var(--kakao-spinner-warning, var(--kakao-color-warning, #b45309));
        --_danger: var(--kakao-spinner-danger, var(--kakao-color-danger, #dc2626));
        --_muted: var(--kakao-spinner-muted, var(--kakao-color-muted, #62626c));
        --_gap: var(--kakao-spinner-gap, 0.5em);
        --_label-font-size: var(--kakao-spinner-label-font-size, inherit);
        --_label-font-weight: var(--kakao-spinner-label-font-weight, inherit);
        /* @kakao-settings:end */
        display: inline-flex;
        vertical-align: middle;
        max-width: 100%;
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) { --_size: var(--_sm-size); }
      :host([size="lg"]) { --_size: var(--_lg-size); }
      :host([tone="primary"]) { --_color: var(--_primary); }
      :host([tone="success"]) { --_color: var(--_success); }
      :host([tone="warning"]) { --_color: var(--_warning); }
      :host([tone="danger"])  { --_color: var(--_danger); }
      :host([tone="muted"])   { --_color: var(--_muted); }

      .spinner {
        display: inline-flex;
        align-items: center;
        gap: var(--_gap);
        min-width: 0;
        max-width: 100%;
        position: relative;
        animation: appear var(--_appear-duration) ease-out;
      }
      /* Waiting out the delay: invisible, but the space is already taken. */
      .spinner[data-waiting] { visibility: hidden; animation: none; }
      :host([stacked]) .spinner { flex-direction: column; text-align: center; }

      .ring {
        display: block;
        flex: none;
        color: var(--_color);
        line-height: 0;
      }
      svg {
        display: block;
        width: var(--_size);
        height: var(--_size);
        animation: spin var(--_duration) linear infinite;
      }
      circle {
        fill: none;
        stroke: currentColor;
        stroke-width: var(--_stroke-width);
      }
      .track { opacity: var(--_track-opacity); }
      .arc {
        stroke-linecap: round;
        stroke-dasharray: var(--_arc) 100;
        opacity: var(--_ring-opacity);
      }

      .label {
        min-width: 0;
        font-size: var(--_label-font-size);
        font-weight: var(--_label-font-weight);
        overflow-wrap: anywhere;
      }
      .label[hidden] { display: none; }

      .sr {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes appear { from { opacity: 0; } }
      @keyframes pulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }

      /* Reduced motion: no turning, the ring fades in and out in place. */
      @media (prefers-reduced-motion: reduce) {
        .spinner { animation: none; }
        svg { animation: none; }
        .ring { animation: pulse var(--_pulse-duration) ease-in-out infinite; }
      }

      @media (forced-colors: active) {
        .ring { color: CanvasText; }
      }
    </style>
    <span class="spinner" part="spinner" data-waiting>
      <span class="ring" part="ring" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <circle class="track" cx="12" cy="12" r="9"/>
          <circle class="arc" cx="12" cy="12" r="9" pathLength="100"/>
        </svg>
      </span>
      <span class="label" part="label" aria-hidden="true" hidden></span>
      <span class="sr" role="status"></span>
    </span>
  `;

  class KakaoSpinner extends HTMLElement {
    static get observedAttributes() {
      return ['label', 'show-label', 'delay', 'hidden'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).appendChild(TEMPLATE.content.cloneNode(true));
      this._box = this.shadowRoot.querySelector('.spinner');
      this._label = this.shadowRoot.querySelector('.label');
      this._sr = this.shadowRoot.querySelector('.sr');
      this._shown = false;
      this._timer = 0;
    }

    connectedCallback() {
      this._start();
    }

    disconnectedCallback() {
      this._reset();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected) return;
      if (name === 'hidden') {
        /* Hidden ends the run; shown again, the delay counts from the start. */
        if (newValue === null) this._start(); else this._reset();
        return;
      }
      if (name === 'delay') {
        if (!this._shown && !this.hasAttribute('hidden')) this._start();
        return;
      }
      this._renderLabel();
    }

    /** true once the delay has passed and the spinner is visible. */
    get shown() {
      return this._shown;
    }

    _reset() {
      clearTimeout(this._timer);
      this._timer = 0;
      this._shown = false;
      this._box.setAttribute('data-waiting', '');
      this._renderLabel();
    }

    _start() {
      this._reset();
      if (this.hasAttribute('hidden')) return;
      const delay = parseDelay(this.getAttribute('delay'));
      if (delay > 0) {
        this._timer = setTimeout(() => this._show(), delay);
      } else {
        this._show();
      }
    }

    _show() {
      this._timer = 0;
      this._shown = true;
      this._box.removeAttribute('data-waiting');
      this._renderLabel();
    }

    /* The label is written twice: as the visible text (with show-label, there
       from the start so the space is reserved during a delay) and as the
       status text for assistive technology. The status text is only written
       once the spinner shows, so the live region speaks at that moment and
       stays silent during the delay. */
    _renderLabel() {
      const label = (this.getAttribute('label') || '').trim() || DEFAULT_LABEL;
      const visible = this.hasAttribute('show-label');
      this._label.hidden = !visible;
      this._label.textContent = visible ? label : '';
      const status = this._shown ? label : '';
      if (this._sr.textContent !== status) this._sr.textContent = status;
    }
  }

  customElements.define(TAG_NAME, KakaoSpinner);
})();
