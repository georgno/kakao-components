#!/usr/bin/env node
/**
 * catalog.js
 * ============================================================================
 * Keeps the component list in CATALOG.md in step with custom-elements.json.
 * Node only, no packages.
 *
 *   node tools/catalog.js           rewrite the generated part of CATALOG.md
 *   node tools/catalog.js --check   exit 1 when it is out of date
 *
 * CATALOG.md is the short guide for projects that use the library. Most of it
 * is written by hand (page head, shared contract, "which one?"); the part
 * between the markers
 *
 *   <!-- catalog:start … -->
 *   <!-- catalog:end -->
 *
 * is generated: one line per component, from its manifest declaration:
 *  - summary         the header's CATALOG "for" line (what it is for)
 *  - kakao.notFor    the header's CATALOG "not for" line (what to use instead)
 *  - kakao.lightDom, kakao.css, kakao.requires   light or shadow DOM, the CSS
 *                    file a page must load, the components to load first
 * So the "what for / when not" text is edited in the component header
 * (components/<name>/<name>.js, section CATALOG), then
 * `node tools/manifest.js && node tools/catalog.js`.
 *
 * Both modes also check the whole file: every kakao-<name> it mentions must be
 * a tag (or an event) in the manifest, so a renamed or removed component can't linger in
 * the hand-written parts either.
 * ============================================================================
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = 'CATALOG.md';
const MANIFEST = 'custom-elements.json';
const START = /<!-- catalog:start[^>]*-->\n/;
const END = '<!-- catalog:end -->';

class CatalogError extends Error {}

// HTML tags in backticks; component names stay plain (fewer tokens, still unique).
const code = (text) => text.replace(/(?<![\w`])(<[a-z][^<>]*>)/g, '`$1`');
const lowerFirst = (text) => (/^[A-Z][a-z ]/.test(text) ? text[0].toLowerCase() + text.slice(1) : text);
const base = (file) => file.split('/').pop();

/** One line per component (per module), in folder order. */
function componentLines(manifest) {
  return manifest.modules.map((mod) => {
    const name = mod.path.split('/')[1];
    const main = mod.declarations.find((d) => d.tagName === `kakao-${name}`) || mod.declarations[0];
    if (!main.summary || !main.kakao.notFor) throw new CatalogError(`${mod.path}: no summary / notFor (CATALOG section)`);
    const others = mod.declarations.filter((d) => d !== main).map((d) => ` + \`${d.tagName}\``).join('');
    const k = main.kakao;
    const how = [];
    if (k.lightDom) how.push(['light DOM', ...k.css.map(base)].join(', '));
    if (k.requires.length) how.push(`after ${k.requires.join(', ')}`);
    const tail = how.length ? ` (${how.join('; ')})` : '';
    return `- \`${main.tagName}\`${others}: ${code(main.summary)} Not for ${code(lowerFirst(main.kakao.notFor))}${tail}`;
  });
}

function generated(manifest) {
  const n = manifest.modules.length;
  const v = manifest.kakao && manifest.kakao.version ? ` in v${manifest.kakao.version}` : '';
  return `${n} components${v}. In brackets: light DOM and the CSS file to load, "after" the components to load first. Unmarked: shadow DOM, its script only.\n\n${componentLines(manifest).join('\n')}\n`;
}

/** Every kakao-<name> in the text is a tag of the manifest. */
function unknownTags(text, manifest) {
  // Also accepted: the library's own name and event names (kakao-button-action).
  const decls = manifest.modules.flatMap((m) => m.declarations);
  const known = new Set(['kakao-components', ...decls.map((d) => d.tagName), ...decls.flatMap((d) => (d.events || []).map((e) => e.name))]);
  const out = new Set();
  for (const m of text.matchAll(/(?<![\w-])kakao-[a-z][a-z0-9-]*/g)) {
    const tag = m[0].replace(/-+$/, '');
    if (!known.has(tag)) out.add(tag);
  }
  return [...out];
}

function render(current, manifest) {
  const start = START.exec(current);
  const end = current.indexOf(END);
  if (!start || end < start.index) throw new CatalogError(`${OUT} has no <!-- catalog:start --> … <!-- catalog:end --> markers`);
  const head = current.slice(0, start.index + start[0].length);
  const text = `${head}\n${generated(manifest)}\n${current.slice(end)}`;
  const unknown = unknownTags(text, manifest);
  if (unknown.length) throw new CatalogError(`${OUT} names tags that are not in ${MANIFEST}: ${unknown.join(', ')}`);
  return text;
}

function main(argv, root = ROOT) {
  const file = path.join(root, OUT);
  let current;
  let text;
  try {
    if (!fs.existsSync(file)) throw new CatalogError(`${OUT} is missing`);
    current = fs.readFileSync(file, 'utf8');
    text = render(current, JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8')));
  } catch (e) {
    if (e instanceof CatalogError) {
      process.stderr.write(`catalog: ${e.message}\n`);
      return 1;
    }
    throw e;
  }
  if (argv.includes('--check')) {
    if (current === text) {
      process.stdout.write(`${OUT} is up to date.\n`);
      return 0;
    }
    process.stderr.write(`catalog: ${OUT} is out of date. Run node tools/catalog.js.\n`);
    return 1;
  }
  fs.writeFileSync(file, text);
  process.stdout.write(`Wrote ${OUT}.\n`);
  return 0;
}

if (require.main === module) {
  const r = process.argv.indexOf('--root');
  process.exitCode = main(process.argv.slice(2), r > 0 ? path.resolve(process.argv[r + 1]) : ROOT);
}

module.exports = { render, componentLines, unknownTags, main, CatalogError };
