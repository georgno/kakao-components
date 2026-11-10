## Decisions

- **Copy, don't re-implement.** The inner native control already knows every constraint; `_syncForm()` reads `validity` flag by flag and calls `internals.setValidity(flags, control.validationMessage, control)`. Messages are the browser's own, localised.
- **Order:** `error` (customError) first; then the native flags; then the existing "only spaces" required rule (native `required` accepts spaces); else valid.
- **minlength** follows native rules: it only applies once the person has edited the value, so a short initial value is not flagged.
- **Textarea over maxlength:** native `tooLong` never fires for a value set from script, but the counter already marks it red, so the component flags it itself with a message like Chromium's.
- No new attributes beyond `min` / `max` / `step` (text input) and `minlength` (textarea), which are plain pass-throughs.
