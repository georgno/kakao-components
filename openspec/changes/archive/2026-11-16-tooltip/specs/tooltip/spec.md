# Spec Delta

## Purpose

`<kakao-tooltip>` shows a short, themed text label next to a control, so the name of an icon-only control (or a short hint) is visible to mouse, keyboard and touch users alike.

## ADDED Requirements

### Requirement: Opt-in by attribute
With the tooltip script loaded, any element with a non-empty `data-tooltip` attribute SHALL get a tooltip showing that text. `data-tooltip=""` SHALL turn the tooltip off for that element (also for an element inside another anchor). The text SHALL be shown as plain text, never parsed as markup.

#### Scenario: Any element
- **WHEN** a link has `data-tooltip="Opens in a new tab"` and the pointer rests on it
- **THEN** a label reading "Opens in a new tab" appears next to it

#### Scenario: Markup in the text
- **WHEN** `data-tooltip="<b>x</b>"`
- **THEN** the label shows the characters `<b>x</b>`

### Requirement: Dedicated element
A `<kakao-tooltip for="id">Text</kakao-tooltip>` SHALL be the tooltip of the element with that id (looked up in its own document or shadow root, also when the anchor is added later), with its text content as the label. It SHALL win over a `data-tooltip` on the same anchor.

#### Scenario: for
- **WHEN** `<kakao-tooltip for="save">Save draft</kakao-tooltip>` exists and the element `#save` gets keyboard focus
- **THEN** the label "Save draft" appears next to `#save`

### Requirement: Placement
The label SHALL appear on the side given by `placement` (on the element) or `data-tooltip-placement` (on the anchor): `top` (default), `bottom`, `left` or `right`, with a small gap. When it does not fit on that side, it SHALL flip to the opposite side, and it SHALL be shifted along the other axis to stay at least 8px inside the viewport. It SHALL be drawn above other content, also above an open modal dialog.

#### Scenario: Flip at the top edge
- **WHEN** an anchor sits at the very top of the viewport with the default placement
- **THEN** the label appears below it

### Requirement: Hover
For a mouse or pen pointer, the label SHALL appear after a short delay (about 400ms) while the pointer rests on the anchor, and at once when another tooltip was visible a moment before. It SHALL stay while the pointer is over the anchor or over the label itself, and hide shortly after the pointer has left both. Pressing the anchor SHALL hide it until the pointer leaves the anchor.

#### Scenario: Hoverable
- **WHEN** the pointer moves from the anchor onto the label
- **THEN** the label stays visible

#### Scenario: Leave
- **WHEN** the pointer leaves the anchor for the page
- **THEN** the label disappears

### Requirement: Keyboard focus
The label SHALL appear when the anchor receives focus that is shown as keyboard focus (`:focus-visible`) and SHALL hide when focus leaves the anchor. A focus that came from a mouse click SHALL NOT show it.

#### Scenario: Tab
- **WHEN** the user tabs onto an icon-only button with a tooltip
- **THEN** its label appears without waiting, and disappears when the user tabs on

### Requirement: Dismiss with Escape
While a label is visible, Escape SHALL hide it without moving focus or the pointer, and that keypress SHALL NOT reach other handlers (so a surrounding dialog stays open). The label SHALL NOT come back for that anchor until focus or the pointer leaves it.

#### Scenario: Escape in a dialog
- **WHEN** a label is shown for a button in an open dialog and the user presses Escape
- **THEN** the label hides and the dialog stays open; a second Escape closes the dialog

### Requirement: Touch long-press
For a touch pointer, holding a finger on the anchor for about 500ms without moving more than 10px SHALL show the label. Lifting the finger earlier, moving further, or the page starting to scroll SHALL cancel it, and a normal tap SHALL work as before.

#### Scenario: Tap
- **WHEN** the user taps an icon-only button briefly
- **THEN** its action runs and no label appears

#### Scenario: Scroll
- **WHEN** the user puts a finger on the anchor and starts scrolling the page
- **THEN** no label appears

### Requirement: Long-press does not act
A long-press that showed a label SHALL NOT activate the anchor: the click that follows the release SHALL be swallowed before any handler of the page or the anchor sees it. The long-press SHALL NOT open the browser's context menu, the text selection callout or a selection on the anchor.

#### Scenario: Menu button
- **WHEN** the user long-presses an icon-only menu button
- **THEN** its label appears and its menu does not open

### Requirement: Touch label goes away
A label shown by a long-press SHALL hide on the next touch or click anywhere, when the page scrolls, and after about 3 seconds.

#### Scenario: Timeout
- **WHEN** a label was shown by long-press and nothing else happens
- **THEN** it disappears after about 3 seconds

### Requirement: One at a time
At most one tooltip label SHALL be visible at a time; showing one SHALL hide the other.

#### Scenario: Next button
- **WHEN** the pointer moves from one icon button to its neighbour
- **THEN** only the neighbour's label is visible

### Requirement: No double tooltip
While a label is shown for an anchor that has its own `title`, the `title` SHALL be removed so the browser does not show its native tooltip too, and SHALL be restored when the label hides.

#### Scenario: Title and data-tooltip
- **WHEN** an element has `title="Old"` and `data-tooltip="New"` and the pointer rests on it
- **THEN** only the themed label "New" shows, and afterwards the element has `title="Old"` again

### Requirement: Not the accessible name
The label SHALL have the tooltip role and SHALL NOT change the anchor's accessible name. The anchor SHALL reference the label with `aria-describedby` only when the label's text differs from the anchor's name (its `aria-label`, else its text), and only while both are in the same document or shadow root.

#### Scenario: Name equals label
- **WHEN** an icon-only button named "Delete" shows the label "Delete"
- **THEN** the button has no `aria-describedby` added and is announced once as "Delete"

#### Scenario: Extra description
- **WHEN** a button named "Export" has `data-tooltip="Export as CSV"`
- **THEN** while the label shows, the button is described by it

### Requirement: Events
The component SHALL dispatch `tooltip-show` and `tooltip-hide` (bubbling, composed) on the anchor, with `{ text, reason }` where reason is `hover`, `focus`, `touch` or `api`. On load it SHALL emit the `tooltip-ready` trigger through `KakaoComponents` and register its triggers.

#### Scenario: Show event
- **WHEN** a label appears after a long-press
- **THEN** the anchor receives `tooltip-show` with `reason: "touch"`

### Requirement: Methods
A dedicated element SHALL offer `show()` and `hide()`; `KakaoTooltip.show(anchor, text)` and `KakaoTooltip.hide()` SHALL do the same for any element.

#### Scenario: From script
- **WHEN** a script calls `KakaoTooltip.show(el, "Copied")`
- **THEN** the label "Copied" appears next to `el` with `reason: "api"`

### Requirement: Theming and motion
The label's colours SHALL come from theme roles (ink background, on-ink text) through `--kakao-tooltip-*` properties in the component's settings block, so every theme gives it readable contrast. It SHALL fade in briefly, and appear without motion when the user prefers reduced motion. Text SHALL never be set in capitals. In forced-colours mode it SHALL keep a visible border.

#### Scenario: Dark theme
- **WHEN** the page switches to a dark theme
- **THEN** the label takes that theme's ink and on-ink colours

### Requirement: Inline sample
With the boolean `inline` attribute, a `<kakao-tooltip>` SHALL draw its label in the text flow, always visible and tied to no anchor, for previews and documentation.

#### Scenario: Construction preview
- **WHEN** `<kakao-tooltip inline>Copy link</kakao-tooltip>` is on a page
- **THEN** the label "Copy link" is shown where the element stands, without hover or focus
