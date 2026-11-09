/**
 * <kakao-chip-list>
 * ============================================================================
 * A wrapping row of <kakao-chip>s. When a chip leaves, it fades out where it
 * was and the others glide to their new places, across row breaks too; the
 * list's height follows instead of jumping. New chips fade in. Light DOM
 * (needs chip-list.css), vanilla JS, no deps.
 *
 * ----------------------------------------------------------------------------
 * USAGE
 * ----------------------------------------------------------------------------
 *   <link rel="stylesheet" href="chip-list.css">
 *   <script src="chip-list.js"><\/script>
 *
 *   <kakao-chip-list label="Active filters">
 *     <kakao-chip removable value="hd">HD only</kakao-chip>
 *     <kakao-chip removable value="de">Deutsch</kakao-chip>
 *   </kakao-chip-list>
 *
 * Works with any removal: a chip's own ×, chip.remove(), or replacing the
 * children (innerHTML). The list keeps the last layout position of every chip,
 * so it knows where each one came from without being told in advance.
 *
 * ----------------------------------------------------------------------------
 * ATTRIBUTES
 * ----------------------------------------------------------------------------
 *  label   Accessible name of the list (role="list"; each child is a listitem).
 *
 * ----------------------------------------------------------------------------
 * CSS CUSTOM PROPERTIES (defaults in chip-list.css; edit on construction.html)
 * ----------------------------------------------------------------------------
 *  --kakao-chip-list-gap / -row-gap            space between chips and rows
 *  --kakao-chip-list-duration / -easing        the glide along a row (spring)
 *  --kakao-chip-list-wrap-easing               the glide into another row (standard, no overshoot)
 *  --kakao-chip-list-fade-easing               fades and height (standard, no overshoot)
 *  --kakao-chip-list-exit-duration / -exit-scale   a leaving chip's fade
 *
 * No motion with prefers-reduced-motion: chips just take their new places.
 * ============================================================================
 */
