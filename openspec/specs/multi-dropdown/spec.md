# multi-dropdown Specification

## Purpose
`<kakao-multi-dropdown>` joins several separate dropdowns into one input group that holds a single value, such as a date dd.mm.yyyy where parts may be "unknown" (00.00.1990 means sometime in 1990).

## Requirements

### Requirement: Input group of separate dropdowns
Each segment SHALL be its own dropdown box with a value and a chevron. The boxes SHALL sit edge to edge as an input group with shared borders and only the outer corners rounded, and the focused or open box SHALL be drawn above its neighbours. An open box SHALL have an accent border; a keyboard-focused box SHALL have a border in `--kakao-multi-dropdown-focus` (the theme's focus colour) and a solid outline of `--kakao-multi-dropdown-focus-width` (2px) in that colour, `--kakao-multi-dropdown-focus-offset` (2px) outside it, with no translucent halo. Each box SHALL be as wide as its widest label (while it is empty, its placeholder counts too), and SHALL shrink and cut its text off with an ellipsis when space is tight. The separator SHALL NOT be drawn between the boxes.

#### Scenario: Stable width
- **WHEN** the month changes from "May" to "September"
- **THEN** the boxes keep their size

#### Scenario: Keyboard focus
- **WHEN** the person tabs to the month box
- **THEN** that box shows a 2px focus-coloured outline 2px outside it, drawn over its neighbours

### Requirement: Placeholders
An empty box SHALL show its placeholder: the segment's `placeholder`, else the element's `placeholder` attribute, else "Please select". When any empty box of the group has no room for its placeholder, all empty boxes SHALL show their short placeholder instead: the segment's `shortPlaceholder`, else its label; the date preset uses DD, MM and YYYY. The short placeholders SHALL NOT take up the space of the long ones.

#### Scenario: Enough room
- **WHEN** an empty date group sits in a 600px column
- **THEN** the boxes show Please select | Please select | Please select

#### Scenario: Cramped
- **WHEN** the same group sits in a 360px column
- **THEN** the boxes show DD | MM | YYYY

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
`allow-unknown` SHALL add an "Unknown" option to every segment, or to a comma list of segment names. For dates the unknown value SHALL be zeros ("00", "0000"); for custom segments "?" unless the segment sets its own. The list SHALL offer the choice as "Unknown" (first, without the stored code beside it); the closed box SHALL show an en dash "–" (a segment can set its own with `unknown.display`) while the value stores the code. The box's accessible name SHALL still say "Unknown".

#### Scenario: Partly known date
- **WHEN** `value="00.00.1990"` is set with `allow-unknown="day,month"`
- **THEN** the boxes show – | – | 1990 and `value` stays "00.00.1990"

### Requirement: Custom segments
Without `type`, segments SHALL come from `list-data` (`{ name, label?, placeholder?, shortPlaceholder?, options, unknown?, separator? }`) or `setData()`, joined with `separator` (default a space).

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
