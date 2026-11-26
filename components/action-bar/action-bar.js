/**
 * <kakao-action-bar>
 * ============================================================================
 * A floating bar for actions on the items a person has selected or marked:
 * a short summary ("3 marked to fix") and a row of actions ("Show list",
 * "Copy"). Sticky at the bottom (or top) of its container, or fixed to the
 * viewport. With a count it shows itself while something is selected and
 * slides away at 0, and it announces count changes politely.
 * Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        Actions on selected items, floating at the edge: "3 selected · Copy".
 *  not for    A brief notice: kakao-toast; site navigation: kakao-header-bar.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     action-bar.js
 *  css        none
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="action-bar.js" defer><\/script>
 *
 *   <section class="results">
 *     … the list with its checkboxes …
 *     <kakao-action-bar count="0">
 *       <span class="marked">0 marked to fix</span>
 *       <kakao-button slot="actions" label="Show list" variant="secondary"></kakao-button>
 *       <kakao-button slot="actions" label="Copy"></kakao-button>
 *     </kakao-action-bar>
 *   </section>
 *
 *   bar.count = selected.length;   // 0 hides it; above 0 shows it
 *   marked.textContent = `${selected.length} marked to fix`;
 *
 * Put the bar after the items it acts on (at the end of their container for
 * position="bottom", at its start for "top"), so the tab order reaches it
 * after the selection.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  position      bottom (default) · top. The edge it floats at; at the top
 *                it stays below the header bar
 *                (--kakao-header-bar-rendered-height).
 *  fixed         Fixed to the viewport, centred, instead of sticky inside
 *                its container.
 *  count         number. With it the bar is shown while the count is above
 *                0, and slides out at 0 (also when empty or not a number).
 *                Without it the bar is shown.
 *  count-label   What a count change announces, {count} replaced by the
 *                number. Default: the summary's text, else "{count} selected".
 *  label         Accessible name of the bar (a region). Default
 *                "Selection actions".
 *  hidden        Hides the bar at once, without the slide (removing it
 *                slides the bar in).
 *
 * ----------------------------------------------------------------------------
 * PROPERTIES
 * ----------------------------------------------------------------------------
 *  count       number, or null without the attribute; setting null removes it.
 *  shown       true while the bar is shown or sliding in (read-only).
 *
 * ----------------------------------------------------------------------------
 * SLOTS
 * ----------------------------------------------------------------------------
 *  (default)   The summary: what is selected, ideally with the number.
 *  actions     Buttons (kakao-button, size md or sm) or links, in a row that
 *              wraps; the main action last.
 *
 * ----------------------------------------------------------------------------
 * BEHAVIOUR
 * ----------------------------------------------------------------------------
 *  - Sticky (the default): it sticks to the bottom (top) of the scrolling
 *    area while its container is in view and rests at the container's end
 *    (start) otherwise. Inside a scrolling box at the top, set
 *    --kakao-header-bar-rendered-height: 0px on that box.
 *  - Fixed: keeps the safe-area insets, and while shown writes its height to
 *    --kakao-action-bar-rendered-height on the root element, so the page can
 *    keep its last rows reachable:
 *      main { padding-bottom: var(--kakao-action-bar-rendered-height, 0px); }
 *  - Below 30rem the bar spans the full width; a fixed bar then sits flush
 *    with the screen edge, the safe-area inset as its padding.
 *  - Slides in and out from its edge; under reduced motion it fades. While
 *    hidden it takes no space and gets no clicks. Showing it never moves
 *    focus. If focus is in the bar when the count drops to 0 (a "Clear"
 *    action), move it back to the list yourself.
 *  - A polite live region announces a count change above 0, a moment after
 *    it (so the page can update the summary first; quick changes are
 *    announced once). The count at load is not announced, nor a drop to 0.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-action-bar-bg / -text / -shadow
 *  --kakao-action-bar-font-size / -summary-weight
 *  --kakao-action-bar-radius / -padding / -summary-padding-x / -gap / -summary-gap
 *  --kakao-action-bar-min-height / -min-width / -max-width / -gutter / -z-index
 *  --kakao-action-bar-duration / -ease
 *  The radius is the md button's (14px) plus the padding (6px), so the
 *  corners of a bar with md buttons are concentric.
 *
 * Parts: bar, summary, actions.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-action-bar';
  if (customElements.get(TAG_NAME)) return;

  const ANNOUNCE_DELAY = 250; // lets the page update the summary; merges quick changes
  const HEIGHT_VAR = '--kakao-action-bar-rendered-height';
  let heightOwner = null;     // the fixed bar whose height the root variable holds

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-action-bar- (written by construction.html, edit there) */
        --_bg: var(--kakao-action-bar-bg, var(--kakao-color-raised, #ffffff));
        --_text: var(--kakao-action-bar-text, var(--kakao-color-text, #18181b));
        --_shadow: var(--kakao-action-bar-shadow, 0 8px 24px rgb(0 0 0 / .08), 0 0 0 1px color-mix(in srgb, var(--kakao-color-text, #18181b) 10%, transparent));
        --_font-size: var(--kakao-action-bar-font-size, var(--kakao-font-size, 0.95rem));
        --_summary-weight: var(--kakao-action-bar-summary-weight, 500);
        --_radius: var(--kakao-action-bar-radius, 20px);
        --_padding: var(--kakao-action-bar-padding, 6px);
        --_summary-padding-x: var(--kakao-action-bar-summary-padding-x, 0.625rem);
        --_gap: var(--kakao-action-bar-gap, 0.5rem);
        --_summary-gap: var(--kakao-action-bar-summary-gap, 1rem);
        --_min-height: var(--kakao-action-bar-min-height, 56px);
        --_min-width: var(--kakao-action-bar-min-width, 20rem);
        --_max-width: var(--kakao-action-bar-max-width, 48rem);
        --_gutter: var(--kakao-action-bar-gutter, 1rem);
        --_z-index: var(--kakao-action-bar-z-index, 40);
        --_duration: var(--kakao-action-bar-duration, var(--kakao-motion-duration, 320ms));
        --_ease: var(--kakao-action-bar-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        --_slide: calc(100% + var(--_gutter));
        display: flex;
        justify-content: center;
        box-sizing: border-box;
        position: sticky;
        bottom: calc(var(--_gutter) + env(safe-area-inset-bottom, 0px));
        z-index: var(--_z-index);
        pointer-events: none;
      }
      :host([hidden]) { display: none; }
      :host([position="top"]) {
        --_slide: calc(-100% - var(--_gutter));
        bottom: auto;
        top: calc(var(--_gutter) + var(--kakao-header-bar-rendered-height, 0px));
      }
      :host([fixed]) {
        position: fixed;
        inset-inline: 0;
        top: auto;
        bottom: 0;
        margin: 0 !important;
        padding:
          var(--_gutter)
          calc(var(--_gutter) + env(safe-area-inset-right, 0px))
          calc(var(--_gutter) + env(safe-area-inset-bottom, 0px))
          calc(var(--_gutter) + env(safe-area-inset-left, 0px));
      }
      :host([fixed][position="top"]) {
        bottom: auto;
        top: max(var(--kakao-header-bar-rendered-height, 0px), env(safe-area-inset-top, 0px));
        padding-bottom: var(--_gutter);
      }

      .bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--_gap) var(--_summary-gap);
        box-sizing: border-box;
        width: max-content;
        min-width: min(100%, var(--_min-width));
        max-width: min(100%, var(--_max-width));
        min-height: var(--_min-height);
        padding: var(--_padding);
        border-radius: var(--_radius);
        background: var(--_bg);
        color: var(--_text);
        box-shadow: var(--_shadow);
        font-family: var(--kakao-font-family, system-ui, -apple-system, "Segoe UI", sans-serif);
        font-size: var(--_font-size);
        line-height: 1.4;
        pointer-events: auto;
        transition: transform var(--_duration) var(--_ease), opacity var(--_duration) var(--_ease);
      }
      .bar[hidden] { display: none; }
      .bar.out { opacity: 0; transform: translateY(var(--_slide)); pointer-events: none; }

      .summary {
        flex: 1 1 auto;
        min-width: 0;
        padding-inline: var(--_summary-padding-x) 0;
        font-weight: var(--_summary-weight);
        overflow-wrap: anywhere;
      }
      .summary ::slotted(*) { margin-block: 0; }
      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: var(--_gap);
        margin-inline-start: auto;
      }
      .summary[hidden], .actions[hidden] { display: none; }

      .live {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      @media (max-width: 30rem) {
        .bar { width: 100%; min-width: 0; max-width: none; }
        :host([fixed]), :host([fixed][position="top"]) { padding: 0; }
        :host([fixed]) .bar {
          border-radius: var(--_radius) var(--_radius) 0 0;
          padding:
            var(--_padding)
            calc(var(--_padding) + env(safe-area-inset-right, 0px))
            calc(var(--_padding) + env(safe-area-inset-bottom, 0px))
            calc(var(--_padding) + env(safe-area-inset-left, 0px));
        }
        :host([fixed][position="top"]) .bar {
          border-radius: 0 0 var(--_radius) var(--_radius);
          padding-bottom: var(--_padding);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .bar.out { transform: none; }
      }
      @media (forced-colors: active) {
        .bar { border: 1px solid CanvasText; }
      }
    </style>
    <div class="bar out" part="bar" role="region" hidden>
      <div class="summary" part="summary"><slot></slot></div>
      <div class="actions" part="actions"><slot name="actions"></slot></div>
    </div>
    <div class="live" role="status" aria-live="polite" aria-atomic="true"></div>
  `;

  class KakaoActionBar extends HTMLElement {
    static get observedAttributes() {
      return ['count', 'label', 'hidden', 'fixed'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._bar = shadow.querySelector('.bar');
      this._summary = shadow.querySelector('.summary');
      this._actions = shadow.querySelector('.actions');
      this._live = shadow.querySelector('.live');
      this._slots = {
        summary: shadow.querySelector('slot:not([name])'),
        actions: shadow.querySelector('slot[name="actions"]'),
      };
      Object.values(this._slots).forEach((slot) => slot.addEventListener('slotchange', () => this._renderSlots()));
      this._ready = false;
      this._leaveTimer = 0;
      this._announceTimer = 0;
      this._bar.addEventListener('transitionend', (e) => {
        if (e.target === this._bar && e.propertyName === 'opacity') this._settle();
      });
      this._resize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this._syncHeight()) : null;
    }

    connectedCallback() {
      this._renderLabel();
      this._renderSlots();
      this._sync(false);
      if (this._resize) this._resize.observe(this);
      this._ready = true;
    }

    disconnectedCallback() {
      this._ready = false;
      if (this._resize) this._resize.disconnect();
      clearTimeout(this._announceTimer);
      clearTimeout(this._leaveTimer);
      this._releaseHeight();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this._ready || oldValue === newValue) return;
      if (name === 'label') { this._renderLabel(); return; }
      if (name === 'count') this._queueAnnouncement();
      this._sync(true);
    }

    /* ------------------------------ API ------------------------------- */

    get count() {
      if (!this.hasAttribute('count')) return null;
      const n = parseFloat(this.getAttribute('count'));
      return Number.isFinite(n) ? n : 0;
    }
    set count(value) {
      if (value === null || value === undefined) this.removeAttribute('count');
      else this.setAttribute('count', String(value));
    }

    get shown() { return !this._bar.hidden && !this._bar.classList.contains('out'); }

    /* ---------------------------- Rendering --------------------------- */

    _wanted() {
      const count = this.count;
      return !this.hidden && (count === null || count > 0);
    }

    _renderLabel() {
      this._bar.setAttribute('aria-label', this.getAttribute('label') || 'Selection actions');
    }

    _renderSlots() {
      const filled = (slot) => slot.assignedNodes().some((n) => n.nodeType === 1 || n.textContent.trim());
      this._summary.hidden = !filled(this._slots.summary);
      this._actions.hidden = !filled(this._slots.actions);
    }

    /** Shows or hides the bar; animate slides (fades under reduced motion). */
    _sync(animate) {
      const bar = this._bar;
      clearTimeout(this._leaveTimer);
      if (this._wanted()) {
        if (bar.hidden || bar.classList.contains('out')) {
          const wasHidden = bar.hidden;
          bar.hidden = false;
          if (animate && wasHidden) void bar.offsetWidth; // start from the "out" state
          bar.classList.remove('out');
        }
      } else if (!bar.hidden) {
        bar.classList.add('out');
        if (!animate || this.hidden) {
          bar.hidden = true;
        } else {
          // transitionend settles it; the timer covers a transition that never runs.
          this._leaveTimer = setTimeout(() => this._settle(), this._durationMs() + 80);
        }
      }
      this._syncHeight();
    }

    /** After the slide out: no box, no space. */
    _settle() {
      clearTimeout(this._leaveTimer);
      if (this._bar.classList.contains('out') && !this._wanted()) this._bar.hidden = true;
      this._syncHeight();
    }

    _durationMs() {
      const value = getComputedStyle(this._bar).transitionDuration.split(',')[0] || '0s';
      const n = parseFloat(value);
      if (!Number.isFinite(n)) return 0;
      return /ms$/.test(value.trim()) ? n : n * 1000;
    }

    /* ------------------------- Rendered height ------------------------ */

    _syncHeight() {
      if (!this.isConnected) return;
      if (this.hasAttribute('fixed') && this._wanted() && !this._bar.hidden) {
        heightOwner = this;
        const height = Math.round(this.getBoundingClientRect().height * 100) / 100;
        document.documentElement.style.setProperty(HEIGHT_VAR, `${height}px`);
      } else {
        this._releaseHeight();
      }
    }

    _releaseHeight() {
      if (heightOwner !== this) return;
      heightOwner = null;
      document.documentElement.style.removeProperty(HEIGHT_VAR);
    }

    /* -------------------------- Announcements ------------------------- */

    _queueAnnouncement() {
      clearTimeout(this._announceTimer);
      this._announceTimer = setTimeout(() => {
        const count = this.count;
        if (count === null || count <= 0 || this.hidden) return;
        const template = this.getAttribute('count-label');
        const summary = this._slots.summary.assignedNodes({ flatten: true })
          .map((n) => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
        const text = template ? template.replace(/\{count\}/g, count)
          : summary || `${count} selected`;
        // Empty first, so the same words twice are announced twice.
        this._live.textContent = '';
        requestAnimationFrame(() => { this._live.textContent = text; });
      }, ANNOUNCE_DELAY);
    }
  }

  customElements.define(TAG_NAME, KakaoActionBar);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }
})();
