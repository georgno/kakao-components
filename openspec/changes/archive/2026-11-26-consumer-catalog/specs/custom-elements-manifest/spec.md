## MODIFIED Requirements

### Requirement: One header format
Every component header SHALL follow the shared format (sections between dash lines, entries indented 1-4 spaces, a CATALOG section and a FILES section). An entry naming several attributes (`name · required · disabled`) MAY put its description on the following, deeper-indented lines. A component that renders slots SHALL list them in a SLOTS section (`(default)` for the unnamed slot). A header that doesn't parse is fixed in the header; the tool reports a missing FILES or CATALOG section, a CATALOG section without its `for` or `not for` line, or an unknown component in FILES as an error.

#### Scenario: Missing FILES section
- **WHEN** a component header has no FILES section
- **THEN** `node tools/manifest.js` exits with an error naming the file

#### Scenario: Several names, description below
- **WHEN** a header lists `name · required · disabled` with its description on the next line
- **THEN** the manifest has the three attributes with that description

#### Scenario: Slots
- **WHEN** a component's shadow root has a default slot and a `footer` slot
- **THEN** its manifest entry lists both

## ADDED Requirements

### Requirement: Catalog text per component
A header's CATALOG section SHALL hold `for` (one line: what the component is for) and `not for` (when not to use it, and what to use instead), each possibly continued on deeper-indented lines. The manifest SHALL carry `for` as the main declaration's `summary` and `not for` as `kakao.notFor`.

#### Scenario: Badge
- **WHEN** the badge header's CATALOG says `not for  Clickable, removable or filter labels: kakao-chip.`
- **THEN** kakao-badge's `kakao.notFor` is that text
