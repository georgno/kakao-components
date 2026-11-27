'use strict';
/*
 * kakao-number-input in the browser: the steppers send input per step and
 * change once when the press ends, like a native field. Runs in Chromium when
 * Playwright is installed (not a dependency of this repo; skipped without it).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
let playwright = null;
try { playwright = require('playwright'); } catch { playwright = null; }
const skip = !playwright && 'Playwright is not installed';

async function open(browser, body) {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html><body>${body}</body></html>`);
  await page.addStyleTag({ content: fs.readFileSync(path.join(ROOT, 'components/number-input/number-input.css'), 'utf8') });
  await page.addScriptTag({ content: fs.readFileSync(path.join(ROOT, 'components/number-input/number-input.js'), 'utf8') });
  await page.evaluate(() => {
    window.events = [];
    for (const t of ['input', 'change']) document.addEventListener(t, (e) => window.events.push([t, e.target.value]));
  });
  return page;
}
const count = (events, type) => events.filter(([t]) => t === type).length;

test('a tap sends one input and one change; a held press n inputs and one change', { skip }, async () => {
  const browser = await playwright.chromium.launch();
  try {
    const page = await open(browser, '<kakao-number-input touch-steppers><input type="number" min="0" max="100" value="10" aria-label="n"></kakao-number-input>');
    const plus = page.locator('.kakao-number-input-up');

    await plus.click();
    let ev = await page.evaluate(() => window.events.splice(0));
    assert.deepEqual(ev, [['input', '11'], ['change', '11']]);

    await plus.hover();
    await page.mouse.down();
    await page.waitForTimeout(800);
    await page.mouse.up();
    ev = await page.evaluate(() => window.events.splice(0));
    const inputs = count(ev, 'input');
    assert.ok(inputs > 2, `held press repeats (${inputs} inputs)`);
    assert.equal(count(ev, 'change'), 1, 'one change for the whole press');
    assert.deepEqual(ev.at(-1)[0], 'change', 'change comes when the press ends');
    assert.equal(ev.at(-1)[1], ev.at(-2)[1], 'change carries the last value');

    await page.evaluate(() => { document.querySelector('input').value = '100'; });
    await plus.click();
    ev = await page.evaluate(() => window.events.splice(0));
    assert.deepEqual(ev, [], 'a step at max sends nothing');
  } finally {
    await browser.close();
  }
});
