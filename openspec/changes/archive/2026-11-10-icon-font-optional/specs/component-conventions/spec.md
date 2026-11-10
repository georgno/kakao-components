# Spec Delta

## ADDED Requirements

### Requirement: Own glyphs as inline SVG
A component SHALL draw every glyph it shows on its own (checks, chevrons, spinners, close marks, status icons) as inline SVG coloured with `currentColor`, and SHALL NOT need an icon font or any other stylesheet beyond its own. Icons supplied by the page SHALL come through a slot (or, where offered, an optional icon-class shortcut that is documented as needing an icon font).

#### Scenario: Page without an icon font
- **WHEN** a page loads a component without loading Font Awesome or any other icon font
- **THEN** every glyph the component draws itself is visible
