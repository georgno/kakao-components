#!/usr/bin/env node
/**
 * minify-site.mjs
 * ============================================================================
 * Minifies the assembled GitHub Pages site in place: no comments, no extra
 * whitespace in HTML, JS and CSS. The repo itself is never touched; the deploy
 * workflow copies the site to _site and runs this on that copy.
 *
 *   npm install --no-save html-minifier-terser@7.2.0 terser@5.51.2 clean-css@5.3.3
 *   node tools/minify-site.mjs _site
 *
 * What it keeps, because pages read it at runtime:
 *   - @kakao-settings blocks, line for line. Construction pages parse them out
 *     of the source files, one setting per line.
 *     - CSS files with a settings block (and themes.css with its @theme /
 *       @generated markers) are copied unchanged.
 *     - JS files with a settings block (inside a template literal) are
 *       minified without the compress pass, which would turn the literal into
 *       a one-line string. Terser still writes its line breaks as \n escapes,
 *       so the block's escapes are turned back into real line breaks (the same
 *       string to the browser). If the block then doesn't read exactly like
 *       the source, that file is published unminified.
 *   - <script type="application/json"> (construction manifests) and <pre>.
 *   - Demo pages (components/<name>/demo.html), copied unchanged: their code
 *     blocks (shared/demo.js) show each example's markup as written, so its
 *     line breaks, indentation and the scripts in <template data-code> stay.
 *   - One space where HTML had whitespace between elements, so inline layouts
 *     (buttons in a row, words around inline code) stay as they are.
 *   - Already minified vendor files (shared/vendor) are left alone.
 *
 * Fails (exit 1) when a file cannot be minified, so a broken page is never
 * published half-done.
 * ============================================================================
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, extname, relative, sep } from 'node:path';
import { minify as minifyHtml } from 'html-minifier-terser';
import { minify as minifyJs } from 'terser';
import CleanCSS from 'clean-css';

const root = process.argv[2];
if (!root) {
  console.error('usage: node tools/minify-site.mjs <site-dir>');
  process.exit(2);
}

const SKIP_DIRS = new Set(['vendor', 'fonts']);
const KEEP_CSS = /@kakao-settings|@theme |@generated/;
const DEMO_PAGE = /^components\/[^/]+\/demo\.html$/;

const JS_OPTIONS = {
  compress: { passes: 2 },
  mangle: true,
  format: { comments: false },
};

const css = new CleanCSS({ level: 1, returnPromise: false });

const HTML_OPTIONS = {
  collapseWhitespace: true,
  conservativeCollapse: true, // keep one space: inline layouts rely on it
  removeComments: true,
  minifyCSS: { level: 1 },
  minifyJS: JS_OPTIONS,
  processScripts: [], // leave application/json (construction manifests) as is
  keepClosingSlash: true,
  decodeEntities: false,
  caseSensitive: true, // custom element attributes
};

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* files(path);
    } else {
      yield path;
    }
  }
}

const START = '/* @kakao-settings:start';
const END = '/* @kakao-settings:end */';

/** The settings block of a text, start marker to end marker, or null. */
function block(text) {
  const a = text.indexOf(START);
  const b = text.indexOf(END, a);
  return a < 0 || b < 0 ? null : { a, b: b + END.length, text: text.slice(a, b + END.length) };
}

/** Puts the settings block back on its own lines; null if it can't be made identical. */
function restoreBlock(source, out) {
  const want = block(source);
  const got = block(out);
  if (!want || !got) return null;
  const fixed = got.text.replace(/\\n/g, '\n');
  if (fixed !== want.text) return null;
  return out.slice(0, got.a) + fixed + out.slice(got.b);
}

const unminified = [];
let before = 0;
let after = 0;
let count = 0;
const kept = [];

for await (const file of files(root)) {
  const ext = extname(file);
  if (!['.html', '.js', '.mjs', '.css'].includes(ext)) continue;
  const source = await readFile(file, 'utf8');
  let out;
  try {
    if (ext === '.html') {
      if (DEMO_PAGE.test(relative(root, file).split(sep).join('/'))) {
        kept.push(relative(root, file));
        continue;
      }
      out = await minifyHtml(source, HTML_OPTIONS);
    } else if (ext === '.css') {
      if (KEEP_CSS.test(source)) {
        kept.push(relative(root, file));
        continue;
      }
      const result = css.minify(source);
      if (result.errors.length) throw new Error(result.errors.join('; '));
      out = result.styles;
    } else {
      // A settings block inside a template literal must keep its lines.
      const hasBlock = source.includes(START);
      const options = hasBlock ? { ...JS_OPTIONS, compress: false } : JS_OPTIONS;
      const result = await minifyJs(source, { ...options, module: ext === '.mjs' });
      out = result.code;
      if (hasBlock) {
        out = restoreBlock(source, out);
        if (out === null) {
          unminified.push(relative(root, file));
          continue;
        }
      }
    }
  } catch (err) {
    console.error(`minify-site: ${relative(root, file)}: ${err.message || err}`);
    process.exit(1);
  }
  await writeFile(file, out);
  before += Buffer.byteLength(source);
  after += Buffer.byteLength(out);
  count += 1;
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`minify-site: ${count} files, ${kb(before)} -> ${kb(after)} (${Math.round((1 - after / before) * 100)}% smaller)`);
if (kept.length) console.log(`minify-site: kept as is (settings markers, demo pages): ${kept.join(', ')}`);
if (unminified.length) console.log(`minify-site: settings block not restorable, published unminified: ${unminified.join(', ')}`);
