/**
 * <kakao-file-upload>
 * ============================================================================
 * File picker with a drop area instead of the native button, and a growing list
 * of the selected files. Every pick or drop ADDS to the list, so files can be
 * collected from several folders one after another. Each file gets a thumbnail
 * (a real preview for images, a type icon otherwise) and a remove button.
 * The drop area has a dotted background that follows the pointer.
 * Vanilla JS, Shadow DOM, no dependencies.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="file-upload.js"><\/script>
 *
 *   <form>
 *     <kakao-file-upload name="attachments" label="Attachments"
 *       accept="image/*,.pdf" max-size="5MB" max-files="10"></kakao-file-upload>
 *   </form>
 *
 *   el.addEventListener('files-change', (e) => console.log(e.detail.files));
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  label      Visible label above the drop area. Default "Files".
 *  hint       Small text in the drop area. Default: built from accept/max-size.
 *  accept     Same syntax as <input accept>: ".pdf,image/*,application/json".
 *             Enforced for dropped files too (the file dialog filters by itself).
 *  multiple   Default ON. multiple="false" (also "off", "0", "no") keeps a single
 *             file: a new pick replaces it.
 *  max-files  Maximum number of files in the list. Default: unlimited.
 *  max-size   Maximum size per file: bytes or "500KB", "5MB", "1GB".
 *  disabled   Blocks picking, dropping and removing.
 *  horizontal Boolean. Puts the file list beside the drop area instead of
 *             below it.
 *             Falls back to stacked when the component is narrower than 34rem.
 *  name       Form field name. The element is form-associated: every file is
 *             submitted under this name, and form.reset() clears the list.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API
 * ----------------------------------------------------------------------------
 *  files                     Array<File> currently in the list (read-only copy).
 *  addFiles(fileList)        Add files (FileList or array); same rules as a pick.
 *  removeFile(index)         Remove one file.
 *  clear()                   Remove all files.
 *  open()                    Open the native file dialog.
 *  disabled, multiple        Property mirrors of the attributes.
 *
 *  Calls made before the element is connected are queued and run on connect.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  files-change   { files, added, removed }  after the list changed.
 *  file-reject    { file, name, reason }      a file was not added. reason is
 *                 "type" | "size" | "max-files" | "duplicate" | "folder".
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES
 * ----------------------------------------------------------------------------
 *  Set them on the element or any ancestor. Their defaults live in the
 *  settings block of this file: change them on construction.html (some
 *  follow the main variables in shared/tokens.css).
 *
 *  --kakao-file-upload-accent          #4f46e5   spotlight dots, drag-over, focus
 *  --kakao-file-upload-bg              #ffffff   drop area background
 *  --kakao-file-upload-border          #d1d5db   drop area border
 *  --kakao-file-upload-radius          14px
 *  --kakao-file-upload-min-height      9rem      drop area height
 *  --kakao-file-upload-dot-color       #e5e7eb   resting dots
 *  --kakao-file-upload-dot-size        1px       dot radius
 *  --kakao-file-upload-dot-gap         14px      grid spacing
 *  --kakao-file-upload-spotlight       130px     radius of the pointer spotlight
 *  --kakao-file-upload-spotlight-color           spotlight dots; default: accent 25%
 *                                                mixed into dot-color
 *  --kakao-file-upload-text            #111827
 *  --kakao-file-upload-muted           #6b7280
 *  --kakao-file-upload-error           #dc2626
 *  --kakao-file-upload-font            0.95rem/1.4 --kakao-font-family (else system-ui)
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  - The keyboard control is the "Browse files" button inside the drop area,
 *    named "Browse files for <label>". Clicking anywhere in the area also opens
 *    the dialog; dropping is a pointer-only shortcut.
 *  - That button is a <kakao-button> once the component is loaded. It is created
 *    in the light DOM (slot="button") so the page's button.css styles it; until
 *    then a plain fallback button shows. Put your own element with slot="button"
 *    inside <kakao-file-upload> to replace it.
 *  - Each remove button is labelled "Remove <file name>". After removing, focus
 *    moves to the next remove button (or the drop area when the list is empty).
 *  - The summary line is a polite live region; rejections use role="alert".
 *  - The pointer effects are skipped with prefers-reduced-motion.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-file-upload';
  if (customElements.get(TAG_NAME)) return;

  const FALSEY = ['false', 'off', '0', 'no'];
  /** Duration (ms) of the remove animation before the row leaves the list. */
  const REMOVE_MS = 180;

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const formatBytes = (n) => {
    if (n < 1024) return `${n} B`;
    const units = ['KB', 'MB', 'GB'];
    let v = n / 1024;
    let u = 0;
    while (v >= 1024 && u < units.length - 1) {
      v /= 1024;
      u++;
    }
    return `${v < 10 ? parseFloat(v.toFixed(1)) : Math.round(v)} ${units[u]}`; // 2 MB, 2.4 MB, 24 MB
  };

  /** "5MB" / "500 kb" / "1048576" → bytes; anything else → Infinity (no limit). */
  const parseSize = (raw) => {
    if (raw == null || raw === '') return Infinity;
    const m = String(raw).trim().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i);
    if (!m) return Infinity;
    const mult = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 }[(m[2] || 'b').toLowerCase()];
    return parseFloat(m[1]) * mult;
  };

  const extOf = (name) => {
    const i = name.lastIndexOf('.');
    return i > 0 ? name.slice(i + 1).toLowerCase() : '';
  };

  const CATEGORIES = [
    ['image', /^image\//],
    ['video', /^video\//],
    ['audio', /^audio\//],
    ['pdf', /pdf$/],
    ['archive', /zip|x-7z|x-rar|x-tar|gzip/],
    ['text', /^text\/|json|xml|javascript/],
  ];
  const ARCHIVE_EXT = ['zip', 'rar', '7z', 'tar', 'gz'];

  const categoryOf = (file) => {
    const type = file.type || '';
    for (const [cat, re] of CATEGORIES) if (re.test(type)) return cat;
    if (ARCHIVE_EXT.includes(extOf(file.name))) return 'archive';
    return 'file';
  };

  /** Does the file match an accept list like "image/*,.pdf,application/json"? */
  const matchesAccept = (file, accept) => {
    if (!accept) return true;
    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();
    return accept
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .some((rule) => {
        if (rule.startsWith('.')) return name.endsWith(rule);
        if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
        return type === rule;
      });
  };

  const fileKey = (f) => `${f.name}|${f.size}|${f.lastModified}`;

  const REASON_TEXT = {
    type: 'not an accepted type',
    size: 'too large',
    'max-files': 'over the file limit',
    duplicate: 'already added',
    folder: 'folders can’t be added',
  };

  const ICON_UPLOAD =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>';
  const ICON_DOC =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h6.5L17 7.5V20H7z"/><path d="M13.5 4v3.5H17"/></svg>';
  const ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        /* @kakao-settings:start prefix=--kakao-file-upload- (written by construction.html, edit there) */
        --_accent: var(--kakao-file-upload-accent, var(--kakao-color-primary, #4f46e5));
        --_bg: var(--kakao-file-upload-bg, var(--kakao-color-bg, #ffffff));
        --_border: var(--kakao-file-upload-border, var(--kakao-color-field-border, #ececef));
        --_radius: var(--kakao-file-upload-radius, 14px);
        --_min-height: var(--kakao-file-upload-min-height, 9rem);
        --_dot-color: var(--kakao-file-upload-dot-color, color-mix(in srgb, var(--kakao-color-line, #e5e7eb) 53%, transparent));
        --_dot-size: var(--kakao-file-upload-dot-size, 1px);
        --_dot-gap: var(--kakao-file-upload-dot-gap, 14px);
        --_spotlight: var(--kakao-file-upload-spotlight, 130px);
        --_spotlight-color: var(--kakao-file-upload-spotlight-color, color-mix(in srgb, var(--_accent) 25%, var(--_dot-color)));
        --_text: var(--kakao-file-upload-text, var(--kakao-color-text, #111827));
        --_muted: var(--kakao-file-upload-muted, var(--kakao-color-muted, #6b7280));
        --_error: var(--kakao-file-upload-error, var(--kakao-color-danger, #dc2626));
        --_font: var(--kakao-file-upload-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_disabled-opacity: var(--kakao-file-upload-disabled-opacity, 0.55);
        --_label-gap: var(--kakao-file-upload-label-gap, 0.5rem);
        --_drop-padding: var(--kakao-file-upload-drop-padding, 1.25rem);
        --_drop-border-width: var(--kakao-file-upload-drop-border-width, 1.5px);
        --_drop-border-style: var(--kakao-file-upload-drop-border-style, dashed);
        --_icon-size: var(--kakao-file-upload-icon-size, 2.5rem);
        --_icon-lift: var(--kakao-file-upload-icon-lift, 5px);
        --_drag-spotlight: var(--kakao-file-upload-drag-spotlight, 180px);
        --_list-gap: var(--kakao-file-upload-list-gap, 0.4rem);
        --_item-padding: var(--kakao-file-upload-item-padding, 0.45rem 0.5rem 0.45rem 0.45rem);
        --_item-radius: var(--kakao-file-upload-item-radius, 10px);
        --_thumb-size: var(--kakao-file-upload-thumb-size, 2.5rem);
        --_thumb-radius: var(--kakao-file-upload-thumb-radius, 7px);
        --_type-color: var(--kakao-file-upload-type-color, var(--kakao-color-muted, #6b7280));
        --_type-image: var(--kakao-file-upload-type-image, #0d9488);
        --_type-pdf: var(--kakao-file-upload-type-pdf, #dc2626);
        --_type-video: var(--kakao-file-upload-type-video, #7c3aed);
        --_type-audio: var(--kakao-file-upload-type-audio, #db2777);
        --_type-archive: var(--kakao-file-upload-type-archive, #d97706);
        --_type-text: var(--kakao-file-upload-type-text, #0891b2);
        --_type-tag-text: var(--kakao-file-upload-type-tag-text, #fff);
        /* @kakao-settings:end */
        display: block;
        font: var(--_font);
        color: var(--_text);
      }

      :host([disabled]) { opacity: var(--_disabled-opacity); }

      .label {
        display: block;
        margin-bottom: var(--_label-gap);
        font-weight: 600;
      }

      /* ---- Drop area ---- */
      .drop {
        position: relative;
        isolation: isolate;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        min-height: var(--_min-height);
        padding: var(--_drop-padding);
        text-align: center;
        background: var(--_bg);
        border: var(--_drop-border-width) var(--_drop-border-style) var(--_border);
        border-radius: var(--_radius);
        cursor: pointer;
        outline: none;
        overflow: hidden;
        user-select: none;
        /* Private, written from pointer/drag moves: the pointer position in px. */
        --_mx: 50%;
        --_my: 50%;
        transition: border-color 150ms ease, background-color 150ms ease;
      }

      :host([disabled]) .drop { cursor: not-allowed; }

      /* Two fixed dot layers. ::before is the resting grid; ::after is the same
         grid with slightly bigger, tinted dots, masked to a soft spotlight that
         fades out with the distance from the pointer. */
      .drop::before,
      .drop::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        background-size: var(--_dot-gap) var(--_dot-gap);
        background-position: center;
        transition: opacity 250ms ease;
      }

      .drop::before {
        background-image: radial-gradient(circle,
          var(--_dot-color) var(--_dot-size),
          transparent calc(var(--_dot-size) + 0.6px));
      }

      .drop::after {
        background-image: radial-gradient(circle,
          var(--_spotlight-color) calc(var(--_dot-size) * 1.25),
          transparent calc(var(--_dot-size) * 1.4 + 0.6px));
        /* Eased falloff: strong only right at the pointer, then a long soft tail. */
        -webkit-mask-image: radial-gradient(circle var(--_spotlight) at var(--_mx) var(--_my),
          rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.35) 18%, rgba(0, 0, 0, 0.15) 40%, rgba(0, 0, 0, 0.05) 65%, transparent 100%);
        mask-image: radial-gradient(circle var(--_spotlight) at var(--_mx) var(--_my),
          rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.35) 18%, rgba(0, 0, 0, 0.15) 40%, rgba(0, 0, 0, 0.05) 65%, transparent 100%);
        opacity: 0;
      }

      .drop.is-pointer::after { opacity: 1; }

      .drop.is-dragover {
        border-style: solid;
        border-color: var(--_accent);
        background-color: color-mix(in srgb, var(--_accent) 6%, var(--_bg));
        --_spotlight: var(--_drag-spotlight);
      }

      .drop.is-dragover::after { opacity: 1; }

      :host([disabled]) .drop::after { display: none; }

      .drop-icon {
        display: grid;
        place-items: center;
        width: var(--_icon-size);
        height: var(--_icon-size);
        border-radius: 50%;
        background: color-mix(in srgb, var(--_accent) 10%, var(--_bg));
        color: var(--_accent);
        transition: transform 250ms cubic-bezier(.34, 1.56, .64, 1);
      }

      /* While the pointer is in the field the icon stays lifted; it springs back
         down on leave (the transition on .drop-icon does both directions). */
      .drop.is-pointer .drop-icon { transform: translateY(calc(-1 * var(--_icon-lift))); }

      .drop.is-dragover .drop-icon { transform: translateY(calc(-1 * var(--_icon-lift))) scale(1.08); }

      /* Fallback when <kakao-button> isn't loaded: a plain bordered button. */
      .browse-fallback {
        font: inherit;
        font-size: 0.875em;
        font-weight: 600;
        color: var(--_text);
        background: var(--_bg);
        border: 1px solid var(--_border);
        border-radius: 9px;
        padding: 0.4rem 0.9rem;
        cursor: pointer;
      }
      .browse-fallback:focus-visible { outline: 2px solid var(--_accent); outline-offset: 2px; }
      .browse-fallback:disabled { cursor: not-allowed; }

      ::slotted([slot="button"]) { margin: 0.2rem 0; }

      .drop-icon svg,
      .remove svg,
      .thumb svg {
        width: 60%;
        height: 60%;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .drop-text { font-weight: 500; }
      .drop-hint { font-size: 0.82em; color: var(--_muted); }

      .message {
        margin-top: 0.5rem;
        font-size: 0.85em;
        color: var(--_error);
      }
      .message:empty { display: none; }

      /* ---- File list ---- */
      /* ---- Layout: stacked by default; the horizontal flag puts the list beside
         the drop area. The root is a size container, so a narrow component falls
         back to stacked on its own. ---- */
      .root { container-type: inline-size; }

      :host([horizontal]) .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 1rem 1.25rem;
        align-items: start;
      }

      :host([horizontal]) .summary { margin-top: 0; }

      @container (max-width: 34rem) {
        :host([horizontal]) .layout { display: block; }
        :host([horizontal]) .summary { margin-top: 0.9rem; }
      }

      .summary {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 0.9rem;
        font-size: 0.85em;
        color: var(--_muted);
      }
      .summary[hidden] { display: none; }

      .clear {
        font: inherit;
        color: var(--_muted);
        background: none;
        border: none;
        border-radius: 4px;
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer;
      }
      .clear:hover { color: var(--_text); }
      .clear:focus-visible { outline: 2px solid var(--_accent); outline-offset: 2px; }

      .list {
        list-style: none;
        display: grid;
        gap: var(--_list-gap);
        margin-top: 0.5rem;
      }

      .item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.75rem;
        padding: var(--_item-padding);
        border: 1px solid var(--_border);
        border-radius: var(--_item-radius);
        background: var(--_bg);
      }

      .item.is-new { animation: kakao-file-in 220ms cubic-bezier(.34, 1.3, .64, 1); }
      .item.is-removing {
        animation: kakao-file-out ${REMOVE_MS}ms ease-in forwards;
        pointer-events: none;
      }

      @keyframes kakao-file-in {
        from { opacity: 0; transform: translateY(-4px) scale(0.98); }
      }
      @keyframes kakao-file-out {
        to { opacity: 0; transform: translateX(8px) scale(0.98); }
      }

      .thumb {
        position: relative;
        display: grid;
        place-items: center;
        width: var(--_thumb-size);
        height: var(--_thumb-size);
        border-radius: var(--_thumb-radius);
        overflow: hidden;
        background: color-mix(in srgb, var(--_cat) 10%, #fff);
        color: var(--_cat);
        --_cat: var(--_type-color);
      }
      .thumb[data-cat="image"]   { --_cat: var(--_type-image); }
      .thumb[data-cat="pdf"]     { --_cat: var(--_type-pdf); }
      .thumb[data-cat="video"]   { --_cat: var(--_type-video); }
      .thumb[data-cat="audio"]   { --_cat: var(--_type-audio); }
      .thumb[data-cat="archive"] { --_cat: var(--_type-archive); }
      .thumb[data-cat="text"]    { --_cat: var(--_type-text); }

      .thumb svg { width: 65%; height: 65%; stroke-width: 1.5; transform: translateY(-2px); }

      .thumb img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* Extension tag across the bottom of the page glyph, centred on the thumb. */
      .ext {
        position: absolute;
        left: 50%;
        bottom: 0.45rem;
        transform: translateX(-50%);
        padding: 0.12rem 0.22rem;
        border-radius: 3px;
        background: var(--_cat);
        color: var(--_type-tag-text);
        font: 700 0.45rem/1 var(--kakao-font-family, system-ui, sans-serif);
        letter-spacing: 0.03em;
        text-align: center;
        white-space: nowrap;
      }

      .info { min-width: 0; display: grid; }
      .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 500;
      }
      .meta { font-size: 0.8em; color: var(--_muted); }

      .remove {
        display: grid;
        place-items: center;
        width: 2rem;
        height: 2rem;
        color: var(--_muted);
        background: none;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 120ms ease, color 120ms ease;
      }
      .remove:hover { background: color-mix(in srgb, var(--_error) 10%, transparent); color: var(--_error); }
      .remove:focus-visible { outline: 2px solid var(--_accent); outline-offset: 1px; }
      :host([disabled]) .remove, :host([disabled]) .clear { pointer-events: none; }

      @media (prefers-reduced-motion: reduce) {
        .drop::before, .drop::after { transform: none; transition: none; }
        .item.is-new, .item.is-removing { animation-duration: 0.01ms; }
      }
    </style>
    <div class="root">
      <span class="label" id="label" part="label"></span>
      <div class="layout">
        <div class="pick">
          <div class="drop" part="drop">
            <span class="drop-icon">${ICON_UPLOAD}</span>
            <span class="drop-text">Drop files here, or</span>
            <slot name="button"><button type="button" class="browse-fallback">Browse files</button></slot>
            <span class="drop-hint" id="hint"></span>
          </div>
          <input type="file" hidden tabindex="-1" />
          <div class="message" role="alert"></div>
        </div>
        <div class="files">
          <div class="summary" hidden>
            <span aria-live="polite"></span>
            <button type="button" class="clear">Clear all</button>
          </div>
          <ul class="list" part="list" aria-label="Selected files"></ul>
        </div>
      </div>
    </div>
  `;

  class KakaoFileUpload extends HTMLElement {
    static get formAssociated() {
      return true;
    }

    static get observedAttributes() {
      return ['label', 'hint', 'accept', 'multiple', 'max-files', 'max-size', 'disabled', 'name'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));

      this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
      this._labelEl = shadow.querySelector('.label');
      this._dropEl = shadow.querySelector('.drop');
      this._hintEl = shadow.querySelector('.drop-hint');
      this._inputEl = shadow.querySelector('input');
      this._messageEl = shadow.querySelector('.message');
      this._summaryEl = shadow.querySelector('.summary');
      this._summaryText = this._summaryEl.querySelector('span');
      this._clearEl = shadow.querySelector('.clear');
      this._listEl = shadow.querySelector('.list');
      this._fallbackBtn = shadow.querySelector('.browse-fallback');

      this._entries = []; // [{ id, file, url }]
      this._nextId = 1;
      this._connected = false;
      this._pending = []; // queued public-method calls before connectedCallback
      this._dragDepth = 0; // dragenter/dragleave fire per child; count to know when we really left
      this._raf = 0;
      this._pointer = null; // last { x, y } inside the drop area, applied in rAF
      this._formDisabled = false;

      this._onDropClick = this._onDropClick.bind(this);
      this._onPointerMove = this._onPointerMove.bind(this);
      this._onPointerLeave = this._onPointerLeave.bind(this);
      this._onDragEnter = this._onDragEnter.bind(this);
      this._onDragOver = this._onDragOver.bind(this);
      this._onDragLeave = this._onDragLeave.bind(this);
      this._onDrop = this._onDrop.bind(this);
      this._onInputChange = this._onInputChange.bind(this);
      this._onListClick = this._onListClick.bind(this);
      this._onClear = () => this.clear();
    }

    /* -------------------------- Lifecycle -------------------------- */

    connectedCallback() {
      this._connected = true;
      const d = this._dropEl;
      d.addEventListener('click', this._onDropClick);
      d.addEventListener('pointermove', this._onPointerMove);
      d.addEventListener('pointerleave', this._onPointerLeave);
      d.addEventListener('dragenter', this._onDragEnter);
      d.addEventListener('dragover', this._onDragOver);
      d.addEventListener('dragleave', this._onDragLeave);
      d.addEventListener('drop', this._onDrop);
      this._inputEl.addEventListener('change', this._onInputChange);
      this._listEl.addEventListener('click', this._onListClick);
      this._clearEl.addEventListener('click', this._onClear);

      this._syncLabel();
      this._syncInput();
      this._syncDisabled();
      this._render();
      this._ensureButton();

      while (this._pending.length) {
        const { method, args } = this._pending.shift();
        this[method](...args);
      }
    }

    disconnectedCallback() {
      this._connected = false;
      const d = this._dropEl;
      d.removeEventListener('click', this._onDropClick);
      d.removeEventListener('pointermove', this._onPointerMove);
      d.removeEventListener('pointerleave', this._onPointerLeave);
      d.removeEventListener('dragenter', this._onDragEnter);
      d.removeEventListener('dragover', this._onDragOver);
      d.removeEventListener('dragleave', this._onDragLeave);
      d.removeEventListener('drop', this._onDrop);
      this._inputEl.removeEventListener('change', this._onInputChange);
      this._listEl.removeEventListener('click', this._onListClick);
      this._clearEl.removeEventListener('click', this._onClear);
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
      // Object URLs are kept: the element may just be moving in the DOM.
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this._connected) return;
      switch (name) {
        case 'label':
        case 'hint':
        case 'accept':
        case 'max-size':
          this._syncLabel();
          this._syncInput();
          break;
        case 'multiple':
          this._syncInput();
          break;
        case 'disabled':
          this._syncDisabled();
          break;
        case 'name':
          this._syncFormValue();
          break;
      }
    }

    /* -------------------------- Form association -------------------------- */

    formResetCallback() {
      this.clear();
    }

    formDisabledCallback(disabled) {
      this._formDisabled = disabled;
      this._syncDisabled();
    }

    /* -------------------------- Public API -------------------------- */

    /** @returns {File[]} */
    get files() {
      return this._entries.map((e) => e.file);
    }

    /** @param {FileList|File[]} fileList */
    addFiles(fileList) {
      if (!this._connected) {
        this._pending.push({ method: 'addFiles', args: [fileList] });
        return;
      }
      this._add(Array.from(fileList || []), []);
    }

    /** @param {number} index */
    removeFile(index) {
      if (!this._connected) {
        this._pending.push({ method: 'removeFile', args: [index] });
        return;
      }
      const entry = this._entries[index];
      if (entry) this._remove([entry]);
    }

    clear() {
      if (!this._connected) {
        this._pending.push({ method: 'clear', args: [] });
        return;
      }
      this._messageEl.textContent = '';
      if (this._entries.length) this._remove(this._entries.slice());
    }

    open() {
      if (!this._isDisabled()) this._inputEl.click();
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }
    set disabled(val) {
      if (val) this.setAttribute('disabled', '');
      else this.removeAttribute('disabled');
    }

    /** Default true; multiple="false" keeps a single file. */
    get multiple() {
      const raw = this.getAttribute('multiple');
      if (raw === null) return true;
      return !FALSEY.includes(raw.trim().toLowerCase());
    }
    set multiple(val) {
      this.setAttribute('multiple', val ? 'true' : 'false');
    }

    /* -------------------------- Sync helpers -------------------------- */

    _isDisabled() {
      return this.disabled || this._formDisabled;
    }

    _maxFiles() {
      const n = parseInt(this.getAttribute('max-files'), 10);
      return Number.isFinite(n) && n > 0 ? n : Infinity;
    }

    _syncLabel() {
      const label = this.getAttribute('label') || 'Files';
      this._labelEl.textContent = label;
      const browseName = `Browse files for ${label}`;
      this._fallbackBtn.setAttribute('aria-label', browseName);
      const btn = this._browseButton();
      if (btn && btn._kakaoAuto) btn.setAttribute('aria-label', browseName);
      const hint = this.getAttribute('hint');
      if (hint !== null) {
        this._hintEl.textContent = hint;
        return;
      }
      // Built from the rules, e.g. "image/*, .pdf · up to 5 MB each"
      const parts = [];
      const accept = this.getAttribute('accept');
      if (accept) parts.push(accept.split(',').map((s) => s.trim()).join(', '));
      const max = parseSize(this.getAttribute('max-size'));
      if (Number.isFinite(max)) parts.push(`up to ${formatBytes(max)} each`);
      this._hintEl.textContent = parts.join(' · ') || (this.multiple ? 'Any file type, several at once' : 'Any file type');
    }

    _syncInput() {
      const accept = this.getAttribute('accept');
      if (accept) this._inputEl.setAttribute('accept', accept);
      else this._inputEl.removeAttribute('accept');
      this._inputEl.multiple = this.multiple;
    }

    _syncDisabled() {
      const off = this._isDisabled();
      this._dropEl.setAttribute('aria-disabled', String(off));
      this._inputEl.disabled = off;
      this._fallbackBtn.disabled = off;
      const btn = this._browseButton();
      if (btn) btn.toggleAttribute('disabled', off);
    }

    /** The slotted browse button (ours or one the page provided), if any. */
    _browseButton() {
      return this.querySelector(':scope > [slot="button"]');
    }

    /**
     * Uses <kakao-button> for "Browse files" when it is loaded. It goes into the
     * light DOM (slot="button") so the page's button.css styles it; until then, or
     * without it, the plain fallback button inside the shadow root shows.
     */
    _ensureButton() {
      if (this._browseButton() || !window.customElements) return;
      customElements.whenDefined('kakao-button').then(() => {
        if (!this.isConnected || this._browseButton()) return;
        const btn = document.createElement('kakao-button');
        btn.setAttribute('slot', 'button');
        btn.setAttribute('label', 'Browse files');
        btn.setAttribute('variant', 'secondary');
        btn.setAttribute('size', 'sm');
        btn._kakaoAuto = true; // ours: its aria-label follows the label attribute
        this.appendChild(btn);
        this._syncLabel();
        this._syncDisabled();
      });
    }

    _syncFormValue() {
      if (!this._internals) return;
      const name = this.getAttribute('name');
      if (!name || !this._entries.length) {
        this._internals.setFormValue(null);
        return;
      }
      const data = new FormData();
      this._entries.forEach((e) => data.append(name, e.file));
      this._internals.setFormValue(data);
    }

    /* -------------------------- Adding / removing -------------------------- */

    /**
     * Applies the rules to new files and appends the ones that pass.
     * @param {File[]} files
     * @param {Array<{file: File|null, name: string, reason: string}>} rejected  pre-rejected (e.g. folders)
     */
    _add(files, rejected) {
      const removed = [];
      if (!this.multiple && files.length) {
        // Single mode: the newest pick replaces the current file.
        files = files.slice(0, 1);
        this._entries.forEach((e) => {
          if (e.url) URL.revokeObjectURL(e.url);
          removed.push(e.file);
        });
        this._entries = [];
      }

      const accept = this.getAttribute('accept');
      const maxSize = parseSize(this.getAttribute('max-size'));
      const maxFiles = this._maxFiles();
      const keys = new Set(this._entries.map((e) => fileKey(e.file)));
      const added = [];
      const newIds = new Set();

      files.forEach((file) => {
        let reason = null;
        if (!matchesAccept(file, accept)) reason = 'type';
        else if (file.size > maxSize) reason = 'size';
        else if (keys.has(fileKey(file))) reason = 'duplicate';
        else if (this._entries.length >= maxFiles) reason = 'max-files';
        if (reason) {
          rejected.push({ file, name: file.name, reason });
          return;
        }
        const id = this._nextId++;
        const url = categoryOf(file) === 'image' ? URL.createObjectURL(file) : null;
        this._entries.push({ id, file, url });
        keys.add(fileKey(file));
        newIds.add(id);
        added.push(file);
      });

      rejected.forEach((r) => this._dispatch('file-reject', r));
      this._showRejections(rejected);

      if (added.length || removed.length) {
        this._render(newIds);
        this._syncFormValue();
        this._dispatch('files-change', { files: this.files, added, removed });
      }
    }

    /** Animates rows out, then drops the entries. */
    _remove(entries) {
      if (!entries.length) return;
      const ids = new Set(entries.map((e) => e.id));
      const focusIndex = this._entries.findIndex((e) => ids.has(e.id));
      const hadFocus = this.shadowRoot.activeElement !== null; // checked now: the focused row is about to go
      const rows = [...this._listEl.children].filter((li) => ids.has(Number(li.dataset.id)));
      rows.forEach((li) => li.classList.add('is-removing'));

      const finish = () => {
        entries.forEach((e) => {
          if (e.url) URL.revokeObjectURL(e.url);
        });
        this._entries = this._entries.filter((e) => !ids.has(e.id));
        this._render();
        this._syncFormValue();
        this._dispatch('files-change', { files: this.files, added: [], removed: entries.map((e) => e.file) });
        if (hadFocus) this._restoreFocus(focusIndex);
      };
      if (rows.length && !reduceMotion()) setTimeout(finish, REMOVE_MS);
      else finish();
    }

    /** After a removal, focus the row now at the same index (or the last one, or the drop area). */
    _restoreFocus(index) {
      const buttons = this._listEl.querySelectorAll('.remove');
      const target = buttons[Math.min(index, buttons.length - 1)];
      (target || this._dropEl).focus();
    }

    _showRejections(rejected) {
      if (!rejected.length) {
        this._messageEl.textContent = '';
        return;
      }
      const lines = rejected.map((r) => `${r.name}: ${REASON_TEXT[r.reason]}`);
      const shown = lines.slice(0, 3);
      if (lines.length > 3) shown.push(`and ${lines.length - 3} more`);
      this._messageEl.textContent = `Not added - ${shown.join('; ')}.`;
    }

    /* -------------------------- Rendering -------------------------- */

    /** @param {Set<number>} [newIds] rows to play the entry animation on */
    _render(newIds) {
      const list = this._listEl;
      list.textContent = '';
      this._entries.forEach((entry) => {
        const { file } = entry;
        const cat = categoryOf(file);
        const ext = extOf(file.name);

        const li = document.createElement('li');
        li.className = newIds && newIds.has(entry.id) ? 'item is-new' : 'item';
        li.dataset.id = String(entry.id);

        const thumb = document.createElement('span');
        thumb.className = 'thumb';
        thumb.dataset.cat = cat;
        thumb.setAttribute('aria-hidden', 'true');
        if (entry.url) {
          const img = document.createElement('img');
          img.src = entry.url;
          img.alt = '';
          img.decoding = 'async';
          thumb.appendChild(img);
        } else {
          thumb.innerHTML = ICON_DOC;
          const label = document.createElement('span');
          label.className = 'ext';
          label.textContent = ext.slice(0, 4).toUpperCase() || cat; // extensions are acronyms: written in capitals, not styled
          thumb.appendChild(label);
        }

        const info = document.createElement('span');
        info.className = 'info';
        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = file.name;
        name.title = file.name;
        const meta = document.createElement('span');
        meta.className = 'meta';
        meta.textContent = [formatBytes(file.size), ext.toUpperCase() || file.type].filter(Boolean).join(' · ');
        info.append(name, meta);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove';
        remove.dataset.id = String(entry.id);
        remove.setAttribute('aria-label', `Remove ${file.name}`);
        remove.innerHTML = ICON_X;

        li.append(thumb, info, remove);
        list.appendChild(li);
      });

      const count = this._entries.length;
      this._summaryEl.hidden = count === 0;
      const total = this._entries.reduce((sum, e) => sum + e.file.size, 0);
      this._summaryText.textContent = `${count} file${count === 1 ? '' : 's'} · ${formatBytes(total)}`;
      this._clearEl.hidden = count < 2;
    }

    /* -------------------------- Interaction -------------------------- */

    _onDropClick() {
      this.open();
    }

    _onInputChange() {
      this._add(Array.from(this._inputEl.files || []), []);
      this._inputEl.value = ''; // so picking the same file again still fires change
    }

    _onListClick(evt) {
      const btn = evt.target.closest('.remove');
      if (!btn || this._isDisabled()) return;
      const entry = this._entries.find((e) => e.id === Number(btn.dataset.id));
      if (entry) this._remove([entry]);
    }

    /* ---- Pointer spotlight ---- */

    _onPointerMove(evt) {
      if (this._isDisabled() || reduceMotion()) return;
      this._trackPointer(evt.clientX, evt.clientY);
      this._dropEl.classList.add('is-pointer');
    }

    _onPointerLeave() {
      this._dropEl.classList.remove('is-pointer');
      this._pointer = null;
    }

    /** Stores the pointer and writes the CSS variables once per frame. */
    _trackPointer(clientX, clientY) {
      this._pointer = { x: clientX, y: clientY };
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = 0;
        if (!this._pointer) return;
        const r = this._dropEl.getBoundingClientRect();
        const x = this._pointer.x - r.left;
        const y = this._pointer.y - r.top;
        const s = this._dropEl.style;
        s.setProperty('--_mx', `${x}px`);
        s.setProperty('--_my', `${y}px`);
      });
    }

    /* ---- Drag and drop ---- */

    _onDragEnter(evt) {
      if (this._isDisabled()) return;
      evt.preventDefault();
      this._dragDepth++;
      this._dropEl.classList.add('is-dragover');
    }

    _onDragOver(evt) {
      if (this._isDisabled()) return;
      evt.preventDefault(); // required, or the browser won't allow the drop
      if (evt.dataTransfer) evt.dataTransfer.dropEffect = 'copy';
      if (!reduceMotion()) this._trackPointer(evt.clientX, evt.clientY);
    }

    _onDragLeave() {
      this._dragDepth = Math.max(0, this._dragDepth - 1);
      if (!this._dragDepth) this._dropEl.classList.remove('is-dragover');
    }

    _onDrop(evt) {
      evt.preventDefault();
      this._dragDepth = 0;
      this._dropEl.classList.remove('is-dragover');
      if (this._isDisabled() || !evt.dataTransfer) return;

      const files = [];
      const rejected = [];
      const items = Array.from(evt.dataTransfer.items || []);
      if (items.length) {
        items.forEach((item) => {
          if (item.kind !== 'file') return;
          const entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null;
          const file = item.getAsFile();
          if (entry && entry.isDirectory) {
            rejected.push({ file: null, name: (file && file.name) || entry.name, reason: 'folder' });
          } else if (file) {
            files.push(file);
          }
        });
      } else {
        files.push(...Array.from(evt.dataTransfer.files || []));
      }
      this._add(files, rejected);
    }

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
  }

  customElements.define(TAG_NAME, KakaoFileUpload);
})();
