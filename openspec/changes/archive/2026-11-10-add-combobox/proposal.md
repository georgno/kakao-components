# Proposal

## Why

`components.html` lists Combobox as "Missing" (native `<input list>` + `<datalist>`). The new `kakao-select` only picks from a fixed list; forms also need a field where the user picks a suggestion or types a value that is not in the list ("pretty similar to the select, but here it's allowed to also type a new value in"). The select's review also found two things to fix in the dropdown it shares with the new field: the panel edge was drawn with a box-shadow ring instead of the 1px line border of the button menu, and the search field showed focus with a halo instead of the decided 2px outline.

## What Changes

- New component `<kakao-combobox>` (`components/combobox/`), shadow DOM, form-associated: an editable combobox with list autocomplete (ARIA APG pattern). The field is the text input itself; typing filters the suggestions.
- Same option sources, groups, filtering (case- and diacritic-insensitive, anywhere in the label), empty state, panel look and top-layer placement as `kakao-select`.
- Free text: when the text matches no option label exactly, a "Use “…”" row sits at the top of the list (`create-label`, off with `no-create`; `strict` forbids free text entirely). Tab and blur keep the typed text as the value.
- `autocomplete="list"` (default), `"both"` (inline completion of the first match that starts with the text) or `"none"` (no filtering, the list shows everything).
- Value semantics: picking an option sets the value to its value and the text to its label; free text sets both to the text. Events `input`, `change`, `combobox-change`, `combobox-create` (new free-text value), `combobox-open`, `combobox-close`.
- Form: `name`, `value`, `required`, `pattern`, `minlength`, `maxlength`, reset, state restore, disabled fieldset.
- Single value only; `multiple` (free-text tags) is out of scope and noted as a follow-up.
- `kakao-select`: the panel edge becomes a 1px border in the line colour (`--kakao-select-panel-border`), the shadow loses its ring; the search field shows the 2px focus outline with 2px offset.
- Settings block (`--kakao-combobox-*`), construction page, demo; `components.html` section replaces the Combobox placeholder; style guide audit row; kitchen sink.

## Capabilities

### New Capabilities
- `combobox`: the editable combobox: option sources, field, free text and the "Use" row, filtering and inline autocomplete, keyboard and pointer, value semantics, form participation, events, accessibility, placement, theming.

### Modified Capabilities
- `select`: panel edge drawn as a 1px line border; the search field's focus uses the shared 2px outline.

## Impact

- New: `components/combobox/{combobox.js,demo.html,construction.html}`.
- Changed: `components/select/select.js` (+ its construction page manifest for the new border setting).
- Pages: `components.html`, `styleguide.html`, `kitchen-sink.html`; `CHANGELOG.md` (Unreleased). No new top-level file or token.
