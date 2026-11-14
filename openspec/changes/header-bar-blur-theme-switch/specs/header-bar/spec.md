## ADDED Requirements

### Requirement: Scrolled look across a theme switch
When the theme changes while the bar is scrolled, the bar SHALL keep its blurred, translucent background in the new theme, or, where the blur cannot be kept, SHALL show its solid scrolled background instead. It SHALL never show a translucent background without the blur.

#### Scenario: Theme switch while scrolled
- **WHEN** the page is scrolled and the visitor switches the theme
- **THEN** the bar shows either the blur in the new theme or the solid scrolled background, and content under it is never visible unblurred through a translucent bar
