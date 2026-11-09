/**
 * <kakao-switch-group>
 * ============================================================================
 * A production-ready, fully accessible group of toggle switches with a fluid
 * "squash and stretch" animation, built with vanilla JS + Shadow DOM.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 * <\/script>  <!-- safe to inline in HTML, see note below -->
 *
 *   <script src="switch-group.js"><\/script>
 *
 *   <kakao-switch-group
 *     label="Notification settings"
 *     list-data='[{"name":"email","label":"Email","checked":true},
 *                 {"name":"sms","label":"SMS","checked":false},
 *                 {"name":"push","label":"Push","checked":true,"disabled":true}]'>
 *   </kakao-switch-group>
 *
 * Note: the literal "<\/script>" sequence above is escaped as "<\/script>"
 * anywhere it appears inside this JSDoc comment block so that this file can
 * be safely inlined inside a parent <script> tag (e.g. in demo-embedded.html)
 * without prematurely closing the tag.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed, all reflect into the public API)
 * ----------------------------------------------------------------------------
 *  - label            string   Accessible group label (used as aria-label on
 *                               the group container). Default: "Switch group".
 *  - list-data         JSON     Array of switch definitions. NEVER use the
 *                               reserved `data` attribute name.
 *                               Shape: [{ name, label, checked, disabled }]
 *  - orientation       string   "horizontal" (default) | "vertical"
 *  - disabled          boolean  Disables the entire group, sets aria-disabled
 *                               on the host, and blocks all interaction.
 *  - thumb-drag        boolean  Lets the user grab the thumb (the dot) with a
 *                               finger or mouse and drag it along the track.
 *                               On release the thumb snaps to whichever end it
 *                               is nearer to. Dragging past either end squashes
 *                               the thumb into the end of the track: it widens
 *                               into the wall while the side facing away from the
 *                               wall turns into a squircle edge, so it looks like
 *                               the thumb's volume is pressed into the corner. It
 *                               springs back on release. The thumb is clipped at
 *                               the track's inner edge (the inset), so it can
 *                               never bleed into the padding.
 *                               Default: ON. Turn it off with
 *                               thumb-drag="false" (also "off", "0", "no").
 *                               Taps, clicks and the keyboard work either way.
 *                               JS property: thumbDrag (boolean).
 *                               (Deliberately not called `draggable`: that is a
 *                               native HTML attribute which would switch on
 *                               browser drag-and-drop for the host element.)
 *  - color-labels      boolean  Default OFF. When present, the label of a checked
 *                               switch takes the "on" colour
 *                               (--kakao-switch-label-color-on, which follows
 *                               --kakao-switch-track-bg-on unless set) and fades
 *                               back when it is turned off. "false" / "off" /
 *                               "0" / "no" turn it off. JS property: colorLabels.
 *  - async             boolean  Default OFF. Every user toggle first fires a
 *                               cancelable "switch-request" event whose detail has
 *                               waitUntil(promise). If a listener hands it a promise,
 *                               the thumb moves to the new end and shows a spinning
 *                               loader; on resolve the change is committed
 *                               ("switch-change") and a checkmark draws in
 *                               briefly before the thumb settles, on reject the track turns red, the
 *                               thumb shows an X, and after a moment it springs back
 *                               ("switch-error"). Without waitUntil the toggle is
 *                               immediate. JS property: async.
 *  - loading-delay     number   Default 300. Milliseconds an async toggle waits
 *                               before showing its loader. Requests that finish
 *                               sooner show no loader and no checkmark, the switch
 *                               just stays (failures always show red + X). Once
 *                               shown, the loader stays at least 400ms. 0 shows it
 *                               immediately. JS property: loadingDelay.
 *
 * Attributes always take priority over method calls; if both are present the
 * latest one to be applied wins (attributeChangedCallback re-syncs state).
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES
 * ----------------------------------------------------------------------------
 *  Set them on the element or any ancestor. Their defaults live in the
 *  settings block of this file: change them on construction.html (some
 *  follow the main variables in shared/tokens.css).
 *
 *  --kakao-switch-track-width        Track width.            Default: 3.25rem
 *  --kakao-switch-track-height       Track height.            Default: 1.75rem
 *  --kakao-switch-track-radius       Track border-radius.     Default: 999px
 *  --kakao-switch-track-bg-off       Track bg when off.       Default: #d1d5db
 *  --kakao-switch-track-bg-on        Track bg when on.        Default: #4f46e5
 *  --kakao-switch-track-bg-disabled  Track bg when disabled.  Default: #e5e7eb
 *  --kakao-switch-thumb-bg           Thumb color.             Default: #ffffff
 *  --kakao-switch-thumb-size         Thumb diameter.          Default: 1.35rem
 *  --kakao-switch-thumb-shadow       Thumb box-shadow.
 *                                      Default: 0 1px 3px rgba(0,0,0,0.3)
 *  --kakao-switch-gap                Gap between switches.    Default: 1rem
 *  --kakao-switch-label-color        Label text color.        Default: #111827
 *  --kakao-switch-label-color-on     Label color of a checked switch with color-labels.
 *                                      Default: var(--kakao-switch-track-bg-on)
 *  --kakao-switch-track-bg-error     Track bg after a failed async toggle. Default: #dc2626
 *  --kakao-switch-spinner-color      Loader ring inside the thumb while an async toggle
 *                                      is pending. Default: var(--kakao-switch-track-bg-on)
 *  --kakao-switch-success-color      Checkmark after a successful async toggle.
 *                                      Default: var(--kakao-switch-track-bg-on)
 *  --kakao-switch-label-font         Label font shorthand.
 *                                      Default: 0.95rem/1.4 system-ui, sans-serif
 *  --kakao-switch-focus-color        focus-visible outline.   Default: #2563eb
 *  --kakao-switch-anim-duration      Squash/stretch duration. Default: 320ms
 *  --kakao-switch-anim-easing        Squash/stretch easing.
 *                                      Default: cubic-bezier(.5,1.8,.4,1)
 *  --kakao-switch-thumb-inset        Padding between the thumb and the edge of
 *                                      the track. The thumb is clipped to the
 *                                      area inside this padding. Default: 0.2rem
 *  --kakao-switch-item-gap           Gap between track and label.
 *                                      Default: 0.6rem
 *  --kakao-switch-group-padding      Padding around the group. Default: 0.25rem
 *  --kakao-switch-focus-width        focus-visible outline width. Default: 2px
 *  --kakao-switch-focus-offset       focus-visible outline offset. Default: 2px
 *  --kakao-switch-disabled-opacity   Opacity when disabled.   Default: 0.55
 *  --kakao-switch-drag-scale-x       Thumb stretch while pressed or dragged.
 *                                      Default: 1.2
 *  --kakao-switch-drag-scale-y       Thumb squash while pressed or dragged.
 *                                      Default: 0.88
 *  --kakao-switch-overdrag-scale-x   Thumb width scale at full overdrag. It
 *                                      widens into the wall, where the clip hides
 *                                      the overlap. Default: 1.5
 *  --kakao-switch-overdrag-scale-y   Thumb height scale at full overdrag. Above
 *                                      1 it fills the track's inner height, so the
 *                                      clip cuts it flat top and bottom. Default: 1.12
 *  --kakao-switch-overdrag-squircle-radius  Corner radius (% of the thumb) of the
 *                                      side facing away from the wall at full
 *                                      overdrag. 50% = round, lower = flatter, more
 *                                      squircle. Default: 28%
 *  --kakao-switch-drag-follow-duration  Smoothing on the squash while a drag
 *                                      is in progress. Default: 80ms
 *
 * ----------------------------------------------------------------------------
 * PUBLIC METHODS
 * ----------------------------------------------------------------------------
 *  setData(items: Array<{name,label,checked,disabled}>): void
 *      Replace the full set of switches. Triggers aria-busy during update.
 *
 *  getData(): Array<{name,label,checked,disabled}>
 *      Returns a deep copy of current switch state.
 *
 *  setChecked(index: number, checked: boolean): void
 *      Programmatically set a single switch's checked state (fires change
 *      event just like a user interaction would).
 *
 *  scrollBy(amount: number): void
 *      Scrolls the internal switch list by `amount` pixels (useful when the
 *      group overflows its container in horizontal orientation).
 *
 *  focusSwitch(index: number): void
 *      Moves roving-tabindex focus to the switch at `index`.
 *
 * Methods called before the element is connected to the DOM are queued
 * internally (the `_pending` pattern) and flushed in connectedCallback.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (all `bubbles:true, composed:true` so they cross the Shadow DOM)
 * ----------------------------------------------------------------------------
 *  "switch-change"   detail: { name, index, checked }
 *      Fired whenever a switch is toggled by the user or via setChecked().
 *
 *  "switch-focus"    detail: { name, index }
 *      Fired when keyboard/roving focus moves to a switch.
 *
 *  "group-ready"     detail: { count }
 *      Fired once after the first render completes.
 *
 *  "switch-drag-start"  detail: { name, index, checked }
 *      Fired when a press on a switch turns into a drag (after a few pixels of
 *      movement). Plain taps do not fire it.
 *
 *  "switch-drag"     detail: { name, index, progress, overdrag }
 *      Fired on every pointer move while dragging. progress runs from 0 (thumb
 *      at the off end) to 1 (thumb at the on end). overdrag is 0 while the
 *      pointer is within the track, and eases towards -1 (past the off end)
 *      or +1 (past the on end) the further the pointer goes beyond it.
 *
 *  "switch-drag-end" detail: { name, index, checked, changed, cancelled }
 *      Fired when the drag is released or cancelled. If the state changed,
 *      "switch-change" fires first.
 *
 *  "switch-request"  detail: { name, index, checked, waitUntil(promise) }
 *      Only with the async attribute. Fired before a user toggle is applied.
 *      Call waitUntil() synchronously in the listener to make the toggle wait
 *      for the promise. preventDefault() cancels the toggle.
 *
 *  "switch-error"    detail: { name, index, checked, error }
 *      Only with the async attribute: the promise rejected and the switch is
 *      returning to its previous state. checked is the state that was refused.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY NOTES
 * ----------------------------------------------------------------------------
 *  - Each switch uses role="switch" with aria-checked reflecting state.
 *  - The group container uses role="group" with aria-label.
 *  - Roving tabindex: exactly one switch has tabindex="0" at a time; all
 *    others have tabindex="-1". Arrow keys (Left/Right/Up/Down) move focus
 *    and wrap around; Home/End jump to first/last.
 *  - aria-posinset / aria-setsize are set on every switch.
 *  - aria-busy="true" is set on the group while setData() is processing.
 *  - :host([disabled]) drives disabled visuals and blocks pointer/keyboard
 *    interaction; aria-disabled is reflected on the host element itself.
 *  - All interactive elements get a visible focus-visible outline.
 *  - Dragging is a pointer-only enhancement. Every action stays available from
 *    the keyboard (Space/Enter) and via assistive-technology activation. While
 *    thumb-drag is on, tracks use touch-action: pan-y, so horizontal gestures
 *    drive the thumb and vertical gestures still scroll the page.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-switch-group';

  /** Pointer travel (px) before a press counts as a drag; below it, it is a tap. */
  const DRAG_THRESHOLD_PX = 4;
  /** How long (ms) the click that trails a handled pointer gesture is ignored. */
  const TRAILING_CLICK_MS = 500;
  /** How long (ms) a failed async toggle shows red with an X before it springs back. */
  const ERROR_HOLD_MS = 700;
  /** How long (ms) a successful async toggle shows its checkmark before the thumb settles. */
  const SUCCESS_HOLD_MS = 650;
  /** Default wait (ms) before an async toggle shows its loader (loading-delay attribute). */
  const DEFAULT_LOADING_DELAY_MS = 300;
  /** Once the loader is visible, it stays at least this long (ms) to avoid a flicker. */
  const MIN_LOADING_MS = 400;
  /**
   * How hard the rubber band resists when dragging past an end, in units of the
   * thumb's travel distance. Higher = the squash builds up more slowly.
   */
  const OVERDRAG_RESISTANCE = 0.75;
  const clamp01 = (n) => Math.min(1, Math.max(0, n));

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
        /* @kakao-settings:start prefix=--kakao-switch- (written by construction.html, edit there) */
        --_track-width: var(--kakao-switch-track-width, 3.25rem);
        --_track-height: var(--kakao-switch-track-height, 1.75rem);
        --_track-radius: var(--kakao-switch-track-radius, 999px);
        --_track-bg-off: var(--kakao-switch-track-bg-off, var(--kakao-color-border, #d1d5db));
        --_track-bg-on: var(--kakao-switch-track-bg-on, var(--kakao-color-primary, #4f46e5));
        --_track-bg-disabled: var(--kakao-switch-track-bg-disabled, var(--kakao-color-subtle, #e5e7eb));
        --_thumb-bg: var(--kakao-switch-thumb-bg, #ffffff);
        --_thumb-size: var(--kakao-switch-thumb-size, 1.35rem);
        --_thumb-shadow: var(--kakao-switch-thumb-shadow, 0 1px 3px rgba(0, 0, 0, 0.3));
        --_gap: var(--kakao-switch-gap, 1rem);
        --_label-color: var(--kakao-switch-label-color, var(--kakao-color-text, #111827));
        --_label-color-on: var(--kakao-switch-label-color-on, var(--_track-bg-on));
        --_track-bg-error: var(--kakao-switch-track-bg-error, var(--kakao-color-danger, #dc2626));
        --_spinner-color: var(--kakao-switch-spinner-color, var(--_track-bg-on));
        --_success-color: var(--kakao-switch-success-color, var(--_track-bg-on));
        --_label-font: var(--kakao-switch-label-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_focus-color: var(--kakao-switch-focus-color, var(--kakao-color-focus, #2563eb));
        --_anim-duration: var(--kakao-switch-anim-duration, var(--kakao-motion-duration, 320ms));
        --_anim-easing: var(--kakao-switch-anim-easing, var(--kakao-ease-spring, cubic-bezier(.5, 1.8, .4, 1)));
        --_thumb-inset: var(--kakao-switch-thumb-inset, 0.2rem);
        --_item-gap: var(--kakao-switch-item-gap, 0.6rem);
        --_group-padding: var(--kakao-switch-group-padding, 0.25rem);
        --_focus-width: var(--kakao-switch-focus-width, 2px);
        --_focus-offset: var(--kakao-switch-focus-offset, 2px);
        --_disabled-opacity: var(--kakao-switch-disabled-opacity, 0.55);
        --_drag-scale-x: var(--kakao-switch-drag-scale-x, 1.2);
        --_drag-scale-y: var(--kakao-switch-drag-scale-y, 0.88);
        --_drag-follow-duration: var(--kakao-switch-drag-follow-duration, 80ms);
        --_overdrag-scale-x: var(--kakao-switch-overdrag-scale-x, 1.5);
        --_overdrag-scale-y: var(--kakao-switch-overdrag-scale-y, 1.12);
        --_overdrag-squircle-radius: var(--kakao-switch-overdrag-squircle-radius, 20%);
        /* @kakao-settings:end */
        display: block;
        font: var(--_label-font);
      }

      :host([disabled]) {
        opacity: var(--_disabled-opacity);
        cursor: not-allowed;
      }

      .group {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: var(--_gap);
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: thin;
        padding: var(--_group-padding);
      }

      .group[data-orientation="vertical"] {
        flex-direction: column;
        overflow-x: hidden;
        overflow-y: auto;
      }

      .item {
        display: inline-flex;
        align-items: center;
        gap: var(--_item-gap);
        cursor: pointer;
        user-select: none;
        flex-shrink: 0;
      }

      :host([disabled]) .item,
      .item[data-item-disabled="true"] {
        cursor: not-allowed;
      }

      .label {
        color: var(--_label-color);
        font: var(--_label-font);
        white-space: nowrap;
        transition: color var(--_anim-duration) ease;
      }

      /* Opt-in (color-labels attribute): a checked switch colours its label too. */
      .group[data-color-labels="true"] .track[aria-checked="true"]:not([aria-disabled="true"]) + .label {
        color: var(--_label-color-on);
      }

      .track {
        position: relative;
        width: var(--_track-width);
        height: var(--_track-height);
        background: var(--_track-bg-off);
        border-radius: var(--_track-radius);
        border: none;
        padding: 0;
        flex-shrink: 0;
        /* Private: 0 = thumb at the off end, 1 = at the on end. It positions
           the thumb; the drag gesture overrides it inline while dragging. */
        --_progress: 0;
        /* Private: rubber-band overdrag past an end. --_over is signed (-1 = past
           the off end, +1 = past the on end), --_over-abs is its magnitude. */
        --_over: 0;
        --_over-abs: 0;
        /* Colour takes the standard curve; the spring is for the thumb's move. */
        transition: background-color var(--_anim-duration) var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1));
      }

      .track[aria-checked="true"] {
        --_progress: 1;
        background: var(--_track-bg-on);
      }

      .track[aria-disabled="true"] {
        background: var(--_track-bg-disabled);
      }

      .track:focus-visible {
        outline: var(--_focus-width) solid var(--_focus-color);
        outline-offset: var(--_focus-offset);
      }

      /* The clip is the track's inner area: the track shrunk by the inset on every
         side, with the same pill ends. It acts like an inset border in the track's
         own colour laid over the thumb. Whatever part of the thumb would spill into
         the padding (from the squash, the stretch or the spring overshoot) is cut
         off, so the squashed shape of the thumb is formed by the track itself. A
         clip rather than a coloured border means it can never drift out of sync
         with the track colour while that blends, and it works with any theme. */
      .clip {
        position: absolute;
        /* Half a pixel of vertical slack: the thumb is exactly as tall as the inner
           area, so without it subpixel rounding can shave its top or bottom at rest.
           The overdrag squash (scale-y above 1) still gets cut flat. */
        inset: calc(var(--_thumb-inset) - 0.5px) var(--_thumb-inset);
        overflow: hidden;
        border-radius: calc(var(--_track-radius) - var(--_thumb-inset));
      }

      .thumb {
        position: absolute;
        top: 50%;
        /* Positioned inside the clip, so 0 is the resting off position and
           (100% - thumb size) the resting on position. */
        left: calc((100% - var(--_thumb-size)) * var(--_progress));
        width: var(--_thumb-size);
        height: var(--_thumb-size);
        background: var(--_thumb-bg);
        /* A full circle at rest. While overdragged, the corners on the side facing
           AWAY from the wall morph from round to a squircle, as if the thumb's
           volume were being pressed into the corner. The wall side stays round;
           it is pushed into the wall and cut off by the clip anyway. */
        --_r-left: calc(50% - (50% - var(--_overdrag-squircle-radius)) * max(var(--_over), 0));
        --_r-right: calc(50% - (50% - var(--_overdrag-squircle-radius)) * max(var(--_over) * -1, 0));
        border-radius: var(--_r-left) var(--_r-right) var(--_r-right) var(--_r-left);
        box-shadow: var(--_thumb-shadow);
        transform: translateY(-50%);
        /* Centre normally; slides to the edge facing away from the wall during
           overdrag. That edge stays put while the thumb widens, so the extra
           width goes into the wall, where the clip hides it. */
        transform-origin: calc(50% - var(--_over) * 50%) 50%;
        transition:
          left var(--_anim-duration) var(--_anim-easing),
          transform var(--_anim-duration) var(--_anim-easing),
          transform-origin var(--_anim-duration) var(--_anim-easing),
          border-radius var(--_anim-duration) var(--_anim-easing);
        will-change: left, transform;
      }

      /* ---- Thumb dragging (on by default, see the thumb-drag attribute) ---- */
      .group[data-thumb-drag="true"] .track:not(:disabled) {
        /* Horizontal gestures belong to the thumb; vertical ones still scroll. */
        touch-action: pan-y;
        cursor: grab;
      }

      .group[data-thumb-drag="true"] .track.is-pressed:not(:disabled) {
        cursor: grabbing;
      }

      /* Pressed: the thumb stretches wide and flat, then springs back on release. */
      .track.is-pressed .thumb {
        transform: translateY(-50%) scale(
          calc(var(--_drag-scale-x) + (var(--_overdrag-scale-x) - var(--_drag-scale-x)) * var(--_over-abs)),
          calc(var(--_drag-scale-y) + (var(--_overdrag-scale-y) - var(--_drag-scale-y)) * var(--_over-abs))
        );
      }

      /* Dragging: position and colour follow the pointer 1:1, with no easing. */
      .track.is-dragging {
        transition: none;
        background: color-mix(
          in srgb,
          var(--_track-bg-on) calc(var(--_progress) * 100%),
          var(--_track-bg-off)
        );
      }

      /* Position is not eased while dragging; only the squash gets a short follow
         so it glides instead of stepping with every pointer move. */
      .track.is-dragging .thumb {
        transition: transform var(--_drag-follow-duration) ease-out;
      }

      /* Squash & stretch keyframes, triggered via a transient class */
      @keyframes kakao-stretch-on {
        0%   { transform: translateY(-50%) scaleX(1)    scaleY(1); }
        35%  { transform: translateY(-50%) scaleX(1.45) scaleY(0.72); }
        65%  { transform: translateY(-50%) scaleX(0.85) scaleY(1.15); }
        100% { transform: translateY(-50%) scaleX(1)    scaleY(1); }
      }

      @keyframes kakao-stretch-off {
        0%   { transform: translateY(-50%) scaleX(1)    scaleY(1); }
        35%  { transform: translateY(-50%) scaleX(1.45) scaleY(0.72); }
        65%  { transform: translateY(-50%) scaleX(0.85) scaleY(1.15); }
        100% { transform: translateY(-50%) scaleX(1)    scaleY(1); }
      }

      .thumb.is-animating-on {
        animation: kakao-stretch-on var(--_anim-duration) var(--_anim-easing);
      }

      .thumb.is-animating-off {
        animation: kakao-stretch-off var(--_anim-duration) var(--_anim-easing);
      }

      .track.is-track-animating {
        animation: kakao-track-pulse var(--_anim-duration) var(--_anim-easing);
      }

      @keyframes kakao-track-pulse {
        0%   { transform: scaleY(1); }
        40%  { transform: scaleY(0.88); }
        100% { transform: scaleY(1); }
      }

      /* ---- Async toggles (see the async attribute) ---- */
      .thumb-icon {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 250ms ease;
      }

      .thumb-icon svg {
        width: 64%;
        height: 64%;
        fill: none;
        stroke-width: 3;
        stroke-linecap: round;
      }

      .thumb-spinner svg {
        stroke: var(--_spinner-color);
        stroke-dasharray: 34 60;
        /* Paused (not removed) outside the loading state, so the ring keeps its angle
           while it fades out instead of snapping back to 0deg. */
        animation: kakao-switch-spin 0.8s linear infinite;
        animation-play-state: paused;
      }

      .thumb-error svg {
        stroke: var(--_track-bg-error);
      }

      /* Success: the checkmark draws itself in, holds, then fades. Its resting state is
         fully drawn, so it stays visible while the opacity fades out. */
      .thumb-success svg {
        stroke: var(--_success-color);
        stroke-dasharray: 16;
        stroke-dashoffset: 0;
      }

      .track.is-success .thumb-success {
        opacity: 1;
      }

      .track.is-success .thumb-success svg {
        animation: kakao-switch-check-draw 300ms cubic-bezier(.34, 1.3, .64, 1);
      }

      @keyframes kakao-switch-check-draw {
        0%   { stroke-dashoffset: 16; transform: scale(0.7); }
        100% { stroke-dashoffset: 0;  transform: scale(1); }
      }

      .track.is-loading .thumb-spinner {
        opacity: 1;
      }

      .track.is-loading .thumb-spinner svg {
        animation-play-state: running;
      }

      .track.is-loading,
      .track.is-success,
      .track.is-error {
        cursor: progress;
      }

      .track.is-error {
        background: var(--_track-bg-error);
      }

      .track.is-error .thumb-error {
        opacity: 1;
      }

      @keyframes kakao-switch-spin {
        to { transform: rotate(360deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        .thumb, .track {
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
    <div class="group" part="group" role="group">
      <span class="visually-hidden" data-empty-msg>No switches configured.</span>
    </div>
  `;

  class KakaoSwitchGroup extends HTMLElement {
    static get observedAttributes() {
      return ['label', 'list-data', 'orientation', 'disabled', 'thumb-drag', 'color-labels'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));

      this._groupEl = shadow.querySelector('.group');
      this._items = []; // [{name,label,checked,disabled}]
      this._connected = false;
      this._pending = []; // queued public-method calls before connectedCallback
      this._resizeObserver = null;
      this._readyFired = false;
      this._drag = null; // state of the active pointer gesture, or null
      this._swallow = null; // { track, until }: ignore the click trailing a pointer gesture
      this._busy = new Set(); // indices of switches waiting on an async toggle

      // Bound handlers so we can remove them later.
      this._onClick = this._onClick.bind(this);
      this._onKeydown = this._onKeydown.bind(this);
      this._onPointerDown = this._onPointerDown.bind(this);
      this._onPointerMove = this._onPointerMove.bind(this);
      this._onPointerUp = this._onPointerUp.bind(this);
      this._onPointerCancel = this._onPointerCancel.bind(this);
      this._onLostPointerCapture = this._onLostPointerCapture.bind(this);
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      this._connected = true;

      if (!this.hasAttribute('role')) {
        // host itself doesn't need a role; the inner .group carries it.
      }

      this._groupEl.addEventListener('click', this._onClick);
      this._groupEl.addEventListener('keydown', this._onKeydown);
      this._groupEl.addEventListener('pointerdown', this._onPointerDown);
      this._groupEl.addEventListener('pointermove', this._onPointerMove);
      this._groupEl.addEventListener('pointerup', this._onPointerUp);
      this._groupEl.addEventListener('pointercancel', this._onPointerCancel);
      this._groupEl.addEventListener('lostpointercapture', this._onLostPointerCapture);

      this._resizeObserver = new ResizeObserver((entries) => {
        this._handleResize(entries);
      });
      this._resizeObserver.observe(this);

      // Sync from attributes present at connect time.
      this._syncThumbDrag();
      this._syncColorLabels();
      this._syncLabel();
      this._syncOrientation();
      this._syncDisabled();
      this._syncListDataFromAttribute();

      // Flush any method calls that arrived before we were connected.
      while (this._pending.length) {
        const { method, args } = this._pending.shift();
        this[method](...args);
      }

      this._render();

      if (!this._readyFired) {
        this._readyFired = true;
        this._dispatch('group-ready', { count: this._items.length });
      }
    }

    disconnectedCallback() {
      this._connected = false;
      this._groupEl.removeEventListener('click', this._onClick);
      this._groupEl.removeEventListener('keydown', this._onKeydown);
      this._groupEl.removeEventListener('pointerdown', this._onPointerDown);
      this._groupEl.removeEventListener('pointermove', this._onPointerMove);
      this._groupEl.removeEventListener('pointerup', this._onPointerUp);
      this._groupEl.removeEventListener('pointercancel', this._onPointerCancel);
      this._groupEl.removeEventListener('lostpointercapture', this._onLostPointerCapture);
      this._abortDrag();
      this._swallow = null;

      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;

      // If we're not connected yet, defer real work to connectedCallback,
      // but still keep internal state reasonably in sync for early reads.
      switch (name) {
        case 'label':
          this._syncLabel();
          break;
        case 'orientation':
          this._syncOrientation();
          break;
        case 'disabled':
          this._syncDisabled();
          break;
        case 'thumb-drag':
          this._syncThumbDrag();
          break;
        case 'color-labels':
          this._syncColorLabels();
          break;
        case 'list-data':
          this._syncListDataFromAttribute();
          if (this._connected) this._render();
          break;
      }
    }

    /* -------------------------- Public API -------------------------- */

    /**
     * Replace all switch data. Queued via _pending if called pre-connect.
     * @param {Array<{name:string,label?:string,checked?:boolean,disabled?:boolean}>} items
     */
    setData(items) {
      if (!this._connected) {
        this._pending.push({ method: 'setData', args: [items] });
        return;
      }
      this.setAttribute('aria-busy', 'true');
      // Simulate microtask boundary so aria-busy is observable for async UIs.
      Promise.resolve().then(() => {
        this._items = this._normalizeItems(items);
        this._render();
        this.removeAttribute('aria-busy');
      });
    }

    /**
     * @returns {Array<{name:string,label:string,checked:boolean,disabled:boolean}>}
     */
    getData() {
      return JSON.parse(JSON.stringify(this._items));
    }

    /**
     * @param {number} index
     * @param {boolean} checked
     */
    setChecked(index, checked) {
      if (!this._connected) {
        this._pending.push({ method: 'setChecked', args: [index, checked] });
        return;
      }
      const item = this._items[index];
      if (!item || item.disabled || this.disabled) return;
      this._toggle(index, !!checked, /* animate */ true);
    }

    /**
     * @param {number} amount pixels to scroll the switch list by.
     */
    scrollBy(amount) {
      if (!this._connected) {
        this._pending.push({ method: 'scrollBy', args: [amount] });
        return;
      }
      this._groupEl.scrollBy({
        left: this._orientation === 'vertical' ? 0 : amount,
        top: this._orientation === 'vertical' ? amount : 0,
        behavior: 'smooth',
      });
    }

    /**
     * @param {number} index
     */
    focusSwitch(index) {
      if (!this._connected) {
        this._pending.push({ method: 'focusSwitch', args: [index] });
        return;
      }
      this._moveRovingFocus(index, /* fromKeyboard */ false);
    }

    /* -------------------------- Attribute reflection -------------------------- */

    get disabled() {
      return this.hasAttribute('disabled');
    }
    set disabled(val) {
      if (val) this.setAttribute('disabled', '');
      else this.removeAttribute('disabled');
    }

    get orientation() {
      return this._orientation || 'horizontal';
    }
    set orientation(val) {
      this.setAttribute('orientation', val);
    }

    /** Whether the thumb can be dragged. Default true; thumb-drag="false" turns it off. */
    get thumbDrag() {
      const raw = this.getAttribute('thumb-drag');
      if (raw === null) return true;
      return !['false', 'off', '0', 'no'].includes(raw.trim().toLowerCase());
    }
    set thumbDrag(val) {
      this.setAttribute('thumb-drag', val ? 'true' : 'false');
    }

    /** Whether user toggles wait for a promise (see switch-request). Default false; opt in with async. */
    /** Milliseconds before an async toggle shows its loader. Default 300; 0 shows it at once. */
    get loadingDelay() {
      const n = parseInt(this.getAttribute('loading-delay'), 10);
      return Number.isFinite(n) && n >= 0 ? n : DEFAULT_LOADING_DELAY_MS;
    }
    set loadingDelay(val) {
      this.setAttribute('loading-delay', String(val));
    }

    get async() {
      const raw = this.getAttribute('async');
      if (raw === null) return false;
      return !['false', 'off', '0', 'no'].includes(raw.trim().toLowerCase());
    }
    set async(val) {
      if (val) this.setAttribute('async', '');
      else this.removeAttribute('async');
    }

    /** Whether checked switches colour their label. Default false; opt in with color-labels. */
    get colorLabels() {
      const raw = this.getAttribute('color-labels');
      if (raw === null) return false;
      return !['false', 'off', '0', 'no'].includes(raw.trim().toLowerCase());
    }
    set colorLabels(val) {
      if (val) this.setAttribute('color-labels', '');
      else this.removeAttribute('color-labels');
    }

    /* -------------------------- Internal sync helpers -------------------------- */

    _syncLabel() {
      const label = this.getAttribute('label') || 'Switch group';
      this._groupEl.setAttribute('aria-label', label);
    }

    _syncOrientation() {
      const raw = this.getAttribute('orientation');
      this._orientation = raw === 'vertical' ? 'vertical' : 'horizontal';
      this._groupEl.setAttribute('data-orientation', this._orientation);
    }

    _syncThumbDrag() {
      const on = this.thumbDrag;
      this._groupEl.setAttribute('data-thumb-drag', String(on));
      if (!on) this._abortDrag();
    }

    _syncColorLabels() {
      this._groupEl.setAttribute('data-color-labels', String(this.colorLabels));
    }

    _syncDisabled() {
      const isDisabled = this.hasAttribute('disabled');
      this.setAttribute('aria-disabled', String(isDisabled));
      if (isDisabled) {
        // Pull all items out of the tab order while host-disabled.
        this._items.forEach((item) => {});
      }
      if (this._connected) this._render();
    }

    _syncListDataFromAttribute() {
      const raw = this.getAttribute('list-data');
      if (raw == null) return;
      try {
        const parsed = JSON.parse(raw);
        this._items = this._normalizeItems(parsed);
      } catch (err) {
        console.error(`<${TAG_NAME}> failed to parse list-data attribute as JSON:`, err);
        this._items = [];
      }
    }

    _normalizeItems(items) {
      if (!Array.isArray(items)) return [];
      return items.map((raw, i) => ({
        name: raw && raw.name != null ? String(raw.name) : `switch-${i}`,
        label: raw && raw.label != null ? String(raw.label) : (raw && raw.name) || `Switch ${i + 1}`,
        checked: !!(raw && raw.checked),
        disabled: !!(raw && raw.disabled),
      }));
    }

    /* -------------------------- Rendering -------------------------- */

    _render() {
      this._abortDrag(); // the tracks are about to be replaced
      const emptyMsg = this._groupEl.querySelector('[data-empty-msg]');
      this._groupEl.innerHTML = '';

      if (!this._items.length) {
        this._groupEl.appendChild(emptyMsg || document.createTextNode('No switches configured.'));
        return;
      }

      const hostDisabled = this.disabled;
      const focusIndex = this._currentRovingIndex(hostDisabled);

      this._items.forEach((item, index) => {
        const wrapper = document.createElement('label');
        wrapper.className = 'item';
        wrapper.setAttribute('data-index', String(index));
        wrapper.setAttribute('data-item-disabled', String(item.disabled || hostDisabled));

        const track = document.createElement('button');
        track.type = 'button';
        track.className = 'track';
        track.setAttribute('part', 'track');
        track.setAttribute('role', 'switch');
        track.setAttribute('aria-checked', String(item.checked));
        track.setAttribute('aria-disabled', String(item.disabled || hostDisabled));
        track.setAttribute('aria-posinset', String(index + 1));
        track.setAttribute('aria-setsize', String(this._items.length));
        track.setAttribute('aria-label', item.label);
        track.setAttribute('data-index', String(index));
        track.tabIndex = index === focusIndex ? 0 : -1;
        if (item.disabled || hostDisabled) track.disabled = true;

        const thumb = document.createElement('span');
        thumb.className = 'thumb';
        thumb.setAttribute('part', 'thumb');
        // Loader and error icons for async toggles; hidden until the track gets is-loading / is-error.
        thumb.innerHTML =
          '<span class="thumb-icon thumb-spinner" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg></span>' +
          '<span class="thumb-icon thumb-success" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.5 3.5L17 9"/></svg></span>' +
          '<span class="thumb-icon thumb-error" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 8l8 8M16 8l-8 8"/></svg></span>';

        // The clip is the track's inner area (track minus the inset); the thumb
        // lives inside it and is cut off wherever it would enter the padding.
        const clip = document.createElement('span');
        clip.className = 'clip';
        clip.setAttribute('part', 'clip');
        clip.appendChild(thumb);
        track.appendChild(clip);

        const labelSpan = document.createElement('span');
        labelSpan.className = 'label';
        labelSpan.textContent = item.label;

        wrapper.appendChild(track);
        wrapper.appendChild(labelSpan);
        this._groupEl.appendChild(wrapper);
      });
    }

    _currentRovingIndex(hostDisabled) {
      if (hostDisabled) return -1;
      const enabledIndices = this._items
        .map((it, i) => (it.disabled ? -1 : i))
        .filter((i) => i !== -1);
      if (!enabledIndices.length) return -1;
      if (this._lastFocusedIndex != null && enabledIndices.includes(this._lastFocusedIndex)) {
        return this._lastFocusedIndex;
      }
      return enabledIndices[0];
    }

    /* -------------------------- Interaction -------------------------- */

    _onClick(evt) {
      if (this.disabled) return;
      const track = evt.target.closest('.track');
      if (!track || track.disabled) return;

      // A pointer gesture on this track was already handled in pointerup, so
      // the click that follows it must not toggle a second time. Clicks that
      // never came from a pointer (assistive tech, el.click()) still get here.
      const swallow = this._swallow;
      this._swallow = null;
      if (swallow && swallow.track === track && performance.now() < swallow.until) return;

      const index = Number(track.getAttribute('data-index'));
      const item = this._items[index];
      if (!item) return;
      this._requestToggle(index, !item.checked, /* animate */ true);
      // A clicked switch is already where it is wanted; focusing it must not
      // scroll the page (a scripted el.click() would otherwise jump to it).
      this._moveRovingFocus(index, false, /* focusElement */ true, /* preventScroll */ true);
    }

    /* -------------------------- Thumb dragging -------------------------- */

    _onPointerDown(evt) {
      if (this._drag || !this.thumbDrag || this.disabled) return;
      if (!evt.isPrimary) return;
      if (evt.pointerType === 'mouse' && evt.button !== 0) return;

      const track = evt.target.closest('.track');
      if (!track || track.disabled) return;
      const index = Number(track.getAttribute('data-index'));
      if (this._busy.has(index)) return; // waiting on an async toggle
      const item = this._items[index];
      const clip = track.querySelector('.clip');
      const thumb = track.querySelector('.thumb');
      if (!item || item.disabled || !clip || !thumb) return;

      // Work out how many screen pixels the thumb can travel inside the clip,
      // and where it is right now (it may still be mid-animation from a
      // previous toggle). Computed styles give exact, unrounded layout pixels.
      const clipWidth = parseFloat(getComputedStyle(clip).width) || 0;
      const thumbWidth = parseFloat(getComputedStyle(thumb).width) || 0;
      const screenScale = clipWidth ? clip.getBoundingClientRect().width / clipWidth : 1; // ancestor CSS transforms
      const travel = Math.max(1, clipWidth - thumbWidth);
      const leftNow = parseFloat(getComputedStyle(thumb).left);
      const startProgress = Number.isFinite(leftNow)
        ? clamp01(leftNow / travel)
        : (item.checked ? 1 : 0);

      this._drag = {
        pointerId: evt.pointerId,
        index,
        track,
        startX: evt.clientX,
        startProgress,
        progress: startProgress,
        travelPx: travel * screenScale,
        moved: false,
      };
      track.classList.add('is-pressed');
      try {
        track.setPointerCapture(evt.pointerId);
      } catch (err) {
        /* capture unsupported or the pointer is already gone: dragging still works inside the track */
      }
      // Keep the roving tabindex on the pressed switch. The browser focuses the
      // button itself on press, without the focus-visible ring a script focus() can add.
      this._moveRovingFocus(index, false, /* focusElement */ false);
    }

    _onPointerMove(evt) {
      const d = this._drag;
      if (!d || evt.pointerId !== d.pointerId) return;

      const dx = evt.clientX - d.startX;
      const item = this._items[d.index];
      if (!item) return;

      if (!d.moved) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
        d.moved = true;
        d.track.classList.add('is-dragging');
        this._dispatch('switch-drag-start', { name: item.name, index: d.index, checked: item.checked });
      }

      // The thumb stops at the ends, but the pointer may keep going. Everything
      // past an end turns into a rubber-band squash that eases towards a limit.
      const raw = d.startProgress + dx / d.travelPx;
      d.progress = clamp01(raw);
      const excess = raw > 1 ? raw - 1 : raw < 0 ? raw : 0; // signed, in units of travel
      const overdrag = Math.sign(excess) * (1 - Math.exp(-Math.abs(excess) / OVERDRAG_RESISTANCE));

      const style = d.track.style;
      style.setProperty('--_progress', String(d.progress));
      style.setProperty('--_over', overdrag.toFixed(4));
      style.setProperty('--_over-abs', Math.abs(overdrag).toFixed(4));
      this._dispatch('switch-drag', { name: item.name, index: d.index, progress: d.progress, overdrag });
    }

    _onPointerUp(evt) {
      if (this._drag && evt.pointerId === this._drag.pointerId) this._finishDrag(false);
    }

    _onPointerCancel(evt) {
      if (this._drag && evt.pointerId === this._drag.pointerId) this._finishDrag(true);
    }

    _onLostPointerCapture(evt) {
      // Normal releases end the drag in pointerup first, so reaching this with a
      // live drag means the capture was taken away (e.g. the element was removed).
      if (this._drag && evt.pointerId === this._drag.pointerId) this._finishDrag(true);
    }

    /**
     * Ends the active gesture. A tap toggles the switch; a drag commits to the
     * nearer end. Either way the thumb then springs to its final position via
     * the normal CSS transition, which is where the squash and stretch comes from.
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

      const item = this._items[d.index];
      if (!item) return;

      if (cancelled) {
        if (d.moved) {
          this._dispatch('switch-drag-end', {
            name: item.name, index: d.index, checked: item.checked, changed: false, cancelled: true,
          });
        }
        return;
      }

      const next = d.moved ? d.progress >= 0.5 : !item.checked;
      const changed = next !== item.checked;
      if (changed) this._requestToggle(d.index, next, /* animate */ false); // the release spring is the animation
      if (d.moved) {
        this._dispatch('switch-drag-end', {
          name: item.name, index: d.index, checked: next, changed, cancelled: false,
        });
      }
      this._swallow = { track: d.track, until: performance.now() + TRAILING_CLICK_MS };
    }

    /** Removes the inline values the drag wrote, so the CSS state takes over (and springs the thumb back). */
    _clearDragStyle(track) {
      track.style.removeProperty('--_progress');
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
    }

    _onKeydown(evt) {
      if (this.disabled) return;
      const track = evt.target.closest('.track');
      if (!track) return;
      const index = Number(track.getAttribute('data-index'));

      const enabledIndices = this._items
        .map((it, i) => (it.disabled ? -1 : i))
        .filter((i) => i !== -1);
      if (!enabledIndices.length) return;

      const currentPos = enabledIndices.indexOf(index);

      const moveTo = (pos) => {
        const wrapped = ((pos % enabledIndices.length) + enabledIndices.length) % enabledIndices.length;
        this._moveRovingFocus(enabledIndices[wrapped], true);
      };

      switch (evt.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          evt.preventDefault();
          moveTo(currentPos + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          evt.preventDefault();
          moveTo(currentPos - 1);
          break;
        case 'Home':
          evt.preventDefault();
          moveTo(0);
          break;
        case 'End':
          evt.preventDefault();
          moveTo(enabledIndices.length - 1);
          break;
        case ' ':
        case 'Enter':
          evt.preventDefault();
          if (!track.disabled) {
            const item = this._items[index];
            this._requestToggle(index, !item.checked, true);
          }
          break;
        default:
          break;
      }
    }

    /**
     * Moves the roving tabindex (and, unless told otherwise, real focus) to a switch.
     * @param {number} index
     * @param {boolean} fromKeyboard
     * @param {boolean} [focusElement=true] false = only update tabindex and fire the event
     * @param {boolean} [preventScroll=false] true = focus without scrolling it into view
     */
    _moveRovingFocus(index, fromKeyboard, focusElement = true, preventScroll = false) {
      this._lastFocusedIndex = index;
      const tracks = this._groupEl.querySelectorAll('.track');
      tracks.forEach((t) => {
        const i = Number(t.getAttribute('data-index'));
        t.tabIndex = i === index ? 0 : -1;
      });
      const target = this._groupEl.querySelector(`.track[data-index="${index}"]`);
      if (target && focusElement) target.focus({ preventScroll });
      const item = this._items[index];
      if (item) {
        this._dispatch('switch-focus', { name: item.name, index });
      }
    }

    _toggle(index, checked, animate) {
      const item = this._items[index];
      if (!item) return;
      item.checked = checked;
      this._moveTrack(index, checked, animate);
      this._dispatch('switch-change', { name: item.name, index, checked });
    }

    /**
     * Entry point for user toggles (click, keyboard, drag release). Without the
     * async attribute it toggles straight away; with it, a listener can hand a
     * promise to switch-request's waitUntil() and the toggle waits for it.
     */
    _requestToggle(index, checked, animate) {
      const item = this._items[index];
      if (!item || this._busy.has(index)) return;
      if (!this.async) {
        this._toggle(index, checked, animate);
        return;
      }

      let promise = null;
      const request = new CustomEvent('switch-request', {
        detail: { name: item.name, index, checked, waitUntil: (p) => { promise = p; } },
        bubbles: true,
        composed: true,
        cancelable: true,
      });
      this.dispatchEvent(request);
      if (request.defaultPrevented) {
        this._moveTrack(index, item.checked, false); // undo a drag that ended on the other side
        return;
      }
      if (!promise) {
        this._toggle(index, checked, animate);
        return;
      }

      // Pending: the thumb goes to the requested end right away; the committed state stays put.
      this._busy.add(index);
      this._moveTrack(index, checked, animate);

      // The spinner only appears if the request is still running after loading-delay,
      // so fast requests never flash a loader. Once shown, it stays for at least
      // MIN_LOADING_MS so a request finishing just after the delay doesn't flicker.
      let shownAt = null;
      const showLoader = () => {
        shownAt = performance.now();
        this._flagTrack(index, 'is-loading', true);
      };
      const delay = this.loadingDelay;
      const showTimer = delay > 0 ? setTimeout(showLoader, delay) : (showLoader(), null);

      /** Runs finish(loaderWasShown) once the loader (if any) has been visible long enough. */
      const settle = (finish) => {
        clearTimeout(showTimer);
        if (shownAt === null) {
          finish(false);
          return;
        }
        const remaining = Math.max(0, MIN_LOADING_MS - (performance.now() - shownAt));
        setTimeout(() => {
          this._flagTrack(index, 'is-loading', false);
          finish(true);
        }, remaining);
      };

      Promise.resolve(promise).then(
        () => {
          item.checked = checked;
          this._dispatch('switch-change', { name: item.name, index, checked });
          settle((loaderWasShown) => {
            if (!loaderWasShown) {
              this._busy.delete(index); // fast: it simply stays, no checkmark needed
              return;
            }
            this._flagTrack(index, 'is-success', true);
            setTimeout(() => {
              this._flagTrack(index, 'is-success', false); // the check fades, the thumb settles
              this._busy.delete(index);
            }, SUCCESS_HOLD_MS);
          });
        },
        (error) => {
          this._dispatch('switch-error', { name: item.name, index, checked, error });
          // A failure is always shown, however fast it came back.
          settle(() => {
            this._flagTrack(index, 'is-error', true);
            setTimeout(() => {
              this._flagTrack(index, 'is-error', false);
              this._moveTrack(index, item.checked, true); // spring back to the committed state
              this._busy.delete(index);
            }, ERROR_HOLD_MS);
          });
        }
      );
    }

    /** Toggles a state class on a track (it is looked up fresh, a re-render may have replaced it). */
    _flagTrack(index, className, on) {
      const track = this._groupEl.querySelector(`.track[data-index="${index}"]`);
      if (!track) return;
      track.classList.toggle(className, on);
      if (className === 'is-loading') {
        if (on) track.setAttribute('aria-busy', 'true');
        else track.removeAttribute('aria-busy');
      }
    }

    /** Moves a track's thumb to the on/off end, optionally with the squash & stretch keyframes. */
    _moveTrack(index, checked, animate) {
      const track = this._groupEl.querySelector(`.track[data-index="${index}"]`);
      if (track) {
        track.setAttribute('aria-checked', String(checked));
        if (animate) {
          const thumb = track.querySelector('.thumb');
          const animClass = checked ? 'is-animating-on' : 'is-animating-off';
          thumb.classList.remove('is-animating-on', 'is-animating-off');
          track.classList.remove('is-track-animating');
          // Force reflow so the animation restarts reliably.
          void thumb.offsetWidth;
          thumb.classList.add(animClass);
          track.classList.add('is-track-animating');
          const cleanup = () => {
            thumb.classList.remove(animClass);
            track.classList.remove('is-track-animating');
            thumb.removeEventListener('animationend', cleanup);
          };
          thumb.addEventListener('animationend', cleanup);
        }
      }
    }

    /* -------------------------- Misc -------------------------- */

    _handleResize(entries) {
      // React to container size: collapse to vertical stacking automatically
      // when the host becomes too narrow to fit items horizontally, unless
      // the consumer has explicitly forced an orientation via the attribute.
      if (this.hasAttribute('orientation')) return;
      const entry = entries[0];
      if (!entry) return;
      const width = entry.contentRect.width;
      const shouldStack = width > 0 && width < 220;
      this._groupEl.setAttribute('data-orientation', shouldStack ? 'vertical' : 'horizontal');
    }

    _dispatch(eventName, detail) {
      this.dispatchEvent(
        new CustomEvent(eventName, {
          detail,
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, KakaoSwitchGroup);
  }
})();

