# Spec Delta

## MODIFIED Requirements

### Requirement: Narrow layout
Below a row width of 30rem (a container query on the row, not the viewport) the control SHALL drop below the label, wide controls taking the full width, except rows whose control is a switch group or checkbox. `layout="inline"` or `"stacked"` SHALL force one layout; `"stack"`, the older name, SHALL keep working.

#### Scenario: Phone width
- **WHEN** the page is 390px wide
- **THEN** a row with a select shows the select under its label at full width, and a row with a switch keeps the switch beside its label, with no horizontal scroll

#### Scenario: Forced stacked row
- **WHEN** a row has `layout="stacked"` (or `layout="stack"`)
- **THEN** its control sits under the label at every width
