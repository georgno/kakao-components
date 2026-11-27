'use strict';
/*
 * kakao-theme-switch across windows: a remembered theme is announced on a
 * BroadcastChannel and the other windows follow it the way it changed. A
 * ripple continues across the screen: a window placed to the right of the
 * sender plays its part of the same circle, centred where the click was (left
 * of its own viewport), and later, when the circle gets there. A fade fades;
 * a theme that is not remembered is not announced. Runs in Chromium when
 * Playwright is installed (not a dependency of this repo; skipped without it).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
let playwright = null;
try { playwright = require('playwright'); } catch { playwright = null; }

const ORIGIN = 'http://kakao.test';
const PAGE = `<!doctype html><html lang="en"><head>
  <style>
    :root { color-scheme: light; --kakao-color-page: #fff; }
    :root[data-kakao-theme="dark"] { color-scheme: dark; --kakao-color-page: #111; }
    body { margin: 0; height: 100vh; background: var(--kakao-color-page); }
  </style>
  <script src="/theme-switch.js"></script>
</head><body><p>Window</p></body></html>`;

// Record the reveal animations and when the theme changed, on the shared clock.
const SPY = () => {
  window.__reveals = [];
  window.__changed = [];
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (frames, options) {
    if (options && options.pseudoElement === '::view-transition-new(root)') {
      window.__reveals.push({ frames: JSON.parse(JSON.stringify(frames)), duration: options.duration, at: Date.now() });
    }
    return animate.call(this, frames, options);
  };
  new MutationObserver(() => {
    window.__changed.push({ theme: document.documentElement.getAttribute('data-kakao-theme'), at: Date.now() });
  }).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-kakao-theme'] });
};

test('a ripple continues in the window beside the sender; a fade fades', { skip: !playwright && 'Playwright is not installed' }, async () => {
  const browser = await playwright.chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const script = fs.readFileSync(path.join(ROOT, 'components/theme-switch/theme-switch.js'), 'utf8');
    await context.route(`${ORIGIN}/**`, (route) => {
      const url = route.request().url();
      if (url.endsWith('/theme-switch.js')) return route.fulfill({ body: script, contentType: 'text/javascript' });
      return route.fulfill({ body: PAGE, contentType: 'text/html' });
    });

    const a = await context.newPage();
    const b = await context.newPage();
    // Window B sits 1000 screen px to the right of A; the toolbars are 0 here.
    await b.addInitScript(() => {
      Object.defineProperty(window, 'screenX', { get: () => 1000 });
      Object.defineProperty(window, 'screenY', { get: () => 0 });
      Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth });
      Object.defineProperty(window, 'outerHeight', { get: () => window.innerHeight });
    });
    await a.addInitScript(() => {
      Object.defineProperty(window, 'screenX', { get: () => 0 });
      Object.defineProperty(window, 'screenY', { get: () => 0 });
      Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth });
      Object.defineProperty(window, 'outerHeight', { get: () => window.innerHeight });
    });
    await a.addInitScript(SPY);
    await b.addInitScript(SPY);
    await a.goto(`${ORIGIN}/a.html`);
    await b.goto(`${ORIGIN}/b.html`);
    await b.bringToFront(); // a hidden window would change at once
    await a.evaluate(() => localStorage.removeItem('kakao-theme'));

    // A ripple from (600, 300) in A: B's viewport starts 400 px to its right.
    const sent = await a.evaluate(() => {
      const at = Date.now();
      customElements.get('kakao-theme-switch').setTheme('dark', { x: 600, y: 300 });
      return at;
    });
    await b.waitForFunction(() => window.__reveals.length > 0 && document.documentElement.getAttribute('data-kakao-theme') === 'dark', null, { timeout: 5000 });
    const seen = await b.evaluate(() => ({ reveals: window.__reveals, changed: window.__changed }));
    const first = seen.reveals[0].frames[0];
    const last = seen.reveals[0].frames[seen.reveals[0].frames.length - 1];
    const centre = (f) => {
      const size = parseFloat(f.maskSize);
      const [x, y] = f.maskPosition.split(' ').map(parseFloat);
      return { x: x + size / 2, y: y + size / 2, r: size / 2 };
    };
    const c0 = centre(first);
    const c1 = centre(last);
    assert.ok(Math.abs(c0.x - -400) <= 1 && Math.abs(c0.y - 300) <= 1, `circle centred left of B's viewport: ${JSON.stringify(c0)}`);
    assert.ok(Math.abs(c0.r - 400) <= 2, `B's part starts where the circle reaches its edge (r ≈ 400): ${c0.r}`);
    assert.ok(Math.abs(c1.r - Math.hypot(1200, 300)) <= 2, `and ends when it covers B's far corner: ${c1.r}`);
    const delay = seen.changed[0].at - sent;
    assert.ok(delay >= 150, `B changes later than A, when the circle gets there (${delay} ms)`);

    // A fade is announced as a fade: no ripple in B.
    await b.evaluate(() => { window.__reveals = []; });
    await a.evaluate(() => customElements.get('kakao-theme-switch').setTheme('light', { fade: true }));
    await b.waitForFunction(() => document.documentElement.getAttribute('data-kakao-theme') === 'light', null, { timeout: 5000 });
    assert.equal(await b.evaluate(() => window.__reveals.length), 0, 'a fade plays no ripple in B');

    // A theme that is not remembered is not announced.
    await a.evaluate(() => customElements.get('kakao-theme-switch').setTheme('dark', { animate: false, storageKey: '' }));
    await b.waitForTimeout(300);
    assert.equal(await b.evaluate(() => document.documentElement.getAttribute('data-kakao-theme')), 'light');
    await context.close();
  } finally {
    await browser.close();
  }
});
