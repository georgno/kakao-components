'use strict';
/*
 * The names components share (openspec/specs/vocabulary), checked on
 * custom-elements.json, plus the style checker's value table against it.
 * A deliberate exception goes into the lists below with its reason.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { build } = require('../manifest');
const { VALUES } = require('../style-check/helpers');

const ROOT = path.join(__dirname, '../..');
const manifest = build(ROOT);
const decls = manifest.modules.flatMap((m) => m.declarations.map((d) => ({ ...d, module: m.path })));
const valuesOf = (a) => (a.type && /'/.test(a.type.text) ? a.type.text.match(/'([^']*)'/g).map((v) => v.slice(1, -1)) : null);

/* Tones: the status set, plus what a component adds for a documented reason. */
const TONES = ['neutral', 'primary', 'success', 'warning', 'danger'];
const TONE_EXTRAS = {
  ink: 'badge, chip: the solid strong label',
  info: 'alert, toast: a message has a severity; info is drawn in the primary colour',
  auto: 'avatar: a tone picked from the name',
  none: 'spinner: the ring takes the text colour',
  muted: 'spinner: a quiet ring',
};
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];

/* Event names from before the rules; renaming them would break pages. */
const LEGACY_EVENTS = new Set(['kakao-button-action', 'kakao-button-select', 'kakao-button-menu', 'kakao-button-menu-hover']);

test('VALUES lists every enumerated attribute of the manifest, with the same values', () => {
  for (const d of decls) {
    for (const a of d.attributes || []) {
      const vals = valuesOf(a);
      if (!vals) continue;
      const table = (VALUES[d.tagName] || {})[a.name];
      assert.ok(table, `VALUES has no ${d.tagName} ${a.name} (${vals.join(', ')})`);
      assert.deepEqual([...table].sort(), [...vals].sort(), `VALUES ${d.tagName} ${a.name}`);
    }
  }
});

test('every VALUES entry is an attribute in the manifest', () => {
  for (const [tag, attrs] of Object.entries(VALUES)) {
    const d = decls.find((x) => x.tagName === tag);
    assert.ok(d, `VALUES names ${tag}, which is not a component`);
    for (const name of Object.keys(attrs)) {
      assert.ok((d.attributes || []).some((a) => a.name === name), `VALUES ${tag} ${name}: no such attribute in the header`);
    }
  }
});

test('tones: the shared set, warning wherever success and danger are', () => {
  for (const d of decls) {
    const a = (d.attributes || []).find((x) => x.name === 'tone');
    if (!a) continue;
    const vals = valuesOf(a);
    assert.ok(vals, `${d.tagName} tone lists no values`);
    for (const v of vals) assert.ok(TONES.includes(v) || v in TONE_EXTRAS, `${d.tagName} tone ${v} is not a shared tone`);
    if (vals.includes('success') && vals.includes('danger')) assert.ok(vals.includes('warning'), `${d.tagName} tone has no warning`);
    assert.ok(!vals.includes('error'), `${d.tagName}: the tone is danger, never error`);
  }
});

test('sizes: sm · md · lg (avatars also xs and xl), md the default', () => {
  for (const d of decls) {
    const a = (d.attributes || []).find((x) => x.name === 'size');
    if (!a) continue;
    const vals = valuesOf(a);
    assert.ok(vals, `${d.tagName} size lists no values`);
    for (const v of vals) assert.ok(SIZES.includes(v), `${d.tagName} size ${v}`);
    assert.ok(vals.includes('md'), `${d.tagName} size has no md`);
    if (a.default) assert.equal(a.default, "'md'", `${d.tagName} size default`);
  }
});

test('names: list-data for JSON, <thing>-label and <thing>-text, kebab-case', () => {
  for (const d of decls) {
    for (const a of d.attributes || []) {
      assert.notEqual(a.name, 'data', `${d.tagName}: JSON goes in list-data, never data`);
      assert.ok(!/^(label|text)-/.test(a.name), `${d.tagName} ${a.name}: write <thing>-label / <thing>-text`);
      assert.match(a.name, /^[a-z][a-z0-9-]*$/, `${d.tagName} ${a.name}`);
    }
  }
});

test('events: kebab-case, no kakao- prefix', () => {
  for (const d of decls) {
    for (const e of d.events || []) {
      assert.match(e.name, /^[a-z][a-z0-9-]*$/, `${d.tagName} event ${e.name}`);
      if (LEGACY_EVENTS.has(e.name)) continue;
      assert.ok(!/^(kakao-|on)/.test(e.name), `${d.tagName} event ${e.name}`);
    }
  }
});

test('a component that renders slots lists them', () => {
  for (const m of manifest.modules) {
    const code = fs.readFileSync(path.join(ROOT, m.path), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const names = new Set([...code.matchAll(/<slot(?:\s+name="([a-z-]+)")?/g)].map((x) => x[1] || ''));
    if (!names.size) continue;
    const listed = new Set(m.declarations.flatMap((d) => (d.slots || []).map((s) => s.name)));
    for (const n of names) assert.ok(listed.has(n), `${m.path}: slot "${n || '(default)'}" is not in a SLOTS section`);
  }
});
