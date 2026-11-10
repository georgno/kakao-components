# Proposal

## Why

`kakao-date-input` already offers `type="time"`, but a form that only wants a time reads better with its own element, and a time field needs its own shortcut name ("now", not "today") and its own settings. Forms need a time field that sits in a column with `kakao-select`, `kakao-combobox` and `kakao-date-input` without standing out, while keeping the browser's own field and picker, which shows 12 or 24 hours as the user's browser and system are set.

## What Changes

- New component `<kakao-time-input>` (`components/time-input/`), shadow DOM, form-associated: one native `<input type="time">`, the sibling of `kakao-date-input` and built the same way (field look, picker icon where the select's chevron sits, locale propagation, mirrored validity).
- `label`, `hint`, `error`, sizes `sm` / `md` / `lg`, `disabled`, `readonly`, `required`, `min`, `max` (min after max is a range over midnight), `step` in seconds (under a minute, or not whole minutes, the field shows seconds), `name`, `autocomplete`, `locale`.
- `now` attribute: a tag in the hint row that sets the current time rounded to `step` (counted from `min`), as a user edit; label from `now-label`, else "Now" localised through `Intl.RelativeTimeFormat`. Out of range it is disabled with the reason as its title and accessible description, exactly as the date input's `today` tag.
- `valueAsNumber` (ms since midnight) and `valueAsDate`, `showPicker()`.
- Settings `--kakao-time-input-*`, parallel to `--kakao-date-input-*` (`today-*` becomes `now-*`), falling back to the same tokens; construction page and demo.

## Capabilities

### New Capabilities
- `time-input`: the native time field wrapper: field look, picker indicator, 12 / 24 hours, locale, step and seconds, form participation and validity, events, the now shortcut, theming.

### Modified Capabilities
<!-- none -->

## Impact

- New: `components/time-input/{time-input.js,demo.html,construction.html}`.
- Pages (wiring step): `components.html`, `styleguide.html` audit row, `CHANGELOG.md` (Unreleased). `pages.yml` already copies `components/`.
