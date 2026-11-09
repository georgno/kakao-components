# switch-group Specification

## Purpose
`<kakao-switch-group>` renders a labelled group of on/off switches with a squash-and-stretch thumb, optional dragging, label colouring and an async mode that waits for the server before committing.

## Requirements

### Requirement: Switches from data
The group SHALL render one `role="switch"` per entry of `list-data` (`[{ name, label, checked, disabled }]`) inside a `role="group"` labelled by `label`, laid out per `orientation` (horizontal by default, or vertical). `setData()` SHALL replace the switches and set `aria-busy` while it works.

#### Scenario: Disabled entry
- **WHEN** an entry has `"disabled": true`
- **THEN** that switch cannot be toggled by pointer, keyboard or API

### Requirement: Toggling and keyboard
The group SHALL toggle a switch on click, tap, Space or Enter and fire `switch-change` `{ name, index, checked }`. Arrow keys SHALL move a roving focus that wraps, and Home and End SHALL jump to the first and last switch.

#### Scenario: Keyboard toggle
- **WHEN** a focused switch receives Space
- **THEN** it toggles and `switch-change` fires

### Requirement: Thumb dragging
With `thumb-drag` on (the default; "false", "off", "0" or "no" turn it off) the thumb SHALL follow the pointer, snap to the nearer end on release, and squash into the wall when dragged past an end, without ever drawing outside the track's inner edge. It SHALL fire `switch-drag-start`, `switch-drag` and `switch-drag-end`.

#### Scenario: Thumb not clipped
- **WHEN** the switch sits at a fractional pixel position
- **THEN** the thumb is drawn completely, without its top or bottom cut off

### Requirement: Coloured labels
With `color-labels` the label of a checked switch SHALL take `--kakao-switch-label-color-on` (by default the track's on colour) and fade back when the switch is turned off.

#### Scenario: Turning a themed switch on
- **WHEN** a switch in a group with `color-labels` is turned on
- **THEN** its label transitions to the on colour

### Requirement: Async toggling
With `async` every user toggle SHALL first fire a cancelable `switch-request` whose `detail.waitUntil(promise)` makes the toggle wait, and the thumb SHALL move to the new end right away. On success the change SHALL be committed with `switch-change`. On failure the track SHALL turn red, the thumb SHALL show an X, `switch-error` SHALL fire and the switch SHALL spring back.

#### Scenario: Cancelled request
- **WHEN** a `switch-request` listener calls `preventDefault()`
- **THEN** the switch does not change

#### Scenario: Failure
- **WHEN** the promise rejects, however fast
- **THEN** the track shows red with an X, `switch-error` fires and the switch returns to its previous state

### Requirement: Async loading feedback
An async toggle SHALL show a spinning loader in the thumb only after `loading-delay` ms (default 300; 0 means immediately), and once shown the loader SHALL stay at least 400 ms. If the loader was shown, success SHALL draw a checkmark briefly before the thumb settles. Icons SHALL fade in and out rather than appear or vanish instantly.

#### Scenario: Fast success
- **WHEN** the promise resolves before `loading-delay` has passed
- **THEN** no loader and no checkmark are shown and the switch simply stays in its new state

#### Scenario: Slow success
- **WHEN** the promise resolves after the loader appeared
- **THEN** the loader fades into a checkmark, `switch-change` fires and the thumb settles

### Requirement: Edge fade when scrolling sideways
When the horizontal row of switches does not fit its space and scrolls sideways, it SHALL fade out its edge on each side where more is hidden, SHALL NOT fade a side scrolled to its end, and SHALL show no fade when nothing overflows. The fade SHALL follow scrolling and size changes. Its width SHALL be the `--kakao-switch-scroll-fade` setting, which defaults to the main variable `--kakao-scroll-fade`.

#### Scenario: Overflowing, scrolled to the start
- **WHEN** the horizontal row of switches overflows and is scrolled to its start
- **THEN** only its end edge is faded

#### Scenario: Scrolled partway
- **WHEN** it is scrolled partway
- **THEN** both edges are faded

#### Scenario: Everything fits
- **WHEN** the horizontal row of switches fits its space
- **THEN** neither edge is faded
