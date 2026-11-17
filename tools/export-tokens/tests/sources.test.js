'use strict';
/* Reading tokens, themes, contrast overrides and component settings from the repo. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { readTokens, readThemes, readComponents } = require('../sources');

const ROOT = path.join(__dirname, '../../..');

test('themes are light plus every @theme block, generated copies skipped', () => {
  const themes = readThemes(ROOT, readTokens(ROOT));
  const css = fs.readFileSync(path.join(ROOT, 'shared/themes.css'), 'utf8');
  const declared = [...css.matchAll(/\/\* @theme ([a-z0-9-]+) \*\//g)].map((m) => m[1]);
  assert.deepEqual(
    themes.map((t) => t.name),
    ['light', ...declared],
  );
  assert.ok(!themes.some((t) => t.name === 'os-dark'));
});

test('theme colours layer over light; contrast overrides are kept apart', () => {
  const themes = new Map(readThemes(ROOT, readTokens(ROOT)).map((t) => [t.name, t]));
  const dark = themes.get('dark');
  assert.equal(dark.dark, true);
  assert.equal(dark.colors.get('--kakao-color-border'), '#71717a');
  assert.equal(dark.contrast.get('--kakao-color-border'), '#a1a1aa');
  assert.equal(themes.get('light').contrast.get('--kakao-color-muted'), '#3f3f46');
  assert.ok(themes.get('catppuccin').contrast.size > 0);
  // Every theme has every colour role of light.
  for (const t of themes.values()) assert.equal(t.colors.size, themes.get('light').colors.size, t.name);
});

test('every component settings block is read', () => {
  const comps = readComponents(ROOT);
  const dir = path.join(ROOT, 'components');
  const withBlock = fs
    .readdirSync(dir)
    .filter((n) =>
      [`${n}.js`, `${n}.css`].some((f) => {
        const p = path.join(dir, n, f);
        return fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes('@kakao-settings:start');
      }),
    );
  assert.equal(comps.length, withBlock.length);
  assert.ok(comps.length >= 61);
  const button = comps.find((c) => c.component === 'button');
  assert.equal(button.file, 'components/button/button.css');
  const md = button.settings.find((s) => s.alias === '--_md-height');
  assert.deepEqual(md, { alias: '--_md-height', property: '--kakao-button-md-height', value: '44px' });
});
