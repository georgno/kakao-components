/**
 * <kakao-kbd>
 * ============================================================================
 * Keyboard keys as keycaps: a single key ("Esc"), a combination ("Ctrl + K")
 * or a sequence ("G then I"). Small and inline: it sits in running text, next
 * to menu items and beside buttons. Not interactive: it never takes focus.
 * Vanilla JS, Shadow DOM, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <script src="kbd.js"><\/script>
 *
 *   <kakao-kbd>Esc</kakao-kbd>
 *   <kakao-kbd>Ctrl+Shift+P</kakao-kbd>
 *   <kakao-kbd keys="Mod+K"></kakao-kbd>          ⌘ K on a Mac, Ctrl + K elsewhere
 *   <kakao-kbd keys="G I"></kakao-kbd>            a sequence: G then I
 *   <kakao-kbd size="sm" keys="Mod+S"></kakao-kbd>
 *
 * The keys come from the `keys` attribute or, without it, from the element's
 * text (which is also what shows when the script has not loaded). In both:
 *   +       joins the keys of one combination (spaces around it are ignored)
 *   space   separates the steps of a sequence
 *   A "+" key is written `Plus` (or as the last key: `Ctrl++`), a space `Space`.
 *
 * ----------------------------------------------------------------------------
 * KEY NAMES (case does not matter; anything else is shown as written)
 * ----------------------------------------------------------------------------
 *   Mod                 the platform's main modifier: Command on a Mac, Ctrl elsewhere
 *   Cmd / Command / Meta, Ctrl / Control, Alt / Option / Opt, Shift,
 *   Enter / Return, Backspace, Tab
 *                       on a Mac drawn as the key's symbol, elsewhere as a word
 *   Up / Down / Left / Right (or ArrowUp …)
 *                       always drawn as arrows
 *   Esc / Escape, Space, Del / Delete, Home, End, PageUp, PageDown, Plus
 *                       a word
 *   The Mac symbols themselves (⌘ ⌃ ⌥ ⇧ ↵ ⌫ ⇥ ← ↑ → ↓) are understood as those keys.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  keys         The keys (see above). Wins over the text content.
 *  platform     auto (default: detected from the browser) · mac · other.
 *               Decides what Mod means and whether modifiers are symbols.
 *  size         md (default) · sm
 *  outline      No fill; border and text take the surrounding text colour, so
 *               the keys work on any background (a tooltip, a coloured row).
 *  then-label   The word between the steps of a sequence. Default "then".
 *  list-data    JSON object that renames keys, e.g. for another language:
 *               {"ctrl": "Strg", "enter": "Eingabe", "esc": "Abbruch"}.
 *               Keys are the names above in lower case (the main one of each
 *               line: cmd, ctrl, alt, shift, enter, backspace, tab, esc, space,
 *               del, home, end, pageup, pagedown, up, down, left, right). The
 *               name replaces the word, and what a screen reader says for a symbol.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  Renders the HTML pattern for key input: one <kbd> around a <kbd> per key.
 *  A key drawn as a symbol carries its name as hidden text ("Command",
 *  "Up arrow"); combinations read "Control + K", sequences "G then I".
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-kbd-height / -padding-x / -font-size / -radius          (md)
 *  --kakao-kbd-sm-height / -sm-padding-x / -sm-font-size / -sm-radius
 *  --kakao-kbd-font-family / -font-weight / -glyph-size / -gap
 *  --kakao-kbd-fill / -text / -border / -edge / -edge-width / -separator
 *  --kakao-kbd-outline-mix   share of the text colour in the outline border
 *
 * Parts: kbd (the whole), key (one keycap), separator ("+" and "then").
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-kbd';
  if (customElements.get(TAG_NAME)) return;

  /* Glyphs: 16 × 16, stroked in currentColor. */
  const GLYPHS = {
    cmd: 'M6 6V4.5A1.5 1.5 0 1 0 4.5 6H6Zm0 0h4m-4 0v4m4-4V4.5A1.5 1.5 0 1 1 11.5 6H10Zm0 0v4m0 0h1.5A1.5 1.5 0 1 1 10 11.5V10Zm0 0H6m0 0H4.5A1.5 1.5 0 1 0 6 11.5V10Z',
    ctrl: 'M4 8.5l4-4 4 4',
    alt: 'M2.5 4.5H6l4 7h3.5M9.5 4.5h4',
    shift: 'M8 2.5L2.5 8.5h3V13h5V8.5h3Z',
    enter: 'M12.5 3.5V9h-9m3-3l-3 3 3 3',
    backspace: 'M6 3.5h7.5v9H6L2 8Zm2.5 3l3 3m0-3l-3 3',
    tab: 'M2 8h8.5m-3-3l3 3-3 3M13.5 4v8',
    up: 'M8 13V3M4 7l4-4 4 4',
    down: 'M8 3v10M4 9l4 4 4-4',
    left: 'M13 8H3m4-4L3 8l4 4',
    right: 'M3 8h10M9 4l4 4-4 4',
  };

  /* word: the key as text; name: what a screen reader says for the symbol, or
     for a short word; mac: drawn as its symbol on a Mac; always: drawn as its
     symbol everywhere. */
  const KEYS = {
    cmd: { word: 'Meta', name: 'Command', mac: true },
    ctrl: { word: 'Ctrl', name: 'Control', mac: true },
    alt: { word: 'Alt', name: 'Option', mac: true },
    shift: { word: 'Shift', name: 'Shift', mac: true },
    enter: { word: 'Enter', name: 'Return', mac: true },
    backspace: { word: 'Backspace', name: 'Delete', mac: true },
    tab: { word: 'Tab', name: 'Tab', mac: true },
    up: { name: 'Up arrow', always: true },
    down: { name: 'Down arrow', always: true },
    left: { name: 'Left arrow', always: true },
    right: { name: 'Right arrow', always: true },
    esc: { word: 'Esc', name: 'Escape' },
    space: { word: 'Space' },
    del: { word: 'Del', name: 'Delete' },
    home: { word: 'Home' },
    end: { word: 'End' },
    pageup: { word: 'Page up' },
    pagedown: { word: 'Page down' },
    plus: { word: '+', name: 'Plus' },
  };

  const ALIASES = {
    command: 'cmd', meta: 'cmd', '⌘': 'cmd',
    control: 'ctrl', '⌃': 'ctrl',
    option: 'alt', opt: 'alt', '⌥': 'alt',
    '⇧': 'shift',
    return: 'enter', '↵': 'enter', '⏎': 'enter',
    '⌫': 'backspace', '⇥': 'tab',
    arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right',
    '↑': 'up', '↓': 'down', '←': 'left', '→': 'right',
    escape: 'esc', delete: 'del', '+': 'plus',
  };

  function detectMac() {
    const nav = window.navigator || {};
    const platform = (nav.userAgentData && nav.userAgentData.platform) || nav.platform || '';
    return /mac|iphone|ipad|ipod/i.test(platform);
  }

  /* "Ctrl + K  Ctrl+S" → [["Ctrl","K"],["Ctrl","S"]] */
  function parse(text) {
    const steps = String(text || '').trim().replace(/\s*\+\s*/g, '+').split(/\s+/).filter(Boolean);
    return steps.map((step) => {
      const keys = [];
      const parts = step.split('+');
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] !== '') { keys.push(parts[i]); continue; }
        /* An empty part is a "+" key ("Ctrl++", or "+" alone): it takes the
           empty part after it, too. */
        if (i < parts.length - 1) { keys.push('+'); i++; }
      }
      return keys;
    }).filter((keys) => keys.length);
  }

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        /* @kakao-settings:start prefix=--kakao-kbd- (written by construction.html, edit there) */
        --_height: var(--kakao-kbd-height, 1.5rem);
        --_padding-x: var(--kakao-kbd-padding-x, 0.4rem);
        --_font-size: var(--kakao-kbd-font-size, 0.75rem);
        --_radius: var(--kakao-kbd-radius, var(--kakao-radius-sm, 6px));
        --_sm-height: var(--kakao-kbd-sm-height, 1.25rem);
        --_sm-padding-x: var(--kakao-kbd-sm-padding-x, 0.3rem);
        --_sm-font-size: var(--kakao-kbd-sm-font-size, 0.6875rem);
        --_sm-radius: var(--kakao-kbd-sm-radius, var(--kakao-radius-xs, 4px));
        --_font-family: var(--kakao-kbd-font-family, inherit);
        --_font-weight: var(--kakao-kbd-font-weight, 600);
        --_glyph-size: var(--kakao-kbd-glyph-size, 1.1em);
        --_gap: var(--kakao-kbd-gap, 0.2rem);
        --_fill: var(--kakao-kbd-fill, var(--kakao-color-subtle, #f0f0f1));
        --_text: var(--kakao-kbd-text, var(--kakao-color-text, #18181b));
        --_border: var(--kakao-kbd-border, var(--kakao-color-line, #e5e7eb));
        --_edge: var(--kakao-kbd-edge, var(--kakao-color-line, #e5e7eb));
        --_edge-width: var(--kakao-kbd-edge-width, 1px);
        --_separator: var(--kakao-kbd-separator, var(--kakao-color-muted, #62626c));
        --_outline-mix: var(--kakao-kbd-outline-mix, 45%);
        /* @kakao-settings:end */
        display: inline-block;
        vertical-align: middle;
        max-width: 100%;
        /* The keycap's lower edge is a shadow: leave it room in a line of text. */
        margin-block: 0 var(--_edge-width);
      }
      :host([hidden]) { display: none; }
      :host([size="sm"]) {
        --_height: var(--_sm-height);
        --_padding-x: var(--_sm-padding-x);
        --_font-size: var(--_sm-font-size);
        --_radius: var(--_sm-radius);
      }

      kbd { font: inherit; }

      .kbd {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--_gap);
        max-width: 100%;
        font-family: var(--_font-family);
        font-size: var(--_font-size);
        font-weight: var(--_font-weight);
        font-style: normal;
        line-height: 1;
        letter-spacing: normal;
        white-space: nowrap;
      }

      .key {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        box-sizing: border-box;
        min-width: var(--_height);
        height: var(--_height);
        padding: 0 var(--_padding-x);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        background: var(--_fill);
        box-shadow: 0 var(--_edge-width) 0 var(--_edge);
        color: var(--_text);
      }
      .key svg {
        display: block;
        width: var(--_glyph-size);
        height: var(--_glyph-size);
        fill: none;
        stroke: currentColor;
        stroke-width: 1.5;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .sep {
        color: var(--_separator);
        font-weight: 400;
      }

      :host([outline]) .key {
        background: transparent;
        border-color: color-mix(in srgb, currentColor var(--_outline-mix), transparent);
        box-shadow: 0 var(--_edge-width) 0 color-mix(in srgb, currentColor var(--_outline-mix), transparent);
        color: inherit;
      }
      :host([outline]) .sep { color: inherit; opacity: 0.75; }

      .sr {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      @media (forced-colors: active) {
        .key, :host([outline]) .key { border-color: CanvasText; box-shadow: none; }
      }
    </style>
    <kbd class="kbd" part="kbd"></kbd>
  `;

  class KakaoKbd extends HTMLElement {
    static get observedAttributes() {
      return ['keys', 'platform', 'then-label', 'list-data'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).appendChild(TEMPLATE.content.cloneNode(true));
      this._box = this.shadowRoot.querySelector('.kbd');
      this._observer = new MutationObserver(() => this._render());
    }

    connectedCallback() {
      /* The text is the fallback source; follow it when a script changes it. */
      this._observer.observe(this, { childList: true, characterData: true, subtree: true });
      this._render();
    }

    disconnectedCallback() {
      this._observer.disconnect();
    }

    attributeChangedCallback() {
      if (this.isConnected) this._render();
    }

    /** The keys as parsed: an array of steps, each an array of key names. */
    get parsedKeys() {
      return parse(this.hasAttribute('keys') ? this.getAttribute('keys') : this.textContent);
    }

    _isMac() {
      const platform = (this.getAttribute('platform') || 'auto').toLowerCase();
      if (platform === 'mac') return true;
      if (platform === 'other') return false;
      return detectMac();
    }

    _labels() {
      const raw = this.getAttribute('list-data');
      if (!raw) return {};
      try {
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
        const labels = {};
        Object.keys(data).forEach((key) => {
          const id = key.toLowerCase();
          if (typeof data[key] === 'string' && data[key]) labels[ALIASES[id] || id] = data[key];
        });
        return labels;
      } catch (error) {
        return {};
      }
    }

    _key(token, mac, labels) {
      let id = token.toLowerCase();
      id = ALIASES[id] || id;
      if (id === 'mod') id = mac ? 'cmd' : 'ctrl';
      const def = KEYS[id];
      const key = document.createElement('kbd');
      key.className = 'key';
      key.setAttribute('part', 'key');
      key.dataset.key = def ? id : token;

      if (!def) {
        key.textContent = labels[id] || token;
        return key;
      }
      const glyph = GLYPHS[id] && (def.always || (def.mac && mac));
      if (glyph) {
        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 16 16');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', GLYPHS[id]);
        svg.appendChild(path);
        const name = document.createElement('span');
        name.className = 'sr';
        name.textContent = labels[id] || def.name || def.word;
        key.append(svg, name);
        return key;
      }
      if (labels[id]) {
        key.textContent = labels[id];
        return key;
      }
      /* A word, with a fuller name for screen readers where the word is short
         for something ("Esc", "+"). */
      const word = def.word;
      if (def.name && !def.mac) {
        const shown = document.createElement('span');
        shown.setAttribute('aria-hidden', 'true');
        shown.textContent = word;
        const spoken = document.createElement('span');
        spoken.className = 'sr';
        spoken.textContent = def.name;
        key.append(shown, spoken);
      } else {
        key.textContent = word;
      }
      return key;
    }

    _separator(text, visible) {
      const sep = document.createElement('span');
      sep.className = visible ? 'sep' : 'sr';
      if (visible) sep.setAttribute('part', 'separator');
      sep.textContent = ' ' + text + ' ';
      return sep;
    }

    _render() {
      const mac = this._isMac();
      const labels = this._labels();
      const steps = this.parsedKeys;
      const then = this.getAttribute('then-label') || 'then';
      const nodes = [];
      steps.forEach((keys, stepIndex) => {
        if (stepIndex) nodes.push(this._separator(then, true));
        keys.forEach((token, keyIndex) => {
          /* A Mac shows the keys of a combination side by side; the "+" is
             then only spoken. */
          if (keyIndex) nodes.push(this._separator('+', !mac));
          nodes.push(this._key(token, mac, labels));
        });
      });
      this._box.replaceChildren(...nodes);
      this._box.hidden = !nodes.length;
    }
  }

  customElements.define(TAG_NAME, KakaoKbd);
})();
