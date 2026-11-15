# Tasks

## 1. Component

- [x] 1.1 `components/copy-button/copy-button.js`: shadow DOM with settings block; native button; `value` / `for` source; labelled and icon-only forms, `aria-label`; `variant`, `size`, `disabled`; copied and error states with stacked labels and icons, live region, `reset-delay`; clipboard API with textarea fallback and focus restore; `copy-success` / `copy-error`; `copy()`, `reset()`, `focus()`, `value`, `text`, `state`; `slot="icon"`; reduced motion and forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/copy-button/demo.html`: demo-page card convention with code tiles: value, `for` on an element and on a field, variants, sizes next to buttons, own icon, disabled, own labels, reset delay, failure, events with a log, a list of keys. Verify: loads without console errors; every card has a code tile.
- [x] 1.3 `components/copy-button/construction.html`: preview (variants, sizes, both result states held) plus a manifest for every `--kakao-copy-button-*` property. Verify: the settings table lists every property with no warnings.

## 2. Pages

- [x] 2.1 `components.html`: Copy button card between Combobox and Date input, script tag added, "Copy button" placeholder removed from "Not built yet". Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased "Added" entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: same height as `kakao-button` per size, confirmation and failure states readable, width stable, clipboard holds the text, fallback path works and keeps focus, Enter and Space copy, events fire with their details, no horizontal scroll at 390px, no console errors.

## Workflow follow-up

- Archive the change once every task is done.
