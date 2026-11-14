## ADDED Requirements

### Requirement: Data tables on small screens
A data table component (table, grid view) SHALL by default, on a phone-width screen, show each row as a block of label/value pairs with the column heading as the label, hiding no column. Scrolling sideways inside the frame, with the edge fade, SHALL be an opt-in for tables that need their columns side by side. Sorting, filters and the action column SHALL stay usable in the wrapped form.

#### Scenario: Phone width
- **WHEN** a data table is shown on a phone-width screen without the opt-in
- **THEN** each row is a block of heading/value pairs and every column's value is visible

#### Scenario: Opt-in scrolling
- **WHEN** the table opts in to sideways scrolling and is too wide
- **THEN** it scrolls inside its frame with the edge fade on each side that has more to scroll
