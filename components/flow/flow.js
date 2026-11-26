/**
 * <kakao-flow>
 * ============================================================================
 * A vertical flow: one consistent gap between its children, none before the
 * first or after the last, whatever margins the page gives headings and
 * paragraphs. For the sections of a page, the fields of a form, the blocks
 * of a card. Light DOM: flow.css draws it, so a server-rendered page is
 * spaced before (and without) this script; the script only defines the tag.
 * Vanilla JS, no deps.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        Even vertical space between blocks: sections, form fields,
 *             paragraphs and cards.
 *  not for    Columns: kakao-grid; a pile of overlapping cards: kakao-stack;
 *             a row of buttons: a flex row.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     flow.js
 *  css        flow.css   (light DOM: load it in the page head)
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="flow.css">
 *   <script src="flow.js" defer><\/script>
 *
 *   <kakao-flow gap="lg">
 *     <section>
 *       <kakao-flow gap="sm">
 *         <h2>Results</h2>
 *         <p>12 checks passed.</p>
 *       </kakao-flow>
 *     </section>
 *     <kakao-grid>…</kakao-grid>
 *   </kakao-flow>
 *
 * Every element child is a block in the flow: put inline content (links,
 * buttons in a row) in a <p> or <div> of its own. Children's own top and
 * bottom margins are replaced by the gap. Hidden children (hidden, script,
 * style, template) take no gap. A flow inside a flow sits at its parent's
 * gap and spaces its own children by its own.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  gap       sm · md (default) · lg: the space between children, from the
 *            spacing tokens (0.5rem: a heading and its text; 1rem: blocks;
 *            2rem: sections).
 *  hidden    Not shown.
 *
 * ----------------------------------------------------------------------------
 * SLOTS
 * ----------------------------------------------------------------------------
 *  None: light DOM, every element child is a block of the flow.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block in flow.css; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-flow-gap / -gap-sm / -gap-lg
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-flow';
  if (customElements.get(TAG_NAME)) return;

  // No behaviour: flow.css spaces it. Defining the tag lets the loader and
  // :defined treat it like every other component.
  class KakaoFlow extends HTMLElement {}

  customElements.define(TAG_NAME, KakaoFlow);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }
})();
