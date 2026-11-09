## ADDED Requirements

### Requirement: Navigation overflow cue
When the navigation region's links do not fit and it scrolls sideways, the bar SHALL fade the region's edge on each side where more links are hidden, and SHALL show no fade on a side that is scrolled to its end, nor at all when nothing overflows. The fade SHALL update on scroll and on size changes without per-frame work while idle. Its width SHALL be the `--kakao-header-bar-nav-fade` setting.

#### Scenario: Narrow screen, scrolled to the start
- **WHEN** the links overflow and the navigation is scrolled to its start
- **THEN** only the end edge is faded

#### Scenario: Scrolled to the middle
- **WHEN** the visitor scrolls the navigation partway
- **THEN** both edges are faded

#### Scenario: Everything fits
- **WHEN** all links fit in the navigation region
- **THEN** neither edge is faded

### Requirement: Published height
A header bar that is a direct child of `<body>` SHALL publish its rendered height as the custom property `--kakao-header-bar-rendered-height` (a length in px) on the root element, keep it current when the bar's size changes, and remove it when the bar is removed. Other header bars SHALL NOT publish it.

#### Scenario: Page offsets follow the height setting
- **WHEN** the bar's height setting is changed and the page reloaded
- **THEN** `--kakao-header-bar-rendered-height` on the root element equals the bar's new rendered height, and page CSS that uses it (scroll padding) follows
