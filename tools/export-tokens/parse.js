'use strict';
/**
 * parse.js - reads the CSS values used in the settings blocks into typed
 * nodes (see tools/export-tokens.js for the node shapes). Node only.
 *
 * The subset is fixed and small: numbers with px / rem / em / cap / deg /
 * ms / s / vh / vw / dvh / %, hex colours, rgb() / rgba() (comma and space syntax),
 * transparent, currentColor, inherit, none, other keywords, quoted strings,
 * var(), color-mix(in srgb, …), cubic-bezier(), calc() / clamp() / min() /
 * max(), and space or comma separated lists of these. Anything else throws a
 * ParseError naming the text, so a new syntax is never guessed at.
 */

class ParseError extends Error {}

const UNITS = new Set(['px', 'rem', 'em', 'cap', 'deg', 'ms', 's', 'vh', 'vw', 'dvh', '%']);
const FUNCS = new Set(['var', 'rgb', 'rgba', 'color-mix', 'cubic-bezier', 'calc', 'clamp', 'min', 'max']);
const REM = 16;

/* ---- tokenizer ------------------------------------------------------------ */

function tokenize(src) {
  const out = [];
  let i = 0;
  const err = (msg) => {
    throw new ParseError(`${msg} at ${i} in "${src}"`);
  };
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      while (i < src.length && /\s/.test(src[i])) i++;
      out.push({ t: 'ws' });
      continue;
    }
    if (c === ',' || c === '(' || c === ')' || c === '/' || c === '*') {
      out.push({ t: c });
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      const end = src.indexOf(c, i + 1);
      if (end < 0) err('unclosed string');
      out.push({ t: 'str', v: src.slice(i + 1, end) });
      i = end + 1;
      continue;
    }
    if (c === '#') {
      const m = /^#([0-9a-fA-F]{3,8})\b/.exec(src.slice(i));
      if (!m || ![3, 4, 6, 8].includes(m[1].length)) err('bad hex colour');
      out.push({ t: 'hash', v: m[1].toLowerCase() });
      i += m[0].length;
      continue;
    }
    // A number (a sign only when a digit or dot follows; "+"/"-" between
    // spaces is an operator).
    const num = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?(%|[a-zA-Z]+)?/.exec(src.slice(i));
    if (num && (/[\d.]/.test(c) || ((c === '-' || c === '+') && /[\d.]/.test(src[i + 1] || '')))) {
      const unit = num[3] || '';
      out.push({ t: 'num', v: parseFloat(num[0]), unit: unit.toLowerCase() });
      i += num[0].length;
      continue;
    }
    // Identifiers may start with dashes (-apple-system, --kakao-x); a lone
    // "+" or "-" is a calc() operator.
    const id = /^-*[a-zA-Z_][a-zA-Z0-9_-]*/.exec(src.slice(i));
    if (!id && (c === '+' || c === '-')) {
      out.push({ t: 'op', v: c });
      i++;
      continue;
    }
    if (id) {
      i += id[0].length;
      if (src[i] === '(') {
        out.push({ t: 'fn', v: id[0].toLowerCase() });
        i++;
      } else {
        out.push({ t: 'ident', v: id[0] });
      }
      continue;
    }
    err(`unexpected "${c}"`);
  }
  return out;
}

/* ---- parser ---------------------------------------------------------------- */

/** Splits a token run at top-level commas (parentheses nest). */
function splitCommas(toks) {
  const parts = [[]];
  let depth = 0;
  for (const t of toks) {
    if (t.t === '(' || t.t === 'fn') depth++;
    if (t.t === ')') depth--;
    if (t.t === ',' && depth === 0) parts.push([]);
    else parts[parts.length - 1].push(t);
  }
  return parts.map(trim);
}

function trim(toks) {
  let a = 0;
  let b = toks.length;
  while (a < b && toks[a].t === 'ws') a++;
  while (b > a && toks[b - 1].t === 'ws') b--;
  return toks.slice(a, b);
}

/** Splits at top-level whitespace into component values. */
function splitSpaces(toks) {
  const parts = [];
  let cur = [];
  let depth = 0;
  for (const t of toks) {
    if (t.t === 'fn' || t.t === '(') depth++;
    if (t.t === ')') depth--;
    if (t.t === 'ws' && depth === 0) {
      if (cur.length) parts.push(cur);
      cur = [];
    } else {
      cur.push(t);
    }
  }
  if (cur.length) parts.push(cur);
  return parts;
}

/** Body tokens of the function call starting at toks[0] (a fn token), and the rest. */
function callBody(toks) {
  let depth = 0;
  for (let k = 0; k < toks.length; k++) {
    if (toks[k].t === 'fn' || toks[k].t === '(') depth++;
    if (toks[k].t === ')') {
      depth--;
      if (depth === 0) return [toks.slice(1, k), toks.slice(k + 1)];
    }
  }
  throw new ParseError(`unclosed ${toks[0].v}()`);
}

