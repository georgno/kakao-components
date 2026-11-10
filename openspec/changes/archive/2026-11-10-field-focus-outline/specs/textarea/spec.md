## ADDED Requirements

### Requirement: Focus indicator
On keyboard focus the field box SHALL show a solid outline of `--kakao-textarea-focus-width` (2px) in `--kakao-textarea-focus` (the theme's focus colour), `--kakao-textarea-focus-offset` (2px) outside it, and its border SHALL take the focus colour. No translucent halo SHALL be drawn. With `error`, border and outline SHALL be the danger colour.

#### Scenario: Tabbing into the textarea
- **WHEN** the person tabs into a textarea
- **THEN** a 2px focus-coloured outline shows 2px outside the field box
