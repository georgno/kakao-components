# Spec Delta

## Purpose

`<kakao-password-input>` is a password field with show / hide, a Caps Lock warning and optional requirements drawn as a segmented progress bar.

## ADDED Requirements

### Requirement: Field
The element SHALL render a labelled password field with the text input's look: `label` (or `aria-label`), `hint`, `error` (danger border, message, `aria-invalid`, validation message), `placeholder`, `size` sm / md / lg, and pass `name`, `required`, `disabled`, `readonly`, `minlength`, `maxlength` and `autocomplete` to the field. Without `autocomplete` it SHALL use `new-password` when requirements are shown and `current-password` otherwise. The `value` attribute SHALL be the default value and SHALL NOT be updated while typing.

#### Scenario: Password stays out of the DOM
- **WHEN** the person types a password
- **THEN** the host's `value` attribute is unchanged and the `value` property returns the typed text

### Requirement: Show and hide
Unless `hide-toggle` is set, a button at the end of the field SHALL switch the field between hidden and visible text. It SHALL be named "Show password", carry `aria-pressed` (true while visible) and swap its inline SVG icon (eye / eye with a stroke). Caret and selection SHALL survive the switch; a pointer press SHALL keep focus in the field, a keyboard press SHALL keep it on the button. The `visible` property SHALL get and set the state; form reset SHALL hide the password. It SHALL fire `password-input-toggle` with `{ visible }` when used.

#### Scenario: Caret kept
- **WHEN** the caret is after the second character and the button is clicked
- **THEN** the password shows as text and the caret is still after the second character, in the field

### Requirement: Caps Lock warning
While the field has focus and the last key or pointer event in it reports Caps Lock on, a warning "Caps Lock is on" with a warning icon SHALL show under the field and be announced once through a polite live region. It SHALL hide on blur or when Caps Lock is off.

#### Scenario: Warning
- **WHEN** the person types with Caps Lock on
- **THEN** "Caps Lock is on" shows under the field

### Requirement: Requirements
With `requirements` (or `required-strength`) the element SHALL list its requirements under the field, each with its state in an icon (check / open circle) and in words, and draw a `<kakao-progress>` with as many segments as requirements, `max` equal to the count and `value` equal to the number met, in the success tone once all are met and hidden from assistive technology. The defaults SHALL be: at least 8 characters (or `minlength`), a lowercase letter, an uppercase letter, a number, a symbol. `list-data` (JSON `[{label, pattern, flags}]`) or the `requirements` property (also `{label, test}`) SHALL replace them. An empty value meets none. The list SHALL describe the field (`aria-describedby`); changes SHALL be announced politely once typing pauses, only while focused, naming only what changed. `password-input-requirements` SHALL fire with `{ met, total, requirements }` when the met set changes.

#### Scenario: A segment per requirement
- **WHEN** a field with the defaults gets "abc1"
- **THEN** two requirements are marked met and the bar shows 2 of 5 segments filled

### Requirement: Required strength
With `required-strength` an unmet requirement SHALL make a non-empty value invalid (`patternMismatch`, message naming what is missing): all requirements when the attribute is empty, at least N when it is a number N. Without it requirements SHALL never affect validity. `valid`, `validity`, `validationMessage`, `checkValidity()` and `reportValidity()` SHALL report it.

#### Scenario: Blocked submit
- **WHEN** a form holds a field with `required-strength="4"` and a value meeting 2 requirements
- **THEN** the form does not submit, and it does once the value meets 4

### Requirement: Form participation
The element SHALL be form-associated: submit its value under `name`, report `required` and length validity, follow fieldset disabling, reset to the `value` attribute, never restore a saved password, and submit its form on Enter.

#### Scenario: Reset
- **WHEN** the form is reset
- **THEN** the field holds the `value` attribute's text, hidden

### Requirement: Theming hooks
Every visual value SHALL be a `--kakao-password-input-*` property in the settings block, colours defaulting to theme roles and motion to the motion tokens, editable on `components/password-input/construction.html`; the bar SHALL follow `--kakao-progress-*`.

#### Scenario: Construction page
- **WHEN** the construction page is opened with the construction server running
- **THEN** every `--kakao-password-input-*` property is listed and can be saved
