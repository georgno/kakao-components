## ADDED Requirements

### Requirement: Built on the stack
`<kakao-toast>` SHALL extend `KakaoStack` (stack.js, loaded before toast.js) for the stacked cards, expanding, maximum, leaving motion, placement and aside behaviour, with its own `--kakao-toast-*` settings replacing the stack's. It SHALL fade cards behind the front one by the alert's tint and fire `toast-show` / `toast-hidden` instead of the stack's events.

#### Scenario: Without stack.js
- **WHEN** toast.js is loaded without stack.js
- **THEN** the console says to load stack.js first and no region is defined
