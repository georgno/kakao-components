## MODIFIED Requirements

### Requirement: Drawn as a danger alert
The summary SHALL render a `<kakao-alert tone="danger">` with the heading (`heading`, default "There is a problem with the following fields", as an `h2` unless `heading-level` says 3 to 6), the optional `description` slot and the list, so its tint, icon, radius and missing border are the alert's (its text takes the summary's own danger colour).

#### Scenario: Same look as an alert
- **WHEN** a summary and a danger alert with a heading are shown side by side
- **THEN** they have the same tint, icon, radius and title weight

### Requirement: Lines
The errors SHALL be shown as a list laid out in two columns, field | issue, with the columns aligned across rows and a hairline between rows; under 22rem of box width the issue SHALL drop below its field. The field name SHALL be a link to its field and the issue plain text; a visually hidden ": " (a space after a label that ends in punctuation) SHALL join them so each item reads as one line. A line with a label but no field SHALL show the label unlinked; a line with neither SHALL span both columns. The label SHALL be the kakao field's `label` or aria-label, or the native field's aria-labelledby, aria-label, `<label>`, or the legend of the fieldset around a radio group. The message SHALL be the field's `error`, else its `validationMessage`.

#### Scenario: Server error on a kakao field
- **WHEN** a kakao text input labelled "Workspace name" has `error="That name is taken"` and the form is submitted
- **THEN** a row shows the link "Workspace name" and beside it "That name is taken", read as "Workspace name: That name is taken"

#### Scenario: Narrow screen
- **WHEN** the summary is shown at 390px viewport width
- **THEN** each issue sits below its field name and nothing scrolls sideways

### Requirement: Events and theming
The summary SHALL fire `error-summary-show { errors }` and `error-summary-clear` (bubbling, composed, also as triggers) and SHALL expose `--kakao-error-summary-color`, `-link`, `-line`, `-focus`, `-item-gap`, `-list-gap`, `-column-gap`, `-field-max`, `-space` and `-scroll-gap` in its settings block; `--kakao-alert-*` SHALL style the box. The title and list text SHALL default to the danger colour mixed into the text colour, reaching at least 4.5:1 on the danger alert's tint in every theme.

#### Scenario: Theme switch
- **WHEN** the dark theme is selected while the summary is shown
- **THEN** the box, text and links follow the theme and the list text keeps at least 4.5:1 on the box
