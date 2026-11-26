/**
 * kakao.js - loads kakao components on first use.
 * ============================================================================
 * One script instead of a list of component files. Load it in <head>, without
 * defer, after kakao.css:
 *
 *   <link rel="stylesheet" href="kakao/shared/kakao.css">
 *   <script src="kakao/shared/kakao.js"><\/script>
 *
 * Then use any <kakao-*> tag. The loader
 *  - applies the theme a visitor saved with a <kakao-theme-switch> (on any
 *    page of the site) before the first paint, data-bs-theme included, as
 *    theme-switch.js does when it is loaded early: no flash of the wrong
 *    theme. Without a saved choice the page follows the OS;
 *  - watches the page, while it is parsed and afterwards, for kakao tags and
 *    for theme-picker controls (they need theme-switch.js);
 *  - loads, for each tag it finds: shared/component-api.js (once, first), the
 *    components it requires and the ones it is enhanced by, its light-DOM CSS
 *    and its script, each script after those it depends on (toast after stack
 *    and alert). CSS is inserted where this script is, so the page's own CSS
 *    after it still wins;
 *  - hides a tag until it is defined (visibility, so the layout doesn't jump).
 *    A tag is shown anyway when its file, or a file it requires, fails to
 *    load (also a script the page loads itself), and at the latest 3 s after
 *    it was found (REVEAL_AFTER), so a slow or blocked server never hides it
 *    for good; other tags stay hidden until they are ready.
 *
 * Files load relative to this script's URL, with its query string
 * (kakao.js?v=3 loads toast.js?v=3). Tags that are already defined, and
 * files the page already loads itself, are skipped: pages that load single
 * files keep working, with or without the loader.
 *
 * Code that calls a component's methods waits for it:
 *
 *   kakaoLoader.load('kakao-toast').then(() => …);   // also loads it
 *   kakaoLoader.ready.then(() => …);   // everything the parsed page uses
 *
 * The map below is generated from custom-elements.json by
 * `node tools/loader.js`; never edit it by hand.
 * ============================================================================
 */
