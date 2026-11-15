'use strict';
module.exports = {
  id: 'brand-button-variant',
  level: 'error',
  description: 'Brand pages use the primary button only.',
  tags: ['kakao-button'],
  check(el, ctx) {
    return ctx.variant(el) === 'ghost' ? [{ message: 'No ghost buttons on brand pages.' }] : [];
  },
};
