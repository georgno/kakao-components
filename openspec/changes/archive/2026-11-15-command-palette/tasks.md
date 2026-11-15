# Tasks

## 1. Component

- [x] 1.1 `components/command-palette/command-palette.js`: shadow DOM with settings block; commands from `list-data` and `commands`; icon cleaning; shortcuts via kakao-kbd or text; hotkey, `open()` / `close()` / `toggle()`, `open` attribute, `inline`; top layer overlay with scrim, scroll lock, focus held and restored; matching with highlights, groups, recent; running (`command-select`, href); combobox / listbox semantics and keys; phone sheet; reduced motion and forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/command-palette/demo.html`: demo-page card convention with code tiles: hotkey, groups and icons, recent, links, custom hotkey, script API, inline. Verify: loads without console errors.
- [x] 1.3 `components/command-palette/construction.html`: preview plus a manifest for every `--kakao-command-palette-*` property. Verify: the manifest and the settings block list the same properties.

## 2. Pages

- [x] 2.1 `components.html`: Command palette card after Combobox, script tag added, placeholder removed from "Not built yet". Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased "Added" entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: Ctrl+K opens, typing filters and highlights, arrows / Home / End / PageUp / PageDown move the active option and skip disabled ones, Enter fires `command-select` after closing, Escape closes and restores focus, Tab stays in the input, recent group appears; the panel is a top sheet at 390px with no horizontal scroll; no console errors.

## Workflow follow-up

- Archive the change once every task is done.
