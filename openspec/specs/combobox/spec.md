# combobox Specification

## Purpose
`<kakao-combobox>` is a form field where the user picks a suggestion from a filtered list or keeps their own typed text as the value.

## Requirements

### Requirement: Option sources
The combobox SHALL read its suggestions from child `<option>` and `<optgroup>` elements, from the `list-data` JSON attribute, or from the `options` property (the property wins over the attribute, the attribute over children), in the same shapes as `kakao-select`: a string or `{ value, label?, disabled? }`, groups as `{ label, options }` or `<optgroup label>`. Changes to the children SHALL be picked up.

#### Scenario: Children
- **WHEN** a `<kakao-combobox>` contains `<option value="b">Berlin</option>` and an `<optgroup label="Austria">`
- **THEN** typing shows Berlin and a group headed "Austria" with its matching options

### Requirement: Field
The field SHALL be a text input with the text input's look: `label` above, `hint` and `error` below (the error replaces the hint, turns the border to the danger colour and sets `aria-invalid`), `placeholder`, sizes `sm`, `md` (default) and `lg`, `disabled`, and a chevron button that opens and closes the list. Keyboard focus on the field SHALL show a 2px outline in the focus colour with a 2px offset.

#### Scenario: Focus
- **WHEN** the user tabs into the combobox
- **THEN** the field shows the 2px focus outline

### Requirement: Filtering
Typing SHALL open the list and filter the suggestions live, ignoring case and diacritics and matching anywhere in the label; groups without matches SHALL be hidden. When nothing matches and no "Use" row is shown, the list SHALL show "No matches" (`empty-text`). Opening with the chevron or ArrowDown SHALL show all suggestions. With `autocomplete="none"` the list SHALL not be filtered.

#### Scenario: Diacritics
- **WHEN** the user types "zur" in a list containing "Zürich"
- **THEN** Zürich is shown

### Requirement: Free text
While the text is not empty and matches no option label exactly (ignoring case and diacritics), the list SHALL show a first row "Use “<text>”" (label set with `create-label`, where `{text}` is replaced). Picking it SHALL keep the text as the value. `no-create` SHALL hide the row but still allow free text. `strict` SHALL disallow free text: the row is hidden and on commit an unmatched text is reverted to the last value.

#### Scenario: Use row
- **WHEN** the user types "Bremen" in a list without Bremen
- **THEN** the first row reads "Use “Bremen”" and picking it sets the value to "Bremen"

#### Scenario: Exact match
- **WHEN** the user types "berlin" and Berlin is an option
- **THEN** no "Use" row is shown

### Requirement: Inline autocomplete
With `autocomplete="both"`, when the typed text is the start of the first matching label, the rest of that label SHALL be inserted after the caret and selected, so typing on replaces it and Backspace removes it.

#### Scenario: Completion
- **WHEN** the user types "ham" in a list with Hamburg and `autocomplete="both"`
- **THEN** the field reads "Hamburg" with "burg" selected

### Requirement: Keyboard
In the field (per the ARIA APG editable combobox): ArrowDown SHALL open the list and move the active row down, ArrowUp move it up, Alt+ArrowDown open without moving, Alt+ArrowUp close; Enter SHALL pick the active row, or commit the typed text when no row is active, and close; Escape SHALL close an open list, and on a closed list clear the text; Tab SHALL commit the typed text (or a matching option) and move on; Home / End stay with the caret. Rows SHALL be exposed with `aria-activedescendant`, focus stays in the field.

#### Scenario: Escape
- **WHEN** the list is open and the user presses Escape twice
- **THEN** the first press closes the list and the second clears the field

#### Scenario: Tab keeps free text
- **WHEN** the user types "Bremen" and presses Tab
- **THEN** the value is "Bremen" and focus moves to the next control

### Requirement: Value semantics
Picking an option SHALL set the value to the option's value and the field text to its label. Committing text that equals an option label (ignoring case and diacritics) SHALL pick that option. Other text SHALL set the value to the text. Clearing the text SHALL clear the value. Setting `value` from script SHALL show the matching option's label, or the value itself.

#### Scenario: Pick
- **WHEN** the user picks "Austria" whose value is "at"
- **THEN** `value` is "at" and the field reads "Austria"

### Requirement: Form participation
The combobox SHALL be form-associated: with `name` it SHALL submit its value. `required` SHALL fail validation while the value is empty; `pattern`, `minlength` and `maxlength` SHALL constrain free text (maxlength also limits typing); the `error` attribute SHALL be the validation message. Form reset SHALL restore the initial value; a disabled form or fieldset SHALL disable it; browser state restore SHALL be honoured.

#### Scenario: Submit free text
- **WHEN** a form with `<kakao-combobox name="city">` holding the free text "Bremen" is submitted
- **THEN** its FormData has `city=Bremen`

### Requirement: Events
A value change made by the user SHALL fire `input` and `change` (bubbling, composed) and `combobox-change` with `{ value, label, option, previous }`; a value that matches no option SHALL also fire `combobox-create` with `{ value }`. Typing SHALL fire `input` only from the inner field's own native event (composed). Opening and closing SHALL fire `combobox-open` and `combobox-close`. Setting the value from script SHALL not fire them.

#### Scenario: New value
- **WHEN** the user commits "Bremen", which is not an option
- **THEN** `change`, `combobox-change` and `combobox-create` fire with value "Bremen"

### Requirement: Panel
The list SHALL use the select's panel: the overlay shadow (elevation level 3) whose 1px ring is its edge, radius 10 with 6px rows inside 4px padding, in the top layer, opening below the field (above when there is no room), lined up with the right edge or shifted in, its height limited to the room on screen, following the field while the page scrolls. It SHALL fade in on the standard easing over the fast duration, with no motion under `prefers-reduced-motion`.

#### Scenario: Near the bottom edge
- **WHEN** a combobox near the bottom of the viewport opens
- **THEN** the list opens above the field and is fully visible

### Requirement: Accessibility
The field SHALL be an `input` with `role="combobox"`, `aria-autocomplete` (list / both / none), `aria-expanded` and `aria-controls` the listbox, named by the label and described by hint and error. Options SHALL use `aria-selected`; disabled options `aria-disabled` and SHALL be skipped; groups SHALL be labelled `role="group"` elements. A polite status SHALL report the number of matches.

#### Scenario: Role
- **WHEN** a screen reader reaches the field
- **THEN** it announces a combobox named by the label

### Requirement: Theming
Every colour SHALL default to a theme role; settings live in the `--kakao-combobox-*` settings block and are edited on the construction page.

#### Scenario: Dark theme
- **WHEN** the dark theme is active
- **THEN** field, panel and rows use the dark theme roles
