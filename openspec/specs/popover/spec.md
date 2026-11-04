# popover Specification

## Purpose
`<kakao-popover>` is a popover or tooltip anchored to another element by id, opened by click, hover or script, that stays inside the viewport.

## Requirements

### Requirement: Anchoring and placement
The popover SHALL anchor to the element whose id is in `for`, appear on the `placement` side (bottom by default) at `offset` px (default 8), flip to the opposite side when it would overflow the viewport and shift along the other axis to stay visible. It SHALL find the anchor even if it is added to the DOM later.

#### Scenario: Not enough room below
- **WHEN** a bottom popover would overflow the bottom of the viewport
- **THEN** it opens above the anchor

### Requirement: Triggers
`trigger="click"` (default) SHALL toggle on anchor click and close on outside click or Escape. `trigger="hover"` SHALL open on hover or focus and close after `close-delay` ms (default 150), so the pointer can move into the popover. `trigger="manual"` SHALL only react to `open()`, `close()`, `toggle()` and the `open` attribute. `disabled` SHALL block every trigger.

#### Scenario: Escape
- **WHEN** an open popover receives Escape
- **THEN** it closes and focus returns to the anchor

### Requirement: Content
Content SHALL come from a `slot="content"` child, or else from `list-data` rows `{ label, value }`. Activating a row SHALL fire `kakao-popover-item-select`. Opening and closing SHALL fire `kakao-popover-open` and `kakao-popover-close` with `{ name, trigger }`.

#### Scenario: Both kinds of content
- **WHEN** a popover has slotted content and `list-data`
- **THEN** the slotted content is shown and `list-data` is ignored

### Requirement: Accessibility wiring
The surface SHALL be `role="dialog"` for click and `role="tooltip"` for hover, and the anchor SHALL receive `aria-expanded` and `aria-haspopup` or `aria-describedby` automatically.

#### Scenario: Hover tooltip
- **WHEN** a hover popover is attached to a button
- **THEN** the button has `aria-describedby` pointing to the popover
