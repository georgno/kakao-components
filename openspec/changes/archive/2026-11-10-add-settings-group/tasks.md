# Tasks

## 1. Component

- [x] 1.1 `components/settings-group/settings-group.js`: `<kakao-settings-group>` and `<kakao-setting>`, one settings block shared by both shadow roots, group title / description / footer / heading-level / variant, row label / hint / icon / control, naming of the control, link and action rows, danger and disabled, container-query stacking with inline switches, `layout`, focus outline, forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/switch-group/switch-group.js`: an empty item label takes the group label as the switch's name and draws no label box. Verify: switch demo unchanged.
- [x] 1.3 `components/settings-group/demo.html`: a realistic settings screen with switch, select, number input, slider, text input, buttons, link rows, a danger row; in a card, in an accordion; narrow; events. Verify: loads without console errors; code blocks show.
- [x] 1.4 `components/settings-group/construction.html`: preview plus a manifest for every `--kakao-settings-group-*` property; a save round-trips through `POST /__construct/save`.

## 2. Verification

- [x] 2.1 Chromium and Firefox, 390px and 1280px, light and dark: no horizontal scroll, stacking, keyboard order, accessible names of the controls, link and action rows, no console errors; `node tools/check-themes.js` passes.
- [x] 2.2 Designer review; Blocking findings fixed.
