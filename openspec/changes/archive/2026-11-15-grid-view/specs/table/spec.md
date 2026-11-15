# Spec Delta

## MODIFIED Requirements

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
