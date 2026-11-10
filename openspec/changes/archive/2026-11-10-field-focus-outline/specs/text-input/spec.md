## ADDED Requirements

### Requirement: Focus indicator
On keyboard focus (`:focus-visible` on the inner input) the field box SHALL show a solid outline of `--kakao-text-input-focus-width` (2px) in `--kakao-text-input-focus` (the theme's focus colour), `--kakao-text-input-focus-offset` (2px) outside it, and its border SHALL take the focus colour. No translucent halo SHALL be drawn. With `error`, border and outline SHALL be the danger colour.

#### Scenario: Tabbing into the field
- **WHEN** the person tabs into a text input
- **THEN** a 2px focus-coloured outline shows 2px outside the field box

#### Scenario: Field in error
- **WHEN** a text input with `error` receives keyboard focus
- **THEN** the outline and border are in the danger colour
