# Tasks

## 1. Button

- [x] 1.1 `components/button/button.js`: inline SVG success check; slotted `slot="icon"` child moved into the icon position (left / right / only), no duplication on re-render, picked up when added later; header comment documents slot and the optional `icon` shortcut. `button.css`: check and slotted SVG sizing. Verify: success check visible with no icon font; all icon positions with an SVG; no console errors.
- [x] 1.2 `components/button/demo.html`: an inline SVG icon example next to a Font Awesome one. Verify: loads without console errors.

## 2. Text input

- [x] 2.1 `components/text-input/text-input.js`: named `icon` slot, box hidden while empty, `icon` attribute creates a light-DOM `<i slot="icon">` (skipped while an own slotted icon is present); header comment. Verify headless: before the change the attribute drew nothing; after, attribute + Font Awesome, slot + Font Awesome and slotted SVG all draw.
- [x] 2.2 `components/text-input/demo.html`: inline SVG and Font Awesome slot examples. Verify: loads without console errors.

## 3. Pages and docs

- [x] 3.1 `index.html`: short note that the demo site uses Font Awesome, optional for your own use. Verify: reads well at 390px and 1280px.
- [x] 3.2 `styleguide.html`: icon rule (own glyphs as inline SVG; user icons via slot or the optional class shortcut).
- [x] 3.3 `components.html` where it documents the icon attribute; `CHANGELOG.md` Unreleased entries.

## 4. Verification

- [x] 4.1 Headless Chromium and Firefox: scratch page without Font Awesome (button success check, slotted SVG icons in button and text input), page with Font Awesome (slot and attribute); no console errors; `node tools/check-themes.js` passes.
- [x] 4.2 Designer review; fix Blocking findings.
