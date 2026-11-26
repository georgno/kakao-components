/**
 * page-transition.js - switch pages by swapping their content, without a reload.
 * ============================================================================
 * Pages that share a shell (a header bar, a side menu) keep it on screen while
 * only their content changes: a click on an in-app link fetches the page and
 * replaces the marked content regions, under document.startViewTransition, so
 * the old content cross-fades into the new. Nothing is reloaded. Without this
 * script every link is an ordinary navigation, so it is a pure enhancement.
 *
 * Load it in the head of every page that takes part, without defer (after the
 * loader if you use it), so the page's own scripts find it when they run:
 *
 *   <script src="kakao/shared/page-transition.js"><\/script>
 *
 * Opt in with markup:
 *
 *   <kakao-header-bar data-page-transition>
 *     <a slot="nav" href="index.html" aria-current="page">Home</a>
 *     <a slot="nav" href="reports.html">Reports</a>
 *   </kakao-header-bar>
 *   <main data-page-transition-content="content" tabindex="-1">…</main>
 *   <script src="reports.js" data-page-transition-script><\/script>
 *
 *  - data-page-transition: links inside it (or the link itself) are in-app. Other
 *    origins, links with a target, `download`, a #fragment or a modifier key, and
 *    form posts are left to the browser.
 *  - data-page-transition-content="<key>": a region the swap replaces, paired by
 *    key with the fetched page. Every page that takes part renders the same
 *    regions. When the fetched page has a region this one lacks, or none with a
 *    key of this one (a page outside the shell), the link navigates normally; a
 *    region only this page has stays as it is.
 *  - The region with tabindex="-1" takes the focus after a swap and the page
 *    scrolls to the top, as on a normal navigation (give it `outline: none` on
 *    :focus in your CSS).
 *  - Links in the opted-in containers outside the regions (the shell's
 *    navigation) get aria-current="page" when they point at the new page.
 *
 * Head: the fetched page's stylesheets and head <style>s are added (loaded
 * before the swap, so nothing shows unstyled); the previous page's own ones the
 * new page lacks are removed; ones both pages have stay, and so does anything a
 * script inserted. Head scripts with a src the current page lacks load once,
 * before the swap. With the loader (kakao.js), the components the new content
 * uses are loaded before the swap too. Title and URL follow, history entries are
 * pushed, Back and Forward swap back.
 *
 * Page scripts: script[data-page-transition-script] is the page's own behaviour.
 * After a swap the new page's marked scripts run (in document order; inline ones
 * too), and the old page's marked scripts are dropped. They run again on every
 * visit, so write them to be re-run:
 *  - wrap inline code in a block or a function (a second top-level `const` throws);
 *  - don't wait for DOMContentLoaded or load, they have passed: check
 *    document.readyState first;
 *  - bind listeners outside the content (document, window) with the screen's
 *    signal, which aborts when the screen is swapped out:
 *      const signal = window.kakaoPageTransition && kakaoPageTransition.signal;
 *      document.addEventListener('keydown', onKey, { signal });
 *      if (signal) signal.addEventListener('abort', stopTimers);
 *  - a script that fills the screen after it runs (a fetch) can hold the new
 *    screen until it is done (capped at 1 s):
 *      kakaoPageTransition.wait(fetch('data.json').then(render));
 * Unmarked scripts inside a region don't run after a swap.
 *
 * Events, on document, detail { url, from }:
 *   page-transition-start  a swap is about to begin; cancelable: preventDefault()
 *                          makes it an ordinary navigation.
 *   page-transition-swap   the new regions are in (before the page scripts run):
 *                          update shell state that depends on the URL here.
 *   page-transition-end    the transition has finished (also after an instant swap).
 * kakao-tabs selects the tab for the new URL on page-transition-swap; the header
 * bar stays solid from start to end.
 *
 * API, window.kakaoPageTransition:
 *   navigate(url)   swap to url (a component that handles its own clicks).
 *   busy            set it while the screen has work in flight that a swap would
 *                   lose (an unsaved form, a running upload): links then navigate
 *                   normally, so the browser's own beforeunload handling applies.
 *   signal          the current screen's AbortSignal.
 *   wait(promise)   during a swap: hold the new screen until promise settles.
 *
 * Browsers without View Transitions and `prefers-reduced-motion: reduce` swap at
 * once. The whole page cross-fades by default (the shell is identical, so it
 * looks still); give a region a view-transition-name in your CSS to animate it
 * on its own.
 * ============================================================================
 */
