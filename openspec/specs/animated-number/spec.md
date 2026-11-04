# animated-number Specification

## Purpose
`<kakao-animated-number>` shows a number whose digits roll like an odometer when it changes.

## Requirements

### Requirement: Formatted, animated value
The component SHALL format `value` with `Intl.NumberFormat` using `locale` (default en-US), `decimals` and `sign-display`, and SHALL roll the changed digits over `duration` ms (default 600) when the value changes through the attribute or `update(n)`.

#### Scenario: Price change
- **WHEN** `update(19.99)` is called on an element showing 9.99 with `decimals="2"`
- **THEN** the digits roll to 19.99
