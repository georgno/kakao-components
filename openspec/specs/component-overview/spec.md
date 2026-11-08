# component-overview Specification

## Purpose
The demo pages that show what exists: an overview of all components, one demo page per component, and a kitchen-sink form that uses them together.

## Requirements

### Requirement: Overview page
`index.html` SHALL show one full-width card per component with several examples, a link to its demo page and a link to its construction page. It SHALL also link to the kitchen sink and the main-variables page, and SHALL have a "Not built yet" section with placeholder cards showing the native element for each component that does not exist yet.

#### Scenario: New component built
- **WHEN** a component from the "Not built yet" list is implemented
- **THEN** it gets its own card and its placeholder card is removed

#### Scenario: Construction link
- **WHEN** the user clicks a card's construction link
- **THEN** that component's construction page opens

### Requirement: Demo pages
Every component SHALL have `components/<name>/demo.html` using `shared/demo.css` and `shared/demo.js`, with examples, an event log, API controls and a link to the component's construction page. Demos SHALL use `kakao-button` instead of native buttons, load component scripts with `defer`, and call component methods only after `customElements.whenDefined`.

#### Scenario: Script order
- **WHEN** a demo page loads
- **THEN** every component upgrades with its children already present

### Requirement: Kitchen sink
`kitchen-sink.html` SHALL present a realistic settings form that uses every built component together, including tabs, async switches, a date of birth with unknown parts and a file upload, and SHALL log the collected values on save.

#### Scenario: Save
- **WHEN** the user clicks Save
- **THEN** the values of all fields are logged
