# Spec Delta

## ADDED Requirements

### Requirement: Colour roles
The main variables SHALL include the colour roles text, text-soft, muted, page, bg (surface), raised, subtle, subtle-strong, line, border, ink, ink-hover, on-ink, danger, danger-hover, on-danger, primary and focus. `shared/tokens.css` SHALL hold their light values.

#### Scenario: Roles on the tokens page
- **WHEN** the main-variables page is opened
- **THEN** every colour role is listed in its settings table

### Requirement: Themes
`shared/themes.css` SHALL define every theme other than light as a block that overrides the colour roles and sets `color-scheme`. `data-kakao-theme="<name>"` SHALL select a theme on `<html>` or on any element. Without the attribute, the page SHALL follow `prefers-color-scheme`. `data-bs-theme="dark"` SHALL select the dark theme when no kakao theme is set. `prefers-contrast: more` SHALL strengthen muted, border and line in every theme.

#### Scenario: Scoped theme
- **WHEN** a panel inside a light page has `data-kakao-theme="dark"`
- **THEN** components inside the panel use the dark colours and the rest of the page stays light

### Requirement: Accessible themes
Every theme SHALL pass `node tools/check-themes.js`: text pairs at least 4.5:1, and control borders, filled controls and focus colours at least 3:1 against page and surface. The tool SHALL exit with an error when a theme fails or a generated block in `themes.css` is out of date.

#### Scenario: Too light a border
- **WHEN** a theme's border colour is 2.8:1 against its surface
- **THEN** `check-themes.js` names the pair and exits with code 1
