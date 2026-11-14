# Tasks

## 1. Component

- [x] 1.1 `components/error-page/error-page.js`: shadow DOM with settings block, heading element by level (code + title, hidden "Error"/": "), default headings, message slot fallback, info rows (reference, time with Intl formatting, list-data), actions and details slots hidden when empty, code pattern layer (measure line, ResizeObserver, row counts, stagger), `full`, `no-pattern`, forced colours and print; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/error-page/demo.html`: demo-page card convention with code tiles: 404, 500 with reference and time, 503 maintenance with a time, actions, details, list-data, embedded vs full (framed), heading level, no pattern. Verify: loads without console errors; every card has a code tile.
- [x] 1.3 `components/error-page/construction.html`: preview plus a manifest for every `--kakao-error-page-*` property. Verify: the settings table lists every property with no warnings.

## 2. Pages

- [x] 2.1 `components.html`: Error page card between Dialog and Error summary, with examples and demo/construction links; script tag added. Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased "Added" entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: pattern covers the box, code and text readable, no horizontal scroll at 390px, muted text contrast over the pattern ≥ 4.5:1 in all seven themes, heading accessible text, no console errors; `node tools/check-themes.js` passes.

## Workflow follow-up

- Archive the change once every task is done.
