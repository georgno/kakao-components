/**
 * Styleguide, Button order: in a card footer the main button comes first
 * (which is also what gives the card its glow).
 */
'use strict';

module.exports = {
  id: 'card-main-button-first',
  level: 'error',
  description: 'The main card button comes first in the footer.',
  tags: ['kakao-card'],
  check(el, ctx) {
    const { buttons, footer } = ctx.footerButtons(el);
    if (buttons.length < 2) return [];
    const main = ctx.mainButton(buttons);
    if (main === null || main <= 0) return [];
    return [{
      el: footer || buttons[main],
      message: `The main button ${ctx.describe(buttons[main])} should be first in the card footer.`,
    }];
  },
};