function hexToRgba(h) {
  if (h.length <= 4) h = [...h].map((c) => c + c).join('');
  const n = (k) => parseInt(h.slice(k, k + 2), 16);
  return { r: n(0) / 255, g: n(2) / 255, b: n(4) / 255, a: h.length === 8 ? n(6) / 255 : 1 };
}

const to2 = (x) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, '0');
/** `#rrggbbaa`, rounded the way browsers round to 8 bits. */
function rgbaToHex({ r, g, b, a }) {
  return `#${to2(r)}${to2(g)}${to2(b)}${to2(a)}`;
}

function color(rgba) {
  return { type: 'color', hex: rgbaToHex(rgba) };
}

function numberNode(t) {
  const { v, unit } = t;
  if (!unit) return { type: 'number', value: v };
  if (!UNITS.has(unit)) throw new ParseError(`unknown unit "${unit}"`);
  switch (unit) {
    case 'px':
      return { type: 'length', px: v };
    case 'rem':
      return { type: 'length', px: round(v * REM) };
    case 'em':
      return { type: 'em', factor: v };
    case 'cap':
      return { type: 'cap', factor: v };
    case 'deg':
      return { type: 'angle', deg: v };
    case 'ms':
      return { type: 'duration', ms: v };
    case 's':
      return { type: 'duration', ms: round(v * 1000) };
    case '%':
      return { type: 'percent', value: v };
    default:
      return { type: 'viewport', unit, value: v };
  }
}

const round = (x) => Math.round(x * 1e6) / 1e6;

/** One component value: a single token, or a function call. */
function parseOne(toks) {
  if (!toks.length) throw new ParseError('empty value');
  const t = toks[0];
  if (t.t === 'fn') {
    const [body, rest] = callBody(toks);
    if (trim(rest).length) throw new ParseError(`unexpected text after ${t.v}()`);
    return parseFunction(t.v, body);
  }
  if (toks.length !== 1) throw new ParseError(`cannot read "${toks.map(show).join('')}"`);
  switch (t.t) {
    case 'num':
      return numberNode(t);
    case 'hash':
      return color(hexToRgba(t.v));
    case 'str':
      return { type: 'string', value: t.v };
    case 'ident': {
      const v = t.v;
      const lower = v.toLowerCase();
      if (lower === 'transparent') return { type: 'color', hex: '#00000000' };
      if (lower === 'currentcolor') return { type: 'currentColor' };
      if (lower === 'inherit') return { type: 'inherit' };
      if (lower === 'none') return { type: 'none' };
      return { type: 'keyword', value: v };
    }
    default:
      throw new ParseError(`unexpected "${show(t)}"`);
  }
}

function show(t) {
  if (t.t === 'num') return `${t.v}${t.unit}`;
  if (t.t === 'fn') return `${t.v}(`;
  if (t.t === 'ws') return ' ';
  return t.v ?? t.t;
}

