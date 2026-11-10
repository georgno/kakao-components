# Design

## Context

`kakao-date-input` wraps a native date / time input in the library's field look and adds the `today` tag. Its research (archived change `add-date-input`) showed that no browser draws the native field in the page's `lang`: Chromium follows its UI language, Firefox its UI language or the OS regional format, Safari the OS region. The same holds for the time field's 12 / 24-hour choice.

## Goals / Non-Goals

**Goals:** a time-only element with the date input's look, behaviour and settings shape; the now shortcut; seconds through `step`.

**Non-Goals:** a custom time list or clock picker; forcing 12 or 24 hours (the browser decides; a page formats with `Intl` itself if it must); time zones; durations over 24 hours.

## Decisions

- **Own element, copied code.** Components never reach into each other and each file stays one inlineable unit, so the field CSS, locale observer, validity mirroring and tag logic are copied from the date input and trimmed to `time` (no `type` attribute, no calendar glyph, no week / month logic).
- **Attribute `now` / `now-label`.** The date input's `today` names a day; for a time "now" is the word users expect, and the label default is the same Intl call the date input uses for its time types (`format(0, 'second')` → "now", "jetzt").
- **Settings parallel to the date input.** Every `--kakao-date-input-*` has a `--kakao-time-input-*` twin with the same default and token fallback; `today-*` became `now-*`. The Firefox nudge stays: Firefox draws a clock button for time fields, measured on the same line as the date input's calendar button.
- **12 / 24 hours.** Left to the browser. The demo shows the resolved `hourCycle` and an `Intl` formatting of the value next to the native field, as the date input's locale demo does.
- **Seconds.** The native field shows a seconds segment when `step` is below 60 or not whole minutes; the now tag keeps seconds in the same cases (or when `min` has seconds).
- **Over midnight.** `min` after `max` is a valid native range (22:00–06:00); the now tag's range check accepts values outside the gap.
- **valueAsNumber / valueAsDate.** Computed from the ISO value (ms since midnight; a Date on 1970-01-01 UTC), so they also work for the text fallback.
- **Fallback.** A browser without a time field (none current) gets a text field with `HH:MM` placeholder and a 24-hour pattern; min / max are checked by the component.

## Risks / Trade-offs

- The Firefox nudge depends on Firefox's internal button padding (one setting, `--kakao-time-input-moz-nudge`).
- Duplicated code with the date input: a fix to one must be copied to the other.
