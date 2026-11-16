# Proposal

## Why

Long pages, such as a blog article or the components page itself, need an "On this page" list that shows where the reader is. Today each page builds one by hand (components.html fills an aside menu from its cards with a script and only marks the item that was clicked), and nothing follows the scroll position.

## What Changes

- New component `<kakao-toc>` (`components/toc/`), shadow DOM: a table of contents with a built-in scrollspy.
  - Entries from the headings of a target (`for`: an id or a CSS selector; default the page's `main`), the levels in `levels` (default `2-3`) or any CSS selector in `headings`; nested by level. A heading without an id gets a stable slugged one. Headings with `data-toc-ignore`, or inside one, are left out.
  - Or hand-written: `list-data` (JSON `[{ "title", "href" | "id", "children" }]`) or a nested `<ul>` / `<ol>` of `#` links inside the element (also the no-script fallback).
  - Scrollspy: an `IntersectionObserver` on the target headings, an offset for the sticky page bar (`offset`, default the bar's published height plus a small gap), the last section wins at the bottom of the page; the active link carries `aria-current="location"`. A `MutationObserver` rebuilds the list when headings change; hash navigation and back / forward update it.
  - A click scrolls smoothly (instantly under reduced motion), moves focus to the heading and pushes the hash without a jump.
  - `<nav>` named by `label` (default "On this page"), optional visible `heading`; `sticky` for a sidebar; `nested="active"` shows deeper levels only under the active section; `collapse="auto|always|never"` folds the list behind a toggle that shows the current section (`auto` below `collapse-below`, default `48rem`).
  - Event `toc-change` (bubbling, composed) and the trigger `section-change` registered in `shared/component-api.js`; methods `refresh()`, `scrollToId(id)`; properties `items`, `activeId` (settable); `KakaoToc.texts`.
- `components.html`: its section menu (the `kakao-aside-menu` in the header bar, filled from the cards by a page script) is replaced by a `kakao-toc` in a sticky sidebar column on wide screens and a sticky, folded "On this page" bar on narrow ones. The page links move into the header bar's `nav` slot. The script that built the menu goes.
- Settings block (`--kakao-toc-*`), construction page, demo page (with a blog article); a Toc card on `components.html` (alphabetical, after Toast); style guide audit row; `VALUES` for `collapse` and `nested`; changelog entry.

## Capabilities

### New Capabilities
- `toc`: entry sources, heading ids, scrollspy, navigation, collapse and nesting, events and theming hooks.

### Modified Capabilities
- `component-overview`: the overview page gets a table of contents of its component cards that follows the scroll position.

## Impact

- New: `components/toc/{toc.js,demo.html,construction.html}`. No dependency on other components.
- Pages: `components.html` (menu replaced, new card), `styleguide.html` (audit row). Not on `kitchen-sink.html`: a settings form with tabs, not a long reading page.
- `tools/style-check/helpers.js` (`VALUES`). `CHANGELOG.md` (Unreleased, Added and Changed). `.github/workflows/pages.yml` copies `components/` wholesale: unchanged. No new token, no theme change.
