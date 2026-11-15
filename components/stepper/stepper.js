/**
 * <kakao-stepper>
 * ============================================================================
 * Where someone is in a multi-step flow (a wizard, a checkout): numbered steps
 * that are done, current or upcoming, joined by lines. It shows progress; the
 * page owns the step content. Vanilla JS, Shadow DOM, no deps.
 *
 * Not to be confused with <kakao-step-switch>: that one is a form control, a
 * slider-like switch that picks one of N values (a radiogroup with a thumb).
 * The stepper picks nothing; it is an ordered list that says "step 2 of 4".
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="stepper.js"><\/script>
 *
 *   <kakao-stepper current="1" list-data='["Account", "Plan", "Payment", "Done"]'></kakao-stepper>
 *
 *   <kakao-stepper current="plan" clickable list-data='[
 *     { "value": "account", "label": "Account", "description": "Name and email" },
 *     { "value": "plan", "label": "Plan" },
 *     { "value": "payment", "label": "Payment", "state": "error" }
 *   ]'></kakao-stepper>
 *
 *   el.next(); el.previous(); el.goTo(2); el.goTo('payment');
 *   el.steps = ['Cart', 'Address', 'Pay'];   // from script
 *
 *   KakaoStepper.texts = { summary: 'Schritt {current} von {total}' };   // for every stepper
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  list-data    JSON array of steps (never "data"). Each step is a string (the
 *               label) or { "label", "description"?, "value"?, "state"? }.
 *               state "error" marks a step as failed (danger colour, a mark
 *               and the word "Error" for screen readers); state "done" marks a
 *               step as done wherever it sits (a skipped or prefilled step).
 *  current      The current step: its 0-based index, or the value of a step
 *               that has one. Default 0. Steps before it are done, steps after
 *               it upcoming. An index equal to the number of steps means the
 *               flow is finished: every step is done, none is current. The
 *               attribute always reflects the state.
 *  orientation  "horizontal" (default): markers in a row, labels below.
 *               "vertical": markers in a column, labels beside them.
 *  collapse     What a horizontal stepper does when it is too narrow.
 *               "auto" (default): when a step would get less than
 *               --kakao-stepper-min-step-width, it becomes one line
 *               ("Step 2 of 4" and the current label) over a segmented bar.
 *               "always": always that compact form. "never": always the row.
 *  clickable    Makes steps buttons. Present (or "done"): the steps before the
 *               current one. "all": every step but the current one. Without
 *               it nothing is focusable.
 *  label        Accessible name of the list. Default "Progress".
 *
 * PROPERTIES: steps (get / set, same shapes as list-data), current (index,
 * get / set), value (the current step's value, or null), compact (read-only:
 * whether the compact form is showing).
 *
 * METHODS: next(), previous(), goTo(indexOrValue). Each returns true when the
 * current step changed. next() on the last step finishes the flow.
 *
 * KakaoStepper.texts: the words for every stepper: { done, error, summary,
 * complete }. summary and complete take {current} and {total}.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  step-select     { index, value, label, previousIndex }  cancelable. A
 *                  clickable step was activated (click, Enter, Space). Unless
 *                  preventDefault() is called the stepper moves to that step.
 *  stepper-change  { index, value, label, previousIndex, source }  the current
 *                  step changed; source is "select" (a clicked step) or "api"
 *                  (next / previous / goTo / the current property). Changing
 *                  the attribute does not fire it.
 *
 * Keyboard (clickable): Tab to a step, Enter or Space to activate; the arrow
 * keys, Home and End move between the clickable steps.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-stepper-done-bg / -done-mark / -current-border / -current-text / -current-bg
 *  --kakao-stepper-upcoming-border / -upcoming-text / -upcoming-bg / -line / -line-done
 *  --kakao-stepper-label / -label-upcoming / -description / -danger / -hover-bg / -focus
 *  --kakao-stepper-font-size / -label-weight / -current-weight / -description-font-size
 *  --kakao-stepper-marker-size / -marker-font-size / -marker-weight / -marker-radius
 *  --kakao-stepper-border-width / -line-width / -line-gap / -label-gap / -vertical-gap
 *  --kakao-stepper-min-step-width / -bar-height / -bar-gap / -radius
 *
 * Parts: root, summary, list, step, control, marker, label, description.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-stepper';
  if (customElements.get(TAG_NAME)) return;

  /** The built-in words. Change them for every stepper with KakaoStepper.texts. */
  const TEXTS = Object.freeze({
    done: 'Done',
    error: 'Error',
    summary: 'Step {current} of {total}',
    complete: 'All {total} steps done',
  });

  const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const BANG = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 3.5v5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="12.25" r="1.15" fill="currentColor"/></svg>';

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-stepper- (written by construction.html, edit there) */
        --_done-bg: var(--kakao-stepper-done-bg, var(--kakao-color-primary, #4f46e5));
        --_done-mark: var(--kakao-stepper-done-mark, var(--kakao-color-bg, #ffffff));
        --_current-border: var(--kakao-stepper-current-border, var(--kakao-color-primary, #4f46e5));
        --_current-text: var(--kakao-stepper-current-text, var(--kakao-color-primary, #4f46e5));
        --_current-bg: var(--kakao-stepper-current-bg, transparent);
        --_upcoming-border: var(--kakao-stepper-upcoming-border, var(--kakao-color-border, #82828b));
        --_upcoming-text: var(--kakao-stepper-upcoming-text, var(--kakao-color-muted, #62626c));
        --_upcoming-bg: var(--kakao-stepper-upcoming-bg, transparent);
        --_line: var(--kakao-stepper-line, var(--kakao-color-subtle-strong, #e6e6e8));
        --_line-done: var(--kakao-stepper-line-done, var(--kakao-color-primary, #4f46e5));
        --_label: var(--kakao-stepper-label, var(--kakao-color-text, #18181b));
        --_label-upcoming: var(--kakao-stepper-label-upcoming, var(--kakao-color-muted, #62626c));
        --_description: var(--kakao-stepper-description, var(--kakao-color-muted, #62626c));
        --_danger: var(--kakao-stepper-danger, var(--kakao-color-danger, #dc2626));
        --_hover-bg: var(--kakao-stepper-hover-bg, var(--kakao-color-subtle-strong, #e6e6e8));
        --_focus: var(--kakao-stepper-focus, var(--kakao-color-focus, #2563eb));
        --_font-size: var(--kakao-stepper-font-size, 0.875rem);
        --_label-weight: var(--kakao-stepper-label-weight, 500);
        --_current-weight: var(--kakao-stepper-current-weight, 600);
        --_description-font-size: var(--kakao-stepper-description-font-size, 0.8125rem);
        --_marker-size: var(--kakao-stepper-marker-size, 2rem);
        --_marker-font-size: var(--kakao-stepper-marker-font-size, 0.8125rem);
        --_marker-weight: var(--kakao-stepper-marker-weight, 600);
        --_marker-radius: var(--kakao-stepper-marker-radius, 999px);
        --_border-width: var(--kakao-stepper-border-width, 2px);
        --_line-width: var(--kakao-stepper-line-width, 2px);
        --_line-gap: var(--kakao-stepper-line-gap, 0.375rem);
        --_label-gap: var(--kakao-stepper-label-gap, 0.5rem);
        --_vertical-gap: var(--kakao-stepper-vertical-gap, 1.5rem);
        --_min-step-width: var(--kakao-stepper-min-step-width, 6rem);
        --_bar-height: var(--kakao-stepper-bar-height, 6px);
        --_bar-gap: var(--kakao-stepper-bar-gap, 4px);
        --_radius: var(--kakao-stepper-radius, 6px);
        /* @kakao-settings:end */
        display: block;
        min-width: 0;
        font-size: var(--_font-size);
        line-height: 1.4;
        color: var(--_label);
      }
      :host([hidden]) { display: none; }

      .root { position: relative; min-width: 0; }
      .probe-box { position: absolute; width: 0; height: 0; overflow: hidden; visibility: hidden; }
      .probe { display: block; width: var(--_min-step-width); height: 1px; }
      .sr {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
        border: 0;
      }

      ol {
        display: flex;
        align-items: flex-start;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .step {
        position: relative;
        flex: 1 1 0;
        min-width: 0;
        display: flex;
        justify-content: center;
      }
      /* The line to the next step: from this marker's edge to the next one's. */
      .step:not(:last-child)::after {
        content: "";
        position: absolute;
        top: calc((var(--_marker-size) - var(--_line-width)) / 2);
        inset-inline-start: calc(50% + var(--_marker-size) / 2 + var(--_line-gap));
        width: calc(100% - var(--_marker-size) - var(--_line-gap) * 2);
        height: var(--_line-width);
        border-radius: 999px;
        background: var(--_line);
      }
      .step.is-passed::after { background: var(--_line-done); }

      .control {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--_label-gap);
        max-width: 100%;
        min-width: 0;
        box-sizing: border-box;
        margin: 0;
        padding: 0 0.25rem;
        border: 0;
        border-radius: var(--_radius);
        background: none;
        color: inherit;
        font: inherit;
        text-align: center;
      }
      button.control { cursor: pointer; -webkit-tap-highlight-color: transparent; }
      .control:focus { outline: none; }
      .control:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; }

      .marker {
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: var(--_marker-size);
        height: var(--_marker-size);
        border: var(--_border-width) solid var(--_upcoming-border);
        border-radius: var(--_marker-radius);
        background: var(--_upcoming-bg);
        color: var(--_upcoming-text);
        font-size: var(--_marker-font-size);
        font-weight: var(--_marker-weight);
        font-variant-numeric: tabular-nums;
        line-height: 1;
      }
      .marker svg { display: block; width: 1rem; height: 1rem; }
      .is-current .marker {
        border-color: var(--_current-border);
        background: var(--_current-bg);
        color: var(--_current-text);
      }
      .is-done .marker {
        border-color: var(--_done-bg);
        background: var(--_done-bg);
        color: var(--_done-mark);
      }
      .is-error .marker {
        border-color: var(--_danger);
        background: transparent;
        color: var(--_danger);
      }
      button.control:hover .marker { box-shadow: 0 0 0 4px var(--_hover-bg); }

      .text { display: block; min-width: 0; max-width: 100%; }
      .label {
        display: block;
        font-weight: var(--_label-weight);
        color: var(--_label);
        overflow-wrap: anywhere;
      }
      .is-upcoming .label { color: var(--_label-upcoming); }
      .is-current .label { font-weight: var(--_current-weight); }
      .is-error .label { color: var(--_danger); }
      .description {
        display: block;
        margin-top: 0.125rem;
        font-size: var(--_description-font-size);
        color: var(--_description);
        overflow-wrap: anywhere;
      }

      /* ---- vertical ---- */
      .is-vertical ol { flex-direction: column; align-items: stretch; }
      .is-vertical .step { flex: none; justify-content: flex-start; padding-bottom: var(--_vertical-gap); }
      .is-vertical .step:last-child { padding-bottom: 0; }
      .is-vertical .step:not(:last-child)::after {
        top: calc(var(--_marker-size) + var(--_line-gap));
        bottom: var(--_line-gap);
        inset-inline-start: calc((var(--_marker-size) - var(--_line-width)) / 2);
        width: var(--_line-width);
        height: auto;
      }
      .is-vertical .control {
        flex-direction: row;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0;
        text-align: start;
      }
      /* The label's first line sits on the marker's middle. */
      .is-vertical .text { padding-top: calc((var(--_marker-size) - 1lh) / 2); }

      /* ---- compact: one line of text over a segmented bar ---- */
      .summary { display: none; }
      .is-compact .summary {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0 0.5rem;
        margin-bottom: 0.25rem;
      }
      .summary-count { color: var(--_description); font-variant-numeric: tabular-nums; }
      .summary-label { font-weight: var(--_current-weight); color: var(--_label); overflow-wrap: anywhere; }
      .summary-label svg { display: inline-block; width: 1em; height: 1em; margin-inline-end: 0.25rem; vertical-align: -0.125em; }
      .summary.is-error .summary-label { color: var(--_danger); }
      .summary-description { flex-basis: 100%; font-size: var(--_description-font-size); color: var(--_description); }
      .is-compact ol { gap: var(--_bar-gap); align-items: stretch; }
      .is-compact .step::after { display: none; }
      .is-compact .step { display: block; }
      .is-compact .control {
        display: flex;
        width: 100%;
        min-height: 1.5rem; /* a 24px target around the thin segment */
        padding: 0;
        justify-content: center;
      }
      .is-compact .marker {
        width: 100%;
        height: var(--_bar-height);
        border: 0;
        border-radius: 999px;
        background: var(--_line);
        font-size: 0;
      }
      .is-compact .marker > * { display: none; }
      .is-compact .is-done .marker, .is-compact .is-current .marker { background: var(--_done-bg); }
      .is-compact .is-error .marker { background: var(--_danger); }
      /* the current segment stands a little taller, so it differs from the done ones by shape */
      .is-compact .is-current .marker { height: calc(var(--_bar-height) + 4px); }
      .is-compact button.control:hover .marker { box-shadow: 0 0 0 3px var(--_hover-bg); }
      .is-compact .text {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      @media (forced-colors: active) {
        .marker { forced-color-adjust: none; border-color: CanvasText; background: Canvas; color: CanvasText; }
        .is-current .marker { border-color: Highlight; color: Highlight; background: Canvas; }
        .is-done .marker { border-color: Highlight; background: Highlight; color: HighlightText; }
        .is-error .marker { border-color: CanvasText; background: Canvas; color: CanvasText; }
        .step:not(:last-child)::after { forced-color-adjust: none; background: GrayText; }
        .step.is-passed::after { background: Highlight; }
        .is-compact .marker { background: GrayText; }
        .is-compact .is-done .marker, .is-compact .is-current .marker { background: Highlight; }
        .is-compact .is-error .marker { background: CanvasText; }
        .control:focus-visible { outline-color: Highlight; }
      }
    </style>
    <div class="root" part="root">
      <span class="probe-box" aria-hidden="true"><span class="probe"></span></span>
      <div class="summary" part="summary" aria-hidden="true"></div>
      <ol part="list" role="list"></ol>
    </div>
  `;

  /** Normalises one step: a string, or { label, description, value, state }. */
  function toStep(raw) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const state = raw.state === 'error' || raw.state === 'done' ? raw.state : '';
      return {
        label: String(raw.label ?? raw.title ?? raw.value ?? ''),
        description: raw.description == null ? '' : String(raw.description),
        value: raw.value == null ? null : String(raw.value),
        state,
      };
    }
    return { label: String(raw ?? ''), description: '', value: null, state: '' };
  }

  const fill = (text, current, total) => String(text).replace('{current}', current).replace('{total}', total);

  const instances = new Set(); // connected steppers, redrawn when the texts change
  let texts = { ...TEXTS };

  class KakaoStepper extends HTMLElement {
    /** The words every stepper uses. Setting it merges into the built-in ones. */
    static get texts() { return { ...texts }; }
    static set texts(value) {
      texts = { ...TEXTS, ...(value && typeof value === 'object' ? value : {}) };
      instances.forEach((el) => el._render());
    }

    static get observedAttributes() {
      return ['list-data', 'current', 'orientation', 'collapse', 'clickable', 'label'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._root = shadow.querySelector('.root');
      this._probe = shadow.querySelector('.probe');
      this._summary = shadow.querySelector('.summary');
      this._list = shadow.querySelector('ol');
      this._steps = [];
      this._current = 0;
      this._byValue = false; // the current attribute names a value, so keep writing values
      this._compact = false;
      this._reflecting = false;
      this._list.addEventListener('click', (e) => this._onClick(e));
      this._list.addEventListener('keydown', (e) => this._onKeydown(e));
      this._observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this._measure()) : null;
    }

    connectedCallback() {
      instances.add(this);
      this._readListData();
      this._readCurrent();
      this._render();
      if (this._observer) this._observer.observe(this);
    }

    disconnectedCallback() {
      instances.delete(this);
      if (this._observer) this._observer.disconnect();
    }

    attributeChangedCallback(name) {
      if (this._reflecting) return;
      if (name === 'list-data') { this._readListData(); this._readCurrent(); }
      if (name === 'current') this._readCurrent();
      if (this.isConnected) this._render();
    }

    /* ---------------------------------------------------------------- API */

    get steps() {
      return this._steps.map((s) => ({ ...s }));
    }

    set steps(list) {
      this._steps = Array.isArray(list) ? list.map(toStep).filter((s) => s.label) : [];
      if (this.hasAttribute('current')) this._readCurrent();
      else this._current = Math.min(this._current, this._steps.length);
      if (this.isConnected) this._render();
    }

    /** Index of the current step; equal to the number of steps when the flow is finished. */
    get current() { return this._current; }
    set current(value) { this.goTo(value); }

    /** The current step's value, or null (no value, or finished). */
    get value() {
      const step = this._steps[this._current];
      return step ? step.value : null;
    }

    /** Whether the compact form (summary line and bar) is showing. */
    get compact() { return this._compact; }

    next() { return this._move(this._current + 1, 'api'); }

    previous() { return this._move(this._current - 1, 'api'); }

    /** Go to a step by index or by value. Returns true when the current step changed. */
    goTo(target) {
      const index = this._resolve(target);
      return index == null ? false : this._move(index, 'api');
    }

    /* ----------------------------------------------------------- internals */

    _readListData() {
      const raw = this.getAttribute('list-data');
      if (raw == null) return;
      try {
        const parsed = JSON.parse(raw);
        this._steps = Array.isArray(parsed) ? parsed.map(toStep).filter((s) => s.label) : [];
      } catch (err) {
        console.warn(`${TAG_NAME}: list-data is not valid JSON`, err);
        this._steps = [];
      }
    }

    /** An index for a value or a number; null when it is neither. */
    _resolve(target) {
      if (target == null || target === '') return null;
      if (typeof target !== 'number') {
        const byValue = this._steps.findIndex((s) => s.value != null && s.value === String(target));
        if (byValue !== -1) return byValue;
      }
      const number = Number(target);
      if (!Number.isFinite(number)) return null;
      return Math.max(0, Math.min(this._steps.length, Math.trunc(number)));
    }

    _readCurrent() {
      const raw = this.getAttribute('current');
      const index = this._resolve(raw);
      this._byValue = raw != null && this._steps.some((s) => s.value != null && s.value === raw);
      this._current = index == null ? 0 : index;
    }

    _move(index, source) {
      const next = Math.max(0, Math.min(this._steps.length, index));
      const previousIndex = this._current;
      if (next === previousIndex) return false;
      this._current = next;
      const step = this._steps[next] || null;
      this._reflecting = true;
      this.setAttribute('current', this._byValue && step && step.value != null ? step.value : String(next));
      this._reflecting = false;
      if (this.isConnected) this._render();
      this.dispatchEvent(new CustomEvent('stepper-change', {
        bubbles: true,
        composed: true,
        detail: { index: next, value: step ? step.value : null, label: step ? step.label : '', previousIndex, source },
      }));
      return true;
    }

    _clickMode() {
      if (!this.hasAttribute('clickable')) return '';
      const raw = (this.getAttribute('clickable') || '').toLowerCase();
      if (raw === 'false' || raw === 'off' || raw === 'no' || raw === '0') return '';
      return raw === 'all' ? 'all' : 'done';
    }

    _isCompact() {
      if (this.getAttribute('orientation') === 'vertical' || !this._steps.length) return false;
      const mode = this.getAttribute('collapse') || 'auto';
      if (mode === 'never') return false;
      if (mode === 'always') return true;
      const width = this.getBoundingClientRect().width;
      const min = this._probe.getBoundingClientRect().width;
      return width > 0 && width < min * this._steps.length;
    }

    _measure() {
      const compact = this._isCompact();
      if (compact === this._compact) return;
      this._compact = compact;
      this._root.classList.toggle('is-compact', compact);
    }

    _render() {
      const steps = this._steps;
      const current = this._current;
      const mode = this._clickMode();
      const hadFocus = this.shadowRoot.activeElement != null;

      this._root.classList.toggle('is-vertical', this.getAttribute('orientation') === 'vertical');
      this._list.setAttribute('aria-label', this.getAttribute('label') || 'Progress');

      this._list.replaceChildren(...steps.map((step, index) => {
        const isCurrent = index === current;
        const isError = step.state === 'error';
        const isDone = !isCurrent && (index < current || step.state === 'done');

        const li = document.createElement('li');
        li.className = 'step ' + (isCurrent ? 'is-current' : isDone ? 'is-done' : 'is-upcoming');
        if (isError) li.classList.add('is-error');
        if (index < current) li.classList.add('is-passed');
        li.setAttribute('part', 'step');
        if (isCurrent) li.setAttribute('aria-current', 'step');

        const asButton = !isCurrent && (mode === 'all' || (mode === 'done' && index < current));
        const control = document.createElement(asButton ? 'button' : 'span');
        control.className = 'control';
        control.setAttribute('part', 'control');
        if (asButton) {
          control.type = 'button';
          control.dataset.index = String(index);
        } else if (isCurrent) {
          control.tabIndex = -1; // focus lands here after a step was picked
        }

        const marker = document.createElement('span');
        marker.className = 'marker';
        marker.setAttribute('part', 'marker');
        marker.setAttribute('aria-hidden', 'true');
        if (isError) marker.innerHTML = BANG;
        else if (isDone) marker.innerHTML = CHECK;
        else marker.textContent = String(index + 1);

        const text = document.createElement('span');
        text.className = 'text';
        const label = document.createElement('span');
        label.className = 'label';
        label.setAttribute('part', 'label');
        label.textContent = step.label;
        text.append(label);
        const stateText = isError ? texts.error : isDone ? texts.done : '';
        if (stateText) {
          const sr = document.createElement('span');
          sr.className = 'sr';
          sr.textContent = `, ${stateText}`;
          label.append(sr);
        }
        if (step.description) {
          const description = document.createElement('span');
          description.className = 'description';
          description.setAttribute('part', 'description');
          description.textContent = step.description;
          text.append(description);
        }

        control.append(marker, text);
        li.append(control);
        return li;
      }));

      this._renderSummary();
      this._measure();
      if (hadFocus) {
        const target = this._list.querySelector('.is-current .control') || this._list.querySelector('button.control');
        if (target) target.focus();
      }
    }

    /** The line shown in the compact form; hidden from screen readers, which read the list. */
    _renderSummary() {
      const total = this._steps.length;
      const step = this._steps[this._current];
      const count = document.createElement('span');
      count.className = 'summary-count';
      this._summary.classList.toggle('is-error', Boolean(step && step.state === 'error'));
      if (!step) {
        count.textContent = total ? fill(texts.complete, total, total) : '';
        this._summary.replaceChildren(count);
        return;
      }
      count.textContent = fill(texts.summary, this._current + 1, total);
      const label = document.createElement('span');
      label.className = 'summary-label';
      if (step.state === 'error') label.innerHTML = BANG;
      label.append(step.label);
      this._summary.replaceChildren(count, label);
      if (step.description) {
        const description = document.createElement('span');
        description.className = 'summary-description';
        description.textContent = step.description;
        this._summary.append(description);
      }
    }

    _onClick(e) {
      const button = e.target.closest('button.control');
      if (!button) return;
      const index = Number(button.dataset.index);
      const step = this._steps[index];
      if (!step) return;
      const allowed = this.dispatchEvent(new CustomEvent('step-select', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { index, value: step.value, label: step.label, previousIndex: this._current },
      }));
      if (allowed) this._move(index, 'select');
    }

    /** Arrow keys, Home and End move between the clickable steps. */
    _onKeydown(e) {
      const button = e.target.closest('button.control');
      if (!button || e.altKey || e.ctrlKey || e.metaKey) return;
      const buttons = Array.from(this._list.querySelectorAll('button.control'));
      const at = buttons.indexOf(button);
      const rtl = getComputedStyle(this).direction === 'rtl';
      let to = -1;
      switch (e.key) {
        case 'ArrowRight': to = at + (rtl ? -1 : 1); break;
        case 'ArrowLeft': to = at + (rtl ? 1 : -1); break;
        case 'ArrowDown': to = at + 1; break;
        case 'ArrowUp': to = at - 1; break;
        case 'Home': to = 0; break;
        case 'End': to = buttons.length - 1; break;
        default: return;
      }
      e.preventDefault();
      if (buttons[to]) buttons[to].focus();
    }
  }

  KakaoStepper.TEXTS = TEXTS; // the built-in words, read-only

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }

  window.KakaoStepper = KakaoStepper;
  customElements.define(TAG_NAME, KakaoStepper);
})();
