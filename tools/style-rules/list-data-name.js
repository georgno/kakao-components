/**
 * Project rule: a component takes its JSON configuration in list-data,
 * never in a data attribute.
 */
'use strict';

module.exports = {
  id: 'list-data-name',
  level: 'error',
  description: 'JSON configuration goes in list-data, never in data.',
  tags: ['kakao-*'],
  check(el, ctx) {
    if (!ctx.has(el, 'data')) return [];
    return [{ message: `<${el.tag}> takes its JSON configuration in list-data; rename the data attribute.` }];
  },
};
