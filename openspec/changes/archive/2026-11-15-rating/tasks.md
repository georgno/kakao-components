# Tasks

## 1. Component

- [x] 1.1 `components/rating/rating.js`: shadow DOM with settings block; radios over the symbols in a radiogroup; `value`, `max`, `step`; pointer pick and hover preview; arrow keys, Home, End, right-to-left; `clearable` and `clear()`; `readonly` image and `disabled`; `label`, `hint`, `error`, `size`, `show-value`, `value-text`; form association with reset, restore and fieldset disabling; `symbol` and `symbol-empty` slots; events; reduced motion and forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/rating/demo.html`: demo-page card convention with code tiles: pick, half steps, clearable, lengths, read-only, sizes, disabled and error, own text, own symbols, a form with reset, a playground with the event log. Verify: loads without console errors; every card has a code tile.
- [x] 1.3 `components/rating/construction.html`: preview plus a manifest for every `--kakao-rating-*` property. Verify: the settings table lists every property.

## 2. Pages

- [x] 2.1 `components.html`: Rating card between Range slider and Select, script tag added, "Rating" placeholder removed from "Not built yet". Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased "Added" entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: keyboard (arrows, Home, End, Delete), one tab stop, focus ring, hover preview, click, clearing, half steps, read-only names and fractions, disabled, form data, validity, reset, fieldset, right-to-left, own symbols, events composed, contrast of the filled symbol per theme, no horizontal scroll at 390px, no console errors.

## Workflow follow-up

- Archive the change once every task is done.
