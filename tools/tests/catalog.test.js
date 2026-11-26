'use strict';
/* tools/catalog.js: the generated component list, the tag check and --check;
   tools/manifest.js: the CATALOG header section it is built from. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { render, componentLines, CatalogError } = require('../catalog');
const { build } = require('../manifest');

const ROOT = path.join(__dirname, '../..');
const manifest = build(ROOT);
const lines = componentLines(manifest);
const line = (tag) => lines.find((l) => l.startsWith(`- \`${tag}\``));

test('one line per component, with what for, not for, DOM and dependencies', () => {
  assert.equal(lines.length, manifest.modules.length);
  assert.match(line('kakao-badge'), /: A short read-only status label.* Not for clickable.*kakao-chip\.$/);
  assert.match(line('kakao-tabs'), /^- `kakao-tabs` \+ `kakao-tab`: .*\(light DOM, tabs\.css\)$/);
  assert.match(line('kakao-toast'), /\(light DOM; after kakao-stack, kakao-alert\)$/);
  assert.match(line('kakao-grid-view'), /\(light DOM, grid-view\.css; after kakao-table\)$/);
  assert.doesNotMatch(line('kakao-badge'), /\(/, 'a shadow-DOM component without dependencies is unmarked');
});

test('the manifest carries the CATALOG lines: summary and kakao.notFor', () => {
  const tabs = manifest.modules.find((m) => m.path === 'components/tabs/tabs.js');
  const main = tabs.declarations.find((d) => d.tagName === 'kakao-tabs');
  assert.ok(main.summary);
  assert.ok(main.kakao.notFor);
  assert.equal(tabs.declarations.find((d) => d.tagName === 'kakao-tab').summary, undefined);
});

test('a header without a CATALOG section is an error', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kakao-catalog-'));
  try {
    fs.mkdirSync(path.join(tmp, 'components/foo'), { recursive: true });
    fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(tmp, 'index.html'));
    const header = (catalog) =>
      `/**\n * <kakao-foo>\n * A foo.\n *\n${catalog} * ----------------------------------------------------------------------------\n * FILES\n * ----------------------------------------------------------------------------\n *  script     foo.js\n *  css        none\n *  requires   none\n *  enhanced   none\n */\ncustomElements.define('kakao-foo', class Foo extends HTMLElement {});\n`;
    fs.writeFileSync(path.join(tmp, 'components/foo/foo.js'), header(''));
    assert.throws(() => build(tmp), /no CATALOG section/);
    const dash = ' * ----------------------------------------------------------------------------\n';
    fs.writeFileSync(path.join(tmp, 'components/foo/foo.js'), header(`${dash} * CATALOG\n${dash} *  for        Foos.\n *\n`));
    assert.throws(() => build(tmp), /CATALOG has no "not for" line/);
    fs.writeFileSync(
      path.join(tmp, 'components/foo/foo.js'),
      header(`${dash} * CATALOG\n${dash} *  for        Foos, and a line\n *             that goes on.\n *  not for    Bars: kakao-foo.\n *\n`),
    );
    const decl = build(tmp).modules[0].declarations[0];
    assert.equal(decl.summary, 'Foos, and a line that goes on.');
    assert.equal(decl.kakao.notFor, 'Bars: kakao-foo.');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('the whole file may only name tags that exist', () => {
  const doc = '# x\n\nUse kakao-nope here.\n<!-- catalog:start -->\n<!-- catalog:end -->\n';
  assert.throws(() => render(doc, manifest), (e) => e instanceof CatalogError && /kakao-nope/.test(e.message));
  // Custom properties, events and the library's name are not tags.
  const ok = '# kakao-components\n\n`--kakao-color-text`, `kakao-button-action`.\n<!-- catalog:start -->\n<!-- catalog:end -->\n';
  assert.match(render(ok, manifest), /`kakao-tabs`/);
  assert.throws(() => render('no markers\n', manifest), /markers/);
});

test('--check passes on the repo and fails on a stale list', () => {
  const run = (args) => spawnSync(process.execPath, [path.join(ROOT, 'tools/catalog.js'), ...args], { encoding: 'utf8' });
  assert.equal(run(['--check']).status, 0, 'CATALOG.md is up to date (run node tools/catalog.js)');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kakao-catalog-'));
  try {
    fs.copyFileSync(path.join(ROOT, 'custom-elements.json'), path.join(tmp, 'custom-elements.json'));
    const stale = fs.readFileSync(path.join(ROOT, 'CATALOG.md'), 'utf8').replace(/^- `kakao-badge`.*\n/m, '');
    fs.writeFileSync(path.join(tmp, 'CATALOG.md'), stale);
    assert.equal(run(['--check', '--root', tmp]).status, 1);
    assert.equal(run(['--root', tmp]).status, 0);
    assert.equal(run(['--check', '--root', tmp]).status, 0);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
