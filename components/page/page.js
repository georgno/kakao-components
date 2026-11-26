/**
 * <kakao-page>
 * ============================================================================
 * The page container: centres the page's content at a readable maximum
 * width, pads its sides (and a phone's notch), starts just below the sticky
 * header bar and keeps its end clear of a fixed kakao-action-bar.
 * Light DOM: page.css draws it, so a server-rendered page is laid out before
 * (and without) this script; the script only defines the tag.
 * Vanilla JS, no deps.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        The page's content column: max-width, side padding, space below
 *             the header bar.
 *  not for    Columns of cards: kakao-grid; space between sections:
 *             kakao-flow; a framed box: kakao-card.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     page.js
 *  css        page.css   (light DOM: load it in the page head)
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="page.css">
 *   <script src="page.js" defer><\/script>
 *
 *   <body>
 *     <kakao-header-bar>…</kakao-header-bar>
 *     <main>
 *       <kakao-page>
 *         <kakao-flow gap="lg">…sections…</kakao-flow>
 *       </kakao-page>
 *     </main>
 *   </body>
 *
 * It is not a landmark: keep the <main> (around it or inside it). Give the
 * page's body no padding of its own; the container brings it.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  width     narrow · normal (default) · wide · full: the maximum width,
 *            padding included (45rem: one column of text or a form; 72rem;
 *            96rem: tables and dashboards; none).
 *  hidden    Not shown.
 *
 * ----------------------------------------------------------------------------
 * SLOTS
 * ----------------------------------------------------------------------------
 *  None: light DOM, the children are the page's content as written.
 *
 * ----------------------------------------------------------------------------
 * BEHAVIOUR
 * ----------------------------------------------------------------------------
 *  - Top padding: --kakao-space-below-bar (the header bar is sticky, so the
 *    content starts right below it).
 *  - Bottom padding: 4rem plus --kakao-action-bar-rendered-height, which a
 *    fixed kakao-action-bar writes to the root while it is shown: the end of
 *    the page stays reachable above the bar.
 *  - Side padding: at least the safe-area insets (a phone held sideways).
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block in page.css; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-page-max-width / -narrow-width / -wide-width
 *  --kakao-page-padding-x / -padding-top / -padding-bottom
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-page';
  if (customElements.get(TAG_NAME)) return;

  // No behaviour: page.css lays it out. Defining the tag lets the loader and
  // :defined treat it like every other component.
  class KakaoPage extends HTMLElement {}

  customElements.define(TAG_NAME, KakaoPage);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }
})();
