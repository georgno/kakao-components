## ADDED Requirements

### Requirement: Edge fade when scrolling sideways
When the tab row does not fit its space and scrolls sideways, it SHALL fade out its edge on each side where more is hidden, SHALL NOT fade a side scrolled to its end, and SHALL show no fade when nothing overflows. The fade SHALL follow scrolling and size changes. Its width SHALL be the `--kakao-tabs-scroll-fade` setting, which defaults to the main variable `--kakao-scroll-fade`.

#### Scenario: Overflowing, scrolled to the start
- **WHEN** the tab row overflows and is scrolled to its start
- **THEN** only its end edge is faded

#### Scenario: Scrolled partway
- **WHEN** it is scrolled partway
- **THEN** both edges are faded

#### Scenario: Everything fits
- **WHEN** the tab row fits its space
- **THEN** neither edge is faded
