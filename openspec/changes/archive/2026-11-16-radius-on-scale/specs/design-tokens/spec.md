# Spec Delta

## MODIFIED Requirements

### Requirement: Main variables
The project SHALL define its main variables as `--kakao-*` custom properties on `:root` in one shared tokens file. Each variable SHALL have a type and a human-readable name. The set SHALL cover at least primary colour, text colour, muted text colour, background, border colour, danger colour, horizontal padding, vertical padding, gap, the radius scale, font family, base font size and motion duration.

#### Scenario: Page loads the tokens file
- **WHEN** a page links the shared tokens file
- **THEN** every main variable is available to every component on that page

### Requirement: Radius scale
The shared tokens file SHALL define the radius scale as main variables, editable on the main-variables page: `--kakao-radius-xs` (4px), `--kakao-radius-sm` (6px), `--kakao-radius-md` (10px), `--kakao-radius-lg` (14px) and `--kakao-radius-pill` (999px). There SHALL be no other radius main variable (the former `--kakao-radius` is retired). Every corner radius a component or shared stylesheet sets as a fixed length SHALL be a scale step and SHALL refer to that step's variable with the same literal fallback; an off-scale value moves to the nearest step, a tie to the larger step, a hairline corner to xs. Only circles and percentages, `0`, `inherit` and radii computed from another radius (the nesting rule) stay outside the scale.

#### Scenario: Changing a step
- **WHEN** `--kakao-radius-sm` is changed on the main-variables page
- **THEN** the options of select, combobox and menu, the tooltip and the checkbox boxes all take the new radius

#### Scenario: Without the tokens file
- **WHEN** a component is used on a page that does not load the tokens file
- **THEN** its corners take the scale's literal fallbacks

#### Scenario: Old variable
- **WHEN** a page still sets `--kakao-radius: 8px`
- **THEN** nothing breaks; the aside menu and number input keep the md radius (10px)
