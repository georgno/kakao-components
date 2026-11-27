## ADDED Requirements

### Requirement: Hidden attribute
Every component SHALL be hidden while it has the `hidden` attribute (shadow DOM: `:host([hidden]) { display: none; }`; light DOM: `kakao-x[hidden] { display: none; }` in its CSS), except kakao-tooltip, whose script removes `hidden` once it takes over showing the text.

#### Scenario: A hidden button
- **WHEN** a page has `<kakao-button hidden label="Save">`
- **THEN** it takes no space and is not shown

### Requirement: Form reset
Every form-associated field SHALL implement `formResetCallback()` and return to the value (or checked state) it had when it was first connected.

#### Scenario: Reset after typing
- **WHEN** a user types into a kakao-text-input created with value="a" and the form is reset
- **THEN** its value and its form value are "a" again
