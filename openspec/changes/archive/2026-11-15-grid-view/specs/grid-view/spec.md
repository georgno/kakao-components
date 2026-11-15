# Spec Delta

## Purpose

`<kakao-grid-view>` is a data grid in the manner of Yii2's GridView: a `kakao-table` with a filter row under its headings, an action column, a summary and a `kakao-pagination`. It filters, sorts and pages rows in the browser, or hands filters, sort and page to the server, and it decorates server-rendered markup in place.

## ADDED Requirements

### Requirement: Composition
The component SHALL render in its light DOM a summary bar, a `kakao-table` and a `kakao-pagination`, and SHALL use a `kakao-table` or `kakao-pagination` written inside it instead of creating one. A table it creates SHALL take the table's look and behaviour attributes (`label`, `selectable`, `striped`, `dense`, `bordered`, `loading`, the empty texts, the initial `sort` and the like) from the grid. It SHALL NOT copy the table's or the pager's logic.

#### Scenario: Created parts
- **WHEN** a grid has `list-data` and `striped`
- **THEN** it contains a striped `kakao-table` and a `kakao-pagination`

#### Scenario: Server markup
- **WHEN** a grid contains a `kakao-table` with a server-rendered `<table>`
- **THEN** that table is used where it is and no second table is created

### Requirement: Data
With `list-data` holding `{ "columns": […], "rows": […] }`, or the `columns` and `rows` properties, the grid SHALL own the rows. A column SHALL take the table's keys plus `filter` and `actions`.

#### Scenario: Properties
- **WHEN** a script sets `columns` and then `rows` with 45 rows and `page-size="20"`
- **THEN** the table shows the first 20 rows

### Requirement: Filter fields
A column with `filter` SHALL get a field in a filter row under the headings: a search field for `true` or `"search"`, a dropdown (first option "All", value "") for an array of options or `{ "type": "select", "options": […] }`. The field SHALL be a `kakao-text-input` or `kakao-select` when defined, else a native field, named by `filter-name` (`{key}` replaced) and labelled "Filter {label}". A filter row written by the server (`tr.filters` or `tr[data-filters]`) SHALL be used as written.

#### Scenario: Yii2 names
- **WHEN** a grid has `filter-name="UserSearch[{key}]"` and a column `email` with `"filter": true`
- **THEN** the filter row holds a search field named `UserSearch[email]`

#### Scenario: Native fallback
- **WHEN** `text-input.js` is not loaded
- **THEN** the search filter is a native `<input type="search">` with the same name and label

### Requirement: Filtering in the browser
Without `mode="server"`, a change to a search field SHALL filter the rows after `filter-delay` milliseconds (300 by default) of no typing and a dropdown change SHALL filter at once. A search SHALL match anywhere in the value, ignoring case and accents; a dropdown SHALL match the value exactly. Filtering SHALL go back to page 1.

#### Scenario: Search
- **WHEN** the user types "lov" into the Name filter
- **THEN** after the delay only rows whose name contains "lov" (e.g. "Ada Lovelace") are shown

#### Scenario: Accents
- **WHEN** the user types "malmo" into the City filter
- **THEN** a row with "Malmö" is shown

### Requirement: Filter change event and server filters
Every applied filter change SHALL fire a bubbling, cancelable `filter-change` with `{ filters, params, source }`. With `mode="server"`, search fields SHALL apply on `change` (Enter or leaving the field); when the event is not cancelled the grid SHALL navigate to `filter-url` (default the current address) with its current query, without the previous filter parameters and `page`, plus every non-empty filter as a GET parameter under its field name. Cancelled, nothing SHALL change by itself.

#### Scenario: GET parameters
- **WHEN** in server mode with `filter-name="UserSearch[{key}]"` the user picks "Active" in the Status filter
- **THEN** the grid navigates to an address whose query has `UserSearch[status]=active` and no `page`

#### Scenario: Cancelled
- **WHEN** a listener cancels `filter-change` in server mode
- **THEN** the page does not navigate

