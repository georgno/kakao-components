## ADDED Requirements

### Requirement: Validity follows the field
The textarea's form validity SHALL mirror its inner textarea: `required`, `minlength` and `maxlength` SHALL make it invalid with the matching ValidityState flag and the browser's message, anchored on the inner textarea. A value longer than `maxlength` set from script SHALL be tooLong too. The `error` attribute SHALL take precedence as a custom error, and with `required` a value of only spaces SHALL count as missing.

#### Scenario: Too short
- **WHEN** the person types 5 characters into a textarea with `minlength="10"` and submits
- **THEN** the field is invalid (tooShort) and an error summary lists it
