# Tasks

## 1. Component

- [x] 1.1 `components/header-bar/header-bar.js`: shadow DOM `<header>` with surface layer, start / title / nav / end slots, `nav-label`, settings block, scroll watcher (`scrolled`, `no-scroll-watch`), fallbacks for reduced transparency / motion, no backdrop-filter, forced colours. Verify: no literal closing script tag in the file; bar renders and toggles `scrolled` on scroll in the browser.
- [x] 1.2 `components/header-bar/demo.html`: examples (tools only, menu + title + tools, nav links, manual scrolled state) plus an event-free attribute playground. Verify: page loads without console errors, the page's own bar sticks and frosts on scroll.
- [x] 1.3 `components/header-bar/construction.html`: preview (top and scrolled state over a busy background) and manifest for every `--kakao-header-bar-*` property. Verify: the settings table lists every property of the settings block with no warnings.

## 2. Shared CSS

- [x] 2.1 `shared/demo.css` and `shared/construction.css`: drop the fixed-corner rules, add `scroll-padding-top` and the bar's page padding, move the sticky construction canvas below the bar, reduce `main` top padding. Verify: demo and construction pages show content at about the same height as before.

## 3. Pages

- [x] 3.1 `index.html`: theme menu and settings gear in the bar's `end` slot; phone gutter via `--kakao-header-bar-padding-x`. Verify: theme menu, settings dialog and the wall's theme demo stop-on-menu-open still work.
- [x] 3.2 `components.html`: aside menu in `start`, theme menu + gear in `end`, header-bar card added to the list. Verify: hamburger opens the menu below 1440px, persistent sidebar above it, card jumps land below the bar.
- [x] 3.3 `kitchen-sink.html`: aside menu in `start`, theme switch in `end`; header bar mentioned/used in the form context. Verify: menu works, tabs jump.
- [x] 3.4 `styleguide.html` (bar + component audit row), `tokens.html`, `changelog.html`. Verify: TOC anchors land below the bar.
- [x] 3.5 Every `components/*/demo.html` and `components/*/construction.html`: replace the fixed theme switch with the bar; aside-menu demo drops the theme-switch duck. Verify: grep finds no `class="page-theme-switch"` outside a bar.
- [x] 3.6 `shared/settings-dialog.js` comment and `CHANGELOG.md` Unreleased entry. Verify: read.

## 4. Verification

- [x] 4.1 Headless browser: every touched top-level page plus a sample of demo/construction pages at 1280px and 390px, at scroll top and scrolled, light and dark; `node tools/check-themes.js` passes.

## Workflow follow-up

- Archive the change once every task is done.
