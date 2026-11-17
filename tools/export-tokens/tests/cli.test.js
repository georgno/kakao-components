'use strict';
/* The command: stable output, --check, and errors on unknown syntax. Runs on
   a temporary copy of the sources so the repo's tokens.json is never touched. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../../..');
const BIN = path.join(ROOT, 'tools/export-tokens.js');

/** A temp dir holding what the exporter reads: index.html, shared/*.css, components/. */
function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-tokens-'));
  fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(dir, 'index.html'));
  fs.mkdirSync(path.join(dir, 'shared'));
  for (const f of ['tokens.css', 'themes.css']) fs.copyFileSync(path.join(ROOT, 'shared', f), path.join(dir, 'shared', f));
  fs.cpSync(path.join(ROOT, 'components'), path.join(dir, 'components'), { recursive: true });
  return dir;
}

const run = (dir, ...args) => spawnSync(process.execPath, [BIN, '--root', dir, ...args], { encoding: 'utf8' });

test('two runs write a byte-identical file; keys sorted, 2-space indent, trailing newline', () => {
  const dir = sandbox();
  assert.equal(run(dir).status, 0);
  const first = fs.readFileSync(path.join(dir, 'tokens.json'), 'utf8');
  assert.equal(run(dir).status, 0);
  assert.equal(fs.readFileSync(path.join(dir, 'tokens.json'), 'utf8'), first);
  assert.ok(first.endsWith('}\n'));
  assert.match(first, /^\{\n {2}"components": \{/);
  const data = JSON.parse(first);
  assert.equal(data.formatVersion, 1);
  assert.match(data.version, /^\d+\.\d+\.\d+$/);
  assert.deepEqual(Object.keys(data), [...Object.keys(data)].sort());
});

test('--check passes on a fresh file and names the first difference when stale', () => {
  const dir = sandbox();
  run(dir);
  const ok = run(dir, '--check');
  assert.equal(ok.status, 0, ok.stderr);
  const tokens = path.join(dir, 'shared/tokens.css');
  fs.writeFileSync(tokens, fs.readFileSync(tokens, 'utf8').replace('--kakao-radius-lg: 14px;', '--kakao-radius-lg: 16px;'));
  const stale = run(dir, '--check');
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /out of date \(first difference: components\.[a-z-]+\.settings\.[a-z0-9-]+\.resolved/);
});

test('--check fails when the file is missing', () => {
  const r = run(sandbox(), '--check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /missing file/);
});

test('unknown syntax exits 1, names file and setting, and leaves tokens.json alone', () => {
  const dir = sandbox();
  run(dir);
  const before = fs.readFileSync(path.join(dir, 'tokens.json'), 'utf8');
  const css = path.join(dir, 'components/button/button.css');
  fs.writeFileSync(
    css,
    fs.readFileSync(css, 'utf8').replace('var(--kakao-button-md-height, 44px)', 'var(--kakao-button-md-height, fit-content(44px))'),
  );
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /components\/button\/button\.css --_md-height: .*fit-content/);
  assert.equal(fs.readFileSync(path.join(dir, 'tokens.json'), 'utf8'), before);
});

test('a new component with a settings block is exported without changing the exporter', () => {
  const dir = sandbox();
  fs.mkdirSync(path.join(dir, 'components/zz-new'));
  fs.writeFileSync(
    path.join(dir, 'components/zz-new/zz-new.css'),
    'zz-new {\n  /* @kakao-settings:start prefix=--kakao-zz-new- (written by construction.html, edit there) */\n' +
      '  --_gap: var(--kakao-zz-new-gap, 1rem);\n  /* @kakao-settings:end */\n}\n',
  );
  assert.equal(run(dir).status, 0);
  const data = JSON.parse(fs.readFileSync(path.join(dir, 'tokens.json'), 'utf8'));
  assert.deepEqual(data.components['zz-new'].settings.gap.resolved, { type: 'length', px: 16 });
});
