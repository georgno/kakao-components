# Proposal

## Why

The library has a button menu and the multi dropdown (several joined segments for one value), but no general select: one field that picks one or several values from a list. `components.html` lists Select as "Missing". Long lists need a search, and multiple choice needs checkboxes and a "Select all".

## What Changes

- New component `<kakao-select>` (`components/select/`), shadow DOM, form-associated.
- Trigger looks like the other input fields (`kakao-text-input`): label, hint, error, placeholder, sizes `sm` / `md` / `lg`, disabled, required, chevron.
- Panel reuses the dropdown pattern of the button menu and multi dropdown: overlay surface (elevation level 3, radius 10 with 6px option rows inside 4px padding), hover follows the pointer, it stays on screen (opens upwards when there is no room below, lines up with the trigger's right edge or is shifted in sideways) and sits in the top layer so card overflow does not clip it.
- First line of the open panel is a search field that filters options live (case- and diacritic-insensitive, anywhere in the label), with a "No matches" empty state. Focus moves to it on open; arrow keys move through the filtered options; Enter selects.
- `multiple`: checkbox per row (the `kakao-checkbox` look), panel stays open while picking, a tri-state "Select all" row below the search; with a filter it reads "Select all N matches" and only affects the visible matches. The trigger summarises: first label plus "+N".
- Options from child `<option>` / `<optgroup>` (progressive enhancement), the `list-data` JSON attribute or the `options` property; groups supported.
- Form: `name`, `value` (multiple → one FormData entry per value), `required`, reset, state restore; `input` / `change` and `select-change` events.
- Accessibility: trigger button with `aria-haspopup="listbox"`; search input is a combobox controlling the listbox via `aria-activedescendant`; `aria-multiselectable` for multiple; Escape closes and returns focus; Tab closes and moves on.
- Settings block (`--kakao-select-*`), construction page, demo page; `components.html` section replaces the Select placeholder (Combobox stays Missing), style guide audit row, kitchen sink.

## Capabilities

### New Capabilities
- `select`: the select field: options sources and groups, trigger and summary, panel placement, search and filtering, keyboard and pointer use, multiple with select all, form participation, events, accessibility, motion and theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/select/{select.js,demo.html,construction.html}`.
- Pages: `components.html`, `styleguide.html` (audit row), `kitchen-sink.html`.
- `CHANGELOG.md` (Unreleased). No new top-level file or token.
