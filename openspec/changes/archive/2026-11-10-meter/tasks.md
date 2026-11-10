# Tasks

## 1. Component

- [x] 1.1 `components/meter/meter.js`: shadow DOM, settings block, native range and region algorithm, single fill with CSS transition (enabled after first render, none under reduced motion), host semantics (role meter, aria values, label), label row with tabular value text, sizes; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/meter/demo.html`: the three storage examples (18 / 55 / 92 GB, low 30, high 80, optimum 20), a stepper that walks the value through the regions, the three optimum placements, sizes, no visible label. Verify: loads without console errors.
- [x] 1.3 `components/meter/construction.html`: preview plus a manifest for every `--kakao-meter-*` property; defaults saved through `POST /__construct/save`. Verify: the settings table lists every property.

## 2. Pages

- [x] 2.1 `components.html`: a real Meter section replacing the placeholder, with demo and construction links. Verify: renders.
- [x] 2.2 `styleguide.html` audit row; `kitchen-sink.html` uses a meter where it fits. Verify: both load without console errors.
- [x] 2.3 `CHANGELOG.md` Unreleased entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Chromium and Firefox, 390px and 1280px, light and dark: fill amounts and region colours in all three regions, motion and reduced motion, accessibility attributes, no console errors; `node tools/check-themes.js` passes.

## Workflow follow-up

- Archive the change once every task is done.
