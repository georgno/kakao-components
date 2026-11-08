# Spec Delta

## ADDED Requirements

### Requirement: Optional chevron
A dropdown button SHALL show a chevron unless it has `no-chevron`. An icon-only dropdown SHALL stay a circle with `no-chevron` and SHALL become a pill that shows the chevron without it.

#### Scenario: Actions menu
- **WHEN** an icon-only ghost button with a ⋯ icon has `list-data` and `no-chevron`
- **THEN** it is a round icon button that opens its menu

### Requirement: Settling shadow in segments
In a `.kakao-button-segment`, a pressed item SHALL have no shadow at rest. When an item becomes pressed, its shadow SHALL fade in and out once. With reduced motion there SHALL be no shadow.

#### Scenario: Pressing a segment item
- **WHEN** the user presses another item of a segmented toggle
- **THEN** that item's shadow appears briefly and is gone once it has settled
