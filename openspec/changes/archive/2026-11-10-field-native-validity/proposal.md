## Why

`kakao-text-input` and `kakao-textarea` only told ElementInternals about `required` and `error`. A `type="email"` field holding "nope", a `pattern`, `minlength` or `min` / `max` failure counted as valid, so form submission went through and `kakao-error-summary` did not list the field.

## What Changes

- Text input: its validity copies the inner input's ValidityState (valueMissing, typeMismatch, patternMismatch, tooLong, tooShort, rangeUnderflow, rangeOverflow, stepMismatch, badInput) with the browser's message, anchored on the inner input. `error` still wins as customError. A value of only spaces still counts as missing for `required`. `min`, `max` and `step` are now passed through (number, date-like types).
- Textarea: the same for valueMissing, tooLong and tooShort; `minlength` is passed through; a value longer than `maxlength` set from script (the counter already shows it red) is tooLong.
- Kept updated on every input, value change and attribute change.

## Capabilities

### Modified Capabilities

- `text-input`, `textarea`: validity.

## Impact

`components/text-input/text-input.js`, `components/textarea/textarea.js` (header comments too). Forms that relied on such fields submitting while natively invalid will now be stopped by the browser (or listed by an error summary).
