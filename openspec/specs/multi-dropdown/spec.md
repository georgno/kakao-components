# multi-dropdown Specification

## Purpose
`<kakao-multi-dropdown>` joins several separate dropdowns into one input group that holds a single value, such as a date dd.mm.yyyy where parts may be "unknown" (00.00.1990 means sometime in 1990).

## Requirements

### Requirement: Input group of separate dropdowns
Each segment SHALL be its own dropdown box with a value and a chevron. The boxes SHALL sit edge to edge as an input group with shared borders and only the outer corners rounded, and the focused or open box SHALL be drawn above its neighbours with an accent border. Each box SHALL be as wide as its widest label, and SHALL shrink and cut its text off with an ellipsis when space is tight. The separator SHALL NOT be drawn between the boxes.

#### Scenario: Stable width
- **WHEN** the month changes from "May" to "September"
- **THEN** the boxes keep their size

#### Scenario: Narrow container
- **WHEN** the group is placed in a 260px column
- **THEN** the boxes shrink and show "…" instead of overflowing

### Requirement: Date preset
With `type="date"` the group SHALL offer Day, Month and Year boxes joined with "." into `dd.mm.yyyy`, years from `min-year` (default 1900) to `max-year` (default the current year), and month names in the box. Days that do not exist in the chosen month and year SHALL be disabled. A day that no longer fits SHALL move to the month's last day and return to the wanted day once it fits again.

#### Scenario: February in a leap year
- **WHEN** the user picks 31, then February, then 2024
- **THEN** the day becomes 29

#### Scenario: Back to a long month
- **WHEN** the day was clamped from 31 to 29 and the user then picks March
- **THEN** the day returns to 31

### Requirement: Unknown parts
`allow-unknown` SHALL add an "Unknown" option to every segment, or to a comma list of segment names. For dates the unknown value SHALL be zeros ("00", "0000"); for custom segments "?" unless the segment sets its own. The box SHALL show the word "Unknown" while the value stores the code.

#### Scenario: Partly known date
- **WHEN** `value="00.00.1990"` is set with `allow-unknown="day,month"`
- **THEN** the boxes show Unknown | Unknown | 1990 and `value` stays "00.00.1990"

### Requirement: Custom segments
Without `type`, segments SHALL come from `list-data` (`{ name, label?, placeholder?, options, unknown?, separator? }`) or `setData()`, joined with `separator` (default a space).

#### Scenario: Product variant
- **WHEN** segments "size" and "color" are set with `separator=" / "` and the user picks M and black
- **THEN** `value` is "M / black"

### Requirement: Value and events
`value` SHALL be the joined value once every segment has one, and "" while incomplete. `getParts()`, `setPart(name, value)` and `clear()` SHALL read and change individual parts. Changes SHALL fire `dropdown-change` `{ value, parts, complete, unknown }`, also when a day is clamped. Opening and closing a list SHALL fire `dropdown-open` and `dropdown-close` `{ segment }`.

#### Scenario: Incomplete value
- **WHEN** only day and month are chosen
- **THEN** `value` is "" and `dropdown-change` reports `complete: false`

### Requirement: Keyboard
On a closed box, Up and Down SHALL step the value, Enter, Space or Alt+Down SHALL open the list, Left and Right SHALL move between boxes, typing SHALL jump to a match (a complete entry moves to the next box), and Delete SHALL clear the box. In an open list, Up, Down, Home, End, PageUp and PageDown SHALL move, Enter or Space SHALL pick, and Escape or Tab SHALL close. The list SHALL use `role="listbox"` with `aria-activedescendant`.

#### Scenario: Typing a date
- **WHEN** the user focuses the day box and types "15"
- **THEN** day 15 is chosen and focus moves to the month box

### Requirement: Form participation
The element SHALL be form-associated: with `name` the joined value SHALL be submitted, `required` SHALL fail validation while a part is missing, `form.reset()` SHALL restore the initial value, and `disabled` SHALL block all interaction.

#### Scenario: Required and incomplete
- **WHEN** a form with a required, incomplete multi dropdown is submitted
- **THEN** submission is blocked
