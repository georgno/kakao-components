# Tasks

## 1. Component

- [x] 1.1 `components/table/table.css`: settings block (`--kakao-table-*`, colours on theme roles), table, headings, sort control, checkbox, striped / dense / bordered, sticky header, wrapped form with labels and tools line, scrolling frame with edge fade, empty and loading, forced colours, reduced motion, print. Verify: a table without the script is styled.
- [x] 1.2 `components/table/table.js`: `list-data` and `columns` / `rows` drawn as a native table; enhancement of a child `<table>`; column model and `KakaoTable.types`; sort (`sort`, `sort-mode`, link headings, `sort-change`, `sortBy()`); selection (`selectable`, `selection-name`, `selected`, `selectAll()`, `clearSelection()`, `selection-change`); empty cells; empty state; `loading`; wrapped form by ResizeObserver, tools line; `scroll` with edge fade and a focusable frame; `label`; `KakaoTable.texts`; `table-render`; `refresh()`; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.3 `components/table/demo.html`: demo-page card convention with code tiles: columns, sorting (browser, server), selection (events, form), forms, sticky header, phone (wrapped, scroll, framed), server table (enhanced, Yii2 links, without script), empty and loading, with a pager, from script, words. Verify: loads without console errors.
- [x] 1.4 `components/table/construction.html`: preview plus a manifest for every `--kakao-table-*` property. Verify: the manifest lists every property of the settings block.

## 2. Pages

- [x] 2.1 `components.html`: Table card after Switch group, stylesheet and script added, "Table" placeholder removed from "Not built yet". Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased "Added" entry; `AGENTS.md` light DOM list. Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: sort cycles by keyboard and pointer with `aria-sort`, cancelling `sort-change` keeps the state, server mode leaves the rows, a link heading is followed unless cancelled, selection with select all and indeterminate, the form submits the selected ids, selection survives sorting, replaced rows are enhanced, loading and empty states, sticky header on the page and in the frame, wrapped form at 390px with no horizontal page scroll, sort and select all from the tools line, edge fade and focusable frame with `scroll`, no console errors.

## Workflow follow-up

- Archive the change once every task is done.
