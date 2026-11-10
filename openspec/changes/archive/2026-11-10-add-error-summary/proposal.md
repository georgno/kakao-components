# Proposal

## Why

Forms built from kakao fields have no good way to report several errors at once. On submit the browser shows one bubble on the first bad field; a person using a screen reader or a long form learns about the other errors one at a time. The GOV.UK error summary solves this: a box at the top of the form lists every error, takes focus so it is read out, and each line links to its field.

## What Changes

- New component `<kakao-error-summary>` (`components/error-summary/`), shadow DOM, drawn as a danger `<kakao-alert>` (no border, the alert's tint and icon), like the toast reuses the alert.
- Watches a form (`for="id"`, the form it is in, or a form inside it). On submit it cancels the browser's `invalid` bubbles, collects every invalid field, native ones through their validity and kakao fields through ElementInternals validity or their `error` attribute, and lists "Label: message" links. Forms with `novalidate` get the same check on submit.
- The box takes focus (`tabindex="-1"`, inner alert `role="alert"`); a link focuses its field through `focus()` and scrolls it, with its label, below the sticky header bar.
- `live`: fixed fields drop out of the list as the person types. `show([{ field, message }])` and `clear()` for errors the page knows itself (server replies); `validate()` checks on demand. `heading` (default "There is a problem"), `heading-level`, `no-focus`, `description` slot.
- Events `error-summary-show` and `error-summary-clear`, also as triggers.
- `kakao-text-input`, `kakao-textarea`, `kakao-checkbox` and `kakao-radio-group` gain the read-only form API the select and date input already have (`validity`, `validationMessage`, `checkValidity()`, `reportValidity()`, `form`), so their own messages can be read.

## Capabilities

### New Capabilities
- `error-summary`: form wiring, collecting errors, labels and messages, focus and announcement, links, live updates, manual errors, events and theming hooks.

### Modified Capabilities

None in behaviour; four field components expose getters over their existing ElementInternals state.

## Impact

- New: `components/error-summary/{error-summary.js,demo.html,construction.html}`; needs `alert.js`.
- Changed: `components/{text-input,textarea,checkbox,radio-group}/*.js` (getters only).
- Pages (wiring step): `components.html`, `styleguide.html` audit row, `CHANGELOG.md`, optionally `kitchen-sink.html`.
