'use strict';
/* tools/vendor.js: copies exactly what the named components need, writes VERSION. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { filesFor, main } = require('../vendor');

const ROOT = path.join(__dirname, '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'custom-elements.json'), 'utf8'));
const sink = () => { const s = { text: '', write(t) { s.text += t; return true; } }; return s; };

test('toast brings stack, alert and its enhancers, nothing else', () => {
  const { files } = filesFor(manifest, ['toast']);
  const components = files.filter((f) => f.startsWith('components/')).sort();
  assert.deepEqual(components, [
    'components/alert/alert.js',
    'components/button/button.css',
    'components/button/button.js',
    'components/stack/stack.js',
    'components/toast/toast.js',
    'components/tooltip/tooltip.js',
  ]);
  assert.ok(files.includes('shared/kakao.js') && files.includes('shared/fonts') && files.includes('CATALOG.md'));
});

test('a tag names its folder; no names means all', () => {
  assert.ok(filesFor(manifest, ['kakao-tab']).files.includes('components/tabs/tabs.css'));
  const all = filesFor(manifest, []).files.filter((f) => /^components\/[^/]+\/[^/]+\.js$/.test(f));
  assert.equal(all.length, manifest.modules.length);
});

test('copies, writes VERSION, refuses unknown names and foreign folders', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kakao-vendor-'));
  try {
    const dest = path.join(tmp, 'kakao');
    const err = sink();
    assert.equal(main([dest, 'tabs'], ROOT, sink(), err), 0);
    assert.ok(fs.existsSync(path.join(dest, 'components/tabs/tabs.css')));
    assert.ok(fs.existsSync(path.join(dest, 'shared/fonts/inter-tight/OFL.txt')));
    assert.ok(!fs.existsSync(path.join(dest, 'components/tabs/demo.html')));
    assert.match(fs.readFileSync(path.join(dest, 'VERSION'), 'utf8'), /^\S+\n$/);
    for (const f of ['skills/kakao-ui/SKILL.md', 'templates/page.html', 'recipes/form.html']) {
      assert.ok(fs.existsSync(path.join(dest, f)), `${f} is copied`);
    }

    // Again with another set: the earlier copy is replaced, nothing stale stays.
    assert.equal(main([dest, 'badge'], ROOT, sink(), sink()), 0);
    assert.ok(!fs.existsSync(path.join(dest, 'components/tabs')));
    assert.ok(fs.existsSync(path.join(dest, 'components/badge/badge.js')));

    const unknown = sink();
    assert.equal(main([dest, 'nope'], ROOT, sink(), unknown), 2);
    assert.match(unknown.text, /unknown component nope/);

    const foreign = path.join(tmp, 'foreign');
    fs.mkdirSync(foreign);
    fs.writeFileSync(path.join(foreign, 'keep.txt'), 'x');
    assert.equal(main([foreign], ROOT, sink(), sink()), 2);
    assert.ok(fs.existsSync(path.join(foreign, 'keep.txt')));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
