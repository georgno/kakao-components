/**
 * <kakao-grid>
 * ============================================================================
 * A responsive grid: as many equal columns as fit at a minimum width, one
 * column on a phone, with a token gap. For cards, stat tiles, fields side by
 * side. Light DOM: grid.css draws it, so a server-rendered grid is laid out
 * before (and without) this script; the script only defines the tag.
 * Vanilla JS, no deps.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        Columns that wrap by width: cards, stat tiles, fields side by
 *             side.
 *  not for    Rows of data: kakao-table or kakao-grid-view; one column of
 *             sections: kakao-flow; a pile of cards: kakao-stack.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     grid.js
 *  css        grid.css   (light DOM: load it in the page head)
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="grid.css">
 *   <script src="grid.js" defer><\/script>
 *
 *   <kakao-grid min="sm">
 *     <kakao-card>…</kakao-card>
 *     <kakao-card>…</kakao-card>
 *     <kakao-card>…</kakao-card>
 *   </kakao-grid>
 *
 *   Any minimum width: <kakao-grid style="--kakao-grid-min: 14rem">
 *
 * Every element child is one cell; the cells of a row are equally tall.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  min       sm · md (default) · lg: the narrowest a column gets (12rem,
 *            18rem, 24rem); never wider than the grid, so a phone shows one
 *            column. Without it, --kakao-grid-min sets any length.
 *  gap       sm · md (default) · lg: the space between cells, from the
 *            spacing tokens (0.5rem, 1rem, 2rem).
 *  fill      Boolean. Keeps the empty columns: one or two items stay one
 *            column wide instead of stretching across the row.
 *  hidden    Not shown.
 *
 * ----------------------------------------------------------------------------
 * SLOTS
 * ----------------------------------------------------------------------------
 *  None: light DOM, every element child is a cell.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  Layout only: the reading and tab order is the source order, row by row.
 *  Don't reorder cells with CSS.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block in grid.css; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-grid-min / -min-sm / -min-lg
 *  --kakao-grid-gap / -gap-sm / -gap-lg
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-grid';
  if (customElements.get(TAG_NAME)) return;

  // No behaviour: grid.css lays it out. Defining the tag lets the loader and
  // :defined treat it like every other component.
  class KakaoGrid extends HTMLElement {}

  customElements.define(TAG_NAME, KakaoGrid);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }
})();
