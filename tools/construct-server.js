#!/usr/bin/env node
/**
 * construct-server.js
 * ============================================================================
 * Local dev server for the construction pages. It serves the project folder
 * and lets components/<name>/construction.html (and tokens.html) save their
 * settings straight into the source files. Node only, no packages needed.
 * Not meant for production: it listens on 127.0.0.1 only.
 *
 *   node tools/construct-server.js            → http://localhost:8790
 *   node tools/construct-server.js --port 9000
 *
 * ----------------------------------------------------------------------------
 * SETTINGS BLOCK
 * ----------------------------------------------------------------------------
 * Every component source (and shared/tokens.css) has exactly one block:
 *
 *   /* @kakao-settings:start prefix=--kakao-switch- … *\/
 *   --_track-height: var(--kakao-switch-track-height, 1.75rem);
 *   --_track-bg-on: var(--kakao-switch-track-bg-on, var(--kakao-color-primary, #4f46e5));
 *   /* @kakao-settings:end *\/
 *
 * In shared/tokens.css the lines are plain declarations: --kakao-radius: 8px;
 * Only the text between the two markers is ever rewritten.
 *
 * ----------------------------------------------------------------------------
 * ENDPOINTS
 * ----------------------------------------------------------------------------
 *  GET  /__construct/status   { ok: true, name: "kakao-construct" }
 *  POST /__construct/save     { target: "<component>" | "tokens",
 *                               settings: [{ property, value, token? }] }
 *       → { ok: true, file, changed } or { ok: false, error } (status 4xx)
 * ============================================================================
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOKENS_FILE = path.join(ROOT, 'shared', 'tokens.css');
const portArg = process.argv.indexOf('--port');
const PORT = portArg > -1 ? Number(process.argv[portArg + 1]) : 8790;
const HOST = '127.0.0.1';

const START_RE = /\/\* @kakao-settings:start prefix=(--kakao-[a-z0-9-]*)[^*]*\*\//g;
const END_MARK = '/* @kakao-settings:end */';
const NAME_RE = /^--kakao-[a-z0-9]+(?:-[a-z0-9]+)*$/;
// One component line:  --_alias: var(--kakao-x-y, <default>);
const LINE_RE = /^--_([a-z0-9-]+): var\((--kakao-[a-z0-9-]+), (.+)\);$/;
// A default bound to a main variable:  var(--kakao-token, <literal>)
const TOKEN_DEFAULT_RE = /^var\((--kakao-[a-z0-9-]+), (.+)\)$/;
// One tokens line:  --kakao-token: <literal>;
const TOKEN_LINE_RE = /^(--kakao-[a-z0-9-]+): (.+);$/;
// Characters that could end the declaration, the rule, the comment, the JS
// template string or the inlining script tag.
const FORBIDDEN_VALUE = /[;{}<>\\`\n\r]|\*\/|\/\*|\$\{/;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

class SaveError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

/* ---------------------------------------------------------------------------
 * Settings block parsing / writing
 * ------------------------------------------------------------------------- */

/** Finds the single settings block in a source text. */
function findBlock(text, file) {
  const starts = [...text.matchAll(START_RE)];
  if (starts.length !== 1) {
    throw new SaveError(`${rel(file)} must contain exactly one settings block (found ${starts.length})`, 409);
  }
  const start = starts[0];
  const bodyStart = start.index + start[0].length;
  const end = text.indexOf(END_MARK, bodyStart);
  if (end < 0 || text.indexOf(END_MARK, end + END_MARK.length) > -1) {
    throw new SaveError(`${rel(file)}: settings block has no single end marker`, 409);
  }
  return { prefix: start[1], bodyStart, bodyEnd: end, body: text.slice(bodyStart, end) };
}

/** Splits a block body into its declaration lines plus the indentation used. */
function parseBody(body, file, isTokens) {
  const lines = body.split('\n');
  const decls = [];
  let indent = '';
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    if (!indent) indent = raw.match(/^\s*/)[0];
    if (isTokens) {
      const m = line.match(TOKEN_LINE_RE);
      if (!m) throw new SaveError(`${rel(file)}: settings line ${i} is not "--kakao-name: value;": ${line}`, 409);
      decls.push({ property: m[1], value: m[2] });
    } else {
      const m = line.match(LINE_RE);
      if (!m) throw new SaveError(`${rel(file)}: settings line ${i} is not "--_alias: var(--kakao-…, default);": ${line}`, 409);
      decls.push({ alias: m[1], property: m[2], value: m[3] });
    }
  });
  // The text before the end marker on its own line (usually the indent of the
  // marker) is kept so the closing comment stays where it was.
  const tail = lines[lines.length - 1].trim() === '' ? lines[lines.length - 1] : '';
  return { decls, indent, tail };
}

function rel(file) { return path.relative(ROOT, file); }

/** Reads the names of all main variables, so bindings can be checked. */
function knownTokens() {
  if (!fs.existsSync(TOKENS_FILE)) return new Set();
  const text = fs.readFileSync(TOKENS_FILE, 'utf8');
  const block = findBlock(text, TOKENS_FILE);
  return new Set(parseBody(block.body, TOKENS_FILE, true).decls.map((d) => d.property));
}

function checkValue(value, property) {
  if (typeof value !== 'string' || !value.trim()) throw new SaveError(`${property}: empty value`);
  if (value.length > 200) throw new SaveError(`${property}: value is too long`);
  if (FORBIDDEN_VALUE.test(value)) throw new SaveError(`${property}: value contains a forbidden character`);
  // Parentheses must balance, or the value could close the surrounding var().
  let depth = 0;
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')' && --depth < 0) break;
  }
  if (depth !== 0) throw new SaveError(`${property}: unbalanced parentheses in value`);
  return value.trim();
}

/** Resolves the file that holds a target's settings block. */
function resolveTarget(target) {
  if (target === 'tokens') {
    if (!fs.existsSync(TOKENS_FILE)) throw new SaveError('shared/tokens.css does not exist', 404);
    return { file: TOKENS_FILE, isTokens: true };
  }
  if (typeof target !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(target)) {
    throw new SaveError('invalid target name');
  }
  const dir = path.join(ROOT, 'components', target);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new SaveError(`unknown component "${target}"`, 404);
  const candidates = [`${target}.js`, `${target}.css`]
    .map((f) => path.join(dir, f))
    .filter((f) => fs.existsSync(f) && fs.readFileSync(f, 'utf8').includes('@kakao-settings:start'));
  if (candidates.length !== 1) {
    throw new SaveError(`component "${target}" needs exactly one source file with a settings block (found ${candidates.length})`, 409);
  }
  return { file: candidates[0], isTokens: false };
}

/** Applies a save request to its file. Returns { file, changed }. */
function save(request) {
  if (!request || typeof request !== 'object') throw new SaveError('body must be a JSON object');
  if (!Array.isArray(request.settings) || !request.settings.length) throw new SaveError('settings must be a non-empty array');
  if (request.settings.length > 300) throw new SaveError('too many settings');

  const { file, isTokens } = resolveTarget(request.target);
  const text = fs.readFileSync(file, 'utf8');
  const block = findBlock(text, file);
  const { decls, indent, tail } = parseBody(block.body, file, isTokens);
  const tokens = isTokens ? null : knownTokens();
  const byProperty = new Map(decls.map((d) => [d.property, d]));
  const seen = new Set();

  for (const s of request.settings) {
    if (!s || typeof s.property !== 'string' || !NAME_RE.test(s.property)) throw new SaveError('invalid property name');
    if (!s.property.startsWith(block.prefix) || s.property === block.prefix.replace(/-$/, '')) {
      throw new SaveError(`${s.property} is outside the ${block.prefix}* namespace of ${rel(file)}`);
    }
    if (seen.has(s.property)) throw new SaveError(`${s.property} is listed twice`);
    seen.add(s.property);

    let value = checkValue(s.value, s.property);
    if (s.token != null && s.token !== '') {
      if (isTokens) throw new SaveError('main variables cannot be bound to other main variables');
      if (!NAME_RE.test(s.token) || !tokens.has(s.token)) throw new SaveError(`unknown main variable ${s.token}`);
      value = `var(${s.token}, ${value})`;
    }

    const existing = byProperty.get(s.property);
    if (existing) {
      existing.value = value;
    } else {
      const decl = isTokens
        ? { property: s.property, value }
        : { alias: s.property.slice(block.prefix.length), property: s.property, value };
      decls.push(decl);
      byProperty.set(s.property, decl);
    }
  }

  const lines = decls.map((d) => (isTokens
    ? `${indent}${d.property}: ${d.value};`
    : `${indent}--_${d.alias}: var(${d.property}, ${d.value});`));
  const newBody = `\n${lines.join('\n')}\n${tail}`;
  if (newBody === block.body) return { file: rel(file), changed: false };

  const next = text.slice(0, block.bodyStart) + newBody + text.slice(block.bodyEnd);
  if (/<\/script/i.test(next.slice(block.bodyStart, block.bodyStart + newBody.length))) {
    throw new SaveError('settings would contain a closing script tag');
  }
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, next);
  fs.renameSync(tmp, file);
  return { file: rel(file), changed: true };
}

/* ---------------------------------------------------------------------------
 * HTTP
 * ------------------------------------------------------------------------- */

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  return origin === `http://127.0.0.1:${PORT}` || origin === `http://localhost:${PORT}`;
}

