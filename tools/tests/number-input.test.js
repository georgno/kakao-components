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

test('bare form keeps its markup; label, hint and error are wired for assistive tech', { skip }, async () => {
  const browser = await playwright.chromium.launch();
  try {
    const page = await open(browser, `
      <kakao-number-input id="bare"><input type="number" aria-label="n"></kakao-number-input>
      <kakao-number-input id="full" label="Weight" hint="In kilograms"><input type="number" min="20" max="300" value="70" aria-describedby="page-note"></kakao-number-input>
      <p id="page-note">note</p>`);
    const r = await page.evaluate(async () => {
      const bare = document.getElementById('bare');
      const full = document.getElementById('full');
      const input = full.querySelector('input');
      const label = full.querySelector('label');
      const snap = () => ({
        describedby: input.getAttribute('aria-describedby'),
        invalid: input.getAttribute('aria-invalid'),
        valid: input.validity.valid,
        hintShown: !!full.querySelector('.kakao-number-input-hint').offsetParent,
        errorShown: !!full.querySelector('.kakao-number-input-error').offsetParent,
        border: getComputedStyle(input).borderTopColor,
      });
      const out = {
        bareChildren: [...bare.children].map((c) => c.localName + (c.className ? '.' + c.className : '')),
        labelFor: label.htmlFor === input.id && !!input.id,
        labelText: label.textContent,
        arrowsParent: full.querySelector('.kakao-number-input-arrows').parentElement.className,
        hintOnly: snap(),
      };
      const settle = () => new Promise((res) => setTimeout(res, 250)); // border-color transition
      full.setAttribute('error', 'Too light');
      await settle();
      out.withError = snap();
      full.removeAttribute('error');
      await settle();
      out.cleared = snap();
      return out;
    });
    assert.deepEqual(r.bareChildren, ['input', 'div.kakao-number-input-arrows'], 'no attributes: the markup of before');
    assert.ok(r.labelFor, 'label for = input id');
    assert.equal(r.labelText, 'Weight');
    assert.equal(r.arrowsParent, 'kakao-number-input-field');
    const id = await page.evaluate(() => document.querySelector('#full input').id);
    assert.equal(r.hintOnly.describedby, `page-note ${id}-hint`, "the page's own id stays");
    assert.equal(r.hintOnly.invalid, null);
    assert.ok(r.hintOnly.hintShown && !r.hintOnly.errorShown);
    assert.equal(r.withError.describedby, `page-note ${id}-error`);
    assert.equal(r.withError.invalid, 'true');
    assert.equal(r.withError.valid, false);
    assert.ok(!r.withError.hintShown && r.withError.errorShown, 'the hint hides while there is an error');
    assert.notEqual(r.withError.border, r.hintOnly.border, 'red border');
    assert.deepEqual(r.cleared, r.hintOnly, 'removing the error restores the hint state');
  } finally {
    await browser.close();
  }
});
