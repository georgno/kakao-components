# Tasks

## 1. Component

- [x] 1.1 `components/stack/stack.js`: the pile, fanning, max, fade, enter and leave motion, inline and corner placement, aside shift moved out of toast.js; settings block `--kakao-stack-*`; `dismiss()`, `items`, events and `register()`; `window.KakaoStack` with documented hooks; header lists `force`. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/toast/toast.js`: `KakaoToast extends KakaoStack`; own settings block as the stack's replacement; alert tint as the fade; timers in `_updated`. Verify: max, hidden cards, tint fade, handle reasons, `toast-hidden`, hover expands, unchanged in the browser.
- [x] 1.3 `tools/style-check/helpers.js`: `VALUES` for `position` on `kakao-stack` and `kakao-toast`. Verify: `node --test`.
- [x] 1.4 `components/stack/demo.html` and `construction.html`. Verify: no console errors, no sideways scroll; manifest and settings block list the same properties.

## 2. Pages

- [x] 2.1 `stack.js` before `toast.js` on every page that loads the toast (components, kitchen sink, toast demo and construction).
- [x] 2.2 Card on `components.html` (after Spinner), style guide audit row, `tokens.json` regenerated, changelog.
