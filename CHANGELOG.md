# Changelog

All notable changes to kakao-components are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/). Until 1.0.0, a minor version may
change a component's API.

## [Unreleased]

## [0.2.0] - 2026-11-09

### Added

- Breadcrumb component: title/url pairs or objects, a house icon (or start
  text from a constant) first, the current page last, cancelable
  `breadcrumb-navigate` for single-page apps.
- Demo pages and the component list start with a breadcrumb back to the list.
- `shared/page-cloak.js`: pages appear once their components and fonts are
  ready, instead of flickering in on reload.
- The landing page shows the version and links to this changelog.

### Changed

- The site menu's open button sits fixed in the top-left corner, so every
  page's header lines up; it hides while the menu is open.

### Fixed

- The aside menu no longer flashes its raw links before it has loaded.
- The landing page's component count (24, not 20).

## [0.1.0] - 2026-11-09

The first tagged version: everything built so far.

### Components

Vanilla web components, no dependencies and no build step. Each one has a
demo page and a construction page.

- **Actions:** button (variants, sizes, toggle, segment, menu form, async
  run), theme switch.
- **Choice:** switch group, step switch, checkbox, radio group, tabs.
- **Input:** text input, textarea, number input, slider, colour picker, multi
  dropdown (date with unknown parts), file upload.
- **Display:** card (footer-button glow, height glide), animated number, list,
  popover, badge, chip, chip list.
- **Overlay and layout:** dialog (modal, footer layouts, corners that follow
  the footer buttons), aside menu.

### Design system

- Main variables in `shared/tokens.css`: colour roles (including success),
  spacing, radius, font, motion duration, standard and spring easing.
- Seven themes in `shared/themes.css` (light, beige, umber, dark, amoled,
  catppuccin, forest), all checked for WCAG AA by `node tools/check-themes.js`.
- Trigger API (`shared/component-api.js`) for components that react to each
  other without knowing each other.
- `styleguide.html`: the rules, a component audit and the proposed scales.

### Tooling and pages

- Construction pages with live preview and settings, saved into each
  component's settings block by `node tools/construct-server.js`.
- `components.html` (the component list), `kitchen-sink.html` (every
  component in one realistic form), `tokens.html` (main variables) and
  `index.html` (the hero page).
- Specs and change history in `openspec/`.

[Unreleased]: https://github.com/georgno/kakao-components/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/georgno/kakao-components/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/georgno/kakao-components/releases/tag/v0.1.0
