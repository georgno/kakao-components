# Tasks

## 1. Component

- [x] 1.1 `components/description-list/description-list.js`: shadow DOM `<dl>` with settings block, rows from `list-data` (pairs, objects, value arrays, text only), rows from `<dt>` / `<dd>` children through manual slot assignment with a MutationObserver, empty-value placeholder with spoken label, `layout`, `columns`, `dividers`, `size="sm"`, `align="end"`, `label`, ResizeObserver for stacking and first/last line; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/description-list/demo.html`: demo-page card convention with code tiles: data, objects, rich children, both, several values, empty values, layouts, dividers and size, columns, align, playground. Verify: loads without console errors; every card has a code tile.
- [x] 1.3 `components/description-list/construction.html`: preview plus a manifest for every `--kakao-description-list-*` property. Verify: the settings table lists every property.

## 2. Pages

- [x] 2.1 `components.html`: Description list card between Date input and Dialog, script tag added, "Description list" placeholder removed, the page's plain `dt` / `dd` rule narrowed to `dl > dt` / `dl > dd`. Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased "Added" entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: readable, aligned, stacks at 390px with no horizontal scroll, columns collapse, accessibility tree shows terms and definitions, Tab reaches links in values, children added by script appear, no console errors.

## Workflow follow-up

- Archive the change once every task is done.
