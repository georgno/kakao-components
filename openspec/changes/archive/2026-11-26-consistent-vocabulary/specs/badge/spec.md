# Spec Delta

## MODIFIED Requirements

### Requirement: Badge tones
The badge SHALL show its slotted text in a pill (radius 999px) and SHALL support `tone` neutral (default), primary, success, warning, danger and ink. Soft tones SHALL tint the surface with the tone colour and darken or lighten the text towards the theme text colour, so every tone stays readable in every theme. `outline` SHALL draw a hairline border with muted text and no fill. Text SHALL be sentence case, never transformed to capitals.

#### Scenario: Success badge in a dark theme
- **WHEN** `<kakao-badge tone="success">Yes</kakao-badge>` is shown in the dark theme
- **THEN** it uses the dark theme's success colour and its text stays readable

#### Scenario: Warning badge
- **WHEN** `<kakao-badge tone="warning">Due soon</kakao-badge>` is shown
- **THEN** it is tinted with the theme's warning colour like the other soft tones

#### Scenario: Outline badge
- **WHEN** a badge has `outline`
- **THEN** it has a border, no fill, and muted text
