## ADDED Requirements

### Requirement: Swap marked regions
`shared/page-transition.js` SHALL turn a click on a same-origin link inside an element marked `data-page-transition` into a fetch of that page and a replacement of the regions marked `data-page-transition-content="<key>"`, paired by key, inside `document.startViewTransition` where available and not under `prefers-reduced-motion: reduce`. It SHALL push a history entry, follow Back and Forward, set the title, scroll to the top and focus the region marked `tabindex="-1"`. It SHALL navigate normally when the fetch fails, the response is not HTML, the server redirected, the fetched page has a region the current one lacks or none in common, a screen set `kakaoPageTransition.busy`, or a `page-transition-start` listener called `preventDefault()`. A link with a modifier key, a target, `download` or a `#fragment` SHALL be left to the browser.

#### Scenario: Back after a swap
- **WHEN** the user follows an opted-in link and then presses Back
- **THEN** the previous page's regions, title and URL are back without a reload

#### Scenario: Different shell
- **WHEN** the fetched page has no region with a key of the current page
- **THEN** the browser navigates to it normally

### Requirement: Head carried across
A swap SHALL add the fetched page's stylesheets and head `<style>` elements the current page lacks, loaded before the swap, and remove those of the previous page's own head (as written in its source) that the fetched page lacks; elements both pages have and elements scripts inserted SHALL stay. Head scripts with a `src` the current page lacks SHALL load once before the swap. With the loader (shared/kakao.js) on the page, the components the fetched regions use SHALL be loaded before the swap.

#### Scenario: Page-specific CSS
- **WHEN** page A has its own `<style>` and page B another, and the user swaps from A to B
- **THEN** B looks as on a direct load and A's style is gone

### Requirement: Events
The script SHALL dispatch on `document`, with `detail: { url, from }`: `page-transition-start` (cancelable) before a swap, `page-transition-swap` once the new regions are in (before the page scripts run), and `page-transition-end` when the transition has finished. Library components SHALL react to these events in their own files; the script SHALL NOT reach into components.

#### Scenario: Tabs follow
- **WHEN** a kakao-tabs outside the regions has a tab whose URL is the new page
- **THEN** that tab is selected after the swap

### Requirement: Page scripts
Scripts marked `data-page-transition-script` SHALL be taken from the fetched page and run after a swap, in document order; the old page's marked scripts outside the regions SHALL be removed. `kakaoPageTransition.signal` SHALL be an AbortSignal that aborts when its screen is swapped out, and `kakaoPageTransition.wait(promise)` called by a page script during a swap SHALL hold the new screen until the promise settles, capped at one second.

#### Scenario: Listener cleanup
- **WHEN** a page script adds a document listener with `{ signal: kakaoPageTransition.signal }` and the user swaps to another page
- **THEN** the listener is removed

### Requirement: Current link
After a swap, links inside `data-page-transition` containers outside the regions SHALL carry `aria-current="page"` when they point at the new URL and lose it otherwise.

#### Scenario: Site navigation
- **WHEN** the user swaps from Home to Changelog through the header bar
- **THEN** the Changelog link carries aria-current="page" and Home does not
