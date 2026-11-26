# Spec Delta

## MODIFIED Requirements

### Requirement: Attribute value rule
The built-in rule `attribute-values` SHALL report an attribute with a fixed set of values whose static value is not one of them. The sets SHALL live in one table (VALUES) that covers every attribute custom-elements.json lists with a fixed set of values, with the same values; a test SHALL fail when the two differ.

#### Scenario: Unknown tone
- **WHEN** a badge has `tone="info"`
- **THEN** `attribute-values` reports that info is not one of neutral, primary, success, warning, danger, ink

#### Scenario: A later component
- **WHEN** a skeleton has `shape="square"`
- **THEN** `attribute-values` reports that square is not one of text, circle, block, row, card

#### Scenario: Value added to a header only
- **WHEN** a header gains a size and the manifest is regenerated, but VALUES is not updated
- **THEN** `node --test` fails and names the attribute
