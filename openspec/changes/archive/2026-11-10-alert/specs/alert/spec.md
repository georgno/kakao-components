# Spec Delta

## Purpose

`<kakao-alert>` is an inline message in the page content: a tinted box with an icon, an optional title and the message, which can be closed by the user and can hide itself after a while.

## ADDED Requirements

### Requirement: Tones
The `tone` attribute SHALL select `info` (default, also for unknown values), `success`, `warning` or `danger`; `error` SHALL behave as `danger`. Each tone SHALL take its colour from a theme colour role. Changing `tone` at runtime SHALL restyle the alert without re-creating it.

#### Scenario: Runtime change
- **WHEN** a script sets `tone="danger"` on a visible info alert
- **THEN** the alert shows the danger tint and icon at once

#### Scenario: Alias
- **WHEN** an alert has `tone="error"`
- **THEN** it looks and behaves exactly like `tone="danger"`

### Requirement: Readable in every theme
The message and title SHALL use the theme's text colour on a light tint of the tone, and SHALL meet 4.5:1 in every theme. The icon SHALL meet 3:1 against the tint.

#### Scenario: Dark theme
- **WHEN** a danger alert is shown in the dark theme
- **THEN** its text and icon keep the required contrast

### Requirement: Roles
Unless the author gave the element a `role`, the alert SHALL carry `role="alert"` for warning and danger and `role="status"` for info and success, and SHALL update it when the tone changes.

#### Scenario: Tone change updates role
- **WHEN** `tone` changes from `success` to `warning`
- **THEN** the element's role changes from `status` to `alert`

#### Scenario: Author role kept
- **WHEN** an alert is written with `role="note"`
- **THEN** the component never changes that role

### Requirement: Content, title and icon
The default slot SHALL hold the message. A `heading` attribute or a `slot="title"` element SHALL show a title above it; without either, no title space is taken. Each tone SHALL show a default icon that is hidden from assistive technology; `slot="icon"` SHALL replace it and `no-icon` SHALL remove it.

#### Scenario: Custom icon
- **WHEN** an element with `slot="icon"` is given
- **THEN** it is shown instead of the tone's default icon

### Requirement: Dismissible
With `dismissible`, the alert SHALL show a close button whose accessible name is `close-label` (default "Close"). Activating it SHALL request hiding with reason `close`.

#### Scenario: Close by keyboard
- **WHEN** the user tabs to the close button and presses Enter
- **THEN** the alert hides and focus moves to where it came from, or to the page if that is gone

### Requirement: Hiding is cancellable
Every hide request (close button, timer or method) SHALL first fire a cancellable, bubbling, composed `alert-hide` event with `detail.reason` (`close`, `timeout` or `method`). If it is not cancelled, the alert SHALL fade out, then carry `hidden` and fire `alert-hidden` with the same reason.

#### Scenario: Cancelled
- **WHEN** a listener calls `preventDefault()` on `alert-hide`
- **THEN** the alert stays visible and no `alert-hidden` follows

### Requirement: Auto-hide timer
Info and success alerts SHALL hide by themselves after the default time from the settings block. Warning and danger alerts SHALL NOT, unless `duration` is set. `duration="<ms>"` SHALL set the time for any tone and `duration="0"` SHALL turn the timer off. The timer SHALL start when the alert is shown and restart when `duration` or `tone` changes.

#### Scenario: Default success
- **WHEN** a success alert without `duration` is shown
- **THEN** it fades out and hides after the default time

#### Scenario: Error stays
- **WHEN** a danger alert without `duration` is shown
- **THEN** it stays until closed

#### Scenario: Turned off
- **WHEN** an info alert has `duration="0"`
- **THEN** it never hides by itself

### Requirement: Timer pauses
The timer SHALL pause while the pointer is over the alert, while focus is inside it and while the page is hidden, and SHALL resume with the remaining time once none of these holds.

#### Scenario: Hover
- **WHEN** the pointer rests on an auto-hiding alert past its time
- **THEN** it stays, and hides once the pointer has left and the remaining time has passed

### Requirement: Reduced motion
Under `prefers-reduced-motion: reduce` the alert SHALL appear and hide without fading or collapsing, and SHALL still hide when its timer ends.

#### Scenario: Reduced motion timeout
- **WHEN** the timer of an alert ends with reduced motion on
- **THEN** it hides at once and `alert-hidden` fires

### Requirement: Methods and events
`show()` SHALL remove `hidden`, restart the timer and fire `alert-show`. `hide()` and `close()` SHALL request hiding with reason `method`. `alert-show`, `alert-hide` and `alert-hidden` SHALL also be emitted as triggers through the component API when it is loaded.

#### Scenario: Show again
- **WHEN** `show()` is called on a hidden alert
- **THEN** it appears, fires `alert-show` and starts its timer again
