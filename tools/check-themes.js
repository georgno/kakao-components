#!/usr/bin/env node
/**
 * check-themes.js
 * ============================================================================
 * Checks that every colour theme meets WCAG 2.2 AA contrast, and keeps the
 * generated blocks in shared/themes.css in sync. Node only, no packages.
 *
 *   node tools/check-themes.js         check; exits 1 on a failure or when a
 *                                      generated block is out of date
 *   node tools/check-themes.js --fix   rewrite the generated blocks, then check
 *
 * Themes: "light" is the colour variables in shared/tokens.css; every block
 * in shared/themes.css marked with an @theme comment overrides them.
 * Generated blocks: the light copy (for light parts inside a dark page) and the
 * operating-system dark copy (used when no theme is chosen).
 * ============================================================================
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TOKENS = path.join(ROOT, 'shared/tokens.css');
const THEMES = path.join(ROOT, 'shared/themes.css');

/* Pairs every theme must pass: [foreground, background, minimum, what]. */
const PAIRS = [
  ['text', 'bg', 4.5, 'body text'],
  ['text', 'page', 4.5, 'text on the page'],
  ['text', 'subtle', 4.5, 'text on a subtle fill (secondary button)'],
  ['text', 'subtle-strong', 4.5, 'text on a pressed / selected row'],
  ['text', 'raised', 4.5, 'selected tab'],
  ['text-soft', 'bg', 4.5, 'secondary text'],
  ['muted', 'bg', 4.5, 'placeholders, captions'],
  ['muted', 'page', 4.5, 'captions on the page'],
  ['muted', 'subtle', 4.5, 'group labels on a subtle fill'],
  ['on-ink', 'ink', 4.5, 'primary button label'],
  ['on-ink', 'ink-hover', 4.5, 'primary button label, hover'],
  ['on-danger', 'danger', 4.5, 'danger button label'],
  ['on-danger', 'danger-hover', 4.5, 'danger button label, hover'],
  ['danger', 'bg', 4.5, 'error text'],
  ['success', 'bg', 4.5, 'success text, success badge'],
  ['warning', 'bg', 4.5, 'warning icon and title, warning alert'],
  ['primary', 'bg', 4.5, 'selected option text'],
  ['field-border', 'bg', 1.1, 'field edge (decorative, see border)'],
  ['border', 'bg', 3, 'field border, off switch track'],
  ['border', 'page', 3, 'field border on the page'],
  ['primary', 'page', 3, 'on switch track, slider fill'],
  ['ink', 'page', 3, 'primary button edge'],
  ['focus', 'bg', 3, 'focus indicator'],
  ['focus', 'page', 3, 'focus indicator on the page'],
];

/* ---- parsing -------------------------------------------------------------- */

function declarations(body) {
  const map = new Map();
  body.replace(/(--kakao-color-[a-z-]+)\s*:\s*([^;]+);/g, (_, k, v) => map.set(k, v.trim()));
  return map;
}

function lightTheme() {
  const css = fs.readFileSync(TOKENS, 'utf8');
  const block = css.match(/@kakao-settings:start[^*]*\*\/([\s\S]*?)\/\* @kakao-settings:end/);
  if (!block) throw new Error('tokens.css: no settings block');
  return declarations(block[1]);
}

function namedThemes(css) {
  const themes = new Map();
  const re = /\/\* @theme ([a-z0-9-]+) \*\/\s*([^{]+)\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const scheme = (m[3].match(/color-scheme\s*:\s*([a-z]+)/) || [])[1] || 'light';
    themes.set(m[1], { selector: m[2].trim(), vars: declarations(m[3]), scheme });
  }
  return themes;
}

/* ---- generated blocks ----------------------------------------------------- */

function body(vars, scheme, indent) {
  const lines = [`color-scheme: ${scheme};`, ...[...vars].map(([k, v]) => `${k}: ${v};`)];
  return lines.map((l) => indent + l).join('\n');
}

function generated(light, themes) {
  const dark = themes.get('dark');
  return {
    light: `[data-kakao-theme="light"] {\n${body(light, 'light', '  ')}\n}`,
    'os-dark': dark
      ? `@media (prefers-color-scheme: dark) {\n  :root:not([data-kakao-theme]):not([data-bs-theme]) {\n${body(dark.vars, 'dark', '    ')}\n  }\n}`
      : '',
  };
}

function syncGenerated(css, blocks) {
  let stale = [];
  const out = css.replace(/(\/\* @generated:start ([a-z-]+)[^*]*\*\/\n)([\s\S]*?)(\n\/\* @generated:end \*\/)/g, (all, start, name, inner, end) => {
    if (!(name in blocks)) return all;
    if (inner !== blocks[name]) stale.push(name);
    return start + blocks[name] + end;
  });
  return { css: out, stale };
}

/* ---- contrast ------------------------------------------------------------- */

function parseColor(value) {
  const v = value.trim().toLowerCase();
  let m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) {
    const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }
  m = v.match(/^rgb\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)\s*\)$/);
  if (m) return m.slice(1, 4).map(Number);
  return null; // expressions are not checked
}

function luminance([r, g, b]) {
  const lin = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function checkTheme(name, vars) {
  const problems = [];
  const rows = [];
  PAIRS.forEach(([fg, bg, min, what]) => {
    const fv = vars.get(`--kakao-color-${fg}`);
    const bv = vars.get(`--kakao-color-${bg}`);
    if (fv == null || bv == null) {
      problems.push(`${name}: --kakao-color-${fv == null ? fg : bg} is missing`);
      return;
    }
    const a = parseColor(fv);
    const b = parseColor(bv);
    if (!a || !b) {
      problems.push(`${name}: ${fg} / ${bg} is not a plain colour, can't check it`);
      return;
    }
    const r = ratio(a, b);
    const ok = r >= min;
    rows.push(`  ${ok ? 'ok  ' : 'FAIL'} ${r.toFixed(2).padStart(5)} ≥ ${min}  ${fg} on ${bg} (${what})`);
    if (!ok) problems.push(`${name}: ${fg} on ${bg} is ${r.toFixed(2)}:1, needs ${min}:1 (${what})`);
  });
  return { rows, problems };
}

/* ---- main ----------------------------------------------------------------- */

function main() {
  const fix = process.argv.includes('--fix');
  const light = lightTheme();
  let css = fs.readFileSync(THEMES, 'utf8');
  const themes = namedThemes(css);

  const { css: synced, stale } = syncGenerated(css, generated(light, themes));
  if (fix && synced !== css) {
    fs.writeFileSync(THEMES, synced);
    console.log(`Rewrote generated blocks: ${stale.join(', ')}`);
    css = synced;
  }

  const all = [['light', light], ...[...themes].map(([n, t]) => [n, new Map([...light, ...t.vars])])];
  const problems = [];
  all.forEach(([name, vars]) => {
    const res = checkTheme(name, vars);
    console.log(`\n${name}`);
    console.log(res.rows.join('\n'));
    problems.push(...res.problems);
  });
  if (!fix && stale.length) {
    problems.push(`themes.css: generated block(s) out of date: ${stale.join(', ')} (run with --fix)`);
  }

  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`\nAll ${all.length} themes pass.`);
}

main();