(function () {
  'use strict';

  if (window.kakaoPageTransition) return;

  const REGION = '[data-page-transition-content]';
  const OPT_IN = '[data-page-transition]';
  const PAGE_SCRIPT = 'script[data-page-transition-script]';
  const HEAD_ASSET = 'link[rel~="stylesheet"][href], style, script';
  const PREPARE_CAP = 3000; // ms: styles, scripts and components before the swap
  const WAIT_CAP = 1000; // ms: page scripts holding the new screen

  const regionKey = (el) => el.getAttribute('data-page-transition-content') || '';
  const withoutHash = (href) => href.replace(/#.*$/, '');
  const capped = (promises, ms) => Promise.race([
    Promise.all(promises.map((p) => Promise.resolve(p).catch(() => {}))),
    new Promise((resolve) => setTimeout(resolve, ms)),
  ]);

  // Two navigations overlap: the last one wins, the one still fetching is dropped.
  let latest = 0;
  let shown = withoutHash(location.href); // the page whose regions are on screen
  let controller = new AbortController();
  let waits = null; // collects kakaoPageTransition.wait() during a swap

  /* ---- head ------------------------------------------------------------- */

  /** Identity of a head element: the same file or text is the same asset. */
  function headKey(el, base) {
    if (el.localName === 'link') return `link ${new URL(el.getAttribute('href'), base).href} ${el.media || ''}`;
    if (el.localName === 'style') return `style ${el.media || ''} ${el.textContent.trim()}`;
    const src = el.getAttribute('src');
    return src ? `script ${new URL(src, base).href}` : `script ${el.textContent.trim()}`;
  }

  /**
   * The current page's own head (as written in its source): only those are
   * removed when the next page lacks them, never what a script inserted. A page
   * reached by a swap knows it; the first page reads its source once.
   */
  let ownHead = null;
  function sourceHead() {
    if (!ownHead) {
      const url = shown;
      ownHead = fetch(url)
        .then((r) => r.text())
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          return new Set([...doc.head.querySelectorAll(HEAD_ASSET)].map((el) => headKey(el, url)));
        })
        .catch(() => new Set()); // unknown: remove nothing
    }
    return ownHead;
  }

  /** Copy an element from the fetched document, URLs made absolute. */
  function copyOf(el, base) {
    const copy = document.createElement(el.localName);
    for (const { name, value } of el.attributes) copy.setAttribute(name, value);
    if (el.hasAttribute('href')) copy.setAttribute('href', new URL(el.getAttribute('href'), base).href);
    if (el.hasAttribute('src')) copy.setAttribute('src', new URL(el.getAttribute('src'), base).href);
    copy.textContent = el.textContent;
    return copy;
  }

  const settled = (el) => new Promise((resolve) => {
    el.addEventListener('load', resolve, { once: true });
    el.addEventListener('error', resolve, { once: true });
  });

  /**
   * Before the swap: load the new page's styles (switched off with a media
   * query that never matches, so the current page is untouched), its new head
   * scripts, and the components its regions use. Returns what the swap applies.
   */
  function prepareHead(doc, base) {
    const current = new Map();
    for (const el of document.head.querySelectorAll(HEAD_ASSET)) current.set(headKey(el, location.href), el);
    const keys = new Set();
    const styles = []; // [element, its real media]
    const loading = [];
    let anchor = null; // the last element of the new head that is already here
    for (const el of doc.head.querySelectorAll(HEAD_ASSET)) {
      const key = headKey(el, base);
      keys.add(key);
      if (current.has(key)) {
        anchor = current.get(key);
        continue;
      }
      if (el.localName === 'script') {
        // Page scripts run after the swap; inline head scripts don't run.
        if (el.matches(PAGE_SCRIPT) || !el.hasAttribute('src')) continue;
        const script = copyOf(el, base);
        script.async = false;
        loading.push(settled(script));
        document.head.append(script);
        continue;
      }
      const copy = copyOf(el, base);
      styles.push([copy, copy.getAttribute('media')]);
      copy.setAttribute('media', 'not all');
      if (copy.localName === 'link') loading.push(settled(copy));
      if (anchor) anchor.after(copy);
      else document.head.append(copy);
      anchor = copy;
    }
    if (window.kakaoLoader) {
      const tags = new Set();
      for (const region of doc.querySelectorAll(REGION)) {
        for (const el of [region, ...region.querySelectorAll('*')]) {
          if (el.localName.includes('-') && !customElements.get(el.localName)) tags.add(el.localName);
        }
      }
      for (const tag of tags) loading.push(window.kakaoLoader.load(tag)); // unknown tags reject at once
    }
    return { keys, styles, loading };
  }

  /** In the swap: switch the new styles on, drop the previous page's own. */
  function applyHead(head, own) {
    for (const [el, media] of head.styles) {
      if (media === null) el.removeAttribute('media');
      else el.setAttribute('media', media);
    }
    for (const el of [...document.head.querySelectorAll('link[rel~="stylesheet"][href], style')]) {
      const key = headKey(el, location.href);
      if (own.has(key) && !head.keys.has(key)) el.remove();
    }
  }

  /* ---- regions and scripts ---------------------------------------------- */

  /** The fetched page's regions all exist here, and at least one does. */
  function sameShell(doc) {
    const current = new Set([...document.querySelectorAll(REGION)].map(regionKey));
    const fetched = [...doc.querySelectorAll(REGION)].map(regionKey);
    return fetched.length > 0 && fetched.every((key) => current.has(key));
  }

  function swapRegions(doc) {
    const fetched = new Map();
    doc.querySelectorAll(REGION).forEach((el) => fetched.set(regionKey(el), el));
    document.querySelectorAll(REGION).forEach((el) => {
      const next = fetched.get(regionKey(el));
      if (next) el.replaceWith(document.importNode(next, true));
    });
  }

  /** The shell's own links point at the page now shown. */
  function markCurrent() {
    for (const link of document.querySelectorAll(`${OPT_IN} a[href], a${OPT_IN}[href]`)) {
      if (link.closest(REGION)) continue;
      if (withoutHash(link.href) === shown) link.setAttribute('aria-current', 'page');
      else if (link.getAttribute('aria-current') === 'page') link.removeAttribute('aria-current');
    }
  }

  /**
   * Run the new page's marked scripts in document order, one after the other
   * (an inline one may need the src one before it). Those outside the regions
   * replace the old page's; those inside a region are run in place.
   */
  async function runPageScripts(doc, base) {
    const outside = (el) => !el.parentElement.closest(REGION);
    document.querySelectorAll(PAGE_SCRIPT).forEach((el) => { if (outside(el)) el.remove(); });
    const regionScripts = [...document.querySelectorAll(`${REGION} ${PAGE_SCRIPT}`)];
    const fetchedInRegions = [...doc.querySelectorAll(`${REGION} ${PAGE_SCRIPT}`)];
    for (const el of doc.querySelectorAll(PAGE_SCRIPT)) {
      const script = copyOf(el, base);
      const inRegion = fetchedInRegions.indexOf(el);
      if (inRegion >= 0) {
        const old = regionScripts[inRegion];
        if (!old) continue;
        old.replaceWith(script);
      } else if (doc.head.contains(el)) {
        document.head.append(script);
      } else {
        document.body.append(script);
      }
      if (script.src) await Promise.race([settled(script), new Promise((r) => setTimeout(r, WAIT_CAP))]);
    }
  }

  function emit(name, detail, cancelable) {
    return document.dispatchEvent(new CustomEvent(name, { detail, cancelable: !!cancelable }));
  }

  /* ---- navigation ------------------------------------------------------- */

  async function navigate(url, push) {
    const target = new URL(url, location.href);
    const go = (href) => { location.href = href; };
    // Same-origin only; this is also the entry point components call.
    if (target.origin !== location.origin) return go(target.href);
    // Work in flight on this screen: the ordinary way, so the page's own
    // beforeunload handling (or its loss) is what the user expects.
    if (window.kakaoPageTransition.busy) return go(target.href);

    const run = ++latest;
    const from = shown;
    const own = sourceHead(); // in parallel with the fetch

    let response = null;
    try {
      response = await fetch(target.href);
    } catch {
      response = null;
    }
    // A newer navigation started meanwhile: this one may not touch the page.
    if (run !== latest) return;
    const type = response ? response.headers.get('content-type') || '' : '';
    // Not a page we can swap (a failed fetch, an error page, a file).
    if (!response || !response.ok || !type.includes('text/html')) return go(target.href);

    const html = await response.text();
    if (run !== latest) return;
    const landed = new URL(response.url || target.href, location.href);
    // The server redirected (to a login page, say): navigate for real.
    if (withoutHash(landed.href) !== withoutHash(target.href)) return go(landed.href);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!sameShell(doc)) return go(landed.href);

    const href = withoutHash(landed.href);
    const head = prepareHead(doc, href);
    const [ownKeys] = await Promise.all([own, capped(head.loading, PREPARE_CAP)]);
    // Overtaken: drop the styles prepared for this page (its scripts have run, harmlessly).
    if (run !== latest) return head.styles.forEach(([el]) => el.remove());

    const detail = { url: href, from };
    if (!emit('page-transition-start', detail, true)) {
      head.styles.forEach(([el]) => el.remove());
      return go(landed.href);
    }
    if (push !== false) history.pushState({}, '', landed.href);

    const update = async () => {
      shown = href;
      applyHead(head, ownKeys);
      ownHead = Promise.resolve(head.keys);
      controller.abort();
      controller = new AbortController();
      swapRegions(doc);
      document.title = doc.title;
      markCurrent();
      emit('page-transition-swap', detail);
      waits = [];
      await runPageScripts(doc, href);
      // A normal navigation lands at the top with the focus on the new page.
      window.scrollTo(0, 0);
      const content = document.querySelector(`${REGION}[tabindex="-1"]`);
      if (content) content.focus({ preventScroll: true });
      const pending = waits;
      waits = null;
      if (pending.length) await capped(pending, WAIT_CAP);
    };

    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      await update();
      emit('page-transition-end', detail);
      return;
    }
    // A skipped transition (a hidden tab, a newer swap) rejects ready and
    // finished; the update runs anyway, so neither is an error.
    const transition = document.startViewTransition(update);
    transition.ready.catch(() => {});
    await transition.finished.catch(() => {});
    emit('page-transition-end', detail);
  }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link || !link.closest(OPT_IN)) return;
    if ((link.target && link.target !== '_self') || link.hasAttribute('download')) return;

    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.href === location.href) return;
    // An in-page link scrolls to its target; a swap scrolls to the top instead.
    if (url.hash) return;
    event.preventDefault();
    navigate(url.href);
  });

  // Back and Forward. A popstate within the same page (a #fragment) is not a swap.
  window.addEventListener('popstate', () => {
    if (withoutHash(location.href) !== shown) navigate(location.href, false);
  });

  window.kakaoPageTransition = {
    navigate: (url) => navigate(url),
    busy: false,
    get signal() {
      return controller.signal;
    },
    wait(promise) {
      if (waits) waits.push(Promise.resolve(promise).catch(() => {}));
      return promise;
    },
  };
})();
