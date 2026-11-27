# kakao-components catalog

Web components for server-rendered pages: plain JS, no build step. One component's API
(attributes and their values, slots, events, methods, an example): `node tools/api.js <tag>`
(`kakao/tools/api.js` in a vendored copy); everything at once: `custom-elements.json`.
Working rules for agents (head, page base, the rules that bite, a checklist): the skill in
`skills/` (its SKILL.md); a starting page and copy-paste pages: `templates/page.html`, `recipes/`.

## Page head

The library in `kakao/`, vendored from a release tag (never a branch) with
`node tools/vendor.js <dest> [component…]` (copies those components and what they need, all
without a list, and writes `VERSION`):

```html
<link rel="stylesheet" href="kakao/shared/kakao.css">
<!-- Not deferred: applies the saved theme before the first paint (no flash). -->
<script src="kakao/shared/kakao.js"></script>
```

`kakao.css` is tokens, font, themes and the page base (body, h1, links; no specificity, your CSS wins) in one file. `kakao.js` loads each component on first
use (also tags added later): component-api.js, the components it needs, its light-DOM CSS, its
script, in order; tags stay hidden until defined (at most 3 s, or until a file fails). Before calling a component's methods:
`kakaoLoader.ready.then(…)` (everything the page uses) or `kakaoLoader.load('kakao-toast').then(…)`.

Or load single files (the loader skips what a page loads itself):

```html
<link rel="stylesheet" href="kakao/shared/tokens.css">
<link rel="stylesheet" href="kakao/shared/font.css">
<link rel="stylesheet" href="kakao/shared/themes.css">
<link rel="stylesheet" href="kakao/shared/base.css"><!-- optional: the page base -->
<script src="kakao/shared/component-api.js"></script>
<script src="kakao/components/theme-switch/theme-switch.js"></script><!-- not deferred -->
<!-- Per component: its light-DOM CSS, the components it needs, its script. -->
<link rel="stylesheet" href="kakao/components/tabs/tabs.css">
<script src="kakao/components/tabs/tabs.js" defer></script>
<script src="kakao/components/stack/stack.js" defer></script>
<script src="kakao/components/alert/alert.js" defer></script>
<script src="kakao/components/toast/toast.js" defer></script>
```

- The font (Inter Tight, `font.css`) is optional: leave it out, or set `--kakao-font-family`
  (its files load only when used). Put `<kakao-theme-switch>` in the `<kakao-header-bar>`.
  The page follows the OS (light or dark) until a visitor picks a theme; that choice is
  saved and applied on every page that loads the loader or theme-switch.js.
- Colours: the `--kakao-color-*` tokens; spacing: `--kakao-space-*`; monospace: `--kakao-font-mono`; per component
  `--kakao-<component>-*`.
- Without JS: `kakao-table` styles a server-rendered `<table>` with `table.css` alone;
  `kakao-number-input`'s own `<input>` works (arrows need JS); `kakao-chip-list` wraps by
  CSS; `kakao-code` is drawn by `code.css` alone, the layout primitives `kakao-page`, `kakao-grid`,
  `kakao-flow` and the `<ul>` / `<ol>` in `kakao-plain-list` by their CSS. All other components need their script.
- Page transitions (optional): `shared/page-transition.js` in the head (no defer) swaps the
  content of pages that share a shell instead of reloading them. Mark the shell's links
  `data-page-transition`, each swapped region `data-page-transition-content="<key>"` (same keys
  on every page; `tabindex="-1"` on the main one takes the focus) and the page's own scripts
  `data-page-transition-script` (they run again after a swap: wrap them in a block, bind
  document/window listeners with `{ signal: kakaoPageTransition.signal }`). Events on
  `document`: `page-transition-start` (cancelable), `page-transition-swap`, `page-transition-end`.
  Set `kakaoPageTransition.busy = true` while a swap would lose work. Full guide: the file's header.
- `node tools/style-check.js <pages>` (`kakao/tools/` in a vendored copy) checks attribute
  values, names, list-data and, on pages without the loader, missing or misordered files.

## Shared contract

- `label`: the accessible name (and visible label where shown); icon-only controls always
  get one. Second names: `<thing>-label` (`close-label`); second texts: `<thing>-text`.
- `size`: `sm` · `md` (default) · `lg`; some only `sm` · `md`; avatars add `xs`, `xl`.
- `tone`: `neutral` · `primary` · `success` · `warning` · `danger`, as far as the component
  lists them; extras `ink` (badge, chip), `info` (alert, toast), `auto` (avatar), `none` ·
  `muted` (spinner). Write `danger`, not `error`.
