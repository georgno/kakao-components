/**
 * <kakao-badge>
 * ============================================================================
 * A small pill-shaped status label: "New", "Proposed", "Missing". Not
 * interactive: it never takes focus and is read as plain text. Vanilla JS,
 * Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="badge.js"><\/script>
 *
 *   <kakao-badge>Draft</kakao-badge>
 *   <kakao-badge tone="success">Yes</kakao-badge>
 *   <kakao-badge tone="primary">Proposed</kakao-badge>
 *   <kakao-badge outline>Missing</kakao-badge>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  tone      neutral (default) · primary · success · danger · ink
 *  outline   Hairline border, muted text, no fill (ignores tone).
 *
 *  Soft tones (primary, success, danger) tint the surface with the tone colour
 *  and pull the text towards the theme's text colour, so they stay readable in
 *  every theme. Write the text in sentence case; it is never transformed.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-badge-radius / -padding-y / -padding-x / -font-size / -font-weight
 *  --kakao-badge-tint        how much tone colour goes into the fill
 *  --kakao-badge-text-mix    how much tone colour goes into the text
 *  --kakao-badge-neutral-bg / -neutral-text / -outline-border / -outline-text
 *  --kakao-badge-primary / -success / -danger / -ink / -on-ink
 *
 * Part: badge.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-badge';
  if (customElements.get(TAG_NAME)) return;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-badge- (written by construction.html, edit there) */
        --_radius: var(--kakao-badge-radius, 999px);
        --_padding-y: var(--kakao-badge-padding-y, 0.05rem);
        --_padding-x: var(--kakao-badge-padding-x, 0.5rem);
        --_font-size: var(--kakao-badge-font-size, 0.75rem);
        --_font-weight: var(--kakao-badge-font-weight, 600);
        --_tint: var(--kakao-badge-tint, 16%);
        --_text-mix: var(--kakao-badge-text-mix, 72%);
        --_surface: var(--kakao-badge-surface, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-badge-text, var(--kakao-color-text, #18181b));
        --_neutral-bg: var(--kakao-badge-neutral-bg, var(--kakao-color-subtle-strong, #e6e6e8));
        --_neutral-text: var(--kakao-badge-neutral-text, var(--kakao-color-text, #18181b));
        --_outline-border: var(--kakao-badge-outline-border, var(--kakao-color-line, #e5e7eb));
        --_outline-text: var(--kakao-badge-outline-text, var(--kakao-color-muted, #62626c));
        --_primary: var(--kakao-badge-primary, var(--kakao-color-primary, #4f46e5));
        --_success: var(--kakao-badge-success, var(--kakao-color-success, #15803d));
        --_danger: var(--kakao-badge-danger, var(--kakao-color-danger, #dc2626));
        --_ink: var(--kakao-badge-ink, var(--kakao-color-ink, #18181b));
        --_on-ink: var(--kakao-badge-on-ink, var(--kakao-color-on-ink, #fafafa));
        /* @kakao-settings:end */
        display: inline-block;
        vertical-align: 0.1em;
        max-width: 100%;
      }
      :host([hidden]) { display: none; }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.3em;
        box-sizing: border-box;
        max-width: 100%;
        padding: var(--_padding-y) var(--_padding-x);
        border: 1px solid transparent;
        border-radius: var(--_radius);
        background: var(--_neutral-bg);
        color: var(--_neutral-text);
        font-family: inherit;
        font-size: var(--_font-size);
        font-weight: var(--_font-weight);
        line-height: 1.45;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host([tone="primary"]) { --_tone: var(--_primary); }
      :host([tone="success"]) { --_tone: var(--_success); }
      :host([tone="danger"])  { --_tone: var(--_danger); }
      :host(:is([tone="primary"], [tone="success"], [tone="danger"])) .badge {
        background: color-mix(in srgb, var(--_tone) var(--_tint), var(--_surface));
        color: color-mix(in srgb, var(--_tone) var(--_text-mix), var(--_text));
      }
      :host([tone="ink"]) .badge {
        background: var(--_ink);
        color: var(--_on-ink);
      }
      :host([outline]) .badge {
        background: transparent;
        border-color: var(--_outline-border);
        color: var(--_outline-text);
      }

      @media (forced-colors: active) {
        .badge { border-color: CanvasText; }
      }
    </style>
    <span class="badge" part="badge"><slot></slot></span>
  `;

  class KakaoBadge extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).appendChild(TEMPLATE.content.cloneNode(true));
    }
  }

  customElements.define(TAG_NAME, KakaoBadge);
})();
