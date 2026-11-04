/*
 * list.js — Web Component
 * ==========================================================
 *
 * USAGE
 * -----
 *   <script src="list.js"><\/script>
 *   <kakao-list
 *     width="260"
 *     height="360"
 *     groups="true"
 *     item-height="44"
 *     max-tilt="65"
 *     list-data='[{"group":"Label","names":["Item 1","Item 2"]}]'>
 *   </kakao-list>
 *
 * ATTRIBUTES
 * ----------
 *   width        — Component width in px (default: 260)
 *   height       — Component height in px (default: 360)
 *   item-height  — Row height in px (default: 44)
 *   max-tilt     — Max perspective tilt in degrees (default: 65)
 *   groups       — Show group headings: "true" | "false" (default: true)
 *   list-data    — JSON string: [{group, names[]}]
 *   disabled     — Disables interaction when present
 *
 * CSS CUSTOM PROPERTIES
 * ----------------------
 *   Set them on the element or any ancestor. Their defaults live in the
 *   settings block of this file: change them on construction.html.
 *   --kakao-list-bg              Background color (default: #fff)
 *   --kakao-list-border-color    Item divider color (default: #eee)
 *   --kakao-list-item-color      Item text color (default: #111)
 *   --kakao-list-item-font       Item font (default: system-ui)
 *   --kakao-list-item-hover-bg   Item hover bg (default: #f5f5f5)
 *   --kakao-list-item-active-bg  Item press bg (default: #ebebeb)
 *   --kakao-list-item-selected-bg Selected item bg (default: #e8e8e8)
 *   --kakao-list-group-bg        Group header bg (default: #f7f7f7)
 *   --kakao-list-group-color     Group header text (default: #999)
 *   --kakao-list-scrollbar-track Scrollbar track color (default: #f0f0f0)
 *   --kakao-list-scrollbar-thumb Scrollbar thumb color (default: #bbb)
 *   --kakao-list-fade-color      Fade mask base color (default: 255,255,255)
 *   …and more (item/group sizes, chevron, focus, scrollbar hover): see the
 *   settings block or construction.html for the full list.
 *
 * METHODS
 * -------
 *   setData(data, withGroups) — Load data programmatically
 *   scrollBy(delta)           — Scroll by delta pixels
 *
 * EVENTS
 * ------
 *   item-select  — { detail: { name, index } }
 *   item-action  — { detail: { name, index } } (chevron button)
 *   scroll-end   — Fired when scroll reaches top or bottom
 */

