## ADDED Requirements

### Requirement: Transition triggers
Around an animated theme switch (a ripple or a colour fade) the switch SHALL emit the triggers `theme-transition-start`, before the transition begins and before the ripple's snapshot is taken, and `theme-transition-end`, once no ripple and no fade is running. Ripples that follow each other from the queue SHALL count as one transition. A theme that changes at once (reduced motion, `animate: false`, a fade of duration 0) SHALL emit neither.

#### Scenario: Ripple
- **WHEN** the theme is switched with the ripple
- **THEN** `theme-transition-start` is emitted before the view transition starts and `theme-transition-end` after it finished

#### Scenario: Reduced motion
- **WHEN** the theme is switched under `prefers-reduced-motion: reduce`
- **THEN** only `theme-change` is emitted
