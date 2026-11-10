## MODIFIED Requirements

### Requirement: Caps Lock warning
While the field has focus and the last key or pointer event in it reports Caps Lock on, a warning "Caps Lock is on" with a warning icon SHALL show under the field, at its end on the same line as the hint or error, and be announced once through a polite live region. It SHALL hide on blur or when Caps Lock is off.

#### Scenario: Warning
- **WHEN** the person types with Caps Lock on
- **THEN** "Caps Lock is on" shows under the field

#### Scenario: Beside a long hint
- **WHEN** the field has a hint longer than the line and Caps Lock is on
- **THEN** the warning sits at the end of the hint's first line without wrapping, the hint wraps in the remaining width, and the requirement list stays below both
