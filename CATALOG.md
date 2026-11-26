# kakao-components catalog

Web components for server-rendered pages: plain JS, no build step. Full API per component
(attributes, events, slots, CSS properties, files): `custom-elements.json`; examples:
`components/<name>/demo.html`.

## Page head

The library in `kakao/`, vendored from a release tag (never a branch) with
`node tools/vendor.js <dest> [component…]` (copies those components and what they need, all
without a list, and writes `VERSION`):

```html
<link rel="stylesheet" href="kakao/shared/kakao.css">
<!-- Not deferred: applies the saved theme before the first paint (no flash). -->
<script src="kakao/shared/kakao.js"></script>
```

`kakao.css` is tokens, font and themes in one file. `kakao.js` loads each component on first
use (also tags added later): component-api.js, the components it needs, its light-DOM CSS, its
script, in order; tags stay hidden until defined (at most 3 s, or until a file fails). Before calling a component's methods:
`kakaoLoader.ready.then(…)` (everything the page uses) or `kakaoLoader.load('kakao-toast').then(…)`.

Or load single files (the loader skips what a page loads itself):

```html
<link rel="stylesheet" href="kakao/shared/tokens.css">
<link rel="stylesheet" href="kakao/shared/font.css">
<link rel="stylesheet" href="kakao/shared/themes.css">
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
  CSS; `kakao-code` is drawn by `code.css` alone. All other components need their script.
- `node tools/style-check.js` (this repo) reports a file a page's tags need that is missing
  or loaded in the wrong order (not on a page with the loader).

## Shared contract

- `label`: the accessible name (and visible label where shown); icon-only controls always
  get one. Second names: `<thing>-label` (`close-label`); second texts: `<thing>-text`.
- `size`: `sm` · `md` (default) · `lg`; some only `sm` · `md`; avatars add `xs`, `xl`.
- `tone`: `neutral` · `primary` · `success` · `warning` · `danger`, as far as the component
  lists them; extras `ink` (badge, chip), `info` (alert, toast), `auto` (avatar), `none` ·
  `muted` (spinner). Write `danger`, not `error`.
- `list-data`: JSON configuration, never `data`.
- `hidden`: hides a component; not all honour it yet, so hide a wrapper when in doubt.
  Overlays (dialog, aside-sheet, menu, popover, toast) open and close through their API.
- Events: `<thing>-<verb>` in kebab-case (`tab-change`), no `kakao-` prefix (old exception:
  the button's `kakao-button-*`). They bubble, are composed, carry `event.detail`. Fields
  also send `input` / `change` and are form-associated (`name`, `value`).
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
| stack, layout | `kakao-stack` is a pile of overlapping cards (the toast's base), not a layout: use CSS grid or flex with `gap: var(--kakao-space-gap)`. |
| list, plain list | `kakao-list` is a 3D picker. Short items (file:line, test names): a plain `<ul>` / `<ol>`. |
| code, code-block, kbd | code: a reference in a sentence (`src/app.js:42`). code-block: several lines, output or a running log (`mode="log"`), with copy. kbd: keys to press. |
| chip, badge | badge: read-only status. chip: a tag or filter that can link, act or be removed. |
| dialog, aside-sheet | dialog: modal, centred, a short decision. aside-sheet: from an edge, longer content beside the page. |
| select, combobox, multi-dropdown | select: only listed values, one or several. combobox: free text with suggestions. multi-dropdown: one value in parts (day, month, year). |
| tooltip, popover, menu | tooltip: a short label, also on focus. popover: richer anchored content. menu: actions. |

## Components

<!-- catalog:start (generated by node tools/catalog.js from custom-elements.json; edit the CATALOG section of the component's header) -->

65 components in v0.10.0. In brackets: light DOM and the CSS file to load, "after" the components to load first. Unmarked: shadow DOM, its script only.

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
- `kakao-grid-view`: A data grid with a filter row, sorting and paging. Not for a table without filters: kakao-table. (light DOM, grid-view.css; after kakao-table)
- `kakao-header-bar`: The page's sticky top bar: title, navigation, actions. Not for headings inside the page: h2 to h6.
- `kakao-image`: An image that keeps its place, with a skeleton while it loads. Not for people: kakao-avatar; icons: inline SVG. (after kakao-skeleton)
- `kakao-kbd`: Keyboard keys and shortcuts in text: "Ctrl + K". Not for code and file names: kakao-code; several lines: kakao-code-block.
- `kakao-list`: A 3D picker: rows tilt in perspective as they scroll past the middle. Not for a plain list of short items: `<ul>` or `<ol>`.
- `kakao-menu`: A menu of actions from a trigger or a right-click. Not for picking a value: kakao-select; navigation: kakao-aside-menu.
- `kakao-meter`: A measurement in a known range: "55 GB of 100 GB used". Not for the progress of a task: kakao-progress.
- `kakao-multi-dropdown`: Several dropdowns that form one value (day | month | year). Not for one choice: kakao-select; a date with a picker: kakao-date-input.
- `kakao-number-input`: Stepper arrows for a child `<input type="number">`. Not for a value on a scale: kakao-slider. (light DOM, number-input.css)
- `kakao-pagination`: Page links for a long list. Not for the steps of a flow: kakao-stepper.
- `kakao-password-input`: A password field: show/hide, Caps Lock warning, strength bar. Not for one-time codes: kakao-code-input.
- `kakao-popover`: A floating panel anchored to an element, for richer content. Not for a short label: kakao-tooltip; a list of actions: kakao-menu.
- `kakao-progress`: The progress of a task in segments: "Uploading 3 of 8". Not for a measurement: kakao-meter; unknown duration: kakao-spinner.
- `kakao-radio-group`: One choice from a few options, all visible. Not for many options: kakao-select; yes/no: kakao-checkbox.
- `kakao-range-slider`: A span (from-to) on a scale, with two thumbs. Not for a single value: kakao-slider.
- `kakao-rating`: A star rating to give, or a score to show. Not for a measurement: kakao-meter.
- `kakao-select`: One or several values from a fixed list, with search. Not for free text: kakao-combobox; two to four options: kakao-radio-group.
- `kakao-settings-group` + `kakao-setting`: A settings screen: titled groups of kakao-setting rows. Not for read-only key/value rows: kakao-description-list.
- `kakao-skeleton`: A placeholder in the shape of loading content. Not for a wait of unknown shape: kakao-spinner; nothing to show: kakao-empty-state.
- `kakao-slider`: One value on a scale, with a number field. Not for a span: kakao-range-slider; exact numbers: kakao-number-input.
- `kakao-spinner`: Loading of unknown length, inline or in a block. Not for known progress: kakao-progress; placeholders: kakao-skeleton.
- `kakao-stack`: A pile of cards, newest in front; the base of kakao-toast. Not for page layout or vertical spacing: CSS gap.
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
