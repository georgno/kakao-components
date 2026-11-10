# toast Specification

## Purpose
`<kakao-toast>` is a fixed notification region in a corner of the viewport that shows short messages as a stack of `<kakao-alert>` cards, which fans out on hover or focus and announces each message without taking focus.

## Requirements

### Requirement: Items are alerts
Every toast SHALL be a `<kakao-alert>` child of the region, so its tone (`info`, `success`, `warning`, `danger`, alias `error`), icon, colours, title, close button and reduced-motion behaviour are the alert's.

#### Scenario: Same look as an alert
- **WHEN** a danger toast and a danger alert with the same text are shown
- **THEN** they have the same tint, icon and text colours

### Requirement: Placement
The region SHALL be fixed to the bottom right of the viewport by default; `position` SHALL accept `bottom-right`, `bottom-left`, `top-right` and `top-left`. It SHALL keep a gutter plus the safe-area insets from the viewport edges, and in top corners SHALL sit below the page header bar.

#### Scenario: Top corner below the header bar
- **WHEN** a region has `position="top-right"` on a page with a sticky header bar
- **THEN** its first toast appears below the bar, not over it

### Requirement: Phone width
At narrow viewports (below 30rem) the region SHALL span the viewport width minus the gutters and safe-area insets.

#### Scenario: 390px viewport
- **WHEN** a toast is shown in a 390px wide viewport
- **THEN** it is as wide as the viewport minus the gutters and nothing scrolls sideways

### Requirement: Clear of an open aside menu
When an aside menu opens on the same side as the region and enough room is left beside its panel, the region SHALL move beside the panel, and SHALL move back when the menu closes.

#### Scenario: Right menu opens
- **WHEN** a right aside menu opens on a 1280px viewport while bottom-right toasts are shown
- **THEN** the toasts move left of the panel and do not cover it

### Requirement: Stacked cards
While collapsed, the newest toast SHALL be in front and the older visible ones SHALL sit behind it, each one a little smaller and fainter and peeking out past the front card: above it in bottom corners, below it in top corners.

#### Scenario: Three toasts
- **WHEN** three toasts are shown one after the other in a bottom corner
- **THEN** the last one is in front at the bottom and the two others peek out above it, the oldest furthest back

### Requirement: Expanding
The stack SHALL fan out into a list of full-size cards with a gap while the pointer is over it or focus is inside it, and SHALL collapse again when neither holds. On touch, a tap on the stack outside its buttons SHALL toggle it and a tap elsewhere SHALL collapse it.

#### Scenario: Hover
- **WHEN** the pointer moves onto a collapsed stack of three toasts
- **THEN** all three are shown full size, newest nearest the corner, and every text is readable

### Requirement: Maximum visible
The `max` attribute (default 3, minimum 1) SHALL limit how many toasts are visible, collapsed or expanded. Older toasts beyond it SHALL stay hidden and out of the accessibility tree until newer ones leave.

#### Scenario: Six toasts
- **WHEN** six toasts are shown with the default `max`
- **THEN** only the three newest are visible, and closing the front one brings the fourth newest into view

### Requirement: Auto-hide timer
A toast SHALL follow the alert's timer rule: info and success hide after the default time, warning and danger stay, `duration="<ms>"` sets the time and `duration="0"` turns it off. A toast's time SHALL only run while it is visible within `max`.

#### Scenario: Default success
- **WHEN** a success toast without a duration is shown and left alone
- **THEN** it leaves after the default time

#### Scenario: Error stays
- **WHEN** a danger toast without a duration is shown
- **THEN** it stays until it is closed

### Requirement: Timers pause together
The timers of all toasts in a region SHALL pause while the stack is expanded (pointer or focus) and while the page is hidden, and SHALL resume with their remaining time afterwards.

#### Scenario: Hover keeps them
- **WHEN** the pointer rests on the stack longer than the toasts' time
- **THEN** none of them leaves until the pointer has left and the remaining time has passed

### Requirement: Leaving
A toast that is closed (button, timer, handle, action or Escape) SHALL slide out towards its side and fade, the others SHALL move into place, and the element SHALL then be removed from the region. Under `prefers-reduced-motion: reduce` the stack SHALL move and remove toasts without sliding or fading.

#### Scenario: Manual close
- **WHEN** the user activates the close button of the front toast
- **THEN** it leaves, the next one comes to the front and the element is removed

### Requirement: Showing from script
`KakaoToast.show(options)` and the region's `show(options)` SHALL add a toast with `tone`, `heading`, `message` (text or a node), `duration`, `dismissible` (default true) and `action` ({ label, onClick }). `KakaoToast.show` SHALL use the given `region`, else the first region in the page, else create one. Both SHALL return a handle with `element`, `close()` and a `closed` promise that resolves with the reason.

#### Scenario: Handle
- **WHEN** a script calls `KakaoToast.show({ tone: 'info', message: 'Copied' }).close()`
- **THEN** the toast leaves and the handle's `closed` promise resolves with `method`

#### Scenario: No region yet
- **WHEN** `KakaoToast.show` is called on a page without a `<kakao-toast>`
- **THEN** a region is added to the body and the toast appears in it

### Requirement: Action button
A toast with an `action` SHALL show a button with the action's label under the message. Activating it SHALL call `onClick` with the handle and SHALL close the toast with reason `action`, unless `onClick` returns `false`.

#### Scenario: Undo
- **WHEN** the user activates "Undo" on a toast
- **THEN** the page's callback runs and the toast leaves

### Requirement: Written toasts
`<kakao-alert>` elements written into a `<kakao-toast>` in the page, or appended to it later, SHALL become toasts with the same stacking and timer behaviour; an alert's own `duration` SHALL be used as its toast time.

#### Scenario: Server flash messages
- **WHEN** a page is delivered with two `<kakao-alert>` children in `<kakao-toast>`
- **THEN** they show as a stack of two after load and hide by the timer rule

### Requirement: Announced without focus
The region SHALL be a polite live region with an accessible name (`label`, default "Notifications"), each toast SHALL keep the alert's role (`status` for info and success, `alert` for warning and danger), and showing a toast SHALL never move focus. A region created by the helper SHALL be in the page before its first toast is added.

#### Scenario: Screen reader
- **WHEN** a success toast is shown while focus is in a form field
- **THEN** its text is announced and focus stays in the field

### Requirement: Keyboard
Toasts with a close or action button SHALL be reachable by Tab in document order; focus inside the region SHALL expand it. Escape SHALL close the toast that holds focus, and focus SHALL return to where it came from.

#### Scenario: Escape
- **WHEN** focus is on a toast's close button and the user presses Escape
- **THEN** that toast leaves and focus goes back to the element focused before

### Requirement: Events
The region SHALL fire bubbling, composed `toast-show` (detail `{ toast }`) when a toast is added and `toast-hidden` (detail `{ toast, reason }`, reason `close`, `timeout`, `method` or `action`) once it is removed; both SHALL also be emitted as triggers through the component API.

#### Scenario: Timeout reason
- **WHEN** an info toast leaves by its timer
- **THEN** `toast-hidden` fires with reason `timeout`
