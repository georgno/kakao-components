'use strict';
/*
 * kakao-slider's number field takes typing: the text is never rewritten while
 * it has focus, the thumb follows only numbers inside min…max, and the commit
 * (blur or Enter) clamps, snaps and rewrites. Runs in Chromium when Playwright
 * is installed (not a dependency of this repo; skipped without it).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
let playwright = null;
try { playwright = require('playwright'); } catch { playwright = null; }

const FILES = [
  'components/number-input/number-input.css',
  'components/number-input/number-input.js',
  'components/slider/slider.js',
];

async function open(browser, withNumberInput) {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body><kakao-slider min="20" max="300" value="70" label="Weight"></kakao-slider><button>after</button></body></html>');
  for (const f of FILES) {
    if (!withNumberInput && f.includes('number-input')) continue;
    const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if (f.endsWith('.css')) await page.addStyleTag({ content });
    else await page.addScriptTag({ content });
  }
  await page.waitForFunction(() => document.querySelector('kakao-slider').shadowRoot?.querySelector('.number-input'));
  await page.evaluate(() => {
    window.events = [];
    const s = document.querySelector('kakao-slider');
    for (const t of ['slider-input', 'slider-change']) s.addEventListener(t, (e) => window.events.push([t, e.detail.value]));
  });
  return page;
}

const read = (page) => page.evaluate(() => {
  const s = document.querySelector('kakao-slider');
  return {
    field: s.shadowRoot.querySelector('.number-input').value,
    thumb: s.shadowRoot.querySelector('.thumb').getAttribute('aria-valuenow'),
    value: s.getValue(),
    events: window.events,
  };
});

for (const withNumberInput of [true, false]) {
  const name = withNumberInput ? 'with kakao-number-input' : 'native field';
  test(`slider field takes typing (${name})`, { skip: !playwright && 'Playwright is not installed' }, async () => {
    const browser = await playwright.chromium.launch();
    try {
      const page = await open(browser, withNumberInput);
      const field = page.locator('kakao-slider .number-input');

      await field.fill('');
      await field.pressSequentially('120');
      let r = await read(page);
      assert.equal(r.field, '120', 'the text is kept while typing');
      assert.equal(r.value, 120);
      assert.equal(r.thumb, '120');
      assert.deepEqual(r.events.filter(([t]) => t === 'slider-change'), [], 'no change while typing');
      assert.deepEqual(r.events.at(-1), ['slider-input', 120]);

      await field.press('Enter');
      r = await read(page);
      assert.equal(r.field, '120');
      assert.deepEqual(r.events.filter(([t]) => t === 'slider-change'), [['slider-change', 120]], 'one change on commit');

      await field.fill('');
      await field.pressSequentially('5');
      r = await read(page);
      assert.equal(r.field, '5', 'below min stays as typed');
      assert.equal(r.value, 120, 'the thumb waits for a value inside min…max');
      await page.click('button');
      r = await read(page);
      assert.equal(r.field, '20', 'blur clamps and rewrites');
      assert.equal(r.value, 20);
      assert.deepEqual(r.events.at(-1), ['slider-change', 20]);
    } finally {
      await browser.close();
    }
  });
}
