# button Specification

## Purpose
`<kakao-button>` is a light-DOM button with variants, sizes, icons, a toggle mode and an async loading state; it is the button used by every demo and by other components.

## Requirements

### Requirement: Variants, sizes and icons
The button SHALL render an inner native `<button>` (or link when `href` is set) styled by `button.css`, with `variant` primary (default), secondary, ghost or danger, `size` sm, md (default) or lg, and an optional `icon` placed by `icon-position` left, right or only.

#### Scenario: Icon-only button
- **WHEN** `icon-position="only"` is set with an `aria-label`
- **THEN** only the icon is shown and the accessible name comes from `aria-label`

### Requirement: Native form and data attributes
The button SHALL pass `type`, `name`, `value`, `form` and `disabled` to the inner button and SHALL mirror `data-*` attributes from the host onto it, so form submission and framework hooks such as Yii's `data-confirm` and `data-method` keep working.

#### Scenario: Submit button
- **WHEN** a `<kakao-button type="submit" form="f">` is clicked
- **THEN** form `f` is submitted

#### Scenario: Data attributes
- **WHEN** the host has `data-method="post"`
- **THEN** the inner button carries `data-method="post"`

### Requirement: Action event
The button SHALL dispatch a bubbling `kakao-button-action` event on click, except while disabled or loading.

#### Scenario: Click while loading
- **WHEN** the button is clicked during `run()`
- **THEN** no `kakao-button-action` event is fired

### Requirement: Toggle mode
With `toggle` the button SHALL flip its `pressed` attribute on click and expose it as `aria-pressed`. Buttons inside a `.kakao-button-segment` container SHALL look like a segmented control without box shadows, and an icon on a pressed dark segment SHALL change to a contrasting colour on hover with a transition.

#### Scenario: Toggling
- **WHEN** a toggle button is clicked
- **THEN** `pressed` is added or removed and `aria-pressed` follows

### Requirement: Async loading state
`run(promiseOrFactory, { successHold })` SHALL show a loading animation until the promise settles, then a success or failure state, and return to idle. The button's width SHALL stay fixed during the whole sequence so neighbouring elements do not move.

#### Scenario: Neighbour stays in place
- **WHEN** one of two buttons in a row runs its loading animation
- **THEN** the other button does not move

#### Scenario: Rejected promise
- **WHEN** the promise passed to `run()` rejects
- **THEN** the failure state is shown before the button returns to idle

### Requirement: Menu form
With `list-data` (`[{ value, label?, disabled? }]`), any button variant and size SHALL become a menu button: a trailing chevron, `aria-haspopup="menu"` and `aria-expanded`, and a menu of `menuitemradio` items below the button (above it when there is no room). `selected` SHALL mark the checked item and SHALL update on pick. With `show-selected`, the button SHALL show the selected item's label, and its accessible name SHALL be "<label>: <item>". Picking SHALL fire `kakao-button-select` `{ value, label, previous, x, y }`. Opening and closing SHALL fire `kakao-button-menu` `{ open }`. A menu button SHALL NOT fire `kakao-button-action`.

#### Scenario: Picking with the keyboard
- **WHEN** the user focuses a menu button, presses Down, moves with the arrow keys and presses Enter
- **THEN** the menu opens on the checked item, disabled items are skipped, the picked item becomes `selected`, the menu closes and focus returns to the button

#### Scenario: Closing
- **WHEN** the menu is open and the user presses Escape, presses Tab or clicks outside
- **THEN** the menu closes (Escape returns focus to the button)

### Requirement: Optional chevron
A dropdown button SHALL show a chevron unless it has `no-chevron`. An icon-only dropdown SHALL stay a circle with `no-chevron` and SHALL become a pill that shows the chevron without it.

#### Scenario: Actions menu
- **WHEN** an icon-only ghost button with a ⋯ icon has `list-data` and `no-chevron`
- **THEN** it is a round icon button that opens its menu

### Requirement: Settling shadow in segments
In a `.kakao-button-segment`, a pressed item SHALL have no shadow at rest. When an item becomes pressed, its shadow SHALL fade in and out once. With reduced motion there SHALL be no shadow.

#### Scenario: Pressing a segment item
- **WHEN** the user presses another item of a segmented toggle
- **THEN** that item's shadow appears briefly and is gone once it has settled
