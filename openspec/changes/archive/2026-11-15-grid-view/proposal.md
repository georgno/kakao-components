# Proposal

## Why

The components page still lists Grid view as missing. Yii2 projects show most of their admin lists through `GridView`: a table with sorter links, a filter row under the headings, an action column (view / update / delete) and a pager with a summary. Table and Pagination now exist, so the grid can be built by composing them instead of being a second table.

## What Changes

- New component `<kakao-grid-view>` (`components/grid-view/`), light DOM with `grid-view.css`, composing a `kakao-table` and a `kakao-pagination`.
  - Data from `list-data` (`{ columns, rows }`) or `columns` / `rows`, or around a server-rendered `kakao-table` (Yii2 markup) that it decorates.
  - Filter row under the headings: per column a search field or a dropdown (`filter` on a column), drawn as `kakao-text-input` / `kakao-select` where those are defined, else native fields. Client mode filters the rows in the browser (debounced, `filter-delay`); `mode="server"` sends the filters as GET parameters named by `filter-name` (`UserSearch[{key}]`) to `filter-url`, or leaves it to the page. `filter-change` (cancelable) in both modes. A server's own filter row (Yii2's `tr.filters`) is used as written.
  - Action column (`actions` on a column): built-in view / update / delete and custom actions with `label`, `icon`, `url` template, `tone: "danger"`, `confirm`, `method`, `visible`. Event actions are icon-only small ghost `kakao-button`s (native buttons without it); url actions are real links. Cancelable `row-action` `{ action, id, row, href }`. Yii's `data-confirm` / `data-method` are honoured, with a fallback when yii.js is not on the page.
  - Paging and summary: client-side paging of the filtered, sorted rows (`page-size`, `page`, `page-sizes`) through a `kakao-pagination` below; a summary line above ("Showing 1–20 of 143", a status region). Server mode takes `total-items` and `page-url`.
  - Sorting stays the table's: icons on every sortable heading, "Sort by" when wrapped. In client mode the grid sorts all rows (by the table's column types) before it cuts the page.
  - Selection across pages; the table's empty and loading states (a "no matches" text while filters are on).
  - Wrapped form (phone): the table's label / value blocks; a "Filters" disclosure in the table's tools line opens the filter fields above the blocks; the action buttons sit at the bottom of each block, with their labels, full width.
- `kakao-table`: two small, backwards-compatible changes to its list-data drawing: further heading rows (a filter row) survive a redraw, and the heading row is only rebuilt when the columns change, so focus on a sort button or filter field is kept when the rows are replaced.
- Settings block (`--kakao-grid-view-*`), construction page, demo page; a card on `components.html` (after File upload), replacing the "Grid view" placeholder; style guide audit row; changelog entry.

## Capabilities

### New Capabilities
- `grid-view`: sources, filters (client and server), action column, paging and summary, sorting, selection, wrapped form, states, words, theming hooks.

### Modified Capabilities
- `table`: Extension points (heading rows kept, heading row stable across row changes).

## Impact

- New: `components/grid-view/{grid-view.js,grid-view.css,demo.html,construction.html}`. Needs `table.js` / `table.css`; uses `kakao-pagination`, `kakao-text-input`, `kakao-select`, `kakao-button`, `kakao-empty-state` where they are defined.
- Changed: `components/table/table.js` (`_build`), its header comment, the table spec.
- Pages: `components.html`, `styleguide.html` (audit row). Not on `kitchen-sink.html`: that page is one settings form without a list.
- `CHANGELOG.md`. `.github/workflows/pages.yml` copies `components/` wholesale, so it is unchanged. No new token, no theme change.
