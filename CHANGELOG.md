# Changelog

All notable changes to kakao-components are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/). Until 1.0.0, a minor version may
change a component's API. Entries under "Site only" change this project's
pages (landing page, settings, demos), not the components.

## [Unreleased]

### Added

- `kakao-header-bar`: the page's sticky top bar, a `<header>` (banner
  landmark) with `start`, title (default), `nav` and `end` slots; the `nav`
  slot is wrapped in a `<nav>` named by `nav-label`. Transparent at the top of
  the page; once the window is scrolled it sets `scrolled` and turns
  translucent in the page colour with a backdrop blur and a hairline. Solid
  under `prefers-reduced-transparency` and without backdrop-filter support,
  no transition under reduced motion. `no-scroll-watch` lets the page set
  `scrolled` itself. Settings `--kakao-header-bar-*`, construction page and
  demo. Links that don't fit scroll sideways and fade out at each edge with
  more to scroll (`--kakao-header-bar-nav-fade`). A bar that is a direct
  child of `<body>` publishes its rendered height as
  `--kakao-header-bar-rendered-height` on the root element. Side padding
  1.25rem, the page content's gutter.
- Main variable `--kakao-space-below-bar` (8px): the gap between the page
  bar and the first line of content.
- Main variable `--kakao-scroll-fade` (1.5rem): the width of the edge fade
  on sideways scrollers. `kakao-tabs`, `kakao-step-switch` and
  `kakao-switch-group` now fade out at each edge where there is more to
  scroll, none when everything fits (`--kakao-tabs-scroll-fade`,
  `--kakao-step-switch-scroll-fade`, `--kakao-switch-scroll-fade`; the
  header bar's `--kakao-header-bar-nav-fade` follows the same variable).
- `kakao-alert`: an inline message with an icon, an optional title
  (`heading` or `slot="title"`) and the message. `tone` is `info` (default),
  `success`, `warning` or `danger` (alias `error`) and can change at runtime;
  warning and danger get `role="alert"`, info and success `role="status"`,
  unless the page set a role. `dismissible` adds a close button
  (`close-label`). Info and success alerts fade out and hide after 8 seconds
  (`--kakao-alert-duration`); warning and danger stay. `duration` sets the
  time in ms for any tone, `duration="0"` turns it off. The timer pauses on
  hover, while focus is inside and while the tab is hidden; reduced motion
  hides without the fade. Methods `show()`, `hide()` / `close()`; events
  `alert-show`, `alert-hide` (cancelable, with a reason) and `alert-hidden`.
  Settings `--kakao-alert-*`, construction page and demo.
- Main variable `--kakao-color-warning` (light `#b45309`), set in every theme
  and checked by `tools/check-themes.js` for 4.5:1 on the surface.
- `kakao-toast`: a notification region fixed to a corner of the viewport
  (`position`: bottom-right by default, bottom-left, top-right, top-left).
  Its toasts are `kakao-alert` cards, stacked like the yii2-base toast: the
  newest in front, older ones behind it, smaller, paler and tilted back; the
  stack fans out while the pointer or focus is on it (a tap on touch).
  `max` (default 3) limits how many are visible; older ones wait hidden with
  their timers stopped. Timers follow the alert's rule and pause for the
  whole stack while it is fanned out or the tab is hidden. `KakaoToast.show({
  tone, heading, message, duration, dismissible, action })` and the element's
  `show()` return a handle with `close()` and a `closed` promise; written
  `kakao-alert` children are adopted. Polite live region, never takes focus;
  Escape closes the focused toast. Keeps the safe-area insets, sits below the
  header bar in top corners, spans the screen below 30rem and moves beside an
  aside menu opening on its side. Events `toast-show` and `toast-hidden`
  (with a reason). Settings `--kakao-toast-*`, construction page and demo.
- `kakao-progress`: a segmented progress bar. `value` and `max` as on native
  `<progress>` (max defaults to 1); without a value it is indeterminate and
  a highlight sweeps through the segments. `segments` (default 4, `1` = one
  plain bar) splits the bar; the value fills them in order, the last one
  partly. The fill moves smoothly between values, and each segment it
  completes gives a short squash-and-stretch pop (standard easing),
  staggered when a jump completes several. A segment pops once per fill and
  only again after it has emptied; nothing pops on load or going down.
  Reduced motion: no pop, no fill animation, a fade instead of the sweep.
  `role="progressbar"` with `aria-valuenow/min/max`, `value-text` as
  `aria-valuetext`; `label` is shown above the bar and names it,
  `show-value` adds the percentage in tabular figures. `size` sm / md / lg,
  `tone` primary / success / warning / danger. Event
  `progress-segment-complete`. Settings `--kakao-progress-*`, construction
  page and demo. The kitchen sink's plan card shows profile completeness
  with it.
- `kakao-meter`: a gauge, like native `<meter>`, built as a one-piece
  sibling of `kakao-progress` (same track, sizes and label row). `value`,
  `min` (default 0), `max` (default 1), `low`, `high` and `optimum` with
  the native clamping and regions: the fill is green in the optimum region,
  amber in a suboptimal one and red in the even-less-good one (success /
  warning / danger roles). A new value slides the fill length
  (`--kakao-motion-duration`, standard easing) while the colour switches
  at once; no motion under reduced motion or on first render. `role="meter"` with `aria-valuenow/min/max`,
  `value-text` as `aria-valuetext`; `label` names it, `show-value` adds the
  percentage in tabular figures. `size` sm / md / lg; read-only `position`
  and `region`. Settings `--kakao-meter-*`, construction page and demo. The
  kitchen sink's plan card shows the download space with it.

### Changed

- `kakao-checkbox` and `kakao-radio-group`: the box and the dot sit centred on
  the first line of their label at every size, also with a hint or a wrapped
  label (the checkbox row is top-aligned in its host, so centring the box
  adds no gap under it). Radio options are closer together (8px between
  rows, as between stacked checkboxes): `--kakao-radio-group-option-gap` is
  now 4px and `--kakao-radio-group-option-padding` 2px 8px.

### Site only

- Every page's top controls live in a `kakao-header-bar` instead of fixed
  corners: theme menu and settings gear (landing page, components), the theme
  switch (style guide, kitchen sink, main variables, changelog, every demo and
  construction page). On the components page and the kitchen sink the side
  menu's hamburger sits at the bar's left. Anchor jumps stop below the bar.
- Components page: an Alert section replaces the "Toast / alert" placeholder;
  a Toast placeholder stays. The kitchen sink shows a success alert after
  saving; the style guide lists the warning role and audits the alert.
- Components page: a Toast section replaces the Toast placeholder. The kitchen
  sink confirms a save with a success toast instead of the inline alert; the
  style guide audits the toast.

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
