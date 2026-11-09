# Proposal

## Why

Every project page puts its top controls (theme switch or theme menu, settings gear, the site menu's hamburger) in ad-hoc `position: fixed` corners. They float over the content when the page scrolls, have no landmark, and each page lines them up by hand. A real page header component gives them one semantic, sticky home that stays readable over scrolled content.

## What Changes

- New component `<kakao-header-bar>` (`components/header-bar/`): a sticky `<header>` (banner landmark) with `start`, centre (default slot, the title) and `end` slots, plus a `nav` slot wrapped in a labelled `<nav>` that only exists when something is slotted into it.
- Scroll effect: transparent at the top of the page (today's look: the controls float with no bar behind them); once the page is scrolled, a translucent page-colour background with a backdrop blur and a hairline. Solid under `prefers-reduced-transparency`, without backdrop-filter support and in forced colours; no transition under `prefers-reduced-motion`. Scrolling is detected with one passive, rAF-throttled scroll listener that toggles a `scrolled` attribute.
- Settings block (`--kakao-header-bar-*`), construction page, demo page; listed on `components.html`, in the style guide's component audit and on `kitchen-sink.html`.
- Every project page replaces its fixed top tools with the bar: `index.html` and `components.html` (theme menu + settings gear in `end`), `components.html` and `kitchen-sink.html` (the aside menu's hamburger in `start`), `styleguide.html`, `tokens.html`, `changelog.html` and every component demo and construction page (theme switch in `end`).
- `shared/demo.css` / `shared/construction.css`: the fixed-corner rules go; anchors and sticky elements leave room for the bar (`scroll-padding-top`, sticky construction canvas offset); top paddings shrink so content stays roughly where it was.

## Capabilities

### New Capabilities
- `header-bar`: the sticky page header component: structure and landmarks, slots, the scroll effect and its accessibility fallbacks, theming hooks.

### Modified Capabilities
<!-- none: the page changes are project-page chrome, not component requirements -->

## Impact

- New: `components/header-bar/{header-bar.js,demo.html,construction.html}`.
- Pages: `index.html`, `components.html`, `kitchen-sink.html`, `styleguide.html`, `tokens.html`, `changelog.html`, all `components/*/demo.html` and `components/*/construction.html`.
- Shared CSS: `shared/demo.css`, `shared/construction.css`; comment in `shared/settings-dialog.js`.
- `CHANGELOG.md` (Unreleased). No new top-level file, so `.github/workflows/pages.yml` is unchanged (`components/` is copied whole).
- No theme changes; `node tools/check-themes.js` is unaffected.
