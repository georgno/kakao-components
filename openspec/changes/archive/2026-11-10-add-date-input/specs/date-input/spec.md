## Purpose
`<kakao-date-input>` is a form field for a date, time, date and time, month or week that keeps the browser's native picker and looks like the library's other fields.

## ADDED Requirements

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
