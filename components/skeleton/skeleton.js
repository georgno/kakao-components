/**
 * <kakao-skeleton>
 * ============================================================================
 * A grey placeholder in the shape of content that is still loading: lines of
 * text, a circle for an avatar, a plain block for an image, or a whole card or
 * list row made of those. It keeps the space the content will take, so the
 * page does not jump when the content arrives. Not interactive, and hidden
 * from assistive technology. Vanilla JS, Shadow DOM, no deps.
 *
 * For a load without a shape use <kakao-spinner>; with a known amount
 * <kakao-progress>.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="skeleton.js"><\/script>
 *
 *   <kakao-skeleton></kakao-skeleton>                            one line of text
 *   <kakao-skeleton lines="3"></kakao-skeleton>                  a paragraph, last line shorter
 *   <kakao-skeleton shape="circle" width="48"></kakao-skeleton>  an avatar
 *   <kakao-skeleton shape="block" ratio="16/9"></kakao-skeleton> an image, full width
 *   <kakao-skeleton shape="block" width="240" height="160" radius="0"></kakao-skeleton>
 *   <kakao-skeleton shape="row" avatar count="4"></kakao-skeleton>
 *   <kakao-skeleton shape="card" media avatar></kakao-skeleton>
 *
 *   Swap it for the content when that has loaded: remove the element or set
 *   `hidden`.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  shape      text (default) · circle · block · row · card
 *  lines      Number of text lines (text, row, card). Default 1 for text, 2 for
 *             a row, 3 for a card. With more than one, the last is shorter.
 *  width      Width of the shape: a number is pixels, anything else a CSS
 *             length ("12rem", "60%"). Default: the full width; a circle its
 *             setting.
 *  height     Height of a block (number or CSS length). Without it a block
 *             takes `ratio`, or the block height from the settings.
 *  ratio      Aspect ratio of a block, or of a card's media: "16/9", "4:3", "1".
 *  radius     Corner radius of a block, or of a card's frame (number or CSS
 *             length). Lines and circles keep theirs.
 *  animation  shimmer (default): a light band moves across. pulse: the shapes
 *             fade in and out. none: static.
 *  avatar     Row and card: a circle in front of the title.
 *  media      Card: an image block on top.
 *  count      Row: how many rows, one under the other with a line between.
 *  label      Optional. What is loading, for assistive technology (a status).
 *             Without it the skeleton says nothing at all.
 *  hidden     The native attribute: no skeleton, no space.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  The shapes are decoration: they are aria-hidden and never take focus.
 *  Tell assistive technology about the load once, on the region that is
 *  loading, not on every skeleton: set aria-busy="true" on the container while
 *  the skeletons are in it and take it off when the content is in. Where a
 *  region has no other way to say so, give ONE skeleton a `label`: it then
 *  carries a status (role="status", a polite live region) with that text.
 *  Reduced motion: no shimmer and no pulse, the shapes stand still.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-skeleton-color / -highlight (the shimmer's band)
 *  --kakao-skeleton-radius        of a block
 *  --kakao-skeleton-block-height  of a block without height and ratio
 *  --kakao-skeleton-circle-size
 *  --kakao-skeleton-line-height / -line-gap / -line-radius / -last-line-width
 *  --kakao-skeleton-title-height / -title-width (first line of a row or card)
 *  --kakao-skeleton-row-gap / -row-padding-y / -row-line
 *  --kakao-skeleton-card-background / -card-border / -card-radius / -card-padding / -card-gap
 *  --kakao-skeleton-media-ratio   of a card's media block
 *  --kakao-skeleton-duration      one pass of the shimmer
 *  --kakao-skeleton-pulse-duration / -pulse-opacity
 *
 *  Nesting rule: the media block inside a card takes the card's radius minus
 *  the card's padding (never less than the line radius), so the two corners
 *  sit concentric.
 *
 * Parts: skeleton (the whole), bone (every grey shape), card, row.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-skeleton';
  if (customElements.get(TAG_NAME)) return;

  const SHAPES = ['text', 'circle', 'block', 'row', 'card'];
  const ANIMATIONS = ['shimmer', 'pulse', 'none'];
  const DEFAULT_LINES = { text: 1, row: 2, card: 3 };
  const MAX_LINES = 20;
  const MAX_COUNT = 50;

  function supports(property, value) {
    return typeof CSS !== 'undefined' && CSS.supports ? CSS.supports(property, value) : true;
  }

  /* "240" → "240px"; "12rem", "60%" stay; anything CSS does not take → ''. */
  function parseLength(value, property) {
    const v = (value || '').trim();
    if (!v) return '';
    if (/^\d*\.?\d+$/.test(v)) return `${v}px`;
    return supports(property, v) ? v : '';
  }

  /* "16/9", "16:9", "1.5" → a CSS aspect-ratio; anything else → ''. */
  function parseRatio(value) {
    const v = (value || '').trim().replace(':', '/');
    if (!/^\d*\.?\d+(\s*\/\s*\d*\.?\d+)?$/.test(v)) return '';
    return supports('aspect-ratio', v) ? v : '';
  }

  function parseCount(value, fallback, max) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1) return fallback;
    return Math.min(n, max);
  }

  function el(className, part) {
    const node = document.createElement('span');
    node.className = className;
    if (part) node.setAttribute('part', part);
    return node;
  }

  const bone = (className) => el(`bone ${className}`, 'bone');

  /* n lines; in a row or card the first one is the title. */
  function lines(n, withTitle) {
    const box = el('lines');
    if (n > 1) box.setAttribute('data-many', '');
    for (let i = 0; i < n; i++) {
      box.appendChild(bone(withTitle && i === 0 ? 'line title' : 'line'));
    }
    return box;
  }

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-skeleton- (written by construction.html, edit there) */
        --_color: var(--kakao-skeleton-color, var(--kakao-color-subtle-strong, #e6e6e8));
        --_highlight: var(--kakao-skeleton-highlight, var(--kakao-color-subtle, #f0f0f1));
        --_radius: var(--kakao-skeleton-radius, 10px);
        --_block-height: var(--kakao-skeleton-block-height, 6rem);
        --_circle-size: var(--kakao-skeleton-circle-size, 2.5rem);
        --_line-height: var(--kakao-skeleton-line-height, 0.8em);
        --_line-gap: var(--kakao-skeleton-line-gap, 0.65em);
        --_line-radius: var(--kakao-skeleton-line-radius, 4px);
        --_last-line-width: var(--kakao-skeleton-last-line-width, 60%);
        --_title-height: var(--kakao-skeleton-title-height, 1em);
        --_title-width: var(--kakao-skeleton-title-width, 45%);
        --_row-gap: var(--kakao-skeleton-row-gap, 0.75rem);
        --_row-padding-y: var(--kakao-skeleton-row-padding-y, 0.7rem);
        --_row-line: var(--kakao-skeleton-row-line, var(--kakao-color-line, #e5e7eb));
        --_card-background: var(--kakao-skeleton-card-background, var(--kakao-color-bg, #ffffff));
        --_card-border: var(--kakao-skeleton-card-border, var(--kakao-color-line, #e5e7eb));
        --_card-radius: var(--kakao-skeleton-card-radius, 14px);
        --_card-padding: var(--kakao-skeleton-card-padding, 1.25rem);
        --_card-gap: var(--kakao-skeleton-card-gap, 1rem);
        --_media-ratio: var(--kakao-skeleton-media-ratio, 16 / 9);
        --_duration: var(--kakao-skeleton-duration, 1.6s);
        --_pulse-duration: var(--kakao-skeleton-pulse-duration, 1.4s);
        --_pulse-opacity: var(--kakao-skeleton-pulse-opacity, 0.45);
        /* @kakao-settings:end */
        display: block;
        position: relative;
        min-width: 0;
        max-width: 100%;
      }
      :host([hidden]) { display: none; }
      :host([shape="circle"]) { display: inline-block; vertical-align: middle; }

      span { display: block; box-sizing: border-box; }

      .skeleton { max-width: 100%; }

      /* ---- the grey shape ---- */
      .bone {
        background-color: var(--_color);
        background-repeat: no-repeat;
        background-size: 200% 100%;
      }
      .skeleton[data-animation="shimmer"] .bone {
        background-image: linear-gradient(100deg, transparent 30%, var(--_highlight) 50%, transparent 70%);
        animation: shimmer var(--_duration) linear infinite;
      }
      .skeleton[data-animation="pulse"] .bone {
        animation: pulse var(--_pulse-duration) ease-in-out infinite;
      }

      /* ---- text ---- */
      .lines {
        display: grid;
        gap: var(--_line-gap);
        width: 100%;
        min-width: 0;
      }
      .line {
        width: 100%;
        height: var(--_line-height);
        border-radius: var(--_line-radius);
      }
      .lines[data-many] > .line:last-child { width: var(--_last-line-width); }
      .lines > .title {
        width: var(--_title-width);
        height: var(--_title-height);
      }
      /* On its own a line takes the room of a line of text: bar plus gap. */
      .skeleton[data-shape="text"] {
        width: var(--_w, 100%);
        padding-block: calc(var(--_line-gap) / 2);
      }

      /* ---- circle ---- */
      .circle {
        flex: none;
        width: var(--_circle-size);
        height: var(--_circle-size);
        border-radius: 50%;
      }
      .skeleton[data-shape="circle"] > .circle {
        width: var(--_w, var(--_circle-size));
        height: auto;
        aspect-ratio: 1;
      }

      /* ---- block ---- */
      .block {
        width: var(--_w, 100%);
        max-width: 100%;
        height: var(--_h, var(--_block-height));
        border-radius: var(--_r, var(--_radius));
      }
      .skeleton[data-ratio] > .block {
        height: var(--_h, auto);
        aspect-ratio: var(--_ratio);
      }

      /* ---- list row ---- */
      .skeleton[data-shape="row"] { width: var(--_w, 100%); }
      .row {
        display: flex;
        align-items: center;
        gap: var(--_row-gap);
        padding-block: var(--_row-padding-y);
      }
      .row + .row { border-top: 1px solid var(--_row-line); }

      /* ---- card ---- */
      .card {
        display: grid;
        gap: var(--_card-gap);
        width: var(--_w, 100%);
        max-width: 100%;
        padding: var(--_card-padding);
        background: var(--_card-background);
        border: 1px solid var(--_card-border);
        border-radius: var(--_r, var(--_card-radius));
      }
      /* Nesting rule: inner radius = outer radius − padding. */
      .media {
        width: 100%;
        aspect-ratio: var(--_ratio, var(--_media-ratio));
        border-radius: max(var(--_line-radius), calc(var(--_r, var(--_card-radius)) - var(--_card-padding)));
      }
      .head {
        display: flex;
        align-items: center;
        gap: var(--_row-gap);
      }

      .sr {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      /* The band starts left of the shape and leaves on the right. */
      @keyframes shimmer {
        from { background-position: 150% 0; }
        to { background-position: -50% 0; }
      }
      :host(:dir(rtl)) .skeleton[data-animation="shimmer"] .bone { animation-direction: reverse; }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: var(--_pulse-opacity); }
      }

      /* Reduced motion: the shapes stand still. */
      @media (prefers-reduced-motion: reduce) {
        .skeleton .bone { animation: none !important; background-image: none !important; }
      }

      /* Forced colours drop fills: the shapes are drawn in a system colour. */
      @media (forced-colors: active) {
        .skeleton .bone {
          forced-color-adjust: none;
          background-color: GrayText;
          background-image: none !important;
          animation: none !important;
          opacity: 0.5;
        }
        .card { border-color: CanvasText; }
      }
    </style>
    <span class="skeleton" part="skeleton" aria-hidden="true"></span>
    <span class="sr" role="status"></span>
  `;

  class KakaoSkeleton extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'lines', 'width', 'height', 'ratio', 'radius', 'animation', 'avatar', 'media', 'count', 'label'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).appendChild(TEMPLATE.content.cloneNode(true));
      this._box = this.shadowRoot.querySelector('.skeleton');
      this._sr = this.shadowRoot.querySelector('.sr');
    }

    connectedCallback() {
      this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || oldValue === newValue) return;
      if (name === 'label') this._renderLabel(); else this._render();
    }

    _shape() {
      const shape = (this.getAttribute('shape') || '').trim().toLowerCase();
      return SHAPES.includes(shape) ? shape : 'text';
    }

    _render() {
      const box = this._box;
      const shape = this._shape();
      const animation = (this.getAttribute('animation') || '').trim().toLowerCase();
      box.setAttribute('data-shape', shape);
      box.setAttribute('data-animation', ANIMATIONS.includes(animation) ? animation : 'shimmer');

      /* Sizes from the attributes; an empty value falls back to the settings. */
      const ratio = parseRatio(this.getAttribute('ratio'));
      const set = (name, value) => (value ? box.style.setProperty(name, value) : box.style.removeProperty(name));
      set('--_w', parseLength(this.getAttribute('width'), 'width'));
      set('--_h', parseLength(this.getAttribute('height'), 'height'));
      set('--_r', parseLength(this.getAttribute('radius'), 'border-radius'));
      set('--_ratio', ratio);
      box.toggleAttribute('data-ratio', !!ratio);

      const n = parseCount(this.getAttribute('lines'), DEFAULT_LINES[shape] || 1, MAX_LINES);
      const avatar = this.hasAttribute('avatar');
      const nodes = [];

      if (shape === 'circle') {
        nodes.push(bone('circle'));
      } else if (shape === 'block') {
        nodes.push(bone('block'));
      } else if (shape === 'row') {
        const count = parseCount(this.getAttribute('count'), 1, MAX_COUNT);
        for (let i = 0; i < count; i++) {
          const row = el('row', 'row');
          if (avatar) row.appendChild(bone('circle'));
          row.appendChild(lines(n, true));
          nodes.push(row);
        }
      } else if (shape === 'card') {
        const card = el('card', 'card');
        if (this.hasAttribute('media')) card.appendChild(bone('media'));
        const head = el('head');
        if (avatar) head.appendChild(bone('circle'));
        head.appendChild(lines(1, true));
        card.appendChild(head);
        card.appendChild(lines(n, false));
        nodes.push(card);
      } else {
        nodes.push(lines(n, false));
      }

      box.replaceChildren(...nodes);
      this._renderLabel();
    }

    /* Only a skeleton with a label speaks; the shapes never do. */
    _renderLabel() {
      const label = (this.getAttribute('label') || '').trim();
      if (this._sr.textContent !== label) this._sr.textContent = label;
    }
  }

  customElements.define(TAG_NAME, KakaoSkeleton);
})();
