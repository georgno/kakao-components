# time-input Specification

## Purpose
`<kakao-time-input>` is a form field for a time of day that keeps the browser's native field and picker, shows 12 or 24 hours as the browser does, and looks like the library's other fields.

## Requirements

### Requirement: Field
The element SHALL wrap one native `<input type="time">` with the text input's look: `label` above, `hint` and `error` below (the error replaces the hint, turns the border to the danger colour and sets `aria-invalid`), sizes `sm`, `md` (default) and `lg`, `disabled`, `readonly`, and digits in tabular figures. Keyboard focus SHALL show a 2px outline in the focus colour with a 2px offset around the field.

#### Scenario: Focus
- **WHEN** the user tabs into the field
- **THEN** the field shows the 2px focus outline

### Requirement: Picker indicator
The browser's own picker indicator SHALL stay at the right end of the field and open the native picker. Where the browser allows styling it, it SHALL be drawn as a clock in the muted colour and centred where the select's chevron is centred at the same size. In every built-in theme, light and dark, the indicator SHALL be visible.

#### Scenario: Stacked under a select
- **WHEN** a time input and a select of the same size are stacked in one column
- **THEN** the indicator and the chevron are centred on the same vertical line

### Requirement: 12 or 24 hours and locale
The field SHALL show 12 or 24 hours as the browser draws it. The inner input SHALL get as `lang` the element's `locale` attribute, else the nearest ancestor `lang` (crossing shadow roots), and SHALL follow later changes of either. The `locale` property SHALL return the locale in use.

#### Scenario: Page language changes
- **WHEN** the page changes `<html lang>` from "en" to "de-AT"
- **THEN** the inner input's `lang` becomes "de-AT" and `locale` returns "de-AT"

### Requirement: Value
`value` SHALL be the inner input's ISO 24-hour value (`HH:MM`, `HH:MM:SS`, `HH:MM:SS.sss`), empty when the field is empty or incomplete. The `value` attribute SHALL be the default; setting the property SHALL not fire events. `valueAsNumber` SHALL return milliseconds since midnight (NaN when empty) and `valueAsDate` that time on 1970-01-01 UTC (null when empty).

#### Scenario: Set by script
- **WHEN** a script sets `el.value = "08:45"`
- **THEN** the field shows that time, `valueAsNumber` is 31500000 and no `input` or `change` event fires

### Requirement: Step and seconds
`step` SHALL be in seconds as on the native input (default 60). With a step below 60 or not whole minutes, the field SHALL show seconds and the value SHALL carry them.

#### Scenario: Seconds
- **WHEN** `step="1" value="00:01:30"`
- **THEN** the field shows a seconds segment and `value` is "00:01:30"

### Requirement: Form participation
The element SHALL be form-associated: with a `name`, its value SHALL be submitted; `min`, `max`, `step` and `required` SHALL apply (`min` after `max` is a range over midnight); its validity and validation message SHALL mirror the inner input's, plus `error` as a custom error. Form reset SHALL restore the `value` attribute; a disabled fieldset SHALL disable it.

#### Scenario: Out of range
- **WHEN** `min="15:00"` and the value is 11:00
- **THEN** `validity.rangeUnderflow` is true

#### Scenario: Step mismatch
- **WHEN** `min="15:00" step="900"` and the value is 15:20
- **THEN** `validity.stepMismatch` is true

### Requirement: Events
The element SHALL fire `input` while the value changes and `change` when the user commits a value, both bubbling and composed, once each, from the host.

#### Scenario: Typing
- **WHEN** the user types a minute into the field
- **THEN** the host fires `input` once

### Requirement: Methods
The element SHALL offer `focus()`, `blur()`, `showPicker()` (opening the native picker where the browser allows it, otherwise focusing the field), `checkValidity()`, `reportValidity()`, `validity`, `validationMessage` and `form`.

#### Scenario: showPicker
- **WHEN** a click handler calls `el.showPicker()` in Chromium
- **THEN** the native time picker opens

### Requirement: Theming
Every visual value SHALL be a `--kakao-time-input-*` property in the component's settings block, named as the date input's (`now-*` for its `today-*`), colours defaulting to the same theme roles, and editable on its construction page.

#### Scenario: Dark theme
- **WHEN** a dark theme is active
- **THEN** the field, its text and its indicator use the theme's colours and the native picker opens in dark

### Requirement: Now shortcut
With the boolean `now` attribute, the element SHALL show a button styled as a small tag (the hint's text size) in the row under the field, after the hint or error. Activating it SHALL set the value to the current local time rounded to the nearest `step` counted from `min` (without `step` the minute; seconds kept only when `step` or `min` is not whole minutes) and fire `input` and `change` once each from the host, like a user edit, updating validity and the form value. Focus SHALL stay on the tag. Without the attribute no tag SHALL be shown.

#### Scenario: Step
- **WHEN** `step="900"` and the tag is clicked at 14:37
- **THEN** the value is "14:30" and the host fires `input` once and `change` once

### Requirement: Now label
The tag SHALL show `now-label` when set, else "Now" in the element's locale through the browser's relative time formatting, with a capital first letter ("Jetzt" in German). The tag SHALL be a real button whose accessible name contains its visible text ("Set to now" in English locales).

#### Scenario: German page
- **WHEN** the element sits in `lang="de"` with `now`
- **THEN** the tag reads "Jetzt"

### Requirement: Now out of range
When the value the tag would set is outside `min` / `max` (over midnight when `min` is after `max`), the tag SHALL stay visible but be disabled: `aria-disabled="true"`, a reason given both as its title and as its accessible description (`aria-describedby` to a visually hidden element), a disabled look, and activation SHALL change nothing. The tag SHALL be hidden while the element is disabled (also through a fieldset) or read only.

#### Scenario: Window later today
- **WHEN** `min` and `max` are a window that excludes the current time
- **THEN** the tag has `aria-disabled="true"`, a title and the same reason as its accessible description, and clicking it neither changes the value nor fires events
