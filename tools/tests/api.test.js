'use strict';
/* tools/api.js: one component's API, short, from custom-elements.json and its header. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { main, usage } = require('../api');
const { main: vendor } = require('../vendor');

const ROOT = path.join(__dirname, '../..');
const sink = () => { const s = { text: '', write(t) { s.text += t; return true; } }; return s; };
const run = (args, root = ROOT) => { const out = sink(); const err = sink(); const code = main(args, root, out, err); return { code, out: out.text, err: err.text }; };

test('a tag prints purpose, values, slots and the example without file tags', () => {
  const { code, out } = run(['kakao-section-header']);
  assert.equal(code, 0);
  assert.match(out, /^kakao-section-header {2}\(light DOM, section-header\.css\)/);
  assert.match(out, /Not for: /);
  assert.match(out, /count-tone {6}neutral · primary · success · warning · danger/);
  assert.match(out, /\nSlots\n {2}actions/);
  assert.match(out, /\nExample\n/);
  assert.doesNotMatch(out, /<script|<link/);
});

test('every tag prints, and stays short (under 8k characters, about 2k tokens, without --css)', () => {
  const list = run(['--list']).out.trim().split('\n').map((l) => l.split(/\s+/)[0]);
  assert.ok(list.length > 60);
  for (const tag of list) {
    const { code, out } = run([tag]);
    assert.equal(code, 0, tag);
    assert.ok(out.length < 8000, `${tag}: ${out.length} characters`);
  }
});

test('folder names resolve, a shared example prints once, --css adds properties', () => {
  const { out } = run(['tabs']);
  assert.match(out, /^kakao-tab /m);
  assert.match(out, /^kakao-tabs /m);
  assert.equal(out.match(/\nExample\n/g).length, 1);
  assert.match(run(['tabs', '--css']).out, /--kakao-tabs-bg/);
});

test('unknown names and no names are usage errors', () => {
  assert.equal(run(['kakao-nope']).code, 2);
  assert.match(run(['kakao-nope']).err, /unknown component kakao-nope/);
  assert.equal(run([]).code, 2);
});

test('usage() reads BASIC USAGE too and stops at the next section', () => {
  const src = '/**\n * BASIC USAGE\n * ------\n *   <script src="x.js"><\\/script>\n *   <kakao-x></kakao-x>\n *\n * ----------\n * ATTRIBUTES\n */';
  assert.equal(usage(src), '  <kakao-x></kakao-x>');
});

test('works from a vendored copy', () => {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'kakao-api-'));
  try {
    vendor([dest, 'badge'], ROOT, sink(), sink());
    assert.ok(fs.existsSync(path.join(dest, 'tools/api.js')));
    assert.ok(fs.existsSync(path.join(dest, 'tools/style-check.js')));
    assert.ok(!fs.existsSync(path.join(dest, 'tools/style-check/tests')));
    const { code, out } = run(['kakao-badge'], dest);
    assert.equal(code, 0);
    assert.match(out, /tone {12}neutral \(default\)/);
  } finally {
    fs.rmSync(dest, { recursive: true, force: true });
  }
});
