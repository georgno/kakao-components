# rating Specification

## Purpose
`<kakao-rating>` lets people pick a rating as a row of stars (or another symbol), or shows one read-only; it works from the keyboard, is named for screen readers and takes part in forms.

## Requirements

### Requirement: Value, length and steps
The component SHALL show `max` symbols (default 5, at most 20) and fill them up to `value`; no `value`, or 0, means no rating. The `value` property SHALL be a number. With `step="0.5"` half symbols SHALL be selectable; otherwise only whole ones. An operable rating SHALL clamp the value to 0..max and round it to the step.

#### Scenario: Default
- **WHEN** `<kakao-rating value="3">` is shown
- **THEN** five stars are shown, the first three filled, and `value` is the number 3

#### Scenario: Half step
- **WHEN** a rating with `step="0.5"` has `value="3.5"`
- **THEN** three stars are filled and the fourth is filled in its first half

#### Scenario: Out of range
- **WHEN** `value` is set to 99 on a rating with five symbols
- **THEN** `value` is 5

### Requirement: Picking with a pointer
Clicking a symbol (or a half of it, with half steps) SHALL set the value. While a mouse or pen pointer is over a symbol, the symbols SHALL be filled up to that position as a preview, and the committed value SHALL return when the pointer leaves.

#### Scenario: Click
- **WHEN** the user clicks the second star
- **THEN** `value` is 2 and the `value` attribute is "2"

#### Scenario: Preview
- **WHEN** the pointer is over the second star of a rating with value 4
- **THEN** two stars look filled and `value` is still 4

### Requirement: Keyboard
The rating SHALL be one tab stop: the checked option, or the first when there is none. Arrow right and up SHALL raise the value by one step, arrow left and down SHALL lower it, without wrapping around; left and right SHALL swap in right-to-left text. Home SHALL pick the lowest value and End the highest. Focus SHALL be shown with the focus outline on the symbol.

#### Scenario: Arrow keys
- **WHEN** a rating with value 3 has focus and the user presses arrow right
- **THEN** `value` is 4 and focus is on the fourth option

#### Scenario: Home and End
- **WHEN** the user presses End and then Home
- **THEN** `value` is first `max`, then one step

### Requirement: Clearing
With `clearable`, activating the current value again or pressing Delete or Backspace SHALL remove the rating. Without it, neither SHALL change the value. `clear()` SHALL remove the rating without events.

#### Scenario: Click again
- **WHEN** the user clicks the fourth star of a clearable rating with value 4
- **THEN** `value` is 0, no star is filled and the `value` attribute is gone

#### Scenario: Not clearable
- **WHEN** the user clicks the fourth star of a rating with value 4 that is not clearable
- **THEN** `value` stays 4 and no event is sent

### Requirement: Read-only and disabled
With `readonly` the component SHALL only display: no options, no tab stop, an image named with the label and the value text, and any fraction of a symbol drawn as given. With `disabled` (or inside a disabled fieldset) it SHALL be dimmed and not operable.

#### Scenario: Average
- **WHEN** `<kakao-rating readonly value="4.3" aria-label="Average rating">` is shown
- **THEN** four stars and 30% of the fifth are filled, and the image is named "Average rating: 4.3 of 5"

#### Scenario: Disabled
- **WHEN** the user clicks a star of a disabled rating
- **THEN** the value does not change

### Requirement: Names and texts
The group SHALL be named by `label` (shown above the symbols) or else by `aria-label`. Each option SHALL be named by the `value-text` pattern, default "{value} of {max}". `show-value` SHALL show that text beside the symbols. `hint` SHALL be shown under the symbols and `error` SHALL replace it in the danger colour; both SHALL describe the group.

#### Scenario: Option names
- **WHEN** a rating with three symbols is shown
- **THEN** its options are named "1 of 3", "2 of 3" and "3 of 3"

#### Scenario: Own pattern
- **WHEN** a rating has `value="4" show-value value-text="{value} von {max} Sternen"`
- **THEN** "4 von 5 Sternen" is shown beside the symbols

### Requirement: Form participation
The component SHALL be form-associated: with a `name` its value SHALL be submitted, nothing when there is no rating or it is disabled; a read-only rating SHALL still submit. `required` SHALL make it invalid without a rating, and `error` SHALL make it invalid with that message. A form reset SHALL restore the `value` attribute as the page wrote it; setting the `value` property SHALL not change that default.

#### Scenario: Submit
- **WHEN** a form holds `<kakao-rating name="stars" value="4">`
- **THEN** the form data has `stars=4`

#### Scenario: Required
- **WHEN** a required rating has no value
- **THEN** the form is invalid with "Please choose a rating."

#### Scenario: Reset
- **WHEN** a rating written with `value="2.5"` is changed to 5 and the form is reset
- **THEN** `value` is 2.5

### Requirement: Symbols
The built-in symbol SHALL be a star as inline SVG in the current colour: solid when filled, an outline when empty. A `slot="symbol"` child (inline SVG or a text character) SHALL replace it in every position, and a `slot="symbol-empty"` child SHALL be used for empty positions; without one the empty position SHALL show the symbol greyed in the empty colour, at no less than 3:1 against its surface by default.

#### Scenario: Hearts
- **WHEN** a rating has an SVG heart in `slot="symbol"`
- **THEN** every position shows the heart

### Requirement: Events
When the user picks or clears, the component SHALL send `input`, `change` and `rating-change` with `{ value, previous }`. While previewing it SHALL send `rating-preview` with `{ value }`, and with `{ value: null }` when the pointer leaves. All SHALL bubble and be composed. Setting the value from script SHALL send none.

#### Scenario: Pick
- **WHEN** the user changes a rating from 3 to 5
- **THEN** `rating-change` is sent with `{ value: 5, previous: 3 }`

### Requirement: Theming, sizes and motion
Every visual value SHALL be a `--kakao-rating-*` property in the component's one settings block. Filled symbols SHALL default to the theme's warning role and empty ones to the control border role, so the filled symbol has at least 3:1 against the surface in every theme. `size` SHALL be `sm`, `md` (default) or `lg`, with a target of at least 24px for a whole symbol. The hover growth SHALL not run under reduced motion.

#### Scenario: Theme switch
- **WHEN** the page switches to a dark theme
- **THEN** the filled symbols take that theme's warning colour

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion and hovers a symbol
- **THEN** the symbol does not grow
