# number-input Specification

## Purpose
`<kakao-number-input>` wraps a child `<input type="number">` with custom stepper arrows and replaces the native spin buttons.

## Requirements

### Requirement: Wrapping a native input
The component SHALL keep the child input's `min`, `max`, `step`, `value`, `disabled` and classes, hide the native spin buttons, style the input to match the other components, and offer `size="sm"`.

#### Scenario: Form submission
- **WHEN** the surrounding form is submitted
- **THEN** the inner input's value is submitted as with a plain number input

### Requirement: Steppers and wheel
The arrows SHALL step the value within `min` and `max`, the mouse wheel over the arrow strip SHALL step it too, and every change SHALL fire the native `input` and `change` events on the inner input.

#### Scenario: Step up at max
- **WHEN** the value equals `max` and the user clicks the up arrow
- **THEN** the value stays at `max`

### Requirement: Touch stepper layout
On touch screens, or whenever `touch-steppers` is present, the steppers SHALL be 44px − and + buttons instead of the stacked arrows. `plus` and `minus` SHALL accept `left`, `right` or a false value (to hide that button); `grouped` (on unless it says `false`) SHALL join the two visible buttons into one cluster, and `group-position` SHALL choose the side of that cluster. Defaults SHALL reproduce the joined pair on the right. A fine pointer SHALL keep the stacked arrows, honouring only the hiding options.

#### Scenario: Pair on the left
- **WHEN** the element has `touch-steppers group-position="left"`
- **THEN** the joined − / + pair sits at the left end of the input, which keeps matching padding

#### Scenario: Split buttons
- **WHEN** the element has `touch-steppers grouped="false" plus="left"`
- **THEN** + is a separate button on the left and − a separate button on the right

#### Scenario: One stepper
- **WHEN** the element has `touch-steppers minus="false"`
- **THEN** only the + button is shown, on the right
