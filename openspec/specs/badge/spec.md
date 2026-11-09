# badge Specification

## Purpose
`<kakao-badge>` is a small pill-shaped status label, such as "New", "Proposed" or "Missing", whose colours follow the theme.

## Requirements

### Requirement: Badge tones
The badge SHALL show its slotted text in a pill (radius 999px) and SHALL support `tone` neutral (default), primary, success, danger and ink. Soft tones SHALL tint the surface with the tone colour and darken or lighten the text towards the theme text colour, so every tone stays readable in every theme. `outline` SHALL draw a hairline border with muted text and no fill. Text SHALL be sentence case, never transformed to capitals.

#### Scenario: Success badge in a dark theme
- **WHEN** `<kakao-badge tone="success">Yes</kakao-badge>` is shown in the dark theme
- **THEN** it uses the dark theme's success colour and its text stays readable

#### Scenario: Outline badge
- **WHEN** a badge has `outline`
- **THEN** it has a border, no fill, and muted text

### Requirement: Badge is not interactive
The badge SHALL be a non-interactive inline element: it SHALL not take focus and SHALL be read as plain text.

#### Scenario: Tabbing past a badge
- **WHEN** a keyboard user tabs through a heading with a badge
- **THEN** focus never stops on the badge
