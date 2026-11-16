# Changelog

All notable changes to kakao-components are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/). Until 1.0.0, a minor version may
change a component's API. Entries under "Site only" change this project's
pages (landing page, settings, demos), not the components.

## [Unreleased]

### Added

- `kakao-toc`: "On this page" for long pages, with a built-in scrollspy.
  Lists the headings of a target (`for`, `levels`, or a `headings`
  selector), nested by level, and gives headings without an id a stable
  slug; or takes hand-written entries from `list-data` or a nested list of
  links. Marks the section being read with `aria-current="location"` (the
  last one at the bottom of the page) and a rounded marker bar that stretches
  (and thins) over to the next entry and settles at its size, follows added or retitled headings,
  hash changes and back / forward. A click scrolls smoothly (instantly
  under reduced motion), pushes the hash and focuses the heading. `sticky`
  for a sidebar, `nested="active"`, `collapse="auto|always|never"` folds it
  behind a toggle that shows the current section. Fires `toc-change` and
  the `section-change` trigger.

- `kakao-tooltip`: a small themed label next to a control, shadow DOM, so
  the name of an icon-only control reaches sighted touch and keyboard users
  too (the native `title` never shows on iOS and rarely on Android). Any
  element opts in with `data-tooltip` (plain text; `data-tooltip=""` turns
  it off) and `data-tooltip-placement`, or a `<kakao-tooltip for="id">`
  belongs to one element; `placement` top, bottom, left or right, flipping
  and kept on screen, in the top layer. Shows after a short hover delay (at
  once when moving between anchors) and on `:focus-visible`; stays while
  the pointer is on the label; Escape dismisses it (and is consumed, so a
  dialog stays open). On touch a 500ms long-press shows it, cancelled by
  moving or scrolling; the click after it is swallowed, the context menu,
  callout and selection are suppressed, and it goes on the next tap, on
  scroll or after 3 seconds. The anchor's own `title` is put aside while it
  shows. Never the accessible name; `aria-describedby` only when the text
  adds to the name. `inline` draws a static sample. Events `tooltip-show` /
  `tooltip-hide`, the `tooltip-ready` trigger, `show()` / `hide()`,
  `KakaoTooltip.show/hide/delays`. Elevation level 3 (the overlay shadow
  with its 1px ring, as menus), the `sm` radius, a 150ms fade (the `fast`
  step).

### Changed

- Components page: the section menu (an aside menu filled by a page
  script) is now a `kakao-toc` that follows the scroll: a sticky sidebar
  from 75rem, a sticky folded bar below. The page links moved into the
  header bar's nav.

- `kakao-button`: an icon-only button shows its name (`label` or
  `aria-label`) as a hover tooltip (`title` on the inner `<button>`). Before,
  the name reached screen readers only and hovering showed nothing. An own
  `title` still wins; `title=""` turns the tooltip off. With `kakao-tooltip`
  loaded (before or after the button, through its `tooltip-ready` trigger)
  the same text goes to `data-tooltip` on the inner `<button>` instead of
  `title`, so the themed label shows it, also on focus and long-press, and
  the native one does not; a `data-tooltip` on the host wins. This applies
  to every button with a title, not only icon-only ones: an own `title` on
  a labelled button shows as the themed tooltip too.

- Radius scale decided: new main variables `--kakao-radius-xs` (4px),
  `-sm` (6px), `-md` (10px), `-lg` (14px) and `-pill` (999px) in
  `tokens.css`, editable on the main-variables page. Every component radius
  setting whose default is on the scale now defaults to its token with the
  same literal fallback (`var(--kakao-radius-sm, 6px)`).

- Every corner on the radius scale: the remaining fixed radii move to the
  nearest step and follow its token (a tie goes to the larger step, a
  hairline to xs), so some corners change visibly. Button, copy button and
  pagination 11 / 13 / 15px → 10 / 14 / 14px (so a dialog corner holding a
  md button is 34px); aside menu and number input 8 → 10px, number input
  touch 12 → 14px; select and tree-view box 5 → 6px; checkbox sm 5 and lg
  7 → 6px; file-upload thumb 7 → 6px, file badge 9 → 10px, icon button
  8 → 10px, type tag 3 → 4px; colour-picker swatch 7 → 6px, area, preview
  and tool buttons 8 → 10px; slider and range-slider input 3 → 4px, track
  1 → 4px; code-input caret and separator 1 → 4px; chip and colour-code
  swatch 2 → 4px; error-summary link focus 2 → 4px. The popover's 4px is
  now the xs step (`--kakao-radius-xs`), no longer an exception.

### Removed

- `--kakao-radius` (8px) main variable: superseded by the radius scale.
  A page that still sets it breaks nothing; the value is no longer read.

### Site only

- Construction, demo and settings-dialog chrome follows the radius scale
  (8 → 10px, 12 → 14px, 5 → 6px, 3 → 4px). Styleguide: Shape no longer
  names outliers, the audit's radius column matches the code, and a new
  component rule "Button titles show as tooltips".

