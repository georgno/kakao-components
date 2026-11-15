# Proposal

## Why

Menus, tooltips and hints name keyboard shortcuts ("press Ctrl + K to search"), and the components page still lists Kbd as missing. A bare `<kbd>` has no keycap look, no theme, and no answer to the fact that the same shortcut is ⌘ K on a Mac and Ctrl + K everywhere else. A small component draws the keys consistently and keeps the markup a screen reader understands.

## What Changes

- New component `<kakao-kbd>` (`components/kbd/`), shadow DOM, inline, not interactive.
  - The keys come from the `keys` attribute or, without it, from the element's text (which is also the fallback when the script has not loaded). `+` joins the keys of a combination, a space separates the steps of a sequence ("G I" is G then I).
  - Each key is a keycap. Known key names (Ctrl, Shift, Enter, Up …) are normalised; anything else is shown as written.
  - `platform` (auto, mac, other): `Mod` is Command on a Mac and Ctrl elsewhere; on a Mac the modifiers, Enter, Backspace and Tab are drawn as their symbols and a combination has no "+"; elsewhere they are words joined by "+". Arrow keys are arrows everywhere. All symbols are inline SVG in currentColor.
  - `size` md (default) and sm; `outline` (no fill, takes the surrounding text colour, for coloured backgrounds); `then-label` for the word between sequence steps; `list-data` (a JSON object) renames keys, for another language.
  - Semantics: one `<kbd>` around a `<kbd>` per key; a symbol carries its name as hidden text.
- Settings block (`--kakao-kbd-*`), construction page, demo page; a card on `components.html` (alphabetical, between Header bar and List) replacing the "Kbd" placeholder; style guide audit row; changelog entry.

## Capabilities

### New Capabilities
- `kbd`: key sources and grammar, key names, platform display, sizes, outline, renaming, semantics, theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/kbd/{kbd.js,demo.html,construction.html}`. No dependency on other components.
- Pages: `components.html` (new card, placeholder removed), `styleguide.html` (audit row). Not on `kitchen-sink.html`: the settings form there has no shortcuts to show.
- `CHANGELOG.md` (Unreleased, Added). `.github/workflows/pages.yml` copies `components/` wholesale, so it is unchanged. No new token, no theme change.
