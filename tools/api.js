#!/usr/bin/env node
/**
 * api.js
 * ============================================================================
 * Prints the API of one or more components, short enough to read before
 * writing the markup: what it is for, the attributes with their values, slots,
 * events, methods and the example from the component's header. Node only, no
 * packages; works in this repo and in a vendored copy (kakao/tools/api.js).
 *
 *   node tools/api.js kakao-section-header
 *   node tools/api.js tabs toast            folder names work too
 *   node tools/api.js button --css          also the --kakao-button-* properties
 *   node tools/api.js --list                every tag with its one-line purpose
 *
 * Source: custom-elements.json (attributes, slots, events, members, the
 * `kakao` field) and the USAGE section of the component's header (the
 * <link>/<script> lines are left out: the loader loads the files).
 * Exit codes: 0 printed, 2 usage error (an unknown component; the known ones
 * still print).
 * ============================================================================
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/** tag -> declaration, in manifest order. */
function declarations(manifest) {
  const map = new Map();
  for (const mod of manifest.modules || []) {
    for (const d of mod.declarations || []) if (d.tagName) map.set(d.tagName, d);
  }
  return map;
}

/** Names (tag or folder) -> tags; unknown names are returned separately. */
function resolve(map, names) {
  const tags = [];
  const unknown = [];
  for (const raw of names) {
    const n = raw.trim();
    if (map.has(n)) { tags.push(n); continue; }
    const byFolder = [...map.values()].filter((d) => d.kakao && d.kakao.script.split('/')[1] === n.replace(/^kakao-/, ''));
    if (byFolder.length) tags.push(...byFolder.map((d) => d.tagName));
    else unknown.push(n);
  }
  return { tags: [...new Set(tags)], unknown };
}

/** The USAGE (or BASIC USAGE) section of a header, without file-loading lines. */
function usage(source) {
  const lines = source.split('\n');
  const start = lines.findIndex((l) => /^ \* (BASIC )?USAGE\s*$/.test(l));
  if (start < 0) return '';
  const out = [];
  for (let i = start + 2; i < lines.length; i++) {
    const l = lines[i];
    if (/^ \* -{10,}/.test(l) || /^ \*\/?\s*$/.test(l) && /^ \*\//.test(l)) break;
    const text = l.replace(/^ \* ?/, '');
    if (/^\s*<(link|script)\b/.test(text)) continue;
    out.push(text.replace(/<\\\/script>/g, '</script>'));
  }
  return out.join('\n').replace(/^\n+|\n+$/g, '').replace(/\n{3,}/g, '\n\n');
}

const wrap = (text, indent, width = 100) => {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ');
  const rows = [];
  let row = '';
  for (const w of words) {
    if (row && (indent + row.length + 1 + w.length) > width) { rows.push(row); row = w; } else row = row ? `${row} ${w}` : w;
  }
  if (row) rows.push(row);
  return rows.join(`\n${' '.repeat(indent)}`);
};

function entries(title, list, pad = 18) {
  if (!list || !list.length) return '';
  const rows = list.map((e) => {
    const name = e.name.length >= pad - 2 ? `${e.name}\n${' '.repeat(pad)}` : e.name.padEnd(pad - 2);
    return `  ${name}${wrap(e.text, pad)}`;
  });
  return `${title}\n${rows.join('\n')}\n`;
}

function describe(decl, root, { css = false } = {}) {
  const k = decl.kakao || {};
  const files = [];
  files.push(k.lightDom ? `light DOM${k.css && k.css.length ? `, ${k.css.map((f) => path.basename(f)).join(', ')}` : ''}` : 'shadow DOM');
  if (k.requires && k.requires.length) files.push(`needs ${k.requires.join(', ')}`);
  let out = `${decl.tagName}  (${files.join('; ')})\n`;
  out += `${wrap(decl.summary || '', 0)}\n`;
  if (k.notFor) out += `${wrap(`Not for: ${k.notFor}`, 0)}\n`;
  out += '\n';
  out += entries('Attributes', (decl.attributes || []).map((a) => ({ name: a.name, text: a.description })));
  out += entries('Slots', (decl.slots || []).map((s) => ({ name: s.name || '(default)', text: s.description })));
  out += entries('Events', (decl.events || []).map((e) => ({ name: e.name, text: e.description })));
  const members = (decl.members || []).map((m) => ({
    name: m.kind === 'method' ? `${m.name}(${(m.parameters || []).map((p) => p.name).join(', ')})` : m.name,
    text: m.description,
  }));
  out += entries('Methods and properties', members, 22);
  if (css) out += entries('CSS properties', (decl.cssProperties || []).map((p) => ({ name: p.name, text: p.default ? `default ${p.default}` : '' })), 36);
  if (k.script) {
    const file = path.join(root, k.script);
    const ex = fs.existsSync(file) ? usage(fs.readFileSync(file, 'utf8')) : '';
    if (ex) out += `Example\n${ex.split('\n').map((l) => (l ? `  ${l}` : '')).join('\n')}\n`;
  }
  return out;
}

function list(map) {
  return [...map.values()].map((d) => `${d.tagName.padEnd(24)}${d.summary || ''}`).join('\n') + '\n';
}

function main(argv, root = ROOT, out = process.stdout, err = process.stderr) {
  const args = argv.filter((a) => !a.startsWith('--'));
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'custom-elements.json'), 'utf8'));
  const map = declarations(manifest);
  if (flags.has('--list')) { out.write(list(map)); return 0; }
  if (!args.length) {
    err.write('usage: node tools/api.js <component…> [--css]   or   node tools/api.js --list\n');
    return 2;
  }
  const { tags, unknown } = resolve(map, args);
  // Unknown names are reported, the known ones still print.
  if (unknown.length) err.write(`unknown component ${unknown.join(', ')}: it does not exist, don't use it (node tools/api.js --list shows every tag)\n`);
  if (!tags.length) return 2;
  // Tags from one file (tabs + tab) share the example: print it once.
  const seen = new Set();
  const parts = tags.map((t) => {
    const d = map.get(t);
    const text = describe(d, root, { css: flags.has('--css') });
    const script = d.kakao && d.kakao.script;
    if (script && seen.has(script)) return text.replace(/\nExample\n[\s\S]*$/, '\n(Example: see above.)\n');
    seen.add(script);
    return text;
  });
  out.write(parts.join('\n'));
  return unknown.length ? 2 : 0;
}

module.exports = { declarations, resolve, usage, describe, main };

if (require.main === module) process.exitCode = main(process.argv.slice(2));
