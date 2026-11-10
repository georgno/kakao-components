## ADDED Requirements

### Requirement: Field
The tag input SHALL look like the text input: `label` above, `hint` and `error` below (the error replaces the hint, turns the border to the danger colour, sets `aria-invalid` and the validation message), `placeholder` (shown while there are no tags), sizes `sm`, `md` (default) and `lg`. The tags SHALL be `<kakao-chip>` elements inside the field that wrap to more lines; the text field SHALL take the room left on the last line and wrap to a new line below its minimum width. Keyboard focus in the text field SHALL show the 2px focus outline with a 2px offset on the field.

#### Scenario: Wrapping
- **WHEN** the tags do not fit on one line
- **THEN** they continue on the next line and the field grows

### Requirement: Entering tags
Enter or any character of `delimiters` (default ",") SHALL turn the typed text (trimmed, inner whitespace collapsed) into a tag; empty text SHALL add nothing. Pasted text that contains a delimiter, a line break or a tab SHALL be split and every non-empty part added. Leaving the component (focus moving out, Tab) SHALL add the typed text. A tag that is refused (duplicate, limit, cancelled) SHALL stay in the text field.

#### Scenario: Paste
- **WHEN** the user pastes "a, b, c"
- **THEN** three tags a, b and c are added and the text field is empty

### Requirement: Duplicates and limit
Without `allow-duplicates`, a tag equal to an existing one (ignoring case and accents) SHALL be refused, the existing chip SHALL flash in the danger tone and the refusal SHALL be announced. With `max-tags`, tags beyond the limit SHALL be refused and announced.

#### Scenario: Duplicate
- **WHEN** "Design" is a tag and the user enters "design"
- **THEN** no tag is added, the Design chip flashes and "design" stays in the field

### Requirement: Removing and navigating tags
Backspace in an empty text field (caret at the start) SHALL select the last tag (focus on its remove button, the chip drawn in the selected colours); Backspace on a selected tag SHALL remove it and select the one before. ArrowLeft at the start of the text SHALL select the last tag; on a tag ArrowLeft / ArrowRight SHALL move to the previous / next tag, ArrowRight on the last and End or Escape SHALL return to the text field, Home SHALL select the first tag. Delete SHALL remove the selected tag and select the next one (or return to the text field). The chip's × SHALL remove its tag. Tags SHALL not be Tab stops.

#### Scenario: Two-step Backspace
- **WHEN** the text field is empty and the user presses Backspace twice
- **THEN** the first press selects the last tag and the second removes it

### Requirement: Value and form
`value` SHALL accept a comma-separated list or a JSON array; it is the initial value and form reset SHALL return to it. The `value` property SHALL return the tags comma-joined, or as a JSON array when a tag contains a comma; `values` SHALL get and set an array. With `name`, the form SHALL get one entry per tag. `required` SHALL fail validation without tags. `disabled` (or a disabled fieldset) SHALL block editing and submit nothing; `readonly` SHALL show and submit the tags without remove buttons or typing.

#### Scenario: FormData
- **WHEN** a form holds `<kakao-tag-input name="tags" value="a, b">`
- **THEN** `new FormData(form).getAll('tags')` is `["a", "b"]`

### Requirement: Suggestions
With `list-data` (a JSON array of strings) or the `suggestions` property, typing SHALL open a listbox below the field (the combobox's panel) with the suggestions that contain the text (ignoring case and accents) and are not tags yet. ArrowDown / ArrowUp SHALL move the active row, Enter or a click SHALL add it, Escape SHALL close the list. The text field SHALL be a combobox with `aria-expanded`, `aria-controls` and `aria-activedescendant`. Free text SHALL always be allowed.

#### Scenario: Pick a suggestion
- **WHEN** the user types "de", presses ArrowDown and Enter in a list containing "Design"
- **THEN** a tag "Design" is added

### Requirement: Events
Before a tag the user entered is added, `tag-add` SHALL fire (bubbles, composed, cancelable, `{ value }`); cancelling SHALL keep the text in the field. Before a tag is removed by the user, `tag-remove` SHALL fire the same way; cancelling SHALL keep it. After the user added or removed tags, `change` SHALL fire once per action. Changes made through attributes or the API SHALL fire no events.

#### Scenario: Cancel
- **WHEN** a `tag-add` listener calls `preventDefault()`
- **THEN** no tag is added

### Requirement: Accessibility and theming
The tags SHALL be a list named after the label, each chip a listitem whose remove button is named "Remove <tag>". Added, removed and refused tags SHALL be announced in a polite status. Every colour setting SHALL default to a theme role; new tags and the panel fade in with the standard easing, and not at all with reduced motion; forced colours SHALL keep the selected tag and the active suggestion visible.

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** new tags and the panel appear without animation
