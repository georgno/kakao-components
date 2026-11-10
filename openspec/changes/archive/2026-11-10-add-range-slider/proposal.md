# Proposal

## Why

The library has a single-value slider but no way to pick a span (a price from–to, an age range, a time window). Pages fake it with two sliders or two number fields, which neither look like one control nor keep the two ends apart.

## What Changes

- New component `<kakao-range-slider>` (`components/range-slider/`), shadow DOM, form-associated. A new component, so `kakao-slider` stays as it is.
- Looks and moves like `kakao-slider`: the same track, fill, thumbs, friction-point ticks, min / max labels and number fields with a unit badge; the fill runs between the two thumbs, and ticks between them are the darker "passed" ticks.
- Settings `--kakao-range-slider-*`, each defaulting to the matching `--kakao-slider-*` setting, so both sliders stay in step unless a page sets one apart.
- `value="20,80"` (comma-separated, like `kakao-select multiple`), `min`, `max`, `step`, `min-gap`, `unit`, `label`, `disabled`, `name`, `scroll-input`.
- Two `role="slider"` thumbs with their own accessible names and moving `aria-valuemin` / `aria-valuemax` (each one's limit is the other thumb, less the gap); arrows, Page Up / Down and Home / End. The thumbs never cross and keep `min-gap` apart. A press on the track moves the nearer thumb.
- Form: two FormData entries under the one `name` (`price=20&price=80`), reset to the `value` attribute, state restore, form-disabled.
- Events: `range-slider-input` while dragging or typing, `range-slider-change` on release / commit, both `{ low, high, value, min, max, step }`; plain `input` / `change` as well; `range-slider-focus` / `range-slider-blur`.
- Touch steppers (`| < | value | > |` per field) on touch screens or with `touch-steppers`, as on the slider; the fields stack when the row is too narrow.
- Construction page, demo page.

## Capabilities

### New Capabilities
- `range-slider`: the two-thumb slider: values and gap, look, pointer and keyboard use, number fields, form participation, events, accessibility, motion and theming.

### Modified Capabilities

None.

## Impact

- New: `components/range-slider/{range-slider.js,demo.html,construction.html}`.
- Wiring (separate step): `components.html`, `styleguide.html` audit row, `CHANGELOG.md`, optionally `kitchen-sink.html`.
