/**
 * Styleguide, Dialog footer: with more than one footer button, the main
 * (filled) button sits in the corner: last for right (default) and
 * full-width footers, first for button-position="left", last when centred.
 */
'use strict';

module.exports = {
  id: 'dialog-main-button-corner',
  level: 'error',
  description: 'The main dialog button sits in the footer corner.',
  tags: ['kakao-dialog'],
  check(el, ctx) {
    const { buttons, footer } = ctx.footerButtons(el);
    if (buttons.length < 2) return [];
    const main = ctx.mainButton(buttons);
    if (main === null || main < 0) return [];
    let position = 'right';
    if (!ctx.has(el, 'full-width')) {
      const pos = ctx.attr(el, 'button-position');
      if (pos && pos.dynamic) return [];
      if (pos && pos.value.trim() === 'left') position = 'left';
      else if (pos && pos.value.trim() === 'center') position = 'center';
    } else {
      position = 'full-width';
    }
    const want = position === 'left' ? 0 : buttons.length - 1;
    if (main === want) return [];
    const where = position === 'left' ? 'first' : 'last';
    const why = {
      left: 'with button-position="left" the corner is on the left',
      right: 'the buttons sit right (the default), so the corner is on the right',
      center: 'centred buttons have no corner, so the main button comes last',
      'full-width': 'with full-width the corner is on the right',
    }[position];
    return [{
      el: footer || buttons[main],
      message: `The main button ${ctx.describe(buttons[main])} should be ${where} in the footer: ${why}.`,
    }];
  },
};
