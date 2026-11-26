'use strict';
/* tools/skills.js: the skill copies match skills/<name>/; --check names drift. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { compare, main } = require('../skills');

const ROOT = path.join(__dirname, '../..');
const sink = () => { const s = { text: '', write(t) { s.text += t; return true; } }; return s; };

test('the repo\'s copies match the source', () => {
  const { skills, problems } = compare(ROOT);
  assert.ok(skills.includes('kakao-ui'));
  assert.deepEqual(problems, []);
});

test('--check names a differing, missing and extra file; a write fixes them', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kakao-skills-'));
  try {
    fs.mkdirSync(path.join(tmp, 'skills/demo'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'skills/demo/SKILL.md'), 'source\n');
    assert.equal(main([], tmp, sink(), sink()), 0);
    assert.equal(main(['--check'], tmp, sink(), sink()), 0);

    fs.writeFileSync(path.join(tmp, '.pi/skills/demo/SKILL.md'), 'edited by hand\n');
    fs.rmSync(path.join(tmp, '.claude/skills/demo/SKILL.md'));
    fs.writeFileSync(path.join(tmp, '.claude/skills/demo/extra.md'), 'x');
    const err = sink();
    assert.equal(main(['--check'], tmp, sink(), err), 1);
    assert.match(err.text, /\.pi\/skills\/demo\/SKILL\.md differs/);
    assert.match(err.text, /\.claude\/skills\/demo\/SKILL\.md missing/);
    assert.match(err.text, /\.claude\/skills\/demo\/extra\.md not in the source/);

    assert.equal(main([], tmp, sink(), sink()), 0);
    assert.equal(main(['--check'], tmp, sink(), sink()), 0);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
