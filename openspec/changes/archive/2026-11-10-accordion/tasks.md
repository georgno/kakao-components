# Tasks

## 1. Component

- [x] 1.1 `components/accordion/accordion.js`: shadow DOM on `<details>`/`<summary>`, settings block, header parts (heading/title, description, meta, chevron), `open` / `toggle()` / `show()` / `hide()`, `accordion-toggle` event and trigger, `name` groups, WAAPI height animation with standard easing (none on first render, `no-animate`, reduced motion), nesting looks with `variant`, focus outline; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/accordion/demo.html`: single, attributes vs slots with meta, grouped exclusive FAQ, rich content (a form and a list), three nesting levels, methods and the event log. Verify: loads without console errors.
- [x] 1.3 `components/accordion/construction.html`: preview (card, nested) plus a manifest for every `--kakao-accordion-*` property; defaults saved through `POST /__construct/save`. Verify: the settings table lists every property and a save round-trips.

## 2. Pages

- [x] 2.1 `components.html`: a real Accordion section replacing the placeholder, with demo and construction links. Verify: renders.
- [x] 2.2 `styleguide.html` audit row; `kitchen-sink.html` uses an accordion where it fits. Verify: both load without console errors.
- [x] 2.3 `CHANGELOG.md` Unreleased entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Chromium and Firefox, 390px and 1280px, light and dark: open/close, Enter/Space and Tab order, three nesting levels, exclusive group, reduced motion, no console errors; nested demo screenshots in light and dark saved to the scratchpad; `node tools/check-themes.js` passes.

## Workflow follow-up

- Archive the change once every task is done.
