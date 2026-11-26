'use strict';
/* The command: exit codes, config, determinism, report formats, rule
   folders and forced placements. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { spawnSync } = require('child_process');
const { check, formatText } = require('../../style-check');

const BIN = path.join(__dirname, '../../style-check.js');
const FIX = path.join(__dirname, 'fixtures');
const cli = (args, cwd = FIX) => spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' });

test('a clean run exits 0 with a summary', () => {
  const r = cli(['rules/list-data-json.pass.html']);
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '0 errors, 0 warnings, 0 forced in 1 file.\n');
});

test('a violation exits 1 and names file, line, column, rule', () => {
  const r = cli(['rules/card-main-button-first.fail.html']);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^rules\/card-main-button-first\.fail\.html:2:3 {2}error {4}card-main-button-first {2}The main button <kakao-button "Open"> should be first/m);
  assert.match(r.stdout, /1 error, 0 warnings, 0 forced in 1 file\.\n$/);
});

test('setup errors exit 2 without checking files', () => {
  for (const [args, re] of [
    [['--config', 'config/unknown-rule.json', 'rules'], /unknown rule "no-such-rule"/],
    [['--config', 'config/bad-level.json', 'rules'], /level must be error, warning or off/],
    [['--config', 'config/broken.json', 'rules'], /not valid JSON/],
    [['--config', 'config/dup.json', 'rules'], /Two rules have the id "list-data-name"/],
    [['--config', 'config/missing.json'], /does not exist/],
    [['--config', 'config/no-manifest.json', 'rules'], /Manifest config\/nothing\.json does not exist/],
    [['no/such/path'], /Path no\/such\/path does not exist/],
    [['--format', 'xml'], /--format must be text or json/],
  ]) {
    const r = cli(args);
    assert.equal(r.status, 2, args.join(' '));
    assert.equal(r.stdout, '');
    assert.match(r.stderr, re);
  }
});

test('two runs give identical output', () => {
  const a = cli(['.']);
  const b = cli(['.']);
  assert.equal(a.stdout, b.stdout);
  assert.ok(a.stdout.length > 0);
});

test('findings are sorted by path, line, column, rule', () => {
  const r = check({ argv: ['rules', 'markup'], cwd: FIX });
  const keys = r.findings.map((f) => [f.path, f.line, f.column, f.rule]);
  const sorted = [...keys].sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : x[1] - y[1] || x[2] - y[2] || (x[3] < y[3] ? -1 : x[3] > y[3] ? 1 : 0)));
  assert.deepEqual(keys, sorted);
});

test('json format', () => {
  const r = cli(['--format', 'json', 'rules/list-data-name.fail.html']);
  assert.equal(r.status, 1);
  const out = JSON.parse(r.stdout);
  assert.equal(out.errors, 1);
  assert.equal(out.files, 1);
  assert.equal(out.findings[0].rule, 'list-data-name');
});

test('a project rule folder runs next to the built-ins; a rule turned to warning', () => {
  const r = check({ argv: ['--config', 'config/brand.json', 'config/page.html'], cwd: FIX });
  assert.deepEqual(r.findings.map((f) => [f.rule, f.level]), [
    ['card-main-button-first', 'warning'],
    ['brand-button-variant', 'error'],
  ]);
  const c = cli(['--config', 'config/brand.json', 'config/page.html']);
  assert.equal(c.status, 1);
});

test('the Yii2 view scenario: a dynamic label and a line', () => {
  const r = check({ argv: ['markup/yii2-view.php'], cwd: FIX });
  assert.deepEqual(r.findings, []);
});

test('forced, optional documentation: listed, not errors; stale force warns', () => {
  const r = check({ argv: ['page.html'], cwd: path.join(FIX, 'forced/optional') });
  assert.equal(r.errors, 0);
  assert.deepEqual(r.findings.map((f) => [f.level, f.rule, f.line]), [
    ['forced', 'dialog-main-button-corner', 2],
    ['warning', 'force-unused', 7],
  ]);
  const text = formatText(r);
  assert.match(text, /\nForced \(1\)\npage\.html:2:3 {2}forced {3}dialog-main-button-corner/);
});

test('forced with a documentation file: reasons shown, stale entries ignored', () => {
  const r = check({ argv: ['page.html'], cwd: path.join(FIX, 'forced/documented') });
  assert.equal(r.errors, 0);
  const forced = r.findings.find((f) => f.level === 'forced');
  assert.equal(forced.reason, 'Old confirm flow, kept until the billing page moves to the new dialog.');
  assert.match(formatText(r), / {4}reason: Old confirm flow/);
});

test('forced.mandatory: no id, no section and a stale section are errors', () => {
  const r = check({ cwd: path.join(FIX, 'forced/mandatory') });
  const errors = r.findings.filter((f) => f.level === 'error').map((f) => [f.path, f.line, f.rule]);
  assert.deepEqual(errors, [
    ['kakao-style.forced.md', 4, 'forced-stale'],
    ['page.html', 1, 'forced-undocumented'],
    ['page.html', 7, 'forced-undocumented'],
  ]);
  assert.match(r.findings.find((f) => f.line === 1 && f.path === 'page.html').message, /"legacy-confirm"/);
  assert.equal(r.forced, 3);
  const c = cli([], path.join(FIX, 'forced/mandatory'));
  assert.equal(c.status, 1);
});

test('the config can name the manifest the dependency rule reads', () => {
  const r = check({ argv: ['--config', 'config/manifest.json', 'config/manifest-page.html'], cwd: FIX });
  assert.deepEqual(r.findings.map((f) => [f.rule, f.message]), [
    ['page-loads-dependencies', '<kakao-thing> needs lib/base/base.js (for kakao-base), but the page does not load it. Add <script src="lib/base/base.js" defer>, before lib/thing/thing.js.'],
  ]);
});
