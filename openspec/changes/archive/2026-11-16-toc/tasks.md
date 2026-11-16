# Tasks

## 1. Component

- [x] 1.1 `components/toc/toc.js`: shadow DOM with settings block; entries from headings (`for`, `levels`, `headings`, `data-toc-ignore`, `data-toc-title`), `list-data`, `items` and a nested list; slugged ids; nav with `label`, `heading`, `heading-level`; scrollspy with offset, bottom rule and click lock; MutationObserver, hash and history; smooth scroll with reduced motion, focus and pushState; `sticky`, `nested`, `collapse`, `collapse-below`; `toc-change` and the registered `section-change` trigger; `refresh`, `scrollToId`, `items`, `activeId`, `KakaoToc.texts`; forced colours; header comment documents the API and `force`. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `tools/style-check/helpers.js`: `VALUES` for `kakao-toc` (`collapse`, `nested`). Verify: `node --test`.
- [x] 1.3 `components/toc/demo.html`: demo-page card convention: a blog article with a sticky sidebar toc, levels and selector, nested="active", folded, hand-written list-data and list, events and API. Verify: loads without console errors.
- [x] 1.4 `components/toc/construction.html`: preview plus a manifest for every `--kakao-toc-*` property. Verify: manifest and settings block list the same properties.

## 2. Pages

- [x] 2.1 `components.html`: replace the aside menu and its builder script with a `kakao-toc` (sticky sidebar from 75rem, folded sticky bar below), page links into the header bar's `nav` slot; Toc card after Toast. Verify: renders at 1280px and 390px, the toc follows the scroll.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased: "Added" entry for the toc, "Changed" entry for components.html (keeping the existing button entry). Verify: read.

## 3. Verification

- [x] 3.1 `node tools/style-check.js`, `node --test`, `node tools/check-themes.js` pass.
- [x] 3.2 Headless Firefox at 1280px and 390px, a light and a dark theme: entries, active marker and folding readable; scrolling moves the active entry; a click scrolls, updates the hash and focuses the heading; no horizontal scroll at 390px; no console errors.

## Workflow follow-up

- Archive the change once every task is done.
