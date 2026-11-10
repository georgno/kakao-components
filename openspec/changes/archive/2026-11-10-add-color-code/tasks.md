# Tasks

## 1. Component

- [x] 1.1 `components/color-code/color-code.js`: shadow DOM, settings block, label slot, swatch as `::before` with ring and checkerboard, validation with `CSS.supports`, `value` attribute and MutationObserver updates, invalid look and `invalid` state, forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/color-code/demo.html`: every syntax, `value` override, alpha, same-as-background, invalid, in text, live update. Verify: loads without console errors.
- [x] 1.3 `components/color-code/construction.html`: preview plus a manifest for every `--kakao-color-code-*` property; defaults round-trip through `POST /__construct/save`. Verify: save returns ok.

## 2. Pages

- [x] 2.1 `components.html`: Color code section with demo and construction links. Verify: renders.
- [x] 2.2 `styleguide.html` audit row; `kitchen-sink.html` shows the subtitle colour as a colour code. Verify: both load without console errors.
- [x] 2.3 `CHANGELOG.md` Unreleased entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Chromium and Firefox, light and dark: hex, modern syntaxes, var(), currentColor, alpha, invalid; `node tools/check-themes.js` passes.

## Workflow follow-up

- Archive the change once every task is done.
