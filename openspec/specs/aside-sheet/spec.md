# aside-sheet Specification

## Purpose
`<kakao-aside-sheet>` is a card that slides in from an edge of the viewport over the page, modal by default, with a header, a scrolling body and a footer.

## Requirements

### Requirement: Sides
The sheet SHALL attach to the edge named by `side`: `bottom` (default, also for a missing or unknown value), `top`, `start` or `end`. `start` and `end` SHALL follow the writing direction, and `left` and `right` SHALL be accepted as physical sides.

#### Scenario: End sheet in RTL
- **WHEN** a sheet with `side="end"` opens inside an element with `dir="rtl"`
- **THEN** it is attached to the left edge of the viewport

#### Scenario: Unknown side
- **WHEN** a sheet has `side="diagonal"`
- **THEN** it opens as a bottom sheet

### Requirement: Inner corners only
The sheet SHALL round only the corners that face into the page and keep the corners on the viewport edge square: a bottom sheet its top corners, a top sheet its bottom corners, a start or end sheet its two corners away from its edge.

#### Scenario: Bottom sheet corners
- **WHEN** a bottom sheet is open
- **THEN** its top-left and top-right corners are rounded and its bottom corners are square

### Requirement: Opening and closing
The `open` attribute SHALL reflect the state. `show()`, `hide(returnValue)` and `toggle()` SHALL open and close it and `isOpen` SHALL report it; setting or removing `open` directly SHALL also open or close it. Methods called before the element is connected SHALL take effect once it connects.

#### Scenario: Opened from script
- **WHEN** a script calls `sheet.show()`
- **THEN** the sheet gets the `open` attribute and slides in

### Requirement: Declarative triggers
The `for` attribute SHALL list the ids (space separated) of elements that toggle the sheet on click, including elements added after the sheet. Those elements SHALL get `aria-haspopup="dialog"` and an `aria-expanded` that follows the state.

#### Scenario: Button opens it
- **WHEN** an element with id `filters-btn` is clicked and a sheet has `for="filters-btn"`
- **THEN** the sheet opens and the button has `aria-expanded="true"`

### Requirement: Closing controls
A close button SHALL sit in the header (accessible name from `close-label`, default "Close") unless `no-close-button` or `no-dismiss` is set. A click on any element inside the sheet carrying `data-close` SHALL close it with that attribute's value as the return value.

#### Scenario: data-close value
- **WHEN** a button with `data-close="apply"` inside the sheet is clicked
- **THEN** the sheet closes and `sheet-hidden` carries `returnValue: "apply"`

### Requirement: Modal by default
Unless `modal="false"` or `contained` is set, an open sheet SHALL cover the whole viewport with a scrim, the sticky header bar included, whatever margin the page gives the element, mark its panel `aria-modal="true"`, move focus into the panel, keep Tab and Shift+Tab inside the sheet (including elements inside nested shadow roots), lock the page scroll without a layout shift, and return focus to the element that had it when it closes.

#### Scenario: Focus is trapped and returned
- **WHEN** a modal sheet is opened from a button and the user presses Tab past its last control and then Escape
- **THEN** focus wraps to its first control, and after closing focus is back on the button

#### Scenario: Scrim covers the header bar
- **WHEN** a modal sheet placed in a card whose CSS gives its children a top margin opens under a sticky header bar
- **THEN** the scrim covers the viewport from its top edge, the header bar included

#### Scenario: Page does not scroll
- **WHEN** a modal sheet is open and the user scrolls over the scrim
- **THEN** the page behind does not scroll

### Requirement: Dismissal
Unless `no-dismiss` is set, Escape (while focus is in the sheet or on nothing) and a click on the scrim SHALL close a modal sheet; Escape SHALL close a non-modal sheet while focus is inside it. An Escape already handled by another component SHALL be ignored.

#### Scenario: Scrim click
- **WHEN** the user clicks the scrim of an open modal sheet
- **THEN** the sheet closes

#### Scenario: No dismiss
- **WHEN** a sheet with `no-dismiss` is open and the user presses Escape
- **THEN** it stays open