- `list-data`: JSON configuration, never `data`.
- `hidden`: hides a component (all of them honour it; kakao-tooltip drops it when its script runs).
  Overlays (dialog, aside-sheet, menu, popover, toast) open and close through their API.
- Events: `<thing>-<verb>` in kebab-case (`tab-change`), no `kakao-` prefix (old exception:
  the button's `kakao-button-*`). They bubble, are composed, carry `event.detail`. Fields
  also send `input` / `change` and are form-associated (`name`, `value`; `form.reset()` resets them).
- Text in sentence case, never all caps; components never transform it.
- JSON in an attribute: escape it as HTML, then either quote style is safe.
  - Python: `html.escape(json.dumps(data))`
  - PHP: `htmlspecialchars(json_encode($data), ENT_QUOTES)`; Yii2: `Html::encode(Json::encode($data))`
  - JS: `el.setAttribute('list-data', JSON.stringify(data))` (no escaping); in a template
    string: `JSON.stringify(data).replace(/[&'"<>]/g, (c) => '&#' + c.charCodeAt(0) + ';')`

## Which one?

| Look-alikes | Pick |
| --- | --- |
| meter, progress, spinner, skeleton | meter: a measurement in a known range. progress: a task on its way to done. spinner: a wait of unknown length. skeleton: the shape of content still loading. |
| alert, toast | alert: stays in the content until resolved. toast: brief, in a corner; never the only place for an error that needs action. |
| action-bar, toast | action-bar: actions on the selected items, floating while something is selected (`count`). toast: a brief notice that leaves by itself. |
| header-bar, section-header, card | header-bar: the page's sticky top bar. section-header: a heading inside the page (a real `<h2>`–`<h6>`) with a count, a description and actions. card: a framed box with its own title. |
| stack, page, grid, flow | `kakao-stack` is a pile of overlapping cards (the toast's base), not a layout. page: the content column (max-width, padding, below the header bar). grid: columns that wrap by width (cards, stat tiles). flow: even vertical space between blocks (sections, fields). |
| list, plain-list | `kakao-list` is a 3D picker. `kakao-plain-list`: short items (file:line, test names, findings) in a styled `<ul>` / `<ol>`, with optional leading badges or icons in one column. |
| code, code-block, kbd | code: a reference in a sentence (`src/app.js:42`). code-block: several lines, output or a running log (`mode="log"`), with copy. kbd: keys to press. |
| chip, badge | badge: read-only status. chip: a tag or filter that can link, act or be removed. |
| dialog, aside-sheet | dialog: modal, centred, a short decision. aside-sheet: from an edge, longer content beside the page. |
| select, combobox, multi-dropdown | select: only listed values, one or several. combobox: free text with suggestions. multi-dropdown: one value in parts (day, month, year). |
| tooltip, popover, menu | tooltip: a short label, also on focus. popover: richer anchored content. menu: actions. |

## Components

<!-- catalog:start (generated by node tools/catalog.js from custom-elements.json; edit the CATALOG section of the component's header) -->

70 components in v0.11.0. In brackets: light DOM and the CSS file to load, "after" the components to load first. Unmarked: shadow DOM, its script only.

- `kakao-accordion`: Content that opens and closes: FAQs, details, optional sections. Not for parallel views of one area: kakao-tabs.
- `kakao-action-bar`: Actions on selected items, floating at the edge: "3 selected · Copy". Not for a brief notice: kakao-toast; site navigation: kakao-header-bar.
- `kakao-alert`: A lasting message in the content: saved, failed, a warning. Not for brief feedback: kakao-toast; a form's errors: kakao-error-summary.
- `kakao-animated-number`: A number that rolls its digits when it changes: counters, totals. Not for numbers that never change: plain text.
- `kakao-aside-menu`: Site navigation in a panel opened by a hamburger button. Not for content beside the page: kakao-aside-sheet; actions: kakao-menu. (light DOM, aside-menu.css; after kakao-button)
- `kakao-aside-sheet`: A panel from a screen edge: details, filters or a form. Not for a short confirmation: kakao-dialog; site navigation: kakao-aside-menu.
- `kakao-avatar` + `kakao-avatar-group`: A person, team or bot as a picture or initials; kakao-avatar-group for several. Not for logos and pictures: kakao-image.
- `kakao-badge`: A short read-only status label: "New", "Missing", "Draft". Not for clickable, removable or filter labels: kakao-chip.
- `kakao-breadcrumb`: Where the page sits in a hierarchy, as a trail of links. Not for the steps of a flow: kakao-stepper.
- `kakao-button`: Every action: buttons, toggles, dropdown buttons, async .run(promise). Not for links in text: `<a>`; copying: kakao-copy-button. (light DOM, button.css)
- `kakao-card`: A box that groups content, with an optional header and footer. Not for content that collapses: kakao-accordion; a message: kakao-alert.
- `kakao-checkbox`: A yes/no choice, or one item of a check list, submitted with a form. Not for settings that apply at once: kakao-switch-group; one of several: kakao-radio-group.
- `kakao-chip`: A compact tag, token or filter; can link, act or be removed. Not for a read-only status: kakao-badge.
- `kakao-chip-list`: A wrapping row of kakao-chip elements that glide into place. Not for typing new tags: kakao-tag-input. (light DOM, chip-list.css)
- `kakao-code`: Code in a sentence: a file:line reference, a command, a name. Not for several lines or a log: kakao-code-block; keyboard keys: kakao-kbd. (light DOM, code.css)
- `kakao-code-block`: Code, preformatted text or a running log, with copy. Not for code in a sentence (file:line): kakao-code; editable text: kakao-textarea. (after kakao-copy-button)
- `kakao-code-input`: A one-time code or PIN, one box per character. Not for passwords: kakao-password-input.
- `kakao-color-code`: Shows a colour value with a swatch, in documentation. Not for picking a colour: kakao-color-picker.
- `kakao-color-picker`: A colour field with a picker: area, hue, alpha, presets. Not for showing a colour value: kakao-color-code.
- `kakao-combobox`: A text field with suggestions; the user may keep their own text. Not for a fixed list of values: kakao-select.
- `kakao-command-palette`: A hotkey search (Mod+K) over the page's actions. Not for the actions of one control: kakao-menu.
- `kakao-copy-button`: Copies a text to the clipboard and confirms it. Not for any other action: kakao-button.
- `kakao-date-input`: A date, date-and-time, month or week field with the browser's picker. Not for time only: kakao-time-input.
- `kakao-description-list`: Read-only key/value rows for summaries and details. Not for records with columns: kakao-table; editable settings: kakao-settings-group.
- `kakao-dialog`: A modal for a confirmation or a short task. Not for longer content: kakao-aside-sheet; a notice: kakao-toast.
- `kakao-empty-state`: The block where content is missing: no rows, no results. Not for a whole error page: kakao-error-page; loading: kakao-skeleton.
- `kakao-error-page`: A whole 404, 500 or maintenance page. Not for missing content inside a page: kakao-empty-state.
- `kakao-error-summary`: A form's errors at its top, each linked to its field. Not for a single message: kakao-alert; one field's error: its error attribute. (after kakao-alert)
- `kakao-file-upload`: Picking or dropping files, with a list of the selection. Not for files already stored: kakao-table.
- `kakao-flow`: Even vertical space between blocks: sections, form fields, paragraphs and cards. Not for columns: kakao-grid; a pile of overlapping cards: kakao-stack; a row of buttons: a flex row. (light DOM, flow.css)
- `kakao-grid`: Columns that wrap by width: cards, stat tiles, fields side by side. Not for rows of data: kakao-table or kakao-grid-view; one column of sections: kakao-flow; a pile of cards: kakao-stack. (light DOM, grid.css)
- `kakao-grid-view`: A data grid with a filter row, sorting and paging. Not for a table without filters: kakao-table. (light DOM, grid-view.css; after kakao-table)
- `kakao-header-bar`: The page's sticky top bar: title, navigation, actions. Not for headings inside the page: h2 to h6, or kakao-section-header with a count and actions.
- `kakao-image`: An image that keeps its place, with a skeleton while it loads. Not for people: kakao-avatar; icons: inline SVG. (after kakao-skeleton)
- `kakao-kbd`: Keyboard keys and shortcuts in text: "Ctrl + K". Not for code and file names: kakao-code; several lines: kakao-code-block.
- `kakao-list`: A 3D picker: rows tilt in perspective as they scroll past the middle. Not for a plain list of short items (file:line, test names): kakao-plain-list.
- `kakao-menu`: A menu of actions from a trigger or a right-click. Not for picking a value: kakao-select; navigation: kakao-aside-menu.
- `kakao-meter`: A measurement in a known range: "55 GB of 100 GB used". Not for the progress of a task: kakao-progress.
- `kakao-multi-dropdown`: Several dropdowns that form one value (day | month | year). Not for one choice: kakao-select; a date with a picker: kakao-date-input.
- `kakao-number-input`: Stepper arrows for a child `<input type="number">`. Not for a value on a scale: kakao-slider. (light DOM, number-input.css)
- `kakao-page`: The page's content column: max-width, side padding, space below the header bar. Not for columns of cards: kakao-grid; space between sections: kakao-flow; a framed box: kakao-card. (light DOM, page.css)
- `kakao-pagination`: Page links for a long list. Not for the steps of a flow: kakao-stepper.
- `kakao-password-input`: A password field: show/hide, Caps Lock warning, strength bar. Not for one-time codes: kakao-code-input.
- `kakao-plain-list`: Short items in a list: file:line references, test names, findings, optionally with a leading badge or icon. Not for a 3D picker: kakao-list; label and value pairs: kakao-description-list; rows with several columns: kakao-table. (light DOM, plain-list.css)
- `kakao-popover`: A floating panel anchored to an element, for richer content. Not for a short label: kakao-tooltip; a list of actions: kakao-menu.
- `kakao-progress`: The progress of a task in segments: "Uploading 3 of 8". Not for a measurement: kakao-meter; unknown duration: kakao-spinner.
- `kakao-radio-group`: One choice from a few options, all visible. Not for many options: kakao-select; yes/no: kakao-checkbox.
- `kakao-range-slider`: A span (from-to) on a scale, with two thumbs. Not for a single value: kakao-slider.
- `kakao-rating`: A star rating to give, or a score to show. Not for a measurement: kakao-meter.
- `kakao-section-header`: The heading row of a section: a heading, a count, a line of description and actions ("Findings 12 · Export"). Not for the page's top bar: kakao-header-bar; a framed box with a title: kakao-card; a heading alone: h2 to h6. (light DOM, section-header.css)
- `kakao-select`: One or several values from a fixed list, with search. Not for free text: kakao-combobox; two to four options: kakao-radio-group.
- `kakao-settings-group` + `kakao-setting`: A settings screen: titled groups of kakao-setting rows. Not for read-only key/value rows: kakao-description-list.
- `kakao-skeleton`: A placeholder in the shape of loading content. Not for a wait of unknown shape: kakao-spinner; nothing to show: kakao-empty-state.
- `kakao-slider`: One value on a scale, with a number field. Not for a span: kakao-range-slider; exact numbers: kakao-number-input.
- `kakao-spinner`: Loading of unknown length, inline or in a block. Not for known progress: kakao-progress; placeholders: kakao-skeleton.
- `kakao-stack`: A pile of cards, newest in front; the base of kakao-toast. Not for page layout: kakao-page, kakao-grid; vertical spacing: kakao-flow.
- `kakao-step-switch`: A switch with several positions on one track: low, medium, high. Not for on/off: kakao-switch-group; many options: kakao-select.
- `kakao-stepper`: Where someone is in a multi-step flow: a wizard, a checkout. Not for task progress: kakao-progress; a hierarchy: kakao-breadcrumb.
- `kakao-switch-group`: On/off switches for settings that apply at once. Not for choices submitted with a form: kakao-checkbox.
- `kakao-table`: A data table around a server-rendered `<table>`: sorting, selection, phone layout. Not for filters and paging: kakao-grid-view; key/value rows: kakao-description-list. (light DOM, table.css)
- `kakao-tabs` + `kakao-tab`: Views of one area, one kakao-tab each. Not for page navigation: links; collapsing sections: kakao-accordion. (light DOM, tabs.css)
- `kakao-tag-input`: A field for free-text values (tags, recipients) as chips. Not for values from a fixed list: kakao-select multiple. (after kakao-chip)
- `kakao-text-input`: A single-line text field. Not for several lines: kakao-textarea; suggestions: kakao-combobox.
- `kakao-textarea`: A multi-line text field, optional counter and auto-grow. Not for one line: kakao-text-input.
- `kakao-theme-switch`: Switches the colour theme; load its script early in the head. Not for other settings: kakao-switch-group.
- `kakao-time-input`: A time field with the browser's picker; the value is ISO 24-hour. Not for dates: kakao-date-input.
- `kakao-toast`: Brief notices in a corner that go away by themselves. Not for lasting messages: kakao-alert; a decision: kakao-dialog. (light DOM; after kakao-stack, kakao-alert)
- `kakao-toc`: "On this page" contents for a long page, with a scrollspy. Not for site navigation: kakao-aside-menu.
- `kakao-tooltip`: A short label next to a control, also on keyboard focus. Not for rich or interactive content: kakao-popover.
- `kakao-tree-view`: Nested, collapsible rows: folders, permission groups. Not for flat rows: kakao-table; collapsible content: kakao-accordion.

<!-- catalog:end -->
