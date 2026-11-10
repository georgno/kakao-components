# Tasks

## 1. Component

- [x] 1.1 `components/progress/progress.js`: shadow DOM, settings block, segments with partial fill, rAF fill animation with eased duration, pop queue with armed/disarmed rule and baselines, indeterminate sweep, reduced motion, host semantics (role, aria values, label), label row with tabular value text, sizes and tones; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/progress/demo.html`: step buttons (+/− one step, jump, reset, indeterminate toggle), segment counts 1 / 3 / 4 / 8, sizes, tones, labels and value text, a pop log. Verify: loads without console errors; stepping shows one pop per completed segment.
- [x] 1.3 `components/progress/construction.html`: preview plus a manifest for every `--kakao-progress-*` property; defaults saved through `POST /__construct/save`. Verify: the settings table lists every property with no warnings.

## 2. Pages

- [x] 2.1 `components.html`: a real Progress section replacing the placeholder (Meter stays missing), with demo and construction links. Verify: renders, its step button pops segments.
- [x] 2.2 `styleguide.html` audit row; `kitchen-sink.html` uses a progress where it fits. Verify: both load without console errors.
- [x] 2.3 `CHANGELOG.md` Unreleased entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Chromium and Firefox, 390px and 1280px, light and dark: segment fill amounts, exactly one pop per completed segment (including the down-and-up and emptied cases), indeterminate, reduced motion, accessibility attributes, no console errors; `node tools/check-themes.js` passes.

## Workflow follow-up

- Archive the change once every task is done.
