# pagination Specification

## Purpose
`<kakao-pagination>` pages through a long list: previous and next, page numbers with an ellipsis window, and a compact summary form. It stands alone, as real links for server-rendered pages or as buttons with an event, so a table or grid can put one below itself.

## Requirements

### Requirement: Pages and totals
The `page` attribute SHALL name the current page, 1-based, 1 by default. The number of pages SHALL come from `total-pages`, or from `total-items` divided by `page-size` (20 by default), rounded up. The current page SHALL be clamped to the number of pages and the attribute SHALL reflect the state after the component changes or clamps it. With neither total the pager SHALL be open-ended: next stays available until the `last` attribute marks the current page as the last one.

#### Scenario: From a page count
- **WHEN** a pager has `page="3" total-pages="12"`
- **THEN** page 3 is current and the last page shown is 12

#### Scenario: From an item count
- **WHEN** a pager has `total-items="143" page-size="20"`
- **THEN** it has 8 pages

#### Scenario: Clamped
- **WHEN** a pager has `page="99" total-pages="5"`
- **THEN** page 5 is current and the attribute reads "5"

#### Scenario: Open-ended
- **WHEN** a pager has `page="3"` and no total
- **THEN** next is available, and it is unavailable once `last` is set

### Requirement: Ellipsis window
The full form SHALL show `boundaries` pages at the start and the end (1 by default) and `siblings` pages on each side of the current one (1 by default), with an ellipsis where pages are left out. When there are more pages than `boundaries * 2 + siblings * 2 + 3`, exactly that many slots SHALL be shown on every page, and a gap that would hide a single page SHALL show that page instead. The ellipsis SHALL be an inline SVG in currentColor hidden from assistive technology.

#### Scenario: Middle
- **WHEN** a pager has `page="10" total-pages="20"`
- **THEN** it shows 1, an ellipsis, 9, 10, 11, an ellipsis, 20

#### Scenario: Start
- **WHEN** a pager has `page="1" total-pages="20"`
- **THEN** it shows 1 to 5, an ellipsis, 20

#### Scenario: Few pages
- **WHEN** a pager has `total-pages="7"`
- **THEN** all seven pages are shown without an ellipsis

### Requirement: Links or buttons
With a `url` attribute every control SHALL be a link whose `href` is the template with `{page}` replaced by the page number and `{page-size}` by the page size; the previous and next links SHALL carry `rel="prev"` and `rel="next"`. Without `url` the controls SHALL be native buttons. A control that is not available SHALL stay in place with `aria-disabled="true"`, a link without `href`.

#### Scenario: Link template
- **WHEN** a pager has `page="2" page-size="20" url="?page={page}&per-page={page-size}"`
- **THEN** its next control is a link to "?page=3&per-page=20"

#### Scenario: Buttons
- **WHEN** a pager has no `url`
- **THEN** its controls are buttons

#### Scenario: First page
- **WHEN** the current page is 1
- **THEN** the previous control has `aria-disabled="true"` and activating it does nothing

### Requirement: Page change event
Activating a control for another page SHALL fire `page-change`, bubbling, composed and cancelable, with `{ page, previous, pageSize, source }`, `source` being "user". Unless it is cancelled the pager SHALL move to that page, and a link SHALL be followed. When it is cancelled the page SHALL stay and a link's navigation SHALL be prevented.

#### Scenario: Button mode
- **WHEN** someone activates page 4 on a pager at page 3
- **THEN** `page-change` fires with `{ page: 4, previous: 3 }` and page 4 is current

#### Scenario: Cancelled
- **WHEN** a listener calls `preventDefault()` on `page-change`
- **THEN** the current page does not change and a link is not followed

### Requirement: No event without an activation
Setting a property or an attribute SHALL NOT fire an event. A click on a link with a modifier key or a non-primary button SHALL be left to the browser without an event.

#### Scenario: Silent attribute
- **WHEN** a script sets `page="6"`
- **THEN** page 6 is current and no event fires

#### Scenario: New tab
- **WHEN** someone clicks a page link with the Ctrl key held
- **THEN** no `page-change` fires and the browser opens the link

### Requirement: Semantics
The pager SHALL be a navigation landmark with an accessible name from `label`, "Pagination" by default. The current page SHALL carry `aria-current="page"`. Page controls SHALL have the accessible name "Page N"; previous, next, first and last SHALL be inline SVG chevrons in currentColor with accessible labels. The words SHALL be changeable for every pager through `KakaoPagination.texts`.

#### Scenario: Current page
- **WHEN** a pager with `page="3"` is rendered
- **THEN** exactly one control has `aria-current="page"`, the one for page 3

#### Scenario: Other words
- **WHEN** a script sets `KakaoPagination.texts = { next: 'Weiter' }`
- **THEN** the next control of every pager is labelled "Weiter"

