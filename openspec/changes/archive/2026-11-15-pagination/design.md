# Design

## Decisions

- **Shadow DOM, no slots.** Everything shown is derived from a few numbers, so there is no content to slot. Theme values reach in through the inherited `--kakao-*` properties.
- **Links or buttons, one event.** With `url` the controls are `<a href>` built from the template, so a server-rendered page (Yii2's `?page=2&per-page=20`) works with no script of its own, links open in new tabs, and previous / next carry `rel`. Without `url` they are native buttons. In both modes activation fires a cancelable `page-change`; the default action moves the pager (and lets the link be followed). Cancelling keeps the page and stops the navigation, which is how a client-side router takes over. Clicks with a modifier key or another mouse button are left to the browser. The methods fire the same event with `source: "api"`; setting a property or attribute is silent, so a table can write state back without a loop.
- **Unavailable controls stay in place.** Previous on the first page and next on the last are `aria-disabled` buttons, not `disabled` ones, so keyboard focus is not lost when paging reaches an end. In link mode they are links without `href` (`role="link"`, `aria-disabled`). The current page is a control with `aria-current="page"` that does nothing.
- **Window with a constant number of slots.** `boundaries * 2 + siblings * 2 + 3` slots whenever there are more pages than that; near the ends the window shifts instead of shrinking, and a gap that would hide one page shows that page. The pager keeps its width while paging, so controls do not move under the pointer.
- **Compact form, measured on the element.** A ResizeObserver compares the width the page controls need with the element's own width; when they do not fit, numbers and first / last are hidden and the summary shows. It goes by the element, not the viewport, so it also collapses in a narrow column. `collapse="never"` wraps the numbers instead; `"always"` forces compact. An open-ended pager is always compact.
- **Summary as a status region.** The summary element stays in the DOM and is a `role="status"`, so a page change is read out ("41–60 of 143") where it is visible.
- **Page-size select by composition.** A native `<select>` styled at the control height; where `kakao-select` is already defined (or gets defined later) that element is created instead. The pager never reaches into it: it sets attributes and listens for `change`. Picking a size computes the page that keeps the first visible item in view and fires a cancelable `page-size-change`; with a `url` that contains `{page-size}` the pager then goes to that link.
- **Looks.** Controls use the 36 / 44 / 52px control heights and the button radii (11 / 13 / 15) with a ghost look; the current page is filled in ink like the primary button; focus is the 2px focus outline; disabled is 0.45.

## Out of scope

- Loading rows, sorting, and the table or grid itself.
- A "go to page" field and keyboard shortcuts beyond Tab / Enter / Space.
- Navigating in link mode from the methods: they move the pager and fire the event only.
