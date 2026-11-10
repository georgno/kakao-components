# textarea Specification

## Purpose
`<kakao-textarea>` is a multi-line, form-associated text field; this capability covers its focus indicator and its validity.

## Requirements

### Requirement: Focus indicator
On keyboard focus the field box SHALL show a solid outline of `--kakao-textarea-focus-width` (2px) in `--kakao-textarea-focus` (the theme's focus colour), `--kakao-textarea-focus-offset` (2px) outside it, and its border SHALL take the focus colour. No translucent halo SHALL be drawn. With `error`, border and outline SHALL be the danger colour.

#### Scenario: Tabbing into the textarea
- **WHEN** the person tabs into a textarea
- **THEN** a 2px focus-coloured outline shows 2px outside the field box

### Requirement: Validity follows the field
The textarea's form validity SHALL mirror its inner textarea: `required`, `minlength` and `maxlength` SHALL make it invalid with the matching ValidityState flag and the browser's message, anchored on the inner textarea. A value longer than `maxlength` set from script SHALL be tooLong too. The `error` attribute SHALL take precedence as a custom error, and with `required` a value of only spaces SHALL count as missing.

#### Scenario: Too short
- **WHEN** the person types 5 characters into a textarea with `minlength="10"` and submits
- **THEN** the field is invalid (tooShort) and an error summary lists it
