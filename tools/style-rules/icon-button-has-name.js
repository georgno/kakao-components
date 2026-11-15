/**
 * An icon-only button needs a name: a button with an icon and no label has
 * an aria-label.
 */
'use strict';

function named(el, ctx, name) {
  const a = ctx.attr(el, name);
  return !!a && (a.dynamic || a.value.trim() !== '');
}

module.exports = {
  id: 'icon-button-has-name',
  level: 'error',
  description: 'An icon button without a label has an aria-label.',
  tags: ['kakao-button'],
  check(el, ctx) {
    if (el.dynamicAttrs || named(el, ctx, 'label') || named(el, ctx, 'aria-label')) return [];
    const pos = ctx.attr(el, 'icon-position');
    const hasIcon = ctx.has(el, 'icon') || el.children.some((c) => c.slot === 'icon') ||
      (pos && !pos.dynamic && pos.value.trim() === 'only');
    if (!hasIcon) return [];
    return [{ message: 'This icon button has no label: give it an aria-label that says what it does.' }];
  },
};
