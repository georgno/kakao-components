# Tasks

## 1. Component

- [x] 1.1 `components/spinner/spinner.js`: shadow DOM with settings block; ring as inline SVG with the button's geometry; `size`, `tone`, `label`, `show-label`, `stacked`, `delay`, `hidden` handling, `shown`; status text written on show; reduced motion; forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/button/button.css`: the ring's dash array becomes an arc. Verify: a running button shows a turning arc equal to the spinner's.
- [x] 1.3 `components/spinner/demo.html`: demo-page card convention with code tiles: default, sizes, text colour, tones, labels, stacked, delay, in text, in rows, next to a button. Verify: loads without console errors; every card has a code tile.
- [x] 1.4 `components/spinner/construction.html`: preview plus a manifest for every `--kakao-spinner-*` property. Verify: the settings table lists every property with no warnings.

## 2. Pages

- [x] 2.1 `components.html`: Spinner card between Slider and Step switch, script tag added, "Spinner" placeholder removed from "Not built yet". Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased entries (Added, Fixed). Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: rings visible in every tone, no horizontal scroll at 390px, status text present, delay keeps a fast load silent and reserves space, reduced motion pulses instead of turning, never focusable, no console errors.

## Workflow follow-up

- Archive the change once every task is done.
