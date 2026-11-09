## ADDED Requirements

### Requirement: Scroll edge fade width
The shared tokens file SHALL define `--kakao-scroll-fade` (default 1.5rem), the width of the edge fade on components that scroll sideways, editable on the main-variables page. Every component with such a fade SHALL default its fade width to it.

#### Scenario: Changing the fade width
- **WHEN** `--kakao-scroll-fade` is changed on the main-variables page
- **THEN** the edge fades of the header bar's links, tabs, step switch and switch group all take the new width