class KakaoList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._items         = [];
    this._groups        = [];
    this._velocity      = 0;
    this._animating     = false;
    this._ticking       = false;
    this._wasAtTop      = false;
    this._wasAtBottom   = false;
    this._lastScrollTop = 0;
    this._lastTime      = performance.now();
    this._pendingData   = null; // queued if setData called before connectedCallback
    this._scrollHandler = this._onScroll.bind(this);
    this._resizeObserver = null;
  }

  static get observedAttributes() {
    return ['list-data', 'groups', 'width', 'height', 'item-height', 'max-tilt', 'disabled'];
  }

  attributeChangedCallback(name) {
    if (!this._inner) return;
    if (name === 'list-data' || name === 'groups') this._applyAttributes();
    if (name === 'disabled') this._applyDisabled();
  }

  connectedCallback() {
    this._build();
    if (this._pendingData) {
      this.setData(this._pendingData.data, this._pendingData.withGroups);
      this._pendingData = null;
    } else {
      this._applyAttributes();
    }

    // ResizeObserver — recalculate if component is resized
    if (window.ResizeObserver) {
      this._resizeObserver = new ResizeObserver(this._onResize.bind(this));
      this._resizeObserver.observe(this);
    }
  }

  disconnectedCallback() {
    if (this._scroller) this._scroller.removeEventListener('scroll', this._scrollHandler);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    this._cancelThumbDrag();
  }

  _build() {
    var w  = parseInt(this.getAttribute('width')       || 260);
    var h  = parseInt(this.getAttribute('height')      || 360);
    var ih = parseInt(this.getAttribute('item-height') || 44);
    var sb = 12;
    this._w  = w;
    this._h  = h;
    this._ih = ih;
    this._sb = sb;

    this.shadowRoot.innerHTML =
      `<style>
        :host {
          /* @kakao-settings:start prefix=--kakao-list- (written by construction.html, edit there) */
          --_bg: var(--kakao-list-bg, #fff);
          --_border-color: var(--kakao-list-border-color, #eee);
          --_item-color: var(--kakao-list-item-color, #111);
          --_item-font: var(--kakao-list-item-font, -apple-system, BlinkMacSystemFont, sans-serif);
          --_item-font-size: var(--kakao-list-item-font-size, 14px);
          --_item-padding-x: var(--kakao-list-item-padding-x, 12px);
          --_item-hover-bg: var(--kakao-list-item-hover-bg, #f5f5f5);
          --_item-active-bg: var(--kakao-list-item-active-bg, #ebebeb);
          --_item-selected-bg: var(--kakao-list-item-selected-bg, #e8e8e8);
          --_group-bg: var(--kakao-list-group-bg, #f7f7f7);
          --_group-color: var(--kakao-list-group-color, #999);
          --_group-height: var(--kakao-list-group-height, 28px);
          --_group-font-size: var(--kakao-list-group-font-size, 11px);
          --_action-color: var(--kakao-list-action-color, #aaa);
          --_action-hover-color: var(--kakao-list-action-hover-color, #555);
          --_focus-color: var(--kakao-list-focus-color, #555);
          --_scrollbar-track: var(--kakao-list-scrollbar-track, #f0f0f0);
          --_scrollbar-thumb: var(--kakao-list-scrollbar-thumb, #bbb);
          --_scrollbar-thumb-hover: var(--kakao-list-scrollbar-thumb-hover, #999);
          --_scrollbar-thumb-active: var(--kakao-list-scrollbar-thumb-active, #888);
          --_fade-color: var(--kakao-list-fade-color, 255,255,255);
          --_fade-height: var(--kakao-list-fade-height, 90px);
          --_disabled-opacity: var(--kakao-list-disabled-opacity, 0.5);
          /* @kakao-settings:end */
          display: block;
        }
        :host([disabled]) { pointer-events: none; opacity: var(--_disabled-opacity); }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .wrap { position: relative; width: ${w + sb}px; height: ${h}px; }

        /* Clip — visual boundary, hides tilt overflow */
        .clip {
          position: absolute; top: 0; left: 0;
          width: ${w}px; height: ${h}px;
          overflow: hidden;
          background: var(--_bg);
        }

        /* Fade masks */
        .clip::before, .clip::after {
          content: ""; position: absolute; left: 0; right: 0; height: var(--_fade-height);
          z-index: 2; pointer-events: none; opacity: 0; transition: opacity 0.25s ease;
        }
        .clip::before { top: 0;
          background: linear-gradient(to bottom,
            rgba(var(--_fade-color), 0.95) 0%,
            rgba(var(--_fade-color), 0.5) 40%,
            rgba(var(--_fade-color), 0) 100%); }
        .clip::after { bottom: 0;
          background: linear-gradient(to top,
            rgba(var(--_fade-color), 0.95) 0%,
            rgba(var(--_fade-color), 0.5) 40%,
            rgba(var(--_fade-color), 0) 100%); }
        .clip.can-scroll-up::before  { opacity: 1; }
        .clip.can-scroll-down::after { opacity: 1; }

        /* Scroll box — wider than clip so scrollbar renders in the gap */
        .scroll-box {
          position: absolute; top: 0; left: 0;
          width: ${w + sb}px; height: ${h}px;
          overflow-y: scroll; overflow-x: hidden;
          overscroll-behavior-y: contain;
          scrollbar-width: none;
          background: transparent;
        }
        .scroll-box::-webkit-scrollbar { display: none; }

        /* Custom scrollbar */
        .scrollbar-track {
          position: absolute; top: 0; right: 0;
          width: ${sb}px; height: 100%;
          background: var(--_scrollbar-track);
          border-radius: 6px;
        }
        .scrollbar-thumb {
          position: absolute; right: 2px;
          width: ${sb - 4}px;
          background: var(--_scrollbar-thumb);
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.15s;
          user-select: none;
        }
        .scrollbar-thumb:hover { background: var(--_scrollbar-thumb-hover); }
        .scrollbar-thumb.dragging { background: var(--_scrollbar-thumb-active); }

        /* Bounce animation */
        .bounce-inner { --peek: 16px; list-style: none; }
        @keyframes peek-top {
          0%   { transform: translateY(0); }
          30%  { transform: translateY(var(--peek)); }
          62%  { transform: translateY(calc(var(--peek) * -0.35)); }
          82%  { transform: translateY(calc(var(--peek) * 0.12)); }
          100% { transform: translateY(0); }
        }
        @keyframes peek-bottom {
          0%   { transform: translateY(0); }
          30%  { transform: translateY(calc(var(--peek) * -1)); }
          62%  { transform: translateY(calc(var(--peek) * 0.35)); }
          82%  { transform: translateY(calc(var(--peek) * -0.12)); }
          100% { transform: translateY(0); }
        }
        .bounce-inner.hit-top    { animation: peek-top    0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .bounce-inner.hit-bottom { animation: peek-bottom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        /* Item entrance */
        @keyframes item-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        /* List items */
        .scroll-item {
          height: ${ih}px;
          border-bottom: 1px solid var(--_border-color);
          display: flex; align-items: center; padding: 0 var(--_item-padding-x);
          font-size: var(--_item-font-size);
          color: var(--_item-color);
          font-family: var(--_item-font);
          transform-origin: center center;
          cursor: pointer; user-select: none;
          animation: item-in 0.3s ease backwards;
          width: ${w}px;
        }
        .scroll-item:last-child { border-bottom: none; }
        .scroll-item:hover  { background: var(--_item-hover-bg); }
        .scroll-item:active { background: var(--_item-active-bg); }
        .scroll-item[aria-selected="true"] { background: var(--_item-selected-bg); font-weight: 600; }
        .scroll-item:focus-visible { outline: 2px solid var(--_focus-color); outline-offset: -2px; }

        /* Chevron button */
        .item-action {
          margin-left: auto; color: var(--_action-color); font-size: 16px;
          padding: 8px; line-height: 1; background: none; border: none;
          cursor: pointer; border-radius: 4px; font-family: inherit;
        }
        .item-action:hover { color: var(--_action-hover-color); }
        .item-action:focus-visible { outline: 2px solid var(--_focus-color); outline-offset: 2px; }
        .scroll-item[aria-selected="true"] .item-action { color: var(--_action-hover-color); }

        /* Group headers */
        .scroll-group {
          height: var(--_group-height); padding: 0 var(--_item-padding-x);
          font-size: var(--_group-font-size); font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--_group-color);
          display: flex; align-items: center;
          background: var(--_group-bg);
          border-bottom: 1px solid var(--_border-color);
          font-family: var(--_item-font);
          width: ${w}px;
        }
      </style>` +
      '<div class="wrap">' +
        '<div class="clip" id="clip"></div>' +
        '<div class="scrollbar-track"><div class="scrollbar-thumb" id="sb-thumb"></div></div>' +
        '<div class="scroll-box" id="scroller" role="region" aria-label="Scrollable item list" tabindex="0">' +
          '<ul class="bounce-inner" id="inner" role="list" aria-label="Items"></ul>' +
        '</div>' +
      '</div>';

    this._clip     = this.shadowRoot.getElementById('clip');
    this._sbThumb  = this.shadowRoot.getElementById('sb-thumb');
    this._scroller = this.shadowRoot.getElementById('scroller');
    this._inner    = this.shadowRoot.getElementById('inner');

    this._scroller.addEventListener('scroll', this._scrollHandler);
    this._initThumbDrag();
    this._updateTilts();
    this._updateScrollbar();
    this._applyDisabled();
  }

  // ── Data ─────────────────────────────────────────────────────────────────

  setData(data, withGroups) {
    if (!this._inner) { this._pendingData = { data: data, withGroups: withGroups }; return; }
    var self      = this;
    var inner     = this._inner;
    inner.setAttribute('aria-busy', 'true');
    inner.innerHTML = '';
    var itemIndex = 0;

    data.forEach(function(section) {
      if (withGroups) {
        var grpEl = document.createElement('li');
        grpEl.setAttribute('role', 'presentation');

        var hdr = document.createElement('div');
        hdr.className = 'scroll-group';
        hdr.id = 'kakao-list-group-' + itemIndex;
        hdr.textContent = section.group;
        grpEl.appendChild(hdr);

        var subList = document.createElement('ul');
        subList.setAttribute('role', 'group');
        subList.setAttribute('aria-labelledby', 'kakao-list-group-' + itemIndex);
        subList.style.listStyle = 'none';
        section.names.forEach(function(name) {
          subList.appendChild(self._makeItem(name, itemIndex++));
        });
        grpEl.appendChild(subList);
        inner.appendChild(grpEl);
      } else {
        section.names.forEach(function(name) {
          inner.appendChild(self._makeItem(name, itemIndex++));
        });
      }
    });

    this._items  = Array.from(inner.querySelectorAll('.scroll-item'));
    this._groups = Array.from(inner.querySelectorAll('.scroll-group'));

    // Set aria-setsize on all items
    var total = this._items.length;
    this._items.forEach(function(item, i) {
      item.setAttribute('aria-posinset', i + 1);
      item.setAttribute('aria-setsize', total);
    });

    inner.removeAttribute('aria-busy');
    this._scroller.scrollTop = 0;
    this._updateTilts();
    this._updateScrollbar();
  }

  _applyAttributes() {
    var raw = this.getAttribute('list-data');
    if (!raw) return;
    try {
      var parsed     = JSON.parse(raw);
      var withGroups = this.getAttribute('groups') !== 'false';
      this.setData(parsed, withGroups);
    } catch(e) { console.error('kakao-list: invalid JSON in list-data attribute', e); }
  }

  _applyDisabled() {
    if (!this._scroller) return;
    this._scroller.setAttribute('aria-disabled', this.hasAttribute('disabled') ? 'true' : 'false');
  }

  // ── Item factory ─────────────────────────────────────────────────────────

  _makeItem(name, index) {
    var self = this;
    var li   = document.createElement('li');
    li.className = 'scroll-item';
    li.setAttribute('role', 'listitem');
    li.setAttribute('aria-selected', 'false');
    li.setAttribute('tabindex', index === 0 ? '0' : '-1');
    li.style.animationDelay = (index * 40) + 'ms';

    var label = document.createElement('span');
    label.textContent = name;

    var btn = document.createElement('button');
    btn.className = 'item-action';
    btn.setAttribute('aria-label', 'Action for ' + name);
    btn.setAttribute('tabindex', '-1');
    btn.textContent = '›';

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      self.dispatchEvent(new CustomEvent('item-action', {
        detail: { name: name, index: index },
        bubbles: true, composed: true
      }));
    });

    li.appendChild(label);
    li.appendChild(btn);

    li.addEventListener('click', function() {
      if (self.hasAttribute('disabled')) return;
      self._items.forEach(function(el) {
        el.setAttribute('aria-selected', 'false');
        el.setAttribute('tabindex', '-1');
      });
      li.setAttribute('aria-selected', 'true');
      li.setAttribute('tabindex', '0');
      self.dispatchEvent(new CustomEvent('item-select', {
        detail: { name: name, index: index },
        bubbles: true, composed: true
      }));
    });

    li.addEventListener('keydown', function(e) {
      var idx  = self._items.indexOf(li);
      var next = null;
      if (e.key === 'ArrowDown') next = self._items[idx + 1];
      if (e.key === 'ArrowUp')   next = self._items[idx - 1];
      if (next) {
        e.preventDefault();
        next.setAttribute('tabindex', '0');
        next.focus();
        li.setAttribute('tabindex', '-1');
      }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); }
    });

    return li;
  }

  // ── Scroll handler ───────────────────────────────────────────────────────

  _onScroll() {
    var now     = performance.now();
    var dt      = now - this._lastTime;
    var dy      = this._scroller.scrollTop - this._lastScrollTop;
    var instant = dt > 0 ? Math.abs(dy / dt) : 0;
    this._velocity      = this._velocity * 0.6 + instant * 0.4;
    this._lastScrollTop = this._scroller.scrollTop;
    this._lastTime      = now;
    this._updateTilts();
    this._updateScrollbar();
    if (this._ticking || this._animating) return;
    this._ticking = true;
    var self = this;
    requestAnimationFrame(function() {
      var atTop    = self._scroller.scrollTop <= 0;
      var atBottom = self._scroller.scrollTop + self._scroller.clientHeight >= self._scroller.scrollHeight - 2;
      if (atTop    && !self._wasAtTop)    self._fire('top');
      if (atBottom && !self._wasAtBottom) self._fire('bottom');
      if (atTop || atBottom) {
        self.dispatchEvent(new CustomEvent('scroll-end', {
          detail: { edge: atTop ? 'top' : 'bottom' },
          bubbles: true, composed: true
        }));
      }
      self._wasAtTop    = atTop;
      self._wasAtBottom = atBottom;
      self._ticking = false;
    });
  }

  // ── Tilt & fade ──────────────────────────────────────────────────────────

  _updateTilts() {
    var scroller   = this._scroller;
    var clip       = this._clip;
    var viewTop    = scroller.scrollTop;
    var viewBottom = viewTop + scroller.clientHeight;
    var MAX_TILT   = parseFloat(this.getAttribute('max-tilt') || 65);

    clip.classList.toggle('can-scroll-up',   scroller.scrollTop > 0);
    clip.classList.toggle('can-scroll-down', scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight);

    this._items.forEach(function(item) {
      var itemTop    = item.offsetTop;
      var itemBottom = itemTop + item.offsetHeight;
      var itemH      = item.offsetHeight;
      var clipTop    = Math.max(0, viewTop - itemTop);
      var clipBottom = Math.max(0, itemBottom - viewBottom);
      var clipPx     = Math.max(clipTop, clipBottom);
      if (clipPx <= 0) { item.style.transform = ''; item.style.opacity = '1'; return; }
      var t    = Math.min(clipPx / itemH, 1);
      var e    = t * t;
      var sign = clipTop > clipBottom ? 1 : -1;
      item.style.transform = 'perspective(500px) rotateX(' + (sign * MAX_TILT * e).toFixed(2) + 'deg) scale(' + (1 - e * 0.06).toFixed(3) + ')';
      item.style.opacity   = (1 - e * 0.7).toFixed(3);
    });
  }

  // ── Bounce ───────────────────────────────────────────────────────────────

  _fire(edge) {
    if (this._animating) return;
    this._animating = true;
    var MIN_PEEK = 4; var MAX_PEEK = 36;
    var t    = Math.min(this._velocity / 2.5, 1);
    var peek = MIN_PEEK + (MAX_PEEK - MIN_PEEK) * (1 - Math.pow(1 - t, 2));
    var inner = this._inner;
    inner.style.setProperty('--peek', peek.toFixed(1) + 'px');
    inner.classList.remove('hit-top', 'hit-bottom');
    void inner.offsetWidth;
    inner.classList.add(edge === 'top' ? 'hit-top' : 'hit-bottom');
    var self = this;
    inner.addEventListener('animationend', function() {
      inner.classList.remove('hit-top', 'hit-bottom');
      self._animating = false;
      self._velocity  = 0;
    }, { once: true });
  }

  // ── Custom scrollbar ─────────────────────────────────────────────────────

  _updateScrollbar() {
    var s       = this._scroller;
    var trackH  = s.clientHeight;
    var ratio   = trackH / s.scrollHeight;
    var thumbH  = Math.max(28, trackH * ratio);
    var maxTop  = trackH - thumbH;
    var thumbTop = s.scrollHeight > trackH
      ? (s.scrollTop / (s.scrollHeight - trackH)) * maxTop
      : 0;
    this._sbThumb.style.height = thumbH.toFixed(1) + 'px';
    this._sbThumb.style.top    = thumbTop.toFixed(1) + 'px';
  }

  _initThumbDrag() {
    var self       = this;
    var startY     = 0;
    var startTop   = 0;
    var dragging   = false;

    function onPointerDown(e) {
      dragging = true;
      startY   = e.clientY;
      startTop = self._scroller.scrollTop;
      self._sbThumb.classList.add('dragging');
      self._sbThumb.setPointerCapture(e.pointerId);
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!dragging) return;
      var s       = self._scroller;
      var trackH  = s.clientHeight;
      var thumbH  = parseFloat(self._sbThumb.style.height) || 28;
      var maxTop  = trackH - thumbH;
      var ratio   = (s.scrollHeight - trackH) / maxTop;
      var dy      = e.clientY - startY;
      s.scrollTop = startTop + dy * ratio;
    }

    function onPointerUp() {
      dragging = false;
      self._sbThumb.classList.remove('dragging');
    }

    this._sbThumb.addEventListener('pointerdown',   onPointerDown);
    this._sbThumb.addEventListener('pointermove',   onPointerMove);
    this._sbThumb.addEventListener('pointerup',     onPointerUp);
    this._sbThumb.addEventListener('pointercancel', onPointerUp);

    // Store for cleanup
    this._cancelThumbDrag = function() {
      self._sbThumb.removeEventListener('pointerdown',   onPointerDown);
      self._sbThumb.removeEventListener('pointermove',   onPointerMove);
      self._sbThumb.removeEventListener('pointerup',     onPointerUp);
      self._sbThumb.removeEventListener('pointercancel', onPointerUp);
    };
  }

  _cancelThumbDrag() {} // overwritten by _initThumbDrag

  // ── Resize ───────────────────────────────────────────────────────────────

  _onResize() {
    this._updateTilts();
    this._updateScrollbar();
  }

  // ── Public API ───────────────────────────────────────────────────────────

  scrollBy(delta) { this._scroller.scrollTop += delta; }
}

customElements.define('kakao-list', KakaoList);