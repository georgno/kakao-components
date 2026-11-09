# Changelog

All notable changes to kakao-components are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/). Until 1.0.0, a minor version may
change a component's API. Entries under "Site only" change this project's
pages (landing page, settings, demos), not the components.

## [Unreleased]

## [0.2.2] - 2026-11-09

### Changed

- `kakao-button` menus stay on screen sideways: a menu that would run off the
  right edge opens from the button's right edge instead, and one too wide for
  either edge is shifted in.

### Site only

- Settings are a dialog instead of a page: the gear (landing page and
  component list) and any link to `#settings` open it
  (`shared/settings-dialog.js`). It previews the seven themes, like the style
  guide, and links to the construction pages. `settings.html` is gone.
- Landing page and component list: a theme menu in the corner instead of the
  theme switch.
- Landing page wall: a file upload (Subtitles), a chip list with a count
  badge (Library), and async Playback switches whose demo starts on load and
  holds while a menu is open. The Plan card moved to the bottom row, a blank
  card runs into the fade, and the "Open the component list" link is gone.
- Headings: a `<u>` is drawn as a highlighter stroke in the main colour (a
  brush-like stroke that swings back at the end), used on the landing page's
  "actually touch". Forced colours keep a plain underline.
- Landing page on phones: one call to action, and the corner tools and cards
  sit on the page's gutter; the wall's glow no longer makes the page scroll
  sideways.

## [0.2.1] - 2026-11-09

### Added

- `changelog.html`: this file, read and rendered as a page (the landing page
  and the site menu link to it).
- `kakaoCloak.wait(promise)`: a page can keep itself hidden until its own
  content has loaded.

### Changed

- Inter Tight and the Font Awesome icons are served from the repo
  (`shared/fonts/`, `shared/vendor/fontawesome/`): no font CDN, works offline.
- The kitchen sink's header matches the other pages: the menu button top left
  and a breadcrumb; the made-up app's own breadcrumb sits in the settings card.
- Page breadcrumbs call the house "Home"; the colour picker is "Color picker".
- The published site is minified on deploy (`tools/minify-site.mjs`): no
  comments or extra whitespace, about 30% smaller. The repo stays readable.
- Dialogs: with more than one footer button, the main button always sits in
  the corner (first when the buttons sit left). The styleguide says so, and
  the left-aligned demo follows it.

### Fixed

- Animated number: no error when the page loads with a value already set
  (it updated before it was built), and no roll from 0 on load.
- The changelog page was missing from the published site.

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

[Unreleased]: https://github.com/georgno/kakao-components/compare/v0.2.2...HEAD
[0.2.2]: https://github.com/georgno/kakao-components/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/georgno/kakao-components/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/georgno/kakao-components/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/georgno/kakao-components/releases/tag/v0.1.0
