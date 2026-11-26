'use strict';
/* tools/loader.js: shared/kakao.css and the loader's map are generated from
   their sources and checked; closure() orders dependencies. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { tagMap, closure, css, js, main, CSS_PARTS } = require('../loader');

const ROOT = path.join(__dirname, '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'custom-elements.json'), 'utf8'));
const map = tagMap(manifest);

test('kakao.css and the map in kakao.js are up to date', () => {
  assert.equal(fs.readFileSync(path.join(ROOT, 'shared/kakao.css'), 'utf8'), css(ROOT));
  const current = fs.readFileSync(path.join(ROOT, 'shared/kakao.js'), 'utf8');
  assert.equal(current, js(current, manifest));
});

test('kakao.css holds tokens, font and themes in that order, unchanged', () => {
  const text = css(ROOT);
  let at = 0;
  for (const f of CSS_PARTS) {
    const i = text.indexOf(fs.readFileSync(path.join(ROOT, f), 'utf8').trimEnd());
    assert.ok(i > at, `${f} in order`);
    at = i;
  }
});

test('the map has every tag with script, css, requires and enhancers', () => {
  const MAP = new Function(`${/const MAP = \{[\s\S]*?\n  \};/.exec(fs.readFileSync(path.join(ROOT, 'shared/kakao.js'), 'utf8'))[0]} return MAP;`)();
  assert.equal(Object.keys(MAP).length, map.size);
  assert.deepEqual(MAP['kakao-toast'], ['components/toast/toast.js', [], ['kakao-stack', 'kakao-alert'], ['kakao-button']]);
  assert.deepEqual(MAP['kakao-tab'][1], ['components/tabs/tabs.css']);
});

test('closure: requires first, then enhancers, then the tag; each once', () => {
  assert.deepEqual(closure(map, ['kakao-toast']), ['kakao-stack', 'kakao-alert', 'kakao-tooltip', 'kakao-button', 'kakao-toast']);
  const grid = closure(map, ['kakao-grid-view', 'kakao-table']);
  assert.ok(grid.indexOf('kakao-table') < grid.indexOf('kakao-grid-view'));
  assert.equal(new Set(grid).size, grid.length);
  assert.deepEqual(closure(map, ['kakao-nope']), []);
});

test('--check fails on a stale kakao.css and names it; a write fixes it', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kakao-loader-'));
  try {
    for (const f of [...CSS_PARTS, 'shared/kakao.css', 'shared/kakao.js', 'custom-elements.json']) {
      fs.mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true });
      fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
    }
    fs.appendFileSync(path.join(tmp, 'shared/tokens.css'), ':root { --kakao-x: 1px; }\n');
    let message = '';
    const orig = process.stderr.write;
    process.stderr.write = (s) => { message += s; return true; };
    const origOut = process.stdout.write;
    process.stdout.write = () => true;
    try {
      assert.equal(main(['--check'], tmp), 1);
      assert.match(message, /shared\/kakao\.css out of date/);
      assert.equal(main([], tmp), 0);
      assert.equal(main(['--check'], tmp), 0);
    } finally {
      process.stderr.write = orig;
      process.stdout.write = origOut;
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('kakao.js stays inlineable: no closing script tag', () => {
  assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'shared/kakao.js'), 'utf8'), /<\/script/i);
});
