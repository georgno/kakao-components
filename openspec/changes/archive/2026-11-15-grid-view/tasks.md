# Tasks

## 1. Table

- [x] 1.1 `components/table/table.js` `_build`: reuse the `<thead>`, rebuild its first row only when the columns changed, keep further rows, replace only the bodies; document it in the header comment. Verify: the table demo behaves as before; focus stays on a sort button in server sort mode.

## 2. Component

- [x] 2.1 `components/grid-view/grid-view.js`: composition (bar, table, pager), mirrored attributes, client and server modes, filters (kakao or native fields, debounce, server GET), action column (kakao-button / links, icons, confirm, method, visible), `row-action`, `filter-change`, paging and summary, selection across pages, no-matches state, clear filters, wrapped-form disclosure, `KakaoGridView.texts`; header comment documents the API. Verify: no literal closing script tag; no console errors.
- [x] 2.2 `components/grid-view/grid-view.css`: settings block, bar, filter row, action controls, wrapped form, forced colours, reduced motion.
- [x] 2.3 `components/grid-view/demo.html`: demo-page card convention: users grid (filters, actions, paging), orders with selection, server mode with events, Yii2 server markup, wrapped, empty / loading, words.
- [x] 2.4 `components/grid-view/construction.html`: preview plus a manifest for every `--kakao-grid-view-*` property.

## 3. Pages

- [x] 3.1 `components.html`: Grid view card after File upload, script and style tags, placeholder removed.
- [x] 3.2 `styleguide.html` audit row.
- [x] 3.3 `CHANGELOG.md` Unreleased "Added" entry (and the table change).

## 4. Verification

- [x] 4.1 Headless Firefox at 1280px and 390px, a light and a dark theme: filters (debounce, accents, select), sort across pages, paging, summary, actions and `row-action`, confirm, wrapped form with the Filters disclosure, keyboard, no console errors; table demo unchanged.

## Workflow follow-up

- Archive the change once every task is done.
