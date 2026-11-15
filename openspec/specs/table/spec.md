# table Specification

## Purpose
`<kakao-table>` is a data table: sortable headings, row selection, a sticky header, an empty and a loading state. It draws a real table from `list-data` or enhances a server-rendered one in place, and on a narrow element wraps each row into a block of label / value pairs. It is the base a grid view composes.

## Requirements

### Requirement: Data from list-data
With a `list-data` attribute holding `{ "columns": […], "rows": […] }` the component SHALL draw a native `<table>` in its light DOM, one heading per column (`key`, `label`) and one row per entry. A row SHALL be an object read by column key or an array read in column order. Values SHALL be set as text, never as HTML.

#### Scenario: Columns and rows
- **WHEN** a table has `list-data` with two columns and three rows
- **THEN** it shows a `<table>` with two column headings and three body rows

#### Scenario: Text only
- **WHEN** a value in `list-data` contains markup
- **THEN** the markup is shown as text

### Requirement: Data from script
The `columns` and `rows` properties SHALL be the script form of `list-data`. A column set from script MAY carry `render(value, row, column)`, whose result, a node or a text, SHALL be the cell's content.

#### Scenario: Rows from script
- **WHEN** a script sets the `rows` property
- **THEN** the body shows those rows under the same columns

#### Scenario: Rendered cell
- **WHEN** a column's `render` returns a button element
- **THEN** the cells of that column hold such a button

### Requirement: Enhancing a native table
Without `list-data` the component SHALL take the `<table>` among its children and enhance it where it is, keeping its rows, cells and their content as page content. Columns SHALL be read from the `data-*` attributes of the `<th>` cells in the first row of `<thead>`; further rows there SHALL be left as they are. A row's id SHALL be its `data-key`, else its `data-id`, else its position. When rows are added, removed or replaced the component SHALL enhance the table again.

#### Scenario: Cell content kept
- **WHEN** a server-rendered table with links in its cells is wrapped in the component
- **THEN** the links are the same elements in the page and still work

#### Scenario: Rows replaced
- **WHEN** a script replaces the rows of the body
- **THEN** the new rows get their labels and, in a selectable table, their checkboxes

#### Scenario: Styled before the script
- **WHEN** a page loads `table.css` and the script has not run
- **THEN** the table inside the element already has the component's table styles

### Requirement: Semantics
The table SHALL be a native `<table>` with column headings as `<th scope="col">`, and SHALL carry explicit table, row group, row, column header and cell roles so that the structure is exposed in every layout. The `label` attribute SHALL be the table's accessible name. A column with `hideLabel` SHALL keep its heading for assistive technology only.

#### Scenario: Name
- **WHEN** a table has `label="Files"`
- **THEN** its `<table>` has the accessible name "Files"

#### Scenario: Hidden heading
- **WHEN** a column has `hideLabel`
- **THEN** its heading is not visible but is read by a screen reader

### Requirement: Column types and alignment
A column of type `number` SHALL be set in tabular figures and aligned to the end of its cell unless `align` says otherwise. `align` SHALL accept start, center and end. `KakaoTable.types` SHALL accept further types with `align`, `compare` and `format`.

#### Scenario: Number column
- **WHEN** a column has `type` "number"
- **THEN** its heading and cells are end-aligned with tabular figures

#### Scenario: Own type
- **WHEN** a page registers a type "date" with `compare` and `format` and a column uses it
- **THEN** the cells show the formatted value and sorting uses that comparison

### Requirement: Empty cells
A cell without a value SHALL show the `empty-text` (default "—") in the muted colour. While that text holds no letter or digit, assistive technology SHALL get the `empty-label` instead (default "Not set").

#### Scenario: Dash
- **WHEN** a row has null for a column
- **THEN** the cell shows "—" and a screen reader hears "Not set"

