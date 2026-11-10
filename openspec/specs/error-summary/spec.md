# error-summary Specification

## Purpose

`<kakao-error-summary>` lists a form's errors at the top of the form, each one a link to its field, takes focus so the list is read out, and is drawn as a danger `<kakao-alert>`.

## Requirements

### Requirement: Drawn as a danger alert
The summary SHALL render a `<kakao-alert tone="danger">` with the heading (`heading`, default "There is a problem with the following fields", as an `h2` unless `heading-level` says 3 to 6), the optional `description` slot and the list, so its tint, icon, radius and missing border are the alert's (its text takes the summary's own danger colour).

#### Scenario: Same look as an alert
- **WHEN** a summary and a danger alert with a heading are shown side by side
- **THEN** they have the same tint, icon, radius and title weight

### Requirement: Which form
The summary SHALL watch the form named by `for`, else the form it is inside, else the first form inside it (a wrapped form sits in its default slot below the box).

#### Scenario: Linked from outside
- **WHEN** a summary with `for="signup"` stands before `<form id="signup">` and the form is submitted with errors
- **THEN** the summary lists them

### Requirement: Collecting errors on submit
On submit the summary SHALL cancel the browser's `invalid` events (no bubbles), collect every invalid field of `form.elements` in order and show them; on a `novalidate` form it SHALL run the same check in the submit listener and cancel the submit when there are errors. A field is invalid when it is a kakao field with an `error` attribute or its validity is not valid. Disabled fields and fieldsets SHALL be skipped and a native radio group SHALL be listed once. A valid submit SHALL clear the summary.

#### Scenario: Mixed form
- **WHEN** a form with empty required kakao text input, select, date input and checkbox and native email, number and radio fields is submitted
- **THEN** seven lines are listed in form order and no browser bubble appears

### Requirement: Lines
The errors SHALL be shown as a list laid out in two columns, field | issue, with the columns aligned across rows and a hairline between rows; under 22rem of box width the issue SHALL drop below its field. The field name SHALL be a link to its field and the issue plain text; a visually hidden ": " (a space after a label that ends in punctuation) SHALL join them so each item reads as one line. A line with a label but no field SHALL show the label unlinked; a line with neither SHALL span both columns. The label SHALL be the kakao field's `label` or aria-label, or the native field's aria-labelledby, aria-label, `<label>`, or the legend of the fieldset around a radio group. The message SHALL be the field's `error`, else its `validationMessage`.

#### Scenario: Server error on a kakao field
- **WHEN** a kakao text input labelled "Workspace name" has `error="That name is taken"` and the form is submitted
- **THEN** a row shows the link "Workspace name" and beside it "That name is taken", read as "Workspace name: That name is taken"

#### Scenario: Narrow screen
- **WHEN** the summary is shown at 390px viewport width
- **THEN** each issue sits below its field name and nothing scrolls sideways

### Requirement: Focus and announcement
When shown by submit, `validate()` or `show()` the box SHALL take focus (unless `no-focus` or `{ focus: false }`) and its alert SHALL have `role="alert"`; it SHALL be scrolled below the sticky header bar. A keyboard focus SHALL show the 2px focus ring with a 2px offset.

#### Scenario: Submit with the keyboard
- **WHEN** the submit button is pressed with Enter and there are errors
- **THEN** focus is on the summary, it shows the focus ring and a screen reader reads its title and lines

### Requirement: Links focus the field
Activating a line SHALL call the field's `focus()` (kakao fields forward it into their shadow root) and, unless the field and its label are already in view, scroll so the field, or its label or legend above it, sits below the header bar plus `--kakao-error-summary-scroll-gap`.

#### Scenario: Select link
- **WHEN** the "Plan" line is activated
- **THEN** the select's trigger has focus and the field is below the header bar

### Requirement: Live updates
With `live`, a listed field that becomes valid SHALL drop out of the list on input or change, and the summary SHALL hide when the last one is fixed, without moving focus. New errors SHALL only be added on submit or `validate()`.

#### Scenario: Typing a name
- **WHEN** the person types into the listed "Full name" field
- **THEN** its line goes away and the other lines stay

### Requirement: Manual errors
`show([{ field, message, label }])` SHALL show the given lines instead (field an element, an id or omitted; a line without a field has no link) and `clear()` SHALL empty and hide the summary. `errors` SHALL return the listed `{ field, label, message }`; `validate()` SHALL return true when the form is valid. A form reset SHALL clear it.

#### Scenario: Server reply
- **WHEN** the page calls `show([{ field: 'url', message: 'Taken' }, { message: 'Try later' }])`
- **THEN** two lines are shown, the first a link to the field, the second plain text

### Requirement: Events and theming
The summary SHALL fire `error-summary-show { errors }` and `error-summary-clear` (bubbling, composed, also as triggers) and SHALL expose `--kakao-error-summary-color`, `-link`, `-line`, `-focus`, `-item-gap`, `-list-gap`, `-column-gap`, `-field-max`, `-space` and `-scroll-gap` in its settings block; `--kakao-alert-*` SHALL style the box. The title and list text SHALL default to the danger colour mixed into the text colour, reaching at least 4.5:1 on the danger alert's tint in every theme.

#### Scenario: Theme switch
- **WHEN** the dark theme is selected while the summary is shown
- **THEN** the box, text and links follow the theme and the list text keeps at least 4.5:1 on the box
