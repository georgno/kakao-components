# Spec Delta

## ADDED Requirements

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
When the value the tag would set is before `min` or after `max`, the tag SHALL stay visible but be disabled: `aria-disabled="true"`, a title explaining why, a disabled look, and activation SHALL change nothing. The tag SHALL be hidden while the element is disabled (also through a fieldset) or read only.

#### Scenario: Min in the future
- **WHEN** `min` is after today
- **THEN** the tag has `aria-disabled="true"` and a title, and clicking it neither changes the value nor fires events

#### Scenario: Read only
- **WHEN** the element is `readonly`
- **THEN** no tag is shown
