# Design

## Context

Long pages need an "On this page" list that follows the reader. components.html fakes one: a `kakao-aside-menu` in the header bar (persistent sidebar from 1440px, a hamburger drawer below), whose `list-data` a page script builds from the cards, and which only marks the item that was clicked. A blog article page needs the same thing plus scrollspy, without page script.

## Goals / Non-Goals

**Goals:** one element that lists a target's headings (or hand-written links), marks the current section, scrolls there smoothly and accessibly, sticks in a sidebar and folds on narrow screens.

**Non-Goals:** scroll containers other than the window (the observer root is the viewport); reading progress bars; numbering entries; generating a toc on the server.

## Decisions

- **Shadow DOM.** The toc styles only itself; hand-written lists inside it are light-DOM source (and the no-script fallback), not slotted.
- **Target lookup.** `for` is tried as an id first, then as a selector, so `for="post"` and `for="article.post"` both work. Default `main`, then `body`. Headings in closed dialogs (no client rects) are skipped, which keeps example dialogs on components.html out without markup.
- **Ids.** Slug from the text (NFKD, strip combining marks, `[^a-z0-9]+` to `-`), uniquified against `document.getElementById`. Assigned once; since the id is then present, a rebuild keeps it.
- **Scrollspy.** An `IntersectionObserver` per build observes the listed headings with `rootMargin: -offset 0 0 0` and thresholds `[0, 1]`; its callback only schedules a recompute (one per frame). The recompute picks the last heading whose top is at or above the offset line, reading heading rects (cheap for tens of headings). A passive window scroll listener schedules the same recompute, because the bottom-of-page rule and fast jumps past several headings do not always cross an observer threshold. At the bottom (`scrollY + innerHeight >= scrollHeight - 2`) the last heading wins.
- **Click lock.** After a click the target entry stays active until the scroll settles (`scrollend`, with a timer fallback), so a short last-but-one section is not overruled by the bottom rule mid-scroll or right after.
- **Offset.** `offset` attribute in px; otherwise `--kakao-header-bar-rendered-height` read from the root element plus 16px, so it follows the page bar.
- **History.** A click pushes the hash (`history.pushState`), as a native anchor would, so back returns; `hashchange` and `popstate` re-activate. Focus moves to the heading with `tabindex="-1"` (added only if needed) and `preventScroll`.
- **Rebuild.** A `MutationObserver` on the target (`childList`, `subtree`, `characterData`) debounced to one rebuild per frame; mutations inside the toc are ignored. Rendering is skipped when the computed entry list did not change, so typing into the page does not redraw.
- **Folding.** `collapse="auto|always|never"`, reusing the checker's existing `COLLAPSE` value set; `collapse-below` is a CSS length for a `matchMedia('(max-width: …)')`. The toggle is a native `<button>` with `aria-expanded` / `aria-controls` showing "On this page · <section>"; a chevron turns.
- **Events.** `toc-change` on the element; `section-change` through the trigger API, registered with `KakaoComponents.register('kakao-toc', { triggers: ['section-change'] })`, so e.g. a header bar could show the section later without knowing the toc.
- **Look.** Muted links, the active one in the text colour at weight 600 with a 2px marker on the inline start in the primary role; levels indent by `--kakao-toc-indent`. Hover fill subtle, radius 6, as breadcrumb links.

## components.html

The aside menu and its builder script go. A `kakao-toc` (`headings=".component-head h2, #missing"`, `heading="Components"`, `sticky`, `collapse="auto"`, `collapse-below="75rem"`) sits in `main` after the page header. From 75rem `main` widens and becomes a two-column grid: the toc in a 14rem column spanning all rows, everything else in the content column. Below that the toc is a sticky folded bar under the page bar, with the page background. The page links (Home, Kitchen sink, Style guide, Main variables, Changelog) move to the header bar's `nav` slot; the menu's "Settings" link goes, as the gear button in the bar opens the same dialog. `aside-menu.js` / `.css` stay loaded for the Aside menu card. The card ids came from the old script; now the toc gives the headings slug ids, so `#accordion` etc. keep working.

Lost from the old menu: the hamburger drawer (focus trap, Escape, push animation) on narrow screens, and the sidebar's own page-links block; the menu's 1440px persistent breakpoint becomes 75rem.

## Risks / Trade-offs

- The scroll listener runs on every scroll; it is passive and coalesced to one rect pass per frame.
- Headings inside `[hidden]` or closed elements are skipped at build time; opening them later triggers a rebuild only if the DOM changes (attributes are not observed). `refresh()` covers the rest.
