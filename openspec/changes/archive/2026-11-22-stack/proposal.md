# Proposal

## Why

The toast's pile of cards (newest in front, older ones smaller, paler and tilted back, fanning out on hover or focus, `max`, the enter and leave motion, corner placement and the aside shift) is the most involved part of `<kakao-toast>`, and it is locked inside it. Other widgets want the same pile (an upload queue, a stack of notices in a sidebar) and would have to copy about 300 lines of layout and motion.

## What Changes

- New component `<kakao-stack>` (`components/stack/`), shadow DOM: the stacking, fading and fanning mechanics on their own, for any element children.
  - `position`: `inline` (default, in the page flow, cards peek out below) or a viewport corner (`bottom-right`, `bottom-left`, `top-right`, `top-left`), with the toast's corner behaviour (gutter, safe-area insets, below the header bar, beside an aside menu on its side, full width below 30rem).
  - `max` (default 3), `label` (named region), `expanded` (set by the stack); `items`, `expanded`, `dismiss(el, reason)` returning a promise.
  - Cards behind the front one are desaturated by the fade step (they stay opaque).
  - Events and triggers `stack-add`, `stack-removed`, `stack-expand`.
  - Its class is `window.KakaoStack`, with documented hooks (`stackStyles`, `_isItem`, `_itemAdded`, `_itemRemoved`, `_expandedChanged`, `_updated`, `_fade`, `_leaveTransform`, `_position`, `_leave` / `_finish`) so a component extends it instead of copying it.
- `<kakao-toast>` now extends `KakaoStack`: it keeps its own settings block, alerts, timers, Escape, live region, `show()` / `KakaoToast.show()` and `toast-show` / `toast-hidden`, and its fade stays the alert's tint. Its behaviour and API do not change. Pages using it must load `stack.js` before `toast.js`.
- The card state attribute is `data-stack-state` (was `data-toast-state`).
- Settings block (`--kakao-stack-*`), construction page, demo page, card on `components.html`, style guide audit row, `VALUES` for `position` on both, changelog.

## Capabilities

### New Capabilities
- `stack`: placement, stacked cards, fading, expanding, maximum, adding and dismissing, events, extension hooks.

### Modified Capabilities
- `toast`: built on the stack; needs `stack.js`.

## Impact

- New: `components/stack/{stack.js,demo.html,construction.html}`.
- Changed: `components/toast/{toast.js,demo.html,construction.html}`, `components.html`, `kitchen-sink.html`, `styleguide.html`, `tools/style-check/helpers.js`, `tokens.json`, `CHANGELOG.md`.
- Projects that load toast.js (yii2 sites through their DEPENDS list) add `stack` to its dependencies when they update.
