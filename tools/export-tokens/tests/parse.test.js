'use strict';
/* The value parser and the shadow / font readers. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { parse, ParseError } = require('../parse');
const { readShadow, readFont } = require('../shapes');

test('lengths: px stays, rem is 16px, em stays a factor', () => {
  assert.deepEqual(parse('44px'), { type: 'length', px: 44 });
  assert.deepEqual(parse('0.95rem'), { type: 'length', px: 15.2 });
  assert.deepEqual(parse('0.9em'), { type: 'em', factor: 0.9 });
  assert.deepEqual(parse('0.5cap'), { type: 'cap', factor: 0.5 });
});

test('other units: viewport, percent, angle, durations in ms', () => {
  assert.deepEqual(parse('85vh'), { type: 'viewport', unit: 'vh', value: 85 });
  assert.deepEqual(parse('100dvh'), { type: 'viewport', unit: 'dvh', value: 100 });
  assert.deepEqual(parse('8%'), { type: 'percent', value: 8 });
  assert.deepEqual(parse('-30deg'), { type: 'angle', deg: -30 });
  assert.deepEqual(parse('320ms'), { type: 'duration', ms: 320 });
  assert.deepEqual(parse('0.85s'), { type: 'duration', ms: 850 });
  assert.deepEqual(parse('550'), { type: 'number', value: 550 });
});

test('colours: hex in every length, rgb and rgba in both syntaxes, transparent', () => {
  assert.deepEqual(parse('#4f46e5'), { type: 'color', hex: '#4f46e5ff' });
  assert.deepEqual(parse('#fff'), { type: 'color', hex: '#ffffffff' });
  assert.deepEqual(parse('#0000000a'), { type: 'color', hex: '#0000000a' });
  assert.deepEqual(parse('rgba(0, 0, 0, 0.12)'), { type: 'color', hex: '#0000001f' });
  assert.deepEqual(parse('rgb(0 0 0 / .08)'), { type: 'color', hex: '#00000014' });
  assert.deepEqual(parse('rgb(189, 75, 67)'), { type: 'color', hex: '#bd4b43ff' });
  assert.deepEqual(parse('transparent'), { type: 'color', hex: '#00000000' });
});

test('keywords, strings, currentColor, inherit, none', () => {
  assert.deepEqual(parse('currentColor'), { type: 'currentColor' });
  assert.deepEqual(parse('inherit'), { type: 'inherit' });
  assert.deepEqual(parse('none'), { type: 'none' });
  assert.deepEqual(parse('-apple-system'), { type: 'keyword', value: '-apple-system' });
  assert.deepEqual(parse('"SF Mono"'), { type: 'string', value: 'SF Mono' });
});

test('var() keeps its name and a fallback that may hold commas', () => {
  assert.deepEqual(parse('var(--kakao-color-primary, #4f46e5)'), {
    type: 'ref',
    name: '--kakao-color-primary',
    fallback: { type: 'color', hex: '#4f46e5ff' },
  });
  const fam = parse('var(--kakao-font-family, system-ui, -apple-system, sans-serif)');
  assert.equal(fam.fallback.type, 'list');
  assert.equal(fam.fallback.separator, 'comma');
  assert.equal(fam.fallback.items.length, 3);
  assert.deepEqual(parse('var(--_ink)'), { type: 'ref', name: '--_ink' });
});

test('color-mix(in srgb, …) keeps both stops', () => {
  assert.deepEqual(parse('color-mix(in srgb, var(--_ink) 16%, transparent)'), {
    type: 'mix',
    space: 'srgb',
    a: { color: { type: 'ref', name: '--_ink' }, percent: 16 },
    b: { color: { type: 'color', hex: '#00000000' }, percent: null },
  });
});

test('cubic-bezier() with overshoot', () => {
  assert.deepEqual(parse('cubic-bezier(.5, 1.8, .4, 1)'), { type: 'easing', bezier: [0.5, 1.8, 0.4, 1] });
});

test('calc, clamp and min stay expressions with typed parts', () => {
  assert.deepEqual(parse('clamp(1.5rem, 6vw, 3rem)'), {
    type: 'clamp',
    args: [
      { type: 'length', px: 24 },
      { type: 'viewport', unit: 'vw', value: 6 },
      { type: 'length', px: 48 },
    ],
  });
  assert.deepEqual(parse('calc(var(--_padding) + 22px)'), {
    type: 'calc',
    expr: { type: 'op', op: '+', left: { type: 'ref', name: '--_padding' }, right: { type: 'length', px: 22 } },
  });
  assert.equal(parse('min(100%, 18rem)').type, 'min');
  assert.deepEqual(parse('calc(2 * 3px)').expr, {
    type: 'op',
    op: '*',
    left: { type: 'number', value: 2 },
    right: { type: 'length', px: 3 },
  });
});

test('space and comma lists', () => {
  const v = parse('0 8px 24px rgb(0 0 0 / .08), 0 0 0 1px red');
  assert.equal(v.type, 'list');
  assert.equal(v.separator, 'comma');
  assert.equal(v.items[0].separator, 'space');
});

test('anything outside the subset throws, naming the text', () => {
  assert.throws(() => parse('linear-gradient(red, blue)'), (e) => e instanceof ParseError && /linear-gradient/.test(e.message));
  assert.throws(() => parse('12furlongs'), ParseError);
  assert.throws(() => parse('color-mix(in oklch, red, blue)'), /srgb/);
});

test('the real dialog shadow reads as two layers, the second a colour-mix ring', () => {
  const s = readShadow(
    parse('0 8px 24px rgb(0 0 0 / .08), 0 0 0 1px color-mix(in srgb, var(--kakao-color-text, #18181b) 10%, transparent)'),
  );
  assert.equal(s.type, 'shadow');
  assert.equal(s.layers.length, 2);
  assert.deepEqual(s.layers[0], {
    x: { type: 'length', px: 0 },
    y: { type: 'length', px: 8 },
    blur: { type: 'length', px: 24 },
    spread: { type: 'length', px: 0 },
    color: { type: 'color', hex: '#00000014' },
    inset: false,
  });
  assert.equal(s.layers[1].spread.px, 1);
  assert.equal(s.layers[1].color.type, 'mix');
  assert.deepEqual(readShadow(parse('none')), { type: 'shadow', layers: [] });
});

test('the real switch label font reads as size, line height and family', () => {
  const f = readFont(parse('0.95rem/1.4 var(--kakao-font-family, system-ui, -apple-system, sans-serif)'));
  assert.equal(f.type, 'font');
  assert.deepEqual(f.size, { type: 'length', px: 15.2 });
  assert.deepEqual(f.lineHeight, { type: 'number', value: 1.4 });
  assert.equal(f.family.type, 'ref');
  assert.equal(f.family.name, '--kakao-font-family');
});

test('a font shorthand may lead with a weight (theme switch)', () => {
  const f = readFont(parse('550 0.875rem/1 var(--kakao-font-family, system-ui, sans-serif)'));
  assert.deepEqual(f.weight, { type: 'number', value: 550 });
  assert.deepEqual(f.size, { type: 'length', px: 14 });
  assert.deepEqual(f.lineHeight, { type: 'number', value: 1 });
});
