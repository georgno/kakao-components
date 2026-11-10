# Tasks

## 1. Component

- [x] 1.1 `components/password-input/password-input.js`: shadow DOM, settings block, field from the text input, toggle, Caps Lock, requirements with `<kakao-progress>`, validity, form callbacks; header comment documents the API. Verify: no literal closing script tag; no console errors.
- [x] 1.2 `components/password-input/demo.html`: sign-in examples, sizes, states, default / list-data / minlength / property requirements, a form with `required-strength`, playground; code blocks per the demo convention. Verify: loads without console errors.
- [x] 1.3 `components/password-input/construction.html`: preview and manifest for every `--kakao-password-input-*` property; settings round-trip through `POST /__construct/save`. Verify: unchanged file after a save of the defaults.

## 2. Verification

- [x] 2.1 Headless Chromium and Firefox, 390px and 1280px, light and dark, no horizontal scroll; toggle keeps the selection; keyboard toggle keeps focus; Caps Lock warning (Firefox; headless Chromium does not report the key state); requirement count drives the bar; `required-strength` blocks and then allows submit; reset; `node tools/check-themes.js` passes.

## Workflow follow-up

- Page wiring (components.html, style guide audit row, CHANGELOG, kitchen sink) is done by the coordinator.
