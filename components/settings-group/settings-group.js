/**
 * <kakao-settings-group> and <kakao-setting>
 * ============================================================================
 * The settings-screen layout: a titled group of rows. Each row has a label
 * (and an optional hint) on the start side and its control on the end side;
 * rows are divided by hairlines. On a narrow row the control drops below the
 * label (a container query on the row, not the viewport). Rows can also be
 * links to a subpage, whole-row buttons, dangerous or disabled.
 * Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="settings-group.js"><\/script>
 *
 *   <kakao-settings-group heading="Notifications" description="How we reach you">
 *     <kakao-setting label="Email digest" hint="A summary every Monday">
 *       <kakao-switch-group list-data='[{"name":"digest","label":"","checked":true}]'></kakao-switch-group>
 *     </kakao-setting>
 *     <kakao-setting label="Language">
 *       <kakao-select name="lang" value="en" list-data='[{"value":"en","label":"English"}]'></kakao-select>
 *     </kakao-setting>
 *     <kakao-setting label="Connected accounts" href="accounts.html" value="2"></kakao-setting>
 *     <kakao-setting label="Delete account" variant="danger" action></kakao-setting>
 *   </kakao-settings-group>
 *
 * Why two elements: a row has its own options (label, hint, href, action,
 * variant, disabled, layout) and its own shadow DOM, so page CSS can't leak in
 * and the group never has to parse or restyle children it doesn't own. Both
 * are defined in this one file (one folder, one inlineable file) and share
 * one settings block. Any element can sit in the group; <kakao-setting> is
 * the row that knows the layout.
 *
 * ----------------------------------------------------------------------------
 * <kakao-settings-group> ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  heading        Title text (or slot="title").
 *  description    Line under the title (or slot="description").
 *  heading-level  1-6: the title becomes a heading of that level, so screen
 *                 reader users can jump between groups. Without it the title
 *                 only names the group.
 *  variant        box · plain. Forces a look; without it the group is a box
 *                 on its own and plain inside a kakao-card, kakao-accordion,
 *                 kakao-dialog or kakao-aside-sheet (see LOOKS).
 *
 *  SLOTS: default (the rows), title, description, footer (a short note under
 *  the rows). Empty title, description and footer take no space.
 *
 * ----------------------------------------------------------------------------
 * <kakao-setting> ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  label      Row label (or slot="label"). Also names the control (see NAMING).
 *  hint       Smaller muted line under the label (or slot="hint").
 *  href       The whole row is a link to this address, with a chevron at the
 *             end. target and rel are passed to the link.
 *  action     The whole row is a button; activating it sends setting-action.
 *  value      Link and action rows: short muted text before the chevron
 *             ("English", "2 devices").
 *  variant    danger: label (and chevron) in the danger colour. For "Delete
 *             account", "Sign out everywhere".
 *  disabled   Dims the row; link and action rows stop working, and the
 *             control gets disabled too (removed again when the row is
 *             enabled, if the row set it).
 *  layout     auto (default) · inline · stack. See NARROW ROWS.
 *
 *  SLOTS: default (the control; in link and action rows only non-interactive
 *  trailing content such as a badge), label, hint, icon (a leading icon,
 *  ideally an inline SVG in currentColor; no icon, no space).
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  setting-action   { label }   an action row was activated (click, Enter or
 *                   Space). Not sent while disabled.
 *
 * ----------------------------------------------------------------------------
 * NAMING (accessibility)
 * ----------------------------------------------------------------------------
 *  The row's label lives in its shadow root, the control in the page, and a
 *  library control's focusable part in the control's own shadow root. ID
 *  references (label for, aria-labelledby, aria-describedby) can't cross
 *  shadow roots, so the row copies its label onto the control as text,
 *  following the style guide's "Naming form fields" rule:
 *    kakao-switch-group, kakao-slider, kakao-step-switch   label attribute
 *    kakao-number-input                aria-label on its inner <input>
 *    native input / select / textarea / button, and every other control
 *    (kakao-text-input, kakao-select, kakao-combobox, kakao-radio-group,
 *    kakao-button…)                    aria-label attribute
 *    kakao-checkbox                    left alone (its own label names it)
 *  A control that already has label or aria-label keeps it: a button's
 *  "Change" stays "Change", so give it aria-label="Change password" when
 *  the label alone is too short. The row removes only names it set itself.
 *  Native controls also get the hint as aria-description; library controls
 *  can't take it, so their hint is only read in reading order (just before
 *  the control). Clicking the label focuses the control.
 *  A single switch is a kakao-switch-group with one item whose label is "":
 *  the row's label then names that switch.
 *  A group with a title is role="group", named by the title and described
 *  by its description (a shadow <fieldset> would bring nothing: its disabled
 *  state doesn't reach slotted controls).
 *  Link rows are named by label and value, described by the hint; the
 *  chevron is decoration.
 *
 * ----------------------------------------------------------------------------
 * NARROW ROWS
 * ----------------------------------------------------------------------------
 *  Each row is a size container. Narrower than 30rem, the control drops below
 *  the label and fields (text input, select, combobox, slider, native
 *  fields) take the full width. Rows whose control is a switch group or a
 *  checkbox keep it beside the label, as phone settings do. layout="inline"
 *  or "stack" forces one layout. (A container query can't read a custom
 *  property, so the 30rem breakpoint is fixed.)
 *  Wide controls are --kakao-settings-group-field-width wide beside the label.
 *  Inside a row, a slider's own label is hidden (the row's label names it).
 *
 * ----------------------------------------------------------------------------
 * LOOKS
 * ----------------------------------------------------------------------------
 *  box     surface, hairline border, 14px radius, 4px inner padding; rows
 *          have their own side padding, hairlines are inset to the text, and
 *          link rows get a hover wash with 10px outer corners (14 - 4,
 *          nesting rule): only the first row rounds its top and only the
 *          last its bottom, so washes of neighbouring rows meet flush.
 *  plain   no surface, no border, no side padding: the card's (or
 *          accordion's) padding is the indent, so a group in a card is never
 *          a card in a card. Hairlines run the full width.
 *
 * MOTION: only colour (the hover wash) on the standard easing, 150ms; none
 * under prefers-reduced-motion. Focus: 2px outline in the focus colour with
 * a 2px offset on link and action rows.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-settings-group-bg / -border / -text / -muted / -danger / -focus
 *  --kakao-settings-group-line / -hover        hairline, hover wash
 *  --kakao-settings-group-radius / -padding    the box
 *  --kakao-settings-group-header-gap / -title-size / -title-weight / -description-size
 *  --kakao-settings-group-row-padding-x / -row-padding-y / -row-min-height / -row-radius
 *  --kakao-settings-group-gap / -label-size / -label-weight / -hint-size
 *  --kakao-settings-group-field-width / -icon-size / -chevron-size
 *  --kakao-settings-group-disabled-opacity / -duration / -ease
 *
 * Parts: group (group, head, title, description, rows, footer);
 *        setting (row, icon, text, label, hint, end, value, chevron).
 * ============================================================================
 */
