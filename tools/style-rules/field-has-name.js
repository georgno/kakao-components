/**
 * Styleguide, Naming form fields: a form component with no visible label
 * takes its accessible name from aria-label on the element. A field in a
 * <kakao-setting> row is named by the row's label, so it needs neither.
 */
'use strict';

function named(el, ctx, name) {
  const a = ctx.attr(el, name);
  return !!a && (a.dynamic || a.value.trim() !== '');
}

module.exports = {
  id: 'field-has-name',
  level: 'error',
  description: 'A field without a label has an aria-label.',
  tags: ['kakao-text-input', 'kakao-textarea', 'kakao-radio-group', 'kakao-color-picker', 'kakao-rating'],
  check(el, ctx) {
    if (el.dynamicAttrs || named(el, ctx, 'label') || named(el, ctx, 'aria-label')) return [];
    for (let p = el.parent; p; p = p.parent) {
      if (p.tag === 'kakao-setting') return [];
    }
    return [{ message: `<${el.tag}> has no label: give it a label or an aria-label.` }];
  },
};