## [0.8.0] - 2026-11-15

### Added

- `kakao-command-palette`: a search over the page's actions, shadow DOM,
  replacing the "Command palette" placeholder. Commands from `list-data` or
  `commands`: `{ id, label, group, keywords, shortcut, icon, href, target,
  value, disabled }`, `icon` as inline SVG (cleaned), `shortcut` as a
  `kakao-kbd` keycap when that is loaded. Opens on `hotkey` (default `Mod+K`,
  `none` to turn it off), `open(query)`, `toggle()` or the `open` attribute;
  Escape, the scrim or the hotkey close it and focus goes back. Case- and
  accent-blind matching on label (piece or letters in order) and keywords
  with highlighted letters, grouped results, `recent` commands in memory,
  `empty-text`. Enter or a click closes, then fires the cancelable
  `command-select` `{ id, value, command }` (also a KakaoComponents trigger);
  an `href` is followed unless cancelled. The WAI-ARIA combobox pattern
  (`aria-activedescendant` on a grouped listbox) with arrows, Home / End and
  PageUp / PageDown; a keyboard hint row; the select's panel look on the
  dialog's scrim, in the top layer; a full-width sheet at the top on a phone;
  `inline` for previews. Commands come only from `list-data`: the trigger API
  in `component-api.js` lists no components and runs no actions.

