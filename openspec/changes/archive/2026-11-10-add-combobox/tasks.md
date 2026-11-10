# Tasks

## 1. Select fixes

- [x] 1.1 `components/select/select.js`: panel 1px border in the line colour (new `--kakao-select-panel-border` setting; shadow without the ring), search field focus as the 2px outline with 2px offset; construction manifest row for the border; settings saved through `POST /__construct/save`. Verify: select opens with the border, search focus shows the outline.

## 2. Component

- [x] 2.1 `components/combobox/combobox.js`: shadow DOM, settings block, option sources and groups (copied from the select), editable field with label / hint / error / sizes / placeholder / chevron, filtering, "Use" row (`create-label`, `no-create`, `strict`), `autocomplete` list / both / none, keyboard per APG, value semantics, ElementInternals (value, required, pattern, minlength, maxlength, reset, restore, disabled), events, ARIA, top-layer panel identical to the select's, motion and reduced motion, header comment. Verify: no literal closing script tag; loads without console errors.
- [x] 2.2 `components/combobox/demo.html`: basic, groups, free text with the "Use" row, `autocomplete="both"`, strict, required in a form showing FormData, long list, sizes / states, event log. Verify: loads without console errors.
- [x] 2.3 `components/combobox/construction.html`: previews and a manifest of every `--kakao-combobox-*` property; defaults saved through `POST /__construct/save`. Verify: the save round-trips.

## 3. Pages

- [x] 3.1 `components.html`: Combobox section replaces the placeholder. Verify: renders.
- [x] 3.2 `styleguide.html` audit row; `kitchen-sink.html` uses a combobox. Verify: both load without console errors.
- [x] 3.3 `CHANGELOG.md` Unreleased entry (combobox, select fixes). Verify: read.

## 4. Verification

- [x] 4.1 Headless Chromium and Firefox, 390px and 1280px, light and dark: typing and filtering, keyboard (arrows, Enter, Escape close then clear, Tab keeps free text), picking vs free text, form submit / reset, panel on screen, no console errors; select re-checked after its fixes; `node tools/check-themes.js` passes; screenshot of the open combobox with the "Use" row saved to the scratchpad.
