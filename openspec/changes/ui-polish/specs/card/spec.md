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
When the first footer element is a `<kakao-button>` (or a wrapper whose first element is one), the card SHALL show a blurred radial glow at its bottom left in that button's colour. Primary SHALL use ink, danger the danger colour, secondary its fill and ghost its text colour, each through the same variables the button uses. The glow SHALL be decided in CSS (`:has()`), with no script measuring the button. It SHALL therefore appear, disappear and recolour as soon as the button is added, removed, changes variant or the theme changes, and the colour SHALL transition smoothly. It SHALL be absent with `no-glow` and when no button comes first.

#### Scenario: Danger action
- **WHEN** the footer starts with a danger button
- **THEN** a faint red glow rises from the card's bottom left

#### Scenario: Removing the button
- **WHEN** the first footer button is removed by script
- **THEN** the glow fades out, or takes the colour of the footer's new first button
