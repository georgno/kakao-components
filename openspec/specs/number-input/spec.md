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
