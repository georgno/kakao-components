## ADDED Requirements

### Requirement: Follows a page transition
On `page-transition-swap` (shared/page-transition.js) kakao-tabs SHALL select, through `select()`, the tab whose URL has the new page's path, if any.

#### Scenario: URL tabs in the shell
- **WHEN** tabs with `data-url` tabs stay in the shell and a swap lands on one of their URLs
- **THEN** that tab is selected and `tab-change` fires
