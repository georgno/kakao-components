# Proposal

## Why

Pages use `<kakao-text-input type="password">` for passwords, which has no way to show the password, no Caps Lock warning and no guidance when a new password is chosen. A sign-up form needs to say what a password must contain and show progress towards it, and the library already has a segmented progress bar made for counting steps.

## What Changes

- New component `<kakao-password-input>` (`components/password-input/`), shadow DOM, form-associated, with the text input's field, label, hint, error and sizes.
- A show / hide button inside the field (inline SVG eye / eye-off, `aria-pressed`), keeping caret and selection.
- A Caps Lock warning while the field has focus, announced politely.
- Opt-in requirements (`requirements`; defaults: length, lowercase, uppercase, number, symbol; own ones through `list-data` or the `requirements` property), listed under the field with met / unmet state and drawn as a `<kakao-progress>` with one segment per requirement.
- `required-strength` makes unmet requirements a validation error (all, or at least N).
- Passthrough of `name`, `required`, `disabled`, `readonly`, `minlength`, `maxlength`, `autocomplete` (default `new-password` with requirements, else `current-password`).

## Capabilities

### New Capabilities
- `password-input`: the field, show / hide, Caps Lock, requirements and their bar, validity and form participation, accessibility, theming hooks.

### Modified Capabilities

None. `<kakao-progress>` is used as it is.

## Impact

- New: `components/password-input/{password-input.js,demo.html,construction.html}`. Pages that use `requirements` also load `components/progress/progress.js`.
- Wiring (later step): `components.html`, `styleguide.html` audit row, `CHANGELOG.md`, possibly `kitchen-sink.html`.