### Requirement: Non-modal mode
With `modal="false"` the sheet SHALL show no scrim, leave the page scrollable and clickable, set no `aria-modal` and not trap focus.

#### Scenario: Page stays usable
- **WHEN** a non-modal bottom sheet is open
- **THEN** the page above it can be scrolled and its links can be clicked and tabbed to

### Requirement: Contained mode
With `contained` the sheet SHALL be placed inside its nearest positioned ancestor instead of the viewport and SHALL drop the modal behaviour, so a page can show it as a preview.

#### Scenario: Preview box
- **WHEN** an open sheet with `contained` sits in a positioned box
- **THEN** it is attached to that box's edge and the page stays scrollable

### Requirement: Accessible name
The panel SHALL have role `dialog` and SHALL be named by the `header` slot element, or by the `label` attribute when there is no header.

#### Scenario: Named by header
- **WHEN** a sheet has `<h2 slot="header">Filters</h2>`
- **THEN** its dialog's accessible name is "Filters"

### Requirement: Slots and scrolling
The sheet SHALL show a `header` slot, the default slot as its body and a `footer` slot; header and footer SHALL stay in place while only the body scrolls when the content is taller than the sheet.

#### Scenario: Long body
- **WHEN** a bottom sheet holds more content than fits its max height
- **THEN** the body scrolls and the header and footer stay visible

### Requirement: Sizing
Bottom and top sheets SHALL be at most `--kakao-aside-sheet-max-height` tall (default 85dvh) and at most `--kakao-aside-sheet-max-width` wide, centred. Start and end sheets SHALL be full height and `--kakao-aside-sheet-width` wide, never wider than the viewport. The sheet SHALL keep the safe-area insets on the edges it touches.

#### Scenario: Phone width
- **WHEN** an end sheet opens in a 390px wide viewport
- **THEN** it is no wider than the viewport and nothing scrolls sideways

### Requirement: Drag handle
With `handle` a bottom sheet SHALL show a drag handle above its header. Dragging the handle or the header down SHALL move the sheet with the pointer; releasing it far or fast enough SHALL close it (reason `swipe`), otherwise it SHALL return to place.

#### Scenario: Swipe down
- **WHEN** the user drags the handle of a bottom sheet down by more than a quarter of its height and releases
- **THEN** the sheet closes

### Requirement: Motion
The sheet SHALL slide in from its edge on the spring curve and the motion duration (`--kakao-ease-spring`, `--kakao-motion-duration`) without uncovering a gap at its edge, and SHALL leave on the standard curve; the scrim SHALL fade. Under `prefers-reduced-motion: reduce` the sheet SHALL not slide, only fade.

#### Scenario: Reduced motion
- **WHEN** reduced motion is requested and a sheet opens
- **THEN** it fades in at its final position without moving

### Requirement: Events
The sheet SHALL dispatch `sheet-show` when it opens; `sheet-hide`, cancelable, before a close by the user or by `hide()`, with `{ reason, returnValue }` (reason `escape`, `scrim`, `button`, `swipe` or `method`); and `sheet-hidden` with the same detail once it has left (reason `attribute` when `open` was removed directly). Events SHALL bubble and be composed and SHALL also be emitted as triggers.

#### Scenario: Cancelled close
- **WHEN** a `sheet-hide` listener calls `preventDefault()` and the user presses Escape
- **THEN** the sheet stays open and no `sheet-hidden` is dispatched

### Requirement: Stacking
The sheet SHALL sit above the header bar (30) and the aside menu (40) and below the dialog (60), toasts (70) and popovers (1000), through `--kakao-aside-sheet-z` (default 50).

#### Scenario: Dialog from a sheet
- **WHEN** a dialog is opened from a button inside an open sheet
- **THEN** the dialog appears over the sheet

### Requirement: Theming
Every visual value SHALL be a `--kakao-aside-sheet-*` custom property in the component's settings block, colours defaulting to theme roles and motion to the motion tokens, editable on its construction page.

#### Scenario: Dark theme
- **WHEN** the dark theme is active
- **THEN** the sheet uses the theme's raised surface and text colours
