/**
 * markup.js
 * ============================================================================
 * The style checker's markup reader: a small, tolerant HTML reader that also
 * copes with template files (Yii2 / PHP views, Twig). Node only, no packages.
 *
 *   const { parse } = require('./markup');
 *   const doc = parse(text);
 *   doc.elements   every element in document order
 *   doc.problems   [{ line, column, message }] for markup it could not read
 *
 * 1. Template regions (<?php ?>, <?= ?>, {{ }}, {% %}, {# #}) are masked with
 *    placeholder characters of the same length, keeping their line breaks, so
 *    lines and columns still point at the original file.
 * 2. A tokenizer reads tags with quoted attribute values, skips comments and
 *    the content of raw-text elements (<script>, <style>, <textarea>, <title>).
 * 3. An element tree is built for all elements. Void elements close
 *    themselves, a few elements close implicitly (li, p, td, …), and an
 *    unmatched close tag closes up to its open match or is ignored.
 *
 * Each element: { tag, attrs (Map name -> attribute), line, column, parent,
 * children, slot, dynamicAttrs }. dynamicAttrs: a template region stands
 * where attribute names go, so any attribute may be there. An attribute: { name, value (entities decoded), raw,
 * dynamic, line, column }. A value overlapping a template region is dynamic.
 * ============================================================================
 */
'use strict';

const MASK = '_';

const TEMPLATE_PATTERNS = [
  /<\?(?:php|=)?[\s\S]*?(?:\?>|$)/g,
  /\{\{[\s\S]*?\}\}/g,
  /\{%[\s\S]*?%\}/g,
  /\{#[\s\S]*?#\}/g,
];

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title']);

/* Elements whose open tag closes an open <p>. */
const CLOSES_P = new Set([
  'address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hr', 'main', 'menu', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul',
]);

/* Open tag -> elements it closes when one of them is the current element. */
const IMPLIED_END = {
  li: ['li'],
  dt: ['dt', 'dd'],
  dd: ['dt', 'dd'],
  option: ['option'],
  tr: ['td', 'th', 'tr'],
  td: ['td', 'th'],
  th: ['td', 'th'],
};

/**
 * Replaces template regions by MASK characters (line breaks kept).
 * Returns { text, ranges: [[start, end], …] } with ranges sorted.
 */
function mask(source) {
  const ranges = [];
  for (const re of TEMPLATE_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(source))) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      ranges.push([m.index, m.index + m[0].length]);
    }
  }
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  /* Drop ranges inside an earlier one (e.g. {{ }} inside <?php ?>). */
  const kept = [];
  for (const r of ranges) {
    const last = kept[kept.length - 1];
    if (last && r[0] < last[1]) {
      if (r[1] > last[1]) last[1] = r[1];
      continue;
    }
    kept.push(r);
  }
  let out = '';
  let pos = 0;
  for (const [s, e] of kept) {
    out += source.slice(pos, s) + source.slice(s, e).replace(/[^\n\r]/g, MASK);
    pos = e;
  }
  out += source.slice(pos);
  return { text: out, ranges: kept };
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (all, name) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return Number.isFinite(code) && code <= 0x10ffff ? String.fromCodePoint(code) : all;
    }
    const v = ENTITIES[name.toLowerCase()];
    return v === undefined ? all : v;
  });
}

/** Line starts, for offset -> line / column. */
function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return (offset) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid; else hi = mid - 1;
    }
    return { line: lo + 1, column: offset - starts[lo] + 1 };
  };
}

function overlaps(ranges, start, end) {
  for (const [s, e] of ranges) {
    if (s >= end) break;
    if (e > start) return true;
  }
  return false;
}

const NAME_START = /[A-Za-z]/;
const SPACE = /[\s]/;

/**
 * Reads the markup. Returns { elements, problems, masked }.
 */
