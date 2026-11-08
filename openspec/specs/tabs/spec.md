# tabs Specification

## Purpose
`<kakao-tabs>` with `<kakao-tab>` children is a light-DOM tab switcher with a sliding thumb that shows and hides the related panels.

## Requirements

### Requirement: Selecting a tab
Selecting a tab SHALL move the thumb to it, mark it `selected`, show the panel whose id is in its `controls` (or `data-controls`) attribute, hide the other panels, and fire a bubbling `tab-change` with `{ controls, item, url }`. Disabled tabs SHALL NOT be selectable.

#### Scenario: Click a tab
- **WHEN** the user clicks an enabled tab
- **THEN** its panel is shown, the others are hidden and `tab-change` fires

#### Scenario: Initial selection
- **WHEN** no tab has `selected`
- **THEN** the first enabled tab is selected

### Requirement: Keyboard
Left and Right arrows SHALL move between enabled tabs.

#### Scenario: Arrow navigation
- **WHEN** a tab is focused and the user presses Right
- **THEN** the next enabled tab is selected

### Requirement: Balanced layout
Tabs SHALL fill the row in equal-width columns, each at least as wide as its label. Selecting a tab SHALL NOT change any tab's width. The tab row SHALL be 44px tall by default. On screens up to 480px, tabs SHALL use a compact padding and no minimum width. When the row still overflows, it SHALL scroll and keep the selected tab fully in view.

#### Scenario: Phone
- **WHEN** four short tabs are shown in a 390px-wide form
- **THEN** they fit in the row with even spacing and no scrolling

### Requirement: Thumb follows layout
The thumb SHALL stay on the selected tab after resizes and while the row is scrolled.

#### Scenario: Resize
- **WHEN** the window is resized after a tab was selected
- **THEN** the thumb still covers exactly the selected tab
