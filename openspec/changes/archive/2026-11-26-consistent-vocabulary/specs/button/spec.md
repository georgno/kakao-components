# Spec Delta

## MODIFIED Requirements

### Requirement: Native form and data attributes
The button SHALL pass `type` (button, submit or reset), `name`, `value`, `form` and `disabled` to the inner button and SHALL mirror `data-*` attributes from the host onto it, so form submission and framework hooks such as Yii's `data-confirm` and `data-method` keep working.

#### Scenario: Submit button
- **WHEN** a `<kakao-button type="submit" form="f">` is clicked
- **THEN** form `f` is submitted

#### Scenario: Reset button
- **WHEN** a `<kakao-button type="reset">` inside a form is clicked
- **THEN** the form is reset

#### Scenario: Data attributes
- **WHEN** the host has `data-method="post"`
- **THEN** the inner button carries `data-method="post"`
