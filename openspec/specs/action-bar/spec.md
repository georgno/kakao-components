# action-bar Specification

## Purpose

`<kakao-action-bar>` is a floating bar for actions on selected items: a summary and a row of actions, sticky in its container or fixed to the viewport, shown while a count is above 0, with polite announcements of count changes.

## Requirements

### Requirement: Content
`<kakao-action-bar>` SHALL show its default slot as the summary and its `actions` slot as a row of actions after it, wrapping when there is no room. The bar SHALL be a region named by `label` (default "Selection actions").

#### Scenario: Summary and actions
- **WHEN** a page writes `<kakao-action-bar>3 marked to fix <kakao-button slot="actions" label="Copy"></kakao-button></kakao-action-bar>`
- **THEN** "3 marked to fix" is shown with the Copy button after it, and a screen reader finds a region "Selection actions"

### Requirement: Placement
By default the bar SHALL be sticky inside its container at the `position` edge (bottom, or top below the header bar); with `fixed` it SHALL be fixed to the viewport, centred, keeping the safe-area insets and resetting its own margin. Below 30rem the bar SHALL span the full width; a fixed bar SHALL then sit flush with the edge with the safe-area inset as padding. While a fixed bar is shown, `--kakao-action-bar-rendered-height` SHALL hold its height on the root element.

#### Scenario: Fixed on a phone
- **WHEN** a fixed bottom bar is shown on a 390px-wide viewport
- **THEN** it spans the viewport width at its bottom edge and its padding includes the bottom safe-area inset

### Requirement: Count and hidden
With a `count` attribute, the bar SHALL be shown when the count is above 0 and hidden otherwise; without one it SHALL be shown. Showing and hiding through `count` (and showing after `hidden` is removed) SHALL slide the bar from its edge, or fade it under reduced motion. `hidden` SHALL hide the bar at once. A hidden bar SHALL take no space and receive no pointer events.

#### Scenario: Count to zero
- **WHEN** a script sets `count` from 3 to 0
- **THEN** the bar slides out and is then not rendered

#### Scenario: Hidden attribute
- **WHEN** a page sets `hidden` on a shown bar
- **THEN** the bar is not rendered

### Requirement: Announcements
A change of `count` to a value above 0 SHALL be announced through a polite live region, after the page had a moment to update the summary: `count-label` with `{count}` replaced, else the summary's text, else "{count} selected". The count at load SHALL NOT be announced.

#### Scenario: Selection grows
- **WHEN** the count changes from 2 to 3 and the summary reads "3 marked to fix"
- **THEN** a screen reader announces "3 marked to fix" politely