(function () {
  'use strict';

  if (window.kakaoLoader) return;

  /* @generated:start map (node tools/loader.js, from custom-elements.json: tag: [script, css, requires, enhancedBy]) */
  const MAP = {
    "kakao-accordion": ["components/accordion/accordion.js",[],[],[]],
    "kakao-alert": ["components/alert/alert.js",[],[],[]],
    "kakao-animated-number": ["components/animated-number/animated-number.js",[],[],[]],
    "kakao-aside-menu": ["components/aside-menu/aside-menu.js",["components/aside-menu/aside-menu.css"],["kakao-button"],[]],
    "kakao-aside-sheet": ["components/aside-sheet/aside-sheet.js",[],[],[]],
    "kakao-avatar": ["components/avatar/avatar.js",[],[],[]],
    "kakao-avatar-group": ["components/avatar/avatar.js",[],[],[]],
    "kakao-badge": ["components/badge/badge.js",[],[],[]],
    "kakao-breadcrumb": ["components/breadcrumb/breadcrumb.js",[],[],[]],
    "kakao-button": ["components/button/button.js",["components/button/button.css"],[],["kakao-tooltip"]],
    "kakao-card": ["components/card/card.js",[],[],[]],
    "kakao-checkbox": ["components/checkbox/checkbox.js",[],[],[]],
    "kakao-chip": ["components/chip/chip.js",[],[],[]],
    "kakao-chip-list": ["components/chip-list/chip-list.js",["components/chip-list/chip-list.css"],[],[]],
    "kakao-code-input": ["components/code-input/code-input.js",[],[],[]],
    "kakao-color-code": ["components/color-code/color-code.js",[],[],[]],
    "kakao-color-picker": ["components/color-picker/color-picker.js",[],[],[]],
    "kakao-combobox": ["components/combobox/combobox.js",[],[],[]],
    "kakao-command-palette": ["components/command-palette/command-palette.js",[],[],["kakao-kbd"]],
    "kakao-copy-button": ["components/copy-button/copy-button.js",[],[],[]],
    "kakao-date-input": ["components/date-input/date-input.js",[],[],[]],
    "kakao-description-list": ["components/description-list/description-list.js",[],[],[]],
    "kakao-dialog": ["components/dialog/dialog.js",[],[],[]],
    "kakao-empty-state": ["components/empty-state/empty-state.js",[],[],[]],
    "kakao-error-page": ["components/error-page/error-page.js",[],[],[]],
    "kakao-error-summary": ["components/error-summary/error-summary.js",[],["kakao-alert"],[]],
    "kakao-file-upload": ["components/file-upload/file-upload.js",[],[],["kakao-button"]],
    "kakao-grid-view": ["components/grid-view/grid-view.js",["components/grid-view/grid-view.css"],["kakao-table"],["kakao-button","kakao-dialog","kakao-empty-state","kakao-pagination","kakao-select","kakao-skeleton","kakao-text-input"]],
    "kakao-header-bar": ["components/header-bar/header-bar.js",[],[],[]],
    "kakao-image": ["components/image/image.js",[],["kakao-skeleton"],[]],
    "kakao-kbd": ["components/kbd/kbd.js",[],[],[]],
    "kakao-list": ["components/list/list.js",[],[],[]],
    "kakao-menu": ["components/menu/menu.js",[],[],["kakao-kbd"]],
    "kakao-meter": ["components/meter/meter.js",[],[],[]],
    "kakao-multi-dropdown": ["components/multi-dropdown/multi-dropdown.js",[],[],[]],
    "kakao-number-input": ["components/number-input/number-input.js",["components/number-input/number-input.css"],[],[]],
    "kakao-pagination": ["components/pagination/pagination.js",[],[],["kakao-select"]],
    "kakao-password-input": ["components/password-input/password-input.js",[],[],["kakao-progress"]],
    "kakao-popover": ["components/popover/popover.js",[],[],[]],
    "kakao-progress": ["components/progress/progress.js",[],[],[]],
    "kakao-radio-group": ["components/radio-group/radio-group.js",[],[],[]],
    "kakao-range-slider": ["components/range-slider/range-slider.js",[],[],["kakao-number-input"]],
    "kakao-rating": ["components/rating/rating.js",[],[],[]],
    "kakao-select": ["components/select/select.js",[],[],[]],
    "kakao-settings-group": ["components/settings-group/settings-group.js",[],[],[]],
    "kakao-setting": ["components/settings-group/settings-group.js",[],[],[]],
    "kakao-skeleton": ["components/skeleton/skeleton.js",[],[],[]],
    "kakao-slider": ["components/slider/slider.js",[],[],["kakao-number-input"]],
    "kakao-spinner": ["components/spinner/spinner.js",[],[],[]],
    "kakao-stack": ["components/stack/stack.js",[],[],[]],
    "kakao-step-switch": ["components/step-switch/step-switch.js",[],[],[]],
    "kakao-stepper": ["components/stepper/stepper.js",[],[],[]],
    "kakao-switch-group": ["components/switch-group/switch-group.js",[],[],[]],
    "kakao-table": ["components/table/table.js",["components/table/table.css"],[],["kakao-empty-state","kakao-skeleton"]],
    "kakao-tab": ["components/tabs/tabs.js",["components/tabs/tabs.css"],[],[]],
    "kakao-tabs": ["components/tabs/tabs.js",["components/tabs/tabs.css"],[],[]],
    "kakao-tag-input": ["components/tag-input/tag-input.js",[],["kakao-chip"],[]],
    "kakao-text-input": ["components/text-input/text-input.js",[],[],[]],
    "kakao-textarea": ["components/textarea/textarea.js",[],[],[]],
    "kakao-theme-switch": ["components/theme-switch/theme-switch.js",[],[],[]],
    "kakao-time-input": ["components/time-input/time-input.js",[],[],[]],
    "kakao-toast": ["components/toast/toast.js",[],["kakao-stack","kakao-alert"],["kakao-button"]],
    "kakao-toc": ["components/toc/toc.js",[],[],[]],
    "kakao-tooltip": ["components/tooltip/tooltip.js",[],[],[]],
    "kakao-tree-view": ["components/tree-view/tree-view.js",[],[],[]],
  };
  /* @generated:end map */

  const API = 'shared/component-api.js';
  const THEME_KEY = 'kakao-theme'; // theme-switch.js's default storage key
  const THEME_SWITCH = 'kakao-theme-switch';
  const PICKER = 'theme-picker'; // an attribute theme-switch.js wires up
  const REVEAL_AFTER = 3000; // ms: show a tag that is still not defined

  const root = document.documentElement;
  const me = document.currentScript || document.querySelector('script[src*="kakao.js"]');
  const src = new URL(me ? me.src : 'shared/kakao.js', document.baseURI);
  const base = new URL('..', src);
  const query = src.search;
  const url = (file) => new URL(file, base).href.replace(/[?#].*$/, '') + query;
  const samePath = (a, b) => new URL(a, document.baseURI).pathname === new URL(b).pathname;

  // ---- saved theme, before the first paint ---------------------------------
  (function applySavedTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch { /* storage blocked */ }
    if (!saved || root.hasAttribute('data-kakao-theme')) return;
    root.setAttribute('data-kakao-theme', saved);
    if (saved === 'light' || saved === 'dark') return root.setAttribute('data-bs-theme', saved);
    // Other themes: their colour scheme comes from themes.css. A stylesheet
    // linked before this script has loaded by now (it blocks this script), so
    // this is before the first paint; checked again once all CSS is in.
    const scheme = () => root.setAttribute('data-bs-theme', /dark/.test(getComputedStyle(root).colorScheme || '') ? 'dark' : 'light');
    scheme();
    window.addEventListener('DOMContentLoaded', scheme, { once: true });
  })();

  // ---- hide tags until they are defined -------------------------------------
  const TAGS = Object.keys(MAP);
  const hidden = new Set(TAGS);
  const cloak = document.createElement('style');
  const drawCloak = () => {
    cloak.textContent = hidden.size ? `:is(${[...hidden].join(',')}):not(:defined){visibility:hidden}` : '';
  };
  drawCloak();
  (me && me.parentNode ? me.parentNode : document.head || root).insertBefore(cloak, me && me.parentNode ? me : null);

  /** Show these tags even before they are defined. */
  function reveal(tags) {
    let changed = false;
    for (const t of tags) changed = hidden.delete(t) || changed;
    if (changed) drawCloak();
  }

  /** u needs t: t is u, or a component u requires (directly or not). */
  function requiresTag(u, t, seen = new Set()) {
    if (u === t) return true;
    if (seen.has(u) || !MAP[u]) return false;
    seen.add(u);
    return MAP[u][2].some((r) => requiresTag(r, t, seen));
  }

  /** A file did not load: show the tags it serves and the tags requiring them. */
  function failed(href, file) {
    console.error(`kakao.js: could not load ${href}`);
    const own = TAGS.filter((t) => MAP[t][0] === file || MAP[t][1].includes(file));
    reveal(TAGS.filter((u) => own.some((t) => requiresTag(u, t))));
  }

  // ---- loading --------------------------------------------------------------
  const requested = new Set(); // tags
  const files = new Set(); // repo paths, inserted or found on the page
  let inserted = Promise.resolve(); // the last batch's scripts are in the document
  let loaded = Promise.resolve(); // every script so far has run (or failed)

  const pageFind = (selector, attr, file) => {
    const u = url(file);
    for (const el of document.querySelectorAll(selector)) {
      const v = el.getAttribute(attr);
      if (v && samePath(v, u)) return el;
    }
    return null;
  };
  const pageHas = (selector, attr, file) => !!pageFind(selector, attr, file);

  /** A script the page loads itself has defined `tag`, failed, or taken too long. */
  function pageScriptDone(tag) {
    const file = MAP[tag][0];
    const el = pageFind('script[src]', 'src', file);
    return new Promise((resolve) => {
      customElements.whenDefined(tag).then(resolve);
      if (el) el.addEventListener('error', () => { failed(el.src, file); resolve(); }, { once: true });
      setTimeout(resolve, REVEAL_AFTER);
    });
  }

  function addLink(file) {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url(file);
      link.onload = () => resolve();
      link.onerror = () => { failed(link.href, file); resolve(); };
      if (me && me.parentNode) me.parentNode.insertBefore(link, me);
      else document.head.appendChild(link);
    });
  }

  function addScript(file) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = url(file);
      script.async = false; // run in insertion order: dependencies first
      script.onload = () => resolve();
      script.onerror = () => { failed(script.src, file); resolve(); };
      document.head.appendChild(script);
    });
  }

  /** Load `tags` and everything they need; resolves once all of it has run. */
  function request(tags) {
    const order = [];
    const visit = (t) => {
      if (requested.has(t) || !MAP[t]) return;
      requested.add(t);
      if (customElements.get(t)) return;
      const [, , requires, enhancedBy] = MAP[t];
      requires.forEach(visit);
      enhancedBy.forEach(visit);
      order.push(t);
    };
    tags.forEach(visit);
    if (!order.length) return loaded;

    const styles = [];
    const scripts = [];
    const external = []; // required tags whose script the page loads itself
    if (!files.has(API)) {
      files.add(API);
      if (!window.KakaoComponents && !pageHas('script[src]', 'src', API)) scripts.push(API);
    }
    for (const t of order) {
      const [script, css] = MAP[t];
      for (const c of css) {
        if (files.has(c)) continue;
        files.add(c);
        if (!pageHas('link[rel~="stylesheet"][href]', 'href', c)) styles.push(c);
      }
      if (files.has(script)) continue;
      files.add(script);
      if (pageHas('script[src]', 'src', script)) external.push(t);
      else scripts.push(script);
    }
    // A component that extends another (toast extends stack) needs it defined
    // first; the page's own deferred scripts may still be on their way.
    const needed = new Set(order.flatMap((t) => MAP[t][2]));
    const waits = external.filter((t) => needed.has(t)).map(pageScriptDone);
    setTimeout(() => reveal(order), REVEAL_AFTER);
    // Files download in parallel; scripts go in after their CSS and after the
    // previous batch's scripts, so the insertion order is the dependency order.
    inserted = Promise.all([inserted, ...styles.map(addLink), ...waits]).then(() => scripts.map(addScript));
    loaded = Promise.all([loaded, inserted.then((runs) => Promise.all(runs))]);
    return loaded;
  }

  // ---- finding tags ---------------------------------------------------------
  const SELECTOR = [...TAGS, `[${PICKER}]`].join(',');

  function collect(node, found) {
    if (node.nodeType !== 1) return;
    const take = (el) => {
      if (MAP[el.localName]) found.add(el.localName);
      if (el.hasAttribute(PICKER)) found.add(THEME_SWITCH);
    };
    take(node);
    if (node.firstElementChild) node.querySelectorAll(SELECTOR).forEach(take);
  }

  function scan() {
    const found = new Set();
    collect(root, found);
    return request([...found]);
  }

  new MutationObserver((records) => {
    const found = new Set();
    for (const r of records) r.addedNodes.forEach((n) => collect(n, found));
    if (found.size) request([...found]);
  }).observe(root, { childList: true, subtree: true });
  scan();

  const ready = new Promise((resolve) => {
    const done = () => scan().then(() => resolve());
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', done, { once: true });
    else done();
  });

  window.kakaoLoader = {
    /** Load tags (and what they need); resolves once all are defined. */
    load(...tags) {
      const list = tags.flat();
      const unknown = list.filter((t) => !MAP[t]);
      if (unknown.length) return Promise.reject(new Error(`kakao.js: unknown tag ${unknown.join(', ')}`));
      request(list);
      return Promise.all(list.map((t) => customElements.whenDefined(t))).then(() => undefined);
    },
    /** Resolves once everything the parsed page uses is loaded. */
    ready,
    /** The library's root URL, from this script's URL. */
    base: base.href,
  };
})();
