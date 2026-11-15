/**
 * A static list-data value is valid JSON. Dynamic values (template code) are
 * skipped.
 */
'use strict';

module.exports = {
  id: 'list-data-json',
  level: 'error',
  description: 'A static list-data value is valid JSON.',
  tags: ['kakao-*'],
  check(el, ctx) {
    const a = ctx.attr(el, 'list-data');
    if (!a || a.dynamic) return [];
    try {
      JSON.parse(a.value);
      return [];
    } catch (err) {
      const why = String(err.message).replace(/\s+/g, ' ').replace(/\.$/, '');
      return [{ message: `list-data on <${el.tag}> is not valid JSON (${why}).` }];
    }
  },
};
