# Tasks

## 1. Component

- [x] 1.1 `components/aside-sheet/aside-sheet.js`: shadow DOM sheet with settings block; sides (logical + aliases), inner-corner radius, skirt; open attribute, `show()` / `hide()` / `toggle()` / `isOpen`; `for` triggers with aria; `data-close`, close button, `no-dismiss`; modal machinery (scrim, focus in / trap across shadow roots / return, Escape, scroll lock), `modal="false"`, `contained`; slots, scroll edges, sizing and safe areas; handle and swipe; spring in / standard out, reduced motion; events and triggers; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/aside-sheet/demo.html`: all four sides, rich content, a long scrolling body, a form in a footer, handle, non-modal, no-dismiss, cancelable close, event log. Verify: loads without console errors; the log shows `sheet-show` / `sheet-hide` / `sheet-hidden`.
- [x] 1.3 `components/aside-sheet/construction.html`: contained previews of each side and a manifest for every `--kakao-aside-sheet-*` property; defaults saved through `POST /__construct/save`. Verify: the save round-trips and the settings block is unchanged in meaning.

## 2. Pages

- [x] 2.1 `components.html`: new Aside sheet section with demo and construction links and working examples. Verify: renders, buttons open sheets.
- [x] 2.2 `styleguide.html` audit row; `kitchen-sink.html` uses a sheet where it fits. Verify: both load without console errors.
- [x] 2.3 `CHANGELOG.md` Unreleased entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Chromium and Firefox, 390px and 1280px, light and dark: each side, radius only on the inner corners, focus trap and return, Escape, scrim click, scroll lock, reduced motion, no console errors; `node tools/check-themes.js` passes; screenshots of bottom and end sheets saved to the scratchpad.

## Workflow follow-up

- Archive the change once every task is done.
