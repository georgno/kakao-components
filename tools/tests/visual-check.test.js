'use strict';
/*
 * tools/visual-check.js: argument handling always; the browser checks on a
 * page with known faults when Playwright is installed (it is not a dependency
 * of this repo; that test is skipped without it, like code-block.test.js).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseArgs, slug, serve, loadPlaywright, checkPage } = require('../visual-check');

const playwright = loadPlaywright();

test('arguments: pages, options, and the default output outside the repo', () => {
  const o = parseArgs(['a.html', '--out', 'shots', '--wait', '0', 'http://localhost:8000/x'], '/work');
  assert.deepEqual(o.pages, ['a.html', 'http://localhost:8000/x']);
  assert.equal(o.out, path.resolve('/work', 'shots'));
  assert.equal(o.wait, 0);
  assert.equal(o.root, '/work');
  assert.ok(parseArgs(['a.html']).out.startsWith(os.tmpdir()));
  assert.throws(() => parseArgs([]), /at least one page/);
  assert.throws(() => parseArgs(['a.html', '--bogus']), /unknown option/);
  assert.throws(() => parseArgs(['a.html', '--tabs', 'x']), /number/);
});

test('arguments: --state collects clicks per name, in order', () => {
  const o = parseArgs(['a.html', '--state', 'imperial=#units [value="imperial"]', '--state', 'Imperial=#more', '--state', 'menu=#open']);
  assert.deepEqual(o.states, [
    { name: 'imperial', clicks: ['#units [value="imperial"]', '#more'] },
    { name: 'menu', clicks: ['#open'] },
  ]);
  assert.deepEqual(parseArgs(['a.html']).states, []);
  assert.throws(() => parseArgs(['a.html', '--state', '#units']), /name=selector/);
  assert.throws(() => parseArgs(['a.html', '--state', 'a b=#x']), /name=selector/);
});

test('states, touch emulation and phone shots by screen', { skip: !playwright && 'Playwright is not installed' }, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-check-test-'));
  // A view hidden at load that is too wide for a phone, a block that shows
  // only on a coarse pointer, and a page three phone screens tall.
  fs.writeFileSync(path.join(root, 'states.html'), `<!doctype html><html lang="en"><head><title>States</title>
    <meta name="viewport" content="width=device-width">
    <style>
      body { margin: 0; }
      #wide { width: 600px; height: 20px; }
      #touch { display: none; }
      @media (pointer: coarse) { #touch { display: block; } }
      .tall { height: 2400px; }
    </style></head><body>
    <button id="show" onclick="document.getElementById('wide').hidden = false">Show</button>
    <div id="wide" hidden>wide</div>
    <p id="touch">coarse</p>
    <div class="tall"></div>
    <script>
      window.addEventListener('load', () => {
        if (matchMedia('(pointer: coarse)').matches) document.title += ' coarse';
        matchMedia('(pointer: coarse)').addEventListener('change', () => console.error('pointer changed'));
      });
    </script></body></html>`);
  const server = await serve(root);
  const browser = await playwright.chromium.launch();
  try {
    const r = await checkPage(browser, server.url(path.join(root, 'states.html')), path.join(root, 'out'),
      { wait: 0, tabs: 3, states: [{ name: 'wide', clicks: ['#show'] }, { name: 'nothing', clicks: ['#missing'] }] });
    const names = r.shots.map((f) => path.basename(f));
    assert.ok(names.includes('desktop-light.png') && names.includes('wide-desktop-light.png'), names.join(' '));
    // 2400px + the rest in an 844px screen: three phone screens per variant and state.
    assert.deepEqual(names.filter((n) => /^phone-light/.test(n)), ['phone-light.png', 'phone-light-2.png', 'phone-light-3.png']);
    // (A page wider than the phone is zoomed out to fit, so its screens are taller: fewer shots.)
    assert.ok(names.includes('wide-phone-dark.png') && names.includes('wide-phone-dark-2.png'), names.join(' '));
    assert.ok(!names.some((n) => n.startsWith('nothing-')), 'a state that cannot be entered is not shot');
    const errors = [...r.errors].join('\n');
    assert.doesNotMatch(errors, /pointer changed/, 'the touch emulation holds through the shots');
    assert.match(errors, /state "nothing": could not click #missing/);
    assert.deepEqual(r.overflow.map((o) => o.split(':')[0]), ['wide phone-light', 'wide phone-dark'], 'only the state shows the overflow');
    // The coarse-pointer block is drawn on the phone screens.
    const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
    await page.goto(server.url(path.join(root, 'states.html')));
    assert.ok(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), 'isMobile + hasTouch is a coarse pointer');
    await page.context().close();
  } finally {
    await browser.close();
    await server.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('screenshot folder names', () => {
  assert.equal(slug('recipes/form.html'), 'recipes-form');
  assert.equal(slug('http://localhost:8000/admin/users?id=3'), 'localhost-8000-admin-users-id-3');
});

test('finds the faults of a broken page', { skip: !playwright && 'Playwright is not installed' }, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-check-test-'));
  fs.writeFileSync(path.join(root, 'broken.html'), `<!doctype html><html><head><title>Broken</title>
    <meta name="viewport" content="width=device-width">
    <style>
      .ring:focus-visible { outline: 3px solid blue; }
      .flat:focus { outline: none; }
      @keyframes spin { to { transform: rotate(1turn); } }
    </style>
    <script src="missing.js"></script></head><body>
    <button class="ring">Named</button>
    <button class="flat"></button>
    <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="20" height="20">
    <div style="width: 600px">wide</div>
    <x-spin></x-spin>
    <script>
      customElements.define('x-spin', class extends HTMLElement {
        constructor() { super(); this.attachShadow({ mode: 'open' }).innerHTML =
          '<i style="display:block;width:9px;height:9px;animation:spin 1s linear infinite"></i><style>@keyframes spin{to{transform:rotate(1turn)}}</style>'; }
      });
      console.error('boom');
    </script></body></html>`);
  const server = await serve(root);
  const browser = await playwright.chromium.launch();
  try {
    const r = await checkPage(browser, server.url(path.join(root, 'broken.html')), path.join(root, 'out'), { wait: 0, tabs: 10 });
    assert.equal(r.shots.length, 4);
    for (const s of r.shots) assert.ok(fs.statSync(s).size > 0, s);
    const errors = [...r.errors].join('\n');
    assert.match(errors, /console: boom/);
    assert.match(errors, /HTTP 404: .*missing\.js/);
    assert.ok(r.a11y.includes('<html> has no lang'));
    assert.ok(r.a11y.some((f) => /^button without an accessible name: button\.flat/.test(f)), r.a11y.join('\n'));
    assert.ok(r.a11y.some((f) => /^image without an accessible name: img/.test(f)), r.a11y.join('\n'));
    assert.equal(r.overflow.length, 2, 'both phone variants');
    assert.match(r.overflow[0], /^phone-light: .*\n\s+div "wide"/);
    assert.equal(r.keyboard.stops, 2);
    assert.deepEqual(r.keyboard.findings, ['no visible focus on button.flat']);
    assert.deepEqual(r.motion, ['spin keeps running on x-spin >> i']);
  } finally {
    await browser.close();
    await server.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
