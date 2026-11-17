'use strict';
/* Resolution: the exporter's resolved values against what a browser computed
   for the same settings (fixtures/browser.json, see record-browser.js), plus
   the colour-mix maths on its own. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { build } = require('../../export-tokens');
const { mixSrgb } = require('../resolve');
const fixtures = require('./fixtures/browser.json');

const ROOT = path.join(__dirname, '../../..');
const exported = build(ROOT);

/** A computed colour (rgb(), rgba(), color(srgb … / a)) as 8-bit [r, g, b, a]. */
function browserColor(text) {
  let m = /^rgba?\(([^)]+)\)$/.exec(text.trim());
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], Math.round((p[3] ?? 1) * 255)];
  }
  m = /^color\(srgb ([^)]+)\)$/.exec(text.trim());
  if (m) {
    const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number);
    return [...p.slice(0, 3).map((x) => Math.round(x * 255)), Math.round((p[3] ?? 1) * 255)];
  }
  throw new Error(`cannot read browser colour "${text}"`);
}

const hex8 = (hex) => [1, 3, 5, 7].map((k) => parseInt(hex.slice(k, k + 2), 16));

/** box-shadow as the browser serialises it: "<colour> x y blur spread[ inset]" per layer. */
function browserShadow(text) {
  const layers = [];
  let depth = 0;
  let cur = '';
  for (const ch of text) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      layers.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  layers.push(cur.trim());
  return layers.map((l) => {
    const close = l.lastIndexOf(')');
    const color = l.slice(0, close + 1);
    const nums = l.slice(close + 1).trim().split(/\s+/).filter((x) => x !== 'inset').map(parseFloat);
    return { color: browserColor(color), lengths: nums, inset: / inset$/.test(l) };
  });
}

function closeTo(a, b, what) {
  a.forEach((x, k) => assert.ok(Math.abs(x - b[k]) <= 1, `${what}: exporter ${a} vs browser ${b}`));
}

function resolvedFor(component, alias, theme) {
  const setting = Object.values(exported.components[component].settings).find((s) => s.alias === alias);
  assert.ok(setting, `${component} ${alias} is exported`);
  return setting.themed ? setting.resolved[theme] : setting.resolved;
}

test(`exporter matches ${fixtures.browser} for ${fixtures.values.length} sampled values`, () => {
  assert.ok(fixtures.values.length >= 40);
  for (const f of fixtures.values) {
    const what = `${f.component} ${f.alias} in ${f.theme}`;
    const node = resolvedFor(f.component, f.alias, f.theme);
    if (f.property === 'box-shadow') {
      assert.equal(node.type, 'shadow', what);
      const layers = browserShadow(f.computed);
      assert.equal(node.layers.length, layers.length, what);
      node.layers.forEach((l, k) => {
        closeTo(hex8(l.color.hex), layers[k].color, `${what} layer ${k} colour`);
        assert.deepEqual([l.x.px, l.y.px, l.blur.px, l.spread.px], layers[k].lengths, `${what} layer ${k} lengths`);
      });
    } else {
      assert.equal(node.type, 'color', what);
      closeTo(hex8(node.hex), browserColor(f.computed), what);
    }
  }
});

test('the sample covers dark, amoled and more-contrast mode', () => {
  const themes = new Set(fixtures.values.map((v) => v.theme));
  for (const t of ['dark', 'amoled', 'dark/contrast']) assert.ok(themes.has(t), t);
});

test('color-mix: one percentage, both, and transparent', () => {
  assert.equal(mixSrgb('#18181bff', 16, '#00000000', null), '#18181b29');
  assert.equal(mixSrgb('#ff0000ff', 50, '#0000ffff', 50), '#800080ff');
  // Percentages under 100% scale the alpha down.
  assert.equal(mixSrgb('#ff0000ff', 20, '#0000ffff', 20), '#80008066');
});

test('a setting following a colour role keeps the reference and resolves per theme', () => {
  const on = exported.components['switch-group'].settings['track-bg-on'];
  assert.equal(on.value.type, 'ref');
  assert.equal(on.value.token, 'color-primary');
  assert.equal(on.themed, true);
  assert.equal(on.resolved.light.hex, '#4f46e5ff');
  assert.notEqual(on.resolved.dark.hex, on.resolved.light.hex);
});

test('values a number cannot hold stay typed expressions', () => {
  const pad = exported.components['error-page'].settings.padding.resolved;
  assert.deepEqual(pad, {
    type: 'clamp',
    args: [
      { type: 'length', px: 24 },
      { type: 'viewport', unit: 'vw', value: 6 },
      { type: 'length', px: 48 },
    ],
  });
  const full = exported.components['error-page'].settings['full-height'].resolved;
  assert.equal(full.type, 'calc');
  assert.equal(full.expr.right.type, 'ref'); // set at runtime by the header bar
  assert.equal(full.expr.right.name, '--kakao-header-bar-rendered-height');
});
