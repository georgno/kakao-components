/**
 * <kakao-code>
 * ============================================================================
 * Inline code in running text: a file:line reference, a command, a setting
 * name. Monospace on a tinted fill, wrapping anywhere on a narrow screen.
 * Light DOM: code.css draws it, so it looks right before (and without) this
 * script; the script only keeps translators off it (translate="no").
 * Vanilla JS, no deps.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        Code in a sentence: a file:line reference, a command, a name.
 *  not for    Several lines or a log: kakao-code-block; keyboard keys: kakao-kbd.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     code.js
 *  css        code.css   (light DOM: load it in the page head)
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="code.css">
 *   <script src="code.js" defer><\/script>
 *
 *   Fails at <kakao-code>src/app.js:42</kakao-code>.
 *   <a href="/blob/src/app.js#L42"><kakao-code>src/app.js:42</kakao-code></a>
 *
 * The content is the element's text, like any text in the page: write < and &
 * as &lt; and &amp; (a server's HTML escaping does that).
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  hidden        Not shown.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  Plain text to assistive technology, read as part of its sentence. The
 *  text takes the surrounding colour (so a reference in a link still looks
 *  like a link); the fill only groups it. With forced colours it gets a thin
 *  outline instead of the fill.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block in code.css; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-code-font / -font-size        the monospace token; size in em of the text
 *  --kakao-code-bg
 *  --kakao-code-padding-x / -padding-y / -radius
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-code';
  if (customElements.get(TAG_NAME)) return;

  class KakaoCode extends HTMLElement {
    connectedCallback() {
      // A translation would turn a path or a command into something else.
      if (!this.hasAttribute('translate')) this.setAttribute('translate', 'no');
    }
  }

  customElements.define(TAG_NAME, KakaoCode);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }
})();
