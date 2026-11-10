# accordion Specification

## Purpose

`<kakao-accordion>` is a card that opens and closes to show any content, with a header row that names it and a look that steps down when accordions are nested.

## Requirements

### Requirement: Header row
The header SHALL show the title from the `title` slot or, without one, the `heading` attribute; a description from the `description` slot or attribute below it, taking no space when absent; the `meta` slot after the text, taking no space when empty; and a chevron at the end. The whole header row SHALL be the control that opens and closes the accordion.

#### Scenario: Attributes only
- **WHEN** an accordion has `heading="Billing"` and `description="Card and invoices"`
- **THEN** the header shows "Billing" with "Card and invoices" below it and a chevron at the end

#### Scenario: No description
- **WHEN** an accordion has only a heading
- **THEN** no empty line is reserved for a description

### Requirement: Open state and API
The `open` attribute SHALL decide whether the body is shown, and the `open` property SHALL reflect it. `show()` SHALL open, `hide()` SHALL close, and `toggle(force)` SHALL flip the state or set it to `force` when a boolean is given. Clicking the header SHALL toggle it.

#### Scenario: Method
- **WHEN** `hide()` is called on an open accordion
- **THEN** the `open` attribute is removed and the body closes

### Requirement: Toggle event
Every change of the open state after the first render, from the header, a method, the attribute or the browser (find in page), SHALL dispatch one bubbling, composed `accordion-toggle` event with `detail.open` and `detail.name`, and send the same name as a trigger.

#### Scenario: Header click
- **WHEN** the user opens a closed accordion by clicking its header
- **THEN** one `accordion-toggle` event with `detail.open` true reaches the document

### Requirement: Exclusive groups
Accordions with the same `name` in the same document or shadow root SHALL form a group in which at most one is open: opening one SHALL close the others. An accordion without `name` SHALL not be grouped.

#### Scenario: Opening another
- **WHEN** two accordions share `name="faq"`, the first is open and the user opens the second
- **THEN** the first closes and the second opens

#### Scenario: Two open on load
- **WHEN** a page loads with two open accordions sharing a name
- **THEN** only the first one stays open

### Requirement: Height motion
Opening and closing SHALL animate the body's height between closed and its full height over `--kakao-motion-duration` with the standard easing, and the chevron SHALL turn in step. A change during a running animation SHALL continue from the current height. Under `prefers-reduced-motion: reduce`, with `no-animate`, and on first render the change SHALL show at once.

#### Scenario: Reduced motion
- **WHEN** reduced motion is on and the user opens an accordion
- **THEN** the full body shows immediately

### Requirement: Keyboard and screen readers
The header SHALL be one tab stop exposed as a button with an expanded state that follows the open state, toggled by Enter and Space, with a visible focus outline in the focus colour. Content of a closed body SHALL not be reachable by Tab or read by screen readers.

#### Scenario: Keyboard
- **WHEN** the header has focus and the user presses Space
- **THEN** the accordion opens, the header reports expanded, and the next Tab moves into the body

#### Scenario: Closed body
- **WHEN** an accordion with a text field in its body is closed
- **THEN** Tab skips the text field

### Requirement: Nesting looks
Without `variant`, an accordion SHALL take its look from the number of accordions it is nested in: at the top a card (surface, border, card radius and padding); in one accordion a borderless tile on the subtle fill with smaller radius and padding; in two or more a flat row with a hairline above it and no side padding, further indented from the fourth level on. `variant="card"`, `"tile"` or `"row"` SHALL force that look.

#### Scenario: Three levels
- **WHEN** an accordion holds an accordion that holds another accordion
- **THEN** they show as card, tile and row, and only the outer one has a border

#### Scenario: Forced look
- **WHEN** a top-level accordion inside a `<kakao-card>` has `variant="tile"`
- **THEN** it shows as a tile

### Requirement: Theming hooks
Every colour SHALL default to a theme role, and the surface, border, radius, padding, text sizes, nested looks and motion SHALL be `--kakao-accordion-*` settings in the component's settings block, listed on its construction page.

#### Scenario: Dark theme
- **WHEN** the page switches to the dark theme
- **THEN** card, tile and row follow the theme's surface, subtle fill and line colours
