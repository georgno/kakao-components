'use strict';
/* Built-in rules: one passing and one failing fixture per rule, plus a
   dynamic-value fixture where the rule reads a value. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { check } = require('../../style-check');

const DIR = path.join(__dirname, 'fixtures/rules');
const run = (file) => check({ argv: [file], cwd: DIR });

const EXPECTED_FAILS = {
  'dialog-main-button-corner': 2,
  'card-main-button-first': 1,
  'list-data-name': 1,
  'list-data-json': 1,
  'field-has-name': 5,
  'icon-button-has-name': 3,
  'attribute-values': 6,
};

const rules = fs.readdirSync(path.join(__dirname, '../../style-rules')).map((f) => f.replace(/\.js$/, '')).sort();

test('every built-in rule has fixtures', () => {
  assert.deepEqual(rules, Object.keys(EXPECTED_FAILS).sort());
  for (const id of rules) {
    assert.ok(fs.existsSync(path.join(DIR, `${id}.pass.html`)), `${id}.pass.html`);
    assert.ok(fs.existsSync(path.join(DIR, `${id}.fail.html`)), `${id}.fail.html`);
  }
});

for (const id of Object.keys(EXPECTED_FAILS)) {
  test(`${id}: passing fixture`, () => {
    const r = run(`${id}.pass.html`);
    assert.deepEqual(r.findings, []);
  });
  test(`${id}: failing fixture`, () => {
    const r = run(`${id}.fail.html`);
    assert.equal(r.errors, EXPECTED_FAILS[id]);
    for (const f of r.findings) {
      assert.equal(f.rule, id);
      assert.equal(f.level, 'error');
      assert.equal(f.path, `${id}.fail.html`);
    }
  });
  const dyn = `${id}.dynamic.php`;
  if (fs.existsSync(path.join(DIR, dyn))) {
    test(`${id}: dynamic values are skipped`, () => {
      assert.deepEqual(run(dyn).findings, []);
    });
  }
}

test('dialog-main-button-corner reports the footer of a left dialog', () => {
  const r = run('dialog-main-button-corner.fail.html');
  assert.equal(r.findings[0].line, 2);
  assert.match(r.findings[0].message, /should be first/);
  assert.equal(r.findings[1].line, 8);
  assert.match(r.findings[1].message, /should be last/);
});

test('attribute-values names the allowed values', () => {
  const r = run('attribute-values.fail.html');
  assert.equal(r.findings[0].message, 'tone="info" on <kakao-badge>: info is not one of neutral, primary, success, warning, danger, ink.');
  assert.deepEqual([r.findings[0].line, r.findings[0].column], [1, 14]);
});