- `kakao-grid-view`: a data grid in the manner of Yii2's GridView, light DOM
  (`grid-view.css`), composed of `kakao-table` and `kakao-pagination`,
  replacing the "Grid view" placeholder. Columns from `list-data` / `columns`
  take `filter` (a search field, or a dropdown of options with "All"; drawn as
  `kakao-text-input` / `kakao-select` where loaded, else native fields) and
  `actions` (built-in `view`, `update`, `delete` or your own with `label`,
  `icon`, `url` template, `tone: "danger"`, `confirm`, `method`, `visible`;
  icon-only small ghost `kakao-button`s, or links for url actions, each named
  for its row). Confirmations (delete by default) open a `kakao-dialog` with
  Cancel and the action's own button (danger for deletes) when dialog and
  button are loaded; the browser's `confirm()` only as a fallback. Filters, sorts (by the table's column types) and pages in the
  browser with a debounced search (`filter-delay`), a summary ("Showing 1–20
  of 143", filtered count), "Clear filters" and selection kept across pages;
  or `mode="server"`: filter changes go out as GET parameters named by
  `filter-name` (`UserSearch[{key}]`) to `filter-url`, the pager takes
  `total-items` / `page` / `page-url`. Decorates a server-rendered table:
  a `tr.filters` row and a `data-type="actions"` column (Yii's
  `data-confirm` / `data-method` honoured, with a fallback without yii.js).
  Cancelable `filter-change` and `row-action`. On a phone the rows wrap into
  blocks, a "Filters" disclosure with a count opens the fields above them, and
  the actions sit at the bottom of each block with their labels.
  `KakaoGridView.texts` for the words.

- `kakao-menu`: a menu of actions, shadow DOM, replacing the "Menu & context
  menu" placeholder. Items from `list-data` or `items`: strings, `"-"`
  separators, `{ group, items }` with headings, and items with `icon`,
  `shortcut` (a `kakao-kbd` keycap when that is loaded, else text), `disabled`,
  `tone: "danger"`, `type: "checkbox" | "radio"` with `checked`, `href` links
  and `children` submenus. Opens from a trigger (`for`), as a context menu
  (`context-for`: right-click, long-press, Shift+F10, the Menu key), by script
  (`open(anchor)`, `openAt(x, y)`) or `inline`. WAI-ARIA menu keys with
  type-ahead; `placement` with flipping; submenus open under their item when
  there is no room beside (phones). Events `menu-select` (cancelable),
  `menu-open`, `menu-close`. The select's panel look (level 3 with its ring).

- `kakao-tree-view`: nested, collapsible rows (folders, permission groups),
  shadow DOM. Nodes from `list-data` (`id`, `label`, `children`, `icon` as a
  named glyph, `expanded`, `disabled`, `selected`, `lazy`), the `nodes`
  property, or a nested `<ul>` in the element that stays a readable list
  without the script. The WAI-ARIA tree pattern: one tab stop, Up / Down,
  Right to open or enter, Left to close or go to the parent, Home / End,
  type-ahead, `*`, Enter / Space. `selection` single (default), `multiple`
  (checkboxes; parents tick everything under them and show a dash when partly
  ticked) or `none`; `name` sends the selected ids with a form, `leaves-only`
  leaves the parents out. Lazy nodes: a cancelable `tree-expand`, then
  `setChildren(id, nodes)` or a `loadChildren` function, with a spinner
  meanwhile. Events `tree-select`, `tree-toggle`; methods `expand`,
  `collapse`, `toggle`, `expandAll`, `collapseAll`, `clear`, `refresh`;
  `guides` draws level lines; `KakaoTreeView.texts` for the words.
- `kakao-table`: a data table, light DOM (`table.css` with `table.js`). It
  draws a real `<table>` from `list-data` (`{ columns, rows }`; a column has
  `key`, `label`, `type` text or number, `align`, `sortable`, `width`,
  `hideLabel`), or enhances the server-rendered `<table>` it is wrapped
  around, where a heading that is a link (Yii2's sorter) stays a link.
  Sortable headings are buttons with own sort arrows and `aria-sort`; `sort`
  is "name" or "-name"; a cancelable `sort-change` fires, and
  `sort-mode="server"` leaves the rows to the page. `selectable` adds row
  checkboxes and select all with its indeterminate state, `selection-change`
  and `selected`; `selection-name` submits them with a form. `sticky-header`,
  `striped`, `dense`, `bordered`; numbers tabular at the end; an empty cell
  shows "—" read as "Not set". No rows: an empty state (`kakao-empty-state`
  where loaded, or your own `data-table-empty` child); `loading`: placeholder
  rows (`kakao-skeleton` where loaded) and `aria-busy`. Narrower than
  `--kakao-table-stack-below` (36rem, its own width) each row wraps into a
  block of label / value pairs, with "Sort by" and "Select all" above the
  blocks; `scroll` opts in to sideways scrolling in the frame with the edge
  fade. `columns` / `rows` properties with `render()` cells,
  `KakaoTable.types` for own column types, `KakaoTable.texts` for the words.
- `kakao-pagination`: page links for a long list, standing alone so a table
  or grid can put one below itself. `page` (1-based) with `total-pages`, or
  `total-items` and `page-size`; `siblings` and `boundaries` set the ellipsis
  window, which keeps the same number of slots on every page. With `url`
  ("?page={page}&per-page={page-size}") every control is a real link, for
  server-rendered pages; without it they are buttons. Both fire a composed,
  cancelable `page-change` (`{ page, previous, pageSize, source }`).
  Previous / next, optional `first-last`, a navigation landmark with a
  `label`, `aria-current="page"`. A compact form ("21–40 of 143" or "Page 2
  of 8" with previous / next) shows when the numbers do not fit the element's
  own width (`collapse` auto, always, never), and for an open-ended pager
  without a total (`last` marks the end). `summary` shows the range in the
  full form too; `page-sizes` adds a "Rows per page" select (native, or a
  `kakao-select` where it is loaded) that fires `page-size-change`. Sizes
  `sm` / `md` / `lg` at 36 / 44 / 52px, `disabled`, `hide-single`, methods
  `next()`, `previous()`, `first()`, `last()`, `goTo()`, words through
  `KakaoPagination.texts`.
- `kakao-stepper`: where someone is in a multi-step flow, as an ordered list.
  Steps from `list-data` (label, optional `description`, `value` and `state`
  error or done), the current one from `current` (index or value; the number
  of steps means finished). Done steps show a check, the current one is
  `aria-current="step"`, an error step shows an exclamation mark and is read
  as "Error". `orientation` horizontal or vertical; a horizontal stepper with
  less than `--kakao-stepper-min-step-width` per step collapses to "Step 2 of
  4" with the current label over a segmented bar (`collapse` auto, always,
  never). `clickable` (done steps) or `clickable="all"` makes steps buttons
  with arrow-key movement; they fire a cancelable `step-select`, and the
  stepper then moves and fires `stepper-change`. Methods `next()`,
  `previous()`, `goTo()`; words through `KakaoStepper.texts`. It shows
  progress and is not a form control, unlike `kakao-step-switch`.
- `kakao-image`: an image that keeps its place while it loads. Shows a
  `kakao-skeleton` block of its size (`width` and `height`, or `ratio`) until
  the file is there, then fades to the picture (no fade under reduced motion);
  a plain block where `skeleton.js` is not loaded. Loads lazily (`loading`
  lazy or eager), takes `alt` (empty for a decorative image), an optional
  `caption` or `slot="caption"` (figure and figcaption), `fit` cover or
  contain, `radius`, and passes `srcset` and `sizes` on. When the file fails
  the frame shows a muted icon and the alt text. Events `image-load` and
  `image-error`, method `reload()`, property `state`. New demo images
  (`shared/demo-images/landscape-*.svg`, `tall-1.svg`).
- `kakao-avatar`: a person as a small round picture. Shows the image (`src`,
  loaded lazily), the initials of `name` (or `initials`) while it loads, when
  there is none or when it fails, and an icon (`slot="icon"` or a built-in
  person glyph) when there is no name. Sizes xs to xl, `shape` circle or
  square, a fill `tone` picked from the name out of the theme roles, and a
  `status` dot (online, away, busy, offline) that differs by shape and is read
  out (`status-label`). Events `avatar-load` and `avatar-error`.
  `kakao-avatar-group` (same file) overlaps avatars with a ring in the surface
  colour and shows "+N" for the rest (`max`, `total`, `more-label`).
- `kakao-copy-button`: copies a text to the clipboard and confirms it. Copies
  `value` or the text of the element named by `for` (a field's current value);
  labelled (`label`) or icon only, `variant` secondary or ghost, the button's
  three sizes. Shows a check and `copied-label`, announced through a live
  region, and resets after `reset-delay`; shows a cross and `error-label` when
  there is nothing to copy or the browser refuses (falls back to a hidden
  textarea first). Events `copy-success` and `copy-error`, methods `copy()` and
  `reset()`, `slot="icon"` for an own icon.
- `kakao-description-list`: key/value rows for summary and detail screens as a
  real `<dl>`. Rows from `list-data` (`[term, value]` pairs or `{term, value}`
  objects) and/or native `<dt>` / `<dd>` children for values with badges and
  links. Term beside value, stacking by itself when a row gets narrow (a
  phone) or always with `layout="stacked"`; `columns` (2 to 4), `dividers`,
  `size="sm"`, `align="end"` for amounts, and `empty-text` (a dash, read as
  `empty-label`) for values that are not set.
- `kakao-empty-state`: the quiet block for a list, table or card with nothing
  in it: an icon (built-in tray glyph, your own in `slot="icon"`, or
  `no-icon`), `heading` with `heading-level` (default 3), `message` or the
  default slot, and `slot="actions"`, centred; `size="sm"` for tight places.
  No frame of its own: it sits on the surface around it.
- `kakao-error-page`: an error page (404, 500, 503 …) from attributes: the code
  very large and as a diagonal pattern in the background, the heading (common
  codes have a default), message, reference, time and more rows (`list-data`),
  slots for actions and details; embedded in a box or `full` viewport height.
- `kakao-kbd`: keyboard keys as keycaps, a key, a combination (`Ctrl+K`) or a
  sequence (`G I`), from `keys` or the text. `Mod` is Command on a Mac and Ctrl
  elsewhere, and a Mac gets the key symbols (`platform` forces either); sizes
  md and sm, `outline` for coloured backgrounds, `list-data` to rename keys;
  renders nested `<kbd>` with names for the symbols.
- `kakao-rating`: stars to pick a rating or to show one. `max` symbols (5),
  half steps with `step="0.5"`, `clearable` (pick the current value again, or
  Delete / Backspace), `readonly` as one image named "4 of 5" that draws any
  fraction, `show-value` and a `value-text` pattern, three sizes, `label`,
  `hint`, `error`. Radio buttons underneath: one tab stop, arrow keys, Home and
  End. Form-associated (`name`, `required`, reset and restore). Own symbol
  through `slot="symbol"` and `slot="symbol-empty"`. Events `input`, `change`,
  `rating-change` and `rating-preview` (hover).
- `kakao-spinner`: the button's loading ring on its own, for a load of unknown
  length. Sizes sm, md and lg; the text colour or a `tone` (primary, success,
  warning, danger, muted); `label` is its status text for screen readers
  ("Loading" by default) and `show-label` shows it, beside the ring or under it
  (`stacked`); `delay` keeps it invisible and silent at first so a fast load
  never flashes one. Under reduced motion it fades instead of turning.
- `kakao-skeleton`: grey placeholders in the shape of content that is still
  loading. `shape`: text lines (`lines`, the last one shorter), a circle, a
  plain block (`width`, `height`, `ratio`, `radius`), and the presets row
  (`avatar`, `count`) and card (`media`, `avatar`). `animation` is shimmer,
  pulse or none; under reduced motion the shapes stand still. Hidden from
  assistive technology; an optional `label` makes one skeleton a status.
- Style checker, `node tools/style-check.js [paths…]`: reads HTML and template
  files (`.html`, `.php`, `.twig`, …; PHP and Twig expressions count as
  dynamic values and are skipped), finds every `<kakao-*>` placement and checks
  it against the styleguide's decided rules: `dialog-main-button-corner`,
  `card-main-button-first`, `list-data-name`, `list-data-json`,
  `field-has-name`, `icon-button-has-name` and `attribute-values`. One line per
  finding (`path:line:column  level  rule-id  message`), the same output on
  every run, exit code 0 / 1 (an error) / 2 (cannot run). Rules are one small
  module each in `tools/style-rules/`; a project adds its own through
  `ruleDirs` in `kakao-style.config.json`, which also sets paths, ignores,
  extensions and each rule's level (`error`, `warning`, `off`). Tests:
  `node --test`.
- Every component accepts the boolean `force` attribute: it changes nothing
  in the browser, and turns the checker's findings for that placement into a
  "forced" list. A forced placement that breaks no rule gets a warning.
  Reasons go in `kakao-style.forced.md` (`## <id>` and the reason); with
  `forced.mandatory` every forced placement must have one.

### Changed

- `kakao-table`: setting `rows` no longer redraws the heading row, so focus
  on a sort button stays put in `sort-mode="server"`; heading rows after the
  first (a grid view's filter row) are kept.
- Components page: the component cards are in alphabetical order.
- "Not built yet": Table now wraps rows on a phone; new placeholders Grid view
  (sort, column filters, action column; built on Table) and Image (lazy load,
  skeleton, alt text, caption; uses Skeleton).
- Style guide: new rule "Data tables on small screens" (rows wrap into
  label/value pairs by default, sideways scrolling is an opt-in).
- This repo runs the style checker: the deploy stops on an error. Fixed
  unlabelled fields in size examples (components page, text input and
  textarea demos and construction pages) and a badge with the unknown tone
  `warning` (description list demo); the two shortened `list-data='…'` code
  samples on the table demo are forced. Demo code tiles leave out `force`.
- Style guide, Component rules: links the style checker.

### Fixed

- `kakao-button`: the loading spinner was drawn as a closed ring, so its
  turning could not be seen; it is now an arc (three quarters of the circle).
- `kakao-header-bar`: while a theme switch animates (ripple or colour fade) the
  scrolled bar shows its solid background instead of a translucent one without
  the blur, and the blur is applied anew once the switch is over. It reacts to
  two new triggers of `kakao-theme-switch`, `theme-transition-start` and
  `theme-transition-end` (trigger API, `shared/component-api.js`).

### Known issues

- `kakao-header-bar`: the blur lost after a theme switch is not confirmed
  fixed. Headless Firefox draws no `backdrop-filter`, so the return of the
  blur still has to be checked in a real window, in every theme.

## [0.5.0] - 2026-11-10

### Changed

- `kakao-text-input`, `kakao-textarea`, `kakao-number-input`,
  `kakao-multi-dropdown`: keyboard focus is a 2px outline in the focus
  colour, 2px from the field, instead of a soft halo (WCAG 1.4.11); fields
  with an error show it in the danger colour.
- `kakao-number-input`: `--kakao-number-input-focus-ring-width` removed;
  `--kakao-number-input-focus-color` defaults to the focus colour; new
  `-focus-width` and `-focus-offset`.
- `kakao-multi-dropdown`: `--kakao-multi-dropdown-focus-ring-width` removed;
  new `-focus`, `-focus-width` and `-focus-offset`. The accent stays for the
  open box and the selected option.
- `kakao-textarea`: new `--kakao-textarea-focus-offset`.

### Fixed

- `kakao-text-input`: validity follows the inner field. `type="email"` /
  `"url"`, `pattern`, `minlength` / `maxlength` and `min` / `max` / `step`
  make it invalid with the browser's message, so forms stop and error
  summaries list it. `min`, `max` and `step` are passed through.
- `kakao-textarea`: validity follows the inner field (`required`,
  `minlength`, `maxlength`); `minlength` is passed through; a value longer
  than `maxlength` set from script counts as too long.

### Site only

- `shared/demo-images/`: three tiny SVG stand-in portraits for the demo pages
  (avatar; not part of any component).
- Demo pages: every example is a card on its own row, with its code in a
  "Code" tile at the card's foot and a Copy button in the tile's header;
  dropdown menus and popups reach past the card.
- Style guide: the 2px focus outline is the rule for fields. Wide tables
  scroll inside their frame with the edge fade; no sideways page scroll on
  phones.
- Landing page: no sideways scroll at 1280px from the portal wall.
- Components page, kitchen sink: settings groups are plain inside the
  page's cards.

## [0.4.0] - 2026-11-10

### Added

- `kakao-color-code`: a colour value as a badge-sized monospace label with
  a small swatch of the colour before the text. The text is the colour;
  `value` paints a different one (`<kakao-color-code
  value="var(--kakao-color-ink)">ink</kakao-color-code>`). Any CSS colour
  works: hex (3/4/6/8 digits), `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`,
  `oklab()`, `oklch()`, `color()`, `color-mix()`, named colours,
  `transparent`, `currentColor` and `var(--…)`. The swatch has a 1px inset
  ring, so it shows on its own colour, and sits on a checkerboard, so
  transparency reads; a value that is not a colour gets an empty dashed
  swatch with a slash and `:state(invalid)`. Text and `value` changes
  repaint. Settings `--kakao-color-code-*`, construction page and demo.
- `kakao-button`: icons without an icon font. A child with `slot="icon"`
  (an inline `<svg>`, an `<img>` or an icon-font `<i>`) is moved into the
  icon position and follows `icon-position` (left, right, only); it stays
  one element across updates and is picked up when added later. Slotted
  SVGs are 1em square by default. The `icon` attribute stays as an optional
  shortcut for icon-font classes; a slotted icon wins over it.
- `kakao-text-input`: an `icon` slot in front of the field. Slotted content
  stays in the page's DOM, so page CSS (an icon font too) reaches it; an
  inline `<svg slot="icon">` needs nothing else.
- `kakao-password-input`: a password field with the text input's look, a
  show / hide button in the field and a Caps Lock warning while typing.
  With `requirements`, a list of rules (defaults, `minlength` or
  `list-data` patterns) whose progress is a segmented `kakao-progress`,
  one segment per rule met; `required-strength` (all, or at least N) makes
  unmet rules block the form. The value never lands in the DOM.
  Form-associated. Settings `--kakao-password-input-*`, construction page
  and demo.
- `kakao-code-input`: a one-time code or PIN, one box per character (4 to
  8). The boxes are drawn over one real field, so SMS autofill
  (`one-time-code`), paste and screen readers get a single input.
  `type="alphanumeric"`, `pattern` for the character set, `mask` for PINs,
  `separator` for groups. Form-associated. Settings `--kakao-code-input-*`,
  construction page and demo.
- `kakao-tag-input`: typed text becomes a `kakao-chip` on Enter or a
  delimiter (comma by default); the chips wrap inside the field. Paste
  splits, duplicates are refused (or allowed), `max-tags` limits, and
  `list-data` suggestions open in the select's panel. Form-associated, one
  entry per tag. Needs chip.js. Settings `--kakao-tag-input-*`,
  construction page and demo.
- `kakao-range-slider`: the slider with two thumbs on one track, picking a
  span; `value="low,high"`, `min-gap` keeps them apart. Same friction
  points, number fields, unit badges and touch steppers as `kakao-slider`,
  whose settings it falls back to. Form-associated, two entries under one
  `name`. Settings `--kakao-range-slider-*`, construction page and demo.
- `kakao-settings-group` and `kakao-setting`: the settings-screen layout.
  A titled group of rows, label and hint on one side, the control on the
  other, hairlines between; the row names its control, and on a narrow row
  the control drops below the label. Rows can be links (`href`), whole-row
  buttons (`action`), `variant="danger"` or disabled. A box on its own,
  plain inside a card, accordion, dialog or aside sheet. Settings
  `--kakao-settings-group-*`, construction page and demo.
- `kakao-time-input`: the browser's time field and picker dressed as the
  library's fields, the sibling of `kakao-date-input`. The value is always
  ISO 24-hour; `step` in seconds, `min` after `max` runs over midnight,
  and `now` adds a tag that sets the current time. Form-associated.
  Settings `--kakao-time-input-*`, construction page and demo.
- `kakao-error-summary`: a form's errors at the top of the form, each a
  link to its field, drawn as a danger `kakao-alert`. On submit it replaces
  the browser's bubbles, lists every invalid field (kakao and native),
  takes focus, and a link focuses and scrolls to the field. Heading "There
  is a problem with the following fields"; errors in two columns, field |
  issue (stacked on narrow boxes), in a danger text colour that reaches
  5.3:1 or more in every theme. `live` drops
  fixed fields as you type; `show()` lists errors from a server reply.
  Works with `novalidate` forms. Needs alert.js. Settings
  `--kakao-error-summary-*`, construction page and demo.
- `kakao-text-input`, `kakao-textarea`, `kakao-checkbox`,
  `kakao-radio-group`: `validity`, `validationMessage`, `checkValidity()`,
  `reportValidity()` and `form`, as on native fields, so an error summary
  (or any script) can check them. `kakao-switch-group`: a switch with an
  empty label is named after the group, so a lone switch in a settings row
  needs no visible text.

### Changed

- `kakao-accordion`: an `actions` slot for controls in the header row, before
  the chevron (a small `kakao-button`, for example). They sit outside the
  header's disclosure button, so clicking them doesn't open or close the
  accordion, and they stay visible while it is closed. Part `actions`.
- `kakao-card`: the glow in the theme's colour after a theme switch is now
  opt-in with the new `theme-glow` attribute. Before, every card without a
  footer button started glowing as soon as the theme changed.
- `kakao-card`: no height glide while the page loads (until two frames after
  the load event), and none for content that animates its own size, such
  as an opening `kakao-accordion`: the card follows it frame by frame
  instead of running a second, lagging glide.

### Fixed

- `kakao-button`: the `run()` success check is drawn by the button (inline
  SVG, the menu check's shape at the spinner's size). It was a Font Awesome
  `fa-check` and showed nothing on pages without Font Awesome.
- `kakao-text-input`: the `icon` attribute drew nothing, even with Font
  Awesome on the page (its class sat inside the shadow root, out of reach
  of page CSS, on a box hidden while empty). It now adds an
  `<i slot="icon" data-kakao-icon>` with those classes to the element, so a
  page icon font draws it; it steps aside while the page slots its own
  icon. The slot is the recommended way.

### Site only

- Demo pages: every example has a collapsed "Code" block under it with its
  markup as written in the page (read before the components draw), lightly
  highlighted in theme colours, with a Copy button. Examples driven by
  script show the real API call next to the markup (`KakaoToast.show()`,
  opening a dialog, `run()`, the playground methods). `shared/demo.js`
  builds the blocks; `data-demo-only`, `data-demo-wrap`, `data-no-code`,
  `data-code-with` and `<template data-code>` tune what a snippet shows
  (see AGENTS.md).
- Demo pages (trial on the button demo, `<body data-demo-code="accordion">`):
  every example is a `kakao-card` on a row of its own, its code in a
  `kakao-accordion` tile in the card's footer, Copy a small `kakao-button` in
  the accordion's header.
- Style guide: rule "Icons without an icon font". Button and text input demos show inline
  SVG icons next to Font Awesome ones.
- Components page, style guide audit and kitchen sink: password input,
  code input, tag input, range slider, settings group, time input and error
  summary. The kitchen sink's settings form gets an error summary at the
  top; a link to a field on another tab opens that tab.

## [0.3.0] - 2026-11-10

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
- `kakao-accordion`: a card that opens and closes to show any content,
  built on native `<details>` / `<summary>` (one tab stop, Enter and Space,
  expanded state, closed content not focusable). Header with `heading` or a
  `title` slot, `description`, a `meta` slot and a turning chevron; the body
  takes anything. `open`, `show()` / `hide()` / `toggle(force)` and a
  bubbling `accordion-toggle` event (also a trigger). A shared `name` keeps
  one open per group, like `<details name>`. The height glides open and
  closed (`--kakao-motion-duration`, standard easing); none under reduced
  motion, with `no-animate` or on first render. Nesting steps down instead
  of stacking cards: a card at the top, a borderless tile on the subtle
  fill inside it, flat rows with a hairline from the third level (indented
  from the fourth); `variant` (card, tile, row) forces a look. Settings
  `--kakao-accordion-*`, construction page and demo. The overview replaces
  its placeholder; the kitchen sink's plan card lists what's included in a
  tile accordion.
- `kakao-aside-sheet`: a card that slides in from an edge of the viewport,
  over the page. `side` is `bottom` (default), `top`, `start` or `end`
  (follows the writing direction; `left` / `right` are physical aliases).
  Only the corners facing into the page are rounded. Built like the dialog
  (a plain fixed overlay): modal by default with a scrim, focus moved in,
  trapped (also through nested shadow roots) and returned, Escape and a
  scrim click to close, the page scroll locked; `modal="false"` drops the
  scrim, trap and lock. `open`, `show()` / `hide(returnValue)` /
  `toggle()`, `for` (ids of elements that toggle it, with `aria-expanded`),
  `data-close`, a close button in the header (`close-label`,
  `no-close-button`), `no-dismiss`, `contained`. Slots `header`, body
  (scrolls, with hairlines at the edges while content runs past) and
  `footer`. Bottom / top sheets are at most 85dvh tall and 42rem wide,
  start / end sheets 24rem wide, never wider than the viewport; safe-area
  insets kept. `handle` adds a drag handle to bottom sheets; dragging it or
  the header down closes the sheet. Slides in on the spring curve, leaves on
  the standard one; a fade only under reduced motion. Events `sheet-show`,
  `sheet-hide` (cancelable) and `sheet-hidden`, also triggers. z-index 50:
  over the aside menu, under the dialog and toasts. Settings
  `--kakao-aside-sheet-*`, construction page and demo. Listed on the
  components page and in the style guide audit; the kitchen sink explains
  the ID upload in a bottom sheet.
- `kakao-select`: pick one value, or several with `multiple`, from a list
  with a search field on top. The field looks like the text input (`label`,
  `hint`, `error`, `placeholder`, sizes `sm` / `md` / `lg`, `disabled`,
  `required`); the panel is the dropdown of the button menu and the multi
  dropdown, in the top layer so a clipping card can't cut it off: below the
  field, or above when there is no room below, lined up with the field's
  right edge or shifted in at the side, its height capped by the room on
  screen, following the field while the page scrolls. Typing in the search
  filters live, ignoring case and accents and matching anywhere in the label,
  with "No matches" (`empty-text`) when nothing fits; the search field shows
  focus with the 2px outline. Options come from child
  `<option>` / `<optgroup>` elements (a top-level `<option value="">` is the
  placeholder), `list-data` or the `options` property; groups and disabled
  options are supported. `multiple` gives each row a checkbox in the
  checkbox's look, keeps the panel open while picking, adds a tri-state
  "Select all" row (with a filter: "Select all N matches", acting on the
  shown matches only) and shows the first label plus "+N" in the field.
  Keyboard: Enter / Space / arrows open, a letter opens with it in the
  search, arrows and PageUp / PageDown move, Enter picks, Escape closes and
  returns focus, Tab closes and moves on. Search field as combobox with
  `aria-activedescendant` over a listbox (`aria-multiselectable` for
  multiple). Form-associated: `value` (multiple: comma list or JSON array),
  `values`, one form entry per value, `required`, reset, state restore;
  events `input`, `change`, `select-change`, `select-open`, `select-close`.
  Settings `--kakao-select-*`, construction page and demo. The components
  page replaces its Select placeholder; the style guide audits it; the
  kitchen sink asks for the country with it.
- `kakao-combobox`: a text field with suggestions, where the typed text may
  also be the value (an editable combobox with list autocomplete). Typing
  filters the list like the select (case and accents ignored, anywhere in
  the label); picking a suggestion sets the value to its value and the field
  to its label, other text is kept as the value on Enter, Tab or leaving the
  field. While the text names no option, a "Use “…”" row sits at the top
  (`create-label`, hidden with `no-create`); `strict` allows only listed
  values. `autocomplete="both"` completes the first match in the field,
  `"none"` turns filtering off. Keyboard per the APG pattern: arrows,
  PageUp / PageDown, Enter picks or commits, Escape closes the list and on a
  closed list clears the field, Tab commits and moves on. Options, groups,
  panel, placement and row look are the select's (copied, so each file stays
  inlineable). Form-associated: `value`, `required`, `pattern`, `minlength`,
  `maxlength`, reset, state restore; events `input`, `change`,
  `combobox-change`, `combobox-create` (a new free-text value),
  `combobox-open`, `combobox-close`. Settings `--kakao-combobox-*`,
  construction page and demo. The components page replaces its Combobox
  placeholder; the style guide audits it; the kitchen sink asks for the city
  with it.
- `kakao-date-input`: the browser's own date, time, date-and-time, month and
  week field (`type`) and picker, dressed as the library's other fields:
  `label`, `hint`, `error`, sizes, `disabled`, `readonly`, the 2px focus
  outline, tabular figures. The picker icon stays the browser's: Chromium
  draws it muted with our calendar / clock glyph, Firefox in the text colour;
  both are centred where the select's chevron is. A type the browser has no
  field for (month and week in Firefox and desktop Safari) becomes a typed
  ISO field with a placeholder and a pattern. The inner field gets the
  `locale` attribute or the nearest `lang`, and `locale` reports it; the
  browser still draws the field in its own language and format (no browser
  reads `lang`), documented on the demo. Form-associated: ISO `value`,
  `min`, `max`, `step`, `required`, validity mirrored from the native field,
  reset, state restore, disabled fieldset; `showPicker()`; events `input`
  and `change`. Settings `--kakao-date-input-*`, construction page and demo.
  The components page replaces its "Date & time picker" placeholder; the
  style guide audits it; the kitchen sink asks when to pause the membership.
  The `today` attribute adds a tag at the right of the hint row that sets the
  field to today, now, this month or this week (Intl label, `today-label`
  overrides it); it is disabled when today is outside `min`/`max`.

### Changed

- `kakao-checkbox` and `kakao-radio-group`: the box and the dot sit centred on
  the first line of their label at every size, also with a hint or a wrapped
  label (the checkbox row is top-aligned in its host, so centring the box
  adds no gap under it). Radio options are closer together (8px between
  rows, as between stacked checkboxes): `--kakao-radio-group-option-gap` is
  now 4px and `--kakao-radio-group-option-padding` 2px 8px.

- `kakao-alert`: no border or outline any more; the tone shows through the
  tinted fill and the icon. The `--kakao-alert-border-mix` setting is gone.
  Under forced colours a 1px line remains, since the tint is dropped there.

- `kakao-toast`: no outline. The region's shadow drops the overlay's 1px ring
  and keeps only the soft drop shadow, so toasts match the borderless alert.

- `kakao-toast`, `kakao-alert`: in the light and beige themes toasts stand
  apart from the page without a border: a contact shadow alongside the soft
  one, a fill from the raised colour, and a 16% tone tint (inline alerts get
  the tint too). Dark themes keep the defaults.

### Fixed

- `kakao-aside-sheet`, `kakao-dialog`: placed where page CSS gives them a
  margin (e.g. inside a card), the scrim no longer starts below the top of the
  viewport and leaves a strip over the header bar uncovered. The host resets
  its own margin.

- `kakao-toast`: the region resets its own margin, so page spacing rules
  can't shift it (as dialog and aside sheet do). The style guide records this
  as a rule for every component fixed to the viewport.

- `kakao-date-input`: the today tag uses the hint's text size, and when it is
  disabled screen readers announce why (`aria-describedby`), not only the
  hover title.

### Site only

- The component count on the landing page (hero fact and lede) is written by
  `tools/count-components.js` from the components folder, run by a pre-commit
  hook in `.githooks/`; it now reads thirty-four.
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

[Unreleased]: https://github.com/georgno/kakao-components/compare/v0.8.0...HEAD
[0.8.0]: https://github.com/georgno/kakao-components/compare/v0.5.0...v0.8.0
[0.5.0]: https://github.com/georgno/kakao-components/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/georgno/kakao-components/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/georgno/kakao-components/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/georgno/kakao-components/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/georgno/kakao-components/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/georgno/kakao-components/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/georgno/kakao-components/releases/tag/v0.1.0
