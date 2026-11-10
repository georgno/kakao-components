# Tasks

## 1. Component

- [x] 1.1 `components/time-input/time-input.js`: shadow DOM, settings block (round-trips through `POST /__construct/save`), field with label / hint / error / sizes / disabled / readonly, focus outline, tabular numbers, Chromium clock mask and alignment, Firefox nudge, locale propagation, ElementInternals (value, min, max, step, required, mirrored validity, reset, restore, disabled fieldset), events, `showPicker()`, `valueAsNumber`, `valueAsDate`, the now tag, header comment. Verify: no literal closing script tag; no console errors.
- [x] 1.2 `components/time-input/demo.html`: basics, step, seconds, min / max, over midnight, now shortcut (rounding, seconds, out of range, locale, custom label), beside select and date input, 12 / 24 hours, states, form with fieldset, playground.
- [x] 1.3 `components/time-input/construction.html`: previews and a manifest of every `--kakao-time-input-*` property.

## 2. Pages

- [x] 2.1 `components.html` entry, style guide audit row, CHANGELOG bullet: handed to the wiring step (not edited by this change).

## 3. Verification

- [x] 3.1 Headless Chromium and Firefox, 390px and 1280px, light and dark: no horizontal scroll, no console errors; icon on the chevron's line under a select; now tag value, rounding, seconds, events once each, disabled out of range with reason, hidden when disabled / read only; keyboard reaches and activates the tag; form submit / reset / validity / fieldset; `node tools/check-themes.js` passes.
