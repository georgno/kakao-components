'use strict';
/**
 * sources.js - reads the design values out of the repo: the shared tokens
 * (shared/tokens.css, the light theme), the themes and their
 * prefers-contrast: more overrides (shared/themes.css), and every
 * component's settings block.
 *
 * Settings lines follow the format tools/construct-server.js enforces:
 *   tokens:     --kakao-<name>: <value>;
 *   components: --_<alias>: var(--kakao-<component>-<x>, <default>);
 */
const fs = require('fs');
const path = require('path');

const START_RE = /\/\* @kakao-settings:start prefix=(--kakao-[a-z0-9-]*)[^*]*\*\//g;
const END_MARK = '/* @kakao-settings:end */';
const LINE_RE = /^--_([a-z0-9-]+): var\((--kakao-[a-z0-9-]+), (.+)\);$/;
const TOKEN_LINE_RE = /^(--kakao-[a-z0-9-]+): (.+);$/;

class SourceError extends Error {}

/** The lines of the one settings block in a source text. */
function settingsBlock(text, file) {
  const starts = [...text.matchAll(START_RE)];
  if (starts.length !== 1) throw new SourceError(`${file} must contain exactly one settings block (found ${starts.length})`);
  const from = starts[0].index + starts[0][0].length;
  const end = text.indexOf(END_MARK, from);
  if (end < 0) throw new SourceError(`${file}: settings block has no end marker`);
  return { prefix: starts[0][1], lines: text.slice(from, end).split('\n').map((l) => l.trim()).filter(Boolean) };
}

/** shared/tokens.css: [{ name, value }] in file order. */
function readTokens(root) {
  const file = 'shared/tokens.css';
  const { lines } = settingsBlock(fs.readFileSync(path.join(root, file), 'utf8'), file);
  return lines.map((line) => {
    const m = line.match(TOKEN_LINE_RE);
    if (!m) throw new SourceError(`${file}: settings line is not "--kakao-name: value;": ${line}`);
    return { name: m[1], value: m[2] };
  });
}

/** `--kakao-color-<role>: <value>;` declarations in a CSS body. */
function colorDecls(body) {
  const map = new Map();
  for (const m of body.matchAll(/(--kakao-color-[a-z-]+)\s*:\s*([^;]+);/g)) map.set(m[1], m[2].trim());
  return map;
}

/** The body of the rule whose `{` is at index `open` (no nesting in themes.css rules). */
function ruleBody(css, open) {
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}

/** The body of the at-rule block whose `{` is at index `open`, braces nested. */
function blockBody(css, open) {
  let depth = 0;
  for (let k = open; k < css.length; k++) {
    if (css[k] === '{') depth++;
    if (css[k] === '}' && --depth === 0) return css.slice(open + 1, k);
  }
  throw new SourceError('shared/themes.css: unclosed block');
}

/**
 * Themes: light (from tokens.css) plus every `@theme <name>` block in
 * themes.css. The @generated blocks are copies (light, os-dark) and skipped.
 * Returns [{ name, dark, colors: Map, contrast: Map }] where contrast holds
 * the prefers-contrast: more overrides only.
 */
function readThemes(root, tokens) {
  const css = fs.readFileSync(path.join(root, 'shared/themes.css'), 'utf8');
  const light = new Map(tokens.filter((t) => t.name.startsWith('--kakao-color-')).map((t) => [t.name, t.value]));
  const themes = [{ name: 'light', dark: false, colors: light, contrast: new Map() }];

  for (const m of css.matchAll(/\/\* @theme ([a-z0-9-]+) \*\//g)) {
    const open = css.indexOf('{', m.index);
    const body = ruleBody(css, open);
    const scheme = /color-scheme:\s*(light|dark)/.exec(body);
    if (!scheme) throw new SourceError(`shared/themes.css: theme ${m[1]} sets no color-scheme`);
    themes.push({ name: m[1], dark: scheme[1] === 'dark', colors: new Map([...light, ...colorDecls(body)]), contrast: new Map() });
  }

  // `@media (prefers-contrast: more) { … }` blocks (not the ones combined
  // with another media feature: those serve pages with no theme chosen).
  const byName = new Map(themes.map((t) => [t.name, t]));
  for (const m of css.matchAll(/@media \(prefers-contrast: more\)\s*\{/g)) {
    const inner = blockBody(css, m.index + m[0].length - 1);
    for (const r of inner.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const selector = r[1];
      const names = [...selector.matchAll(/\[data-kakao-theme="([a-z0-9-]+)"\]/g)].map((x) => x[1]);
      if (/(^|[\s,]):root\s*,?/.test(selector) && !/:root:not/.test(selector)) names.push('light');
      for (const n of new Set(names)) {
        const t = byName.get(n);
        if (!t) throw new SourceError(`shared/themes.css: contrast override for unknown theme "${n}"`);
        for (const [k, v] of colorDecls(r[2])) t.contrast.set(k, v);
      }
    }
  }
  return themes;
}

/**
 * Every component settings block: [{ component, file, prefix, settings:
 * [{ alias, property, value }] }], sorted by component name. The component
 * is the folder name.
 */
function readComponents(root) {
  const dir = path.join(root, 'components');
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const folder = path.join(dir, name);
    if (!fs.statSync(folder).isDirectory()) continue;
    const files = [`${name}.css`, `${name}.js`]
      .map((f) => path.join(folder, f))
      .filter((f) => fs.existsSync(f) && fs.readFileSync(f, 'utf8').includes('@kakao-settings:start'));
    if (!files.length) continue;
    if (files.length > 1) throw new SourceError(`component "${name}" has a settings block in more than one file`);
    const rel = path.relative(root, files[0]);
    const { prefix, lines } = settingsBlock(fs.readFileSync(files[0], 'utf8'), rel);
    const settings = lines.map((line) => {
      const m = line.match(LINE_RE);
      if (!m) throw new SourceError(`${rel}: settings line is not "--_alias: var(--kakao-…, default);": ${line}`);
      return { alias: `--_${m[1]}`, property: m[2], value: m[3] };
    });
    out.push({ component: name, file: rel, prefix, settings });
  }
  return out;
}

module.exports = { readTokens, readThemes, readComponents, SourceError };
