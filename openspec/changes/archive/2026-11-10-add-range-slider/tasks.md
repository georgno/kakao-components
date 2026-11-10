# Tasks

## 1. Component

- [x] 1.1 `components/range-slider/range-slider.js`: shadow DOM, settings block (`--kakao-range-slider-*` falling back to `--kakao-slider-*`), two thumbs, fill between them, ticks, number fields (kakao-number-input when present), min-gap, pointer (nearer thumb, tie by direction), keyboard, ARIA, ElementInternals (two entries, reset, restore, disabled), events, reduced motion, forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/range-slider/demo.html`: price with unit, min-gap, fine steps, disabled, themed, a form showing FormData, API playground with event log. Verify: loads without console errors.
- [x] 1.3 `components/range-slider/construction.html`: previews and a manifest of every `--kakao-range-slider-*` property. Verify: a save through `POST /__construct/save` round-trips.

## 2. Verification

- [x] 2.1 Headless Chromium and Firefox, 390px and 1280px, light and dark: drag, track press, keyboard, gap, typing, submit / reset, no horizontal scroll, no console errors; `node tools/check-themes.js` passes.

## Workflow follow-up

- Wiring (components.html, styleguide audit, CHANGELOG, kitchen sink) is done by the coordinator.
- Archive the change once every task is done.
