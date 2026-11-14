## ADDED Requirements

### Requirement: Force attribute
Every component SHALL accept a boolean `force` attribute that marks a placement as a deliberate exception to the style rules. It SHALL have no effect in the browser: no change in rendering, behaviour, events or accessibility. Each component's documentation SHALL list it.

#### Scenario: No runtime effect
- **WHEN** `force` is added to a dialog
- **THEN** the dialog looks and behaves exactly as without it, and only the style checker treats it differently
