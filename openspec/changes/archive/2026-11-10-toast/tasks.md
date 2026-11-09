# Tasks

## 1. Component

- [x] 1.1 `components/toast/toast.js`: shadow DOM region with settings block, placement (corners, safe area, header bar, phone width, aside triggers), adoption of `<kakao-alert>` children, measured stack layout (collapsed / expanded, `max`), timers with stack pause, leaving and removal, touch toggle, Escape, live region, `show()` + `KakaoToast.show()` handles, action button, events and triggers; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/toast/demo.html`: tones, stack of 1 / 3 / 6, positions, `max`, durations, action, handle `close()`, written toasts, event log. Verify: loads without console errors, the log shows `toast-show` / `toast-hidden`.
- [x] 1.3 `components/toast/construction.html`: preview of a stack and a manifest for every `--kakao-toast-*` property; defaults saved through `POST /__construct/save`. Verify: the settings table lists every property with no warnings.

## 2. Pages

- [x] 2.1 `components.html`: a real Toast section replacing the placeholder, with links to demo and construction. Verify: renders, buttons show toasts.
- [x] 2.2 `styleguide.html` audit row; `kitchen-sink.html` save shows a success toast. Verify: both load without console errors.
- [x] 2.3 `CHANGELOG.md` Unreleased entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Chromium and Firefox, 390px and 1280px, light and dark: stacking with 1, 3 and 6 toasts, hover expand, auto-dismiss, manual close, keyboard (Tab, Escape), reduced motion, no console errors; `node tools/check-themes.js` passes.

## Workflow follow-up

- Archive the change once every task is done.
