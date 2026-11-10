# Proposal

## Why

Forms need a field for a short list of free-text values (keywords, labels, recipients). The select's `multiple` only picks from a fixed list and the combobox holds one value; `multiple` free-text tags were left out of the combobox as a follow-up.

## What Changes

- New component `<kakao-tag-input>` (`components/tag-input/`), shadow DOM, form-associated. The field looks like the text input (label, hint, error, sizes `sm` / `md` / `lg`); the tags are real `<kakao-chip removable>` elements that wrap inside it, the text field takes the room left on the last line.
- Enter or a delimiter (`delimiters`, default ",") turns the text into a tag; a paste with delimiters or line breaks adds several; leaving the field adds the typed text.
- Keyboard: Backspace in the empty field selects the last tag (focus on its ×, the chip turns ink), a second Backspace removes it; ← / → / Home / End move between tags and back to the text; Delete removes the selected tag. Tags are not Tab stops.
- `value` (comma list or JSON array, the initial value; reset goes back to it), `values`, `name` (one form entry per tag), `placeholder`, `max-tags`, `allow-duplicates` (default: refused, ignoring case; the existing chip flashes), `disabled`, `readonly`, `required`.
- Optional suggestions from `list-data` (JSON array of strings) or the `suggestions` property, shown while typing in the combobox's panel (copied).
- Events `tag-add` and `tag-remove` (cancelable, `{ value }`) and `change`.
- Settings block (`--kakao-tag-input-*`), construction page, demo.

## Capabilities

### New Capabilities
- `tag-input`: entering, removing and navigating tags, value and form participation, suggestions, events, accessibility, theming.

## Impact

- New: `components/tag-input/{tag-input.js,demo.html,construction.html}`. Uses `components/chip/chip.js` on the page (not loaded by the component).
- Pages (later wiring step): `components.html`, `styleguide.html` audit row, `kitchen-sink.html`, `CHANGELOG.md`.
