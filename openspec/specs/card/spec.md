# card Specification

## Purpose
`<kakao-card>` is a content card whose footer button can tint it with a subtle glow.

## Requirements

### Requirement: Card structure
The card SHALL have a `header` slot, a default body slot and a `footer` slot. Empty header and footer areas SHALL take no space. The footer SHALL sit at the bottom, and body children SHALL be spaced by the card's gap. The card's colours SHALL follow the theme.

#### Scenario: Body only
- **WHEN** a card has only body content
- **THEN** no empty header or footer space is shown

### Requirement: Button glow
When the first footer element is a `<kakao-button>` (or a wrapper whose first element is one), the card SHALL show a blurred radial glow at its bottom left in that button's colour. Primary SHALL use ink, danger the danger colour and secondary its fill, each through the same variables the button uses; a ghost button SHALL give no glow. The glow SHALL be decided in CSS (`:has()`), with no script measuring the button. It SHALL therefore appear, disappear and recolour as soon as the button is added, removed, changes variant or the theme changes, and the colour SHALL transition smoothly. It SHALL be absent with `no-glow` and when no button comes first.

#### Scenario: Danger action
- **WHEN** the footer starts with a danger button
- **THEN** a faint red glow rises from the card's bottom left

#### Scenario: Removing the button
- **WHEN** the first footer button is removed by script
- **THEN** the glow fades out, or takes the colour of the footer's new first button

### Requirement: Smooth height changes
When content inside the card is added or removed, the card SHALL animate from its old to its new height without a jump frame, continuing from its current height if a change arrives mid-animation. It SHALL NOT animate when its height comes from outside (stretched in a grid row), on width changes, with `no-animate`, or with reduced motion.

#### Scenario: Removing a line
- **WHEN** a list item inside a card is removed
- **THEN** the card glides to its smaller height in about 0.3s

#### Scenario: Stretched card
- **WHEN** the card is stretched by a taller neighbour in a grid row and a line is removed
- **THEN** the card keeps its height

#### Scenario: Page load
- **WHEN** components draw and content is added while the page loads (until two frames after the load event)
- **THEN** the card takes each height at once, without gliding

#### Scenario: Content that animates its own size
- **WHEN** content resizes the card on consecutive frames (an opening kakao-accordion)
- **THEN** the card follows it frame by frame instead of running its own glide

### Requirement: Theme glow is opt-in
A card SHALL glow in the colour of a `theme-change` trigger only with the `theme-glow` attribute and when no footer button decides the glow colour. Without `theme-glow`, a theme change SHALL NOT change the card. `no-glow` SHALL win over both.

#### Scenario: Plain card and a theme switch
- **WHEN** the theme switches and a card has no `theme-glow`
- **THEN** the card shows no glow
