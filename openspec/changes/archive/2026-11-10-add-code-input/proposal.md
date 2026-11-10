# Proposal

## Why

Sign-in and checkout flows ask for one-time codes and PINs. A plain text field works but does not show how many characters are expected, and hand-built rows of boxes usually break SMS autofill, paste and screen readers. The library has no component for it.

## What Changes

- New component `<kakao-code-input>` (`components/code-input/`), shadow DOM, form-associated: one drawn box per character (`length` 4 to 8, default 6) with the text input's label, hint, error, border, radius and sizes (36 / 44 / 52px).
- One real `<input>` with transparent text lies over the boxes (`autocomplete="one-time-code"`, `inputmode="numeric"`), so SMS autofill, password managers, paste and screen readers meet a normal field.
- Typing fills and moves on, overwriting a filled box; Backspace clears and goes back; arrows, Home and End move; a pasted whole code (spaces, dashes and dots dropped) replaces the value, a shorter piece fills from the current box.
- `type="alphanumeric"`, a per-character `pattern`, `mask` (dots; password field), `separator` (a dash between groups, "3" or "3-3").
- Events `input`, `change`, `code-complete` ({ value }); `value`, `length`, `complete`, `clear()`; validity: valueMissing, tooShort, customError; `:state(complete)`.
- Settings block (`--kakao-code-input-*`), construction page, demo page.
- Out of this change: wiring into components.html, the style guide audit, kitchen-sink.html and CHANGELOG.md (a separate wiring step).

## Capabilities

### New Capabilities
- `code-input`: the one-time code / PIN field.

### Modified Capabilities

None.

## Impact

- New: `components/code-input/{code-input.js,demo.html,construction.html}`. No dependencies, no new token.
