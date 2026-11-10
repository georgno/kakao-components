/**
 * <kakao-error-summary>
 * ============================================================================
 * The list of a form's errors at the top of the form, each one a link to its
 * field (the GOV.UK error summary pattern). It takes over the browser's error
 * bubbles: on submit it lists every invalid field, takes focus so a screen
 * reader reads it, and a link moves focus to the field. Drawn as a danger
 * <kakao-alert>. Vanilla JS, Shadow DOM, no deps; needs alert.js (load it
 * first).
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="alert.js" defer><\/script>
 *   <script src="error-summary.js" defer><\/script>
 *
 *   <form id="signup">
 *     <kakao-error-summary></kakao-error-summary>   (inside the form)
 *     <kakao-text-input label="Name" name="name" required></kakao-text-input>
 *     …
 *   </form>
 *
 *   <kakao-error-summary for="signup"></kakao-error-summary>   (anywhere)
 *
 *   <kakao-error-summary>                          (around the form)
 *     <form>…</form>
 *   </kakao-error-summary>
 *
 *   Errors the page knows itself (a server reply):
 *   summary.show([{ field: 'email', message: 'That address is taken' },
 *                 { message: 'The server is busy, try again in a minute' }]);
 *   summary.clear();
 *
 * ----------------------------------------------------------------------------
 * WHICH FORM, WHICH FIELDS
 * ----------------------------------------------------------------------------
 * The form is the one named by `for` (an id), else the form the summary is
 * in, else the first form inside it. Its fields are form.elements: native
 * inputs, selects and textareas, and form-associated custom elements (the
 * kakao text input, textarea, select, combobox, checkbox, radio group, date
 * input …). Disabled fields and fieldsets are skipped; a native radio group
 * is listed once.
 *  invalid    validity.valid is false (ElementInternals for kakao fields), or
 *             a kakao field has an `error` attribute.
 *  label      `label` or aria-label on a kakao field; for a native field its
 *             aria-labelledby, aria-label, <label>, or the <legend> of the
 *             fieldset around a radio group; else placeholder or name.
 *  message    the field's `error` attribute, else its validationMessage (the
 *             browser's or the component's text).
 * Each line reads "Label: message" and links to the field.
 *
 * ----------------------------------------------------------------------------
 * BEHAVIOUR
 * ----------------------------------------------------------------------------
 *  - Submit: the browser's checks fire `invalid` on each bad field; the
 *    summary cancels them (no bubbles), lists the fields and takes focus.
 *    On a form with novalidate it runs the same checks on submit and cancels
 *    the submit when there are errors. A valid submit clears the summary.
 *  - Focus: shown by submit, validate() or show(), the box takes focus
 *    (tabindex="-1") and its inner alert has role="alert", so it is read out.
 *  - Links: a click (or Enter) focuses the field through its focus() (kakao
 *    fields forward it to their inner control; a radio group goes to the
 *    checked or first radio) and scrolls it, with its label, into view below
 *    the sticky header bar (--kakao-header-bar-rendered-height, or the page's
 *    scroll-padding-top) plus --kakao-error-summary-scroll-gap.
 *  - Updates: without `live` the list stays as it is until the next submit.
 *    With `live`, a field that becomes valid drops out of the list while the
 *    person types, and the box goes away once the last one is fixed. New
 *    errors are only added on submit.
 *  - Reset: a form reset clears the summary.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  for            Id of the form to watch.
 *  heading        Title of the box. Default "There is a problem".
 *  heading-level  Level of the title's heading element, 2 (default) to 6.
 *  live           Fixed fields drop out of the list as they are fixed.
 *  no-focus       Showing does not move focus (e.g. a summary on page load
 *                 that the page announces another way).
 *  has-errors     Set by the component while errors are shown (read only).
 *
 * SLOTS: default (content after the box, e.g. the wrapped form),
 * description (text between the title and the list).
 *
 * ----------------------------------------------------------------------------
 * PROPERTIES AND METHODS
 * ----------------------------------------------------------------------------
 *  form                  The form it watches (or null).
 *  errors                The listed errors: [{ field, label, message }].
 *  validate()            Checks the form now and shows or clears the
 *                        summary. Returns true when the form is valid.
 *  show(errors, { focus = true } = {})
 *                        Shows the given errors instead: [{ field, message,
 *                        label }]. field is an element, an id or omitted (a
 *                        line without a link); label defaults to the field's.
 *  clear()               Empties and hides the summary.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed; also emitted as triggers)
 * ----------------------------------------------------------------------------
 *  error-summary-show    { errors }   the list was shown or changed.
 *  error-summary-clear   {}           the summary was emptied.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-error-summary-link / -focus           link and focus ring colours
 *  --kakao-error-summary-item-gap / -list-gap    between lines, above the list
 *  --kakao-error-summary-space                   below the box, before slotted content
 *  --kakao-error-summary-scroll-gap              space kept above a field scrolled to
 *  The box itself is a danger alert: --kakao-alert-* applies (set them on
 *  kakao-error-summary to change summaries only).
 *
 * Parts: alert, title, description, list, item, link.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-error-summary';
  if (customElements.get(TAG_NAME)) return;

  const DEFAULT_HEADING = 'There is a problem';
  const DEFAULT_MESSAGE = 'Check this field.';

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-error-summary- (written by construction.html, edit there) */
        --_link: var(--kakao-error-summary-link, var(--kakao-color-text, #18181b));
        --_focus: var(--kakao-error-summary-focus, var(--kakao-color-focus, #2563eb));
        --_item-gap: var(--kakao-error-summary-item-gap, 0.25rem);
        --_list-gap: var(--kakao-error-summary-list-gap, 0.375rem);
        --_space: var(--kakao-error-summary-space, 1.25rem);
        --_scroll-gap: var(--kakao-error-summary-scroll-gap, 1rem);
        /* @kakao-settings:end */
        display: block;
      }
      :host([hidden]) { display: none; }

      .box { display: block; border-radius: var(--kakao-alert-radius, 10px); }
      .box[hidden] { display: none; }
      .box:focus { outline: none; }
      .box:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; }
      :host([data-wraps]) .box { margin-bottom: var(--_space); }

      .title { margin: 0; font: inherit; font-weight: var(--kakao-alert-title-weight, 600); }
      .description { display: block; margin-top: 0.25em; }
      .description[hidden] { display: none; }
      ::slotted([slot="description"]) { margin: 0; }

      .list {
        display: grid;
        gap: var(--_item-gap);
        margin: var(--_list-gap) 0 0;
        padding: 0;
        list-style: none;
      }
      .list a {
        color: var(--_link);
        text-decoration: underline;
        text-decoration-thickness: 1px;
        text-underline-offset: 0.18em;
        border-radius: 2px;
      }
      .list a:hover { text-decoration-thickness: 2px; }
      .list a:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; }
      .label { font-weight: var(--kakao-alert-title-weight, 600); }

      .probe { position: absolute; display: none; margin-top: var(--_scroll-gap); }

      @media (forced-colors: active) {
        .list a { color: LinkText; }
        .box:focus-visible, .list a:focus-visible { outline-color: Highlight; }
      }
    </style>
    <kakao-alert class="box" part="alert" tone="danger" duration="0" tabindex="-1" hidden>
      <div slot="title" class="title-wrap"><h2 class="title" part="title"></h2></div>
      <div class="description" part="description" hidden><slot name="description"></slot></div>
      <ul class="list" part="list"></ul>
    </kakao-alert>
    <span class="probe" aria-hidden="true"></span>
    <slot class="content"></slot>
  `;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCustom = (el) => el.localName.includes('-');
  const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim();

  /** Visible text of a label, without the text of controls nested in it. */
  function textOf(node) {
    if (!node) return '';
    const copy = node.cloneNode(true);
    copy.querySelectorAll('input, select, textarea, button, [aria-hidden="true"]').forEach((n) => n.remove());
    return clean(copy.textContent).replace(/\s*\*$/, '');
  }

  function labelOf(field) {
    const attr = (name) => clean(field.getAttribute(name));
    if (isCustom(field) && attr('label')) return attr('label');
    const by = attr('aria-labelledby');
    if (by) {
      const text = clean(by.split(/\s+/).map((id) => textOf(document.getElementById(id))).join(' '));
      if (text) return text;
    }
    if (attr('aria-label')) return attr('aria-label');
    if (field.type === 'radio') {
      const legend = field.closest('fieldset') && field.closest('fieldset').querySelector('legend');
      if (legend) return textOf(legend);
    }
    let labels = field.labels ? Array.from(field.labels) : [];
    if (!labels.length && field.id) labels = Array.from(document.querySelectorAll(`label[for="${CSS.escape(field.id)}"]`));
    if (labels.length) return textOf(labels[0]);
    return attr('placeholder') || attr('name');
  }

  function isInvalid(field) {
    if (isCustom(field) && clean(field.getAttribute('error'))) return true;
    if (field.validity) return !field.validity.valid;
    try { return field.matches(':invalid'); } catch (e) { return false; }
  }

  function messageOf(field) {
    return (isCustom(field) && clean(field.getAttribute('error')))
      || clean(field.validationMessage)
      || DEFAULT_MESSAGE;
  }

  class KakaoErrorSummary extends HTMLElement {
    static get observedAttributes() { return ['for', 'heading', 'heading-level']; }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this._box = shadow.querySelector('.box');
      this._titleWrap = shadow.querySelector('.title-wrap');
      this._list = shadow.querySelector('.list');
      this._description = shadow.querySelector('.description');
      this._descSlot = shadow.querySelector('slot[name="description"]');
      this._content = shadow.querySelector('slot.content');
      this._probe = shadow.querySelector('.probe');

      this._errors = [];
      this._auto = false;      // the list came from the form, not show()
      this._form = null;
      this._pending = false;

      this._descSlot.addEventListener('slotchange', () => {
        this._description.hidden = this._descSlot.assignedNodes().length === 0;
      });
      this._content.addEventListener('slotchange', () => this._syncWraps());
      this._list.addEventListener('click', (e) => this._onLinkClick(e));

      this._onInvalid = (e) => {
        e.preventDefault();          // no browser bubble; the summary says it
        if (this._pending) return;
        this._pending = true;
        queueMicrotask(() => { this._pending = false; this.validate(); });
      };
      this._onSubmit = (e) => {
        if (e.defaultPrevented) return;
        const form = e.target;
        const submitter = e.submitter;
        // formnovalidate skips the checks; a validating form only gets here
        // once the browser found it valid.
        if ((submitter && submitter.formNoValidate) || !form.noValidate) { this.clear(); return; }
        if (!this.validate()) e.preventDefault();
      };
      this._onReset = () => this.clear();
      this._onEdit = () => {
        if (!this.hasAttribute('live') || !this._auto || !this._errors.length) return;
        cancelAnimationFrame(this._raf);
        this._raf = requestAnimationFrame(() => this._prune());
      };
    }

    connectedCallback() {
      if (!customElements.get('kakao-alert')) {
        console.warn('kakao-error-summary: load alert.js (kakao-alert) for the summary to render.');
      }
      this._renderHeading();
      this._syncWraps();
      // A form inside the summary may be parsed after it; wait a turn.
      queueMicrotask(() => this._attach());
    }

    disconnectedCallback() {
      this._detach();
      cancelAnimationFrame(this._raf);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'for') { if (this.isConnected) this._attach(); return; }
      this._renderHeading();
    }

    /* ------------------------------ API ------------------------------- */

    get form() { return this._form; }

    get errors() {
      return this._errors.map(({ field, label, message }) => ({ field, label, message }));
    }

    validate() {
      if (!this._form) this._attach();
      const errors = this._form ? this._collect(this._form) : [];
      if (!errors.length) { this.clear(); return true; }
      this._auto = true;
      this._render(errors, !this.hasAttribute('no-focus'));
      return false;
    }

    show(list, { focus = true } = {}) {
      const errors = (Array.isArray(list) ? list : []).map((item) => {
        let field = item && item.field;
        if (typeof field === 'string') field = document.getElementById(field);
        if (!(field instanceof Element)) field = null;
        const message = clean(item && item.message) || (field ? messageOf(field) : '');
        const label = item && item.label != null ? clean(item.label) : (field ? labelOf(field) : '');
        return { field, label, message };
      }).filter((e) => e.message || e.label);
      if (!errors.length) { this.clear(); return; }
      this._auto = false;
      this._render(errors, focus && !this.hasAttribute('no-focus'));
    }

    clear() {
      const had = this._errors.length > 0;
      this._errors = [];
      this._list.replaceChildren();
      this._box.hidden = true;
      this.removeAttribute('has-errors');
      if (had) this._dispatch('error-summary-clear', {});
    }

    /* ---------------------------- Form wiring -------------------------- */

    _findForm() {
      const id = this.getAttribute('for');
      if (id) {
        const el = document.getElementById(id);
        return el instanceof HTMLFormElement ? el : null;
      }
      return this.closest('form') || this.querySelector('form');
    }

    _attach() {
      const form = this._findForm();
      if (form === this._form) return;
      this._detach();
      this._form = form;
      if (!form) return;
      form.addEventListener('invalid', this._onInvalid, true);
      form.addEventListener('submit', this._onSubmit);
      form.addEventListener('reset', this._onReset);
      form.addEventListener('input', this._onEdit, true);
      form.addEventListener('change', this._onEdit, true);
    }

    _detach() {
      const form = this._form;
      if (!form) return;
      form.removeEventListener('invalid', this._onInvalid, true);
      form.removeEventListener('submit', this._onSubmit);
      form.removeEventListener('reset', this._onReset);
      form.removeEventListener('input', this._onEdit, true);
      form.removeEventListener('change', this._onEdit, true);
      this._form = null;
    }

    _collect(form) {
      const errors = [];
      const radios = new Set();
      for (const field of Array.from(form.elements)) {
        if (field.localName === 'fieldset' || field.localName === 'button' || field.localName === 'output') continue;
        if (field.disabled || field.matches(':disabled')) continue;
        if (field.type === 'radio' && field.name) {
          const key = field.name;
          if (radios.has(key)) continue;
          if (!isInvalid(field)) continue;
          radios.add(key);
          // Link to the checked radio, or the first one, of the group.
          const group = Array.from(form.elements).filter((f) => f.type === 'radio' && f.name === key);
          const target = group.find((r) => r.checked) || group[0];
          errors.push({ field: target, label: labelOf(target), message: messageOf(target) });
          continue;
        }
        if (!isInvalid(field)) continue;
        errors.push({ field, label: labelOf(field), message: messageOf(field) });
      }
      return errors;
    }

    /** live: drops fields that are valid now; never adds new ones. */
    _prune() {
      const left = this._errors.filter((e) => e.field && e.field.isConnected && isInvalid(e.field))
        .map((e) => ({ ...e, message: messageOf(e.field) }));
      if (!left.length) { this.clear(); return; }
      const changed = left.length !== this._errors.length
        || left.some((e, i) => e.message !== this._errors[i].message);
      if (changed) this._render(left, false);
    }

    /* ---------------------------- Rendering --------------------------- */

    _renderHeading() {
      const raw = parseInt(this.getAttribute('heading-level'), 10);
      const level = raw >= 2 && raw <= 6 ? raw : 2;
      let title = this._titleWrap.firstElementChild;
      if (title.localName !== `h${level}`) {
        const next = document.createElement(`h${level}`);
        next.className = 'title';
        next.setAttribute('part', 'title');
        title.replaceWith(next);
        title = next;
      }
      title.textContent = this.getAttribute('heading') || DEFAULT_HEADING;
    }

    _render(errors, focus) {
      this._errors = errors;
      const items = errors.map((error, index) => {
        const li = document.createElement('li');
        li.setAttribute('part', 'item');
        const text = document.createDocumentFragment();
        if (error.label) {
          const label = document.createElement('span');
          label.className = 'label';
          label.textContent = error.label;
          // "Plan: Choose a plan", but "Where from? Choose one" after a question.
          const sep = /[?!.:]$/.test(error.label) ? ' ' : ': ';
          text.append(label, error.message ? `${sep}${error.message}` : '');
        } else {
          text.append(error.message);
        }
        if (error.field) {
          const a = document.createElement('a');
          a.setAttribute('part', 'link');
          a.href = error.field.id ? `#${error.field.id}` : '#';
          a.dataset.index = String(index);
          a.append(text);
          li.append(a);
        } else {
          li.append(text);
        }
        return li;
      });
      this._list.replaceChildren(...items);
      this._box.hidden = false;
      this.setAttribute('has-errors', '');
      if (focus) this._focusBox();
      this._dispatch('error-summary-show', { errors: this.errors });
    }

    _syncWraps() {
      const wraps = this._content.assignedNodes().some((n) => n.nodeType === 1 || clean(n.textContent));
      this.toggleAttribute('data-wraps', wraps);
    }

    _focusBox() {
      this._box.focus({ preventScroll: true });
      this._scrollTo(this._box);
    }

    _onLinkClick(e) {
      const a = e.target.closest('a[data-index]');
      if (!a) return;
      e.preventDefault();
      const error = this._errors[Number(a.dataset.index)];
      if (!error || !error.field || !error.field.isConnected) return;
      const field = error.field;
      field.focus({ preventScroll: true });
      // A native field shows its label above it; keep that in view too.
      let top = field;
      const label = !isCustom(field) && field.labels && field.labels[0];
      const legend = field.type === 'radio' && field.closest('fieldset');
      if (legend) top = legend;
      else if (label && label.getBoundingClientRect().top < field.getBoundingClientRect().top) top = label;
      this._scrollTo(top, field);
    }

    /**
     * Unless `el` (down to `end`) is already in view, scrolls so it sits below
     * the sticky header bar plus the scroll gap.
     */
    _scrollTo(el, end = el) {
      const root = getComputedStyle(document.documentElement);
      const bar = parseFloat(root.getPropertyValue('--kakao-header-bar-rendered-height')) || 0;
      const padding = parseFloat(root.scrollPaddingTop) || 0;
      const gap = parseFloat(getComputedStyle(this._probe).marginTop) || 0;
      const offset = Math.max(bar, padding) + gap;
      const rect = el.getBoundingClientRect();
      const bottom = Math.max(rect.bottom, end.getBoundingClientRect().bottom);
      const fits = rect.top >= offset && bottom <= window.innerHeight - gap;
      if (fits) return;
      window.scrollTo({
        top: Math.max(0, window.scrollY + rect.top - offset),
        behavior: reducedMotion() ? 'auto' : 'smooth',
      });
    }

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
      if (typeof KakaoComponents !== 'undefined') KakaoComponents.emit(this, name, detail);
    }
  }

  customElements.define(TAG_NAME, KakaoErrorSummary);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, {
      triggers: ['error-summary-show', 'error-summary-clear'],
    });
  }
})();
