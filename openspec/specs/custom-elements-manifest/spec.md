# custom-elements-manifest Specification

## Purpose
A machine-readable description of every component, its API and the files it needs, generated from the component headers, so tools and agents in other projects can use the library without reading its sources.

## Requirements

### Requirement: Generated manifest
`node tools/manifest.js` SHALL write `custom-elements.json` in the Custom Elements Manifest format (schema 2.1.0) with one module per component and a declaration per element it defines: attributes (allowed values and default where the header lists them), properties, methods, events (with their detail), slots, CSS custom properties (from the settings block, with defaults) and parts.

#### Scenario: A component with a tone
- **WHEN** a header lists `tone  neutral (default) · primary · success`
- **THEN** the attribute's type lists the three values and its default is neutral

#### Scenario: A file with two elements
- **WHEN** a component file defines a second element (kakao-tab beside kakao-tabs)
- **THEN** that element has its own declaration with the attributes of the section that names it

### Requirement: Files and dependencies per element
Every declaration SHALL carry a `kakao` field with its script, the light-DOM CSS a page must load, whether it renders into the light DOM, the components it requires (load first, in order) and the components it uses when they are loaded, all taken from the header's FILES section.

#### Scenario: Toast
- **WHEN** the manifest describes kakao-toast
- **THEN** it requires kakao-stack and kakao-alert, in that order

### Requirement: One header format
Every component header SHALL follow the shared format (sections between dash lines, entries indented 1-4 spaces, a FILES section). An entry naming several attributes (`name · required · disabled`) MAY put its description on the following, deeper-indented lines. A component that renders slots SHALL list them in a SLOTS section (`(default)` for the unnamed slot). A header that doesn't parse is fixed in the header; the tool reports a missing FILES section or an unknown component in it as an error.

#### Scenario: Missing FILES section
- **WHEN** a component header has no FILES section
- **THEN** `node tools/manifest.js` exits with an error naming the file

#### Scenario: Several names, description below
- **WHEN** a header lists `name · required · disabled` with its description on the next line
- **THEN** the manifest has the three attributes with that description

#### Scenario: Slots
- **WHEN** a component's shadow root has a default slot and a `footer` slot
- **THEN** its manifest entry lists both

### Requirement: Manifest kept current
`node tools/manifest.js --check` SHALL exit with code 1 when `custom-elements.json` differs from what the headers produce; the pre-commit hook and the deploy SHALL run it, and the deploy SHALL publish the file.

#### Scenario: Header edited without regenerating
- **WHEN** an attribute is renamed in a header and the manifest is not regenerated
- **THEN** `--check` fails and the commit or deploy stops
