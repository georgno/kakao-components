# component-overview Specification

## Purpose
The demo pages that show what exists: an overview of all components, one demo page per component, and a kitchen-sink form that uses them together.

## Requirements

### Requirement: Overview page
`components.html` SHALL show one full-width card per component with several examples and a link to its demo page, a link to the kitchen sink, and a "Not built yet" section with placeholder cards showing the native element for each component that does not exist yet.

#### Scenario: New component built
- **WHEN** a component from the "Not built yet" list is implemented
- **THEN** it gets its own card and its placeholder card is removed

### Requirement: Demo pages
Every component SHALL have `components/<name>/demo.html` using `shared/demo.css` and `shared/demo.js`, with examples, an event log and API controls. Demos SHALL use `kakao-button` instead of native buttons, load component scripts with `defer`, and call component methods only after `customElements.whenDefined`.

#### Scenario: Script order
- **WHEN** a demo page loads
- **THEN** every component upgrades with its children already present

### Requirement: Kitchen sink
`kitchen-sink.html` SHALL present a realistic settings form that uses every built component together, including tabs, async switches, a date of birth with unknown parts and a file upload, and SHALL log the collected values on save.

#### Scenario: Save
- **WHEN** the user clicks Save
- **THEN** the values of all fields are logged
