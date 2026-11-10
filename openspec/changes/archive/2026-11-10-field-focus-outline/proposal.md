## Why

Four fields still showed focus as a border change plus a soft translucent halo (text input, textarea, number input, multi dropdown). The halo fails WCAG 1.4.11 (about 1.3–1.4:1 on white), and the other fields (date, time, password, code, tag input, combobox, select) already draw a 2px outline. The style guide's focus rule was still "Proposed".

## What Changes

- Text input, textarea, number input and multi dropdown draw `outline: <focus-width> solid <focus>` with `<focus-offset>` on keyboard focus (`:focus-visible`), and turn their border the focus colour; no halo. With `error`, outline and border are danger (text input, textarea).
- Settings: textarea gains `--kakao-textarea-focus-offset` (2px). Number input: `--kakao-number-input-focus-color` now defaults to the focus colour (was ink 14%), `--kakao-number-input-focus-ring-width` is removed, `--kakao-number-input-focus-width` and `-focus-offset` (2px) are added. Multi dropdown: `--kakao-multi-dropdown-focus-ring-width` is removed, `--kakao-multi-dropdown-focus` (focus colour), `-focus-width` and `-focus-offset` (2px) are added; the accent stays for the open box and the selected option.
- Style guide: the focus indicator is a Rule; contrast and audit rows updated. The button keeps its halo for now.

## Capabilities

### New Capabilities

- `textarea`: its focus indicator (first requirement of a spec for it).

### Modified Capabilities

- `text-input`, `number-input`: focus indicator.
- `multi-dropdown`: the focused box draws the focus outline.

## Impact

`components/{text-input,textarea,number-input,multi-dropdown}` (component file and construction.html), `styleguide.html`. Pages that set the removed `-focus-ring-width` properties lose that override.
