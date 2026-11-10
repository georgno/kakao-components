## MODIFIED Requirements

### Requirement: Input group of separate dropdowns
Each segment SHALL be its own dropdown box with a value and a chevron. The boxes SHALL sit edge to edge as an input group with shared borders and only the outer corners rounded, and the focused or open box SHALL be drawn above its neighbours. An open box SHALL have an accent border; a keyboard-focused box SHALL have a border in `--kakao-multi-dropdown-focus` (the theme's focus colour) and a solid outline of `--kakao-multi-dropdown-focus-width` (2px) in that colour, `--kakao-multi-dropdown-focus-offset` (2px) outside it, with no translucent halo. Each box SHALL be as wide as its widest label (while it is empty, its placeholder counts too), and SHALL shrink and cut its text off with an ellipsis when space is tight. The separator SHALL NOT be drawn between the boxes.

#### Scenario: Stable width
- **WHEN** the month changes from "May" to "September"
- **THEN** the boxes keep their size

#### Scenario: Keyboard focus
- **WHEN** the person tabs to the month box
- **THEN** that box shows a 2px focus-coloured outline 2px outside it, drawn over its neighbours
