# Tasks

## 1. Component

- [x] 1.1 `components/code-input/code-input.js`: shadow DOM, settings block, one field over drawn boxes, editing (type, overwrite, Backspace, arrows, Home/End, paste, autofill), type/pattern/mask/separator, label/hint/error, sizes, disabled/readonly, form participation and validity, events, `:state(complete)`, forced colours, reduced motion; header comment documents the API and the one-field decision. Verify: no literal closing script tag; no console errors.
- [x] 1.2 `components/code-input/demo.html`: basic, separator, PIN mask, alphanumeric, pattern, error, sizes, disabled/read only, form, playground; code blocks. Verify: loads without console errors.
- [x] 1.3 `components/code-input/construction.html`: preview and manifest for every `--kakao-code-input-*` setting; the block round-trips through `POST /__construct/save`. Verify: save returns ok, no change.

## 2. Verification

- [x] 2.1 Headless Chromium and Firefox, light and dark, 390px and 1280px: typing, Backspace, arrows, paste with dashes, autofill-style input, form submit/reset/validity, no horizontal scroll; `node tools/check-themes.js` passes.

## Workflow follow-up

- Wiring (components.html, style guide audit row, CHANGELOG.md, kitchen-sink.html) is done by the coordinator.
