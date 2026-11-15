/**
 * <kakao-command-palette>
 * ============================================================================
 * A search over the page's actions, opened with a hotkey (Mod+K by default):
 * type a few letters, pick a command with the arrows, run it with Enter.
 * Modal like the dialog (scrim, page scroll locked, focus held and given
 * back), drawn with the select's panel and rows, in the top layer. The
 * WAI-ARIA combobox pattern with a grouped listbox. Vanilla JS, Shadow DOM,
 * no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="../kbd/kbd.js" defer><\/script>   (optional: shortcuts as keycaps)
 *   <script src="command-palette.js" defer><\/script>
 *
 *   <kakao-command-palette recent list-data='[
 *     { "id": "new", "label": "New file", "group": "File", "shortcut": "Mod+N" },
 *     { "id": "settings", "label": "Open settings", "group": "Go to",
 *       "keywords": ["preferences", "options"], "href": "settings.html" },
 *     { "id": "logout", "label": "Sign out", "group": "Account", "keywords": "logout, exit" }
 *   ]'></kakao-command-palette>
 *
 *   palette.addEventListener('command-select', (e) => run(e.detail.id));
 *
 * ----------------------------------------------------------------------------
 * COMMANDS (list-data: a JSON array, or the `commands` property)
 * ----------------------------------------------------------------------------
 *  "Label"                  a command whose label and id are that text
 *  { label, … }             a command:
 *    id         Reported in command-select and kept for `recent`. Default:
 *               the value, else the label.
 *    label      The text that is searched and shown.
 *    group      Heading of the group the command is listed under. Commands
 *               without one are listed without a heading.
 *    keywords   More words that find the command (not shown): an array or a
 *               comma separated string.
 *    shortcut   A hint such as "Mod+S", drawn by <kakao-kbd> when that
 *               component is loaded, else as text. The palette does not bind it.
 *    icon       Inline SVG markup, drawn in currentColor at the icon size.
 *               Scripts, foreignObject and on* attributes are removed.
 *    href       Running the command goes there (`target` "_blank" opens a
 *               new window). javascript: URLs are ignored.
 *    value      Reported in command-select. Default: the id.
 *    disabled   true: listed dimmed, skipped by the keys, cannot be run.
 *
 *  Discovery: shared/component-api.js only records which trigger events a
 *  component emits (KakaoComponents.meta(tag)); it lists no components and
 *  runs no actions, so commands always come from list-data / commands.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES (all observed)
 * ----------------------------------------------------------------------------
 *  list-data     The commands (see above).
 *  hotkey        The key that opens and closes the palette. Default "Mod+K"
 *                (Command on a Mac, Ctrl elsewhere). Combinations as in
 *                kakao-kbd: "Ctrl+Shift+P", "/", "F1". "none" or empty: no
 *                hotkey. A hotkey without Ctrl, Meta or Alt does nothing
 *                while the user types in a field.
 *  recent        Remember the last run commands (in memory, for this page
 *                view) and list them first while the query is empty. A number
 *                of commands; empty = 5.
 *  label         Accessible name of the palette. Default "Command palette".
 *  placeholder   Placeholder of the search field. Default "Search commands…".
 *  empty-text    Shown when nothing matches. Default "No matching commands".
 *  no-hints      Hide the keyboard hint row at the bottom (it is always
 *                hidden on touch screens).
 *  inline        Shown in place, always open: no scrim, no scroll lock, no
 *                hotkey; Escape clears the query. For previews.
 *  open          Reflects the open state; setting it opens the palette.
 *
 * ----------------------------------------------------------------------------
 * KEYBOARD
 * ----------------------------------------------------------------------------
 *  Hotkey        open / close            Escape      close, focus goes back
 *  Down / Up     next / previous command (wraps)
 *  Home / End    first / last command    PageDown / PageUp   eight on
 *  Enter         run the active command  Tab         stays in the field
 *  Left / Right stay with the caret. Disabled commands are skipped.
 *
 * ----------------------------------------------------------------------------
 * SEARCH
 * ----------------------------------------------------------------------------
 *  Case and accents are ignored. Every word of the query has to match the
 *  label (as a piece of it, else its letters in order: "nwf" finds "New
 *  file") or a keyword. Matched letters are highlighted. Results stay
 *  grouped: the group with the best match first, the best command first.
 *
 * ----------------------------------------------------------------------------
 * EVENTS (bubble, composed)
 * ----------------------------------------------------------------------------
 *  command-select          { id, value, command } after the palette closed.
 *                          `command` is the entry from list-data. Cancelable:
 *                          preventDefault() stops the navigation of an href.
 *                          Also the KakaoComponents trigger "command-select".
 *  command-palette-open    the palette opened
 *  command-palette-close   the palette closed
 *
 * ----------------------------------------------------------------------------
 * METHODS / PROPERTIES
 * ----------------------------------------------------------------------------
 *  open(query?)   open, optionally with a query filled in
 *  close()        close
 *  toggle()       open or close
 *  isOpen         true while open
 *  commands       the commands as an array (get / set; wins over list-data
 *                 until that changes)
 *  recentIds      ids of the remembered commands, newest first (read only)
 *  KakaoCommandPalette.texts   the words it uses (label, placeholder, empty,
 *                 recent, listbox, count, one, move, run, close)
 *
 * ----------------------------------------------------------------------------
 * SMALL SCREENS
 * ----------------------------------------------------------------------------
 *  Below 40rem of viewport width the panel is a full-width sheet at the top,
 *  so the on-screen keyboard leaves the results visible. Rows are taller on
 *  touch screens, and the hint row is hidden there.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES
 * ----------------------------------------------------------------------------
 *  --kakao-command-palette-*: defaults live in the settings block of this
 *  file; change them on construction.html. z-index only applies where the
 *  top layer (popover API) is missing: 65, above the dialog (60), below
 *  dropdown panels (70).
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-command-palette';
  if (customElements.get(TAG_NAME)) return;

  const PAGE_STEP = 8;
  const DEFAULT_RECENT = 5;

  const SEARCH = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></svg>';

  /* --------------------------- Helpers ---------------------------- */

  const isMac = () => {
    const nav = window.navigator || {};
    const platform = (nav.userAgentData && nav.userAgentData.platform) || nav.platform || '';
    return /mac|iphone|ipad|ipod/i.test(platform);
  };

  const foldChar = (c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const foldText = (s) => foldChar(String(s));

  /**
   * Folds a label for matching and keeps, for every folded code unit, the
   * index of the character it came from, so marks land on the right letters.
   */
  function prepare(label) {
    const chars = Array.from(label);
    let folded = '';
    const map = [];
    chars.forEach((c, i) => {
      const f = foldChar(c) || c;
      for (let k = 0; k < f.length; k += 1) map.push(i);
      folded += f;
    });
    return { chars, folded, map };
  }

  const WORD_START = /[\s\-_/.:,(]/;

  /** Best label match of one query word: { score, at: [char indexes] } or null. */
  function matchLabel(prep, word) {
    const { folded, map } = prep;
    const i = folded.indexOf(word);
    if (i >= 0) {
      const score = i === 0 ? 100 : WORD_START.test(folded[i - 1]) ? 80 : 50;
      const at = [];
      for (let k = i; k < i + word.length; k += 1) at.push(map[k]);
      return { score, at };
    }
    // The letters in order, each as early as possible, starting at the start
    // of a word, with no more than two letters skipped per step on average:
    // "nwf" finds "New file", but "set" does not find "Share with team" and
    // "user" not "Rebuild search index".
    const at = [];
    let from = 0;
    while (from < folded.length && (folded[from] !== word[0] || (from > 0 && !WORD_START.test(folded[from - 1])))) from += 1;
    if (from >= folded.length) return null;
    let gaps = 0;
    for (const ch of word) {
      const j = folded.indexOf(ch, from);
      if (j < 0) return null;
      if (at.length) gaps += j - from;
      at.push(map[j]);
      from = j + ch.length;
    }
    if (gaps > 2 * (word.length - 1)) return null;
    return { score: Math.max(1, 30 - gaps), at };
  }

  function matchKeywords(keywords, word) {
    let best = 0;
    keywords.forEach((k) => {
      const i = k.indexOf(word);
      if (i === 0) best = Math.max(best, 45);
      else if (i > 0) best = Math.max(best, 40);
    });
    return best;
  }

  /** Score of a command for the query words, and the label letters to mark; null = no match. */
  function matchCommand(cmd, words) {
    let score = 0;
    const marks = new Set();
    for (const word of words) {
      const label = matchLabel(cmd.prep, word);
      const kw = matchKeywords(cmd.keywordsFolded, word);
      if (!label && !kw) return null;
      if (label && label.score >= kw) {
        score += label.score;
        label.at.forEach((i) => marks.add(i));
      } else {
        score += kw;
      }
    }
    return { score, marks };
  }

  /** Inline SVG markup → a clean <svg> element, or null. */
  function cleanIcon(markup) {
    if (typeof markup !== 'string' || !/^\s*<svg[\s>]/i.test(markup)) return null;
    const tpl = document.createElement('template');
    tpl.innerHTML = markup; // inert: nothing in a template runs or loads
    const svg = tpl.content.firstElementChild;
    if (!svg || svg.localName !== 'svg') return null;
    svg.querySelectorAll('script, foreignObject, foreignobject').forEach((n) => n.remove());
    [svg, ...svg.querySelectorAll('*')].forEach((el) => {
      [...el.attributes].forEach((a) => {
        if (/^on/i.test(a.name) || (/href$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) {
          el.removeAttribute(a.name);
        }
      });
    });
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    return svg;
  }

  function normalise(list) {
    const out = [];
    (Array.isArray(list) ? list : []).forEach((raw, index) => {
      if (typeof raw === 'string' || typeof raw === 'number') raw = { label: String(raw) };
      if (!raw || typeof raw !== 'object' || raw.label == null) return;
      const label = String(raw.label);
      const id = String(raw.id != null ? raw.id : (raw.value != null ? raw.value : label));
      const keywords = Array.isArray(raw.keywords)
        ? raw.keywords.map(String)
        : (typeof raw.keywords === 'string' ? raw.keywords.split(',') : []);
      const href = typeof raw.href === 'string' && raw.href.trim() && !/^\s*javascript:/i.test(raw.href) ? raw.href : '';
      out.push({
        index,
        id,
        label,
        value: raw.value != null ? raw.value : id,
        group: raw.group != null ? String(raw.group) : '',
        keywordsFolded: keywords.map((k) => foldText(k.trim())).filter(Boolean),
        shortcut: raw.shortcut != null ? String(raw.shortcut) : '',
        icon: cleanIcon(raw.icon),
        href,
        target: href && raw.target ? String(raw.target) : '',
        disabled: raw.disabled === true,
        prep: prepare(label),
        source: raw,
      });
    });
    return out;
  }

  /** "Mod+K" → { key, ctrl, meta, alt, shift } or null. */
  function parseHotkey(text) {
    const value = String(text == null ? '' : text).trim();
    if (!value || value.toLowerCase() === 'none') return null;
    let parts = value.split('+').map((p) => p.trim());
    // "Ctrl++": the last key is "+" itself.
    if (value.endsWith('++')) parts = [...parts.slice(0, -2), '+'];
    const key = parts.pop();
    if (!key) return null;
    const combo = { key, ctrl: false, meta: false, alt: false, shift: false };
    parts.forEach((p) => {
      const m = p.toLowerCase();
      if (m === 'mod') combo[isMac() ? 'meta' : 'ctrl'] = true;
      else if (m === 'cmd' || m === 'command' || m === 'meta' || m === '⌘') combo.meta = true;
      else if (m === 'ctrl' || m === 'control' || m === '⌃') combo.ctrl = true;
      else if (m === 'alt' || m === 'option' || m === 'opt' || m === '⌥') combo.alt = true;
      else if (m === 'shift' || m === '⇧') combo.shift = true;
    });
    return combo;
  }

  function hotkeyMatches(combo, e) {
    if (e.ctrlKey !== combo.ctrl || e.metaKey !== combo.meta || e.altKey !== combo.alt) return false;
    const key = combo.key;
    const letter = /^[a-z]$/i.test(key);
    if (combo.shift ? !e.shiftKey : (letter && e.shiftKey)) return false;
    if (String(e.key).toLowerCase() === key.toLowerCase()) return true;
    // Alt (Option on a Mac) changes e.key: fall back to the physical key.
    if (letter) return e.code === `Key${key.toUpperCase()}`;
    if (/^[0-9]$/.test(key)) return e.code === `Digit${key}`;
    return false;
  }

  const deepActive = () => {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
    return el && el !== document.body ? el : null;
  };

  const isEditable = (el) => !!el && (el.isContentEditable
    || el.localName === 'textarea' || el.localName === 'select'
    || (el.localName === 'input' && !/^(button|checkbox|radio|range|color|file|submit|reset|image)$/i.test(el.type)));

  /* One page scroll lock; the palette is open at most once at a time. */
  let locks = 0;
  let saved = { overflow: '', padding: '' };
  function lockScroll() {
    if (locks++ > 0) return;
    const html = document.documentElement;
    saved = { overflow: html.style.overflow, padding: html.style.paddingRight };
    const gap = window.innerWidth - html.clientWidth;
    if (gap > 0) html.style.paddingRight = `${gap}px`;
    html.style.overflow = 'hidden';
  }
  function unlockScroll() {
    if (locks === 0 || --locks > 0) return;
    const html = document.documentElement;
    html.style.overflow = saved.overflow;
    html.style.paddingRight = saved.padding;
  }

  /* --------------------------- Template --------------------------- */

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-command-palette- (written by construction.html, edit there) */
        --_bg: var(--kakao-command-palette-bg, var(--kakao-color-bg, #ffffff));
        --_text: var(--kakao-command-palette-text, var(--kakao-color-text, #18181b));
        --_muted: var(--kakao-command-palette-muted, var(--kakao-color-muted, #62626c));
        --_hover-bg: var(--kakao-command-palette-hover-bg, var(--kakao-color-subtle, #f0f0f1));
        --_line: var(--kakao-command-palette-line, var(--kakao-color-line, #e5e7eb));
        --_icon: var(--kakao-command-palette-icon, var(--kakao-color-muted, #62626c));
        --_match: var(--kakao-command-palette-match, var(--kakao-color-primary, #4f46e5));
        --_focus: var(--kakao-command-palette-focus, var(--kakao-color-focus, #2563eb));
        --_scrim: var(--kakao-command-palette-scrim, rgb(0 0 0 / .45));
        --_font: var(--kakao-command-palette-font, 0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif));
        --_input-font-size: var(--kakao-command-palette-input-font-size, 1rem);
        --_match-weight: var(--kakao-command-palette-match-weight, 600);
        --_group-size: var(--kakao-command-palette-group-size, 0.78rem);
        --_group-weight: var(--kakao-command-palette-group-weight, 600);
        --_shortcut-size: var(--kakao-command-palette-shortcut-size, 0.8rem);
        --_hint-size: var(--kakao-command-palette-hint-size, 0.78rem);
        --_width: var(--kakao-command-palette-width, 38rem);
        --_top: var(--kakao-command-palette-top, 12vh);
        --_max-height: var(--kakao-command-palette-max-height, 28rem);
        --_sheet-max-height: var(--kakao-command-palette-sheet-max-height, 85vh);
        --_input-height: var(--kakao-command-palette-input-height, 52px);
        --_input-padding-x: var(--kakao-command-palette-input-padding-x, 1rem);
        --_padding: var(--kakao-command-palette-padding, 4px);
        --_option-height: var(--kakao-command-palette-option-height, 36px);
        --_touch-option-height: var(--kakao-command-palette-touch-option-height, 44px);
        --_option-padding-x: var(--kakao-command-palette-option-padding-x, 0.6rem);
        --_gap: var(--kakao-command-palette-gap, 0.55rem);
        --_shortcut-gap: var(--kakao-command-palette-shortcut-gap, 1.5rem);
        --_icon-size: var(--kakao-command-palette-icon-size, 1.1em);
        --_radius: var(--kakao-command-palette-radius, 10px);
        --_option-radius: var(--kakao-command-palette-option-radius, 6px);
        --_shadow: var(--kakao-command-palette-shadow, 0 8px 24px rgb(0 0 0 / .08), 0 0 0 1px color-mix(in srgb, var(--kakao-color-text, #18181b) 10%, transparent));
        --_focus-width: var(--kakao-command-palette-focus-width, 2px);
        --_z: var(--kakao-command-palette-z, 65);
        --_disabled-opacity: var(--kakao-command-palette-disabled-opacity, 0.55);
        --_duration: var(--kakao-command-palette-duration, 150ms);
        --_ease: var(--kakao-command-palette-ease, var(--kakao-ease-standard, cubic-bezier(.2, 0, 0, 1)));
        /* @kakao-settings:end */
        display: contents;
      }
      :host([hidden]) { display: none; }
      :host([inline]) { display: block; }

      /* ---- Overlay: the covered page, in the top layer when there is one ---- */
      .overlay {
        position: fixed;
        inset: 0;
        z-index: var(--_z);
        box-sizing: border-box;
        display: none;
        justify-content: center;
        align-items: flex-start;
        width: auto;
        height: auto;
        max-width: none;
        max-height: none;
        margin: 0;
        padding: var(--_top) 1rem 1rem;
        border: 0;
        background: transparent;
        color: var(--_text);
        overflow: hidden;
      }
      .overlay.is-open { display: flex; }
      .overlay::backdrop { background: transparent; }
      :host([inline]) .overlay {
        position: static;
        display: block;
        padding: 0;
        overflow: visible;
      }

      .scrim {
        position: absolute;
        inset: 0;
        background: var(--_scrim);
        animation: kakao-command-palette-fade var(--_duration) var(--_ease);
      }
      :host([inline]) .scrim { display: none; }

      /* ---- Panel: the select's dropdown surface (overlay, elevation level 3) ---- */
      .panel {
        position: relative;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: var(--_width);
        max-height: min(var(--_max-height), 100%);
        background: var(--_bg);
        color: var(--_text);
        font: var(--_font);
        text-align: left;
        border-radius: var(--_radius);
        box-shadow: var(--_shadow);
        overflow: hidden;
        animation: kakao-command-palette-in var(--_duration) var(--_ease);
      }
      :host([inline]) .panel { max-width: 100%; animation: none; }
      @keyframes kakao-command-palette-in {
        from { opacity: 0; transform: translateY(-6px) scale(.99); }
      }
      @keyframes kakao-command-palette-fade {
        from { opacity: 0; }
      }

      /* ---- Search row ---- */
      .search {
        flex: none;
        display: flex;
        align-items: center;
        gap: var(--_gap);
        min-height: var(--_input-height);
        padding: 0 var(--_input-padding-x);
        border-bottom: 1px solid var(--_line);
      }
      /* The field is the palette's one focus stop: its bottom edge takes the
         focus colour, as a field's border does. */
      .search:has(input:focus-visible) {
        border-bottom-color: var(--_focus);
        box-shadow: inset 0 calc(var(--_focus-width) * -1 + 1px) 0 var(--_focus);
      }
      .search-icon {
        flex: none;
        display: inline-flex;
        width: var(--_icon-size);
        height: var(--_icon-size);
        color: var(--_muted);
        font-size: var(--_input-font-size);
      }
      .search-icon svg { width: 100%; height: 100%; }
      input {
        flex: 1;
        min-width: 0;
        height: calc(var(--_input-height) - 1px);
        margin: 0;
        padding: 0;
        border: 0;
        outline: none;
        background: none;
        color: inherit;
        font: inherit;
        font-size: var(--_input-font-size);
      }
      input::placeholder { color: var(--_muted); opacity: 1; }
      input::-webkit-search-cancel-button { display: none; }

      /* ---- Results ---- */
      .list {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: var(--_padding);
        outline: none;
      }
      .list:empty { display: none; }
      .group + .group, .group + .option, .option + .group { margin-top: var(--_padding); }
      .group-label {
        padding: 0.55rem var(--_option-padding-x) 0.25rem;
        font-size: var(--_group-size);
        font-weight: var(--_group-weight);
        color: var(--_muted);
      }

      .option {
        display: flex;
        align-items: center;
        gap: var(--_gap);
        box-sizing: border-box;
        min-height: var(--_option-height);
        padding: 0.4rem var(--_option-padding-x);
        border-radius: var(--_option-radius);
        line-height: 1.3;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: background-color var(--_duration) var(--_ease);
      }
      .option[data-active] { background: var(--_hover-bg); }
      .option[aria-disabled="true"] { opacity: var(--_disabled-opacity); cursor: not-allowed; }

      .lead {
        flex: none;
        display: none;
        width: var(--_icon-size);
        height: var(--_icon-size);
        color: var(--_icon);
      }
      .list.has-lead .lead { display: inline-flex; }
      .lead svg { width: 100%; height: 100%; }

      .lbl { flex: 1; min-width: 0; overflow-wrap: anywhere; }
      mark {
        background: none;
        color: var(--_match);
        font-weight: var(--_match-weight);
      }

      .shortcut {
        flex: none;
        margin-left: calc(var(--_shortcut-gap) - var(--_gap));
        color: var(--_muted);
        font-size: var(--_shortcut-size);
        white-space: nowrap;
      }

      .empty {
        padding: 1.25rem var(--_input-padding-x);
        text-align: center;
        color: var(--_muted);
        font-size: 0.9em;
      }
      .empty[hidden] { display: none; }

      /* ---- Keyboard hints ---- */
      .hints {
        flex: none;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem 1.1rem;
        padding: 0.5rem var(--_input-padding-x);
        border-top: 1px solid var(--_line);
        color: var(--_muted);
        font-size: var(--_hint-size);
      }
      .hint { display: inline-flex; align-items: center; gap: 0.3rem; }
      .hint kbd { font: inherit; }
      :host([no-hints]) .hints, :host([inline]) .hints { display: none; }

      .sr {
        position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
        overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
      }

      /* ---- Phone: a full-width sheet at the top ---- */
      @media (max-width: 40rem) {
        :host(:not([inline])) .overlay { padding: 0; }
        :host(:not([inline])) .panel {
          max-width: none;
          max-height: var(--_sheet-max-height);
          border-radius: 0 0 var(--_radius) var(--_radius);
        }
        @supports (height: 1dvh) {
          :host(:not([inline])) .panel { max-height: min(var(--_sheet-max-height), 85dvh); }
        }
      }
      @media (pointer: coarse) {
        .option { min-height: var(--_touch-option-height); }
        .hints { display: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        .panel, .scrim { animation: none; }
        .option { transition: none; }
      }
      @media (forced-colors: active) {
        .panel { border: 1px solid CanvasText; }
        .option[data-active] { outline: 2px solid Highlight; outline-offset: -2px; }
        mark { color: inherit; text-decoration: underline; }
        .search:has(input:focus-visible) { border-bottom-color: Highlight; }
      }
    </style>
    <div class="overlay" part="overlay">
      <div class="scrim" part="scrim"></div>
      <div class="panel" part="panel" role="dialog" aria-modal="true">
        <div class="search" part="search">
          <span class="search-icon">${SEARCH}</span>
          <input id="input" part="input" type="text" role="combobox" aria-expanded="true" aria-controls="listbox"
            aria-autocomplete="list" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
            enterkeyhint="go" />
        </div>
        <div class="list" part="list" id="listbox" role="listbox"></div>
        <div class="empty" part="empty" hidden></div>
        <div class="hints" part="hints" aria-hidden="true"></div>
        <span class="sr" id="status" role="status" aria-live="polite"></span>
      </div>
    </div>
  `;

  let seq = 0;

  class KakaoCommandPalette extends HTMLElement {
    static get observedAttributes() {
      return ['list-data', 'hotkey', 'recent', 'label', 'placeholder', 'empty-text', 'inline', 'open'];
    }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      const $ = (sel) => shadow.querySelector(sel);
      this._overlay = $('.overlay');
      this._panel = $('.panel');
      this._input = $('input');
      this._list = $('.list');
      this._empty = $('.empty');
      this._hints = $('.hints');
      this._status = $('#status');

      this._uid = `kcp${++seq}`;
      this._commands = null; // set through the property; wins over list-data until that changes
      this._all = [];
      this._rows = []; // [{ el, cmd }] in list order
      this._active = -1;
      this._recent = [];
      this._hotkey = parseHotkey('Mod+K');
      this._applied = false;
      this._returnFocus = null;
      this._hasPopover = typeof HTMLElement.prototype.showPopover === 'function';

      this._onDocKeydown = this._onDocKeydown.bind(this);

      this._input.addEventListener('input', () => this._filter());
      this._input.addEventListener('keydown', (e) => this._onKeydown(e));
      shadow.querySelector('.scrim').addEventListener('click', () => this.close());
      // Keep focus in the field: rows, headings and hints are not focus stops.
      this._panel.addEventListener('pointerdown', (e) => {
        if (e.target !== this._input) e.preventDefault();
      });
      this._list.addEventListener('click', (e) => {
        const el = e.target instanceof Element ? e.target.closest('.option') : null;
        const index = el ? this._rows.findIndex((r) => r.el === el) : -1;
        if (index >= 0) this._run(index);
      });
      this._list.addEventListener('pointermove', (e) => {
        const el = e.target instanceof Element ? e.target.closest('.option') : null;
        if (!el || el.getAttribute('aria-disabled') === 'true') return;
        const index = this._rows.findIndex((r) => r.el === el);
        if (index >= 0 && index !== this._active) this._setActive(index, false);
      });
    }

    /* ---------------------------- Lifecycle ---------------------------- */

    connectedCallback() {
      // `commands` set before the element was defined is a plain property: take it over.
      if (Object.prototype.hasOwnProperty.call(this, 'commands')) {
        const value = this.commands;
        delete this.commands;
        this._commands = Array.isArray(value) ? value : null;
      }
      document.addEventListener('keydown', this._onDocKeydown, true);
      this._syncMode();
      this._syncTexts();
      this._load();
      this._renderHints();
      // Shortcuts and hints become keycaps once kakao-kbd is there.
      if (!customElements.get('kakao-kbd')) {
        customElements.whenDefined('kakao-kbd').then(() => {
          if (!this.isConnected) return;
          this._renderHints();
          this._filter(true);
        });
      }
      if (this.hasAttribute('open') && !this.hasAttribute('inline')) this._apply(true);
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this._onDocKeydown, true);
      if (this._applied) this._apply(false);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this.isConnected) return;
      switch (name) {
        case 'list-data':
          this._commands = null;
          this._load();
          break;
        case 'hotkey':
          this._hotkey = parseHotkey(newValue == null ? 'Mod+K' : newValue);
          break;
        case 'recent':
          this._recent = this._recent.slice(0, this._recentLimit());
          this._filter(true);
          break;
        case 'label':
        case 'placeholder':
          this._syncTexts();
          break;
        case 'empty-text':
          this._filter(true);
          break;
        case 'inline':
          if (this._applied) this._apply(false);
          this._syncMode();
          if (this.hasAttribute('open') && !this.hasAttribute('inline')) this._apply(true);
          break;
        case 'open':
          if (!this.hasAttribute('inline')) this._apply(this.hasAttribute('open'));
          break;
        default:
      }
    }

    /* ------------------------------ API ------------------------------ */

    get commands() {
      return this._all.map((c) => c.source);
    }

    set commands(value) {
      this._commands = Array.isArray(value) ? value : null;
      if (this.isConnected) this._load();
    }

    get recentIds() {
      return [...this._recent];
    }

    get isOpen() {
      return this.hasAttribute('inline') || this._applied;
    }

    open(query) {
      if (this.hasAttribute('inline')) return;
      this._pendingQuery = typeof query === 'string' ? query : '';
      if (this.hasAttribute('open')) {
        if (!this._applied) this._apply(true);
        return;
      }
      this.setAttribute('open', '');
    }

    close() {
      if (this.hasAttribute('inline')) return;
      this.removeAttribute('open');
      if (this._applied) this._apply(false);
    }

    toggle() {
      if (this._applied) this.close();
      else this.open();
    }

    /* ------------------------------ Mode ------------------------------ */

    _syncMode() {
      const inline = this.hasAttribute('inline');
      if (inline) {
        if (this._overlay.hasAttribute('popover')) this._overlay.removeAttribute('popover');
        this._panel.removeAttribute('aria-modal');
        this._panel.setAttribute('role', 'group');
      } else {
        if (this._hasPopover && !this._overlay.hasAttribute('popover')) this._overlay.setAttribute('popover', 'manual');
        this._panel.setAttribute('aria-modal', 'true');
        this._panel.setAttribute('role', 'dialog');
      }
    }

    _syncTexts() {
      const t = KakaoCommandPalette.texts;
      const label = this.getAttribute('label') || t.label;
      this._panel.setAttribute('aria-label', label);
      this._input.setAttribute('aria-label', label);
      this._list.setAttribute('aria-label', t.listbox);
      this._input.placeholder = this.getAttribute('placeholder') || t.placeholder;
    }

    _recentLimit() {
      if (!this.hasAttribute('recent')) return 0;
      const n = parseInt(this.getAttribute('recent'), 10);
      return Number.isFinite(n) && n >= 0 ? n : DEFAULT_RECENT;
    }

    /** Open or close for real. CSS draws the look; this does focus, scroll and the top layer. */
    _apply(on) {
      if (on === this._applied) return;
      this._applied = on;
      if (on) {
        this._returnFocus = deepActive();
        this._input.value = this._pendingQuery || '';
        this._pendingQuery = '';
        this._filter(true);
        this._overlay.classList.add('is-open');
        if (this._overlay.hasAttribute('popover')) {
          try { this._overlay.showPopover(); } catch (err) { /* already shown */ }
        }
        lockScroll();
        this._input.focus({ preventScroll: true });
        // Some browsers only accept focus once the top layer has drawn.
        requestAnimationFrame(() => {
          if (this._applied && this.shadowRoot.activeElement !== this._input) this._input.focus({ preventScroll: true });
        });
        this._dispatch('command-palette-open', {});
        return;
      }
      if (this._overlay.hasAttribute('popover')) {
        try { this._overlay.hidePopover(); } catch (err) { /* already hidden */ }
      }
      this._overlay.classList.remove('is-open');
      this._status.textContent = '';
      unlockScroll();
      const target = this._returnFocus;
      this._returnFocus = null;
      if (target && target.isConnected && typeof target.focus === 'function') target.focus({ preventScroll: true });
      this._dispatch('command-palette-close', {});
    }

    /* ----------------------------- Commands ----------------------------- */

    _load() {
      this._all = normalise(this._commands || this._parseList());
      const ids = new Set(this._all.map((c) => c.id));
      this._recent = this._recent.filter((id) => ids.has(id));
      this._list.classList.toggle('has-lead', this._all.some((c) => c.icon));
      this._filter(true);
    }

    _parseList() {
      const raw = this.getAttribute('list-data');
      if (!raw) return [];
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) return data;
        console.warn(`<${TAG_NAME}>: list-data must be a JSON array.`);
      } catch (err) {
        console.warn(`<${TAG_NAME}>: list-data is not valid JSON.`, err);
      }
      return [];
    }

    /**
     * Filters and draws the results for the text in the field.
     * @param {boolean} quiet  no status message (opening, a list change)
     */
    _filter(quiet) {
      const query = this._input.value;
      const words = foldText(query).split(/\s+/).filter(Boolean);
      const groups = []; // [{ name, items: [{ cmd, score, marks }], best, order }]
      const byName = new Map();
      const add = (name, entry, order) => {
        let g = byName.get(name);
        if (!g) {
          g = { name, items: [], best: -Infinity, order };
          byName.set(name, g);
          groups.push(g);
        }
        g.items.push(entry);
        g.best = Math.max(g.best, entry.score);
      };

      if (!words.length) {
        const limit = this._recentLimit();
        if (limit) {
          this._recent.slice(0, limit).forEach((id) => {
            const cmd = this._all.find((c) => c.id === id);
            if (cmd) add('\u0000recent', { cmd, score: 0, marks: null }, -1);
          });
        }
        this._all.forEach((cmd) => add(cmd.group, { cmd, score: 0, marks: null }, cmd.index));
      } else {
        this._all.forEach((cmd) => {
          const m = matchCommand(cmd, words);
          if (m) add(cmd.group, { cmd, score: m.score, marks: m.marks }, cmd.index);
        });
        groups.forEach((g) => g.items.sort((a, b) => b.score - a.score || a.cmd.index - b.cmd.index));
        groups.sort((a, b) => b.best - a.best || a.order - b.order);
      }

      this._draw(groups);

      const count = this._rows.length;
      const t = KakaoCommandPalette.texts;
      this._empty.hidden = count > 0;
      this._empty.textContent = count ? '' : (this.getAttribute('empty-text') || t.empty);
      if (!quiet) {
        this._status.textContent = count === 1 ? t.one : t.count.replace('{n}', String(count));
      }
      this._setActive(this._step(-1, 1), true);
    }

    _draw(groups) {
      const t = KakaoCommandPalette.texts;
      const kbd = !!customElements.get('kakao-kbd');
      const frag = document.createDocumentFragment();
      const rows = [];
      let n = 0;
      groups.forEach((g, gi) => {
        let parent = frag;
        const heading = g.name === '\u0000recent' ? t.recent : g.name;
        if (heading) {
          const group = document.createElement('div');
          group.className = 'group';
          group.setAttribute('role', 'group');
          const label = document.createElement('div');
          label.className = 'group-label';
          label.id = `${this._uid}-g${gi}`;
          label.setAttribute('role', 'presentation');
          label.textContent = heading;
          group.setAttribute('aria-labelledby', label.id);
          group.append(label);
          frag.append(group);
          parent = group;
        }
        g.items.forEach(({ cmd, marks }) => {
          const el = document.createElement('div');
          el.className = 'option';
          el.id = `${this._uid}-o${n++}`;
          el.setAttribute('role', 'option');
          el.setAttribute('aria-selected', 'false');
          if (cmd.disabled) el.setAttribute('aria-disabled', 'true');

          const lead = document.createElement('span');
          lead.className = 'lead';
          if (cmd.icon) lead.append(cmd.icon.cloneNode(true));

          const lbl = document.createElement('span');
          lbl.className = 'lbl';
          if (marks && marks.size) {
            let run = '';
            let marked = false;
            const flush = () => {
              if (!run) return;
              if (marked) {
                const m = document.createElement('mark');
                m.textContent = run;
                lbl.append(m);
              } else {
                lbl.append(run);
              }
              run = '';
            };
            cmd.prep.chars.forEach((c, i) => {
              const on = marks.has(i);
              if (on !== marked) { flush(); marked = on; }
              run += c;
            });
            flush();
          } else {
            lbl.textContent = cmd.label;
          }
          el.append(lead, lbl);

          if (cmd.shortcut) {
            const sc = document.createElement('span');
            sc.className = 'shortcut';
            if (kbd) {
              const k = document.createElement('kakao-kbd');
              k.setAttribute('size', 'sm');
              k.setAttribute('keys', cmd.shortcut);
              sc.append(k);
            } else {
              sc.textContent = cmd.shortcut;
            }
            el.append(sc);
          }
          parent.append(el);
          rows.push({ el, cmd });
        });
      });
      this._list.replaceChildren(frag);
      this._rows = rows;
      this._active = -1;
    }

    _renderHints() {
      const t = KakaoCommandPalette.texts;
      const kbd = !!customElements.get('kakao-kbd');
      const key = (name, glyph) => {
        if (kbd) {
          const k = document.createElement('kakao-kbd');
          k.setAttribute('size', 'sm');
          k.setAttribute('keys', name);
          return k;
        }
        const k = document.createElement('kbd');
        k.textContent = glyph;
        return k;
      };
      const hint = (keys, text) => {
        const span = document.createElement('span');
        span.className = 'hint';
        keys.forEach(([name, glyph]) => span.append(key(name, glyph)));
        span.append(text);
        return span;
      };
      this._hints.replaceChildren(
        hint([['Up', '↑'], ['Down', '↓']], t.move),
        hint([['Enter', '↵']], t.run),
        hint([['Esc', 'Esc']], t.close),
      );
    }

    /* ----------------------------- Active ----------------------------- */

    /** Next enabled row from `from` in direction `dir`, without wrapping; -1 when none. */
    _step(from, dir) {
      for (let i = from + dir; i >= 0 && i < this._rows.length; i += dir) {
        if (!this._rows[i].cmd.disabled) return i;
      }
      return -1;
    }

    _setActive(index, scroll) {
      const prev = this._rows[this._active];
      if (prev) {
        prev.el.removeAttribute('data-active');
        prev.el.setAttribute('aria-selected', 'false');
      }
      this._active = index;
      const row = this._rows[index];
      if (!row) {
        this._input.removeAttribute('aria-activedescendant');
        return;
      }
      row.el.setAttribute('data-active', '');
      row.el.setAttribute('aria-selected', 'true'); // the active option is the selected one (APG)
      this._input.setAttribute('aria-activedescendant', row.el.id);
      if (scroll) {
        // The group heading of the first row scrolls in with it.
        const first = this._step(-1, 1) === index;
        if (first) this._list.scrollTop = 0;
        else row.el.scrollIntoView({ block: 'nearest' });
      }
    }

    _move(dir) {
      if (!this._rows.length) return;
      let next = this._step(this._active, dir);
      if (next < 0) next = this._step(dir > 0 ? -1 : this._rows.length, dir); // wrap
      if (next >= 0) this._setActive(next, true);
    }

    _jump(dir, count) {
      let index = this._active;
      for (let k = 0; k < count; k += 1) {
        const next = this._step(index, dir);
        if (next < 0) break;
        index = next;
      }
      if (index >= 0 && index !== this._active) this._setActive(index, true);
    }

    /* ----------------------------- Keyboard ----------------------------- */

    _onDocKeydown(e) {
      if (!this._hotkey || this.hasAttribute('inline') || e.defaultPrevented || e.repeat) return;
      if (!hotkeyMatches(this._hotkey, e)) return;
      const combo = this._hotkey;
      if (!combo.ctrl && !combo.meta && !combo.alt && !this._applied && isEditable(deepActive())) return;
      e.preventDefault();
      this.toggle();
    }

    _onKeydown(e) {
      if (e.isComposing) return;
      const inline = this.hasAttribute('inline');
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this._move(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this._move(-1);
          break;
        case 'Home':
          if (e.shiftKey) return;
          e.preventDefault();
          this._setActive(this._step(-1, 1), true);
          break;
        case 'End':
          if (e.shiftKey) return;
          e.preventDefault();
          this._setActive(this._step(this._rows.length, -1), true);
          break;
        case 'PageDown':
          e.preventDefault();
          this._jump(1, PAGE_STEP);
          break;
        case 'PageUp':
          e.preventDefault();
          this._jump(-1, PAGE_STEP);
          break;
        case 'Enter':
          if (this._active < 0) return;
          e.preventDefault();
          this._run(this._active);
          break;
        case 'Escape':
          if (inline) {
            if (!this._input.value) return;
            e.preventDefault();
            this._input.value = '';
            this._filter();
            return;
          }
          // Stop here, so a dialog underneath does not close as well.
          e.preventDefault();
          e.stopPropagation();
          this.close();
          break;
        case 'Tab':
          if (inline) return;
          // The field is the only focus stop of the modal palette.
          e.preventDefault();
          e.stopPropagation();
          break;
        default:
      }
    }

    /* ------------------------------- Run ------------------------------- */

    _run(index) {
      const row = this._rows[index];
      if (!row || row.cmd.disabled) return;
      const cmd = row.cmd;
      const limit = this._recentLimit();
      if (limit) this._recent = [cmd.id, ...this._recent.filter((id) => id !== cmd.id)].slice(0, limit);

      if (!this.hasAttribute('inline')) this.close();
      else {
        this._input.value = '';
        this._filter(true);
      }

      const detail = { id: cmd.id, value: cmd.value, command: cmd.source };
      const event = new CustomEvent('command-select', { detail, bubbles: true, composed: true, cancelable: true });
      const go = this.dispatchEvent(event);
      if (typeof KakaoComponents !== 'undefined') KakaoComponents.emit(this, 'command-select', detail);
      if (!go || !cmd.href) return;
      if (cmd.target && cmd.target !== '_self') window.open(cmd.href, cmd.target, cmd.target === '_blank' ? 'noopener' : '');
      else window.location.assign(cmd.href);
    }

    _dispatch(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
  }

  KakaoCommandPalette.texts = {
    label: 'Command palette',
    placeholder: 'Search commands…',
    empty: 'No matching commands',
    recent: 'Recent',
    listbox: 'Commands',
    count: '{n} commands',
    one: '1 command',
    move: 'to move',
    run: 'to run',
    close: 'to close',
  };

  window.KakaoCommandPalette = KakaoCommandPalette;
  customElements.define(TAG_NAME, KakaoCommandPalette);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: ['command-select'] });
  }
})();
