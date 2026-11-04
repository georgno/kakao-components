# list Specification

## Purpose
`<kakao-list>` is a scrollable, optionally grouped list with a perspective tilt at its edges.

## Requirements

### Requirement: Items and groups
The list SHALL render `list-data` (`[{ group, names[] }]`) at `width` × `height` px with rows of `item-height` px, and SHALL show group headings when `groups` is "true" (default). `setData(data, withGroups)` SHALL replace the content.

#### Scenario: Without groups
- **WHEN** `groups="false"` is set
- **THEN** items are shown without headings

### Requirement: Tilt and scrolling
Rows near the top and bottom edges SHALL tilt in perspective up to `max-tilt` degrees, and reaching either end SHALL fire `scroll-end`. `scrollBy(delta)` SHALL scroll by pixels.

#### Scenario: Scroll to the bottom
- **WHEN** the user scrolls to the last item
- **THEN** `scroll-end` fires

### Requirement: Selection
Selecting a row SHALL fire `item-select` `{ name, index }`, and its chevron button SHALL fire `item-action` `{ name, index }`. `disabled` SHALL block interaction.

#### Scenario: Chevron
- **WHEN** the user activates a row's chevron
- **THEN** `item-action` fires
