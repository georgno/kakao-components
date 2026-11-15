# Tasks

## 1. Component

- [x] 1.1 `components/stepper/stepper.js`: shadow DOM with settings block; `list-data` and `steps`; `current` by index or value, reflected; states done / current / upcoming / error; `<ol>` with `aria-current="step"` and hidden state words; SVG check and exclamation marks; lines; vertical orientation; compact form with ResizeObserver and `collapse`; `clickable` buttons with arrow keys, `step-select` and `stepper-change`; `next()`, `previous()`, `goTo()`; `KakaoStepper.texts`; forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/stepper/demo.html`: demo-page card convention with code tiles: basics, states, vertical, narrow spaces, clickable with event logs, a small wizard, the comparison with the step switch, other words. Verify: loads without console errors; every card but the comparison has a code tile.
- [x] 1.3 `components/stepper/construction.html`: preview plus a manifest for every `--kakao-stepper-*` property. Verify: the settings table lists every property.

## 2. Pages

- [x] 2.1 `components.html`: Stepper card after Step switch, script tag added, "Stepper" placeholder removed from "Not built yet". Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased "Added" entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: states readable, lines join the markers, compact form at 390px with no horizontal scroll, buttons only with `clickable`, arrow keys and Enter work, cancelling `step-select` keeps the step, methods clamp, no console errors.

## Workflow follow-up

- Archive the change once every task is done.
