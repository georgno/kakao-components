# Proposal

## Why

Long lists need paging, and the components page still lists Pagination as missing. A Table and a Grid view (Yii2-style data grids) are planned and both need a pager, so it has to stand alone and be easy to wire: real links for server-rendered pages, an event for script-driven ones, and an answer for a phone, where a row of page numbers does not fit.

## What Changes

- New component `<kakao-pagination>` (`components/pagination/`), shadow DOM.
  - `page` (1-based, reflected, clamped) with `total-pages`, or `total-items` and `page-size`; with neither, an open-ended pager (`last` marks the end).
  - `siblings` and `boundaries` set the ellipsis window; the number of slots is the same on every page.
  - `url` template (`{page}`, `{page-size}`): every control is a real link. Without it, buttons. Both fire a composed, cancelable `page-change` (`{ page, previous, pageSize, source }`).
  - Previous / next, optional `first-last`, own inline SVG chevrons with accessible labels; a `nav` landmark named by `label`; `aria-current="page"`.
  - Compact form (summary "21–40 of 143" or "Page 2 of 8" with previous / next): `collapse` auto (when the numbers do not fit the element's own width), always, never.
  - `summary` shows the range in the full form too; `page-sizes` adds a "Rows per page" select (native, or `kakao-select` where loaded) firing a cancelable `page-size-change`.
  - `size` sm / md / lg at the 36 / 44 / 52px control heights; `disabled`; `hide-single`.
  - Methods `next()`, `previous()`, `first()`, `last()`, `goTo()`; properties `page`, `pageSize`, `totalPages`, `totalItems`, `disabled`, `from`, `to`, `compact`; `KakaoPagination.texts` for the words.
- Settings block (`--kakao-pagination-*`), construction page, demo page; a card on `components.html` (alphabetical, after Number input) replacing the "Pagination" placeholder; style guide audit row; changelog entry.

## Capabilities

### New Capabilities
- `pagination`: pages and totals, the ellipsis window, links and buttons, events, semantics, compact form, summary and page size, sizes and states, methods, theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/pagination/{pagination.js,demo.html,construction.html}`. No dependency on other components; it composes a `kakao-select` only where that element is already defined.
- Pages: `components.html` (new card, placeholder removed), `styleguide.html` (audit row). Not on `kitchen-sink.html`: that page is one settings form with no list to page.
- `CHANGELOG.md` (Unreleased, Added). `.github/workflows/pages.yml` copies `components/` wholesale, so it is unchanged. No new token, no theme change.
