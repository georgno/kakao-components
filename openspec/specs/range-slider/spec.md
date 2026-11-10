# range-slider Specification

## Purpose
`<kakao-range-slider>` picks a span between `min` and `max` with two thumbs on one track. It looks and moves like `<kakao-slider>`.

## Requirements

### Requirement: Values and gap
The range slider SHALL hold two values, low and high, within `min`..`max` (default 0..100) in multiples of `step`, given as `value="low,high"` (default: `min,max`). Low SHALL never exceed high, and the two SHALL stay at least `min-gap` apart (default 0, capped at the whole range). It SHALL expose `value` ("low,high"), `low`, `high`, `setValue(low, high)`, `getValue()` → `{ low, high }` and `setData({ min, max, step, low, high, minGap, unit, label })`. Setting values from script SHALL NOT fire events.

#### Scenario: Gap kept
- **WHEN** `min-gap="10"`, the value is `20,40` and the user drags the high thumb to 25
- **THEN** high stops at 30

### Requirement: Look
The range slider SHALL draw like `kakao-slider`: label and number fields with the unit badge in a header row, the track with friction-point ticks, the min / max labels below. The fill SHALL run from the low to the high thumb; ticks between them SHALL use the "passed" colour and the ticks at both values the accent. Every `--kakao-range-slider-*` setting SHALL default to the matching `--kakao-slider-*` setting.

#### Scenario: Shared accent
- **WHEN** a page sets `--kakao-slider-accent` and not `--kakao-range-slider-accent`
- **THEN** the range slider's fill uses that colour

### Requirement: Pointer use
A press on the track SHALL move the nearer thumb there and drag it until release; when both thumbs sit on the same spot, the first movement direction SHALL choose the thumb. The thumb that moved last SHALL be drawn on top.

#### Scenario: Track press
- **WHEN** the value is `20,80` and the user presses at 70
- **THEN** the high thumb moves to 70 and the low thumb stays at 20

### Requirement: Keyboard and accessibility
Each thumb SHALL be a focusable `role="slider"` with `aria-valuenow`, `aria-valuetext` (value and unit), `aria-valuemin` and `aria-valuemax` set to the limits it can actually reach, and an accessible name "<label>, minimum" / "<label>, maximum" (or `label-low` / `label-high`). Arrows SHALL step by `step`, Page Up / Down by ten steps, Home / End SHALL go to the thumb's limits. Focus SHALL show the shared 2px outline with 2px offset.

#### Scenario: Home on the high thumb
- **WHEN** the value is `20,80`, `min-gap` is 5 and the high thumb has focus
- **THEN** Home moves it to 25

### Requirement: Number fields
Each value SHALL have a number field. Typing SHALL move the thumb live while the typed value is within reach and SHALL be clamped on commit (blur or Enter). When `kakao-number-input` is registered, the fields SHALL use it, unless `scroll-input="false"`.

#### Scenario: Typing past the other thumb
- **WHEN** the value is `20,80` and the user enters 90 in the low field and presses Enter
- **THEN** low becomes 80 (or 80 less `min-gap`)

### Requirement: Touch steppers
On touch screens (`pointer: coarse`) or with `touch-steppers`, each field SHALL get a decrease button before and an increase button after it, as on `kakao-slider`: at least 44px, repeating while held, disabled at the thumb's limit, named "Decrease/Increase <thumb name>". The fields SHALL then take their own row and stack when it is too narrow for both.

#### Scenario: Holding increase on the low field
- **WHEN** a touch user holds the low field's > button
- **THEN** low steps up until released or until it reaches high less `min-gap`

### Requirement: Form participation
The element SHALL be form-associated: with a `name` it SHALL submit two entries under that name (low, then high); form reset SHALL return to the `value` attribute; a disabled fieldset SHALL disable it; state restore SHALL be supported.

#### Scenario: Submit
- **WHEN** a form contains `<kakao-range-slider name="price" value="20,80">`
- **THEN** its FormData has `price` = `20` and `price` = `80`

### Requirement: Events
Dragging and typing SHALL fire `range-slider-input` and `input`; releasing, committing a typed value and each key press SHALL fire `range-slider-change` and `change`. The custom events SHALL carry `{ low, high, value, min, max, step }`. A thumb gaining or losing focus SHALL fire `range-slider-focus` / `range-slider-blur` with `{ thumb, low, high }`.

#### Scenario: Drag and release
- **WHEN** the user drags a thumb and releases it
- **THEN** `range-slider-input` fires during the drag and `range-slider-change` once on release

### Requirement: Motion, forced colours, disabled
Thumb and fill SHALL glide with the slider's transition except while dragged, and not at all under `prefers-reduced-motion`. In forced colours the fill and current ticks SHALL use Highlight and the track and thumbs SHALL keep a visible outline. `disabled` SHALL dim the control, take the thumbs out of the tab order and block input.

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion and presses End on a thumb
- **THEN** the thumb jumps without a glide
