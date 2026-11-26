# Spec Delta

## MODIFIED Requirements

### Requirement: Keyboard and accessibility
Each thumb SHALL be a focusable `role="slider"` with `aria-valuenow`, `aria-valuetext` (value and unit), `aria-valuemin` and `aria-valuemax` set to the limits it can actually reach, and an accessible name "<label>, minimum" / "<label>, maximum" (or `low-label` / `high-label`; the older `label-low` / `label-high` still work when the new names are absent). Arrows SHALL step by `step`, Page Up / Down by ten steps, Home / End SHALL go to the thumb's limits. Focus SHALL show the shared 2px outline with 2px offset.

#### Scenario: Home on the high thumb
- **WHEN** the value is `20,80`, `min-gap` is 5 and the high thumb has focus
- **THEN** Home moves it to 25

#### Scenario: Old attribute name
- **WHEN** a range slider has `label-low="From"` and no `low-label`
- **THEN** the low thumb is named "From"
