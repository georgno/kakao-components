# section-header Specification

## Purpose
`<kakao-section-header>` is the heading row of a page section: a real light-DOM heading (h2 to h6) with an optional count or count badge, a description and actions.

## Requirements

### Requirement: Section heading
`<kakao-section-header>` SHALL render its `heading` as a real `<h2>`–`<h6>` element in the light DOM, at the level given by `level` (2 to 6; 2 when missing or out of range), so it is part of the page's heading outline, reachable by `kakao-toc` and fragment links. Changing `level` or `heading` SHALL update the same heading (keeping its `id`). `hidden` SHALL hide the header.

#### Scenario: A level-3 section with a toc
- **WHEN** a page has `<kakao-section-header heading="Findings" level="3" count="12">` and a `kakao-toc levels="2-3"`
- **THEN** the accessibility tree has a heading level 3 named "Findings 12", and the toc lists an entry "Findings" that scrolls to it

### Requirement: Count, description and actions
`count` SHALL show a number after the heading text inside the heading: muted text by default, a `kakao-badge` of that tone when `count-tone` is set; `count-label` SHALL replace the number for screen readers. `description` (or a `slot="description"` child) SHALL show a muted line under the heading. Children with `slot="actions"` SHALL sit at the end of the heading row, and wrap below the text when the row is too narrow.

#### Scenario: Phone width
- **WHEN** a header with a heading, a description and two action buttons is 390px wide
- **THEN** nothing scrolls sideways, the actions wrap below the description, and the Tab order is the source order of the actions
