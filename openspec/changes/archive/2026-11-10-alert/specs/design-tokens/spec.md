# Spec Delta

## MODIFIED Requirements

### Requirement: Colour roles
The main variables SHALL include the colour roles text, text-soft, muted, page, bg (surface), raised, subtle, subtle-strong, line, border, ink, ink-hover, on-ink, danger, danger-hover, on-danger, success, warning, primary and focus. `shared/tokens.css` SHALL hold their light values. Success and warning text SHALL meet 4.5:1 on the surface in every theme.

#### Scenario: Roles on the tokens page
- **WHEN** the main-variables page is opened
- **THEN** every colour role is listed in its settings table

#### Scenario: Success contrast
- **WHEN** `node tools/check-themes.js` runs
- **THEN** success on bg passes 4.5:1 in every theme

#### Scenario: Warning contrast
- **WHEN** `node tools/check-themes.js` runs
- **THEN** warning on bg passes 4.5:1 in every theme
