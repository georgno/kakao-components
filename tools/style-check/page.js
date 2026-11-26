/**
 * page.js
 * ============================================================================
 * What a page loads, and what its components need, for the page-level rule
 * page-loads-dependencies. The dependency data comes from custom-elements.json
 * (each declaration's `kakao` field: script, css, requires), never from a list
 * kept here.
 *
 *   loads(doc, file)          { scripts, styles, hasHead, templated }:
 *                             scripts and stylesheets in document order,
 *                             each { src|href, line, column }
 *   needs(manifest, tag)      the files a tag needs, dependencies first:
 *                             [{ tag, script, css: [], requires: [] }]
 *   matches(url, file, pageFile)
 *                             a loaded URL is that manifest file: a relative
 *                             URL is resolved against the page, then compared
 *                             by its last two segments (toast/toast.js), so
 *                             relative, root-relative, vendored and templated
 *                             URLs all match
 *   namer(manifest, pageFile, page, prefer)
 *                             file -> the URL this page would write for a
 *                             manifest file, derived from the URL of a loaded
 *                             kakao script (the `prefer` files first, else
 *                             the first one; else the manifest path)
 *
 * A page without a <head> (a partial, a fragment, a view rendered into a
 * layout) cannot show what is loaded; the rule skips it. A template file
 * (.php, .phtml, .twig) or a head with template code may load files in code
 * (e.g. Yii's register()); the rule reports there as warnings.
 * ============================================================================
 */
'use strict';

const path = require('path');

const TEMPLATE_EXT = ['.php', '.phtml', '.twig'];
const TEMPLATE_CODE = /<\?|\{\{|\{%/;

const strip = (url) => url.trim().replace(/[?#][^/]*$/, '');

function tail(p) {
  return p.split('/').filter(Boolean).slice(-2).join('/');
}

const isRelative = (u) => !/^([a-z]+:)?\/\//i.test(u) && !u.startsWith('/') && !TEMPLATE_CODE.test(u);

function matches(url, file, pageFile) {
  let u = strip(url);
  if (pageFile && isRelative(u)) u = path.posix.join(path.posix.dirname(pageFile), u);
  const t = tail(file);
  return u === t || u.endsWith('/' + t) || u === file;
}

const cache = new WeakMap();

function loads(doc, file, source) {
  if (cache.has(doc)) return cache.get(doc);
  const scripts = [];
  const styles = [];
  let hasHead = false;
  for (const el of doc.elements) {
    if (el.tag === 'head') hasHead = true;
    const src = el.attrs.get('src');
    if (el.tag === 'script' && src && src.value.trim()) {
      scripts.push({ src: src.value, line: el.line, column: el.column });
    }
    const rel = el.attrs.get('rel');
    const href = el.attrs.get('href');
    if (el.tag === 'link' && href && rel && /(^|\s)stylesheet(\s|$)/i.test(rel.value)) {
      styles.push({ href: href.value, line: el.line, column: el.column });
    }
  }
  const head = /<head[\s>][\s\S]*?<\/head\s*>/i.exec(source || '');
  const templated = TEMPLATE_EXT.includes(path.extname(file).toLowerCase()) || !!(head && TEMPLATE_CODE.test(head[0]));
  const out = { scripts, styles, hasHead, templated, state: {} };
  cache.set(doc, out);
  return out;
}

const byManifest = new WeakMap();

function declarations(manifest) {
  if (byManifest.has(manifest)) return byManifest.get(manifest);
  const byTag = new Map();
  for (const mod of manifest.modules || []) {
    for (const d of mod.declarations || []) {
      if (d.tagName && d.kakao) byTag.set(d.tagName, d.kakao);
    }
  }
  byManifest.set(manifest, byTag);
  return byTag;
}

function needs(manifest, tag) {
  const byTag = declarations(manifest);
  if (!byTag.has(tag)) return null;
  const out = [];
  const seen = new Set();
  const visit = (t) => {
    if (seen.has(t)) return;
    seen.add(t);
    const k = byTag.get(t);
    if (!k) return;
    for (const r of k.requires || []) visit(r);
    out.push({ tag: t, script: k.script, css: k.css || [], requires: k.requires || [] });
  };
  visit(tag);
  return out;
}

/* The URL this page would use for `other`, given that it loads `file` from
   `url`. Null when the two cannot be related. */
function suggest(pageFile, url, file, other) {
  const u = strip(url);
  if (u.endsWith(file)) return u.slice(0, u.length - file.length) + other;
  if (!isRelative(u)) return null;
  const dir = path.posix.dirname(pageFile);
  const resolved = path.posix.join(dir, u);
  if (!resolved.endsWith(file)) return null;
  const root = resolved.slice(0, resolved.length - file.length);
  return path.posix.relative(dir, path.posix.join(root || '.', other)) || other;
}

function namer(manifest, pageFile, page, prefer = []) {
  const all = [...new Set([...declarations(manifest).values()].map((k) => k.script))];
  const loaded = page.scripts;
  const order = [...prefer.flatMap((f) => loaded.filter((s) => matches(s.src, f, pageFile))), ...loaded];
  const files = [...prefer, ...all];
  for (const s of order) {
    const file = files.find((f) => matches(s.src, f, pageFile));
    if (!file) continue;
    return (other) => suggest(pageFile, s.src, file, other) || other;
  }
  return (other) => other;
}

module.exports = { loads, needs, matches, namer };
