## ADDED Requirements

### Requirement: Focus indicator
On keyboard focus the wrapped input SHALL show a solid outline of `--kakao-number-input-focus-width` (2px) in `--kakao-number-input-focus-color` (default: the theme's focus colour), `--kakao-number-input-focus-offset` (2px) outside it, around the steppers too, and its border SHALL take the focus colour. No translucent halo SHALL be drawn; `--kakao-number-input-focus-ring-width` SHALL no longer exist.

#### Scenario: Tabbing into the field
- **WHEN** the person tabs into a number input, with arrows or touch steppers
- **THEN** a 2px focus-coloured outline shows 2px outside the field, enclosing the steppers
