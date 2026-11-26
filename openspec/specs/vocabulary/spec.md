# vocabulary Specification

## Purpose

The names every component shares, so a page author (or an agent) who knows one component can guess the next: tones, sizes, label and text attributes, JSON attributes, events and slots. `tools/tests/vocabulary.test.js` checks them on custom-elements.json.

## Requirements

### Requirement: Tones
A `tone` attribute SHALL take values from the status set neutral · primary · success · warning · danger, and a component that offers success and danger SHALL also offer warning. A component MAY add a value for a documented reason, listed in the test with that reason: ink (badge, chip: the solid label), info (alert, toast: a message's severity, drawn in the primary colour), auto (avatar: picked from the name), none and muted (spinner: the ring follows the text colour). The danger tone SHALL be called danger; error is accepted only as an existing alias (alert, toast, progress).

#### Scenario: Badge warning
- **WHEN** a page writes `<kakao-badge tone="warning">`
- **THEN** the badge is tinted with the warning colour and the style checker accepts it

#### Scenario: A new tone without a reason
- **WHEN** a header adds `tone  … · error` or a tone outside the set and the list of extras
- **THEN** `node --test` fails and names the component

### Requirement: Sizes
A `size` attribute SHALL use sm · md · lg with md the default; a component MAY offer only sm · md (kbd, number-input, description-list, empty-state) and avatars MAY add xs and xl.

#### Scenario: Size values
- **WHEN** the manifest lists a component's size
- **THEN** every value is one of xs, sm, md, lg, xl, md is among them and md is the default

### Requirement: Names of attributes
JSON configuration SHALL be `list-data`, never `data`. An accessible name is `label` (or `aria-label`); a secondary name is `<thing>-label` and a visible secondary text is `<thing>-text` (close-label, empty-text, empty-label), never `label-<thing>`. A wrap-at-every-width layout is `layout="stacked"`, with `auto` the default. Attribute names are kebab-case.

#### Scenario: Range slider thumb names
- **WHEN** a range slider names its thumbs
- **THEN** it uses `low-label` and `high-label`

### Requirement: Events
Event names SHALL be kebab-case, `<component or thing>-<verb>`, without a `kakao-` prefix; the button's `kakao-button-*` events are the one listed legacy exception. Every event SHALL be listed in the header's EVENTS section, plain `input` / `change` included where the component sends them.

#### Scenario: A new event with a prefix
- **WHEN** a header lists an event `kakao-foo-change`
- **THEN** `node --test` fails

### Requirement: Value table follows the manifest
Every attribute that custom-elements.json lists with a fixed set of values SHALL be in the style checker's VALUES table with the same values, and every VALUES entry SHALL be an attribute the header documents.

#### Scenario: Value added to a header only
- **WHEN** a header gains a size and the manifest is regenerated, but VALUES is not updated
- **THEN** `node --test` fails and names the attribute

### Requirement: Slots listed
Every slot a component renders SHALL be listed in a SLOTS section of its header.

#### Scenario: Card
- **WHEN** the manifest describes kakao-card
- **THEN** it lists the default, header and footer slots
