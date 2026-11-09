## ADDED Requirements

### Requirement: Gap below the page bar
The shared tokens file SHALL define `--kakao-space-below-bar` (default 8px), the space between the page bar's lower edge and the first line of page content, editable on the main-variables page. The project's pages SHALL use it for that gap instead of a literal value.

#### Scenario: Changing the gap
- **WHEN** `--kakao-space-below-bar` is changed and saved on the main-variables page
- **THEN** demo, construction and list pages start their content that far below the bar
