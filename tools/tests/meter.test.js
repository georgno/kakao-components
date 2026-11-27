'use strict';
/*
 * kakao-meter's named bands (list-data): the band the value is in decides the
 * fill tone, aria-valuetext and the emphasised name; boundaries are marked.
 * Without list-data the native low/high/optimum regions still apply. Runs in
 * Chromium when Playwright is installed (not a dependency of this repo;
 * skipped without it).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
let playwright = null;
try { playwright = require('playwright'); } catch { playwright = null; }

const BMI = JSON.stringify([
  { to: 18.5, label: 'Underweight', tone: 'warning' },
  { to: 25, label: 'Normal', tone: 'success' },
  { to: 30, label: 'Overweight', tone: 'warning' },
  { label: 'Obese', tone: 'danger' },
]);

test('named bands: tone, valuetext, marks and the current name', { skip: !playwright && 'Playwright is not installed' }, async () => {
  const browser = await playwright.chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html lang="en"><body>
      <kakao-meter id="bmi" label="BMI" min="10" max="40" value="23.1" show-value list-data='${BMI}'></kakao-meter>
      <kakao-meter id="plain" label="Storage" max="100" low="30" high="80" optimum="20" value="92"></kakao-meter>
      </body></html>`);
    await page.addScriptTag({ content: fs.readFileSync(path.join(ROOT, 'components/meter/meter.js'), 'utf8') });
    const r = await page.evaluate(() => {
      const m = document.getElementById('bmi');
      const read = () => ({
        tone: m.shadowRoot.querySelector('.bar').dataset.tone,
        valuetext: m.getAttribute('aria-valuetext'),
        current: [...m.shadowRoot.querySelectorAll('.names span[aria-current]')].map((e) => e.textContent),
        shown: m.shadowRoot.querySelector('.value').textContent,
        band: m.band && m.band.label,
      });
      const out = { at: read() };
      out.marks = m.shadowRoot.querySelectorAll('.bar .mark').length;
      out.ticks = [...m.shadowRoot.querySelectorAll('.ticks span')].map((e) => e.textContent);
      out.names = [...m.shadowRoot.querySelectorAll('.names span')].map((e) => e.textContent);
      out.scaleHidden = m.shadowRoot.querySelector('.scale').getAttribute('aria-hidden');
      m.value = 25; out.onBoundary = read();
      m.value = 40; out.atMax = read();
      m.value = 12; out.low = read();
      m.setAttribute('value-text', 'BMI 12, see a doctor'); out.custom = read();
      const plain = document.getElementById('plain');
      out.plain = {
        region: plain.region,
        tone: plain.shadowRoot.querySelector('.bar').dataset.tone,
        valuetext: plain.getAttribute('aria-valuetext'),
        scaleHidden: plain.shadowRoot.querySelector('.scale').hidden,
        band: plain.band,
      };
      return out;
    });
    assert.deepEqual(r.at, { tone: 'success', valuetext: '23.1, Normal', current: ['Normal'], shown: 'Normal', band: 'Normal' });
    assert.equal(r.marks, 3, 'a mark at each inner boundary');
    assert.deepEqual(r.ticks, ['18.5', '25', '30']);
    assert.deepEqual(r.names, ['Underweight', 'Normal', 'Overweight', 'Obese']);
    assert.equal(r.scaleHidden, 'true', 'the scale is hidden from assistive tech');
    assert.equal(r.onBoundary.band, 'Overweight', 'a band does not include its "to"');
    assert.equal(r.atMax.band, 'Obese', 'the last band includes max');
    assert.equal(r.atMax.tone, 'danger');
    assert.equal(r.low.tone, 'warning');
    assert.equal(r.custom.valuetext, 'BMI 12, see a doctor', 'value-text wins');
    assert.deepEqual(r.plain, { region: 'bad', tone: undefined, valuetext: null, scaleHidden: true, band: null }, 'without list-data nothing changes');
  } finally {
    await browser.close();
  }
});
