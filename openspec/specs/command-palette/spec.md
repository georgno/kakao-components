# command-palette Specification

## Purpose
`<kakao-command-palette>` is a modal search over the page's actions, opened with a hotkey (Mod+K by default), following the WAI-ARIA combobox pattern with a listbox of grouped commands.

## Requirements

### Requirement: Commands from list-data
The component SHALL take its commands from the `list-data` attribute (a JSON array) and from the `commands` property. A command SHALL be an object with `label` and optional `id`, `group`, `keywords` (array or comma separated string), `shortcut`, `icon` (inline SVG markup), `href`, `target`, `value` and `disabled`; a string SHALL be a command whose label and id are that string. It SHALL render again when either source changes; invalid JSON SHALL give an empty list and a console warning.

#### Scenario: Groups
- **WHEN** two commands have `"group": "Navigation"` and one has `"group": "Account"`
- **THEN** the listbox shows a `role="group"` labelled "Navigation" with two options and one labelled "Account" with one

#### Scenario: From script
- **WHEN** a script sets `palette.commands = [{ id: 'new', label: 'New file' }]`
- **THEN** the palette lists that one command

### Requirement: Command content
An option SHALL show the command's `icon` before the label and its `shortcut` at the end of the row, drawn with `<kakao-kbd size="sm">` when that element is defined and as plain text otherwise. The palette SHALL NOT bind shortcut keys. Icon markup SHALL be inserted only when it is an `<svg>` element, without `script` or `foreignObject` elements and without event handler attributes. A `disabled` command SHALL be shown dimmed with `aria-disabled="true"` and cannot be run.

#### Scenario: Shortcut with kbd
- **WHEN** the page loads kakao-kbd and a command has `"shortcut": "Mod+S"`
- **THEN** its row ends in a small kakao-kbd keycap for that shortcut

#### Scenario: Unsafe icon
- **WHEN** a command's icon is `<svg onload="alert(1)"><script>…</script></svg>`
- **THEN** the svg is shown without the `onload` attribute and without the script

### Requirement: Hotkey
The palette SHALL open (and, when open, close) on its `hotkey`, default `Mod+K`, where `Mod` is Command on a Mac and Ctrl elsewhere. `hotkey="none"` or an empty value SHALL turn it off. A hotkey without Ctrl, Meta or Alt SHALL NOT fire while an editable field has focus.

#### Scenario: Hotkey
- **WHEN** focus is on a page button and Ctrl+K is pressed (not on a Mac)
- **THEN** the palette opens with focus in its input

#### Scenario: Hotkey off
- **WHEN** the palette has `hotkey="none"` and Ctrl+K is pressed
- **THEN** nothing opens

### Requirement: Opening and closing
The palette SHALL open on `open()`, `toggle()` and when the `open` attribute is set, with an empty query, focus in the input and the page scroll locked. It SHALL close on `close()`, Escape and a click on the scrim, and give focus back to the element that had it. Events `command-palette-open` and `command-palette-close` SHALL fire.

#### Scenario: Escape restores focus
- **WHEN** the palette was opened from a focused button and Escape is pressed
- **THEN** the palette closes and the button has focus again

### Requirement: Search and highlight
Typing SHALL filter the commands: every word of the query, with case and accents ignored, SHALL match the label (as a substring, else as its letters in order from the start of a word, with at most two letters skipped per step on average) or one of the keywords. Matched letters of the label SHALL be wrapped in `<mark>`.

#### Scenario: Substring with highlight
- **WHEN** the query is "set"
- **THEN** "Open settings" is listed with "set" inside a `mark`

#### Scenario: Letters in order
- **WHEN** the query is "nwf"
- **THEN** "New file" is listed with "N", "w" and "f" marked

#### Scenario: Keyword
- **WHEN** a command "Sign out" has `"keywords": ["logout"]` and the query is "logout"
- **THEN** "Sign out" is listed

#### Scenario: Nothing found
- **WHEN** no command matches
- **THEN** the empty text is shown and the input has no `aria-activedescendant`

### Requirement: Result order and empty text
Results SHALL stay grouped, groups ordered by their best match and commands by score. With no match the `empty-text` (default "No matching commands") SHALL be shown, and a polite status SHALL report the number of results.

#### Scenario: Best group first
- **WHEN** the query is "fi" and "New file" (group File) matches at a word start while "Edit profile" (group Account) matches inside a word
- **THEN** the File group is listed before the Account group

### Requirement: Recent commands
With the `recent` attribute (a number, empty for 5) the palette SHALL remember, in memory only, the ids of the last run commands and, while the query is empty, list them first in a group "Recent" (`KakaoCommandPalette.texts.recent`).

#### Scenario: Recent first
- **WHEN** a palette with `recent` ran "New file" and is opened again
- **THEN** the first group is "Recent" and its first option is "New file"

### Requirement: Running a command
Enter on the active option, or a click on an option, SHALL run the command: the palette closes, then fires a bubbling, composed, cancelable `command-select` with `{ id, value, command }` (`value` defaults to the id), also emitted as the KakaoComponents trigger `command-select`. A command with `href` SHALL then navigate there (a new window for `target="_blank"`) unless the event was cancelled; a `javascript:` URL SHALL be ignored.

#### Scenario: Event
- **WHEN** "New file" (`id: "new"`, no href) is run
- **THEN** `command-select` fires with `{ id: "new", value: "new" }` after the palette closed

#### Scenario: Link
- **WHEN** a command with `"href": "settings.html"` is run and nobody cancels the event
- **THEN** the page goes to `settings.html`

### Requirement: Combobox semantics
The palette panel SHALL be a `role="dialog"` with `aria-modal="true"` named by `label` (default "Command palette"). The input SHALL have `role="combobox"`, `aria-expanded="true"`, `aria-controls` pointing at the `listbox` and `aria-activedescendant` pointing at the active option.

#### Scenario: Roles
- **WHEN** the palette is open with results
- **THEN** the input is a combobox whose `aria-activedescendant` names an option in the listbox

### Requirement: Keyboard
Down / Up SHALL move the active option (wrapping), Home / End to the first / last, PageDown / PageUp by eight; disabled options SHALL be skipped. The first result SHALL be active after each change of the query. Tab SHALL keep focus in the input.

#### Scenario: Arrows
- **WHEN** the palette is open and Down is pressed
- **THEN** the second enabled option becomes active and the input's `aria-activedescendant` names it

### Requirement: Inline
With `inline` the palette SHALL be shown in place: always open, no scrim, no scroll lock, no hotkey; Escape clears the query.

#### Scenario: Preview
- **WHEN** a palette has `inline`
- **THEN** its input and results are part of the page flow

### Requirement: Small screens, motion and theming
Below 40rem of viewport width the panel SHALL be a full-width sheet at the top of the viewport. The opening fade SHALL be off under `prefers-reduced-motion: reduce`. Every visual value SHALL be a `--kakao-command-palette-*` property in the component's settings block, colours defaulting to theme roles.

#### Scenario: Phone
- **WHEN** the viewport is 390px wide and the palette is open
- **THEN** the panel spans the full width at the top with no horizontal scroll
