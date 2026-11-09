# design-tokens Specification

## Purpose
Global main variables (design tokens) such as primary colour and horizontal padding, which all components can follow, so the overall look changes in one place.

## Requirements

### Requirement: Main variables
The project SHALL define its main variables as `--kakao-*` custom properties on `:root` in one shared tokens file. Each variable SHALL have a type and a human-readable name. The set SHALL cover at least primary colour, text colour, muted text colour, background, border colour, danger colour, horizontal padding, vertical padding, gap, radius, font family, base font size and motion duration.

#### Scenario: Page loads the tokens file
- **WHEN** a page links the shared tokens file
- **THEN** every main variable is available to every component on that page

### Requirement: Main variables editor
A main-variables construction page SHALL list all main variables in the same kind of settings table as the component construction pages. Its preview SHALL show a sample of several components, so a change is seen across components. It SHALL save into the shared tokens file through the same Save flow.

#### Scenario: Changing the primary colour
- **WHEN** the user changes the primary colour on the main-variables page
- **THEN** every previewed component whose settings follow the primary colour updates at once

#### Scenario: Saving main variables
- **WHEN** the user saves the main variables
- **THEN** the shared tokens file holds the new values and every page that loads it uses them

### Requirement: Components stay usable without tokens
Components SHALL NOT require the tokens file: every default that refers to a main variable SHALL carry a literal fallback.

#### Scenario: Component on a bare page
- **WHEN** a component is used on a page that loads only its own script
- **THEN** it renders with its fallback values and no errors

### Requirement: Colour roles
The main variables SHALL include the colour roles text, text-soft, muted, page, bg (surface), raised, subtle, subtle-strong, line, border, ink, ink-hover, on-ink, danger, danger-hover, on-danger, success, primary and focus. `shared/tokens.css` SHALL hold their light values. Success text SHALL meet 4.5:1 on the surface in every theme.

#### Scenario: Roles on the tokens page
- **WHEN** the main-variables page is opened
- **THEN** every colour role is listed in its settings table

#### Scenario: Success contrast
- **WHEN** `node tools/check-themes.js` runs
- **THEN** success on bg passes 4.5:1 in every theme

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

### Requirement: Catppuccin theme
`themes.css` SHALL provide a `catppuccin` theme based on Catppuccin Mocha (dark colour scheme) that passes the accessibility check.

#### Scenario: Selecting Catppuccin
- **WHEN** `<html>` has `data-kakao-theme="catppuccin"`
- **THEN** components use the Mocha colours and `color-scheme` is dark