### Requirement: Sortable headings
The heading of a sortable column SHALL be a native button holding the label and a sort icon, an inline SVG in currentColor hidden from assistive technology. Its `<th>` SHALL carry `aria-sort` "ascending", "descending" or "none". Activating it SHALL cycle ascending, descending, unsorted. The `sort` attribute SHALL name the sorted column, the key for ascending and the key with a leading "-" for descending, and SHALL reflect the state after the user sorts.

#### Scenario: Click cycle
- **WHEN** the heading of the unsorted column "name" is activated three times
- **THEN** `sort` is "name", then "-name", then absent, and `aria-sort` follows

#### Scenario: Keyboard
- **WHEN** a sort button has focus and Enter or Space is pressed
- **THEN** the column is sorted and the button keeps focus

#### Scenario: From the attribute
- **WHEN** a table has `sort="-size"`
- **THEN** the rows are ordered by size, largest first, and that heading has `aria-sort="descending"`

### Requirement: Sorting rows
Unless `sort-mode` is "server", the component SHALL order the rows itself: by the cell's `data-sort-value`, else its `list-data` value, else its text; numbers numerically for a number column, texts by the reader's language; empty cells last in both directions; rows that compare equal in the order they were written. Unsorted SHALL restore the order as written. With `sort-mode="server"` the component SHALL only show the state and leave the rows as they are.

#### Scenario: Numbers
- **WHEN** a number column holds 12, 4.1 and 0.3 and is sorted ascending
- **THEN** the rows are in the order 0.3, 4.1, 12

#### Scenario: Empty last
- **WHEN** a sorted column has an empty cell
- **THEN** that row is last, ascending and descending

#### Scenario: Server mode
- **WHEN** a heading of a table with `sort-mode="server"` is activated
- **THEN** `aria-sort` and `sort` change and the rows keep their order

### Requirement: Sort change event
A sort requested by the user SHALL fire `sort-change`, bubbling, composed and cancelable, with `{ key, direction, sort, previous, href, source }`. When it is cancelled the sort state and the rows SHALL stay as they were. Setting `sort` or calling `sortBy()` SHALL fire no event.

#### Scenario: Cancelled
- **WHEN** a listener cancels `sort-change`
- **THEN** the `sort` attribute and the row order are unchanged

### Requirement: Link headings
In an enhanced table, a heading whose only content is a link SHALL be sortable through that link: the link gets the sort icon and stays a link, and `aria-sort` comes from `sort`, else from the link's class "asc" or "desc". Activating it SHALL fire `sort-change` with the link's `href`; unless cancelled the link is followed and the component SHALL NOT reorder the rows.

#### Scenario: Yii2 sorter
- **WHEN** a heading holds `<a class="asc" href="?sort=-name">Name</a>`
- **THEN** its `<th>` has `aria-sort="ascending"` and the link still leads to "?sort=-name"

#### Scenario: Cancelled link
- **WHEN** a listener cancels `sort-change` for a link heading
- **THEN** the link is not followed

### Requirement: Row selection
With `selectable` every row SHALL start with a native checkbox named after the row, and the heading row with a "select all" checkbox that is checked when all rows are selected and indeterminate when some are. Activating "select all" SHALL select every row, or clear the selection when all were selected. A selected row SHALL be marked `data-selected` and shown on the selected fill.

#### Scenario: Some selected
- **WHEN** one of three rows is selected
- **THEN** the "select all" checkbox is indeterminate

#### Scenario: Select all
- **WHEN** "select all" is activated while one of three rows is selected
- **THEN** all three rows are selected and the checkbox is checked

### Requirement: Selection state
The selection SHALL be kept by row id through sorting and redrawing. `selected` SHALL read and set the selected ids; `selectAll()` and `clearSelection()` SHALL change it.

#### Scenario: Kept through sorting
- **WHEN** a row is selected and the table is then sorted
- **THEN** the same row is selected at its new place