(function () {
  'use strict';

  const TAG_NAME = 'kakao-chip-list';
  if (customElements.get(TAG_NAME)) return;

  const GHOST = 'data-chip-list-ghost';

  function ms(value, fallback) {
    const m = String(value).trim().match(/^(-?\d*\.?\d+)(ms|s)$/);
    if (!m) return fallback;
    return parseFloat(m[1]) * (m[2] === 's' ? 1000 : 1);
  }

  /** Translation an element shows right now (from a running glide), in px. */
  function currentShift(el) {
    const t = getComputedStyle(el).transform;
    if (!t || t === 'none') return { x: 0, y: 0 };
    const m = new DOMMatrixReadOnly(t);
    return { x: m.m41, y: m.m42 };
  }

  class KakaoChipList extends HTMLElement {
    static get observedAttributes() {
      return ['label'];
    }

    constructor() {
      super();
      this._pos = new Map(); // child -> last layout box, relative to the list
      this._height = 0;
      this._mutations = new MutationObserver((records) => this._onMutations(records));
      this._resize = new ResizeObserver(() => this._snapshot());
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'list');
      this._applyLabel();
      this._items().forEach((el) => this._adopt(el));
      this._mutations.observe(this, { childList: true });
      this._resize.observe(this);
      this._snapshot();
    }

    disconnectedCallback() {
      this._mutations.disconnect();
      this._resize.disconnect();
    }

    attributeChangedCallback() {
      this._applyLabel();
    }

    _applyLabel() {
      const label = this.getAttribute('label');
      if (label) this.setAttribute('aria-label', label);
    }

    _items() {
      return [...this.children].filter((el) => !el.hasAttribute(GHOST));
    }

    _adopt(el) {
      if (!el.hasAttribute('role')) el.setAttribute('role', 'listitem');
      this._resize.observe(el);
    }

    /** Remember where everything sits now (layout boxes; transforms don't count). */
    _snapshot() {
      this._pos = new Map(this._items().map((el) => [el, {
        x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight,
      }]));
      this._height = this.offsetHeight;
    }

    _timing() {
      const cs = getComputedStyle(this);
      return {
        duration: ms(cs.getPropertyValue('--_duration'), 320),
        easing: cs.getPropertyValue('--_easing').trim() || 'ease',
        wrap: cs.getPropertyValue('--_wrap-easing').trim() || 'ease',
        fade: cs.getPropertyValue('--_fade-easing').trim() || 'ease',
        exit: ms(cs.getPropertyValue('--_exit-duration'), 150),
        exitScale: parseFloat(cs.getPropertyValue('--_exit-scale')) || 0.85,
      };
    }

    _onMutations(records) {
      const isGhost = (n) => n.nodeType === 1 && n.hasAttribute(GHOST);
      const removed = [];
      const added = [];
      records.forEach((r) => {
        r.removedNodes.forEach((n) => { if (n.nodeType === 1 && !isGhost(n) && n.parentNode !== this) removed.push(n); });
        r.addedNodes.forEach((n) => { if (n.nodeType === 1 && !isGhost(n) && n.parentNode === this) added.push(n); });
      });
      if (!removed.length && !added.length) return;

      removed.forEach((n) => this._resize.unobserve(n));
      added.forEach((n) => this._adopt(n));

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this._snapshot();
        return;
      }

      const t = this._timing();
      const before = this._pos;
      // A chip re-appended inside the list is not new: it glides like the rest.
      const fresh = added.filter((n) => !before.has(n));
      const stay = this._items().filter((el) => before.has(el));
      // While the height is still animating, offsetHeight is the drawn height: start there.
      const oldHeight = this._heightGlide ? this.offsetHeight : this._height;
      if (this._heightGlide) { this._heightGlide.cancel(); this._heightGlide = null; }

      // 1. Where each staying chip is drawn right now: old layout + any glide in progress.
      const drawn = stay.map((el) => {
        const shift = currentShift(el);
        const old = before.get(el);
        return [el, old.x + shift.x, old.y + shift.y];
      });

      // 2. Glide from there to the new layout position (wrapping changes x and y).
      drawn.forEach(([el, x, y]) => {
        if (el._chipListGlide) el._chipListGlide.cancel();
        const dx = x - el.offsetLeft;
        const dy = y - el.offsetTop;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
        // Along the row: spring. Into another row: no overshoot, it would swing
        // across the row break.
        const changesRow = Math.abs(dy) >= 0.5;
        el._chipListGlide = el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
          { duration: t.duration, easing: changesRow ? t.wrap : t.easing },
        );
      });

      // 3. Leaving chips: a copy fades out where the chip was, outside the flow.
      removed.forEach((n) => {
        const old = before.get(n);
        if (!old) return;
        const ghost = n.cloneNode(true);
        ghost.setAttribute(GHOST, '');
        ghost.setAttribute('aria-hidden', 'true');
        ghost.inert = true;
        ghost.removeAttribute('id');
        Object.assign(ghost.style, {
          left: `${old.x}px`, top: `${old.y}px`, width: `${old.w}px`, height: `${old.h}px`,
        });
        this.prepend(ghost); // first, so it paints under the chips that glide over it
        ghost.animate(
          [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `scale(${t.exitScale})` }],
          { duration: t.exit, easing: t.fade, fill: 'forwards' },
        ).finished.then(() => ghost.remove(), () => ghost.remove());
      });

      // 4. New chips fade in at their place.
      fresh.forEach((el) => {
        el.animate(
          [{ opacity: 0, transform: `scale(${t.exitScale})` }, { opacity: 1, transform: 'none' }],
          { duration: t.duration, easing: t.fade },
        );
      });

      // 5. The list's own height follows (a row appearing or closing).
      const newHeight = this.offsetHeight;
      if (Math.abs(newHeight - oldHeight) >= 0.5) {
        const glide = this.animate(
          [{ height: `${oldHeight}px` }, { height: `${newHeight}px` }],
          { duration: t.duration, easing: t.fade }, // no overshoot: content below must not bounce
        );
        this._heightGlide = glide;
        glide.finished.then(() => { if (this._heightGlide === glide) this._heightGlide = null; }, () => {});
      }

      this._snapshot();
    }
  }

  customElements.define(TAG_NAME, KakaoChipList);
})();
