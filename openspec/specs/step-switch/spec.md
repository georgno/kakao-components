# step-switch Specification

## Purpose
`<kakao-step-switch>` selects one of several ordered steps with a single draggable thumb, as an accessible radio group.

## Requirements

### Requirement: Steps from data
The switch SHALL render the steps from `list-data` (strings, numbers or `{ value, label, disabled }`) as `role="radio"` buttons in a `role="radiogroup"` labelled by `label`, with optional labels under the track (`show-labels`, default on) and dots in the track (`show-ticks`, default on). Disabled steps SHALL still show their dot, dimmed.

#### Scenario: Disabled step
- **WHEN** a step has `"disabled": true`
- **THEN** its dot is visible but dimmed, and it cannot be selected

#### Scenario: Labels hidden
- **WHEN** `show-labels="false"` is set
- **THEN** no labels are shown and no horizontal scrollbar appears

### Requirement: Value
The `value` attribute SHALL reflect the selected step; setting it SHALL move the thumb with an animation, and a value matching no step SHALL select the first enabled step. Changes SHALL fire `step-change` with `{ value, label, index, previousValue, previousIndex, source }`.

#### Scenario: Selecting by API
- **WHEN** `setValue('high')` is called
- **THEN** the thumb animates to "High" and `step-change` fires with `source: "api"`

### Requirement: Dragging
With `thumb-drag` on (the default) the thumb SHALL follow the pointer, snap to the nearest step with an overshoot, and rubber-band past either end. The grab cursor SHALL show only while the pointer is over the thumb.

#### Scenario: Cursor over the track
- **WHEN** the pointer is over the track but not over the thumb
- **THEN** the cursor is not the grab cursor

### Requirement: Keyboard
Arrow keys SHALL select the previous or next enabled step without wrapping, Home and End SHALL select the first and last, and only the selected step SHALL be in the tab order.

#### Scenario: At the last step
- **WHEN** the last step is selected and the user presses Right
- **THEN** nothing changes

### Requirement: Hidden at start
A step switch that is created while hidden (for example in an inactive tab) SHALL lay out its thumb and highlight the active label correctly once it becomes visible.

#### Scenario: Revealed tab
- **WHEN** the tab containing the switch is shown
- **THEN** the thumb is fully visible and the label of the selected step is highlighted
