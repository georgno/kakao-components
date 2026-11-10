# Tasks

## 1. Component

- [x] 1.1 `components/select/select.js`: shadow DOM, settings block, options from children / `list-data` / `options` (groups, disabled), trigger with label / hint / error / sizes / placeholder / summary, top-layer panel with placement and flip, search filter with empty state, keyboard and pointer, `multiple` with checkboxes and tri-state select all, ElementInternals (value, FormData entries, required, reset, restore, disabled), events, ARIA, motion and reduced motion, header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/select/demo.html`: single, grouped, multiple with select all, ~200 items, a form showing FormData on submit and reset, sizes / states, event log. Verify: loads without console errors.
- [x] 1.3 `components/select/construction.html`: previews and a manifest of every `--kakao-select-*` property; defaults saved through `POST /__construct/save`. Verify: the save round-trips.

## 2. Pages

- [x] 2.1 `components.html`: Select section replaces the placeholder (Combobox stays Missing). Verify: renders.
- [x] 2.2 `styleguide.html` audit row; `kitchen-sink.html` uses a select. Verify: both load without console errors.
- [x] 2.3 `CHANGELOG.md` Unreleased entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Chromium and Firefox, 390px and 1280px, light and dark: filtering (case, diacritics), keyboard-only use, select all with and without a filter, indeterminate, submit / reset, panel on screen near the edges, no console errors; `node tools/check-themes.js` passes; screenshot of the open multiple select saved to the scratchpad.

## Workflow follow-up

- Archive the change once every task is done.