#### Scenario: Initial selection
- **WHEN** a `list-data` row has `"selected": true`, or a server row has `data-selected`
- **THEN** that row starts selected

### Requirement: Selection change event and form participation
A change of the selection by the user or by `selectAll()` / `clearSelection()` SHALL fire `selection-change`, bubbling and composed, with `{ selected, source }`, `selected` being the ids and `source` "user" or "api". Setting `selected` SHALL fire no event. With `selection-name` the row checkboxes SHALL carry that name and the row id as value, so a form around the table submits the selected ids.

#### Scenario: Event
- **WHEN** the user checks the row with id "b2"
- **THEN** `selection-change` fires with `selected` containing "b2" and `source` "user"

#### Scenario: Submitted
- **WHEN** a table with `selection-name="selection[]"` and two selected rows is in a form that is submitted
- **THEN** the form data holds `selection[]` twice, with the two ids

### Requirement: Forms of the table
`striped` SHALL put every other row on the stripe fill, `dense` SHALL reduce the row padding and the font size, and `bordered` SHALL draw a rounded frame and lines between the columns. They SHALL combine.

#### Scenario: Striped
- **WHEN** a table has `striped`
- **THEN** every second body row has the stripe fill

### Requirement: Sticky header
With `sticky-header` the heading row SHALL stay at the top of the viewport, offset by `--kakao-table-sticky-top`, while the page scrolls past the table, on the `--kakao-table-head-bg` fill. In a table with `scroll` and a `--kakao-table-max-height` it SHALL stick to the top of the frame. It SHALL NOT apply in the wrapped form.

#### Scenario: Page scrolls
- **WHEN** the page is scrolled into a long table with `sticky-header`
- **THEN** the heading row stays visible at the sticky offset

### Requirement: Wrapped form on narrow elements
While the element is narrower than `--kakao-table-stack-below` (36rem by default; the element's own width, not the window's), or with `layout="stacked"`, each row SHALL be shown as a block of label / value pairs with the column heading as the label, every column's value visible. The heading row SHALL be hidden. A row's selection checkbox SHALL sit at the top of its block. A cell of a column with `hideLabel` SHALL take the full width without a label.

#### Scenario: Phone width
- **WHEN** a four-column table is 22rem wide
- **THEN** each row is a block of four label / value pairs and no heading row is shown

#### Scenario: Selection when wrapped
- **WHEN** a selectable table is wrapped
- **THEN** each block starts with its checkbox

#### Scenario: No horizontal scroll
- **WHEN** a page with tables is viewed at 390px
- **THEN** the page does not scroll sideways

### Requirement: Sort and select all when wrapped
In the wrapped form a line above the blocks SHALL offer what the hidden heading row did: a "Select all" checkbox with its indeterminate state for a selectable table, and a labelled native select "Sort by" with "Not sorted" and an ascending and a descending option for every sortable column. Choosing an option SHALL sort exactly as activating the heading does, including `sort-change`.

#### Scenario: Sort by
- **WHEN** "Size (MB), descending" is chosen in a wrapped table
- **THEN** `sort` is "-size", `sort-change` has fired and the blocks are in that order

#### Scenario: Select all
- **WHEN** "Select all" above the blocks is activated
- **THEN** every row is selected

### Requirement: Scrolling opt-in
With the `scroll` attribute the table SHALL never wrap its rows. When it is wider than its frame it SHALL scroll sideways inside the frame, which SHALL fade out at each side that has more to scroll and only there, the fade's width being `--kakao-table-scroll-fade` (default `--kakao-scroll-fade`). A frame that scrolls SHALL take keyboard focus and be a named region.

#### Scenario: Too wide
- **WHEN** a six-column table with `scroll` sits in a 22rem box
- **THEN** its columns stay side by side, it scrolls in its frame, and the end side is faded

#### Scenario: Scrolled to the middle
- **WHEN** the frame is scrolled away from both ends
- **THEN** both sides are faded

