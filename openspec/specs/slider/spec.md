# slider Specification

## Purpose
`<kakao-slider>` is a value slider with tick "friction points", a linked number field and a unit badge.

## Requirements

### Requirement: Value and range
The slider SHALL keep its value within `min`..`max` (default 0..100) in multiples of `step`, show it in a number field with the `unit` badge, and expose `setValue()`, `getValue()` and `setData({ min, max, step, value, unit, label })`.

#### Scenario: Typing out of range
- **WHEN** the user types a value above `max` into the number field
- **THEN** the value is clamped to `max`

### Requirement: Events
Dragging SHALL fire `slider-input` continuously and committed changes SHALL fire `slider-change`, both with `{ value, min, max, step, percent }`; focus and blur SHALL fire `slider-focus` and `slider-blur`.

#### Scenario: Drag and release
- **WHEN** the user drags the thumb and releases it
- **THEN** `slider-input` fires during the drag and `slider-change` on release

### Requirement: Number input integration
When `kakao-number-input` is registered, the slider SHALL wrap its number field in it, unless `scroll-input="false"`.

#### Scenario: Number input not loaded
- **WHEN** `kakao-number-input` is not defined on the page
- **THEN** the slider uses a native number input
