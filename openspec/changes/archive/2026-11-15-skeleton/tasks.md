# Tasks

## 1. Component

- [x] 1.1 `components/skeleton/skeleton.js`: shadow DOM with settings block; shapes text, circle, block, row, card; `lines`, `width`, `height`, `ratio`, `radius`, `animation`, `avatar`, `media`, `count`, `label`, `hidden`; reduced motion; forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/skeleton/demo.html`: demo-page card convention with code tiles: text, font size, circle, block, radius, composed, rows, card, animation, `aria-busy` region, label. Verify: loads without console errors; every example has a code tile.
- [x] 1.3 `components/skeleton/construction.html`: preview plus a manifest for every `--kakao-skeleton-*` property. Verify: the settings table lists every property with no warnings.

## 2. Pages

- [x] 2.1 `components.html`: Skeleton card before Slider, script tag added, "Skeleton" placeholder removed from "Not built yet", Image placeholder reworded. Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased entry (Added). Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and two dark themes: shapes visible, no horizontal scroll at 390px, sizes from attributes as given, media radius follows the nesting rule, reduced motion static, never focusable, status only with `label`, no console errors.

## Workflow follow-up

- Archive the change once every task is done.
