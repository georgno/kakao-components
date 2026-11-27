'use strict';
/*
 * kakao-animated-number: setting the value it is already rolling to leaves
 * the roll running (a page that updates on two events in a row did snap it
 * to the end). Runs in Chromium when Playwright is installed (not a
 * dependency of this repo; skipped without it).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
let playwright = null;
try { playwright = require('playwright'); } catch { playwright = null; }

test('the same value during a roll keeps the roll', { skip: !playwright && 'Playwright is not installed' }, async () => {
  const browser = await playwright.chromium.launch();
  try {
    const page = await browser.newPage({ reducedMotion: 'no-preference' });
    await page.setContent('<!doctype html><html><body><kakao-animated-number value="22.9" decimals="1" duration="600"></kakao-animated-number></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(path.join(ROOT, 'components/animated-number/animated-number.js'), 'utf8') });
    const r = await page.evaluate(async () => {
      const el = document.querySelector('kakao-animated-number');
      const done = [];
      el.addEventListener('kakao-animated-number-complete', (e) => done.push(e.detail.value));
      el.value = 23.0;
      await new Promise((res) => setTimeout(res, 100));
      el.value = 23.0;
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      const runningAfterSecondSet = el.shadowRoot.getAnimations().length > 0;
      await new Promise((res) => setTimeout(res, 900));
      return { runningAfterSecondSet, value: el.value, animating: el._animating, done };
    });
    assert.ok(r.runningAfterSecondSet, 'still rolling after the second set');
    assert.equal(r.value, 23);
    assert.equal(r.animating, false, 'the roll ends');
    assert.deepEqual(r.done, [23], 'one roll, ending on 23.0');
  } finally {
    await browser.close();
  }
});
