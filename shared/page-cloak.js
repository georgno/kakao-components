/**
 * page-cloak.js - show a page only once its components have drawn themselves.
 *
 * Load it synchronously in <head> (not defer), before the component scripts:
 *
 *   <script src="shared/page-cloak.js"></script>
 *
 * The component scripts load with `defer`, and deferred scripts always run
 * before DOMContentLoaded. So at DOMContentLoaded every component is defined
 * and has rendered: the page is revealed in one piece instead of components
 * popping in one by one (no flicker, no layout jumps on reload).
 *
 * It also waits for the web fonts (Inter Tight from Google Fonts, the Font
 * Awesome icons from a CDN): otherwise the text redraws in the new font and the
 * icons appear a moment after the reveal, which reads as popping too. That wait
 * is capped at 1.5 s, and never runs past the 2.5 s safety reveal below.
 *
 * Safety net: the page is revealed after 2.5 s whatever happens, so a slow or
 * failing script or font can never leave it blank. Hidden with opacity, so
 * assistive technology can still read the page. Without JavaScript nothing is hidden.
 *
 * For this project's pages only. It is not part of any component, so pages
 * that embed kakao components elsewhere are not affected.
 */
(function () {
  'use strict';

  const root = document.documentElement;
  if (root.hasAttribute('data-kakao-cloak')) return;
  root.setAttribute('data-kakao-cloak', '');

  const style = document.createElement('style');
  style.textContent = 'html[data-kakao-cloak] body { opacity: 0; pointer-events: none; }';
  document.head.appendChild(style);

  let revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    root.removeAttribute('data-kakao-cloak');
    style.remove();
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Deferred component scripts have run by DOMContentLoaded. Then wait for the
  // fonts (capped), and reveal on the next frame so anything set up in a
  // microtask is in place too. A background tab paints nothing: reveal at once.
  document.addEventListener('DOMContentLoaded', () => {
    if (document.hidden) return reveal();
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, wait(1500)]).then(() => requestAnimationFrame(reveal));
  }, { once: true });
  setTimeout(reveal, 2500);
})();
