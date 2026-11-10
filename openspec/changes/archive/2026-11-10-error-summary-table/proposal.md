## Why

"There is a problem" said nothing about what the list below it is, the lines ran field and message together in one link, and the list read in the body text colour, so the box looked like any other alert.

## What Changes

- Default heading becomes "There is a problem with the following fields" (`heading` still overrides).
- The errors are laid out as a two-column table, field | issue: the field name is the link, the issue is plain text beside it, rows divided by a hairline, columns shared by every row (subgrid). Under 22rem of box width the issue drops below its field. Semantically it stays a list.
- A line without a field and without a label spans both columns; one with a label but no field shows the label unlinked.
- Title and list take a danger text colour, the alert icon's tone (danger mixed 72% into the text colour), at least 5.3:1 on the tinted box in all seven themes.
- New settings `--kakao-error-summary-color`, `-line`, `-column-gap`, `-field-max`; `-item-gap` becomes the space above and below a row's text (0.375rem). `-link` defaults to the same colour.

## Capabilities

### Modified Capabilities

- `error-summary`: heading default, line layout and colour, theming hooks.

## Impact

`components/error-summary/{error-summary.js,construction.html}`. `heading` default changes visibly; the `item` part now holds `field`, `link` and `issue` parts.
