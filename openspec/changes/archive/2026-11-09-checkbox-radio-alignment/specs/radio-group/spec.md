# Spec Delta

## Purpose

Defines how `<kakao-radio-group>` lays out its options: dot alignment against each option label, and the spacing between options.

## ADDED Requirements

### Requirement: Dot aligns to the first option-label line
Each radio dot SHALL be vertically centred on the first line of its option label at every size (`sm`, `md`, `lg`). An option hint or a wrapping option label SHALL NOT move the dot away from that first line.

#### Scenario: Option with hint
- **WHEN** an option has a `hint`
- **THEN** its dot is within 1px of the centre of the option label's first line

#### Scenario: Each size
- **WHEN** the group is shown at size `sm`, `md` or `lg`
- **THEN** every dot is centred on its option label's first line

### Requirement: Compact option spacing
By default, vertically stacked options SHALL leave 8px between one option's text and the next option's text, the same gap the project's pages use between stacked checkboxes. The spacing SHALL stay adjustable through `--kakao-radio-group-option-gap` and `--kakao-radio-group-option-padding`.

#### Scenario: Default vertical group
- **WHEN** a vertical radio group is shown with default settings
- **THEN** the space between the bottom of one option's text and the top of the next option's label is 8px

#### Scenario: Override kept
- **WHEN** a page sets `--kakao-radio-group-option-gap` or `--kakao-radio-group-option-padding`
- **THEN** the group uses those values instead of the defaults
