/**
 * page-transition.js - switch screens by swapping their content, without a reload.
 *
 * Cross-document view transitions (`@view-transition { navigation: auto }`) cannot
 * be used here: the new document's first snapshot is taken while shared/page-cloak.js
 * still has the page hidden, so the cross-fade would land on a blank page. Instead
 * the shell stays in the DOM and only the marked content regions are replaced, under
 * document.startViewTransition. Nothing is reloaded, so the cloak never runs again.
 *
 * Opt in with markup:
 *
 *   <main data-page-transition-content="content" data-page-transition>...</main>
 *   <section data-page-transition-content="chats" data-page-transition>...</section>
 *
 *   - data-page-transition links (or a container of links) are in-app: a click
 *     fetches the page and swaps it instead of navigating. Everything else - other
 *     sites, /login, /logout, form posts - is left to the browser.
 *   - data-page-transition-content marks a region the swap replaces. The attribute's
 *     value pairs it with the same key in the fetched page. A swap only happens when the
 *     fetched screen adds no region the current one lacks: a page without the chat list
 *     (a 404, /agents) still reaches /chat with an ordinary navigation, so the swapped-in
 *     screen never misses a region the shell would then never render again.
 *   - the region marked tabindex="-1" (the page's content) takes the focus after a swap
 *     and the page scrolls to the top, as a normal navigation does.
 *   - script[data-page-transition-script] names the page's own scripts. They bind
 *     their screen when they load, so they are run again after a swap: that is how
 *     the swapped-in screen gets its behaviour. Scripts written into the markup of a
 *     region are inert once the region is imported: a screen that needs behaviour
 *     brings it as a marked script, never as an inline one.
 *
 * The URL, the title and the kakao-tabs selection follow the new screen, and
 * history entries are pushed, so Back and Forward work. An open aside-menu stays
 * open: the shell is not reloaded, so a panel the user opened keeps its state.
 * Browsers without View Transitions and `prefers-reduced-motion: reduce` swap at once.
 * Without this script every link is an ordinary navigation.
 *
 * A component that handles its own clicks can navigate through:
 *
 *   window.kakaoPageTransition.navigate('/chat');
 *
 * A screen with work in flight sets `window.kakaoPageTransition.busy` (chat.js does while
 * a reply streams); the next navigation is then an ordinary one, so a swap cannot reset
 * the screen and drop the reply.
 *
 * For this project's pages only, like page-cloak.js.
 */
(function () {
  'use strict';

  const REGION = '[data-page-transition-content]';
  const OPT_IN = '[data-page-transition]';
  const PAGE_SCRIPT = 'script[data-page-transition-script]';
  const regionKey = (el) => el.getAttribute('data-page-transition-content') || '';

  // Two navigations overlap: the last one wins, the one still fetching is dropped.
  let latest = 0;

  function swap(doc) {
    const fetched = new Map();
    doc.querySelectorAll(REGION).forEach((el) => fetched.set(regionKey(el), el));
    document.querySelectorAll(REGION).forEach((el) => {
      const next = fetched.get(regionKey(el));
      // shortcut: a region the fetched page does not render is left alone (no insertion).
      // That is invisible only because navigate() navigates for real when the fetched page
      // has a region this one lacks; two screens with different region sets swap badly.
      if (next) el.replaceWith(document.importNode(next, true));
    });
  }

  // A region only this document has would survive the swap as the old screen's leftovers.
  function addsRegion(doc) {
    const current = new Set([...document.querySelectorAll(REGION)].map(regionKey));
    return [...doc.querySelectorAll(REGION)].some((el) => !current.has(regionKey(el)));
  }

  // kakao-tabs owns the thumb under the selected tab, so the new route goes through
  // select() (which keeps aria, the thumb and the event) rather than the attribute.
  function syncTabs() {
    const path = location.pathname;
    document.querySelectorAll('kakao-tabs').forEach((tabs) => {
      const tab = [...tabs.querySelectorAll('kakao-tab')]
        .find((item) => item.url && new URL(item.url, location.href).pathname === path);
      if (tab && tabs.select) tabs.select(tab);
    });
  }

  // The page's scripts bind when they load; a fresh run against the new DOM is what
  // re-initialises them (they are written to bail when their screen is not there).
  function rerunPageScripts() {
    document.querySelectorAll(PAGE_SCRIPT).forEach((old) => {
      const next = document.createElement('script');
      next.async = false; // a script inserted later is async by default: keep the page's order
      next.setAttribute('data-page-transition-script', '');
      if (old.src) next.src = old.src;
      else next.textContent = old.textContent;
      old.replaceWith(next);
    });
  }

  function update(doc) {
    swap(doc);
    document.title = doc.title;
    syncTabs();
    rerunPageScripts();
    // An open menu stays open: the shell is not reloaded, so the user's panel keeps its state.
    // A normal navigation lands at the top with the focus on the new page, so a swap does too.
    window.scrollTo(0, 0);
    const content = document.querySelector(REGION + '[tabindex="-1"]');
    if (content) content.focus({ preventScroll: true });
  }

  async function navigate(url, push) {
    const target = new URL(url, location.href);
    // Same-origin only; this is also the entry point components call, not just the click handler.
    if (target.origin !== location.origin) {
      location.href = target.href;
      return;
    }

    // Mid-turn, a swap would re-initialise the screen and drop the reply that is streaming
    // into it, so go the ordinary way. shortcut: that navigation cancels the turn; keeping
    // it alive would need the stream to outlive the DOM.
    if (window.kakaoPageTransition.busy) {
      location.href = target.href;
      return;
    }

    const run = ++latest;

    let response = null;
    try {
      response = await fetch(target.href);
    } catch {
      response = null; // the fallback below is the ordinary navigation
    }
    // A newer navigation started meanwhile: this one may not touch the page or the URL.
    if (run !== latest) return;

    const type = response ? response.headers.get('content-type') || '' : '';

    // Not a page we can swap (a failed fetch, a redirect out of the app, a file):
    // let the browser do the ordinary navigation.
    if (!response || !response.ok || !type.includes('text/html')) {
      location.href = target.href;
      return;
    }

    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    if (run !== latest) return;

    const landed = new URL(response.url || target.href, location.href);
    // The server redirected (a guest sent to /login, an expired session): navigate for real.
    if (landed.href !== target.href) {
      location.href = landed.href;
      return;
    }

    // The fetched screen renders a region this one does not: swapping would keep the old
    // screen's shell, so navigate for real instead.
    if (addsRegion(doc)) {
      location.href = landed.href;
      return;
    }

    if (push !== false) history.pushState({}, '', landed.href);

    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      update(doc);
      return;
    }
    // A skipped transition (a hidden tab, a resize) rejects both promises; the swap has run
    // or runs anyway, so neither is an error.
    const transition = document.startViewTransition(() => update(doc));
    transition.ready.catch(() => {});
    transition.finished.catch(() => {});
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

  window.addEventListener('popstate', () => navigate(location.href, false));

  window.kakaoPageTransition = {
    navigate: (url) => navigate(url),
    // Set by a screen with a turn in flight (chat.js while a reply streams): see navigate().
    busy: false,
  };
})();
