## ADDED Requirements

### Requirement: Hydrate a declarative shadow root
A shadow DOM component SHALL adopt a shadow root that the HTML parser already attached from a `<template shadowrootmode="open">`, instead of building its shadow root again, and SHALL then behave exactly as if it had built the root itself. Without a declarative root it SHALL build its root as before.

#### Scenario: Server-rendered component
- **WHEN** a page contains a component with a declarative shadow root and its script loads later
- **THEN** the component is painted finished before the script runs, does not move or resize when the script runs, and responds to attributes and events as usual

#### Scenario: Plain markup
- **WHEN** a page contains the component without a declarative shadow root
- **THEN** it renders as it does today

### Requirement: Server-renderable initial markup
A shadow DOM component SHALL be able to produce its initial shadow markup for given attributes and light content from the same source its browser code uses, so markup rendered on the server and markup built in the browser match.

#### Scenario: Same output
- **WHEN** the initial markup for a set of attributes is rendered on the server and the component is built in the browser with the same attributes
- **THEN** both shadow roots have the same structure and styles
