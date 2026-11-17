#!/usr/bin/env node
/**
 * export-tokens.js
 * ============================================================================
 * Writes tokens.json: every design value of kakao-components (shared tokens,
 * themes, more-contrast colours and every component's settings block) in a
 * form other platforms read without a CSS engine. The Flutter mirror
 * (kakao-components-flutter) generates its themes and widget settings from
 * it. Node only, no packages.
 *
 *   node tools/export-tokens.js           write tokens.json
 *   node tools/export-tokens.js --check   exit 1 when tokens.json is out of date
 *
 * Unknown CSS syntax in a settings block is an error (exit 1, file and
 * setting named, tokens.json left as it was): the exporter never guesses.
 *
 * ----------------------------------------------------------------------------
 * OUTPUT
 * ----------------------------------------------------------------------------
 *  {
 *    formatVersion: 1,            bumped on a breaking change to this shape
 *    version: "0.9.0",            the release (hero fact on index.html)
 *    units: { remPx: 16 },        1rem in px (= 1 logical pixel per px)
 *    themeOrder: ["light", …],    the themes in file order
 *    themes: { <name>: { dark, colors: { <role>: "#rrggbbaa" },
 *                        contrastColors: { <role>: … } } },
 *    tokens: { <name>: Setting },            e.g. "space-x", "ease-spring"
 *    components: { <component>: { file, prefix, settings: { <name>: Setting } } }
 *  }
 *  Colour roles live in `themes` only; `contrastColors` is the full set with
 *  the prefers-contrast: more overrides applied.
 *
 *  Setting = {
 *    property: "--kakao-button-md-height",   the public custom property
 *    alias: "--_md-height",                  the component's internal name
 *    value: Node,                            the default as written, references kept
 *    themed: false,
 *    resolved: Node                          what it comes to; when themed is
 *  }                                         true, { "<theme>": Node,
 *                                            "<theme>/contrast": Node, … }
 *
 *  Read `resolved` for plain constants. Walk `value` to keep the chain the
 *  web component follows (so a token change in the app re-themes widgets):
 *  a ref node says where it points with one of
 *    token:   "color-primary"    a shared token (colour roles: per theme)
 *    setting: "md-height"        a sibling setting of the same component
 *    hook:    "--kakao-slider-…" another settings property, unset by default
 *  or none of them for a property set at runtime by a component (resolved
 *  keeps such a ref, with its fallback resolved).
 *
 *  Nodes (type → fields):
 *    length {px}  em {factor}  cap {factor}  viewport {unit, value}
 *    percent {value}  angle {deg}  duration {ms}  number {value}
 *    color {hex: "#rrggbbaa"}  currentColor  inherit  none
 *    keyword {value}  string {value}  easing {bezier: [x1, y1, x2, y2]}
 *    ref {name, fallback?, token? | setting? | hook?}
 *    mix {space: "srgb", a: {color, percent}, b: {color, percent}}
 *    calc {expr}  op {op, left, right}  clamp|min|max {args}
 *    list {separator: "space"|"comma", items}  slash {before, after}
 *    shadow {layers: [{x, y, blur, spread, color, inset}]}
 *    font {style?, weight?, size, lineHeight, family}
 * ============================================================================
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { parse, ParseError } = require('./export-tokens/parse');
const { shape } = require('./export-tokens/shapes');
const { resolve, ResolveError } = require('./export-tokens/resolve');
const { readTokens, readThemes, readComponents, SourceError } = require('./export-tokens/sources');

const ROOT = path.join(__dirname, '..');
const OUT = 'tokens.json';

/** The release version from the hero facts on index.html. */
function readVersion(root) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const m = /<li><b>v(\d+\.\d+\.\d+)<\/b>/.exec(html);
  if (!m) throw new SourceError('index.html: no version in the hero facts');
  return m[1];
}

/** Marks where each ref in a value tree points (token / setting / hook). */
function annotate(node, ctx) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map((n) => annotate(n, ctx));
  const out = {};
  for (const [k, v] of Object.entries(node)) out[k] = annotate(v, ctx);
  if (node.type === 'ref') {
    if (node.name.startsWith('--_')) out.setting = ctx.aliasToKey.get(node.name);
    else if (ctx.tokenNames.has(node.name)) out.token = node.name.slice('--kakao-'.length);
    else if (ctx.hooks.has(node.name)) out.hook = node.name;
  }
  return out;
}

/** Parses one value, naming the file and setting on failure. */
function parseSetting(where, alias, src) {
  try {
    return shape(alias, parse(src));
  } catch (e) {
    if (e instanceof ParseError) throw new ParseError(`${where}: ${e.message}`);
    throw e;
  }
}

