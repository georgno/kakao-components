# Tasks

## 1. Component

- [x] 1.1 `components/empty-state/empty-state.js`: shadow DOM with settings block, icon box (built-in tray glyph, `slot="icon"`, `no-icon`), heading element by level (default 3, none without `heading`), message with default-slot override, actions slot hidden when empty, `size="sm"`, forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/empty-state/demo.html`: demo-page card convention with code tiles: basic, message in the slot, own icons, no icon, actions, sizes, in a list and a table area, playground. Verify: loads without console errors; every card has a code tile.
- [x] 1.3 `components/empty-state/construction.html`: preview plus a manifest for every `--kakao-empty-state-*` property. Verify: the settings table lists every property with no warnings.

## 2. Pages

- [x] 2.1 `components.html`: Empty state card between Dialog and Error page, script tag added, "Empty state" placeholder removed. Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased "Added" entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: readable, centred, no horizontal scroll at 390px, heading levels, slots, Tab reaches the actions, no console errors.

## Workflow follow-up

- Archive the change once every task is done.
