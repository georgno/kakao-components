# Proposal

## Why

Pages can show an inline `<kakao-alert>`, but not a message that floats above the page after an action ("Saved", "Upload failed") without moving the layout. The overview still lists Toast as missing, and the only toast the user likes lives outside the library (the yii2-base Toast widget, with its stacked-cards look). The alert now exists, so a toast can be built on it and stay consistent with it.

## What Changes

- New component `<kakao-toast>` (`components/toast/`), shadow DOM: a fixed notification region in a corner of the viewport (bottom right by default; `position` picks another corner). Its items are `<kakao-alert>` elements, so tones (`info`, `success`, `warning`, `danger`, alias `error`), icons, colours, the close button and reduced-motion handling are the alert's.
- Stacked cards, as in yii2-base: the newest toast is in front, older ones sit behind it, a little smaller, fainter and tilted back; hovering the stack or moving focus into it fans the cards out into a readable list. Newest is at the bottom for bottom corners and on top for top corners.
- `max` attribute (default 3): how many toasts are visible at once; older ones wait hidden behind the stack and come forward as newer ones leave. Hidden toasts' timers do not run.
- Auto-hide: the alert's rule (info and success hide after the default time, warning and danger stay; `duration` overrides, `0` turns it off). The timers of the whole stack pause while it is expanded (hover, focus inside) and while the page is hidden, like the yii2-base container.
- JS helper `KakaoToast.show({ tone, heading, message, duration, dismissible, action, region })` and the same `show()` method on the element; both return a handle with `close()`, `element` and a `closed` promise. The helper creates a region on demand.
- Server-rendered toasts: `<kakao-alert>` children written into `<kakao-toast>` (the yii2 container pattern) are adopted on load.
- Accessibility: the region is a labelled live region (`aria-live="polite"`), each item keeps the alert's role (`status` / `alert`), nothing takes focus. Escape closes the toast that has focus; focus returns where it came from.
- Placement: safe-area insets, full width at phone width, below the header bar for top corners, and moved clear of an open aside menu on the same side (through the aside-menu triggers).
- Events `toast-show` and `toast-hidden` (with a reason), also emitted as triggers.
- Settings block (`--kakao-toast-*`), construction page, demo page; listed on `components.html` (replacing the Toast placeholder), in the style guide audit, and used on `kitchen-sink.html` after saving.

## Capabilities

### New Capabilities
- `toast`: the toast region: placement, stacking and expanding, max visible count, timers and pausing, the JS helper and handles, declarative children, live-region semantics, keyboard, reduced motion, events and theming hooks.

### Modified Capabilities

None. The alert is used through its public attributes, methods and events; its requirements do not change.

## Impact

- New: `components/toast/{toast.js,demo.html,construction.html}`. `toast.js` needs `alert.js` loaded; `kakao-button` is used for an action button when it is defined.
- Pages: `components.html`, `styleguide.html` (audit row), `kitchen-sink.html` (save shows a toast).
- `CHANGELOG.md` (Unreleased). No new top-level file, so `.github/workflows/pages.yml` is unchanged; no new token.
