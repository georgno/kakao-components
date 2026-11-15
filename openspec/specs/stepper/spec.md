# stepper Specification

## Purpose
`<kakao-stepper>` shows where someone is in a multi-step flow: an ordered list of steps that are done, current or upcoming. It shows progress and holds no form value; picking one of several values is the step switch's job.

## Requirements

### Requirement: Steps from list-data
The component SHALL take its steps from the `list-data` attribute, a JSON array whose entries are a string (the label) or an object with `label` and optional `description`, `value` and `state`, and from the `steps` property with the same shapes. It SHALL render again when either changes. Invalid JSON SHALL give an empty stepper and a console warning.

#### Scenario: Strings
- **WHEN** a stepper has `list-data='["Account", "Plan", "Payment"]'`
- **THEN** three numbered steps with those labels are shown

#### Scenario: Description
- **WHEN** a step is `{"label": "Account", "description": "Name and email"}`
- **THEN** the description is shown under the label

#### Scenario: From script
- **WHEN** a script sets `el.steps = ['Cart', 'Pay']`
- **THEN** the stepper shows those two steps

### Requirement: Current step
The `current` attribute SHALL name the current step by its 0-based index or by the `value` of a step that has one, a value being matched first. Without it the first step SHALL be current. Steps before the current one SHALL be done and steps after it upcoming. An index equal to the number of steps SHALL mean the flow is finished: every step done and none current. Indexes outside the range SHALL be clamped. The attribute SHALL reflect the state after the component changes it.

#### Scenario: Index
- **WHEN** a stepper with four steps has `current="1"`
- **THEN** the first step is done, the second current and the last two upcoming

#### Scenario: Value
- **WHEN** a stepper has `current="payment"` and its third step has the value "payment"
- **THEN** the third step is current

#### Scenario: Finished
- **WHEN** a stepper with three steps has `current="3"`
- **THEN** all three steps are done and no step is current

### Requirement: Step states
A step with `state` "error" SHALL be shown as failed in the danger colour with an exclamation mark, at any position including the current one. A step with `state` "done" SHALL be shown as done even when it comes after the current step. A done step SHALL show a check mark in place of its number; current and upcoming steps SHALL show their number. The marks SHALL be inline SVG in currentColor.

#### Scenario: Error behind the current step
- **WHEN** the second of four steps has `state` "error" and `current` is 2
- **THEN** the second step shows the exclamation mark in the danger colour and the third step is current

#### Scenario: Done ahead of time
- **WHEN** the third step has `state` "done" and `current` is 1
- **THEN** the third step shows a check mark and the second step is current

### Requirement: Semantics
The steps SHALL be an ordered list with an accessible name from the `label` attribute, "Progress" by default. The current step SHALL carry `aria-current="step"`. Done and error steps SHALL carry a visually hidden word, "Done" or "Error", after the label, and the markers SHALL be hidden from assistive technology. The words SHALL be changeable for every stepper through `KakaoStepper.texts`.

#### Scenario: Current step announced
- **WHEN** a stepper with `current="1"` is rendered
- **THEN** exactly one list item has `aria-current="step"`, the second

#### Scenario: Other words
- **WHEN** a script sets `KakaoStepper.texts = { done: 'Erledigt' }`
- **THEN** done steps of every stepper carry the hidden word "Erledigt"

### Requirement: Orientation
The stepper SHALL lay its steps out in a row with the labels under the markers by default, and in a column with the labels beside the markers when `orientation="vertical"`. In both a line SHALL join each marker to the next, in the primary colour up to the current step.

#### Scenario: Vertical
- **WHEN** a stepper has `orientation="vertical"`
- **THEN** the steps are stacked, each label beside its marker, with lines between the markers

### Requirement: Compact form
The compact form SHALL show one line with the step count, the current step's label and its description, over a bar with one segment per step in which done, current and error steps are filled. The ordered list SHALL stay available to assistive technology and the summary line SHALL be hidden from it.

