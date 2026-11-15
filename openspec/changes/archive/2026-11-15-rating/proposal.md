# Proposal

## Why

Reviews, feedback forms and product lists need a star rating, and the components page still lists Rating as missing. The slider can pick 1 to 5 but does not look like a rating and cannot show an average; hand-made star rows are usually not operable from the keyboard and say nothing to a screen reader.

## What Changes

- New component `<kakao-rating>` (`components/rating/`), shadow DOM, built on native radio buttons.
  - `max` symbols (default 5), `value` (0 = none), half steps with `step="0.5"`.
  - Hover previews a value; click picks it. One tab stop; arrow keys, Home and End change the value.
  - `clearable`: picking the current value again, or Delete / Backspace, removes the rating; `clear()` does it from script.
  - `readonly`: display only, one image named "4 of 5", any fraction drawn exactly; `disabled`.
  - `label`, `hint`, `error`, `size` (sm, md, lg), `show-value` and a `value-text` pattern ("{value} of {max}").
  - Form-associated: `name`, `required`, form reset and state restore.
  - The star is an inline SVG in currentColor; `slot="symbol"` (and `slot="symbol-empty"`) replace it.
  - Events `input`, `change`, `rating-change` and `rating-preview`, bubbling and composed.
- Settings block (`--kakao-rating-*`), construction page, demo page; a card on `components.html` (alphabetical, between Range slider and Select) replacing the "Rating" placeholder; style guide audit row; changelog entry.

## Capabilities

### New Capabilities
- `rating`: value, steps and length, picking with pointer and keyboard, clearing, read-only and disabled forms, accessible names, form participation, symbols, events, theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/rating/{rating.js,demo.html,construction.html}`. No dependency on other components.
- Pages: `components.html` (new card, script tag, placeholder removed), `styleguide.html` (audit row). Not on `kitchen-sink.html`: the settings form there has nothing to rate.
