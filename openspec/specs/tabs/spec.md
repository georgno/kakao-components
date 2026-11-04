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
