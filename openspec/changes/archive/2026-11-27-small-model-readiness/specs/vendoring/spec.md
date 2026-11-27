## ADDED Requirements

### Requirement: Tools arrive with the code
Every vendor run SHALL also copy `tools/api.js`, `tools/style-check.js` with `tools/style-check/` and `tools/style-rules/` (without their tests) and `tools/visual-check.js`, so a project runs them from its copy and they find the copy's custom-elements.json.

#### Scenario: Style check in a project
- **WHEN** `node kakao/tools/style-check.js page.html` runs in a project with a vendored copy
- **THEN** it checks the page against the vendored manifest without a library checkout
