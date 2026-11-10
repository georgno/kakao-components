# Tasks

## 1. Component

- [x] 1.1 `components/tag-input/tag-input.js`: shadow DOM, settings block, field (label, hint, error, sizes), chips as `<kakao-chip>`, Enter / delimiters / paste / blur, Backspace two-step, arrow navigation, Delete, `max-tags`, duplicates, suggestions panel (from combobox.js), ElementInternals (one entry per tag, required, reset, restore, disabled fieldset), events, ARIA, reduced motion, forced colours, header comment. Verify: no literal closing script tag; no console errors.
- [x] 1.2 `components/tag-input/demo.html`: basic, suggestions, delimiters, limit, duplicates and commas, wrapping, sizes, states, form with FormData, playground with event log.
- [x] 1.3 `components/tag-input/construction.html`: previews and a manifest of every `--kakao-tag-input-*` property; save round-trips through `POST /__construct/save`.

## 2. Verification

- [x] 2.1 Headless Chromium and Firefox, 390px and 1280px, light and dark: typing, delimiters, paste, Backspace two-step, arrows, Delete, ×, Tab skips chips, suggestions, max-tags, duplicates, FormData, required, reset; no horizontal scroll, no console errors; `node tools/check-themes.js` passes.

## 3. Pages (left to the wiring step)

- [x] 3.1 Snippets for `components.html`, the `styleguide.html` audit row, `kitchen-sink.html` and `CHANGELOG.md` handed to the wiring step.
