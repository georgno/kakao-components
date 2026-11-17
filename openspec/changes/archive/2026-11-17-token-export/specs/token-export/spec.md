# Spec Delta

## Purpose

Exports every design value of kakao-components (shared tokens, themes, contrast overrides and component settings) as one machine-readable file. Libraries on other platforms, such as a Flutter mirror, can then build from the same values as the web components.

## ADDED Requirements

### Requirement: One export file
The project SHALL keep a generated `tokens.json` at the repo root, written by `node tools/export-tokens.js`. It SHALL contain a format version, the project version, the shared tokens, every theme, the contrast overrides and the settings of every component with a settings block, each component listed by its name.

#### Scenario: Running the exporter
- **WHEN** `node tools/export-tokens.js` runs in a clean checkout
- **THEN** `tokens.json` lists every theme in `shared/themes.css` plus light, and every component with a settings block

#### Scenario: New component
- **WHEN** a component with a settings block is added and the exporter runs
- **THEN** that component appears in `tokens.json` without changing the exporter

### Requirement: Platform-neutral values
Every value SHALL be written in a typed form that needs no CSS engine:
- lengths in px, with rem as 16px and em kept as a factor of the font size;
- colours as `#rrggbbaa`;
- durations in ms;
- cubic-bezier easings as four numbers;
- shadows as a list of layers;
- font shorthands split into their parts.

#### Scenario: Rem length
- **WHEN** a setting's default is `0.95rem`
- **THEN** the export records it as a length of 15.2 px

#### Scenario: Easing with overshoot
- **WHEN** a setting's default is `cubic-bezier(.5, 1.8, .4, 1)`
- **THEN** the export records the easing as `[0.5, 1.8, 0.4, 1]`

#### Scenario: Two-layer shadow
- **WHEN** a shadow default has two comma-separated layers
- **THEN** the export records two layers, each with offset, blur, spread and colour

### Requirement: References kept
A setting that falls back to a shared token or to a sibling setting SHALL record that reference as well as its resolved value, so a consumer can follow the same chain the web component follows.

#### Scenario: Setting following a colour role
- **WHEN** a setting defaults to `var(--kakao-color-primary, #4f46e5)`
- **THEN** the export records a reference to the colour role `primary` together with its resolved colour in each theme

### Requirement: Resolution per theme
A value that depends on theme colours, directly or through `color-mix`, SHALL be resolved separately for every theme, in both normal and more-contrast mode.

#### Scenario: Colour mix in dark
- **WHEN** a setting is `color-mix(in srgb, var(--kakao-color-text) 10%, transparent)`
- **THEN** its dark-theme value is computed from the dark theme's text colour, not the light one

#### Scenario: Contrast override
- **WHEN** the more-contrast override changes the border colour of a theme
- **THEN** the export holds that theme's border colour for both contrast modes

### Requirement: Nothing dropped silently
A value that cannot be reduced to a fixed number SHALL be exported as a typed expression that keeps its parts. This covers `calc`, `clamp`, `min`, `max`, viewport units, `inherit` and `currentColor`. A value the exporter cannot parse at all SHALL make it exit with an error that names the file and setting.

#### Scenario: Clamp
- **WHEN** a setting is `clamp(1.5rem, 6vw, 3rem)`
- **THEN** the export records a clamp expression with a 24 px minimum, a 6 vw preferred value and a 48 px maximum

#### Scenario: Unknown syntax
- **WHEN** a settings block holds a value the exporter does not understand
- **THEN** it exits with code 1, names the file and the setting, and leaves `tokens.json` unchanged

### Requirement: Export kept current
`node tools/export-tokens.js --check` SHALL exit with code 1 when `tokens.json` differs from what the sources produce. The deploy SHALL run that check, and the file SHALL be published on the demo site. Output SHALL be stable: unchanged sources give a byte-identical file.

#### Scenario: Stale export
- **WHEN** a token is edited on `tokens.html` and the exporter is not run
- **THEN** `--check` names the changed entry and the deploy stops

#### Scenario: Repeated run
- **WHEN** the exporter runs twice without source changes
- **THEN** `git diff` shows no change to `tokens.json`
