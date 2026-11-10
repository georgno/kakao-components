# select Specification

## Purpose
`<kakao-select>` is a form field that picks one or several values from a searchable list.

## Requirements

### Requirement: Option sources
The select SHALL read its options from child `<option>` and `<optgroup>` elements, from the `list-data` JSON attribute, or from the `options` property (the property wins over the attribute, the attribute over children). An entry SHALL be a string or `{ value, label?, disabled? }`; a group SHALL be `{ label, options }` or an `<optgroup label>`. Child options marked `selected` SHALL set the initial value when no `value` attribute is given. Changes to the children SHALL be picked up.

#### Scenario: Progressive enhancement
- **WHEN** a `<kakao-select>` contains `<option value="at">Austria</option>` and an `<optgroup label="More">`
- **THEN** the panel lists Austria and a group headed "More" with its options

### Requirement: Field look
The trigger SHALL look like the other input fields: a visible `label` above it, `hint` and `error` text below (the error replaces the hint, turns the border to the danger colour and sets `aria-invalid`), a `placeholder` while nothing is selected (default "Please select"), sizes `sm`, `md` (default) and `lg`, and `disabled`.

#### Scenario: Error
- **WHEN** the select has `error="Pick a country"`
- **THEN** the border is in the danger colour and the message is shown and tied to the trigger with `aria-describedby`

### Requirement: Panel placement
The panel SHALL open below the trigger, at least as wide as it, and SHALL stay on screen: it opens above when there is not enough room below and more room above, lines up with the trigger's right edge when it would run off the right, is shifted in when neither fits, and its height is limited to the room available. It SHALL not be clipped by ancestors with hidden overflow and SHALL follow the trigger while the page scrolls.

#### Scenario: Near the bottom edge
- **WHEN** a select near the bottom of the viewport opens
- **THEN** the panel opens above the trigger and is fully visible

### Requirement: Search
The first line of the open panel SHALL be a search field that receives focus on open and filters the options live as the user types, ignoring case and diacritics and matching anywhere in the label. Groups without matches SHALL be hidden. When nothing matches, the panel SHALL show "No matches" (`empty-text`). The search SHALL be empty each time the panel opens.

#### Scenario: Diacritics
- **WHEN** the user types "zur" in a list containing "Zürich"
- **THEN** Zürich is shown

### Requirement: Keyboard
On the closed trigger, Enter, Space, ArrowDown, ArrowUp and Alt+ArrowDown SHALL open the panel, and a printable key SHALL open it with that key in the search. In the open panel, ArrowDown / ArrowUp / PageDown / PageUp SHALL move the active option through the visible, enabled options (exposed with `aria-activedescendant`), Enter SHALL pick it, Escape SHALL close the panel and return focus to the trigger, and Tab SHALL close the panel and move focus on from the trigger.

#### Scenario: Keyboard only
- **WHEN** the user focuses the trigger, presses Enter, types "aus", presses ArrowDown and Enter
- **THEN** the first matching option after the active one is selected, the panel closes and focus is on the trigger

### Requirement: Single selection
Without `multiple`, picking an option SHALL select it, close the panel and return focus to the trigger. The selected option SHALL show a check mark. Delete or Backspace on the closed trigger SHALL clear the selection.

#### Scenario: Pick with the mouse
- **WHEN** the user clicks an option
- **THEN** it becomes the value and the panel closes

### Requirement: Multiple selection
With `multiple`, each option row SHALL show a checkbox in the `kakao-checkbox` look, picking SHALL toggle it, and the panel SHALL stay open. The trigger SHALL show the first selected label and "+N" for the rest.

#### Scenario: Toggle stays open
- **WHEN** the user picks two options in a multiple select
- **THEN** both are selected, the panel is still open and the trigger reads "<first> +1"

### Requirement: Select all
A multiple select SHALL show a "Select all" row below the search with a tri-state checkbox: checked when every visible enabled option is selected, mixed when some are, unchecked when none are. Picking it SHALL select every visible enabled option, or unselect them all when all are selected. While a filter is active it SHALL act only on the visible matches and read "Select all N matches". Selected options hidden by the filter SHALL stay selected.

#### Scenario: Filtered select all
- **WHEN** the user types "an" and picks "Select all N matches"
- **THEN** only the matching options are added to the selection

#### Scenario: Indeterminate
- **WHEN** some but not all visible options are selected
- **THEN** the select-all row has `aria-checked="mixed"` and shows a dash

### Requirement: Form participation
The select SHALL be form-associated: with `name`, a single select SHALL submit its value and a multiple select one entry per selected value. `required` SHALL fail validation while nothing is selected. Form reset SHALL restore the initial selection; a disabled form or fieldset SHALL disable it; browser state restore SHALL be honoured. `value` SHALL get and set the selection (multiple: comma-separated, or a JSON array), `values` SHALL get and set an array.

#### Scenario: Submit multiple
- **WHEN** a form with `<kakao-select multiple name="tags">` holding "a" and "b" is submitted
- **THEN** its FormData has two `tags` entries, "a" and "b"

#### Scenario: Reset
- **WHEN** the user changes the selection and the form is reset
- **THEN** the initial selection is back

### Requirement: Events
A user change of the selection SHALL fire `input` and `change` (bubbling, composed) and `select-change` with `{ value, values, previous }`. Opening and closing SHALL fire `select-open` and `select-close`. Setting the value from script SHALL not fire them.

#### Scenario: Change event
- **WHEN** the user picks an option
- **THEN** `change` fires on the element

### Requirement: Accessibility
The trigger SHALL be a button with `aria-haspopup="listbox"` and `aria-expanded`, named by the label and the current selection. The search SHALL be a combobox controlling a `listbox` (with `aria-multiselectable` for multiple); options SHALL use `aria-selected`, disabled options `aria-disabled` and SHALL be skipped; groups SHALL be labelled `role="group"` elements. Focus SHALL show the shared focus outline.

#### Scenario: Screen reader names
- **WHEN** a select labelled "Country" holds Austria
- **THEN** the trigger's accessible name contains "Country" and "Austria"

### Requirement: Motion and theming
The panel SHALL fade in with a small move on the standard easing token over the fast duration, and no motion under `prefers-reduced-motion`. Every colour SHALL default to a theme role; settings live in the `--kakao-select-*` settings block and are edited on the construction page.

#### Scenario: Reduced motion
- **WHEN** reduced motion is preferred and the panel opens
- **THEN** it appears at once
