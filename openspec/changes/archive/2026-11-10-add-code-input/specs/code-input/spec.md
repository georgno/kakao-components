# Spec Delta

## Purpose

`<kakao-code-input>` is a one-time code or PIN field: one drawn box per character over a single real field, so SMS autofill, paste and screen readers work.

## ADDED Requirements

### Requirement: Boxes and length
The element SHALL draw one box per character, `length` boxes (4 to 8, default 6, out of range clamped), with the text input's border, radius, background and heights (sm 36px, md 44px, lg 52px), a visible label above and hint or error below. An optional `separator` SHALL draw a short dash between groups of boxes ("3" repeats, "3-3" lists the sizes); the value SHALL NOT contain it.

#### Scenario: Default
- **WHEN** `<kakao-code-input label="Code">` is shown
- **THEN** six empty boxes appear under the label "Code"

#### Scenario: Grouped
- **WHEN** `separator="3"` is set on a six-box code
- **THEN** a dash sits between the third and fourth box

### Requirement: One accessible field
The element SHALL contain exactly one focusable text field that holds the whole value, is named by the label (or `aria-label`), is described by the hint, the error and the expected count ("6 digits"), carries `autocomplete="one-time-code"` by default and `inputmode="numeric"` for digits. The drawn boxes SHALL be hidden from assistive technology.

#### Scenario: SMS autofill
- **WHEN** the browser autofills "123 456" into the field
- **THEN** the value is "123456", all boxes are filled and `code-complete` fires

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the element
- **THEN** it announces one edit field with the label, its value and "6 digits"

### Requirement: Editing
Typing an allowed character SHALL fill the current box (overwriting a filled one) and move to the next. Backspace SHALL clear the current box, or on an empty box move back and clear that one. ←, →, Home and End SHALL move between the filled boxes and the first empty one. Pasting or dropping text SHALL drop spaces, dashes and dots; text as long as the code replaces the value, shorter text fills from the current box. Disallowed characters SHALL be ignored.

#### Scenario: Paste a formatted code
- **WHEN** the user pastes "908-172" into an empty six-box code
- **THEN** the value is "908172"

#### Scenario: Backspace
- **WHEN** the value is "1234" with the caret on the empty fifth box and the user presses Backspace
- **THEN** the value is "123" and the fourth box is current

### Requirement: Character sets and mask
`type="alphanumeric"` SHALL accept letters and digits with a text keyboard; `pattern` SHALL define one character's allowed set, switching a letter's case when only the other case is allowed. `mask` SHALL show a dot in each filled box and make the inner field a password field.

#### Scenario: Hex pattern
- **WHEN** `pattern="[0-9A-F]"` and the user types "a1fz"
- **THEN** the value is "A1F"

### Requirement: Form participation and events
The element SHALL be form-associated: its value is submitted under `name`; required and empty reports valueMissing, a started but incomplete code tooShort, `error` customError with aria-invalid. Form reset SHALL restore the `value` attribute; disabled and readonly SHALL apply. The element SHALL fire `input` on each user change, `change` when a changed value is committed (complete, Enter, blur), and `code-complete` with `{ value }` when every box is filled after a user edit. Setting `value` SHALL fire no events. Enter SHALL submit the surrounding form.

#### Scenario: Incomplete
- **WHEN** a required six-box code holds "123" and the form is submitted
- **THEN** submission is blocked with "Please enter all 6 digits."

### Requirement: Focus, motion and theming
The current box SHALL show the focus border and a 2px outline with 2px offset while the field has focus; an empty current box SHALL show a caret that does not blink under reduced motion. Under forced colours the boxes SHALL use system colours and the inner field's text SHALL stay invisible. Colours and sizes SHALL come from `--kakao-code-input-*` settings that default to theme variables.

#### Scenario: Dark theme
- **WHEN** the page switches to the dark theme
- **THEN** boxes, text, border and focus follow the dark theme
