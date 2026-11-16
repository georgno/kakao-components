# Tasks

## 1. Component

- [x] 1.1 `components/tooltip/tooltip.js`: shadow DOM bubble with settings block (ink / on-ink roles), `popover="manual"` with fallback, placement with flip and clamp; `for` element and shared bubble for `data-tooltip`; one document controller for hover (delay, warm hand-over, hoverable label), focus-visible, Escape (consumed), touch long-press (move / scroll / lift cancel, click swallow, contextmenu prevented, callout and selection off via an adopted sheet), touch hide (tap, scroll, 3s); title put aside and restored; aria-describedby only when different from the name; events, `tooltip-ready` trigger and `register()`; `show()` / `hide()`, `KakaoTooltip.show/hide/delays`; reduced motion, forced colours; header documents the API and `force`. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/button/button.js`: `_syncTitle` writes `data-tooltip` instead of `title` when `kakao-tooltip` is defined; `_mirrorDataAttrs` keeps it; `tooltip-ready` subscription per instance; `register()` with the reaction; header comment. Verify: inner button gets `title` without the tooltip script and `data-tooltip` with it (either load order).
- [x] 1.3 `tools/style-check/helpers.js`: `VALUES` for `kakao-tooltip` (`placement`). Verify: `node --test`.
- [x] 1.4 `components/tooltip/demo.html`: demo-page card convention: icon-only buttons (automatic), touch long-press (including a menu button and a counting action), any element via `data-tooltip`, a dedicated `for` element, placements, description vs name, events and API. Verify: loads without console errors.
- [x] 1.5 `components/tooltip/construction.html`: preview plus a manifest for every `--kakao-tooltip-*` property. Verify: manifest and settings block list the same properties.

## 2. Pages

- [x] 2.1 `components.html`: Tooltip card after Toc (it appears in the page's toc). Verify: renders.
- [x] 2.2 `styleguide.html` audit row; `kitchen-sink.html` loads the tooltip so its icon buttons get it. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased: "Added" entry for the tooltip, the button entry extended. Verify: read.

## 3. Verification

- [x] 3.1 `node tools/style-check.js`, `node --test`, `node tools/check-themes.js` pass.
- [x] 3.2 Headless Firefox: hover and focus show the label in a light and a dark theme; no title on icon buttons with the script, title without; no console errors.

## Workflow follow-up

- Archive the change once every task is done.
