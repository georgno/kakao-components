# radio-group Specification

## Purpose
Defines how `<kakao-radio-group>` lays out its options: dot alignment against each option label, and the spacing between options.

## Requirements

### Requirement: Dot is optically centred on the first option-label line
Each radio dot SHALL be vertically centred on the optical centre of the first line of its option label, at every size (`sm`, `md`, `lg`): the middle of the capital letters, measured from the label's baseline (`0.5cap` above it by default), not the middle of the line box. The offset SHALL come from the font's own metrics so it holds for any font and size, and SHALL stay adjustable through `--kakao-radio-group-dot-lift` (for example `0.5ex` to centre on the x-height). An option hint or a wrapping option label SHALL NOT move the dot away from that first line, and the dot SHALL NOT make the first line taller.

#### Scenario: Option with hint
- **WHEN** an option has a `hint`
- **THEN** the centre of its dot's ink is within 1px of the centre of the ink of the option label's first capital letter

#### Scenario: Each size and orientation
- **WHEN** the group is shown at size `sm`, `md` or `lg`, vertical or horizontal
- **THEN** every dot is centred on the capitals of its option label's first line

#### Scenario: Error and disabled
- **WHEN** the group has an `error` or is `disabled`
- **THEN** every dot keeps the same optical alignment

### Requirement: Compact option spacing
By default, vertically stacked options SHALL leave 8px between one option's text and the next option's text, the same gap the project's pages use between stacked checkboxes. The spacing SHALL stay adjustable through `--kakao-radio-group-option-gap` and `--kakao-radio-group-option-padding`.

#### Scenario: Default vertical group
- **WHEN** a vertical radio group is shown with default settings
- **THEN** the space between the bottom of one option's text and the top of the next option's label is 8px

#### Scenario: Override kept
- **WHEN** a page sets `--kakao-radio-group-option-gap` or `--kakao-radio-group-option-padding`
- **THEN** the group uses those values instead of the defaults
