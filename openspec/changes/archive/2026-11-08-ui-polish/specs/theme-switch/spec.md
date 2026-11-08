# Spec Delta

## ADDED Requirements

### Requirement: Flicker-free switching
Colour transitions caused by a theme change SHALL be finished at once, also inside shadow roots, so the revealed theme never fades from the old colours. The new view SHALL start fully clipped and SHALL stay revealed until the transition ends.

#### Scenario: Single switch
- **WHEN** the theme changes with the ripple
- **THEN** no colour transition runs inside the revealed theme

### Requirement: Rapid switching
While a ripple runs, further requests SHALL be queued, not interrupt it. After the running ripple, one more ripple SHALL go to the latest requested theme, unless that theme is already shown. Switches SHALL show the requested theme at once. Only the latest request SHALL fire `theme-change`.

#### Scenario: Spamming the switch
- **WHEN** the user clicks the switch four times within half a second
- **THEN** one ripple completes, a second ripple goes to the final theme, and nothing jumps or crossfades in between