function serveStatic(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400); res.end('Bad request'); return;
  }
  let file = path.normalize(path.join(ROOT, pathname));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}

function handleSave(req, res) {
  if (!sameOrigin(req)) { sendJson(res, 403, { ok: false, error: 'saves are only accepted from this server\'s own pages' }); return; }
  if (!/^application\/json\b/.test(req.headers['content-type'] || '')) {
    sendJson(res, 415, { ok: false, error: 'expected application/json' }); return;
  }
  let raw = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    raw += chunk;
    if (raw.length > 256 * 1024) { sendJson(res, 413, { ok: false, error: 'request too large' }); req.destroy(); }
  });
  req.on('end', () => {
    if (res.writableEnded) return;
    try {
      const result = save(JSON.parse(raw));
      console.log(`saved ${result.file}${result.changed ? '' : ' (no change)'}`);
      sendJson(res, 200, { ok: true, ...result });
    } catch (err) {
      const status = err instanceof SaveError ? err.status : (err instanceof SyntaxError ? 400 : 500);
      console.warn(`save refused: ${err.message}`);
      sendJson(res, status, { ok: false, error: err.message });
    }
  });
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/__construct/status' && req.method === 'GET') { sendJson(res, 200, { ok: true, name: 'kakao-construct' }); return; }
  if (url === '/__construct/save') {
    if (req.method !== 'POST') { sendJson(res, 405, { ok: false, error: 'use POST' }); return; }
    handleSave(req, res); return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  serveStatic(req, res);
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`kakao construction server: http://localhost:${PORT}/  (serving ${ROOT})`);
  });
}

module.exports = { save, findBlock, parseBody };