### Requirement: Keyboard and focus
Every available control SHALL be reachable with Tab and activated with Enter (and Space on buttons), with a visible focus outline. After a change, focus SHALL stay on the control that was used, or move to the current page when a number was picked.

#### Scenario: Focus kept at the end
- **WHEN** someone activates next with the keyboard and reaches the last page
- **THEN** focus is still on the next control, now `aria-disabled`

### Requirement: First and last
With `first-last` the full form SHALL add a first-page control before previous and a last-page control after next, unavailable on the first and last page respectively.

#### Scenario: First and last
- **WHEN** a pager has `first-last page="7" total-pages="40"`
- **THEN** it shows first, previous, the pages, next and last controls

### Requirement: Compact form
The compact form SHALL show a summary with previous and next only: "{from}–{to} of {total}" when `total-items` is known, "Page N of M" from a page count, "Page N" when open-ended. An open-ended pager SHALL always be compact. The `compact` property SHALL tell whether the compact form is showing.

#### Scenario: Compact summary
- **WHEN** a compact pager has `page="2" total-items="143" page-size="20"`
- **THEN** it shows "21–40 of 143" with previous and next and no page numbers

### Requirement: Collapse
With `collapse="auto"` (the default) the pager SHALL be compact when its page controls do not fit the element's own width; `collapse="always"` SHALL force the compact form and `collapse="never"` SHALL let the page controls wrap instead.

#### Scenario: Always
- **WHEN** a pager has `collapse="always"`
- **THEN** it shows the compact form at any width

#### Scenario: Phone width
- **WHEN** a pager with 20 pages is 320px wide
- **THEN** it shows the compact form and does not scroll sideways

#### Scenario: Never
- **WHEN** the same pager has `collapse="never"`
- **THEN** the page numbers wrap onto more lines

### Requirement: Summary
The `summary` attribute SHALL show the summary text in the full form too. The summary SHALL be a status region, and SHALL read "No entries" when `total-items` is 0.

#### Scenario: Summary
- **WHEN** a pager has `summary page="2" total-items="143" page-size="20"`
- **THEN** it shows "21–40 of 143" beside the page numbers

#### Scenario: No items
- **WHEN** a pager has `total-items="0"`
- **THEN** the summary reads "No entries"

### Requirement: Page size select
`page-sizes`, a comma-separated list, SHALL add a labelled "Rows per page" select holding those sizes and the current one: a native select, or a `kakao-select` where that element is defined. Picking a size SHALL fire `page-size-change`, bubbling, composed and cancelable, with `{ pageSize, previous, page }`, `page` being the page that contains the first item of the current one. Unless cancelled the pager SHALL take both, and with a `url` containing `{page-size}` it SHALL go to that link.

#### Scenario: Larger size
- **WHEN** a pager at page 5 with 10 per page gets 20 picked
- **THEN** `page-size-change` fires with `{ pageSize: 20, previous: 10, page: 3 }` and the pager shows page 3

### Requirement: Sizes and states
`size` SHALL be `sm`, `md` (default) or `lg`, with control heights of 36, 44 and 52px. With `disabled` no control SHALL be activatable and all SHALL carry `aria-disabled="true"`. With `hide-single` the pager SHALL render nothing while there is at most one page.

#### Scenario: Small
- **WHEN** a pager has `size="sm"`
- **THEN** its controls are 36px high

#### Scenario: Disabled
- **WHEN** a pager has `disabled` and someone clicks next
- **THEN** nothing changes and no event fires

#### Scenario: One page
- **WHEN** a pager has `hide-single total-pages="1"`
- **THEN** nothing is shown

### Requirement: Methods and properties
`next()`, `previous()`, `first()`, `last()` and `goTo(page)` SHALL move the pager, clamped to its pages, fire `page-change` with `source` "api", and return whether the page changed. The properties `page`, `pageSize`, `totalPages`, `totalItems` and `disabled` SHALL get and set the state; `from` and `to` SHALL give the 1-based item range of the page, or null without `total-items`.

#### Scenario: Next
- **WHEN** a script calls `next()` on a pager at page 5 of 30
- **THEN** it returns true, page 6 is current and `page-change` fired with `source: "api"`

#### Scenario: Clamped
- **WHEN** a script calls `goTo(999)` on a pager with 30 pages
- **THEN** page 30 is current

#### Scenario: Range
- **WHEN** a pager has `page="8" total-items="143" page-size="20"`
- **THEN** `from` is 141 and `to` is 143

### Requirement: Theming hooks
Every visual value SHALL be a `--kakao-pagination-*` custom property with its default in the component's one settings block, colours defaulting to theme roles with a literal fallback, editable on `components/pagination/construction.html`. The hover transition SHALL be off under reduced motion, and the current page SHALL stay distinguishable in forced colours.

#### Scenario: Theme
- **WHEN** the page theme changes
- **THEN** the pager's colours follow without any setting of its own

#### Scenario: Override
- **WHEN** a page sets `--kakao-pagination-current-bg`
- **THEN** the current page uses that fill
