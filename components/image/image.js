/**
 * <kakao-image>
 * ============================================================================
 * An image that keeps its place while it loads: a skeleton of the image's
 * size until the file is there, then the picture fades in. Loads lazily,
 * takes the alt text and an optional caption below (figure and figcaption).
 * When the file fails, the frame shows a muted icon and the alt text instead.
 * Not interactive. Vanilla JS, Shadow DOM.
 *
 * The placeholder is a <kakao-skeleton shape="block"> in the shadow root, so
 * load components/skeleton/skeleton.js as well. Without it the placeholder is
 * a plain still block and everything else works the same.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     image.js
 *  css        none
 *  requires   skeleton   (load these first, in this order)
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="../skeleton/skeleton.js"><\/script>
 *   <script src="image.js"><\/script>
 *
 *   <kakao-image src="hills.jpg" alt="Hills under a low sun" width="640" height="360"></kakao-image>
 *   <kakao-image src="hills.jpg" alt="Hills under a low sun" ratio="16/9"
 *                caption="The valley in the morning"></kakao-image>
 *   <kakao-image src="hills.jpg" alt="" ratio="1" width="96" radius="999"></kakao-image>
 *   <kakao-image src="hills-800.jpg" srcset="hills-800.jpg 800w, hills-1600.jpg 1600w"
 *                sizes="(min-width: 60rem) 50vw, 100vw" alt="Hills" ratio="3/2">
 *     <span slot="caption">Photo: <a href="/people/ada">Ada</a></span>
 *   </kakao-image>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  src        Image URL. Without it (and without srcset) the skeleton stays:
 *             set src later to load.
 *  alt        The text alternative: what the image shows, for people who
 *             cannot see it. Also shown in the frame when the image fails.
 *             alt="" (or no alt) marks a decorative image that assistive
 *             technology skips; write a real text for every image that
 *             carries meaning.
 *  caption    Text below the image. Content in slot="caption" replaces it.
 *  width      Width of the image: a number is pixels, anything else a CSS
 *             length ("20rem", "50%"). Default: the full width of its place.
 *             Never wider than its place.
 *  height     Height (number or CSS length). Two numbers for width and height
 *             work like on <img>: they give the ratio, and the image scales
 *             down with its place without distortion.
 *  ratio      Aspect ratio of the frame: "16/9", "4:3", "1".
 *             Give width and height, or ratio, so the space is reserved and
 *             the page does not jump when the image arrives. With neither,
 *             the skeleton has the placeholder height from the settings and
 *             the image then takes its own size.
 *  fit        cover (default) · contain. cover: the image fills the frame,
 *             cut where needed. contain: the whole image, with free space
 *             around it.
 *  radius     Corner radius (number or CSS length). Default: the setting.
 *  srcset     Passed on to the <img>.
 *  sizes      Passed on to the <img>.
 *  loading    lazy (default) · eager. lazy: loads when it comes near the
 *             viewport. eager: loads at once (for the image at the top of a
 *             page).
 *  hidden     The native attribute: no image, no space.
 *
 * ----------------------------------------------------------------------------
 * SLOTS
 * ----------------------------------------------------------------------------
 *  caption     Replaces the caption attribute; links and markup allowed.
 *
 * ----------------------------------------------------------------------------
 * PROPERTIES AND METHODS
 * ----------------------------------------------------------------------------
 *  state      (read only) "loading", "loaded" or "error".
 *  reload()   Loads the image again, e.g. after an error.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, cross shadow roots)
 * ----------------------------------------------------------------------------
 *  image-load   the image has loaded and is shown.
 *               detail: { src, currentSrc, naturalWidth, naturalHeight }
 *  image-error  the image failed; the error state is shown. detail: { src }
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  A real <img> with the alt text sits in the shadow root from the start, so
 *  the text is there while the skeleton shows. The skeleton and the error
 *  icon are decoration (aria-hidden). With a caption the whole is a figure
 *  with a figcaption; without one it is just the image. On an error the alt
 *  text is shown and read as plain text. Nothing takes focus: for a linked
 *  image put the element in an <a>.
 *  Reduced motion: no fade (and the skeleton stands still).
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-image-radius
 *  --kakao-image-background          behind the image (seen with fit="contain"
 *                                    and through transparent images)
 *  --kakao-image-placeholder-color   the plain block without kakao-skeleton
 *  --kakao-image-placeholder-height  without height and ratio
 *  --kakao-image-fade-duration
 *  --kakao-image-error-background / -error-color / -error-icon-size / -error-font-size
 *  --kakao-image-caption-color / -caption-size / -caption-gap / -caption-align
 *  The skeleton takes its own --kakao-skeleton-* settings.
 *
 * Parts: figure, frame, image, placeholder, error, caption.
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-image';
  if (customElements.get(TAG_NAME)) return;

  function supports(property, value) {
    return typeof CSS !== 'undefined' && CSS.supports ? CSS.supports(property, value) : true;
  }

  const isNumber = (value) => /^\d*\.?\d+$/.test((value || '').trim());

  /* "240" → "240px"; "12rem", "60%" stay; anything CSS does not take → ''. */
  function parseLength(value, property) {
    const v = (value || '').trim();
    if (!v) return '';
    if (isNumber(v)) return `${v}px`;
    return supports(property, v) ? v : '';
  }

  /* "16/9", "16:9", "1.5" → a CSS aspect-ratio; anything else → ''. */
  function parseRatio(value) {
    const v = (value || '').trim().replace(':', '/');
    if (!/^\d*\.?\d+(\s*\/\s*\d*\.?\d+)?$/.test(v)) return '';
    return supports('aspect-ratio', v) ? v : '';
  }

  /* "0.3s", "300ms" → milliseconds. */
  function parseTime(value) {
    const v = (value || '').split(',')[0].trim();
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return 0;
    return /ms$/.test(v) ? n : n * 1000;
  }

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-image- (written by construction.html, edit there) */
        --_radius: var(--kakao-image-radius, var(--kakao-radius-md, 10px));
        --_background: var(--kakao-image-background, transparent);
        --_placeholder-color: var(--kakao-image-placeholder-color, var(--kakao-color-subtle-strong, #e6e6e8));
        --_placeholder-height: var(--kakao-image-placeholder-height, 12rem);
        --_fade-duration: var(--kakao-image-fade-duration, var(--kakao-motion-duration, 320ms));
        --_error-background: var(--kakao-image-error-background, var(--kakao-color-subtle, #f0f0f1));
        --_error-color: var(--kakao-image-error-color, var(--kakao-color-muted, #62626c));
        --_error-icon-size: var(--kakao-image-error-icon-size, 1.5rem);
        --_error-font-size: var(--kakao-image-error-font-size, 0.875rem);
        --_caption-color: var(--kakao-image-caption-color, var(--kakao-color-muted, #62626c));
        --_caption-size: var(--kakao-image-caption-size, 0.875rem);
        --_caption-gap: var(--kakao-image-caption-gap, 0.5rem);
        --_caption-align: var(--kakao-image-caption-align, start);
        /* @kakao-settings:end */
        display: block;
        min-width: 0;
        max-width: 100%;
      }
      :host([hidden]) { display: none; }

      .figure {
        box-sizing: border-box;
        width: var(--_w, 100%);
        max-width: 100%;
        margin: 0;
      }
      /* No reserved size and no width: once loaded, as wide as the image. */
      .figure[data-state="loaded"]:not([data-reserved]):not([data-width]) { width: fit-content; }

      .frame {
        position: relative;
        overflow: hidden;
        border-radius: var(--_r, var(--_radius));
        background: var(--_background);
      }
      .figure[data-reserved] .frame {
        height: var(--_h, auto);
        aspect-ratio: var(--_ratio, auto);
      }
      .figure:not([data-reserved]):not([data-state="loaded"]) .frame { min-height: var(--_placeholder-height); }

      /* The image fills the frame; without a reserved size it is in the flow
         once it has loaded and gives the frame its height. */
      img {
        display: block;
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: opacity var(--_fade-duration) var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1));
      }
      .figure[data-fit="contain"] img { object-fit: contain; }
      .figure[data-state="loaded"] img { opacity: 1; }
      .figure[data-state="loaded"]:not([data-reserved]) img {
        position: static;
        width: auto;
        max-width: 100%;
        height: auto;
      }
      .figure[data-state="loaded"][data-width]:not([data-reserved]) img { width: 100%; }
      .figure[data-state="error"] img { display: none; }

      /* The placeholder: a kakao-skeleton block that fills the frame. Where
         kakao-skeleton is not loaded, the same element is a plain block. */
      .placeholder {
        display: block;
        position: absolute;
        inset: 0;
        transition: opacity var(--_fade-duration) var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1));
      }
      .figure[data-state="loaded"] .placeholder { opacity: 0; }
      kakao-skeleton {
        display: block;
        position: absolute;
        inset: 0;
      }
      kakao-skeleton::part(skeleton), kakao-skeleton::part(bone) { height: 100%; }
      kakao-skeleton:not(:defined) { background: var(--_placeholder-color); }

      .error {
        position: absolute;
        inset: 0;
        display: grid;
        place-content: center;
        justify-items: center;
        gap: 0.35rem;
        box-sizing: border-box;
        padding: 0.5rem;
        overflow: hidden;
        background: var(--_error-background);
        color: var(--_error-color);
        font-size: var(--_error-font-size);
        line-height: 1.35;
        text-align: center;
      }
      .error svg {
        display: block;
        width: var(--_error-icon-size);
        height: var(--_error-icon-size);
      }
      .error-text {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
        overflow-wrap: anywhere;
      }
      .error-text:empty { display: none; }

      figcaption {
        margin-top: var(--_caption-gap);
        color: var(--_caption-color);
        font-size: var(--_caption-size);
        line-height: 1.45;
        text-align: var(--_caption-align);
        overflow-wrap: anywhere;
      }
      .placeholder[hidden], .error[hidden], figcaption[hidden], .caption-text[hidden] { display: none; }

      /* Reduced motion: the image is simply there. */
      @media (prefers-reduced-motion: reduce) {
        img, .placeholder { transition: none; }
      }

      @media (forced-colors: active) {
        .error { border: 1px solid CanvasText; border-radius: inherit; }
        kakao-skeleton:not(:defined) { forced-color-adjust: none; background: GrayText; opacity: 0.5; }
      }
    </style>
    <figure class="figure" part="figure" role="none" data-state="loading">
      <div class="frame" part="frame">
        <span class="placeholder" part="placeholder" aria-hidden="true"><kakao-skeleton shape="block" radius="0" height="100%"></kakao-skeleton></span>
        <img part="image" alt="" decoding="async" />
        <span class="error" part="error" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 13V6a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 6v12A1.5 1.5 0 0 0 5 19.5h8"/><path d="m3.5 15.5 4.5-4.5 5.5 5.5"/><circle cx="15" cy="9" r="1.5"/><path d="m16.5 16.5 4 4m0-4-4 4"/></svg>
          <span class="error-text"></span>
        </span>
      </div>
      <figcaption part="caption" hidden><span class="caption-text"></span><slot name="caption"></slot></figcaption>
    </figure>
  `;

  class KakaoImage extends HTMLElement {
    static get observedAttributes() {
      return ['src', 'alt', 'caption', 'width', 'height', 'ratio', 'fit', 'radius', 'srcset', 'sizes', 'loading'];
    }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.appendChild(TEMPLATE.content.cloneNode(true));
      this._figure = root.querySelector('.figure');
      this._frame = root.querySelector('.frame');
      this._placeholder = root.querySelector('.placeholder');
      this._img = root.querySelector('img');
      this._error = root.querySelector('.error');
      this._errorText = root.querySelector('.error-text');
      this._caption = root.querySelector('figcaption');
      this._captionText = root.querySelector('.caption-text');
      this._captionSlot = root.querySelector('slot[name="caption"]');
      this._state = 'loading';
      this._key = null;
      this._hideTimer = 0;

      this._img.addEventListener('load', () => {
        if (!this._hasSource()) return;
        this._setState('loaded');
        this._emit('image-load', {
          currentSrc: this._img.currentSrc || '',
          naturalWidth: this._img.naturalWidth,
          naturalHeight: this._img.naturalHeight,
        });
      });
      this._img.addEventListener('error', () => {
        if (!this._hasSource()) return;
        this._setState('error');
        this._emit('image-error');
      });
      this._captionSlot.addEventListener('slotchange', () => this._renderCaption());
    }

    connectedCallback() {
      this._renderSize();
      this._renderAlt();
      this._renderCaption();
      this._renderSource();
    }

    disconnectedCallback() {
      clearTimeout(this._hideTimer);
      if (this._state === 'loaded') this._placeholder.hidden = true;
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || oldValue === newValue) return;
      if (name === 'alt') this._renderAlt();
      else if (name === 'caption') this._renderCaption();
      else if (name === 'src' || name === 'srcset' || name === 'sizes') this._renderSource();
      else if (name === 'loading') this._img.loading = this._loading();
      else this._renderSize();
    }

    /** "loading", "loaded" or "error". */
    get state() {
      return this._state;
    }

    /** Loads the image again, e.g. after an error. */
    reload() {
      this._key = null;
      if (this.isConnected) this._renderSource();
    }

    _loading() {
      return (this.getAttribute('loading') || '').trim().toLowerCase() === 'eager' ? 'eager' : 'lazy';
    }

    _hasSource() {
      return this._img.hasAttribute('src') || this._img.hasAttribute('srcset');
    }

    _emit(type, detail) {
      this.dispatchEvent(new CustomEvent(type, {
        bubbles: true,
        composed: true,
        detail: { src: this.getAttribute('src') || '', ...detail },
      }));
    }

    _setState(state) {
      clearTimeout(this._hideTimer);
      this._state = state;
      this._figure.setAttribute('data-state', state);
      this._error.hidden = state !== 'error';
      if (state === 'loading') {
        this._placeholder.hidden = false;
      } else if (state === 'error') {
        this._placeholder.hidden = true;
      } else {
        // The skeleton leaves once the fade is over (at once without a fade).
        const fade = parseTime(getComputedStyle(this._img).transitionDuration);
        if (fade > 0) this._hideTimer = setTimeout(() => { this._placeholder.hidden = true; }, fade + 50);
        else this._placeholder.hidden = true;
      }
    }

    /* Sizes from the attributes; an empty value falls back to the settings. */
    _renderSize() {
      const rawWidth = this.getAttribute('width');
      const rawHeight = this.getAttribute('height');
      const width = parseLength(rawWidth, 'width');
      let height = parseLength(rawHeight, 'height');
      let ratio = parseRatio(this.getAttribute('ratio'));
      // Two plain numbers, as on <img>: they give the ratio, the height follows the width.
      if (!ratio && isNumber(rawWidth) && isNumber(rawHeight) && parseFloat(rawHeight) > 0) {
        ratio = `${rawWidth.trim()} / ${rawHeight.trim()}`;
        height = '';
      }
      const set = (name, value) => (value ? this._figure.style.setProperty(name, value) : this._figure.style.removeProperty(name));
      set('--_w', width);
      set('--_h', height);
      set('--_ratio', ratio);
      set('--_r', parseLength(this.getAttribute('radius'), 'border-radius'));
      this._figure.toggleAttribute('data-width', !!width);
      this._figure.toggleAttribute('data-reserved', !!(height || ratio));
      const fit = (this.getAttribute('fit') || '').trim().toLowerCase();
      this._figure.setAttribute('data-fit', fit === 'contain' ? 'contain' : 'cover');
    }

    _renderAlt() {
      const alt = (this.getAttribute('alt') || '').trim();
      this._img.alt = alt;
      this._errorText.textContent = alt;
      // A decorative image stays silent when it fails, too.
      if (alt) this._error.removeAttribute('aria-hidden');
      else this._error.setAttribute('aria-hidden', 'true');
    }

    /* Slotted content replaces the attribute; no caption, no figure. */
    _renderCaption() {
      const text = (this.getAttribute('caption') || '').trim();
      const slotted = this._captionSlot.assignedNodes().some((n) => n.nodeType === 1 || n.textContent.trim());
      this._captionText.textContent = slotted ? '' : text;
      this._captionText.hidden = slotted;
      const has = slotted || !!text;
      this._caption.hidden = !has;
      if (has) this._figure.removeAttribute('role');
      else this._figure.setAttribute('role', 'none');
    }

    _renderSource() {
      const src = (this.getAttribute('src') || '').trim();
      const srcset = (this.getAttribute('srcset') || '').trim();
      const sizes = (this.getAttribute('sizes') || '').trim();
      const key = JSON.stringify([src, srcset, sizes]);
      if (key === this._key) return;
      this._key = key;

      const img = this._img;
      img.removeAttribute('src');
      img.removeAttribute('srcset');
      this._setState('loading');
      if (!src && !srcset) return;
      // loading and sizes first: they decide how the source is fetched.
      img.loading = this._loading();
      if (sizes) img.setAttribute('sizes', sizes); else img.removeAttribute('sizes');
      if (srcset) img.setAttribute('srcset', srcset);
      if (src) img.setAttribute('src', src);
    }
  }

  customElements.define(TAG_NAME, KakaoImage);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }
})();