(function () {
  'use strict';

  const GROUP_TAG = 'kakao-settings-group';
  const ROW_TAG = 'kakao-setting';
  if (customElements.get(GROUP_TAG)) return;

  /* Shared by both shadow roots: one settings block for the component. */
  const SETTINGS = `
        /* @kakao-settings:start prefix=--kakao-settings-group- (written by construction.html, edit there) */
        --_bg: var(--kakao-settings-group-bg, var(--kakao-color-bg, #ffffff));
        --_border: var(--kakao-settings-group-border, var(--kakao-color-line, #e5e7eb));
        --_text: var(--kakao-settings-group-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-settings-group-muted, var(--kakao-color-muted, #62626c));
        --_danger: var(--kakao-settings-group-danger, var(--kakao-color-danger, #dc2626));
        --_focus: var(--kakao-settings-group-focus, var(--kakao-color-focus, #2563eb));
        --_line: var(--kakao-settings-group-line, color-mix(in srgb, var(--kakao-color-text, #18181b) 12%, transparent));
        --_hover: var(--kakao-settings-group-hover, color-mix(in srgb, var(--kakao-color-text, #18181b) 4.5%, transparent));
        --_radius: var(--kakao-settings-group-radius, 14px);
        --_padding: var(--kakao-settings-group-padding, 4px);
        --_header-gap: var(--kakao-settings-group-header-gap, 0.625rem);
        --_title-size: var(--kakao-settings-group-title-size, 1rem);
        --_title-weight: var(--kakao-settings-group-title-weight, 600);
        --_description-size: var(--kakao-settings-group-description-size, 0.875rem);
        --_row-padding-x: var(--kakao-settings-group-row-padding-x, 1rem);
        --_row-padding-y: var(--kakao-settings-group-row-padding-y, 0.75rem);
        --_row-min-height: var(--kakao-settings-group-row-min-height, 3.25rem);
        --_row-radius: var(--kakao-settings-group-row-radius, 10px);
        --_gap: var(--kakao-settings-group-gap, 1rem);
        --_label-size: var(--kakao-settings-group-label-size, 0.9375rem);
        --_label-weight: var(--kakao-settings-group-label-weight, 500);
        --_hint-size: var(--kakao-settings-group-hint-size, 0.8125rem);
        --_field-width: var(--kakao-settings-group-field-width, 15rem);
        --_icon-size: var(--kakao-settings-group-icon-size, 1.25rem);
        --_chevron-size: var(--kakao-settings-group-chevron-size, 1rem);
        --_disabled-opacity: var(--kakao-settings-group-disabled-opacity, 0.45);
        --_duration: var(--kakao-settings-group-duration, 150ms);
        --_ease: var(--kakao-settings-group-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */`;

  /* Ancestors that already draw a surface: inside them the group is plain. */
  const SURFACES = ['kakao-card', 'kakao-accordion', 'kakao-dialog', 'kakao-aside-sheet'];
  /* Controls named through their label attribute instead of aria-label. */
  const LABEL_ATTR_CONTROLS = ['kakao-switch-group', 'kakao-slider', 'kakao-step-switch'];
  /* Small controls that stay beside the label on narrow rows. */
  const INLINE_CONTROLS = ['kakao-switch-group', 'kakao-checkbox'];
  /* Fields that take --_field-width beside the label and the full width below it. */
  const WIDE = 'kakao-text-input, kakao-select, kakao-combobox, kakao-date-input, kakao-slider, kakao-multi-dropdown, kakao-textarea, input:not([type="checkbox"]):not([type="radio"]), select, textarea';
  const NATIVE = ['input', 'select', 'textarea', 'button'];

  /* Page-level rule, added once: a slider repeats its label above the track;
     in a row the row's label names it, so its own is hidden (public part). */
  function ensurePageStyles() {
    if (document.getElementById('kakao-settings-group-page')) return;
    const style = document.createElement('style');
    style.id = 'kakao-settings-group-page';
    style.textContent = `${ROW_TAG} > kakao-slider::part(label) { display: none; }`;
    document.head.prepend(style);
  }

  const CHEVRON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4l4 4-4 4"/></svg>';

  /* --------------------------------------------------------------------- */
  /* Group                                                                  */
  /* --------------------------------------------------------------------- */

  const GROUP_TEMPLATE = document.createElement('template');
  GROUP_TEMPLATE.innerHTML = `
    <style>
      :host {${SETTINGS}
        display: block;
        min-width: 0;
        color: var(--_text);
        line-height: 1.5;
      }
      :host([hidden]) { display: none; }
      .group { display: flex; flex-direction: column; gap: var(--_header-gap); min-width: 0; }
      .head { display: grid; gap: 0.125rem; }
      .head[hidden], .description[hidden], .footer[hidden] { display: none; }
      .title { margin: 0; font-size: var(--_title-size); font-weight: var(--_title-weight); overflow-wrap: anywhere; }
      .description { font-size: var(--_description-size); color: var(--_muted); overflow-wrap: anywhere; }
      ::slotted([slot="title"]), ::slotted([slot="description"]), ::slotted([slot="footer"]) {
        margin: 0; font: inherit; color: inherit;
      }
      .rows {
        display: flex;
        flex-direction: column;
        min-width: 0;
        box-sizing: border-box;
        padding: var(--_padding);
        background: var(--_bg);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
      }
      .footer { font-size: var(--_description-size); color: var(--_muted); overflow-wrap: anywhere; }
      /* Every row after the first draws a hairline above itself. */
      .rows ::slotted(:not(:first-child)) { --_kakao-setting-line: var(--_line); }
      /* Rows join up: only the first row rounds its top corners and only the
         last its bottom ones, so hover and focus shapes of neighbouring rows
         meet flush and the outer corners follow the box. */
      .rows ::slotted(:not(:first-child)) { --_kakao-setting-radius-top: 0px; }
      .rows ::slotted(:not(:last-child)) { --_kakao-setting-radius-bottom: 0px; }
      .rows ::slotted(*) { margin-block: 0; }

      .group[data-look="plain"] .rows { padding: 0; background: transparent; border: 0; border-radius: 0; }
      .group[data-look="plain"] .rows ::slotted(*) {
        --_kakao-setting-px: 0px;
        --_kakao-setting-line-inset: 0px;
        --_kakao-setting-bleed: 0.5rem;
      }

      @media (forced-colors: active) {
        .rows { border-color: CanvasText; }
        .group[data-look="plain"] .rows { border: 0; }
        .rows ::slotted(:not(:first-child)) { --_kakao-setting-line: CanvasText; }
      }
    </style>
    <div class="group" part="group" data-look="box">
      <div class="head" part="head" hidden>
        <div class="title" id="title" part="title"><slot name="title"><span class="heading"></span></slot></div>
        <div class="description" id="description" part="description" hidden><slot name="description"><span class="description-text"></span></slot></div>
      </div>
      <div class="rows" part="rows"><slot></slot></div>
      <div class="footer" part="footer" hidden><slot name="footer"></slot></div>
    </div>
  `;

  class KakaoSettingsGroup extends HTMLElement {
    static get observedAttributes() {
      return ['heading', 'description', 'heading-level', 'variant'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(GROUP_TEMPLATE.content.cloneNode(true));
      this._group = shadow.querySelector('.group');
      this._head = shadow.querySelector('.head');
      this._title = shadow.querySelector('.title');
      this._heading = shadow.querySelector('.heading');
      this._titleSlot = shadow.querySelector('slot[name="title"]');
      this._desc = shadow.querySelector('.description');
      this._descText = shadow.querySelector('.description-text');
      this._descSlot = shadow.querySelector('slot[name="description"]');
      this._footer = shadow.querySelector('.footer');
      this._footerSlot = shadow.querySelector('slot[name="footer"]');
      this._update = this._update.bind(this);
    }

    connectedCallback() {
      [this._titleSlot, this._descSlot, this._footerSlot].forEach((s) => s.addEventListener('slotchange', this._update));
      this._update();
      this._updateLook();
    }

    disconnectedCallback() {
      [this._titleSlot, this._descSlot, this._footerSlot].forEach((s) => s.removeEventListener('slotchange', this._update));
    }

    attributeChangedCallback(name) {
      if (name === 'variant') this._updateLook();
      else this._update();
    }

    _update() {
      this._heading.textContent = this.getAttribute('heading') || '';
      const hasTitle = Boolean(this.getAttribute('heading')) || this._titleSlot.assignedNodes().length > 0;
      const description = this.getAttribute('description') || '';
      this._descText.textContent = description;
      const hasDesc = Boolean(description) || this._descSlot.assignedNodes().length > 0;
      this._desc.hidden = !hasDesc;
      this._head.hidden = !hasTitle && !hasDesc;
      this._footer.hidden = this._footerSlot.assignedNodes().length === 0;

      // Named group only with a title: an unnamed group is noise to screen readers.
      if (hasTitle) {
        this._group.setAttribute('role', 'group');
        this._group.setAttribute('aria-labelledby', 'title');
      } else {
        this._group.removeAttribute('role');
        this._group.removeAttribute('aria-labelledby');
      }
      if (hasDesc) this._group.setAttribute('aria-describedby', 'description');
      else this._group.removeAttribute('aria-describedby');

      const level = parseInt(this.getAttribute('heading-level'), 10);
      if (hasTitle && level >= 1 && level <= 6) {
        this._title.setAttribute('role', 'heading');
        this._title.setAttribute('aria-level', String(level));
      } else {
        this._title.removeAttribute('role');
        this._title.removeAttribute('aria-level');
      }
    }

    /** box on its own, plain inside a surface (across shadow roots). */
    _updateLook() {
      const variant = (this.getAttribute('variant') || '').trim().toLowerCase();
      let look = variant === 'box' || variant === 'plain' ? variant : '';
      if (!look) {
        look = 'box';
        let node = this.parentElement || (this.parentNode && this.parentNode.host) || null;
        while (node) {
          if (SURFACES.includes(node.localName)) { look = 'plain'; break; }
          node = node.parentElement || (node.parentNode && node.parentNode.host) || null;
        }
      }
      this._group.dataset.look = look;
    }
  }

  /* --------------------------------------------------------------------- */
  /* Row                                                                    */
  /* --------------------------------------------------------------------- */

  const ROW_TEMPLATE = document.createElement('template');
  ROW_TEMPLATE.innerHTML = `
    <style>
      :host {${SETTINGS}
        --_px: var(--_kakao-setting-px, var(--_row-padding-x));
        --_bleed: var(--_kakao-setting-bleed, 0px);
        container: kakao-setting / inline-size;
        position: relative;
        display: block;
        min-width: 0;
        color: var(--_text);
        line-height: 1.5;
      }
      :host([hidden]) { display: none; }
      /* Hairline above every row but the first (the group sets the colour). */
      :host::before {
        content: "";
        position: absolute;
        top: 0;
        inset-inline: var(--_kakao-setting-line-inset, var(--_px));
        height: 1px;
        background: var(--_kakao-setting-line, transparent);
        pointer-events: none;
      }

      .row {
        display: flex;
        align-items: center;
        gap: 0.5rem var(--_gap);
        box-sizing: border-box;
        width: 100%;
        min-height: var(--_row-min-height);
        margin: 0;
        padding: var(--_row-padding-y) var(--_px);
        border: 0;
        border-start-start-radius: var(--_kakao-setting-radius-top, var(--_row-radius));
        border-start-end-radius: var(--_kakao-setting-radius-top, var(--_row-radius));
        border-end-start-radius: var(--_kakao-setting-radius-bottom, var(--_row-radius));
        border-end-end-radius: var(--_kakao-setting-radius-bottom, var(--_row-radius));
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: start;
        text-decoration: none;
      }
      /* Link and action rows: the whole row is the target. In the plain look
         they bleed out a little, so the hover wash doesn't hug the text. */
      .row:is(a, button) {
        width: calc(100% + 2 * var(--_bleed));
        margin-inline: calc(-1 * var(--_bleed));
        padding-inline: calc(var(--_px) + var(--_bleed));
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background-color var(--_duration) var(--_ease);
      }
      .row:is(a[href], button:not(:disabled)):hover { background: var(--_hover); }
      .row:is(a, button):focus-visible {
        outline: 2px solid var(--_focus);
        outline-offset: 2px;
      }
      .row:is(a, button):focus:not(:focus-visible) { outline: none; }
      .row[aria-disabled="true"], .row:disabled { cursor: default; }

      .icon {
        flex: none;
        display: inline-grid;
        place-items: center;
        width: var(--_icon-size);
        height: var(--_icon-size);
        color: var(--_muted);
      }
      .icon[hidden], .hint[hidden], .value[hidden], .chevron[hidden], .end[hidden] { display: none; }
      ::slotted([slot="icon"]) { width: 100%; height: 100%; font-size: var(--_icon-size); line-height: 1; }

      .text { flex: 1 1 auto; min-width: 0; display: grid; gap: 0.0625rem; }
      .label {
        font-size: var(--_label-size);
        font-weight: var(--_label-weight);
        overflow-wrap: anywhere;
      }
      .hint { font-size: var(--_hint-size); color: var(--_muted); overflow-wrap: anywhere; }
      ::slotted([slot="label"]), ::slotted([slot="hint"]) { margin: 0; font: inherit; color: inherit; }

      .end {
        flex: 0 1 auto;
        min-width: 0;
        max-width: 60%;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      .end ::slotted(*) { margin: 0; max-width: 100%; }
      .row[data-mode] .end ::slotted(:is(${WIDE})) { width: var(--_field-width); }
      .value { color: var(--_muted); font-size: var(--_hint-size); white-space: nowrap; }
      .chevron {
        flex: none;
        display: inline-grid;
        place-items: center;
        width: var(--_chevron-size);
        height: var(--_chevron-size);
        color: var(--_muted);
      }
      .chevron svg { width: 100%; height: 100%; }
      :host(:dir(rtl)) .chevron svg { transform: scaleX(-1); }

      /* ---- danger and disabled ---- */
      :host([variant="danger"]) .label,
      :host([variant="danger"]) .chevron { color: var(--_danger); }
      /* The control dims itself through its own disabled state. */
      :host([disabled]) :is(.icon, .text, .value, .chevron) { opacity: var(--_disabled-opacity); }

      /* ---- narrow rows: the control drops below the label ---- */
      .row[data-mode="stack"] { flex-wrap: wrap; }
      .row[data-mode="stack"] .end { flex: 1 1 100%; max-width: none; justify-content: flex-start; }
      .row[data-mode="stack"] .end ::slotted(:is(${WIDE})) { width: 100%; }
      .row[data-mode="stack"][data-icon] .end { padding-inline-start: calc(var(--_icon-size) + var(--_gap)); }
      @container kakao-setting (max-width: 30rem) {
        .row[data-mode="auto"] { flex-wrap: wrap; }
        .row[data-mode="auto"] .end { flex: 1 1 100%; max-width: none; justify-content: flex-start; }
        .row[data-mode="auto"] .end ::slotted(:is(${WIDE})) { width: 100%; }
        .row[data-mode="auto"][data-icon] .end { padding-inline-start: calc(var(--_icon-size) + var(--_gap)); }
        .row[data-mode="inline"] .end { max-width: 100%; }
      }

      @media (prefers-reduced-motion: reduce) {
        .row { transition: none !important; }
      }
      @media (forced-colors: active) {
        .row:is(a, button) { forced-color-adjust: none; color: LinkText; background: Canvas; }
        .row:is(a, button) :is(.hint, .value, .chevron) { color: LinkText; }
        .row:is(a, button):hover { background: Canvas; text-decoration: underline; }
        .row:is(a, button):focus-visible { outline-color: Highlight; }
        .row[aria-disabled="true"], .row:disabled { color: GrayText; }
        .row[aria-disabled="true"] :is(.hint, .value, .chevron), .row:disabled :is(.hint, .value, .chevron) { color: GrayText; }
      }
    </style>
    <div class="row" part="row" data-mode="auto">
      <span class="icon" part="icon" aria-hidden="true" hidden><slot name="icon"></slot></span>
      <span class="text" part="text">
        <span class="label" id="label" part="label"><slot name="label"><span class="label-text"></span></slot></span>
        <span class="hint" id="hint" part="hint" hidden><slot name="hint"><span class="hint-text"></span></slot></span>
      </span>
      <span class="end" id="end" part="end"><span class="value" part="value" hidden></span><slot></slot></span>
      <span class="chevron" part="chevron" aria-hidden="true" hidden>${CHEVRON}</span>
    </div>
  `;

  class KakaoSetting extends HTMLElement {
    static get observedAttributes() {
      return ['label', 'hint', 'href', 'target', 'rel', 'action', 'value', 'disabled', 'layout', 'variant'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(ROW_TEMPLATE.content.cloneNode(true));
      this._row = shadow.querySelector('.row');
      this._icon = shadow.querySelector('.icon');
      this._iconSlot = shadow.querySelector('slot[name="icon"]');
      this._text = shadow.querySelector('.text');
      this._labelText = shadow.querySelector('.label-text');
      this._labelSlot = shadow.querySelector('slot[name="label"]');
      this._hint = shadow.querySelector('.hint');
      this._hintText = shadow.querySelector('.hint-text');
      this._hintSlot = shadow.querySelector('slot[name="hint"]');
      this._end = shadow.querySelector('.end');
      this._value = shadow.querySelector('.value');
      this._slot = shadow.querySelector('slot:not([name])');
      this._chevron = shadow.querySelector('.chevron');
      this._named = null; // { ctl, target, attr, desc, disabled } what this row set on its control
      this._onSlotChange = this._onSlotChange.bind(this);
      this._onLabelClick = this._onLabelClick.bind(this);
      this._onRowClick = this._onRowClick.bind(this);
    }

    connectedCallback() {
      ensurePageStyles();
      [this._iconSlot, this._labelSlot, this._hintSlot, this._slot].forEach((s) => s.addEventListener('slotchange', this._onSlotChange));
      this._text.addEventListener('click', this._onLabelClick);
      this._render();
    }

    disconnectedCallback() {
      [this._iconSlot, this._labelSlot, this._hintSlot, this._slot].forEach((s) => s.removeEventListener('slotchange', this._onSlotChange));
      this._text.removeEventListener('click', this._onLabelClick);
      this._row.removeEventListener('click', this._onRowClick);
      this._unname();
    }

    attributeChangedCallback() {
      if (this.isConnected) this._render();
    }

    /* ------------------------------- API ------------------------------- */

    get label() { return this._labelString(); }
    set label(value) { this.setAttribute('label', value); }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value) { this.toggleAttribute('disabled', Boolean(value)); }

    /** The control in the default slot (none in link and action rows). */
    get control() {
      if (this._mode() !== 'control') return null;
      return this._slot.assignedElements()[0] || null;
    }

    /* ----------------------------- internals ----------------------------- */

    _mode() {
      if (this.hasAttribute('href')) return 'link';
      if (this.hasAttribute('action')) return 'action';
      return 'control';
    }

    _labelString() {
      const slotted = this._labelSlot.assignedNodes({ flatten: true });
      if (slotted.length) return slotted.map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim();
      return (this.getAttribute('label') || '').trim();
    }

    _hintString() {
      const slotted = this._hintSlot.assignedNodes({ flatten: true });
      if (slotted.length) return slotted.map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim();
      return (this.getAttribute('hint') || '').trim();
    }

    _onSlotChange() { this._render(); }

    /** Builds the row element (div, a or button) for the mode and fills it. */
    _render() {
      const mode = this._mode();
      const tag = mode === 'link' ? 'a' : mode === 'action' ? 'button' : 'div';
      if (this._row.localName !== tag) {
        const next = document.createElement(tag);
        next.className = 'row';
        next.setAttribute('part', 'row');
        while (this._row.firstChild) next.appendChild(this._row.firstChild);
        this._row.removeEventListener('click', this._onRowClick);
        this._row.replaceWith(next);
        this._row = next;
        if (tag === 'button') next.type = 'button';
        if (tag !== 'div') next.addEventListener('click', this._onRowClick);
      }
      const row = this._row;
      const disabled = this.hasAttribute('disabled');

      this._labelText.textContent = this.getAttribute('label') || '';
      this._hintText.textContent = this.getAttribute('hint') || '';
      const hasHint = Boolean(this.getAttribute('hint')) || this._hintSlot.assignedNodes().length > 0;
      this._hint.hidden = !hasHint;
      const hasIcon = this._iconSlot.assignedNodes().length > 0;
      this._icon.hidden = !hasIcon;
      row.toggleAttribute('data-icon', hasIcon);

      const value = this.getAttribute('value') || '';
      this._value.textContent = value;
      this._value.hidden = mode === 'control' || !value;
      this._chevron.hidden = mode !== 'link';
      this._end.hidden = mode !== 'control' && !value && this._slot.assignedNodes().length === 0;

      // Link and action rows: one target, named by the label and the value.
      if (mode === 'link') {
        if (disabled) {
          row.removeAttribute('href');
          row.setAttribute('aria-disabled', 'true');
          row.setAttribute('role', 'link');
        } else {
          row.setAttribute('href', this.getAttribute('href'));
          row.removeAttribute('aria-disabled');
          row.removeAttribute('role');
        }
        ['target', 'rel'].forEach((a) => {
          if (this.hasAttribute(a)) row.setAttribute(a, this.getAttribute(a));
          else row.removeAttribute(a);
        });
      } else if (mode === 'action') {
        row.disabled = disabled;
      }
      if (mode === 'control') {
        row.removeAttribute('aria-labelledby');
        row.removeAttribute('aria-describedby');
      } else {
        row.setAttribute('aria-labelledby', this._end.hidden ? 'label' : 'label end');
        if (hasHint) row.setAttribute('aria-describedby', 'hint');
        else row.removeAttribute('aria-describedby');
      }

      // Layout: auto stacks below 30rem, except for small controls.
      const layout = (this.getAttribute('layout') || '').trim().toLowerCase();
      const ctl = this.control;
      let rowMode = layout === 'inline' || layout === 'stack' ? layout : 'auto';
      if (rowMode === 'auto' && (mode !== 'control' || (ctl && this._isInlineControl(ctl)))) rowMode = 'inline';
      row.dataset.mode = rowMode;

      this._name(ctl);
    }

    _isInlineControl(ctl) {
      if (INLINE_CONTROLS.includes(ctl.localName)) return true;
      return ctl.localName === 'input' && (ctl.type === 'checkbox' || ctl.type === 'radio');
    }

    /** Copies label, hint and disabled onto the control (see NAMING). */
    _name(ctl) {
      if (this._named && this._named.ctl !== ctl) this._unname();
      if (!ctl) return;
      const tag = ctl.localName;
      if (tag === 'kakao-checkbox') { this._syncDisabled(ctl, ctl); return; }

      let target = ctl;
      let attr = 'aria-label';
      if (tag === 'kakao-number-input') target = ctl.querySelector('input') || null;
      else if (LABEL_ATTR_CONTROLS.includes(tag)) attr = 'label';
      if (!target) return;

      const named = this._named || (this._named = { ctl, target, attr: null, desc: false, disabled: false });
      if (named.target !== target) { this._unname(); return this._name(ctl); }

      // Name: only when the author gave none (a name this row set doesn't count).
      const label = this._labelString();
      const ownLabel = named.attr === 'label';
      const ownAria = named.attr === 'aria-label';
      const authorNamed = (target.hasAttribute('label') && !ownLabel)
        || (target.hasAttribute('aria-label') && !ownAria)
        || (target.hasAttribute('aria-labelledby'))
        || (NATIVE.includes(target.localName) && target.labels && target.labels.length > 0);
      if (!authorNamed && label) {
        if (target.getAttribute(attr) !== label) target.setAttribute(attr, label);
        named.attr = attr;
      } else if (named.attr && !label) {
        target.removeAttribute(named.attr);
        named.attr = null;
      }

      // Hint: native controls only (aria-description on the focusable element).
      if (NATIVE.includes(target.localName)) {
        const hint = this._hintString();
        const authorDesc = (target.hasAttribute('aria-description') && !named.desc) || target.hasAttribute('aria-describedby');
        if (hint && !authorDesc) {
          target.setAttribute('aria-description', hint);
          named.desc = true;
        } else if (named.desc && !hint) {
          target.removeAttribute('aria-description');
          named.desc = false;
        }
      }

      this._syncDisabled(ctl, target);
    }

    _syncDisabled(ctl, target) {
      const named = this._named || (this._named = { ctl, target, attr: null, desc: false, disabled: false });
      const el = ctl.localName === 'kakao-number-input' ? target : ctl;
      if (this.hasAttribute('disabled')) {
        if (!el.hasAttribute('disabled')) { el.setAttribute('disabled', ''); named.disabled = true; }
      } else if (named.disabled) {
        el.removeAttribute('disabled');
        named.disabled = false;
      }
    }

    /** Removes everything this row set on its previous control. */
    _unname() {
      const named = this._named;
      this._named = null;
      if (!named) return;
      if (named.attr) named.target.removeAttribute(named.attr);
      if (named.desc) named.target.removeAttribute('aria-description');
      if (named.disabled) {
        const el = named.ctl.localName === 'kakao-number-input' ? named.target : named.ctl;
        el.removeAttribute('disabled');
      }
    }

    /** Clicking the label focuses the control, as a <label for> would. */
    _onLabelClick() {
      const ctl = this.control;
      if (!ctl || this.hasAttribute('disabled')) return;
      if (ctl.localName === 'kakao-switch-group' && typeof ctl.focusSwitch === 'function') ctl.focusSwitch(0);
      else if (ctl.localName === 'kakao-number-input') { const input = ctl.querySelector('input'); if (input) input.focus(); }
      else if (typeof ctl.focus === 'function') ctl.focus();
    }

    _onRowClick(event) {
      if (this.hasAttribute('disabled')) { event.preventDefault(); return; }
      if (this._mode() !== 'action') return;
      this.dispatchEvent(new CustomEvent('setting-action', {
        detail: { label: this._labelString() },
        bubbles: true,
        composed: true,
      }));
    }
  }

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(GROUP_TAG, { triggers: [], reactions: {} });
  }

  customElements.define(GROUP_TAG, KakaoSettingsGroup);
  customElements.define(ROW_TAG, KakaoSetting);
})();
