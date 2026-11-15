# Spec Delta

## Purpose

`<kakao-description-list>` shows key/value rows for summary and detail screens as a semantic `<dl>`, from `list-data` and from native `<dt>` / `<dd>` children.

## ADDED Requirements

### Requirement: Rows from list-data
The component SHALL render one row per entry of `list-data`, a JSON array whose entries are `[term, value]` arrays or `{term, value}` objects. A value SHALL be a text, a number, or an array of them rendered as one value each. Terms and values SHALL be set as text, never parsed as HTML. Entries without a term SHALL be skipped. Invalid JSON SHALL render no data rows and log an error, without throwing. The rows SHALL follow later changes of the attribute.

#### Scenario: Pairs
- **WHEN** the element has `list-data='[["Plan", "Pro"], ["Seats", 12]]'`
- **THEN** two rows are shown: "Plan" with "Pro" and "Seats" with "12"

#### Scenario: Objects
- **WHEN** an entry is `{"term": "Order", "value": "#10482"}`
- **THEN** a row "Order" with "#10482" is shown

#### Scenario: Several values
- **WHEN** an entry is `["Phone", ["A", "B"]]`
- **THEN** the term "Phone" has two values, "A" and "B", one below the other

#### Scenario: Markup in data
- **WHEN** a value is the text `<b>x</b>`
- **THEN** those characters are shown and no bold element is created

#### Scenario: Invalid JSON
- **WHEN** `list-data` is not valid JSON
- **THEN** no data rows are shown, an error is logged and rows from children still render

### Requirement: Rows from native children
The component SHALL show `<dt>` and `<dd>` elements that are its direct children as rows, after the rows from `list-data`, without moving, copying or modifying them. A `<dt>` SHALL start a pair; `<dd>` elements after it SHALL be its values; `<dt>` elements directly after each other SHALL share the values that follow. Children that are neither SHALL not be shown. The rows SHALL follow children added, removed or changed later.

#### Scenario: Rich value
- **WHEN** the element contains `<dt>Owner</dt><dd><a href="/p/7">Ada</a></dd>`
- **THEN** a row "Owner" with the link is shown, and the link is reached with Tab and works

#### Scenario: Data and children
- **WHEN** the element has one row in `list-data` and one `<dt>` / `<dd>` pair
- **THEN** the data row is shown first and the child pair second

#### Scenario: Child added
- **WHEN** a script appends `<dt>Region</dt><dd>EU West</dd>` to a rendered list
- **THEN** a row "Region" with "EU West" appears at the end

### Requirement: List semantics
The rows SHALL be exposed to assistive technology as one description list, each term as a term and each value as a definition, for data rows and child rows alike. `label` SHALL give the list its accessible name. The component SHALL contain no focusable element of its own.

#### Scenario: Screen reader
- **WHEN** a screen reader reads a list with a data row and a child row
- **THEN** it meets one list with two terms and their definitions

#### Scenario: Name
- **WHEN** the element has `label="Order summary"`
- **THEN** the list's accessible name is "Order summary"

### Requirement: Empty values
A value that is `null`, missing, blank or an empty array in `list-data`, an empty `<dd>` child, or a `<dt>` child with no `<dd>` SHALL show the placeholder `empty-text` (default "—") in the muted colour. While the placeholder contains no letter or digit, assistive technology SHALL get `empty-label` (default "Not set") in its place.

#### Scenario: Null value
- **WHEN** an entry is `["Coupon", null]`
- **THEN** the row shows "—" in the muted colour and a screen reader hears "Not set"

#### Scenario: Empty child
- **WHEN** the element contains `<dt>Notes</dt><dd></dd>`
- **THEN** the row shows the placeholder

#### Scenario: Own text
- **WHEN** the element has `empty-text="None"`
- **THEN** empty values show "None" and a screen reader hears "None"

### Requirement: Layouts
By default the component SHALL show each term beside its value, the terms in a column of the width `--kakao-description-list-term-width`. With `layout="stacked"` each term SHALL sit above its value at every width. A side-by-side list SHALL stack by itself while a row is narrower than `--kakao-description-list-stack-below`, and return when it is wider again. With `align="end"` the values SHALL be aligned to the end of the row while side by side.

#### Scenario: Wide
- **WHEN** a list sits in a card 40rem wide
- **THEN** terms and values are in two aligned columns

#### Scenario: Phone
- **WHEN** the same list is shown at a viewport width of 390px
- **THEN** each term sits above its value and nothing scrolls sideways

#### Scenario: Stacked asked for
- **WHEN** the element has `layout="stacked"` in a wide card
- **THEN** each term sits above its value

### Requirement: Columns
With `columns` set to 2, 3 or 4 the pairs SHALL fill a grid of up to that many columns, row by row. Columns SHALL fall away while one would be narrower than `--kakao-description-list-column-min-width`, down to one column. Other values SHALL mean one column.

#### Scenario: Two columns
- **WHEN** a list with six pairs and `columns="2"` is 50rem wide
- **THEN** it shows three lines of two pairs

#### Scenario: Narrow
- **WHEN** that list is shown at a viewport width of 390px
- **THEN** it shows six pairs in one column

### Requirement: Dividers and size
`dividers` SHALL draw a hairline between the lines of rows, none above the first or below the last. `size="sm"` SHALL render the dense form: smaller type and less space between rows. The list SHALL have no padding above its first line of rows or below its last.

#### Scenario: Dividers
- **WHEN** a list with four rows has `dividers`
- **THEN** three hairlines separate the rows

#### Scenario: Dense
- **WHEN** a list has `size="sm"`
- **THEN** its rows are closer together and its text is smaller than without

### Requirement: Theming hooks
Every visual value SHALL be a `--kakao-description-list-*` custom property with its default in the component's one settings block, and every colour SHALL default to a theme role with a literal fallback: values the text role, terms and the placeholder the muted role, dividers the line role. The component SHALL draw no frame or background of its own. Text SHALL not be set in capitals.

#### Scenario: Theme change
- **WHEN** the page switches from a light to a dark theme
- **THEN** terms, values and dividers take the new theme's colours

#### Scenario: Override
- **WHEN** the page sets `--kakao-description-list-term-width: 14rem` on the element
- **THEN** the term column is 14rem wide
