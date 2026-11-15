/**
 * Attributes with a fixed set of values use one of them. The sets live in
 * the value table in tools/style-check/helpers.js (VALUES).
 */
'use strict';

const { VALUES } = require('../style-check/helpers');

module.exports = {
  id: 'attribute-values',
  level: 'error',
  description: 'Attributes with a fixed set of values use one of them.',
  tags: Object.keys(VALUES),
  check(el, ctx) {
    const table = ctx.VALUES[el.tag] || {};
    const out = [];
    for (const name of Object.keys(table)) {
      const a = ctx.attr(el, name);
      if (!a || a.dynamic) continue;
      const allowed = table[name];
      if (allowed.includes(a.value.trim())) continue;
      const list = allowed.map((v) => (v === '' ? '(no value)' : v)).join(', ');
      out.push({
        line: a.line,
        column: a.column,
        message: `${name}="${a.value}" on <${el.tag}>: ${a.value.trim() || '(empty)'} is not one of ${list}.`,
      });
    }
    return out;
  },
};