#### Scenario: Phone width
- **WHEN** a four-step horizontal stepper is 310px wide
- **THEN** it shows "Step 2 of 4", the current label and a four-segment bar

#### Scenario: Finished and compact
- **WHEN** a compact stepper with three steps has `current="3"`
- **THEN** the line reads "All 3 steps done"

### Requirement: Collapsing
With `collapse` "auto" (the default) a horizontal stepper SHALL switch to the compact form when its own width gives each step less than `--kakao-stepper-min-step-width`, and back when there is room again. With `collapse="always"` it SHALL always be compact, with `collapse="never"` never. A vertical stepper SHALL never be compact. The `compact` property SHALL tell whether the compact form is showing.

#### Scenario: Room for the row
- **WHEN** a four-step horizontal stepper is 700px wide
- **THEN** it shows the row of markers and labels and `compact` is false

#### Scenario: Never
- **WHEN** a stepper has `collapse="never"` in a narrow box
- **THEN** it keeps the row

### Requirement: Clickable steps
Without `clickable` the stepper SHALL contain no focusable element. With `clickable` (or `clickable="done"`) the steps before the current one SHALL be buttons; with `clickable="all"` every step but the current one. The arrow keys, Home and End SHALL move focus between the buttons.

#### Scenario: Not clickable by default
- **WHEN** a stepper has no `clickable` attribute
- **THEN** it has no button and takes no focus

#### Scenario: Arrow keys
- **WHEN** focus is on the first step's button and the right arrow key is pressed
- **THEN** focus moves to the next button

### Requirement: Selecting a step
Activating a step's button by click, Enter or Space SHALL fire a cancelable, bubbling, composed `step-select` event with `{ index, value, label, previousIndex }`; unless it is cancelled the stepper SHALL make that step current. Focus SHALL not be lost when a picked step stops being a button.

#### Scenario: Back to a done step
- **WHEN** a `clickable` stepper is on its third step and the first step is activated
- **THEN** `step-select` fires with index 0 and the first step becomes current

#### Scenario: Cancelled
- **WHEN** a page calls `preventDefault()` on `step-select`
- **THEN** the current step does not change

### Requirement: Methods
`next()` SHALL move one step forward, finishing the flow from the last step; `previous()` one step back, not below the first; `goTo(indexOrValue)` to a step by index or value. Each SHALL return whether the current step changed. The `current` property SHALL read the index and set it like `goTo`; `value` SHALL read the current step's value or null.

#### Scenario: At the start
- **WHEN** `previous()` is called on a stepper at step 0
- **THEN** it returns false

#### Scenario: Unknown target
- **WHEN** `goTo('nope')` is called and no step has that value
- **THEN** it returns false and the current step stays

### Requirement: Change event
Whenever a method, the property or a picked step changes the current step, the stepper SHALL fire a bubbling, composed `stepper-change` event with `{ index, value, label, previousIndex, source }`, `source` being "api" or "select". Changing the `current` attribute SHALL not fire it.

#### Scenario: Next
- **WHEN** `next()` is called on a stepper at step 0
- **THEN** it returns true, step 1 is current and `stepper-change` fires with source "api"

#### Scenario: Attribute
- **WHEN** a script sets the `current` attribute to another step
- **THEN** the stepper shows it and no `stepper-change` fires

### Requirement: Theming hooks
Every visual value SHALL be a `--kakao-stepper-*` custom property with its default in the component's one settings block, and every colour SHALL default to a theme role: primary for done and current, the control border and muted text for upcoming, danger for errors, the focus role for the focus outline. The component SHALL have no transitions or animations that reduced motion would need to stop, and SHALL stay legible in forced colours.

#### Scenario: Theme change
- **WHEN** the page theme changes from light to dark
- **THEN** done and current steps take the dark theme's primary colour

#### Scenario: Override
- **WHEN** a page sets `--kakao-stepper-marker-size: 2.5rem` on a stepper
- **THEN** its markers are 2.5rem wide and high
