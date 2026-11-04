# Spec Delta

## ADDED Requirements

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
