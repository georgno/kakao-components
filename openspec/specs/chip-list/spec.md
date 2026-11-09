# chip-list Specification

## Purpose
`<kakao-chip-list>` holds a wrapping row of chips and animates them into place when one leaves or arrives, so removing a chip never makes the row jump.

## Requirements

### Requirement: Chip list layout
The chip list SHALL lay out its child chips in a row that wraps, with a column gap and a row gap, and SHALL look the same as a plain wrapping flex row of chips. It SHALL have role="list" (named by `label`) and give each child role="listitem". It SHALL be light DOM, with its settings in `chip-list.css`.

#### Scenario: Same look as a plain row
- **WHEN** a plain flex row of chips is replaced by a chip list with the same chips
- **THEN** nothing on the page looks different

### Requirement: Smooth removal across rows
When a chip leaves the list, by its own remove button, by script or by replacing the children, the remaining chips SHALL glide from where they are drawn to their new positions, in both directions, so a chip that moves to the row above slides there. A chip moving along its row MAY use the spring curve; a chip moving into another row SHALL NOT overshoot. The leaving chip SHALL fade out where it was, outside the flow. The list's height SHALL animate when a row appears or closes. A change during an animation SHALL continue from the positions currently drawn. New chips SHALL fade in.

#### Scenario: A chip moves up a row
- **WHEN** a chip at the end of the first row is removed and the first chip of the second row now fits
- **THEN** that chip slides up into the first row instead of jumping

#### Scenario: Removing twice quickly
- **WHEN** a second chip is removed while the first glide is running
- **THEN** the chips continue from where they are drawn, without a jump

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** the chips take their new places at once
