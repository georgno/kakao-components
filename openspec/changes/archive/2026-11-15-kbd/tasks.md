# Tasks

## 1. Component

- [x] 1.1 `components/kbd/kbd.js`: shadow DOM with settings block; `keys` or text content parsed into steps and keys; key names and aliases; platform detection and `platform`; SVG glyphs with hidden names; separators ("+" visible off the Mac, spoken on it; `then-label`); `size`, `outline`, `list-data` renaming; nested `<kbd>` markup; forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/kbd/demo.html`: demo-page card convention with code tiles: single keys, combinations, sequence, platform forms, sizes, outline, renamed keys, in text and next to menu rows and buttons. Verify: loads without console errors; every card has a code tile.
- [x] 1.3 `components/kbd/construction.html`: preview plus a manifest for every `--kakao-kbd-*` property. Verify: the settings table lists every property with no warnings.

## 2. Pages

- [x] 2.1 `components.html`: Kbd card between Header bar and List, script tag added, "Kbd" placeholder removed from "Not built yet". Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased "Added" entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: keycaps readable and aligned with the text line, no horizontal scroll at 390px, nested kbd markup and hidden names present, never focusable, text changes re-render, no console errors.

## Workflow follow-up

- Archive the change once every task is done.
