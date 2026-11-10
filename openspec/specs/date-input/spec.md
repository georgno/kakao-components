# date-input Specification

## Purpose
`<kakao-date-input>` is a form field for a date, time, date and time, month or week that keeps the browser's native picker and looks like the library's other fields.

## Requirements

### Requirement: Types
The element SHALL wrap one native input whose type comes from the `type` attribute: `date` (default), `time`, `datetime-local`, `month` or `week`; any other value SHALL be treated as `date`. Changing `type` at runtime SHALL change the field.

#### Scenario: Time
- **WHEN** a page has `<kakao-date-input type="time" value="14:30">`
- **THEN** the field shows the browser's native time field with 14:30

### Requirement: Unsupported types
When the browser has no native field for the type, the field SHALL accept the ISO text form instead: placeholder `YYYY-MM` for month, `YYYY-Www` for week, `YYYY-MM-DD` for date, and a pattern that rejects other text.

#### Scenario: Month in Firefox
- **WHEN** `type="month"` is used in a browser without a month field
- **THEN** the field shows the placeholder "YYYY-MM" and "2026-3" is reported as a pattern mismatch

### Requirement: Field
The field SHALL have the text input's look: `label` above, `hint` and `error` below (the error replaces the hint, turns the border to the danger colour and sets `aria-invalid`), sizes `sm`, `md` (default) and `lg`, `disabled`, `readonly`, and digits in tabular figures. Keyboard focus SHALL show a 2px outline in the focus colour with a 2px offset around the field.

#### Scenario: Focus
- **WHEN** the user tabs into the field
- **THEN** the field shows the 2px focus outline

### Requirement: Picker indicator
The browser's own picker indicator SHALL stay at the right end of the field and open the native picker. Where the browser allows styling it, it SHALL be drawn in the muted colour and centred where the select's chevron is centred at the same size. In every built-in theme, light and dark, the indicator SHALL be visible.

#### Scenario: Stacked under a select
- **WHEN** a date input and a select of the same size are stacked in one column
- **THEN** the indicator and the chevron are centred on the same vertical line, within 1px in Chromium

### Requirement: Locale
The inner input SHALL get as `lang` the element's `locale` attribute, else the nearest ancestor `lang` (crossing shadow roots), and SHALL follow later changes of either. The `locale` property SHALL return the locale in use.

#### Scenario: Page language changes
- **WHEN** the page changes `<html lang>` from "en" to "de-AT"
- **THEN** the inner input's `lang` becomes "de-AT" and `locale` returns "de-AT"

### Requirement: Value
`value` SHALL be the inner input's ISO value (`YYYY-MM-DD`, `HH:MM[:SS]`, `YYYY-MM-DDTHH:MM`, `YYYY-MM`, `YYYY-Www`), empty when the field is empty or incomplete. The `value` attribute SHALL be the default; setting the property SHALL not fire events.

#### Scenario: Set by script
- **WHEN** a script sets `el.value = "2026-03-04"` on a date input
- **THEN** the field shows that date and no `input` or `change` event fires

### Requirement: Form participation
The element SHALL be form-associated: with a `name`, its value SHALL be submitted; `min`, `max`, `step` and `required` SHALL apply; its validity and validation message SHALL mirror the inner input's, plus `error` as a custom error. Form reset SHALL restore the `value` attribute; a disabled fieldset SHALL disable it.

#### Scenario: Required
- **WHEN** a form with an empty required date input is submitted
- **THEN** submission is blocked and the field reports a missing value

#### Scenario: Out of range
- **WHEN** `min="2026-01-01"` and the value is 2025-12-31
- **THEN** `validity.rangeUnderflow` is true

### Requirement: Events
The element SHALL fire `input` while the value changes and `change` when the user commits a value, both bubbling and composed, once each, from the host.

#### Scenario: Picking a date
- **WHEN** the user picks a date in the native picker
- **THEN** the host fires `input` and `change` once each

### Requirement: Methods
The element SHALL offer `focus()`, `blur()`, `showPicker()` (opening the native picker where the browser allows it, otherwise focusing the field), `checkValidity()`, `reportValidity()`, `validity`, `validationMessage` and `form`.

#### Scenario: showPicker
- **WHEN** a click handler calls `el.showPicker()` in Chromium
- **THEN** the native date picker opens

### Requirement: Theming
Every visual value SHALL be a `--kakao-date-input-*` property in the component's settings block, colours defaulting to theme roles, and editable on its construction page.

#### Scenario: Dark theme
- **WHEN** a dark theme is active
- **THEN** the field, its text and its indicator use the theme's colours and the native picker opens in dark

### Requirement: Today shortcut
With the boolean `today` attribute, the element SHALL show a button styled as a small tag in the row under the field, after the hint or error. Activating it SHALL set the value to the current period for the type and fire `input` and `change` once each from the host, like a user edit, updating validity and the form value. Without the attribute no tag SHALL be shown.

#### Scenario: Date
- **WHEN** the user clicks the tag of `<kakao-date-input today>` on 2026-11-10
- **THEN** the value is "2026-11-10" and the host fires `input` once and `change` once

#### Scenario: Keyboard
- **WHEN** the tag has keyboard focus and the user presses Enter or Space
- **THEN** the value is set as with a click, and focus stays on the tag

#### Scenario: Form
- **WHEN** the tag of a named date input in a form is used and the form is submitted
- **THEN** the form data carries today's ISO date under that name

### Requirement: Today value per type
The value set by the tag SHALL be: today (`date`), the current local time (`time`, `datetime-local`) rounded to the nearest `step` counted from `min` (seconds kept only when `step` is not whole minutes; without `step` the minute), the current month (`month`) and the current ISO 8601 week (`week`).

#### Scenario: Time with step
- **WHEN** `type="time" step="900"` and the tag is clicked at 14:37
- **THEN** the value is "14:30"

#### Scenario: Week
- **WHEN** `type="week"` and the tag is clicked on 2026-11-10
- **THEN** the value is "2026-W46"

### Requirement: Today label
The tag SHALL show `today-label` when set, else a default for the type in the element's locale: "Today" (date), "Now" (time, datetime-local), "This month" (month), "This week" (week), localised where the browser's relative time formatting provides it, with a capital first letter. The tag SHALL be a real button with an accessible name that contains its visible text.

#### Scenario: German page
- **WHEN** the element sits in `lang="de"` with `today` and type date
- **THEN** the tag reads "Heute"

### Requirement: Today out of range
When the value the tag would set is before `min` or after `max`, the tag SHALL stay visible but be disabled: `aria-disabled="true"`, a reason explaining why given both as its title (for the mouse) and as its accessible description (`aria-describedby` to a visually hidden element, for keyboard and screen reader users), a disabled look, and activation SHALL change nothing. The tag SHALL be hidden while the element is disabled (also through a fieldset) or read only.

#### Scenario: Min in the future
- **WHEN** `min` is after today
- **THEN** the tag has `aria-disabled="true"`, a title and the same reason as its accessible description, and clicking it neither changes the value nor fires events

#### Scenario: Read only
- **WHEN** the element is `readonly`
- **THEN** no tag is shown