function parseFunction(name, body) {
  if (!FUNCS.has(name)) throw new ParseError(`unknown function ${name}()`);
  const args = splitCommas(body);
  switch (name) {
    case 'var': {
      // var(name, fallback): the fallback is everything after the first comma.
      const nameToks = trim(args[0]);
      if (nameToks.length !== 1 || nameToks[0].t !== 'ident' || !nameToks[0].v.startsWith('--')) {
        throw new ParseError('var() needs a custom property name');
      }
      const ref = { type: 'ref', name: nameToks[0].v };
      if (args.length > 1) {
        const firstComma = body.findIndex((t, k) => t.t === ',' && depthAt(body, k) === 0);
        ref.fallback = parseValue(trim(body.slice(firstComma + 1)));
      }
      return ref;
    }
    case 'rgb':
    case 'rgba': {
      let parts;
      if (args.length >= 3) {
        parts = args.map(trim); // rgb(r, g, b[, a])
      } else {
        // rgb(r g b [/ a])
        const [main, alpha] = splitSlash(trim(body));
        parts = splitSpaces(main);
        if (alpha) parts.push(alpha);
      }
      if (parts.length < 3 || parts.length > 4) throw new ParseError(`${name}() needs 3 or 4 values`);
      const nums = parts.map((p) => {
        if (p.length !== 1 || p[0].t !== 'num') throw new ParseError(`${name}() takes numbers`);
        return p[0];
      });
      const ch = (t) => (t.unit === '%' ? t.v / 100 : t.v / 255);
      const al = nums[3] ? (nums[3].unit === '%' ? nums[3].v / 100 : nums[3].v) : 1;
      return color({ r: ch(nums[0]), g: ch(nums[1]), b: ch(nums[2]), a: al });
    }
    case 'color-mix': {
      if (args.length !== 3) throw new ParseError('color-mix() needs a space and two colours');
      const space = trim(args[0]).filter((t) => t.t !== 'ws');
      if (space.length !== 2 || space[0].v !== 'in' || space[1].v !== 'srgb') {
        throw new ParseError('only color-mix(in srgb, …) is supported');
      }
      const stop = (toks) => {
        const parts = splitSpaces(trim(toks));
        let pct = null;
        const rest = [];
        for (const p of parts) {
          if (p.length === 1 && p[0].t === 'num' && p[0].unit === '%') pct = p[0].v;
          else rest.push(p);
        }
        if (rest.length !== 1) throw new ParseError('a color-mix() stop is one colour and an optional %');
        return { color: parseOne(rest[0]), percent: pct };
      };
      return { type: 'mix', space: 'srgb', a: stop(args[1]), b: stop(args[2]) };
    }
    case 'cubic-bezier': {
      if (args.length !== 4) throw new ParseError('cubic-bezier() needs 4 numbers');
      const ns = args.map((a) => {
        const p = trim(a);
        if (p.length !== 1 || p[0].t !== 'num' || p[0].unit) throw new ParseError('cubic-bezier() takes plain numbers');
        return p[0].v;
      });
      return { type: 'easing', bezier: ns };
    }
    case 'calc':
      if (args.length !== 1) throw new ParseError('calc() takes one expression');
      return { type: 'calc', expr: parseExpr(trim(args[0])) };
    case 'clamp':
      if (args.length !== 3) throw new ParseError('clamp() needs 3 values');
      return { type: 'clamp', args: args.map((a) => parseExpr(trim(a))) };
    case 'min':
    case 'max':
      return { type: name, args: args.map((a) => parseExpr(trim(a))) };
    default:
      throw new ParseError(`unknown function ${name}()`);
  }
}

function depthAt(toks, k) {
  let d = 0;
  for (let j = 0; j < k; j++) {
    if (toks[j].t === 'fn' || toks[j].t === '(') d++;
    if (toks[j].t === ')') d--;
  }
  return d;
}

/** Splits at a top-level "/" (rgb alpha, font size / line height). */
function splitSlash(toks) {
  let depth = 0;
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.t === 'fn' || t.t === '(') depth++;
    if (t.t === ')') depth--;
    if (t.t === '/' && depth === 0) return [trim(toks.slice(0, k)), trim(toks.slice(k + 1))];
  }
  return [toks, null];
}

/** A calc() expression: + and - (with spaces), * and /, parentheses. */
function parseExpr(toks) {
  const items = [];
  for (const part of splitSpaces(toks)) {
    // "*" and "/" may stick to their operands ("2*3"); split them out.
    let cur = [];
    for (const t of part) {
      if (t.t === '*' || t.t === '/') {
        if (cur.length) items.push(cur);
        items.push([t]);
        cur = [];
      } else cur.push(t);
    }
    if (cur.length) items.push(cur);
  }
  let pos = 0;
  const peekOp = (ops) => pos < items.length && items[pos].length === 1 && ops.includes(items[pos][0].t === 'op' ? items[pos][0].v : items[pos][0].t);
  const term = () => {
    let left = operand();
    while (peekOp(['*', '/'])) {
      const op = items[pos++][0].t;
      left = { type: 'op', op, left, right: operand() };
    }
    return left;
  };
  const operand = () => {
    if (pos >= items.length) throw new ParseError('calc() expression ends early');
    const it = items[pos++];
    if (it[0].t === '(') {
      const [inner] = callBody([{ t: 'fn', v: '' }, ...it.slice(1)]);
      return parseExpr(inner);
    }
    return parseOne(it);
  };
  let left = term();
  while (peekOp(['+', '-'])) {
    const op = items[pos++][0].v;
    left = { type: 'op', op, left, right: term() };
  }
  if (pos !== items.length) throw new ParseError('cannot read calc() expression');
  return left;
}

/** A whole declaration value: one value, or a space / comma list. */
function parseValue(toks) {
  toks = trim(toks);
  const commas = splitCommas(toks);
  if (commas.length > 1) return { type: 'list', separator: 'comma', items: commas.map((c) => parseValue(c)) };
  const [before, after] = splitSlash(toks);
  if (after) return { type: 'slash', before: parseValue(before), after: parseValue(after) };
  const spaces = splitSpaces(toks);
  if (spaces.length > 1) return { type: 'list', separator: 'space', items: spaces.map(parseOne) };
  return parseOne(toks);
}

/** Parses a CSS value string. Throws ParseError for anything outside the subset. */
function parse(src) {
  return parseValue(tokenize(String(src).trim()));
}

module.exports = { parse, ParseError, hexToRgba, rgbaToHex };
