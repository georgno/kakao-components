/**
 * <kakao-section-header>
 * ============================================================================
 * The heading row of a page section: a real heading (h2 to h6), an optional
 * count or count badge, a muted line of description and actions at the end
 * of the row ("Findings 12 · Six need a fix before the release · Export").
 * Light DOM: the script renders the heading into the page itself, so it is
 * part of the page's outline, kakao-toc lists it and #id links reach it;
 * section-header.css lays it out. Vanilla JS, no deps.
 *
 * Why not shadow DOM: a heading in a shadow root is in the accessibility
 * tree, but the page can't see it. kakao-toc (and any outline script) finds
 * headings with querySelectorAll, which doesn't cross into a shadow root, and
 * neither do #fragment links or :target. Here the heading is the point of
 * the component, so it lives in the light DOM.
 *
 * ----------------------------------------------------------------------------
 * CATALOG
 * ----------------------------------------------------------------------------
 *  for        The heading row of a section: a heading, a count, a line of
 *             description and actions ("Findings 12 · Export").
 *  not for    The page's top bar: kakao-header-bar; a framed box with a
 *             title: kakao-card; a heading alone: h2 to h6.
 *
 * ----------------------------------------------------------------------------
 * FILES
 * ----------------------------------------------------------------------------
 *  script     section-header.js
 *  css        section-header.css   (light DOM: load it in the page head)
 *  requires   none
 *  enhanced   badge
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="section-header.css">
 *   <script src="section-header.js" defer><\/script>
 *
 *   <kakao-section-header heading="Findings" count="12"
 *     description="Six need a fix before the release.">
 *     <kakao-button slot="actions" label="Export" variant="secondary" size="sm"></kakao-button>
 *   </kakao-section-header>
 *
 *   <kakao-section-header heading="Failed tests" level="3" count="3" count-tone="danger"
 *     count-label="3 failed"></kakao-section-header>
 *
 * Renders, in the light DOM: <div class="kakao-section-header-text"> with the
 * <hN class="kakao-section-header-heading"> and the description, then
 * <div class="kakao-section-header-actions"> holding the actions. Give the
 * element an id to link to the section; kakao-toc gives the heading one.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  heading      The heading text (plain text, never HTML). Without it no
 *               heading is rendered.
 *  level        2 (default) · 3 · 4 · 5 · 6: the heading element, h2 to h6.
 *               Pick the level that fits the page's outline (h1 is the
 *               page title); it also sets the size (h4 to h6 look alike).
 *  count        A number (or short text: "12+") after the heading text, in
 *               the heading: read as part of it ("Findings 12"). 0 is shown.
 *  count-tone   neutral · primary · success · warning · danger: draws the
 *               count as a kakao-badge of that tone (load badge.js; without
 *               it the count is plain text). Without count-tone the count is
 *               muted text.
 *  count-label  What a screen reader reads instead of the bare count
 *               ("3 failed"); the visible count stays the number.
 *  description  A muted line under the heading (plain text), or a child with
 *               slot="description" for richer text (links, kakao-code).
 *  hidden       Not shown.
 *
 * ----------------------------------------------------------------------------
 * SLOTS
 * ----------------------------------------------------------------------------
 *  actions      Buttons or links at the end of the heading row; they wrap
 *               below the text when the row is too narrow (a phone). Light
 *               DOM: children are moved into the actions box, in order; any
 *               child without a slot goes there too.
 *  description  Rich description under the heading (instead of the
 *               description attribute).
 *
 * ----------------------------------------------------------------------------
 * ACCESSIBILITY
 * ----------------------------------------------------------------------------
 *  A native heading of the given level, named by its text and the count
 *  ("Findings, heading level 2", then "12", or count-label). The heading gets
 *  data-toc-title with the text alone, so kakao-toc lists "Findings", not
 *  "Findings 12". The description is plain text after the heading; the
 *  actions follow in source order (Tab order = visual order). Nothing moves,
 *  so there is nothing to reduce for prefers-reduced-motion.
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in the settings block in section-header.css; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-section-header-gap / -row-gap   between the text and the actions
 *  --kakao-section-header-actions-gap      between the actions
 *  --kakao-section-header-description-gap  between the heading and the description
 *  --kakao-section-header-text-min         text width below which the actions wrap
 *  --kakao-section-header-font-size-2 / -3 / -4 (h4 to h6) / -font-weight / -line-height
 *  --kakao-section-header-description-size / -muted
 *
 * force: a boolean attribute read only by the style checker
 * (tools/style-check.js). It marks this placement as a deliberate exception
 * to the style rules and has no effect in the browser.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-section-header';
  if (customElements.get(TAG_NAME)) return;

  const TONES = ['neutral', 'primary', 'success', 'warning', 'danger'];
  const PREFIX = 'kakao-section-header-';

  class KakaoSectionHeader extends HTMLElement {
    static get observedAttributes() {
      return ['heading', 'level', 'count', 'count-tone', 'count-label', 'description'];
    }

    connectedCallback() {
      if (!this._text) this._build();
      this._adopt();
      this._render();
      if (!this._observer) this._observer = new MutationObserver(() => this._adopt());
      this._observer.observe(this, { childList: true });
    }

    disconnectedCallback() {
      if (this._observer) this._observer.disconnect();
    }

    attributeChangedCallback() {
      if (this._text) this._render();
    }

    /* The two boxes. Reuses boxes already in the element (a clone, or markup
       saved after a render), so nothing is drawn twice. */
    _build() {
      const own = (cls) => [...this.children].find((c) => c.classList.contains(PREFIX + cls));
      this._text = own('text') || Object.assign(document.createElement('div'), { className: PREFIX + 'text' });
      this._actions = own('actions') || Object.assign(document.createElement('div'), { className: PREFIX + 'actions' });
      this._heading = this._text.querySelector('.' + PREFIX + 'heading');
      this._desc = this._text.querySelector('p.' + PREFIX + 'description')
        || Object.assign(document.createElement('p'), { className: PREFIX + 'description' });
      if (!this._desc.parentNode) this._text.append(this._desc);
      this.prepend(this._text);
      this._text.after(this._actions);
    }

    /* Children the page adds: slot="description" goes under the heading,
       everything else into the actions box, in source order. */
    _adopt() {
      for (const child of [...this.childNodes]) {
        if (child === this._text || child === this._actions) continue;
        if (child.nodeType === Node.TEXT_NODE && !child.textContent.trim()) continue;
        if (child.nodeType === Node.COMMENT_NODE) continue;
        if (child.nodeType === Node.ELEMENT_NODE && child.getAttribute('slot') === 'description') {
          this._text.append(child);
        } else {
          this._actions.append(child);
        }
      }
      const rich = this._text.querySelector(':scope > [slot="description"]');
      this._desc.hidden = Boolean(rich) || !this._desc.textContent;
    }

    _render() {
      const heading = (this.getAttribute('heading') || '').trim();
      const raw = parseInt(this.getAttribute('level'), 10);
      const level = raw >= 2 && raw <= 6 ? raw : 2;

      if (!heading) {
        if (this._heading) { this._heading.remove(); this._heading = null; }
      } else {
        const tag = 'h' + level;
        if (!this._heading || this._heading.localName !== tag) {
          const h = document.createElement(tag);
          // A new level keeps the heading's id (kakao-toc's, a page's link target).
          if (this._heading) {
            for (const a of this._heading.attributes) h.setAttribute(a.name, a.value);
            this._heading.replaceWith(h);
          } else {
            this._text.prepend(h);
          }
          this._heading = h;
        }
        this._heading.className = PREFIX + 'heading';
        this._heading.dataset.tocTitle = heading;
        this._heading.replaceChildren(heading, ...this._count());
      }

      const description = (this.getAttribute('description') || '').trim();
      this._desc.textContent = description;
      const rich = this._text.querySelector(':scope > [slot="description"]');
      this._desc.hidden = Boolean(rich) || !description;
    }

    /* The count's nodes: a space, then the number (muted text or a badge), and
       count-label for screen readers in place of the number. */
    _count() {
      const count = (this.getAttribute('count') || '').trim();
      if (!count) return [];
      const tone = this.getAttribute('count-tone');
      let el;
      if (tone !== null) {
        el = document.createElement('kakao-badge');
        el.setAttribute('tone', TONES.includes(tone) ? tone : 'neutral');
      } else {
        el = document.createElement('span');
      }
      el.className = PREFIX + 'count';
      el.textContent = count;
      const label = (this.getAttribute('count-label') || '').trim();
      if (!label) return [' ', el];
      el.setAttribute('aria-hidden', 'true');
      const sr = Object.assign(document.createElement('span'), { className: PREFIX + 'sr', textContent: label });
      return [' ', el, sr];
    }
  }

  customElements.define(TAG_NAME, KakaoSectionHeader);

  if (typeof KakaoComponents !== 'undefined') {
    KakaoComponents.register(TAG_NAME, { triggers: [] });
  }
})();
