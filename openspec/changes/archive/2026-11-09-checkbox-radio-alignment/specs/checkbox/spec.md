# Spec Delta

## Purpose

Defines how `<kakao-checkbox>` lays out its box against its label, hint and error text.

## ADDED Requirements

### Requirement: Box aligns to the first label line
The checkbox box SHALL be vertically centred on the first line of the main label at every size (`sm`, `md`, `lg`). A hint, an error or a label that wraps onto more lines SHALL NOT move the box away from that first line.

#### Scenario: Plain label at each size
- **WHEN** a checkbox with only a `label` is shown at size `sm`, `md` or `lg`
- **THEN** the centre of the box is within 1px of the centre of the label's first line

#### Scenario: Label with hint
- **WHEN** a checkbox has both `label` and `hint`
- **THEN** the box stays centred on the label line, not on the label-plus-hint block

#### Scenario: Wrapping label
- **WHEN** the label wraps onto two lines
- **THEN** the box stays centred on the first line
