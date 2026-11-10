# Tasks

## 1. Component

- [x] 1.1 `components/date-input/date-input.js`: shadow DOM, settings block (defaults saved through `POST /__construct/save`), types and unsupported-type fallback, field with label / hint / error / sizes / disabled / readonly, focus outline, tabular numbers, Chromium indicator mask and alignment, Firefox nudge, locale propagation with the shared `lang` observer, ElementInternals (value, min, max, step, required, mirrored validity, reset, restore, disabled fieldset), events, `showPicker()`, header comment. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/date-input/demo.html`: each type, min / max, required in a form showing FormData, locale switcher (what changes, what doesn't), sizes / states, event log. Verify: loads without console errors.
- [x] 1.3 `components/date-input/construction.html`: previews and a manifest of every `--kakao-date-input-*` property. Verify: the save round-trips.

## 2. Pages

- [x] 2.1 `components.html`: Date input section replaces the "Date & time picker" placeholder. Verify: renders.
- [x] 2.2 `styleguide.html` audit row; `kitchen-sink.html` uses a date input. Verify: both load without console errors.
- [x] 2.3 `CHANGELOG.md` Unreleased entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Chromium and Firefox, 390px and 1280px, light and dark: indicator centre vs select / combobox chevron at sm / md / lg, focus outline, form submit / reset / validity, events once each, locale propagation, no console errors; `node tools/check-themes.js` passes; screenshots of the fields stacked under a select and a combobox saved to the scratchpad as `date-*.png`.