#### Scenario: Fits
- **WHEN** the table fits its frame
- **THEN** there is no fade and the frame takes no focus

### Requirement: Empty state
A table without rows that is not loading SHALL show an empty state below its headings: a child marked `data-table-empty` (or a `kakao-empty-state` child) when the page provides one, else a `kakao-empty-state` with `empty-heading` (default "Nothing to show") and `empty-message` where that element is defined, else the same words as plain text. The empty state SHALL be hidden while there are rows.

#### Scenario: Built in
- **WHEN** a table has no rows and `empty-heading="No invoices yet"`
- **THEN** "No invoices yet" is shown below the headings

#### Scenario: Own
- **WHEN** the page provides a hidden `data-table-empty` child and the table has no rows
- **THEN** that child is shown

### Requirement: Loading state
While `loading` is set the body rows SHALL give way to placeholder rows hidden from assistive technology (`loading-rows` of them; by default as many as there were rows, at most 10, or 5), each cell holding a `kakao-skeleton` where that element is defined and a plain bar otherwise. The element SHALL have `aria-busy="true"` and a status text "Loading" for assistive technology. Removing `loading` SHALL bring the rows back.

#### Scenario: Loading
- **WHEN** `loading` is set on a table with three rows
- **THEN** three placeholder rows are shown, the rows are not, and the element is `aria-busy`

#### Scenario: Done
- **WHEN** `loading` is removed
- **THEN** the rows are shown and `aria-busy` is gone

### Requirement: Words
`KakaoTable.texts` SHALL set the words of every table (`label`, `sortBy`, `notSorted`, `ascending`, `descending`, `selectAll`, `selectRow`, `selectRowPlain`, `emptyHeading`, `emptyLabel`, `loading`), and connected tables SHALL redraw with them.

#### Scenario: Translated
- **WHEN** `KakaoTable.texts = { selectAll: "Alle auswählen" }` is set
- **THEN** every table's "select all" control carries that text

### Requirement: Theming hooks
Every visual value SHALL be a `--kakao-table-*` custom property with its default in the one settings block of `table.css`; every colour SHALL default to a theme role. The construction page SHALL list every property. Muted text in a selected row SHALL use `--kakao-table-selected-muted`, so labels and dashes keep their contrast on the selected fill in every theme. Transitions and the placeholder animation SHALL stop under `prefers-reduced-motion: reduce`.

#### Scenario: Themes
- **WHEN** the theme changes
- **THEN** the table's text, lines, fills, sort icons and checkboxes follow it

#### Scenario: Reduced motion
- **WHEN** the reader prefers reduced motion
- **THEN** the placeholder bars do not pulse

### Requirement: Extension points
The component SHALL keep extra keys on columns set through `columns`, SHALL leave its `.kakao-table-tools` container's foreign children in place when it redraws, SHALL fire a non-bubbling `table-render` event after every read or redraw, and SHALL expose `refresh()`, the read-only `stacked` property and `window.KakaoTable`, so that a grid view can compose it without changing it. When it draws from `list-data` or the `columns` / `rows` properties, it SHALL keep heading rows after the first (a filter row) across redraws, and SHALL rebuild the heading row only when the columns change, so focus inside the heading is kept when only the rows are replaced.

#### Scenario: Decorating
- **WHEN** a listener on `table-render` adds a control to the tools container
- **THEN** the control is still there after the next redraw

#### Scenario: Extra column keys
- **WHEN** a column is set with a `filter` key
- **THEN** reading `columns` returns that key

#### Scenario: Filter row kept
- **WHEN** a second row is added to the `<thead>` of a table drawn from `rows`, and `rows` is set again
- **THEN** the second row and the fields in it are still there

#### Scenario: Focus kept on sort
- **WHEN** a sort button in a table with `sort-mode="server"` has focus and the page sets new `rows`
- **THEN** the same sort button still has focus