function parse(source) {
  const { text, ranges } = mask(source);
  const where = lineIndex(text);
  const elements = [];
  const problems = [];
  const root = { tag: '#root', children: [], parent: null, attrs: new Map() };
  const stack = [root];
  const len = text.length;
  let i = 0;

  const current = () => stack[stack.length - 1];
  const popTo = (index) => { stack.length = index; };

  function closeImplied(tag) {
    const cur = current();
    const closes = IMPLIED_END[tag];
    if (closes && closes.includes(cur.tag)) {
      stack.pop();
      if (tag === 'tr' && current().tag === 'tr') stack.pop();
      return;
    }
    if (CLOSES_P.has(tag) && cur.tag === 'p') stack.pop();
  }

  while (i < len) {
    const lt = text.indexOf('<', i);
    if (lt < 0) break;
    i = lt;
    if (text.startsWith('<!--', i)) {
      const end = text.indexOf('-->', i + 4);
      if (end < 0) {
        problems.push({ ...where(i), message: 'A comment is never closed (missing "-->"); the rest of the file is skipped.' });
        break;
      }
      i = end + 3;
      continue;
    }
    if (text[i + 1] === '!' || text[i + 1] === '?') {
      const end = text.indexOf('>', i);
      i = end < 0 ? len : end + 1;
      continue;
    }
    if (text[i + 1] === '/') {
      const m = /^<\/([A-Za-z][^\s/>]*)\s*>?/.exec(text.slice(i, i + 200));
      if (!m) { i++; continue; }
      const tag = m[1].toLowerCase();
      for (let s = stack.length - 1; s > 0; s--) {
        if (stack[s].tag === tag) { popTo(s); break; }
      }
      i += m[0].length;
      continue;
    }
    if (!NAME_START.test(text[i + 1] || '')) { i++; continue; }

    /* Open tag. */
    const tagStart = i;
    let j = i + 1;
    while (j < len && !SPACE.test(text[j]) && text[j] !== '>' && text[j] !== '/') j++;
    const tag = text.slice(i + 1, j).toLowerCase();
    const attrs = new Map();
    let selfClosing = false;
    let closed = false;
    let broken = null;
    let dynamicAttrs = false;
    while (j < len) {
      while (j < len && SPACE.test(text[j])) j++;
      if (j >= len) break;
      const c = text[j];
      if (c === '>') { closed = true; j++; break; }
      if (c === '/' && text[j + 1] === '>') { selfClosing = true; closed = true; j += 2; break; }
      if (c === '/') { j++; continue; }
      if (c === '<') { broken = 'A tag is not closed before the next one starts.'; break; }
      const nameStart = j;
      while (j < len && !SPACE.test(text[j]) && !'>/="\''.includes(text[j])) j++;
      if (j === nameStart) { j++; continue; }
      const nameRaw = text.slice(nameStart, j);
      let k = j;
      while (k < len && SPACE.test(text[k])) k++;
      let value = '';
      let raw = '';
      let valueStart = j;
      let valueEnd = j;
      if (text[k] === '=') {
        k++;
        while (k < len && SPACE.test(text[k])) k++;
        const q = text[k];
        if (q === '"' || q === "'") {
          const end = text.indexOf(q, k + 1);
          if (end < 0) { broken = `The value of "${nameRaw}" never ends (missing ${q}).`; j = len; break; }
          valueStart = k + 1;
          valueEnd = end;
          j = end + 1;
        } else {
          valueStart = k;
          while (k < len && !SPACE.test(text[k]) && text[k] !== '>') k++;
          valueEnd = k;
          j = k;
        }
        raw = source.slice(valueStart, valueEnd);
        value = decodeEntities(raw);
      } else {
        valueStart = valueEnd = j;
      }
      const name = nameRaw.toLowerCase();
      const dynamic = overlaps(ranges, nameStart, Math.max(valueEnd, j)) ||
        (valueEnd > valueStart && overlaps(ranges, valueStart, valueEnd));
      if (overlaps(ranges, nameStart, nameStart + nameRaw.length)) dynamicAttrs = true;
      const pos = where(nameStart);
      if (!attrs.has(name)) {
        attrs.set(name, { name, value, raw, dynamic, line: pos.line, column: pos.column });
      }
    }
    if (!closed && !broken) broken = 'A tag is never closed (missing ">").';
    const pos = where(tagStart);
    if (broken) {
      if (tag.startsWith('kakao-')) problems.push({ ...pos, message: `<${tag}> cannot be read: ${broken}` });
      i = Math.max(j, tagStart + 1);
      continue;
    }

    closeImplied(tag);
    const parent = current();
    const slotAttr = attrs.get('slot');
    const el = {
      tag,
      attrs,
      line: pos.line,
      column: pos.column,
      parent: parent === root ? null : parent,
      children: [],
      slot: slotAttr ? slotAttr.value : null,
      dynamicAttrs,
    };
    parent.children.push(el);
    elements.push(el);
    i = j;

    if (VOID.has(tag) || selfClosing) continue;
    if (RAW_TEXT.has(tag)) {
      const re = new RegExp(`</${tag}\\s*>`, 'ig');
      re.lastIndex = i;
      const m = re.exec(text);
      i = m ? m.index + m[0].length : len;
      continue;
    }
    stack.push(el);
  }

  for (let s = 1; s < stack.length; s++) {
    const el = stack[s];
    if (el.tag.startsWith('kakao-')) {
      problems.push({ line: el.line, column: el.column, message: `<${el.tag}> is never closed.` });
    }
  }

  return { elements, problems, roots: root.children, masked: text };
}

module.exports = { parse, mask, decodeEntities };
