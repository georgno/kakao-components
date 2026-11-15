# Tasks

## 1. Component

- [x] 1.1 `components/pagination/pagination.js`: shadow DOM with settings block; `page`, `total-pages`, `total-items`, `page-size`, open-ended with `last`; ellipsis window from `siblings` / `boundaries`; `url` links or buttons; cancelable `page-change`; previous / next / `first-last` with SVG chevrons; `nav` landmark, `aria-current`; compact form with ResizeObserver and `collapse`; `summary`; `page-sizes` select (native or `kakao-select`) with `page-size-change`; `size`, `disabled`, `hide-single`; methods and properties; `KakaoPagination.texts`; forced colours, reduced motion; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/pagination/demo.html`: demo-page card convention with code tiles: pages, window, links, compact, page size, sizes, states, script, words. Verify: loads without console errors.
- [x] 1.3 `components/pagination/construction.html`: preview plus a manifest for every `--kakao-pagination-*` property. Verify: the settings table lists every property.

## 2. Pages

- [x] 2.1 `components.html`: Pagination card after Number input, script tag added, "Pagination" placeholder removed from "Not built yet". Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased "Added" entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: window correct at start / middle / end, compact form at 390px with no horizontal scroll, links carry the template, Enter and Space activate, focus kept, cancelling `page-change` keeps the page, methods clamp, page-size change keeps the first item, no console errors.

## Workflow follow-up

- Archive the change once every task is done.