### Requirement: Action column
A column with `actions` SHALL draw one control per action and row: a built-in name (`view`, `update`, `delete`) or `{ name, label, icon, url, tone, confirm, method, visible }`. An action with a `url` template (or the grid's `action-url`), filled from the row and URL-encoded, SHALL be a link; others SHALL be an icon-only small ghost `kakao-button` when defined, else a native button. Each control SHALL be named "{label} {row}"; `tone: "danger"` SHALL use the danger colour.

#### Scenario: Built-ins
- **WHEN** a column has `"actions": ["view", "update", "delete"]`
- **THEN** each row shows three icon buttons, named for example "View Ada Lovelace", "Edit Ada Lovelace", "Delete Ada Lovelace"

#### Scenario: URL template
- **WHEN** an action has `"url": "/user/view?id={id}"` and the row id is 7
- **THEN** it is a link to "/user/view?id=7"

### Requirement: Row action event and confirmation
Activating an action SHALL fire a bubbling, cancelable `row-action` `{ action, id, row, href }`; cancelling it SHALL stop a link from being followed. An action with `confirm` (the built-in `delete` by default) SHALL ask first and do nothing when declined. With yii.js on the page the grid SHALL write `data-confirm` and `data-method` and leave both to Yii; without it, a link with a `method` other than GET SHALL be submitted as a POST form carrying Yii's CSRF parameter when the page has one.

#### Scenario: Event action
- **WHEN** the user activates "Delete" on row 7 and confirms
- **THEN** `row-action` fires with `action: "delete"` and `id: "7"`

#### Scenario: Declined
- **WHEN** the user declines the confirmation
- **THEN** no `row-action` fires

### Requirement: Server action cells
In server markup, links and buttons in a column whose heading has `data-type="actions"` or `data-actions` SHALL get the action look and fire `row-action` on activation, with the action from `data-action`, else the control's title.

#### Scenario: Yii2 ActionColumn
- **WHEN** a server row has `<a href="/user/update?id=3" title="Update">` in the action column
- **THEN** activating it fires `row-action` with `action: "update"`, `id: "3"` and that `href`, then follows the link

### Requirement: Paging
Without `mode="server"` the grid SHALL page the filtered, sorted rows by `page-size` (20 by default, `0` for no paging) through a `kakao-pagination` below the table, starting at `page`, with `page-sizes` passed to the pager. With `mode="server"` it SHALL give the pager `total-items`, `page`, `page-size` and `page-url` (as the pager's `url`). Without `kakao-pagination` defined, client mode SHALL show all rows until it is.

#### Scenario: Next page
- **WHEN** a grid with 45 rows and `page-size="20"` moves to page 3
- **THEN** the table shows rows 41 to 45

### Requirement: Summary
Above the table the grid SHALL show "Showing {from}–{to} of {total}" in a polite status region, adding "(filtered from {all})" while filters hide rows and "No entries" when there are none, unless `hide-summary` is set. In server mode it SHALL show the summary only when `total-items` is given.

#### Scenario: Filtered
- **WHEN** a filter leaves 5 of 45 rows
- **THEN** the summary reads "Showing 1–5 of 5 (filtered from 45)"

### Requirement: Sorting
Sorting SHALL be the table's: its sort icons on every sortable heading (both arrows while unsorted), `aria-sort`, `sort` and `sort-change`, and its "Sort by" control when wrapped. In client mode the grid SHALL sort all filtered rows, using the column type's `compare` from `KakaoTable.types`, empty values last, before it cuts the page.

#### Scenario: Across pages
- **WHEN** the user sorts a 45-row grid on page 2 by Name descending
- **THEN** page 1 shows the 20 names that come last in the alphabet

### Requirement: Selection across pages
With `selectable`, the grid SHALL keep the selected ids while the page or the filters change, and `selected` SHALL return every selected id.

#### Scenario: Back to a page
- **WHEN** the user selects a row on page 1, moves to page 2 and back
- **THEN** the row is still selected

### Requirement: Empty and loading
The grid SHALL use the table's empty and loading states. While filters are on and match nothing, the empty state SHALL say "No matches" with "Try other filters." unless `empty-heading` is set.

#### Scenario: No matches
- **WHEN** a filter matches no row
- **THEN** the table shows "No matches"

### Requirement: Clear filters
While any filter has a value the bar SHALL show a "Clear filters" button; it and `clearFilters()` SHALL empty every filter and apply the change.

#### Scenario: Clear
- **WHEN** the user activates "Clear filters"
- **THEN** every filter field is empty and all rows are counted again

### Requirement: Wrapped form
When the table is wrapped (data tables on small screens), the grid SHALL add a "Filters" disclosure button with `aria-expanded` (and the number of active filters) to the table's tools line; open, the filter fields SHALL be shown above the blocks, one per line, each with its column label. The tools line SHALL stay visible while filters exist, even without rows. Each block's action cell SHALL be at the bottom of the block, full width, showing each action's label beside its icon.

#### Scenario: Filters on a phone
- **WHEN** the grid is 390px wide and the user activates "Filters"
- **THEN** the filter fields appear above the blocks, each labelled, and the button reads expanded

#### Scenario: Actions at the bottom
- **WHEN** the grid is wrapped and its action column is not the last column
- **THEN** the actions still sit at the bottom of each block

### Requirement: Words
`KakaoGridView.texts` SHALL hold the words: `summary`, `filtered`, `none`, `filters`, `filterLabel`, `all`, `clearFilters`, `noMatches`, `noMatchesMessage`, `actionLabel`, `view`, `update`, `delete`, `confirmDelete`; setting it SHALL redraw every grid.

#### Scenario: German
- **WHEN** a script sets `KakaoGridView.texts = { filters: "Filter" }`
- **THEN** the disclosure button reads "Filter"

### Requirement: Theming hooks
Every visual value SHALL be a `--kakao-grid-view-*` custom property in the component's settings block, colours defaulting to theme roles, with a construction page listing them. No text SHALL be set in capitals.

#### Scenario: Danger colour
- **WHEN** a theme changes `--kakao-color-danger`
- **THEN** the delete actions follow
