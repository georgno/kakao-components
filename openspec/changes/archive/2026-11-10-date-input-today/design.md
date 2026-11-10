# Design

## Context

The date input is a shadow DOM wrapper around one native input with hint and error paragraphs below it. The textarea already puts a second item (its counter) in the row under the field: a flex row, messages left, counter right. The chip is the library's small tag (neutral fill, 4px radius, 0.75rem / 600).

## Goals / Non-Goals

**Goals:** one-click "today/now" that behaves exactly like a user edit; respects min/max; localised label without new dependencies.

**Non-Goals:** relative presets (yesterday, +1 week), a "clear" tag, using `<kakao-chip>` itself (components never reach into each other, and the file must stay one inlineable unit).

## Decisions

- **Attribute name `today`.** It names what the user asked for and reads well in markup (`<kakao-date-input today>`); the label adapts per type ("Now", "This week"), the attribute does not. Alternatives `today-button` / `now` were longer or wrong for dates. `today-label` overrides the text.
- **Placement.** A `.below` row as in the textarea: hint or error on the left (flex 1), the tag at the end. When there is no hint, the tag still sits at the end of the row.
- **Look.** The chip's neutral tag, drawn by the date input itself (same values as defaults, own `--kakao-date-input-today-*` settings): subtle-strong fill, 4px radius, 0.75rem / 600 text, a 1.25rem height so the row stays close to one hint line; a 24px hit area (WCAG 2.5.8) via a pseudo-element as in the chip's remove button. Hover adds an 8% text wash; focus is the shared 2px outline with 2px offset.
- **Label.** `Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, unit)` with unit day / second / month / week gives "today", "now", "this month", "this week" (and "heute", "jetzt", "diesen Monat" ...); first letter upper-cased with the locale. Fallback English strings when Intl is missing.
- **Accessible name.** English locales: "Set to today" (contains the visible word). Other locales or a custom label: the visible label, as there is no cheap localised verb.
- **Value.** Built from the local clock. Times snap to `step` counted from `min` (as the native field's step base). Range check by comparing ISO strings of the same type; a time range with `min > max` (overnight) counts as in range outside the gap, as the native field does.
- **Events.** Set the inner input's value, mark dirty, sync the form value and validity, then dispatch `input` and `change` once each from the host. Focus stays on the tag (it is the control the user used).
- **Freshness.** The enabled state is recomputed on sync and when the tag gets focus or pointer; the value itself on activation, so a page left open over midnight sets the right day.

## Risks / Trade-offs

- A `date` step that today does not fall on gives a step mismatch, as typing it would; not snapped (dates are not rounded).
- The accessible name stays in the visible language only for non-English pages (no "Set to").