function build(root = ROOT) {
  const tokens = readTokens(root);
  const themes = readThemes(root, tokens);
  const comps = readComponents(root);

  const tokenNames = new Set(tokens.map((t) => t.name));
  const hooks = new Set(comps.flatMap((c) => c.settings.map((s) => s.property)));
  const parsedTokens = new Map(tokens.map((t) => [t.name, parseSetting(`shared/tokens.css ${t.name}`, t.name.slice(2), t.value)]));

  // One environment per theme and contrast mode.
  const modes = [];
  for (const t of themes) {
    for (const contrast of [false, true]) {
      const env = new Map(parsedTokens);
      const colors = contrast ? new Map([...t.colors, ...t.contrast]) : t.colors;
      for (const [k, v] of colors) env.set(k, parse(v));
      modes.push({ key: contrast ? `${t.name}/contrast` : t.name, tokens: env });
    }
  }

  const resolveAll = (where, node, locals) => {
    const out = {};
    for (const m of modes) {
      try {
        out[m.key] = resolve(node, { tokens: m.tokens, locals, hooks });
      } catch (e) {
        if (e instanceof ResolveError) throw new ResolveError(`${where}: ${e.message}`);
        throw e;
      }
    }
    const first = JSON.stringify(out[modes[0].key]);
    const same = modes.every((m) => JSON.stringify(out[m.key]) === first);
    return same ? { themed: false, resolved: out[modes[0].key] } : { themed: true, resolved: out };
  };

  const hexOf = (where, src) => {
    const n = parse(src);
    if (n.type !== 'color') throw new SourceError(`${where}: a colour role must be a plain colour, got "${src}"`);
    return n.hex;
  };
  const roleMap = (where, map) =>
    Object.fromEntries([...map].map(([k, v]) => [k.slice('--kakao-color-'.length), hexOf(`${where} ${k}`, v)]));

  const out = {
    formatVersion: 1,
    version: readVersion(root),
    units: { remPx: 16 },
    themeOrder: themes.map((t) => t.name),
    themes: Object.fromEntries(
      themes.map((t) => [
        t.name,
        {
          dark: t.dark,
          colors: roleMap(`theme ${t.name}`, t.colors),
          contrastColors: roleMap(`theme ${t.name} (contrast)`, new Map([...t.colors, ...t.contrast])),
        },
      ]),
    ),
    tokens: {},
    components: {},
  };

  const tokenCtx = { tokenNames, hooks, aliasToKey: new Map() };
  for (const t of tokens) {
    if (t.name.startsWith('--kakao-color-')) continue; // in themes
    const node = parsedTokens.get(t.name);
    out.tokens[t.name.slice('--kakao-'.length)] = {
      property: t.name,
      value: annotate(node, tokenCtx),
      ...resolveAll(`shared/tokens.css ${t.name}`, node, new Map()),
    };
  }

  for (const c of comps) {
    const key = (s) => s.property.slice(c.prefix.length);
    const locals = new Map();
    for (const s of c.settings) locals.set(s.alias, parseSetting(`${c.file} ${s.alias}`, s.alias.slice(3), s.value));
    const ctx = { tokenNames, hooks, aliasToKey: new Map(c.settings.map((s) => [s.alias, key(s)])) };
    const settings = {};
    for (const s of c.settings) {
      const node = locals.get(s.alias);
      settings[key(s)] = {
        property: s.property,
        alias: s.alias,
        value: annotate(node, ctx),
        ...resolveAll(`${c.file} ${s.alias}`, node, locals),
      };
    }
    out.components[c.component] = { file: c.file, prefix: c.prefix, settings };
  }
  return out;
}

/** JSON with every object's keys sorted, 2-space indent, trailing newline. */
function stableStringify(value) {
  const sort = (v) => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])]));
    return v;
  };
  return `${JSON.stringify(sort(value), null, 2)}\n`;
}

/** Path of the first difference between two JSON values, for --check. */
function firstDifference(a, b, at = '') {
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) === !Array.isArray(b)) {
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
    for (const k of keys) {
      const d = firstDifference(a[k], b[k], at ? `${at}.${k}` : k);
      if (d) return d;
    }
  }
  return at || '(root)';
}

function main(argv, root = ROOT) {
  const check = argv.includes('--check');
  const file = path.join(root, OUT);
  let text;
  try {
    text = stableStringify(build(root));
  } catch (e) {
    if (e instanceof ParseError || e instanceof ResolveError || e instanceof SourceError) {
      process.stderr.write(`export-tokens: ${e.message}\n`);
      return 1;
    }
    throw e;
  }
  if (check) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (current === text) {
      process.stdout.write(`${OUT} is up to date.\n`);
      return 0;
    }
    const where = current == null ? '(missing file)' : firstDifference(JSON.parse(current), JSON.parse(text));
    process.stderr.write(`export-tokens: ${OUT} is out of date (first difference: ${where}). Run node tools/export-tokens.js.\n`);
    return 1;
  }
  fs.writeFileSync(file, text);
  process.stdout.write(`Wrote ${OUT}.\n`);
  return 0;
}

if (require.main === module) {
  const rootArg = process.argv.indexOf('--root');
  const root = rootArg > 0 ? path.resolve(process.argv[rootArg + 1]) : ROOT;
  process.exitCode = main(process.argv.slice(2), root);
}

module.exports = { build, stableStringify, main };
