/**
 * <kakao-avatar> and <kakao-avatar-group>
 * ============================================================================
 * A person (or a team, a bot) as a small round picture. Shows the image when
 * there is one, the initials of the name while it loads, when there is none
 * or when it fails, and an icon when there is no name either. Optional status
 * dot. Not interactive: it never takes focus; wrap it in a link or a button
 * when it should do something. Vanilla JS, Shadow DOM, no deps.
 *
 * <kakao-avatar-group> lays avatars over each other in a row and shows "+N"
 * for the ones that do not fit.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        A person, team or bot as a picture or initials;
 *             kakao-avatar-group for several.
 *  not for    Logos and pictures: kakao-image.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     avatar.js
 *  css        none
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="avatar.js"><\/script>
 *
 *   <kakao-avatar name="Ada Lovelace" src="ada.jpg"></kakao-avatar>
 *   <kakao-avatar name="Grace Hopper"></kakao-avatar>               initials "GH"
 *   <kakao-avatar name="Grace Hopper" status="online"></kakao-avatar>
 *   <kakao-avatar></kakao-avatar>                                   person glyph
 *   <kakao-avatar name="Build bot" shape="square">
 *     <svg slot="icon" viewBox="0 0 24 24" …></svg>                 own icon
 *   </kakao-avatar>
 *
 *   <kakao-avatar-group max="3" label="Reviewers">
 *     <kakao-avatar name="Ada Lovelace"></kakao-avatar>
 *     <kakao-avatar name="Grace Hopper"></kakao-avatar>
 *     <kakao-avatar name="Alan Turing"></kakao-avatar>
 *     <kakao-avatar name="Edsger Dijkstra"></kakao-avatar>          → "+1"
 *   </kakao-avatar-group>
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES · kakao-avatar
 * ----------------------------------------------------------------------------
 *  src           Image URL. Loaded lazily (loading="lazy"); the fallback is
 *                shown until it has loaded and stays when it fails.
 *  name          Whose avatar it is: the text alternative, the source of the
 *                initials and of the background tone.
 *  initials      Own initials (up to three characters) instead of the derived
 *                ones (first letter of the first and of the last word).
 *  size          xs · sm · md (default) · lg · xl
 *  shape         circle (default) · square. square has rounded corners.
 *  status        online · away · busy · offline: a dot at the lower end corner.
 *                The four differ in shape, not only in colour.
 *  status-label  The status as text for assistive technology. Default
 *                "Online", "Away", "Busy", "Offline".
 *  tone          auto (default) · neutral · primary · success · warning ·
 *                danger. auto picks one of the others, always the same one
 *                for the same name; without a name the tone is neutral.
 *  ring          Draws the ring a group draws, on a single avatar.
 *
 *  Fallback order: image, then an icon in slot="icon" if the page gave one,
 *  then the initials, then the built-in person glyph.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES · kakao-avatar-group
 * ----------------------------------------------------------------------------
 *  max           Show at most this many avatars; the rest becomes "+N".
 *  total         How many there are in all, when the page only renders the
 *                first few: "+N" then counts up to this number.
 *  size          xs · sm · md (default) · lg · xl. As on the avatar; applies
 *                to every avatar in the group.
 *  shape         circle (default) · square. As on the avatar; applies to
 *                every avatar in the group.
 *  label         Names the group (role="group") for assistive technology.
 *  more-label    The text read for "+N". Default "{count} more".
 *
 *  Only <kakao-avatar> children are shown. Later avatars lie over earlier
 *  ones, so a status dot is partly covered: leave status off in a group.
 *
 * ----------------------------------------------------------------------------
 * SLOTS
 * ----------------------------------------------------------------------------
 *  icon          (avatar) an inline SVG in currentColor, shown instead of
 *                initials.
 *  (default)     (group) the avatars.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  avatar-load   the image has loaded and is shown. detail: { src }
 *  avatar-error  the image failed; the fallback stays. detail: { src }
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  With a name the avatar is an image (role="img") named "<name>" or
 *  "<name>, <status>". Without a name it is decorative and hidden, unless it
 *  has a status, which is then its name. Where the name is written next to
 *  the avatar anyway, put aria-hidden="true" on the avatar so it is not read
 *  twice. "+N" is read as "N more".
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-avatar-size / -xs-size / -sm-size / -lg-size / -xl-size
 *  --kakao-avatar-square-radius
 *  --kakao-avatar-font-scale / -icon-scale    share of the avatar's size
 *  --kakao-avatar-font-weight
 *  --kakao-avatar-tint        how much tone colour goes into the fill
 *  --kakao-avatar-text-mix    how much tone colour goes into the initials
 *  --kakao-avatar-surface / -text             what the tone is mixed with
 *  --kakao-avatar-neutral-bg / -neutral-text
 *  --kakao-avatar-primary / -success / -warning / -danger
 *  --kakao-avatar-ring-width / -ring-color    the ring in a group and around
 *                             the status dot: the colour of the surface the
 *                             avatar sits on
 *  --kakao-avatar-dot-scale / -dot-min-size
 *  --kakao-avatar-online / -away / -busy / -offline
 *  --kakao-avatar-group-overlap               share of the size avatars overlap
 *  --kakao-avatar-more-font-scale
 *  --kakao-avatar-fade-duration               the image fading in
 *
 * Parts: avatar, face, initials, icon, image, status (avatar);
 *        group, more (group).
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-avatar';
  const GROUP_TAG_NAME = 'kakao-avatar-group';
  if (customElements.get(TAG_NAME)) return;

  const TONES = ['primary', 'success', 'warning', 'danger', 'neutral'];
  const STATUS_LABELS = { online: 'Online', away: 'Away', busy: 'Busy', offline: 'Offline' };
  const DEFAULT_MORE_LABEL = '{count} more';

  /* One settings block for both elements: the group needs the sizes, the ring
     and the neutral fill too. */
  const SETTINGS = `
        /* @kakao-settings:start prefix=--kakao-avatar- (written by construction.html, edit there) */
        --_size: var(--kakao-avatar-size, 2.5rem);
        --_xs-size: var(--kakao-avatar-xs-size, 1.5rem);
        --_sm-size: var(--kakao-avatar-sm-size, 2rem);
        --_lg-size: var(--kakao-avatar-lg-size, 3rem);
        --_xl-size: var(--kakao-avatar-xl-size, 4rem);
        --_square-radius: var(--kakao-avatar-square-radius, 25%);
        --_font-scale: var(--kakao-avatar-font-scale, 0.4);
        --_font-weight: var(--kakao-avatar-font-weight, 600);
        --_icon-scale: var(--kakao-avatar-icon-scale, 0.6);
        --_tint: var(--kakao-avatar-tint, 16%);
        --_text-mix: var(--kakao-avatar-text-mix, 72%);
        --_surface: var(--kakao-avatar-surface, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-avatar-text, var(--kakao-color-text, #18181b));
        --_neutral-bg: var(--kakao-avatar-neutral-bg, var(--kakao-color-subtle-strong, #e6e6e8));
        --_neutral-text: var(--kakao-avatar-neutral-text, var(--kakao-color-text, #18181b));
        --_primary: var(--kakao-avatar-primary, var(--kakao-color-primary, #4f46e5));
        --_success: var(--kakao-avatar-success, var(--kakao-color-success, #15803d));
        --_warning: var(--kakao-avatar-warning, var(--kakao-color-warning, #b45309));
        --_danger: var(--kakao-avatar-danger, var(--kakao-color-danger, #dc2626));
        --_ring-width: var(--kakao-avatar-ring-width, 2px);
        --_ring-color: var(--kakao-avatar-ring-color, var(--kakao-color-bg, #ffffff));
        --_dot-scale: var(--kakao-avatar-dot-scale, 0.28);
        --_dot-min-size: var(--kakao-avatar-dot-min-size, 8px);
        --_online: var(--kakao-avatar-online, var(--kakao-color-success, #15803d));
        --_away: var(--kakao-avatar-away, var(--kakao-color-warning, #b45309));
        --_busy: var(--kakao-avatar-busy, var(--kakao-color-danger, #dc2626));
        --_offline: var(--kakao-avatar-offline, var(--kakao-color-border, #82828b));
        --_group-overlap: var(--kakao-avatar-group-overlap, 0.16);
        --_more-font-scale: var(--kakao-avatar-more-font-scale, 0.36);
        --_fade-duration: var(--kakao-avatar-fade-duration, 180ms);
        /* @kakao-settings:end */`;

  const SIZES = `
      :host([size="xs"]) { --_size: var(--_xs-size); }
      :host([size="sm"]) { --_size: var(--_sm-size); }
      :host([size="lg"]) { --_size: var(--_lg-size); }
      :host([size="xl"]) { --_size: var(--_xl-size); }`;

  const SR = `
      .sr {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }`;

  /* ------------------------------------------------------------------------
   * Avatar
   * ---------------------------------------------------------------------- */

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {${SETTINGS}
        /* Private switches. A group sets them from outside through ::slotted,
           which wins over this rule. */
        --_ring-on: 0;
        --_radius: 50%;
        --_dot: max(var(--_dot-min-size), calc(var(--_size) * var(--_dot-scale)));
        /* Circle: the dot's centre sits on the edge, at 45 degrees. */
        --_dot-inset-circle: calc(var(--_size) * 0.1464 - var(--_dot) / 2);
        --_dot-inset-square: calc(var(--_dot) * -0.2);
        --_dot-inset: var(--_dot-inset-circle);
        display: inline-block;
        vertical-align: middle;
        line-height: 0;
      }
      :host([hidden]) { display: none; }
      ${SIZES}
      :host([shape="square"]) {
        --_radius: var(--_square-radius);
        --_dot-inset: var(--_dot-inset-square);
      }
      :host([ring]) { --_ring-on: 1; }

      .avatar {
        position: relative;
        display: block;
        width: var(--_size);
        height: var(--_size);
      }

      .face {
        position: relative;
        display: grid;
        place-items: center;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: var(--_radius);
        background: var(--_neutral-bg);
        color: var(--_neutral-text);
        box-shadow: 0 0 0 calc(var(--_ring-width) * var(--_ring-on)) var(--_ring-color);
        font-family: inherit;
        font-size: calc(var(--_size) * var(--_font-scale));
        font-weight: var(--_font-weight);
        line-height: 1;
        letter-spacing: 0.01em;
        white-space: nowrap;
        user-select: none;
      }
      .face[data-tone="primary"] { --_tone: var(--_primary); }
      .face[data-tone="success"] { --_tone: var(--_success); }
      .face[data-tone="warning"] { --_tone: var(--_warning); }
      .face[data-tone="danger"]  { --_tone: var(--_danger); }
      .face:is([data-tone="primary"], [data-tone="success"], [data-tone="warning"], [data-tone="danger"]) {
        background: color-mix(in srgb, var(--_tone) var(--_tint), var(--_surface));
        color: color-mix(in srgb, var(--_tone) var(--_text-mix), var(--_text));
      }

      .initials[hidden], .icon[hidden] { display: none; }
      .icon { display: grid; place-items: center; line-height: 0; }
      .icon svg, .icon ::slotted(*) {
        display: block;
        width: calc(var(--_size) * var(--_icon-scale));
        height: calc(var(--_size) * var(--_icon-scale));
      }

      /* The image lies over the fallback and fades in once it has loaded. It
         stays in the layout meanwhile: a lazy image that is not rendered
         never loads. */
      img {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: opacity var(--_fade-duration) ease-out;
      }
      img[hidden] { display: none; }
      .face[data-loaded] img { opacity: 1; }
      /* A picture with transparent parts: no fallback showing through. */
      .face[data-loaded] { background: var(--_surface); }
      .face[data-loaded] :is(.initials, .icon) { visibility: hidden; }

      .dot {
        position: absolute;
        inset-inline-end: var(--_dot-inset);
        inset-block-end: var(--_dot-inset);
        box-sizing: border-box;
        width: var(--_dot);
        height: var(--_dot);
        border-radius: 50%;
        border: calc(var(--_dot) * 0.22) solid var(--_status);
        background: var(--_status);
        box-shadow: 0 0 0 var(--_ring-width) var(--_ring-color);
      }
      .dot[hidden] { display: none; }
      .dot[data-status="online"]  { --_status: var(--_online); }
      .dot[data-status="away"]    { --_status: var(--_away); }
      .dot[data-status="busy"]    { --_status: var(--_busy); }
      .dot[data-status="offline"] { --_status: var(--_offline); }
      /* Not by colour alone: online is filled, away is half filled, busy
         carries a bar, offline is an empty ring. */
      .dot[data-status="away"] {
        background: linear-gradient(to top, var(--_status) 50%, var(--_ring-color) 50%);
      }
      .dot[data-status="busy"] {
        background: linear-gradient(var(--_ring-color), var(--_ring-color)) center / 100% 28% no-repeat var(--_status);
      }
      .dot[data-status="offline"] { background: var(--_ring-color); }

      @media (prefers-reduced-motion: reduce) {
        img { transition: none; }
      }

      @media (forced-colors: active) {
        .face { border: 1px solid CanvasText; box-shadow: none; }
        .dot { forced-color-adjust: none; --_status: CanvasText; --_ring-color: Canvas; }
      }
    </style>
    <span class="avatar" part="avatar">
      <span class="face" part="face" data-tone="neutral">
        <span class="initials" part="initials" aria-hidden="true" hidden></span>
        <span class="icon" part="icon" aria-hidden="true">
          <slot name="icon">
            <svg viewBox="0 0 24 24" fill="currentColor" focusable="false">
              <circle cx="12" cy="8.2" r="4.2"/>
              <path d="M3.8 21a8.2 8.2 0 0 1 16.4 0c0 .55-.45 1-1 1H4.8c-.55 0-1-.45-1-1Z"/>
            </svg>
          </slot>
        </span>
        <img part="image" alt="" loading="lazy" decoding="async" draggable="false" hidden />
      </span>
      <span class="dot" part="status" aria-hidden="true" hidden></span>
    </span>
  `;

  /* First letter or digit of a word, as one whole character. */
  function firstLetter(word) {
    const match = /[\p{L}\p{N}]/u.exec(word);
    return match ? match[0] : '';
  }

  /* "Ada Lovelace" → "AL", "ada" → "A", "Jean-Luc van Damme" → "JD". */
  function deriveInitials(name) {
    const words = (name || '').trim().split(/\s+/).map(firstLetter).filter(Boolean);
    if (!words.length) return '';
    const letters = words.length === 1 ? [words[0]] : [words[0], words[words.length - 1]];
    return letters.join('').toLocaleUpperCase();
  }

  /* The same name always lands on the same tone (a hash of the trimmed,
     lower-cased name). */
  function toneFor(name) {
    const text = (name || '').trim().toLocaleLowerCase();
    if (!text) return 'neutral';
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    /* A last stir, so names that differ little still spread over the tones. */
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x85ebca6b);
    hash ^= hash >>> 13;
    return TONES[(hash >>> 0) % TONES.length];
  }

  class KakaoAvatar extends HTMLElement {
    static get observedAttributes() {
      return ['src', 'name', 'initials', 'status', 'status-label', 'tone'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).appendChild(TEMPLATE.content.cloneNode(true));
      const root = this.shadowRoot;
      this._avatar = root.querySelector('.avatar');
      this._face = root.querySelector('.face');
      this._initials = root.querySelector('.initials');
      this._icon = root.querySelector('.icon');
      this._iconSlot = root.querySelector('slot[name="icon"]');
      this._img = root.querySelector('img');
      this._dot = root.querySelector('.dot');
      this._shownSrc = null;

      this._img.addEventListener('load', () => {
        if (!this._img.hasAttribute('src')) return;
        this._face.setAttribute('data-loaded', '');
        this._emit('avatar-load');
      });
      this._img.addEventListener('error', () => {
        if (!this._img.hasAttribute('src')) return;
        this._clearImage();
        this._emit('avatar-error');
      });
      this._iconSlot.addEventListener('slotchange', () => this._renderFallback());
    }

    connectedCallback() {
      this._renderImage();
      this._renderFallback();
      this._renderStatus();
    }

    attributeChangedCallback(name) {
      if (!this.isConnected) return;
      if (name === 'src') { this._renderImage(); return; }
      if (name === 'name' || name === 'initials' || name === 'tone') this._renderFallback();
      this._renderStatus();
    }

    _emit(type) {
      this.dispatchEvent(new CustomEvent(type, {
        bubbles: true,
        composed: true,
        detail: { src: this.getAttribute('src') || '' },
      }));
    }

    _clearImage() {
      this._face.removeAttribute('data-loaded');
      this._img.removeAttribute('src');
      this._img.hidden = true;
    }

    _renderImage() {
      const src = (this.getAttribute('src') || '').trim();
      if (src === this._shownSrc) return;
      this._shownSrc = src;
      this._clearImage();
      if (!src) return;
      this._img.hidden = false;
      this._img.setAttribute('src', src);
    }

    _renderFallback() {
      const name = this.getAttribute('name') || '';
      const own = Array.from((this.getAttribute('initials') || '').trim()).slice(0, 3).join('');
      const initials = own || deriveInitials(name);
      const ownIcon = this._iconSlot.assignedElements().length > 0;
      const showInitials = Boolean(initials) && !ownIcon;
      this._initials.textContent = showInitials ? initials : '';
      this._initials.hidden = !showInitials;
      this._icon.hidden = showInitials;

      const tone = (this.getAttribute('tone') || '').trim().toLowerCase();
      this._face.setAttribute('data-tone', TONES.includes(tone) ? tone : toneFor(name));
    }

    /* The status dot and the avatar's name for assistive technology. */
    _renderStatus() {
      const status = (this.getAttribute('status') || '').trim().toLowerCase();
      const known = Object.prototype.hasOwnProperty.call(STATUS_LABELS, status);
      this._dot.hidden = !known;
      if (known) this._dot.setAttribute('data-status', status); else this._dot.removeAttribute('data-status');

      const name = (this.getAttribute('name') || '').trim();
      const statusLabel = known ? ((this.getAttribute('status-label') || '').trim() || STATUS_LABELS[status]) : '';
      const label = [name, statusLabel].filter(Boolean).join(', ');
      if (label) {
        this._avatar.setAttribute('role', 'img');
        this._avatar.setAttribute('aria-label', label);
        this._avatar.removeAttribute('aria-hidden');
      } else {
        this._avatar.removeAttribute('role');
        this._avatar.removeAttribute('aria-label');
        this._avatar.setAttribute('aria-hidden', 'true');
      }
    }
  }

  /* ------------------------------------------------------------------------
   * Group
   * ---------------------------------------------------------------------- */

  const GROUP_TEMPLATE = document.createElement('template');
  GROUP_TEMPLATE.innerHTML = `
    <style>
      :host {${SETTINGS}
        display: inline-block;
        vertical-align: middle;
        max-width: 100%;
        line-height: 0;
      }
      :host([hidden]) { display: none; }
      ${SIZES}

      .group {
        /* Handed to the avatars: slotted elements inherit from their slot. */
        --_group-size: var(--_size);
        --_group-square-radius: var(--_square-radius);
        --_step: calc(var(--_size) * var(--_group-overlap));
        display: inline-flex;
        align-items: center;
        padding: var(--_ring-width);
        padding-inline-start: calc(var(--_ring-width) + var(--_step));
      }
      ::slotted(kakao-avatar), .more {
        flex: none;
        margin-inline-start: calc(var(--_step) * -1);
      }
      ::slotted(kakao-avatar) {
        --_size: var(--_group-size);
        --_ring-on: 1;
      }
      :host([shape="circle"]) ::slotted(kakao-avatar) {
        --_radius: 50%;
        --_dot-inset: var(--_dot-inset-circle);
      }
      :host([shape="square"]) ::slotted(kakao-avatar) {
        --_radius: var(--_group-square-radius);
        --_dot-inset: var(--_dot-inset-square);
      }

      .more {
        position: relative;
        display: grid;
        place-items: center;
        box-sizing: border-box;
        min-width: var(--_size);
        height: var(--_size);
        padding-inline: calc(var(--_size) * 0.14);
        border-radius: calc(var(--_size) / 2);
        background: var(--_neutral-bg);
        color: var(--_neutral-text);
        box-shadow: 0 0 0 var(--_ring-width) var(--_ring-color);
        font-family: inherit;
        font-size: calc(var(--_size) * var(--_more-font-scale));
        font-weight: var(--_font-weight);
        font-variant-numeric: tabular-nums;
        line-height: 1;
        white-space: nowrap;
        user-select: none;
      }
      .more[hidden] { display: none; }
      :host([shape="square"]) .more { border-radius: var(--_group-square-radius); }
      ${SR}

      @media (forced-colors: active) {
        .more { border: 1px solid CanvasText; box-shadow: none; }
      }
    </style>
    <span class="group" part="group">
      <slot></slot>
      <span class="more" part="more" hidden><span class="count" aria-hidden="true"></span><span class="sr"></span></span>
    </span>
  `;

  function positiveInt(value) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  class KakaoAvatarGroup extends HTMLElement {
    static get observedAttributes() {
      return ['max', 'total', 'label', 'more-label'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open', slotAssignment: 'manual' }).appendChild(GROUP_TEMPLATE.content.cloneNode(true));
      const root = this.shadowRoot;
      this._group = root.querySelector('.group');
      this._slot = root.querySelector('slot');
      this._more = root.querySelector('.more');
      this._count = root.querySelector('.count');
      this._sr = root.querySelector('.sr');
      this._observer = new MutationObserver(() => this._render());
    }

    connectedCallback() {
      this._observer.observe(this, { childList: true });
      this._render();
    }

    disconnectedCallback() {
      this._observer.disconnect();
    }

    attributeChangedCallback() {
      if (this.isConnected) this._render();
    }

    /** How many avatars stand behind "+N" (0 when it is not shown). */
    get hiddenCount() {
      return this._hiddenCount || 0;
    }

    _render() {
      const avatars = Array.from(this.children).filter((el) => el.localName === TAG_NAME);
      const max = positiveInt(this.getAttribute('max'));
      const shown = max ? avatars.slice(0, max) : avatars;
      this._slot.assign(...shown);

      const total = Math.max(avatars.length, positiveInt(this.getAttribute('total')));
      const rest = total - shown.length;
      this._hiddenCount = rest;
      this._more.hidden = rest <= 0;
      if (rest > 0) {
        this._count.textContent = rest > 99 ? '99+' : '+' + rest;
        const template = (this.getAttribute('more-label') || '').trim() || DEFAULT_MORE_LABEL;
        this._sr.textContent = template.replace('{count}', String(rest));
      } else {
        this._count.textContent = '';
        this._sr.textContent = '';
      }

      const label = (this.getAttribute('label') || '').trim();
      if (label) {
        this._group.setAttribute('role', 'group');
        this._group.setAttribute('aria-label', label);
      } else {
        this._group.removeAttribute('role');
        this._group.removeAttribute('aria-label');
      }
    }
  }

  customElements.define(TAG_NAME, KakaoAvatar);
  customElements.define(GROUP_TAG_NAME, KakaoAvatarGroup);
})();
