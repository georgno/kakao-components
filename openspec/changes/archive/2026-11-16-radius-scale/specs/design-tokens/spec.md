# Spec Delta

## ADDED Requirements

### Requirement: Radius scale
The shared tokens file SHALL define the radius scale as main variables, editable on the main-variables page: `--kakao-radius-xs` (4px), `--kakao-radius-sm` (6px), `--kakao-radius-md` (10px), `--kakao-radius-lg` (14px) and `--kakao-radius-pill` (999px). Every component radius setting whose default equals a scale step SHALL default to that step's variable with the same literal fallback. Radii set by the nesting rule or tied to a size (button radii) stay outside the scale.

#### Scenario: Changing a step
- **WHEN** `--kakao-radius-sm` is changed on the main-variables page
- **THEN** the options of select, combobox and menu and the tooltip all take the new radius

#### Scenario: Without the tokens file
- **WHEN** a component is used on a page that does not load the tokens file
- **THEN** its corners keep the same radii as before (the literal fallbacks)
