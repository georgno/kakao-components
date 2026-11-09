# checkbox Specification

## Purpose
Defines how `<kakao-checkbox>` lays out its box against its label, hint and error text.

## Requirements

### Requirement: Box is optically centred on the first label line
The checkbox box SHALL be vertically centred on the optical centre of the first line of the main label, at every size (`sm`, `md`, `lg`): the middle of the capital letters, measured from the label's baseline (`0.5cap` above it by default), not the middle of the line box. The offset SHALL come from the font's own metrics so it holds for any font and size, and SHALL stay adjustable through `--kakao-checkbox-box-lift` (for example `0.5ex` to centre on the x-height). A hint, an error or a label that wraps onto more lines SHALL NOT move the box away from that first line, and the box SHALL NOT make the first line taller.

#### Scenario: Plain label at each size
- **WHEN** a checkbox with only a `label` is shown at size `sm`, `md` or `lg`
- **THEN** the centre of the box's ink is within 1px of the centre of the ink of the label's first capital letter

#### Scenario: Label with hint
- **WHEN** a checkbox has both `label` and `hint`
- **THEN** the box stays centred on the capitals of the label line, not on the label-plus-hint block

#### Scenario: Wrapping label
- **WHEN** the label wraps onto two lines
- **THEN** the box stays centred on the capitals of the first line

#### Scenario: Error and disabled
- **WHEN** the checkbox has an `error` or is `disabled`
- **THEN** the box keeps the same optical alignment
