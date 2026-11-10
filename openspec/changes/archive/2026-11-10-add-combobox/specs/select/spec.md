## ADDED Requirements

### Requirement: Panel edge and search focus
The panel's edge SHALL be a 1px border in the line colour (`--kakao-select-panel-border`, like the button menu), not a ring drawn into its shadow. Keyboard focus in the search field SHALL show the shared 2px outline in the focus colour with a 2px offset, not a halo.

#### Scenario: Panel edge
- **WHEN** the select opens
- **THEN** the panel has a 1px solid border in the line colour and its shadow has no spread ring

#### Scenario: Search focus
- **WHEN** the search field has focus
- **THEN** its box shows a 2px outline in the focus colour, 2px away from it
