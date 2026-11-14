# error-page Specification

## Purpose
`<kakao-error-page>` draws an error page (404, 500, 503 …) from the facts the page passes in: the status code very large and as a diagonal background pattern, the error's heading, a message, reference information and actions.

## Requirements

### Requirement: Content attributes
The component SHALL render `code` as a large display number, `heading` as the error's title, `message` as the explanation, `reference` and `time` as labelled info rows, and SHALL update the rendering when any of these attributes change. The default slot, when it has content, SHALL replace `message`.

#### Scenario: 404 from attributes
- **WHEN** a page contains `<kakao-error-page code="404" heading="Page not found" message="The page may have moved.">`
- **THEN** "404" is shown very large, "Page not found" below it as the heading and the message below that

#### Scenario: Attribute changed
- **WHEN** a script sets `code` to `500` on a rendered error page
- **THEN** the big code and the background pattern show 500

### Requirement: Default headings
When `heading` is missing, the component SHALL use a short English default for the common codes (400, 401, 403, 404, 405, 408, 410, 429, 500, 502, 503, 504) and "Something went wrong" for any other code.

#### Scenario: Code only
- **WHEN** an error page has `code="503"` and no `heading`
- **THEN** its heading reads "Service unavailable"

### Requirement: Heading semantics
The code and title SHALL be one heading element of level `heading-level` (1 to 6, default 1; other values fall back to 1), whose accessible text is the `code-label` prefix (default "Error"), the code, and the title, for example "Error 404: Page not found". Without a code, the heading SHALL be the title alone.

#### Scenario: Heading navigation
- **WHEN** a screen reader user lists the headings of a page with `<kakao-error-page code="404">`
- **THEN** there is one level 1 heading, read as "Error 404: Page not found"

#### Scenario: Embedded level
- **WHEN** the error page has `heading-level="2"`
- **THEN** its heading is an `h2`

### Requirement: Info rows
`reference` and `time` SHALL be shown as label/value rows in muted text, labelled by `reference-label` (default "Reference") and `time-label` (default "Time"); `list-data` (a JSON array of `[label, value]` pairs) SHALL add further rows after them. Rows without a value SHALL not be shown, and invalid `list-data` SHALL be ignored.

#### Scenario: Reference for support
- **WHEN** an error page has `reference="req-7f3a9c"` and `time="2026-11-15T09:42:00Z"`
- **THEN** it shows "Reference req-7f3a9c" and the time formatted in the page language, and the reference can be selected with one click

#### Scenario: Extra rows
- **WHEN** `list-data='[["Path","/invoices/77"]]'` is set
- **THEN** a "Path /invoices/77" row follows the reference and time rows

### Requirement: Time formatting
A `time` value that is an ISO date or date-time SHALL be shown formatted in the nearest `lang` inside a `<time datetime>` element; any other value SHALL be shown as written.

#### Scenario: Free text
- **WHEN** `time="tonight, 22:00"` is set
- **THEN** the time row shows "tonight, 22:00" unchanged

### Requirement: Slots
The component SHALL offer an `actions` slot, shown as a wrapping centred row below the message and info, and a `details` slot below it for longer content, aligned to the start. An empty slot SHALL take no space.

#### Scenario: Actions
- **WHEN** two `kakao-button` links are slotted into `actions`
- **THEN** they sit side by side under the text and wrap onto two lines when there is no room

### Requirement: Code pattern background
Unless `no-pattern` is set, the component SHALL fill its background with a decorative pattern of the code: staggered rows of the code text, rotated by `--kakao-error-page-pattern-angle`, in `--kakao-error-page-pattern-color` at `--kakao-error-page-pattern-opacity`, covering the whole box at any size. With the default settings, muted text over the pattern SHALL keep a contrast of at least 4.5:1 in every theme.

#### Scenario: Covers after resize
- **WHEN** the box grows from 400px to 1600px wide
- **THEN** the pattern still reaches every edge

#### Scenario: Theme
- **WHEN** the theme switches from light to dark
- **THEN** the pattern, code, heading and text take the dark theme's colours

### Requirement: Pattern is decorative
The pattern SHALL be hidden from assistive technology, not selectable and not hit by the pointer, and SHALL not be shown in forced-colours mode or in print.

#### Scenario: Not read out
- **WHEN** a screen reader reads the error page
- **THEN** the repeated code of the background is not read

### Requirement: Embedded and full layout
By default the component SHALL be a framed box (surface fill, border, radius, `--kakao-error-page-min-height`) with its content centred. With `full` it SHALL have no frame, a transparent surface by default, and a minimum height of the viewport minus the header bar's rendered height (`--kakao-error-page-full-height`).

#### Scenario: Full page under a header bar
- **WHEN** a page has a sticky header bar and `<kakao-error-page full>` as its only content
- **THEN** the error page fills the rest of the viewport height with its content centred, and the page does not scroll

### Requirement: Phone width
At a 390px viewport the code SHALL shrink to fit, text SHALL wrap, and nothing SHALL scroll sideways.

#### Scenario: 390px
- **WHEN** a full error page with two actions is shown at 390px
- **THEN** code, heading, message, info and actions are all visible without horizontal scrolling

### Requirement: Theming hooks
All visual values SHALL be `--kakao-error-page-*` custom properties in the component's settings block, with every colour defaulting to a theme role (`var(--kakao-color-<role>, literal)`), and SHALL be editable on `components/error-page/construction.html`. No text SHALL be styled in capitals.

#### Scenario: Construction page
- **WHEN** the construction page changes the pattern angle or size
- **THEN** the preview pattern follows at once and still covers the box
