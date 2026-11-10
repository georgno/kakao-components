## ADDED Requirements

### Requirement: Validity follows the field
The text input's form validity SHALL mirror its inner input: `required`, `type` (email, url, number…), `pattern`, `minlength`, `maxlength`, `min`, `max` and `step` SHALL make it invalid with the matching ValidityState flag and the browser's message, anchored on the inner input. The `error` attribute SHALL take precedence as a custom error. With `required`, a value of only spaces SHALL count as missing. Validity SHALL be updated on input, on value changes and on attribute changes.

#### Scenario: Wrong email
- **WHEN** a text input with `type="email"` holds "nope" and its form is submitted
- **THEN** the field is invalid (typeMismatch) and an error summary on the form lists it

#### Scenario: Pattern
- **WHEN** a text input with `pattern="[0-9]{4}"` holds "12a"
- **THEN** `validity.patternMismatch` is true

#### Scenario: Error wins
- **WHEN** a text input with `type="email"` holding "bad" also has `error="Custom wins"`
- **THEN** its validation message is "Custom wins"
