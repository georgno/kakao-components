# Spec Delta

## Purpose

`<kakao-card>` is a content card whose footer button can tint it with a subtle glow.

## ADDED Requirements

### Requirement: Card structure
The card SHALL have a `header` slot, a default body slot and a `footer` slot. Empty header and footer areas SHALL take no space. The footer SHALL sit at the bottom, and body children SHALL be spaced by the card's gap. The card's colours SHALL follow the theme.

#### Scenario: Body only
- **WHEN** a card has only body content
- **THEN** no empty header or footer space is shown

### Requirement: Button glow
When the first footer element is a `<kakao-button>` (or a wrapper whose first element is one), the card SHALL show a blurred radial glow centred on that button, in its background colour (its text colour for a transparent button). The glow SHALL follow variant, theme and layout changes. It SHALL be absent with `no-glow` and when no button comes first.

#### Scenario: Danger action
- **WHEN** the footer starts with a danger button
- **THEN** a faint red glow rises from behind the button in the card's bottom left
