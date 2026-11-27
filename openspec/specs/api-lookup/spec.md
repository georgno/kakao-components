# api-lookup Specification

## Purpose

One component's API, short enough for an agent with little context to read before writing the markup.

## Requirements

### Requirement: API lookup
`node tools/api.js <tag|folder…>` SHALL print, for each component, its tag, DOM kind and CSS file, its purpose and "not for" line, its attributes with their allowed values, slots, events, methods and properties, and the USAGE (or BASIC USAGE) example from its header without `<link>`/`<script>` lines, all from custom-elements.json and the component's script. `--list` SHALL print every tag with its purpose; `--css` SHALL add the CSS custom properties. Each component's output without `--css` SHALL stay under 8,000 characters. An unknown name SHALL exit with code 2 and name it. It SHALL use Node only, no packages, and work from a vendored copy.

#### Scenario: A small model looks up one tag
- **WHEN** `node kakao/tools/api.js kakao-section-header` runs in a project
- **THEN** it prints the attributes with values (count-tone neutral · primary · success · warning · danger), the slots and an example, in about 1k tokens
