'use strict';
/* tools/manifest.js: header parsing, the manifest's shape and --check. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { build, entriesOf, enumOf } = require('../manifest');

const ROOT = path.join(__dirname, '../..');
const manifest = build(ROOT);
const decl = (tag) => manifest.modules.flatMap((m) => m.declarations).find((d) => d.tagName === tag);

test('entries: names, a type column, continuation lines, several names', () => {
  const e = entriesOf([
    '  label         string   Visible label.',
    '                         Default "Value".',
    '  name · value · form   Form participation.',
    '  run(promiseOrFactory, { successHold? })   loading → success',
    '  A prose line that is not an entry.',
  ]);
  assert.deepEqual(e[0], { names: ['label'], type: 'string', description: 'Visible label. Default "Value".' });
  assert.deepEqual(e[1].names, ['name', 'value', 'form']);
  assert.deepEqual(e[2].names, ['run(promiseOrFactory, { successHold? })']);
  assert.equal(e.length, 3);
});

test('entries: several names with the description on the next lines', () => {
  const e = entriesOf([
    '  name · required · disabled',
    '                  Form participation.',
    '  size            sm · md (default) · lg',
  ]);
  assert.deepEqual(e[0], { names: ['name', 'required', 'disabled'], description: 'Form participation.' });
  assert.deepEqual(e[1].names, ['size']);
});

test('allowed values and the default come from "a · b (default) · c"', () => {
  assert.deepEqual(enumOf('sm · md (default) · lg: bar height'), { values: ['sm', 'md', 'lg'], default: 'md' });
  assert.deepEqual(enumOf('"click" | "hover" | "manual"'), { values: ['click', 'hover', 'manual'], default: null });
  assert.equal(enumOf('Visible label above the field.'), null);
});

test('every component is in the manifest with its files and dependencies', () => {
  const dirs = fs.readdirSync(path.join(ROOT, 'components')).filter((n) => fs.existsSync(path.join(ROOT, 'components', n, `${n}.js`)));
  assert.equal(manifest.modules.length, dirs.length);
  assert.equal(manifest.schemaVersion, '2.1.0');
  assert.deepEqual(decl('kakao-toast').kakao.requires, ['kakao-stack', 'kakao-alert']);
  assert.deepEqual(decl('kakao-tabs').kakao.css, ['components/tabs/tabs.css']);
  assert.equal(decl('kakao-table').kakao.lightDom, true);
  assert.equal(decl('kakao-badge').kakao.lightDom, false);
  assert.ok(decl('kakao-tab'), 'second tags of a file are declared too');
});

test('attributes, events, members and CSS properties are read', () => {
  const badge = decl('kakao-badge');
  assert.equal(badge.attributes.find((a) => a.name === 'tone').default, "'neutral'");
  assert.ok(badge.cssProperties.some((p) => p.name === '--kakao-badge-radius'));
  assert.ok(decl('kakao-button').members.some((m) => m.kind === 'method' && m.name === 'run'));
  assert.ok(decl('kakao-tabs').events.some((e) => e.name === 'tab-change' && /controls/.test(e.type.text)));
});

test('--check passes on a fresh file and fails on a stale one', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-'));
  fs.cpSync(path.join(ROOT, 'components'), path.join(dir, 'components'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(dir, 'index.html'));
  fs.mkdirSync(path.join(dir, 'shared'));
  fs.copyFileSync(path.join(ROOT, 'shared/tokens.css'), path.join(dir, 'shared/tokens.css'));
  const run = (...a) => spawnSync(process.execPath, [path.join(ROOT, 'tools/manifest.js'), '--root', dir, ...a], { encoding: 'utf8' });
  assert.equal(run().status, 0);
  assert.equal(run('--check').status, 0);
  const f = path.join(dir, 'components/badge/badge.js');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(' *  outline   ', ' *  outlined  '));
  const r = run('--check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /out of date/);
});
