# Spec Delta

## ADDED Requirements

### Requirement: Themed colours
Every colour setting of a component SHALL default to a theme colour role (`var(--kakao-color-<role>, <literal>)`) or to an expression of other settings. The only exceptions are fixed, theme-independent colours such as white switch thumbs and file-type tags. Hard-coded colours outside the settings block SHALL NOT be used for anything the theme should change.

#### Scenario: Dark page
- **WHEN** a page selects the dark theme
- **THEN** every component on it uses dark colours without any component-specific setting
