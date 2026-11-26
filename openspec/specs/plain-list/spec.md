# plain-list Specification

## Purpose
`<kakao-plain-list>` is a plain styled list of short items, with optional leading badges or icons in one column, drawn by light-DOM CSS alone.

## Requirements

### Requirement: Plain list
`<kakao-plain-list>` SHALL style the `<ul>` or `<ol>` it wraps from plain-list.css alone: no outer margins, one token gap between visible items (`size`: `sm`, `md` by default), muted markers (`marker="none"` hides them), items that wrap long unbroken text. The list SHALL keep list semantics (the script adds `role="list"` to it). `hidden` SHALL hide the list or an item.

#### Scenario: Server-rendered references without JS
- **WHEN** a page loads plain-list.css but not plain-list.js and renders `<kakao-plain-list><ul><li>src/app.js:42</li>…</ul></kakao-plain-list>` 390px wide
- **THEN** the items show with bullets and even gaps, and a long path wraps instead of scrolling sideways

### Requirement: Leading badges and icons
When the items' first element is a `kakao-badge`, an `<i>` or an element with `data-lead`, the list SHALL draw the leads as one column as wide as the widest lead, without markers, with the item text beside it on the lead's baseline and wrapped lines aligned with the text.

#### Scenario: Test results with status badges
- **WHEN** each item starts with a `kakao-badge` ("Pass", "Fail", "Skipped") followed by a test name
- **THEN** the names start at one x position in every row, and a name that wraps continues under the name, not under the badge
