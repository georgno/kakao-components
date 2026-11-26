#!/usr/bin/env node
/**
 * vendor.js
 * ============================================================================
 * Copies the library into another project. Node only, no packages.
 *
 *   node tools/vendor.js <dest> [component…]
 *
 *   node tools/vendor.js ../shop/web/kakao                 everything
 *   node tools/vendor.js ../shop/web/kakao toast tabs      only what these need
 *
 * Components are named by folder (toast, tabs) or tag (kakao-toast, kakao-tab).
 * Copied, in the repo's layout so the paths in CATALOG.md hold:
 *  - each named component's script and light-DOM CSS, and those of the
 *    components it requires or is enhanced by, transitively (custom-elements.json's
 *    `kakao` field; the same order shared/kakao.js loads them in);
 *  - shared/kakao.js, kakao.css, tokens.css, themes.css, font.css and the font
 *    files, component-api.js;
 *  - CATALOG.md and custom-elements.json (the guide and the full API);
 *  - VERSION: the release tag of the checked-out commit. Vendor from a tag
 *    (git checkout vX.Y.Z); on any other commit VERSION holds `git describe`
 *    and a warning is printed.
 * Demo and construction pages are not copied.
 *
 * <dest> must be empty, new, or an earlier vendored copy (it has a VERSION
 * file), whose contents are then replaced, so nothing stale is left behind.
 * Exit codes: 0 copied, 2 usage error (unknown component, bad <dest>).
 * ============================================================================
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { tagMap, closure } = require('./loader');

const ROOT = path.join(__dirname, '..');
const SHARED = [
  'shared/kakao.js',
  'shared/kakao.css',
  'shared/tokens.css',
  'shared/themes.css',
  'shared/font.css',
  'shared/fonts',
  'shared/component-api.js',
  'CATALOG.md',
  'custom-elements.json',
];

class VendorError extends Error {}

/** Component names (folder or tag) -> tags, or a VendorError naming the unknown ones. */
function resolveNames(map, names) {
  if (!names.length) return [...map.keys()];
  const byFolder = new Map();
  for (const [tag, k] of map) {
    const folder = k.script.split('/')[1];
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder).push(tag);
  }
  const tags = [];
  const unknown = [];
  for (const n of names) {
    if (map.has(n)) tags.push(n);
    else if (byFolder.has(n)) tags.push(...byFolder.get(n));
    else unknown.push(n);
  }
  if (unknown.length) throw new VendorError(`unknown component ${unknown.join(', ')} (use a folder name such as toast, or a tag such as kakao-toast)`);
  return tags;
}

/** The repo files the named components need, shared files included. */
function filesFor(manifest, names) {
  const map = tagMap(manifest);
  const tags = closure(map, resolveNames(map, names));
  const files = new Set(SHARED);
  for (const t of tags) {
    const k = map.get(t);
    files.add(k.script);
    k.css.forEach((c) => files.add(c));
  }
  return { tags, files: [...files] };
}

function version(root) {
  const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  const exact = git('describe', '--tags', '--exact-match', 'HEAD');
  if (exact.status === 0) return { tag: exact.stdout.trim(), exact: true };
  const near = git('describe', '--tags', '--always', '--dirty');
  if (near.status === 0) return { tag: near.stdout.trim(), exact: false };
  const file = path.join(root, 'VERSION');
  if (fs.existsSync(file)) return { tag: fs.readFileSync(file, 'utf8').trim(), exact: true };
  return { tag: 'unknown', exact: false };
}

function prepare(dest) {
  if (!fs.existsSync(dest)) return fs.mkdirSync(dest, { recursive: true });
  if (!fs.statSync(dest).isDirectory()) throw new VendorError(`${dest} is not a directory`);
  const entries = fs.readdirSync(dest);
  if (!entries.length) return;
  if (!entries.includes('VERSION')) throw new VendorError(`${dest} is not empty and holds no VERSION file (not an earlier vendored copy); choose an empty folder`);
  for (const e of entries) fs.rmSync(path.join(dest, e), { recursive: true, force: true });
}

function main(argv, root = ROOT, log = process.stdout, err = process.stderr) {
  const args = argv.filter((a) => !a.startsWith('--'));
  if (!args.length || argv.includes('--help')) {
    err.write('usage: node tools/vendor.js <dest> [component…]\n');
    return 2;
  }
  const dest = path.resolve(args[0]);
  if (dest === path.resolve(root) || path.resolve(root).startsWith(dest + path.sep)) {
    err.write('vendor: <dest> must be outside the library\n');
    return 2;
  }
  let picked;
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'custom-elements.json'), 'utf8'));
    picked = filesFor(manifest, args.slice(1));
    prepare(dest);
  } catch (e) {
    if (e instanceof VendorError) {
      err.write(`vendor: ${e.message}\n`);
      return 2;
    }
    throw e;
  }
  for (const f of picked.files) {
    const to = path.join(dest, f);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.cpSync(path.join(root, f), to, { recursive: true });
  }
  const v = version(root);
  fs.writeFileSync(path.join(dest, 'VERSION'), `${v.tag}\n`);
  if (!v.exact) err.write(`vendor: HEAD is not a release tag (${v.tag}); check out a tag (git checkout vX.Y.Z) and vendor again to pin a release.\n`);
  const what = args.length > 1 ? `${picked.tags.join(', ')} (with what they need)` : `all ${picked.tags.length} tags`;
  log.write(`Vendored ${v.tag} into ${dest}: ${what}.\n`);
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { filesFor, resolveNames, version, main, SHARED, VendorError };
