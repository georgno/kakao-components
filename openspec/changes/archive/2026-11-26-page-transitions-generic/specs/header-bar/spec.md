## ADDED Requirements

### Requirement: Solid during a page transition
The bar SHALL use its solid surface from `page-transition-start` to `page-transition-end` (shared/page-transition.js), as during a theme transition, and get its blur back one frame after the end.

#### Scenario: Scrolled page swaps
- **WHEN** the page is scrolled and a page transition runs
- **THEN** the bar's surface has no backdrop-filter until the transition ends, then the blur returns
