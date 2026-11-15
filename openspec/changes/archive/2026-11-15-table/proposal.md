# Proposal

## Why

The components page still lists Table as missing, and the planned Grid view (Yii2-style data grids: a sort icon per heading, a filter per column, an action column) is to be built on it. The style guide already decides how a data table behaves on a phone ("Data tables on small screens"); nothing implements that rule yet.

## What Changes

- New component `<kakao-table>` (`components/table/`), light DOM with `table.css`.
  - Data from `list-data` (`{ columns, rows }`; a column has `key`, `label`, `type`, `align`, `sortable`, `width`, `hideLabel`), or the server-rendered `<table>` inside the element, enhanced in place. Property forms `columns` and `rows`; script columns may carry `render()`.
  - Sortable headings: a button (or the server's own link) with own SVG sort arrows and `aria-sort`; `sort` is "key" or "-key"; cancelable `sort-change`; `sort-mode="server"` leaves the rows to the page.
  - Row selection: `selectable` adds row checkboxes and select all with an indeterminate state; `selection-change`, `selected`, `selectAll()`, `clearSelection()`; `selection-name` submits the selection with a form.
  - `sticky-header`, `striped`, `dense`, `bordered`; number columns tabular at the end; empty cells "—" read as "Not set".
  - Empty state (a `kakao-empty-state` where loaded, a plain text otherwise, or the page's own) and `loading` (placeholder rows, `kakao-skeleton` where loaded, `aria-busy`).
  - Small screens: narrower than `--kakao-table-stack-below` (its own width) each row wraps into a block of label / value pairs, with "Sort by" and "Select all" above the blocks; `scroll` opts in to sideways scrolling in the frame with the edge fade; `layout="stacked"` forces the wrapped form.
  - `KakaoTable.texts` for the words, `KakaoTable.types` for column types, a `table-render` event for code that decorates the table.
- Settings block (`--kakao-table-*`) in `table.css`, construction page, demo page; a card on `components.html` (alphabetical, after Switch group) replacing the "Table" placeholder; style guide audit row; changelog entry; `AGENTS.md` names table among the light DOM components.

## Capabilities

### New Capabilities
- `table`: data sources, columns, sorting, selection, forms of the table, sticky header, empty and loading states, the wrapped form and the scrolling opt-in, semantics, theming hooks, extension points.

### Modified Capabilities

None. The rule "Data tables on small screens" in `component-conventions` is implemented as it stands.

## Impact

- New: `components/table/{table.js,table.css,demo.html,construction.html}`. No dependency on other components; it composes `kakao-empty-state` and `kakao-skeleton` only where those elements are defined, and stands beside a `kakao-pagination` without knowing it.
- Pages: `components.html` (new card, stylesheet and script, placeholder removed), `styleguide.html` (audit row). Not on `kitchen-sink.html`: that page is one settings form with no tabular data.
- `CHANGELOG.md` (Unreleased, Added), `AGENTS.md` (light DOM list). `.github/workflows/pages.yml` copies `components/` wholesale, so it is unchanged. No new token, no theme change.
