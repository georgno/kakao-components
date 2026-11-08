# Spec Delta

## Purpose

Global main variables (design tokens) such as primary colour and horizontal padding, which all components can follow, so the overall look changes in one place.

## ADDED Requirements

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
