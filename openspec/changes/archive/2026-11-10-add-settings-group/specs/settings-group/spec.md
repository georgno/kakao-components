# Spec Delta

## Purpose

`<kakao-settings-group>` is the settings-screen layout: a titled group of `<kakao-setting>` rows, each with a label and hint on the start side and its control on the end side, divided by hairlines.

## ADDED Requirements

### Requirement: Group structure
The group SHALL show a title from the `title` slot or the `heading` attribute, a description from the `description` slot or attribute, and a note from the `footer` slot below the rows, each taking no space when absent. The rows SHALL be exposed inside an element with the group role named by the title and described by the description. With `heading-level` 1–6 the title SHALL be a heading of that level.

#### Scenario: Named group
- **WHEN** a group has `heading="Notifications"`
- **THEN** a screen reader announces a group named "Notifications" when focus enters its first control

### Requirement: Row layout
A row SHALL show its label (`label` slot or attribute) with an optional hint (`hint` slot or attribute) below it and an optional leading `icon`, and its control (default slot) at the end of the same line. Every row after the first in a group SHALL have a hairline above it.

#### Scenario: Hairlines
- **WHEN** a group holds three rows
- **THEN** two hairlines separate them and none sits above the first

### Requirement: Control naming
A row SHALL give its control its label as the accessible name unless the control already has `label` or `aria-label`: through `label` on switch groups, sliders and step switches, through `aria-label` on the input inside a number input, on native controls and on other library controls. Native controls SHALL also get the hint as `aria-description`. Names the row set SHALL be removed when the label goes away or the control leaves the row. Clicking the label SHALL focus the control.

#### Scenario: Select in a row
- **WHEN** a row with `label="Language"` holds a `<kakao-select>` without a label
- **THEN** the select's trigger is announced as "Language"

#### Scenario: Author name wins
- **WHEN** the control already has `aria-label="Delete my account"`
- **THEN** the row does not change it

### Requirement: Link and action rows
A row with `href` SHALL render as one link to that address with a chevron at the end and an optional trailing `value`; a row with `action` SHALL render as one button and dispatch a bubbling, composed `setting-action` event with `detail.label` when activated. Both SHALL show a focus outline and a hover wash.

#### Scenario: Action row
- **WHEN** the user presses Enter on an action row labelled "Sign out"
- **THEN** one `setting-action` event with `detail.label` "Sign out" reaches the document

### Requirement: Danger and disabled
`variant="danger"` SHALL colour the row's label (and a link or action row's chevron) in the danger colour. `disabled` SHALL dim the row, make a link or action row inert, and set `disabled` on its control.

#### Scenario: Disabled link row
- **WHEN** a link row is disabled
- **THEN** it is not focusable and does not navigate

### Requirement: Narrow layout
Below a row width of 30rem (a container query on the row, not the viewport) the control SHALL drop below the label, wide controls taking the full width, except rows whose control is a switch group or checkbox. `layout="inline"` or `"stack"` SHALL force one layout.

#### Scenario: Phone width
- **WHEN** the page is 390px wide
- **THEN** a row with a select shows the select under its label at full width, and a row with a switch keeps the switch beside its label, with no horizontal scroll

### Requirement: Looks by context
Without `variant`, a group SHALL show as a box (surface, hairline border, 14px radius) and SHALL show plain (no surface, no border, no side padding) inside a `kakao-card`, `kakao-accordion`, `kakao-dialog` or `kakao-aside-sheet`. `variant="box"` or `"plain"` SHALL force a look.

#### Scenario: In a card
- **WHEN** a group sits in a `<kakao-card>`
- **THEN** it has no second border and its row text lines up with the card's content

### Requirement: Theming hooks
Every colour SHALL default to a theme role, and surface, border, radius, spacing, text sizes and the hover wash SHALL be `--kakao-settings-group-*` settings in the component's one settings block, listed on its construction page.

#### Scenario: Dark theme
- **WHEN** the page switches to the dark theme
- **THEN** surface, hairlines, label, hint and danger follow the theme
