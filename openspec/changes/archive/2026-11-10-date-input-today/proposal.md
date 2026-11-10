# Proposal

## Why

Picking today's date in a native date field takes several steps (open the picker, find today, confirm). Forms that mostly want "today" or "now" (a log entry, a start date, a check-in time) need a one-click shortcut that still behaves like a user edit.

## What Changes

- New boolean attribute `today` on `<kakao-date-input>`: shows a small clickable tag in the row under the field (after the hint or error).
- Clicking the tag sets the value to the current period for the type: today (date), now (time, datetime-local, rounded to `step`, default the minute), this month (month), this ISO week (week). It fires `input` and `change` once each, like a user edit, and updates validity and the form value.
- The tag label comes from `today-label`, else a localised default via `Intl.RelativeTimeFormat` ("Today", "Now", "This month", "This week"; "Heute" in German, ...).
- When the current period is outside `min`/`max` the tag stays visible but is disabled (`aria-disabled`, with a title giving the reason). It is hidden while the field is disabled or read only.
- New settings for the tag's look (`--kakao-date-input-today-*`), editable on the construction page.

## Capabilities

### New Capabilities

### Modified Capabilities
- `date-input`: adds the today shortcut (new requirements; existing ones unchanged).

## Impact

- `components/date-input/date-input.js` (template, attributes, settings block, header docs), `demo.html`, `construction.html`.
- `kitchen-sink.html`: unchanged; its only date field ("Pause membership until") has no use for a today shortcut.
- No other component is touched; no new dependency.
