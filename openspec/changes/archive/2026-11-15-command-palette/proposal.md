# Proposal

## Why

The components page lists "Command palette" as missing: a ⌘K search over the page's actions. There is no native element for it, and pages with many actions (admin screens, editors) need one place to find and run them by keyboard.

## What Changes

- New component `<kakao-command-palette>` (`components/command-palette/`), shadow DOM.
  - Commands from `list-data` or the `commands` property: `{ id, label, group, keywords, shortcut, icon, href, target, value, disabled }`. `icon` is inline SVG markup (cleaned: no scripts, no event handlers); `shortcut` is drawn with `<kakao-kbd size="sm">` when that element is defined, else as text, and is a hint only.
  - Opens on `hotkey` (default `Mod+K`: Command on a Mac, Ctrl elsewhere; `hotkey="none"` turns it off), by `open()` / `toggle()` and the `open` attribute; closes on `close()`, Escape and a click on the covered page, and gives focus back to where it was.
  - Search: case and accents ignored, every word of the query must match the label (substring, else the letters in order) or a keyword; matched letters are highlighted; results stay grouped, best group and best command first.
  - `recent`: remembers the last run commands in memory and lists them first while the query is empty.
  - Enter or a click runs the active command: the palette closes, then fires `command-select` `{ id, value, command }` (bubbling, composed; also the KakaoComponents trigger); a command with `href` then navigates, unless the event was cancelled.
  - WAI-ARIA combobox pattern inside a modal dialog: input `role="combobox"` with `aria-activedescendant` on a `listbox` with labelled groups; Up / Down (wrap), Home / End, PageUp / PageDown; disabled commands are shown but skipped. A polite status says how many commands match.
  - Look: the select's panel (level 3 overlay shadow with its ring, 10px radius, 6px rows) on the dialog's scrim, in the top layer (z 65 where the top layer is missing); a keyboard hint row with kakao-kbd. On a phone the panel is a full-width sheet at the top. Reduced motion and forced colours honoured.
  - `inline` shows the palette in place (previews, construction page): always open, no scrim, no hotkey.
- Settings block (`--kakao-command-palette-*`), construction page, demo page; a card on `components.html` (alphabetical, after Combobox) replacing the "Command palette" placeholder; style guide audit row; changelog entry.

## Discovery through component-api.js

`shared/component-api.js` only records, per tag name, the trigger events a component emits and the reactions it has (`register` / `meta(tagName)`). It has no listing of registered components and no way to invoke an action, so it cannot supply commands. The palette therefore takes commands only from `list-data` / `commands`, and itself registers and emits `command-select`, so other components can react to a run command.

## Capabilities

### New Capabilities
- `command-palette`: commands and their sources, opening and closing, search and highlighting, groups and recent commands, running a command, combobox semantics and keyboard, layout on small screens, theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/command-palette/{command-palette.js,demo.html,construction.html}`. Uses `<kakao-kbd>` only when the page loads it.
- Pages: `components.html` (new card, placeholder removed; the "Not built yet" list is then empty), `styleguide.html` (audit row). Not on `kitchen-sink.html`: its settings form has no page actions to search.
- `CHANGELOG.md` (Unreleased, Added). `.github/workflows/pages.yml` copies `components/` wholesale, so it is unchanged. No new token, no theme change.
