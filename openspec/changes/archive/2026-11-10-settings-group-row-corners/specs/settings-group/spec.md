## ADDED Requirements

### Requirement: Row corners
A row SHALL round its top corners only when it is the first row of its group and its bottom corners only when it is the last, with `--kakao-settings-group-row-radius`; a group's only row SHALL keep all four. The hover wash and focus outline of neighbouring rows SHALL therefore meet flush.

#### Scenario: Hover on a middle row
- **WHEN** a group holds three link rows and the pointer is over the second
- **THEN** its wash has square corners and meets the hairlines above and below it

#### Scenario: Hover on the first row
- **WHEN** the pointer is over the first of three link rows
- **THEN** its wash has rounded top corners following the box and square bottom corners
