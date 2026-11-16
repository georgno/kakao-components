# Spec Delta

## ADDED Requirements

### Requirement: Icon-only name as tooltip
An icon-only button SHALL show its name (its `aria-label`, else its `label`) as a hover tooltip through `title` on the inner `<button>`. An own `title` on the host SHALL win; `title=""` SHALL turn the tooltip off. When `kakao-tooltip` is defined, or becomes defined later, the same text SHALL go to `data-tooltip` on the inner `<button>` instead of `title`; an author `data-tooltip` on the host SHALL win over both.

#### Scenario: Without the tooltip script
- **WHEN** a page loads an icon-only `<kakao-button aria-label="Delete">` but not the tooltip script
- **THEN** the inner button has `title="Delete"`

#### Scenario: With the tooltip script
- **WHEN** the same page also loads the tooltip script, before or after the button
- **THEN** the inner button has `data-tooltip="Delete"` and no `title`

#### Scenario: Turned off
- **WHEN** the button has `title=""`
- **THEN** the inner button has neither `title` nor `data-tooltip`
