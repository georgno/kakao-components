# empty-state Specification

## Purpose
`<kakao-empty-state>` is the quiet block shown where content is missing: an icon, a heading, a short message and actions, centred inside a card, a list or a table area.

## Requirements

### Requirement: Content attributes
The component SHALL render `heading` as its title and `message` as the explanation below it, and SHALL update the rendering when either attribute changes. The default slot, when it has content, SHALL replace `message`. A part without content (heading, message) SHALL take no space.

#### Scenario: From attributes
- **WHEN** a card contains `<kakao-empty-state heading="No invoices yet" message="Invoices you create appear here.">`
- **THEN** the icon, "No invoices yet" as the heading and the message below it are shown, centred

#### Scenario: Message with a link
- **WHEN** the element has `message="A"` and slotted text with a link
- **THEN** the slotted text is shown and "A" is not

#### Scenario: Attribute changed
- **WHEN** a script sets `heading` to "No results" on a rendered empty state
- **THEN** the heading reads "No results"

### Requirement: Heading semantics
The heading SHALL be a heading element of level `heading-level` (1 to 6, default 3; other values fall back to 3). Without `heading`, no heading element SHALL be rendered.

#### Scenario: Default level
- **WHEN** an empty state has `heading="No results"` and no `heading-level`
- **THEN** its heading is an `h3`

#### Scenario: Own level
- **WHEN** the empty state has `heading-level="4"`
- **THEN** its heading is an `h4`

#### Scenario: Message only
- **WHEN** the empty state has only `message="No rows."`
- **THEN** heading navigation finds no heading in it

### Requirement: Icon
The component SHALL show a built-in glyph, drawn as inline SVG in `currentColor`, on a soft round fill above the text. A `slot="icon"` child SHALL replace the glyph and be sized to `--kakao-empty-state-icon-size`; `no-icon` SHALL remove the icon and its space. The built-in glyph SHALL be hidden from assistive technology.

#### Scenario: Default glyph
- **WHEN** an empty state has no `slot="icon"` child
- **THEN** the tray glyph is shown and a screen reader does not read it

#### Scenario: Own icon
- **WHEN** an inline SVG is slotted with `slot="icon"`
- **THEN** it is shown in place of the tray, at the glyph size and in the icon colour

#### Scenario: No icon
- **WHEN** `no-icon` is set
- **THEN** the block starts with the heading

### Requirement: Actions slot
The component SHALL offer an `actions` slot, shown as a wrapping centred row below the text. Without slotted actions the row SHALL take no space.

#### Scenario: Two actions
- **WHEN** two `kakao-button` elements are slotted into `actions`
- **THEN** they sit side by side under the message, centred, wrap when there is no room, and are reached with Tab in source order

### Requirement: Sizes
`size="sm"` SHALL render the block with a smaller icon, heading, message and padding (the `--kakao-empty-state-sm-*` settings); any other value or no `size` SHALL render the default size.

#### Scenario: In a table area
- **WHEN** an empty state with `size="sm"` sits in a table's empty body
- **THEN** it is visibly smaller than a default one beside it

### Requirement: Quiet, centred layout
The component SHALL be a block with its content centred in a column no wider than `--kakao-empty-state-max-width`, SHALL have no border, background or minimum height of its own, and SHALL not animate.

#### Scenario: Inside a card
- **WHEN** an empty state is the only content of a `kakao-card`
- **THEN** it shows on the card's surface, centred across the card's width

### Requirement: Phone width
At a 390px viewport the text SHALL wrap, actions SHALL wrap, and nothing SHALL scroll sideways.

#### Scenario: 390px
- **WHEN** an empty state with a long message and two actions is shown at 390px
- **THEN** everything is visible without horizontal scrolling

### Requirement: Theming hooks
All visual values SHALL be `--kakao-empty-state-*` custom properties in the component's settings block, with every colour defaulting to a theme role (`var(--kakao-color-<role>, literal)`), and SHALL be editable on `components/empty-state/construction.html`. No text SHALL be styled in capitals. In forced-colours mode the glyph SHALL use the system text colour.

#### Scenario: Theme
- **WHEN** the theme switches from light to dark
- **THEN** the icon fill, glyph, heading and message take the dark theme's colours

#### Scenario: Construction page
- **WHEN** the construction page changes the icon size
- **THEN** the preview follows at once
