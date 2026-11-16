# toc Specification

## Purpose
`<kakao-toc>` is an "On this page" table of contents for long pages such as a blog article: it lists the page's sections, links to them and marks the one the reader is in.

## Requirements

### Requirement: Entries from headings
Without `list-data` and without a list inside it, the component SHALL list the headings of its target: the element whose id is `for`, else the first match of `for` as a CSS selector, else the page's `main` (else `body`). It SHALL take the heading levels in `levels` (a range `2-3`, the default, or a list `2,4`) or, when set, the headings matching the CSS selector `headings`. Entries SHALL nest by heading level, in document order.

#### Scenario: Default levels
- **WHEN** `<kakao-toc for="post">` points at an article with h2 "Intro", h3 "Setup" and h2 "Outro"
- **THEN** it lists "Intro" with "Setup" nested under it, then "Outro"

#### Scenario: Skipped level
- **WHEN** the article's first listed heading is an h3
- **THEN** it is listed at the top level instead of being dropped

#### Scenario: Custom selector
- **WHEN** `headings=".component-head h2"` is set
- **THEN** only headings matching that selector are listed

### Requirement: Left-out headings
Headings with `data-toc-ignore`, headings inside an element with `data-toc-ignore`, headings inside the component itself and headings that are not rendered (inside a closed dialog or a `hidden` element) SHALL NOT be listed. The entry text SHALL be the heading's text content, trimmed and with runs of white space collapsed, or its `data-toc-title` when set.

#### Scenario: Ignored heading
- **WHEN** a heading has `data-toc-ignore`
- **THEN** it has no entry

### Requirement: Stable heading ids
A listed heading without an id SHALL get one from its text: lower case, accents removed, every run of other characters a single hyphen, trimmed, "section" when nothing is left, with `-2`, `-3`, … when the id is already taken in the document. Existing ids SHALL be kept, and an id given once SHALL stay when the list is rebuilt.

#### Scenario: Slug
- **WHEN** a heading "Café & Crème brûlée" has no id
- **THEN** it gets the id "cafe-creme-brulee" and its entry links to `#cafe-creme-brulee`

#### Scenario: Duplicate text
- **WHEN** two headings read "Notes"
- **THEN** their ids are "notes" and "notes-2"

### Requirement: Hand-written entries
The component SHALL take its entries from `list-data`, a JSON array of `{ "title", "href" }` or `{ "title", "id" }` objects with optional `children` (or `["Title", "#id"]` pairs), or from the `items` property with the same shapes; without those it SHALL read a nested `<ul>` or `<ol>` of links inside the element. Only same-page links (`#id`) SHALL take part in the scrollspy. Invalid JSON SHALL give an empty list and a console warning.

#### Scenario: list-data
- **WHEN** `list-data='[{"title":"Intro","href":"#intro","children":[{"title":"Setup","id":"setup"}]}]'`
- **THEN** "Intro" is listed with "Setup" nested under it, linking to `#intro` and `#setup`

#### Scenario: Server-rendered list
- **WHEN** the element contains `<ol><li><a href="#a">A</a></li></ol>` and no `list-data`
- **THEN** it lists "A", and before the script runs the plain list is shown

### Requirement: Navigation landmark
The entries SHALL be rendered as nested lists of links inside a `<nav>` named by `label` (default "On this page", changeable through `KakaoToc.texts`). With `heading` set, a visible title SHALL be shown above the list, exposed as a heading of level `heading-level` (default 2). Every entry SHALL be a real link in the tab order.

#### Scenario: Default name
- **WHEN** a toc has no `label`
- **THEN** its navigation landmark is named "On this page"

### Requirement: Scrollspy
The entry of the section the reader is in SHALL be active: the last listed heading whose top has passed the offset line (`offset` in pixels, default the page bar's published height plus 16px). Before the first heading, none SHALL be active. When the page is scrolled to the bottom, the last listed heading SHALL be active. The active link SHALL carry `aria-current="location"`; no other link SHALL.

#### Scenario: Scrolling
- **WHEN** the reader scrolls past the heading "Setup"
- **THEN** the "Setup" link carries `aria-current="location"` and "Intro" no longer does

#### Scenario: Short last section
- **WHEN** the last section is too short to reach the offset line and the page is scrolled to the end
- **THEN** the last entry is active

### Requirement: Following changes
The component SHALL rebuild its entries when headings are added, removed or retitled in the target, and SHALL mark the matching entry active on hash navigation and on history back / forward. `refresh()` SHALL rebuild on demand. Setting `activeId` SHALL mark that entry by hand until the reader scrolls.

#### Scenario: Added heading
- **WHEN** a script appends an h2 "Comments" to the article
- **THEN** "Comments" appears as the last entry

### Requirement: Going to a section
Activating an entry SHALL scroll its heading below the offset, smoothly unless the user prefers reduced motion, add the hash to the address as a new history entry without a jump, move focus to the heading (without scrolling it again) and make that entry active. `scrollToId(id)` SHALL do the same from script. Modified clicks (new tab, new window) SHALL be left to the browser.

#### Scenario: Click
- **WHEN** the reader clicks "Outro"
- **THEN** the page scrolls to "Outro", the address ends in `#outro`, focus is on the heading and "Outro" is active

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion and clicks an entry
- **THEN** the page jumps there without an animation

### Requirement: Sticky placement
With `sticky` the component SHALL stick below the offset line while its container scrolls, and its list SHALL scroll inside it when it is taller than the space left in the viewport, keeping the active entry in view.

#### Scenario: Sidebar
- **WHEN** a sticky toc sits in a sidebar and the page is scrolled
- **THEN** it stays in view below the page bar

### Requirement: Deep levels
With `nested="active"` entries below the top level SHALL be shown only under the top-level entry that is active or holds the active entry; `nested="all"` (default) SHALL show every level.

#### Scenario: Only the active branch
- **WHEN** `nested="active"` and the reader is in "Intro"
- **THEN** "Setup" (under "Intro") is shown and the children of "Outro" are not

### Requirement: Folding
`collapse` SHALL be `never` (default), `always` or `auto`. When folded (`always`, or `auto` while the viewport is narrower than `collapse-below`, default `48rem`) the list SHALL be hidden behind a toggle button with `aria-expanded` that shows the title and the active entry; activating an entry or pressing Escape SHALL close it, Escape returning focus to the toggle.

#### Scenario: Narrow screen
- **WHEN** `collapse="auto"` and the viewport is 390px wide
- **THEN** only the toggle is shown, reading "On this page" and the current section

### Requirement: Events
When the active entry changes, the component SHALL fire `toc-change` (bubbling, composed) with `{ id, title, level, previousId }` (`id` null when none is active) and emit the trigger `section-change` with `{ id, title }` through `KakaoComponents` when it is on the page, registered for discovery.

#### Scenario: Change event
- **WHEN** the active section moves from "Intro" to "Setup"
- **THEN** `toc-change` fires with `id` "setup" and `previousId` "intro"

### Requirement: Theming hooks
Colours SHALL default to theme roles, sizes and spacing to settings in the component's `@kakao-settings` block (`--kakao-toc-*`), editable on its construction page. Parts SHALL be exposed for `nav`, `title`, `toggle`, `list`, `link` and `active`. Text SHALL never be set in capitals. Forced colours SHALL keep the active marker and focus ring visible.

#### Scenario: Theme switch
- **WHEN** the theme changes from light to dark
- **THEN** link, active and marker colours follow the theme
