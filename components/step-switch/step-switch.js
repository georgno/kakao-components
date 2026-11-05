/**
 * ============================================================================
 * <kakao-step-switch>
 * ============================================================================
 * A multi-position switch: one thumb, any number of steps in between. It keeps
 * the squash & stretch feel of <kakao-switch-group>: the thumb flattens when
 * grabbed, can be dragged with a finger or mouse, snaps to the nearest step on
 * release with a springy overshoot, and rubber-bands into the wall when you
 * drag past either end. Vanilla JS, Shadow DOM, no dependencies.
 *
 * Why a separate element: a two-state toggle is a "switch" in ARIA, but a
 * choice of one out of N ordered options is a "radiogroup". Each step is a
 * role="radio" button, so screen readers announce "Medium, radio button, 3 of
 * 5, selected", which a role="switch" cannot express.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   (load step-switch.js with a normal script tag, src="step-switch.js")
 *
 *   <kakao-step-switch
 *     label="Quality"
 *     value="med"
 *     list-data='[
 *       {"value":"low","label":"Low"},
 *       {"value":"med","label":"Medium"},
 *       {"value":"high","label":"High"}
 *     ]'>
 *   </kakao-step-switch>
 *
 *   const sw = document.querySelector('kakao-step-switch');
 *   sw.addEventListener('step-change', (e) => console.log(e.detail.value));
 *
 * To inline the file in an HTML page, the source must never contain a literal
 * closing script tag; this file is checked for that.
 *
 * ----------------------------------------------------------------------------
 * THEME SWITCHER
 * ----------------------------------------------------------------------------
 *  With theme-picker the steps become the page's colour themes: the theme
 *  follows the thumb, so every step it crosses changes the page — while being
 *  dragged, and while it springs across the ones in between. The thumb follows
 *  when the theme changes elsewhere. theme-switch.js owns that wiring (it must
 *  be on the page too, it listens to step-cross); this component stays generic
 *  — the attribute has no effect on its own.
 *
 *    <kakao-step-switch theme-picker label="Theme" list-data='[
 *      {"value":"light","label":"Light"}, {"value":"beige","label":"Beige"},
 *      {"value":"umber","label":"Umber"}, {"value":"dark","label":"Dark"},
 *      {"value":"amoled","label":"AMOLED"}, {"value":"catppuccin","label":"Catppuccin"},
 *      {"value":"forest","label":"Forest"}
 *    ]'></kakao-step-switch>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  label        Accessible name of the radiogroup. Default "Step switch".
 *  list-data    JSON array of steps (never "data"). Each entry is either a
 *               string/number or an object:
 *                 { value: string, label?: string, disabled?: boolean }
 *               "value" defaults to the index, "label" to the value.
 *  value        The value of the selected step. Changing it moves the thumb
 *               (animated); user input and setValue() write it back, so the
 *               attribute always reflects the current state. If it matches no
 *               step, the first enabled step is selected.
 *  disabled     Boolean. Blocks all interaction, removes the control from the
 *               tab order and sets aria-disabled="true" on the host.
 *  thumb-drag   Dragging the thumb. Default ON; "false" / "off" / "0" / "no"
 *               turns it off (taps on a step and the keyboard still work).
 *  show-labels  Step labels under the track. Default ON; "false" hides them.
 *  show-ticks   Small dots marking the steps inside the track. Default ON.
 *  color-shift  Boolean, default OFF. When present, the track colour blends
 *               from track-bg-off at the first step to track-bg-on at the last
 *               as the thumb moves. Without it the track keeps one colour
 *               (--kakao-step-switch-track-bg).
 *
 *  Attributes always win: setting one after a method call overrides it.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  setData(steps)       Replace all steps (same shape as list-data). While it
 *                       works the host has aria-busy="true".
 *  getData()            Deep copy of the steps: [{value,label,disabled}].
 *  setValue(value)      Select a step by value. Ignored if disabled / unknown.
 *  value                Property mirror of the "value" attribute.
 *  getIndex()           Index of the selected step (-1 if there are none).
 *  stepBy(delta)        Move the selection by delta enabled steps (clamped).
 *  focusStep(index)     Move keyboard focus to a step.
 *  thumbDrag, showLabels, showTicks, colorShift, disabled   Property mirrors.
 *
 *  Calls made before the element is connected are queued and replayed in
 *  order once it is.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (all bubble and are composed, so they cross the shadow boundary)
 * ----------------------------------------------------------------------------
 *  step-ready       { count }
 *  step-change      { value, label, index, previousValue, previousIndex,
 *                     source }   source: "pointer" (tap/drag) | "keyboard"
 *                                (arrows, Home, End) | "click" (Space/Enter,
 *                                label click, assistive tech) | "api" |
 *                                "attribute"
 *  step-focus       { value, index }
 *  step-drag-start  { value, index }
 *  step-cross       { value, label, index, previousValue, previousIndex,
 *                     source }   the step the thumb is *visually* over, reported
 *                                whenever it moves into a different one: while
 *                                dragging, and while the thumb springs to a new
 *                                step (a tap two steps away crosses the step in
 *                                between). source is the same vocabulary as
 *                                step-change: "pointer" / "keyboard" / "click"
 *                                for a pick, "api" / "attribute" when a
 *                                setValue() or the value attribute started the
 *                                flight. Disabled steps are never reported.
 *  step-drag        { progress, overdrag, nearestIndex, nearestValue }
 *                     progress 0..1 across the whole track, overdrag is the
 *                     signed rubber-band amount (-1..1) past either end.
 *  step-drag-end    { value, index, changed, cancelled }
 *                     Fires after step-change when the drag changed the step.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES
 * ----------------------------------------------------------------------------
 *  Set them on the element or any ancestor. Their defaults live in the
 *  settings block of this file: change them on construction.html (some
 *  follow the main variables in shared/tokens.css).
 *
 *  --kakao-step-switch-track-width          min(100%, 18rem)   (a minimum is enforced so all labels fit)
 *  --kakao-step-switch-track-height         1.75rem
 *  --kakao-step-switch-track-radius         999px
 *  --kakao-step-switch-track-bg             #6b7280   the track colour (default behaviour)
 *  --kakao-step-switch-track-bg-off         #d1d5db   with color-shift: colour at the first step
 *  --kakao-step-switch-track-bg-on          #4f46e5   with color-shift: colour at the last step
 *  --kakao-step-switch-track-bg-disabled    #e5e7eb
 *  --kakao-step-switch-thumb-bg             #ffffff
 *  --kakao-step-switch-thumb-size           1.35rem
 *  --kakao-step-switch-thumb-shadow         0 1px 3px rgba(0,0,0,.3)
 *  --kakao-step-switch-thumb-inset          0.2rem    padding between thumb and track edge
 *  --kakao-step-switch-tick-size            0.28rem
 *  --kakao-step-switch-tick-color           rgba(255,255,255,.8)
 *  --kakao-step-switch-tick-disabled-color  rgba(255,255,255,.3)  dot of a disabled step
 *  --kakao-step-switch-label-color          #4b5563
 *  --kakao-step-switch-label-active-color   #111827
 *  --kakao-step-switch-label-font           0.85rem/1.3 --kakao-font-family (else system-ui)
 *  --kakao-step-switch-label-weight         400       label weight with the thumb far away
 *  --kakao-step-switch-label-weight-active  700       label weight with the thumb on the step
 *                                                       (in between, it follows the thumb live;
 *                                                       fonts without variable weights step
 *                                                       through their available weights)
 *  --kakao-step-switch-label-gap            0.5rem    space between track and labels
 *  --kakao-step-switch-label-overhang       1.5rem    room for the end labels to centre under the end steps
 *  --kakao-step-switch-focus-color          #2563eb
 *  --kakao-step-switch-focus-width          2px
 *  --kakao-step-switch-focus-offset         2px
 *  --kakao-step-switch-anim-duration        320ms
 *  --kakao-step-switch-anim-easing          cubic-bezier(.5,1.8,.4,1)
 *  --kakao-step-switch-disabled-opacity     0.55
 *  --kakao-step-switch-drag-scale-x / -y    1.2 / 0.88   thumb while held
 *  --kakao-step-switch-drag-follow-duration 80ms
 *  --kakao-step-switch-overdrag-scale-x/-y  1.5 / 1.12   thumb pressed into a wall
 *  --kakao-step-switch-overdrag-squircle-radius 28%
 *
 *  Parts: root, track, clip, thumb, steps, step, labels, label.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY NOTES
 * ----------------------------------------------------------------------------
 *  - role="radiogroup" with aria-label; every step is a button with
 *    role="radio", aria-checked, aria-posinset, aria-setsize and an
 *    aria-label. Visible labels are aria-hidden duplicates.
 *  - Roving tabindex: only the selected step is in the tab order.
 *  - Arrow keys (Left/Right/Up/Down) select the previous / next enabled step
 *    and move focus with it; Home / End select the first / last. Unlike a
 *    plain radio group the selection does NOT wrap, because the steps are an
 *    ordered scale and jumping from "High" to "Low" by accident is
 *    surprising. At an end, the key press does nothing.
 *  - Space / Enter on a focused step select it. Disabled steps are skipped.
 *  - aria-busy="true" on the host while setData() is processing.
 *  - :host([disabled]) blocks pointer and keyboard and sets aria-disabled.
 *  - Visible focus ring (:focus-visible only, never after a mouse press).
 *  - prefers-reduced-motion shortens the animations to almost nothing.
 *  - Dragging is a pointer-only enhancement; everything also works by tap and
 *    keyboard. Tracks use touch-action: pan-y while dragging is on, so
 *    horizontal gestures move the thumb and vertical ones still scroll.
 *  - Layout is left-to-right; the arrow keys are not mirrored in RTL.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-step-switch';

  /** Pointer travel (px) before a press counts as a drag; below it, it is a tap. */
  const DRAG_THRESHOLD_PX = 4;
  /** How long (ms) the click that trails a handled pointer gesture is ignored. */
  const TRAILING_CLICK_MS = 500;
  /**
   * Rubber-band stiffness when dragging past an end, in thumb widths of pointer
   * travel. It is measured in thumb sizes, not in track lengths, so a long
   * step track squashes exactly as fast as a short on/off switch: the squash
   * is a property of the thumb, not of how far it can slide.
   */
  const OVERDRAG_RESISTANCE_THUMBS = 0.83;
  const clamp01 = (n) => Math.min(1, Math.max(0, n));
  const FALSEY = ['false', 'off', '0', 'no'];

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      /* ---- Full CSS reset, scoped entirely inside the shadow root ---- */
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      :host {
        /* @kakao-settings:start prefix=--kakao-step-switch- (written by construction.html, edit there) */
        --_track-width: var(--kakao-step-switch-track-width, min(100%, 18rem));
        --_track-height: var(--kakao-step-switch-track-height, 1.75rem);
        --_track-radius: var(--kakao-step-switch-track-radius, 999px);
        --_track-bg: var(--kakao-step-switch-track-bg, #6b7280);
        --_track-bg-off: var(--kakao-step-switch-track-bg-off, var(--kakao-color-border, #d1d5db));
        --_track-bg-on: var(--kakao-step-switch-track-bg-on, var(--kakao-color-primary, #4f46e5));
        --_track-bg-disabled: var(--kakao-step-switch-track-bg-disabled, var(--kakao-color-subtle, #e5e7eb));
        --_thumb-bg: var(--kakao-step-switch-thumb-bg, #ffffff);
        --_thumb-size: var(--kakao-step-switch-thumb-size, 1.35rem);
        --_thumb-shadow: var(--kakao-step-switch-thumb-shadow, 0 1px 3px rgba(0, 0, 0, 0.3));
        --_thumb-inset: var(--kakao-step-switch-thumb-inset, 0.2rem);
        --_tick-size: var(--kakao-step-switch-tick-size, 0.28rem);
        --_tick-color: var(--kakao-step-switch-tick-color, rgba(255, 255, 255, 0.8));
        --_tick-disabled-color: var(--kakao-step-switch-tick-disabled-color, rgba(255, 255, 255, 0.3));
        --_label-color: var(--kakao-step-switch-label-color, var(--kakao-color-text-soft, #4b5563));
        --_label-active-color: var(--kakao-step-switch-label-active-color, var(--kakao-color-text, #111827));
        --_label-font: var(--kakao-step-switch-label-font, 0.85rem/1.3 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_label-weight: var(--kakao-step-switch-label-weight, 400);
        --_label-weight-active: var(--kakao-step-switch-label-weight-active, 700);
        --_label-gap: var(--kakao-step-switch-label-gap, 0.5rem);
        --_label-overhang: var(--kakao-step-switch-label-overhang, 1.5rem);
        --_focus-color: var(--kakao-step-switch-focus-color, var(--kakao-color-focus, #2563eb));
        --_focus-width: var(--kakao-step-switch-focus-width, 2px);
        --_focus-offset: var(--kakao-step-switch-focus-offset, 2px);
        --_anim-duration: var(--kakao-step-switch-anim-duration, var(--kakao-motion-duration, 320ms));
        --_anim-easing: var(--kakao-step-switch-anim-easing, cubic-bezier(.5, 1.8, .4, 1));
        --_disabled-opacity: var(--kakao-step-switch-disabled-opacity, 0.55);
        --_drag-scale-x: var(--kakao-step-switch-drag-scale-x, 1.2);
        --_drag-scale-y: var(--kakao-step-switch-drag-scale-y, 0.88);
        --_drag-follow-duration: var(--kakao-step-switch-drag-follow-duration, 80ms);
        --_overdrag-scale-x: var(--kakao-step-switch-overdrag-scale-x, 1.5);
        --_overdrag-scale-y: var(--kakao-step-switch-overdrag-scale-y, 1.12);
        --_overdrag-squircle-radius: var(--kakao-step-switch-overdrag-squircle-radius, 28%);
        /* @kakao-settings:end */
        display: block;
        font: var(--_label-font);
      }

      :host([disabled]) {
        opacity: var(--_disabled-opacity);
        cursor: not-allowed;
      }

      .root {
        padding: 0.4rem var(--_label-overhang);
      }

      .root[data-labels="false"] {
        padding-inline: 0.4rem;
      }

      /* The track and its labels share one box. Its minimum width is measured
         from the labels (--_min-width), so they can never overlap or be hidden:
         a track set narrower than its labels need simply grows. */
      .body {
        width: var(--_track-width);
        min-width: var(--_min-width, 0px);
      }

      .root {
        overflow-x: auto;
      }

      .track {
        position: relative;
        width: 100%;
        height: var(--_track-height);
        border-radius: var(--_track-radius);
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
        /* Private: 0 = first step, 1 = last step (continuous while dragging).
           The thumb position and the track colour both derive from it. */
        --_progress: 0;
        /* Private: signed rubber-band overdrag past an end, and its magnitude. */
        --_over: 0;
        --_over-abs: 0;
        background: var(--_track-bg);
        transition: background-color var(--_anim-duration) var(--_anim-easing);
      }

      /* Opt-in (color-shift attribute): the track blends from the "off" to the "on"
         colour as the thumb travels. Off by default: the track keeps one colour. */
      .root[data-color-shift="true"] .track {
        background: color-mix(
          in srgb,
          var(--_track-bg-on) calc(var(--_progress) * 100%),
          var(--_track-bg-off)
        );
      }

      :host([disabled]) .root .track,
      :host([disabled]) .root[data-color-shift="true"] .track {
        background: var(--_track-bg-disabled);
      }

      /* The focus ring wraps the whole track, shown only for keyboard focus. */
      .track:has(.step:focus-visible) {
        outline: var(--_focus-width) solid var(--_focus-color);
        outline-offset: var(--_focus-offset);
      }

      /* The clip is the track's inner area (track minus the inset). It cuts off
         whatever part of the squashed or overshooting thumb would enter the
         padding, so the thumb's squashed shape is formed by the track itself. */
      .clip {
        position: absolute;
        /* Half a pixel of vertical slack: the thumb is exactly as tall as the inner
           area, so without it subpixel rounding can shave its top or bottom at rest.
           The overdrag squash (scale-y above 1) still gets cut flat. */
        inset: calc(var(--_thumb-inset) - 0.5px) var(--_thumb-inset);
        overflow: hidden;
        border-radius: calc(var(--_track-radius) - var(--_thumb-inset));
        pointer-events: none;
      }

      .tick {
        position: absolute;
        top: 50%;
        left: calc(var(--_thumb-size) / 2 + (100% - var(--_thumb-size)) * var(--_f));
        width: var(--_tick-size);
        height: var(--_tick-size);
        border-radius: 50%;
        background: var(--_tick-color);
        transform: translate(-50%, -50%);
      }

      .tick.is-disabled {
        background: var(--_tick-disabled-color);
      }

      .root[data-ticks="false"] .tick {
        display: none;
      }

      .thumb {
        position: absolute;
        top: 50%;
        left: calc((100% - var(--_thumb-size)) * var(--_progress));
        width: var(--_thumb-size);
        height: var(--_thumb-size);
        background: var(--_thumb-bg);
        /* A circle at rest. Overdragged into a wall, the side facing away from
           the wall morphs towards a squircle, as if the volume were pressed in. */
        --_r-left: calc(50% - (50% - var(--_overdrag-squircle-radius)) * max(var(--_over), 0));
        --_r-right: calc(50% - (50% - var(--_overdrag-squircle-radius)) * max(var(--_over) * -1, 0));
        border-radius: var(--_r-left) var(--_r-right) var(--_r-right) var(--_r-left);
        box-shadow: var(--_thumb-shadow);
        transform: translateY(-50%);
        transform-origin: calc(50% - var(--_over) * 50%) 50%;
        transition:
          left var(--_anim-duration) var(--_anim-easing),
          transform var(--_anim-duration) var(--_anim-easing),
          transform-origin var(--_anim-duration) var(--_anim-easing),
          border-radius var(--_anim-duration) var(--_anim-easing);
        will-change: left, transform;
      }

      /* The invisible hit areas, one per step, laid over the track. */
      .steps {
        position: absolute;
        inset: var(--_thumb-inset);
        /* The end steps' hit areas reach past the track ends; without the clip that
           overflow makes .root scroll horizontally when show-labels="false". */
        overflow: hidden;
      }

      .step {
        position: absolute;
        top: 0;
        bottom: 0;
        left: calc(var(--_thumb-size) / 2 + (100% - var(--_thumb-size)) * var(--_f));
        width: max(var(--_thumb-size), calc((100% - var(--_thumb-size)) / max(var(--_n) - 1, 1)));
        transform: translateX(-50%);
        background: transparent;
        border: none;
        outline: none;
        color: inherit;
        font: inherit;
        cursor: inherit;
      }

      .step[aria-disabled="true"] {
        cursor: not-allowed;
      }

      /* ---- Labels ---- */
      .labels {
        position: relative;
        width: 100%;
        height: 1.3em;
        margin-top: var(--_label-gap);
      }

      .root[data-labels="false"] .labels {
        display: none;
      }

      .label {
        position: absolute;
        top: 0;
        left: calc(
          var(--_thumb-inset) + var(--_thumb-size) / 2 +
          (100% - 2 * var(--_thumb-inset) - var(--_thumb-size)) * var(--_f)
        );
        transform: translateX(-50%);
        color: var(--_label-color);
        font: var(--_label-font);
        white-space: nowrap;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        /* --_prox: 0 = thumb far away, 1 = thumb right on this step. It is
           updated every frame while the thumb moves, so the label swells and
           darkens as the thumb approaches and relaxes as it leaves. */
        --_prox: 0;
        font-weight: calc(var(--_label-weight) + (var(--_label-weight-active) - var(--_label-weight)) * var(--_prox));
        color: color-mix(in srgb, var(--_label-active-color) calc(var(--_prox) * 100%), var(--_label-color));
      }

      .label[data-disabled="true"] {
        cursor: not-allowed;
        opacity: 0.6;
      }

      /* ---- Thumb dragging (on by default, see the thumb-drag attribute) ---- */
      .root[data-thumb-drag="true"] .track {
        touch-action: pan-y;
        cursor: pointer;
      }

      /* The grab hand only over the thumb itself. is-over-thumb is set from
         pointermove, because the step hit areas lie on top of the thumb and
         would swallow a :hover on it. */
      .root[data-thumb-drag="true"] .track.is-over-thumb {
        cursor: grab;
      }

      .root[data-thumb-drag="true"] .track.is-pressed {
        cursor: grabbing;
      }

      :host([disabled]) .root .track {
        cursor: not-allowed;
        touch-action: auto;
      }

      /* The first and last step are walls: the thumb arrives there without the
         spring's overshoot, so it never bounces into the end. Interior steps
         keep the springy overshoot. */
      .track[data-edge="true"] .thumb {
        transition:
          left var(--_anim-duration) cubic-bezier(.2, .8, .3, 1),
          transform var(--_anim-duration) var(--_anim-easing),
          transform-origin var(--_anim-duration) var(--_anim-easing),
          border-radius var(--_anim-duration) var(--_anim-easing);
      }

      /* Pressed: the thumb goes wide and flat, then springs when released. */
      .track.is-pressed .thumb {
        transform: translateY(-50%) scale(
          calc(var(--_drag-scale-x) + (var(--_overdrag-scale-x) - var(--_drag-scale-x)) * var(--_over-abs)),
          calc(var(--_drag-scale-y) + (var(--_overdrag-scale-y) - var(--_drag-scale-y)) * var(--_over-abs))
        );
      }

      /* Dragging: position and colour follow the pointer 1:1, with no easing. */
      .track.is-dragging {
        transition: none;
      }

      .track.is-dragging .thumb,
      .track.is-dragging[data-edge="true"] .thumb {
        transition: transform var(--_drag-follow-duration) ease-out;
      }

      /* Squash & stretch when the selection moves by tap, keyboard or API. */
      @keyframes kakao-step-stretch {
        0%   { transform: translateY(-50%) scaleX(1) scaleY(1); }
        35%  { transform: translateY(-50%) scaleX(var(--_stretch, 1.4)) scaleY(var(--_squeeze, 0.75)); }
        65%  { transform: translateY(-50%) scaleX(0.88) scaleY(1.12); }
        100% { transform: translateY(-50%) scaleX(1) scaleY(1); }
      }

      .thumb.is-animating {
        animation: kakao-step-stretch var(--_anim-duration) var(--_anim-easing);
      }

      @media (prefers-reduced-motion: reduce) {
        .thumb, .track, .label {
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
        }
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }
    </style>
    <div class="root" part="root" role="radiogroup">
      <span class="visually-hidden" data-empty-msg>No steps configured.</span>
    </div>
  `;

  class KakaoStepSwitch extends HTMLElement {
    static get observedAttributes() {
      return ['label', 'list-data', 'value', 'disabled', 'thumb-drag', 'show-labels', 'show-ticks', 'color-shift'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));

      this._rootEl = shadow.querySelector('.root');
      this._steps = []; // [{value,label,disabled}]
      this._index = -1; // selected step
      this._connected = false;
      this._pending = []; // public-method calls made before connectedCallback
      this._resizeObserver = null;
      this._readyFired = false;
      this._reflecting = false; // true while we write the value attribute ourselves
      this._raf = 0; // pending requestAnimationFrame for the label loop
      this._crossing = -1; // step the thumb is visually over (for step-cross)
      this._lastSource = 'pointer'; // source of the last selection, used by step-cross
      this._drag = null; // active pointer gesture, or null
      this._swallow = null; // { track, until }: ignore the click trailing a pointer gesture

      this._onClick = this._onClick.bind(this);
      this._onKeydown = this._onKeydown.bind(this);
      this._onFocusin = this._onFocusin.bind(this);
      this._onPointerDown = this._onPointerDown.bind(this);
      this._onPointerMove = this._onPointerMove.bind(this);
      this._onPointerUp = this._onPointerUp.bind(this);
      this._onPointerCancel = this._onPointerCancel.bind(this);
      this._onPointerLeave = this._onPointerLeave.bind(this);
      this._onLostPointerCapture = this._onLostPointerCapture.bind(this);
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      this._connected = true;

      const r = this._rootEl;
      r.addEventListener('click', this._onClick);
      r.addEventListener('keydown', this._onKeydown);
      r.addEventListener('focusin', this._onFocusin);
      r.addEventListener('pointerdown', this._onPointerDown);
      r.addEventListener('pointermove', this._onPointerMove);
      r.addEventListener('pointerup', this._onPointerUp);
      r.addEventListener('pointercancel', this._onPointerCancel);
      r.addEventListener('pointerleave', this._onPointerLeave);
      r.addEventListener('lostpointercapture', this._onLostPointerCapture);

      // Also re-reads the label highlight: if the switch started out hidden (e.g. in an
      // inactive tab panel) everything measured 0 and the labels need a fresh pass.
      this._resizeObserver = new ResizeObserver(() => {
        this._updateMinWidth();
        this._updateLabels();
      });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this._connected && this._updateMinWidth());
      this._resizeObserver.observe(this);

      this._syncLabel();
      this._syncFlags();
      this._syncDisabled();
      this._syncListDataFromAttribute();
      this._resolveIndex();

      while (this._pending.length) {
        const { method, args } = this._pending.shift();
        this[method](...args);
      }

      this._render();

      if (!this._readyFired) {
        this._readyFired = true;
        this._dispatch('step-ready', { count: this._steps.length });
      }
    }

    disconnectedCallback() {
      this._connected = false;
      const r = this._rootEl;
      r.removeEventListener('click', this._onClick);
      r.removeEventListener('keydown', this._onKeydown);
      r.removeEventListener('focusin', this._onFocusin);
      r.removeEventListener('pointerdown', this._onPointerDown);
      r.removeEventListener('pointermove', this._onPointerMove);
      r.removeEventListener('pointerup', this._onPointerUp);
      r.removeEventListener('pointercancel', this._onPointerCancel);
      r.removeEventListener('pointerleave', this._onPointerLeave);
      r.removeEventListener('lostpointercapture', this._onLostPointerCapture);
      this._abortDrag();
      this._swallow = null;
      if (this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = 0;
      }
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      switch (name) {
        case 'label':
          this._syncLabel();
          break;
        case 'disabled':
          this._syncDisabled();
          break;
        case 'thumb-drag':
        case 'show-labels':
        case 'show-ticks':
        case 'color-shift':
          this._syncFlags();
          if (name === 'show-labels' && this._connected) this._updateMinWidth();
          break;
        case 'list-data':
          this._syncListDataFromAttribute();
          this._resolveIndex();
          if (this._connected) this._render();
          break;
        case 'value':
          if (this._reflecting) break; // our own write-back
          this._onValueAttribute();
          break;
      }
    }

    /* -------------------------- Public API -------------------------- */

    /**
     * Replace all steps. Queued if called before the element is connected.
     * @param {Array<string|number|{value?:string,label?:string,disabled?:boolean}>} steps
     */
    setData(steps) {
      if (!this._connected) {
        this._pending.push({ method: 'setData', args: [steps] });
        return;
      }
      // Applied synchronously, so calls queued right after it (setValue...) see the new
      // steps; aria-busy stays up until the end of the microtask for async UIs to observe.
      this.setAttribute('aria-busy', 'true');
      this._steps = this._normalizeSteps(steps);
      this._crossing = -1;
      this._resolveIndex();
      this._render();
      Promise.resolve().then(() => this.removeAttribute('aria-busy'));
    }

    /** @returns {Array<{value:string,label:string,disabled:boolean}>} */
    getData() {
      return JSON.parse(JSON.stringify(this._steps));
    }

    /** @param {string|number} value value of the step to select */
    setValue(value) {
      if (!this._connected) {
        this._pending.push({ method: 'setValue', args: [value] });
        return;
      }
      if (this.disabled) return;
      const index = this._steps.findIndex((s) => s.value === String(value));
      if (index === -1 || this._steps[index].disabled) return;
      this._select(index, { source: 'api', animate: true });
    }

    /** @returns {number} index of the selected step, -1 when there are no steps */
    getIndex() {
      return this._index;
    }

    /**
     * Move the selection by `delta` enabled steps, clamped to the ends.
     * @param {number} delta
     */
    stepBy(delta) {
      if (!this._connected) {
        this._pending.push({ method: 'stepBy', args: [delta] });
        return;
      }
      if (this.disabled || !delta) return;
      const target = this._neighbour(this._index, delta);
      if (target !== -1) this._select(target, { source: 'api', animate: true });
    }

    /** @param {number} index */
    focusStep(index) {
      if (!this._connected) {
        this._pending.push({ method: 'focusStep', args: [index] });
        return;
      }
      const el = this._rootEl.querySelector(`.step[data-index="${index}"]`);
      if (el && !this.disabled) el.focus();
    }

    /* -------------------------- Attribute reflection -------------------------- */

    get disabled() {
      return this.hasAttribute('disabled');
    }
    set disabled(val) {
      if (val) this.setAttribute('disabled', '');
      else this.removeAttribute('disabled');
    }

    get value() {
      const s = this._steps[this._index];
      return s ? s.value : '';
    }
    set value(val) {
      this.setAttribute('value', String(val));
    }

    get thumbDrag() {
      return this._flag('thumb-drag');
    }
    set thumbDrag(val) {
      this.setAttribute('thumb-drag', val ? 'true' : 'false');
    }

    get showLabels() {
      return this._flag('show-labels');
    }
    set showLabels(val) {
      this.setAttribute('show-labels', val ? 'true' : 'false');
    }

    get showTicks() {
      return this._flag('show-ticks');
    }
    set showTicks(val) {
      this.setAttribute('show-ticks', val ? 'true' : 'false');
    }

    /** Track colour follows the thumb from the "off" to the "on" colour. Default OFF; opt in with color-shift. */
    get colorShift() {
      const raw = this.getAttribute('color-shift');
      if (raw === null) return false;
      return !FALSEY.includes(raw.trim().toLowerCase());
    }
    set colorShift(val) {
      if (val) this.setAttribute('color-shift', '');
      else this.removeAttribute('color-shift');
    }

    /** Boolean attribute that is ON when absent and OFF for "false"/"off"/"0"/"no". */
    _flag(name) {
      const raw = this.getAttribute(name);
      if (raw === null) return true;
      return !FALSEY.includes(raw.trim().toLowerCase());
    }

    /* -------------------------- Internal sync helpers -------------------------- */

    _syncLabel() {
      this._rootEl.setAttribute('aria-label', this.getAttribute('label') || 'Step switch');
    }

    _syncFlags() {
      this._rootEl.setAttribute('data-thumb-drag', String(this.thumbDrag));
      this._rootEl.setAttribute('data-labels', String(this.showLabels));
      this._rootEl.setAttribute('data-ticks', String(this.showTicks));
      this._rootEl.setAttribute('data-color-shift', String(this.colorShift));
      if (!this.thumbDrag) this._abortDrag();
    }

    _syncDisabled() {
      this.setAttribute('aria-disabled', String(this.disabled));
      if (this.disabled) this._abortDrag();
      if (this._connected) this._render();
    }

    _syncListDataFromAttribute() {
      const raw = this.getAttribute('list-data');
      if (raw == null) return;
      try {
        this._steps = this._normalizeSteps(JSON.parse(raw));
      } catch (err) {
        console.error(`<${TAG_NAME}> failed to parse list-data attribute as JSON:`, err);
        this._steps = [];
      }
      this._crossing = -1; // other steps now: the next sample only records where the thumb is
    }

    _normalizeSteps(steps) {
      if (!Array.isArray(steps)) return [];
      return steps.map((raw, i) => {
        if (raw !== null && typeof raw === 'object') {
          const value = raw.value != null ? String(raw.value) : String(i);
          return {
            value,
            label: raw.label != null ? String(raw.label) : value,
            disabled: !!raw.disabled,
          };
        }
        const value = raw != null ? String(raw) : String(i);
        return { value, label: value, disabled: false };
      });
    }

    /**
     * Decides which step is selected: the value attribute if it matches,
     * otherwise the step that was selected before, otherwise the first enabled one.
     */
    _resolveIndex() {
      const attr = this.getAttribute('value');
      let index = attr == null ? -1 : this._steps.findIndex((s) => s.value === attr);
      if (index === -1) {
        const keep = this._steps[this._index];
        if (keep) index = this._steps.findIndex((s) => s.value === keep.value);
      }
      if (index === -1) index = this._steps.findIndex((s) => !s.disabled);
      if (index === -1 && this._steps.length) index = 0;
      this._index = index;
      // The attribute always mirrors the real selection.
      if (this._steps[index]) this._reflectValue(this._steps[index].value);
    }

    _onValueAttribute() {
      const attr = this.getAttribute('value');
      const index = this._steps.findIndex((s) => s.value === attr);
      if (index === -1 || index === this._index) return;
      if (this._connected && !this.disabled) {
        this._select(index, { source: 'attribute', animate: true });
      } else {
        this._index = index;
        if (this._connected) this._updateSelectionUi();
      }
    }

    _reflectValue(value) {
      if (this.getAttribute('value') === value) return;
      this._reflecting = true;
      this.setAttribute('value', value);
      this._reflecting = false;
    }

    /* -------------------------- Rendering -------------------------- */

    _render() {
      this._abortDrag(); // the track is about to be replaced
      const emptyMsg = this._rootEl.querySelector('[data-empty-msg]');
      this._rootEl.innerHTML = '';

      const n = this._steps.length;
      if (!n) {
        this._rootEl.appendChild(emptyMsg || document.createTextNode('No steps configured.'));
        return;
      }

      const hostDisabled = this.disabled;
      const f = (i) => (n > 1 ? i / (n - 1) : 0);

      const body = document.createElement('div');
      body.className = 'body';
      const track = document.createElement('div');
      track.className = 'track';
      track.setAttribute('part', 'track');
      track.style.setProperty('--_n', String(n));

      const clip = document.createElement('span');
      clip.className = 'clip';
      clip.setAttribute('part', 'clip');
      this._steps.forEach((step, i) => {
        const tick = document.createElement('span');
        // Disabled steps keep their dot, dimmed, so the track still shows every position
        tick.className = step.disabled ? 'tick is-disabled' : 'tick';
        tick.style.setProperty('--_f', String(f(i)));
        clip.appendChild(tick);
      });
      const thumb = document.createElement('span');
      thumb.className = 'thumb';
      thumb.setAttribute('part', 'thumb');
      clip.appendChild(thumb);
      track.appendChild(clip);

      const stepsLayer = document.createElement('span');
      stepsLayer.className = 'steps';
      stepsLayer.setAttribute('part', 'steps');
      this._steps.forEach((step, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'step';
        btn.setAttribute('part', 'step');
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-label', step.label);
        btn.setAttribute('aria-posinset', String(i + 1));
        btn.setAttribute('aria-setsize', String(n));
        btn.setAttribute('aria-disabled', String(step.disabled || hostDisabled));
        btn.setAttribute('data-index', String(i));
        btn.style.setProperty('--_f', String(f(i)));
        stepsLayer.appendChild(btn);
      });
      track.appendChild(stepsLayer);
      body.appendChild(track);
      this._rootEl.appendChild(body);

      const labels = document.createElement('div');
      labels.className = 'labels';
      labels.setAttribute('part', 'labels');
      this._steps.forEach((step, i) => {
        const span = document.createElement('span');
        span.className = 'label';
        span.setAttribute('part', 'label');
        span.setAttribute('aria-hidden', 'true'); // the radios already carry the names
        span.setAttribute('data-index', String(i));
        span.setAttribute('data-disabled', String(step.disabled || hostDisabled));
        span.style.setProperty('--_f', String(f(i)));
        span.textContent = step.label;
        labels.appendChild(span);
      });
      body.appendChild(labels);

      this._updateSelectionUi();
      this._updateMinWidth();
    }

    /** Syncs radios, labels and thumb position with the selected index. */
    _updateSelectionUi() {
      this._rootEl.querySelectorAll('.step').forEach((btn) => {
        const i = Number(btn.getAttribute('data-index'));
        btn.setAttribute('aria-checked', String(i === this._index));
        btn.tabIndex = i === this._index && !this.disabled ? 0 : -1;
      });
      this._rootEl.querySelectorAll('.label').forEach((el) => {
        el.classList.toggle('is-active', Number(el.getAttribute('data-index')) === this._index);
        el.classList.remove('is-near');
      });
      this._applyProgress();
      this._updateLabels();
    }

    /**
     * Sets each label's --_prox from the thumb's live position. Reading the
     * computed left means it also follows the release spring, not just the drag.
     * @returns {number} the thumb's current 0..1 position, or -1 without a track
     */
    _updateLabels() {
      const track = this._rootEl.querySelector('.track');
      if (!track) return -1;
      const clip = track.querySelector('.clip');
      const thumb = track.querySelector('.thumb');
      const travel = Math.max(1, parseFloat(getComputedStyle(clip).width) - parseFloat(getComputedStyle(thumb).width));
      const p = parseFloat(getComputedStyle(thumb).left) / travel || 0;
      const pos = Math.min(1, Math.max(0, p)) * Math.max(this._steps.length - 1, 0);
      this._rootEl.querySelectorAll('.label').forEach((el, i) => {
        // A disabled step never reacts to the thumb: it stays at its resting weight.
        const prox = this._steps[i] && this._steps[i].disabled ? 0 : Math.max(0, 1 - Math.abs(pos - i));
        el.style.setProperty('--_prox', prox.toFixed(3));
      });
      return p;
    }

    /** Keeps the labels in step with the thumb until it comes to rest. */
    _startLabelLoop() {
      if (this._raf) return;
      let last = null;
      let still = 0;
      const tick = () => {
        this._raf = 0;
        const p = this._updateLabels();
        if (p === -1) return;
        this._reportCrossing(p);
        still = !this._drag && last !== null && Math.abs(p - last) < 1e-4 ? still + 1 : 0;
        last = p;
        if (still > 6) return; // settled
        this._raf = requestAnimationFrame(tick);
      };
      this._raf = requestAnimationFrame(tick);
    }

    /**
     * Announces the step the thumb is over, live, while it moves: dragged, or
     * springing to a new step. A tap two steps away flies the thumb across the
     * step in between, so a listener (the theme switch) sees every step the
     * thumb crosses, not just the one that ends up selected.
     *
     * @param {number} p the thumb's 0..1 position
     */
    _reportCrossing(p) {
      const n = this._steps.length;
      if (n < 2) return;
      const index = Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))));
      if (index === this._crossing) return;
      const previousIndex = this._crossing;
      this._crossing = index;
      // The first sample only records where the thumb rests: nothing was crossed.
      if (previousIndex === -1) return;
      const step = this._steps[index];
      const previous = this._steps[previousIndex];
      if (!step || step.disabled) return;
      this._dispatch('step-cross', {
        value: step.value,
        label: step.label,
        index,
        previousValue: previous ? previous.value : null,
        previousIndex,
        // A drag is always the user; otherwise the source of the selection that
        // started the flight ("api" / "attribute" for setValue and the value
        // attribute, so a listener can tell a reflection from a pick).
        source: this._drag ? 'pointer' : this._lastSource,
      });
    }

    /** Writes the inline progress that matches the selected step. */
    _applyProgress() {
      const track = this._rootEl.querySelector('.track');
      if (!track) return;
      const n = this._steps.length;
      const p = n > 1 && this._index > 0 ? this._index / (n - 1) : 0;
      track.style.setProperty('--_progress', String(p));
      track.setAttribute('data-edge', String(n > 1 && (this._index === 0 || this._index === n - 1)));
      this._startLabelLoop();
    }

    /**
     * Measures the labels and sets the smallest track width at which neighbours
     * still have a gap between them, so every label is always fully visible.
     * (The selected label is bold, so the widest width is padded for that.)
     */
    _updateMinWidth() {
      const body = this._rootEl.querySelector('.body');
      const n = this._steps.length;
      if (!body) return;
      if (n < 2 || !this.showLabels) {
        body.style.removeProperty('--_min-width');
        return;
      }
      const thumb = body.querySelector('.thumb');
      const inset = parseFloat(getComputedStyle(body.querySelector('.clip')).left) || 0;
      let widest = 0;
      body.querySelectorAll('.label').forEach((el) => {
        widest = Math.max(widest, el.offsetWidth);
      });
      const gap = 8; // px of air between neighbouring labels
      const spacing = widest * 1.12 + gap;
      body.style.setProperty('--_min-width', `${Math.ceil((n - 1) * spacing + thumb.offsetWidth + inset * 2)}px`);
    }

    /* -------------------------- Selection -------------------------- */

    /**
     * Nearest enabled step to a continuous position, -1 if every step is disabled.
     * @param {number} progress 0..1 across the track
     */
    _nearestEnabled(progress) {
      const ideal = clamp01(progress) * Math.max(this._steps.length - 1, 0);
      let best = -1;
      let bestDist = Infinity;
      this._steps.forEach((s, i) => {
        if (s.disabled) return;
        const d = Math.abs(i - ideal);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    /** The enabled step `delta` enabled steps away from `from`, clamped; -1 if none moves. */
    _neighbour(from, delta) {
      const enabled = this._steps.map((s, i) => (s.disabled ? -1 : i)).filter((i) => i !== -1);
      if (!enabled.length) return -1;
      let pos = enabled.indexOf(from);
      if (pos === -1) {
        // The selection sits on a disabled step: count from the gap it leaves, so a
        // step forward lands on the next enabled step and one back on the previous.
        const before = enabled.filter((i) => i < from).length;
        pos = delta > 0 ? before - 1 : before;
      }
      const next = Math.min(enabled.length - 1, Math.max(0, pos + delta));
      const target = enabled[next];
      return target === from ? -1 : target;
    }

    /**
     * Makes `index` the selected step.
     * @param {number} index
     * @param {{source:string, animate:boolean}} opts animate = play the stretch
     *        keyframes (tap / key / API); false when a drag release already
     *        springs the thumb into place.
     * @returns {boolean} whether the selection changed
     */
    _select(index, { source, animate }) {
      const step = this._steps[index];
      if (!step || index === this._index) {
        this._applyProgress();
        return false;
      }
      const previousIndex = this._index;
      const previous = this._steps[previousIndex];
      this._lastSource = source;
      this._index = index;
      this._reflectValue(step.value);
      this._updateSelectionUi();
      if (animate) this._playStretch(Math.abs(index - previousIndex) / Math.max(this._steps.length - 1, 1));
      this._dispatch('step-change', {
        value: step.value,
        label: step.label,
        index,
        previousValue: previous ? previous.value : null,
        previousIndex,
        source,
      });
      return true;
    }

    /** Stretch & squash of the thumb (the track itself stays still) for a move covering `fraction` of the track. */
    _playStretch(fraction) {
      const track = this._rootEl.querySelector('.track');
      const thumb = track && track.querySelector('.thumb');
      if (!thumb) return;
      thumb.style.setProperty('--_stretch', (1.25 + 0.3 * fraction).toFixed(3));
      thumb.style.setProperty('--_squeeze', (0.85 - 0.13 * fraction).toFixed(3));
      thumb.classList.remove('is-animating');
      void thumb.offsetWidth; // restart the animation reliably
      thumb.classList.add('is-animating');
      const cleanup = () => {
        thumb.classList.remove('is-animating');
        thumb.removeEventListener("animationend", cleanup);
      };
      thumb.addEventListener('animationend', cleanup);
    }

    /* -------------------------- Clicks and keyboard -------------------------- */

    _onClick(evt) {
      if (this.disabled) return;
      const hit = evt.target.closest('.step, .label');
      if (!hit) return;

      // A pointer gesture on the track was handled in pointerup already; the
      // click that trails it must not select a second time.
      const swallow = this._swallow;
      this._swallow = null;
      const track = hit.closest('.track');
      if (track && swallow && swallow.track === track && performance.now() < swallow.until) return;

      const index = Number(hit.getAttribute('data-index'));
      const step = this._steps[index];
      if (!step || step.disabled) return;
      // Space/Enter on a step, assistive-tech activation and label clicks arrive here.
      this._select(index, { source: 'click', animate: true });
    }

    _onFocusin(evt) {
      const btn = evt.target.closest && evt.target.closest('.step');
      if (!btn) return;
      const index = Number(btn.getAttribute('data-index'));
      const step = this._steps[index];
      if (step) this._dispatch('step-focus', { value: step.value, index });
    }

    _onKeydown(evt) {
      if (this.disabled) return;
      const btn = evt.target.closest('.step');
      if (!btn) return;
      if (evt.altKey || evt.ctrlKey || evt.metaKey) return;

      let target = null;
      switch (evt.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          target = this._neighbour(this._index, 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          target = this._neighbour(this._index, -1);
          break;
        case 'Home':
          target = this._steps.findIndex((s) => !s.disabled);
          if (target === this._index) target = -1;
          break;
        case 'End': {
          let last = -1;
          this._steps.forEach((s, i) => { if (!s.disabled) last = i; });
          target = last === this._index ? -1 : last;
          break;
        }
        default:
          return;
      }
      evt.preventDefault();
      if (target === -1 || target == null) return; // already at the end: nothing moves, nothing bounces
      this._select(target, { source: 'keyboard', animate: true });
      const el = this._rootEl.querySelector(`.step[data-index="${target}"]`);
      if (el) el.focus();
    }

    /* -------------------------- Thumb dragging -------------------------- */

    _onPointerDown(evt) {
      if (this._drag || !this.thumbDrag || this.disabled) return;
      if (!evt.isPrimary) return;
      if (evt.pointerType === 'mouse' && evt.button !== 0) return;

      const track = evt.target.closest('.track');
      if (!track || !this._steps.some((s) => !s.disabled)) return;
      const clip = track.querySelector('.clip');
      const thumb = track.querySelector('.thumb');
      if (!clip || !thumb) return;

      // Exact layout pixels: the thumb may still be mid-spring from a previous move.
      const clipWidth = parseFloat(getComputedStyle(clip).width) || 0;
      const thumbWidth = parseFloat(getComputedStyle(thumb).width) || 0;
      const clipRect = clip.getBoundingClientRect();
      const screenScale = clipWidth ? clipRect.width / clipWidth : 1; // ancestor CSS transforms
      const travel = Math.max(1, clipWidth - thumbWidth);
      const travelPx = travel * screenScale;
      const leftNow = parseFloat(getComputedStyle(thumb).left);
      const startProgress = Number.isFinite(leftNow) ? clamp01(leftNow / travel) : 0;

      this._drag = {
        pointerId: evt.pointerId,
        track,
        startX: evt.clientX,
        startProgress,
        progress: startProgress,
        travelPx,
        resistPx: OVERDRAG_RESISTANCE_THUMBS * thumbWidth * screenScale,
        // Where a tap would put the thumb's centre, as a 0..1 track position.
        tapProgress: clamp01((evt.clientX - clipRect.left - (thumbWidth * screenScale) / 2) / travelPx),
        near: this._index,
        moved: false,
      };
      track.classList.add('is-pressed');
      this._startLabelLoop();
      try {
        track.setPointerCapture(evt.pointerId);
      } catch (err) {
        /* capture unsupported or the pointer is gone: dragging still works inside the track */
      }
    }

    /** Marks the track while the pointer is over the thumb, so only the thumb shows the grab cursor. */
    _updateThumbHover(evt) {
      const track = this._rootEl.querySelector('.track');
      const thumb = track && track.querySelector('.thumb');
      if (!thumb) return;
      const r = thumb.getBoundingClientRect();
      const over = evt.clientX >= r.left && evt.clientX <= r.right && evt.clientY >= r.top && evt.clientY <= r.bottom;
      track.classList.toggle('is-over-thumb', over);
    }

    _onPointerLeave() {
      const track = this._rootEl.querySelector('.track');
      if (track) track.classList.remove('is-over-thumb');
    }

    _onPointerMove(evt) {
      const d = this._drag;
      if (!d) {
        this._updateThumbHover(evt);
        return;
      }
      if (evt.pointerId !== d.pointerId) return;

      const dx = evt.clientX - d.startX;
      if (!d.moved) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
        d.moved = true;
        d.track.classList.add('is-dragging');
        const cur = this._steps[this._index];
        this._dispatch('step-drag-start', { value: cur ? cur.value : null, index: this._index });
      }

      // The thumb stops at the ends; whatever the pointer does beyond turns into a rubber-band squash.
      const raw = d.startProgress + dx / d.travelPx;
      d.progress = clamp01(raw);
      const excessPx = (raw > 1 ? raw - 1 : raw < 0 ? raw : 0) * d.travelPx; // signed, in screen px
      const overdrag = Math.sign(excessPx) * (1 - Math.exp(-Math.abs(excessPx) / d.resistPx));

      const style = d.track.style;
      style.setProperty('--_progress', String(d.progress));
      style.setProperty('--_over', overdrag.toFixed(4));
      style.setProperty('--_over-abs', Math.abs(overdrag).toFixed(4));

      const near = this._nearestEnabled(d.progress);
      if (near !== d.near) {
        d.near = near;
        this._rootEl.querySelectorAll('.label').forEach((el) => {
          el.classList.toggle('is-near', Number(el.getAttribute('data-index')) === near);
        });
      }
      const nearStep = this._steps[near];
      this._dispatch('step-drag', {
        progress: d.progress,
        overdrag,
        nearestIndex: near,
        nearestValue: nearStep ? nearStep.value : null,
      });
    }

    _onPointerUp(evt) {
      if (this._drag && evt.pointerId === this._drag.pointerId) this._finishDrag(false);
    }

    _onPointerCancel(evt) {
      if (this._drag && evt.pointerId === this._drag.pointerId) this._finishDrag(true);
    }

    _onLostPointerCapture(evt) {
      // Normal releases end the drag in pointerup first; a live drag here means
      // the capture was taken away (e.g. the element was removed).
      if (this._drag && evt.pointerId === this._drag.pointerId) this._finishDrag(true);
    }

    /**
     * Ends the gesture. A tap selects the step under the pointer; a drag snaps
     * to the nearest enabled step. The thumb then springs there through the
     * normal CSS transition, which is where the squash and stretch comes from.
     * @param {boolean} cancelled true when the browser cancelled the gesture
     */
    _finishDrag(cancelled) {
      const d = this._drag;
      if (!d) return;
      this._drag = null;

      try {
        d.track.releasePointerCapture(d.pointerId);
      } catch (err) {
        /* not captured */
      }
      d.track.classList.remove('is-pressed', 'is-dragging');
      this._clearDragStyle(d.track);
      this._rootEl.querySelectorAll('.label.is-near').forEach((el) => el.classList.remove('is-near'));

      const cur = this._steps[this._index];
      if (cancelled) {
        this._lastSource = 'pointer'; // the thumb springs back: report it as the gesture it was
        this._applyProgress(); // back to the selected step
        if (d.moved) {
          this._dispatch('step-drag-end', {
            value: cur ? cur.value : null, index: this._index, changed: false, cancelled: true,
          });
        }
        return;
      }

      const target = this._nearestEnabled(d.moved ? d.progress : d.tapProgress);
      const changed = target !== -1 && this._select(target, { source: 'pointer', animate: false });
      this._applyProgress(); // also covers "same step": the thumb springs back to it
      if (d.moved) {
        const now = this._steps[this._index];
        this._dispatch('step-drag-end', {
          value: now ? now.value : null, index: this._index, changed, cancelled: false,
        });
      }
      this._swallow = { track: d.track, until: performance.now() + TRAILING_CLICK_MS };
    }

    /** Removes the overdrag values the drag wrote (the progress stays inline and is re-applied). */
    _clearDragStyle(track) {
      track.style.removeProperty('--_over');
      track.style.removeProperty('--_over-abs');
    }

    /** Drops an active gesture without committing anything. */
    _abortDrag() {
      const d = this._drag;
      if (!d) return;
      this._drag = null;
      try {
        d.track.releasePointerCapture(d.pointerId);
      } catch (err) {
        /* not captured */
      }
      d.track.classList.remove('is-pressed', 'is-dragging');
      this._clearDragStyle(d.track);
      this._lastSource = 'pointer'; // the thumb springs back: report it as the gesture it was
      this._applyProgress();
    }

    /* -------------------------- Misc -------------------------- */

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
  }

  if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, KakaoStepSwitch);
  }
})();

