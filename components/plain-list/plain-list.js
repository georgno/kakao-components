/**
 * <kakao-plain-list>
 * ============================================================================
 * A plain styled list of short items: file:line references, test names,
 * findings. Wraps a <ul> or <ol>: even spacing, muted markers, long paths
 * that wrap on a phone, and an aligned column of leading badges or icons.
 * Light DOM: plain-list.css draws it, so a server-rendered list looks right
 * before (and without) this script; the script only defines the tag and
 * keeps the list a list for screen readers (role="list").
 * Vanilla JS, no deps.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        Short items in a list: file:line references, test names,
 *             findings, optionally with a leading badge or icon.
 *  not for    A 3D picker: kakao-list; label and value pairs:
 *             kakao-description-list; rows with several columns: kakao-table.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     plain-list.js
 *  css        plain-list.css   (light DOM: load it in the page head)
 *  requires   none
 *  enhanced   none
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="plain-list.css">
 *   <script src="plain-list.js" defer><\/script>
 *
 *   <kakao-plain-list>
 *     <ul role="list">
 *       <li><kakao-code>src/app.js:42</kakao-code> Missing label</li>
 *       <li><kakao-code>src/form.js:7</kakao-code> Unused variable</li>
 *     </ul>
 *   </kakao-plain-list>
 *
 *   <kakao-plain-list>
 *     <ul role="list">
 *       <li><kakao-badge tone="success">Pass</kakao-badge> saves a draft</li>
 *       <li><kakao-badge tone="danger">Fail</kakao-badge> sends the form</li>
 *     </ul>
 *   </kakao-plain-list>
 *
 * One <ul> or <ol> as the only child. A lead is the item's FIRST element when
 * it is a kakao-badge, an <i class="…"> icon (Font Awesome) or any element marked
 * data-lead (wrap an <svg> or <img> in <span data-lead>); put it before any
 * text. When the items have leads, the leads form one column as wide as the
 * widest and replace the markers: give every item one (an empty
 * <span data-lead></span> keeps the column). An icon that only decorates
 * gets aria-hidden="true"; one that carries meaning gets a label or text.
 * role="list" in the markup keeps the list a list in Safari without the
 * script (Safari drops it when the markers are hidden); the script adds it.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  marker    auto (default: bullets for <ul>, numbers for <ol>) · none.
 *            Leads replace the markers either way.
 *  size      sm · md (default): sm is smaller text with tighter gaps, for
 *            dense reports.
 *  hidden    Not shown (also on a single <li>: it leaves no gap).
 *
 * ----------------------------------------------------------------------------
 * SLOTS
 * ----------------------------------------------------------------------------
 *  None: light DOM, the child <ul> or <ol> is the list.
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  A native list: read as "list, 3 items", in source order. A lead is read
 *  first, as part of its item ("Fail, sends the form").
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block in plain-list.css; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-plain-list-gap / -gap-sm       space between items
 *  --kakao-plain-list-font-size-sm        text size at size="sm"
 *  --kakao-plain-list-indent              room for the markers
 *  --kakao-plain-list-marker-color
 *  --kakao-plain-list-lead-gap            space between a lead and its text
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-plain-list';
  if (customElements.get(TAG_NAME)) return;

  // Drawing is plain-list.css's job. The script only keeps the list a list:
  // Safari drops the list role when the markers are hidden, unless it is set.
  class KakaoPlainList extends HTMLElement {
    connectedCallback() {
      this._markLists();
      if (!this._observer) {
        this._observer = new MutationObserver(() => this._markLists());
      }
      this._observer.observe(this, { childList: true });
    }

    disconnectedCallback() {
      if (this._observer) this._observer.disconnect();
    }

    _markLists() {
      for (const list of this.children) {
        if ((list.localName === 'ul' || list.localName === 'ol') && !list.hasAttribute('role')) {
          list.setAttribute('role', 'list');
        }
      }
    }
  }

  customElements.define(TAG_NAME, KakaoPlainList);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }
})();
