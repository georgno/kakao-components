# Tasks

## 1. Library

- [x] 1.1 shared/page-transition.js: generic docs and code; events start/swap/end; head carried across; loader pre-load; page scripts from the new page; signal, wait, aria-current; busy kept.
- [x] 1.2 kakao-tabs selects on page-transition-swap; header-bar solid during a page transition; page-cloak.js waits for the loader.

## 2. Site

- [x] 2.1 Six top-level pages: loader head, shared header bar (shared/site-shell.css), content region, marked and re-runnable scripts; construction.js marks unsaved edits busy.

## 3. Docs and checks

- [x] 3.1 CATALOG.md, tools/vendor.js, kakao-ui skill (node tools/skills.js), AGENTS.md, CHANGELOG.
- [x] 3.2 Verify in Chromium (swaps both ways, Back/Forward, focus, styles, theme switch, reduced motion, 390px, console) and tools/visual-check.js; the checks.

Notes: Chromium, all six pages swapped both ways (each landed page within 0.6% of a direct load; tokens differs only by a tabs-thumb race that also shows on direct loads and on components/tabs/construction.html), Back/Forward without reload, focus on `<main>`, aria-current follows, theme menu works after a swap, the hero's theme walk is undone on leaving, reduced motion swaps without a view transition, 390px no sideways scroll, a #fragment Back is no swap, busy navigates normally, no console errors; also on the minified copy. visual-check: one finding (index checkbox focus), present before this change.
