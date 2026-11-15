# Spec Delta

## Purpose

`<kakao-menu>` is a menu of actions, opened from a trigger, by script or as a context menu, with groups, separators, icons, shortcuts, check and radio items, links and submenus, following the WAI-ARIA menu pattern.

## ADDED Requirements

### Requirement: Items from list-data
The component SHALL take its items from the `list-data` attribute (a JSON array) and from the `items` property. An entry SHALL be a string (an item valued by its label), `"-"` (a separator), `{ group, items }` (a group, heading optional) or an item object (`label`, `value`, `icon`, `shortcut`, `disabled`, `tone`, `type`, `checked`, `name`, `href`, `target`, `children`). It SHALL render again when either source changes; invalid JSON SHALL give an empty menu and a console warning.

#### Scenario: Strings and separators
- **WHEN** a menu has `list-data='["Open", "-", "Delete"]'`
- **THEN** it shows the items "Open" and "Delete" with a `role="separator"` line between them

#### Scenario: Groups
- **WHEN** an entry is `{"group": "Team", "items": ["Invite", "Files"]}`
- **THEN** the two items sit in a `role="group"` labelled by the visible heading "Team"

#### Scenario: From script
- **WHEN** a script sets `menu.items = [{ label: 'Table', value: 'table' }]`
- **THEN** the menu shows that one item

### Requirement: Item content
An item SHALL show its `icon` (a named inline SVG glyph in `currentColor`) before the label, and its `shortcut` at the end of the row, drawn with `<kakao-kbd>` when that element is defined and as plain text otherwise. The menu SHALL NOT bind the shortcut keys. `tone: "danger"` SHALL colour the item with the danger role.

#### Scenario: Shortcut with kbd
- **WHEN** the page loads kakao-kbd and an item has `"shortcut": "Mod+D"`
- **THEN** the row ends in a small kakao-kbd keycap for that shortcut

#### Scenario: Shortcut without kbd
- **WHEN** kakao-kbd is not loaded
- **THEN** the shortcut is shown as muted plain text

### Requirement: Disabled and link items
`disabled: true` SHALL show the item dimmed with `aria-disabled="true"`; it cannot be picked. An item with `href` SHALL be a real link (with `target` when given); a `javascript:` URL SHALL be ignored.

#### Scenario: Disabled
- **WHEN** an item has `"disabled": true`
- **THEN** it is shown dimmed and clicking it fires no `menu-select`

#### Scenario: Link
- **WHEN** an item has `"href": "/help", "target": "_blank"`
- **THEN** it is an `<a>` with that `href`, `target="_blank"` and `rel="noopener"`

### Requirement: Check and radio items
An item with `type: "checkbox"` SHALL be a `menuitemcheckbox` and one with `type: "radio"` a `menuitemradio`, each with `aria-checked` and a check mark when on. Picking a checkbox item SHALL flip it; picking a radio item SHALL turn it on and the other radio items with the same `name` (else of the same group) off. These items SHALL close the menu unless the menu has `keep-open`.

#### Scenario: Radio group
- **WHEN** "Compact" is picked in a group where "Comfortable" was checked
- **THEN** "Compact" has `aria-checked="true"` and "Comfortable" `aria-checked="false"`

### Requirement: Opening from a trigger
With `for="<id>"` the element with that id SHALL toggle the menu on click; Down or Up on it SHALL open the menu with focus on the first or last item, and a keyboard click on the first item. The trigger (or the button or link inside it) SHALL get `aria-haspopup="menu"` and an `aria-expanded` that follows the open state. The menu's accessible name SHALL be its `label`, else the trigger's text, else "Menu" (`KakaoMenu.texts.menu`).

#### Scenario: Keyboard opening
- **WHEN** the trigger has focus and Down is pressed
- **THEN** the menu opens, the first enabled item has focus and the trigger has `aria-expanded="true"`

### Requirement: Context menu
With `context-for="<id>"` the menu SHALL open at the pointer on a right-click inside that element (suppressing the browser's menu), after a touch press of 500ms that does not move, and under the focused element with Shift+F10 or the ContextMenu key, with focus on the first item.

#### Scenario: Right-click
- **WHEN** the user right-clicks inside the context element
- **THEN** the menu opens with its top-left corner at the pointer and the browser's own menu does not appear

#### Scenario: Keyboard
- **WHEN** an element inside the context element has focus and Shift+F10 is pressed
- **THEN** the menu opens under that element with focus on its first item

### Requirement: Opening by script and inline
`open(anchor)` SHALL open the menu against the given element (default: the trigger), `openAt(x, y)` at a point in the viewport, `close()` SHALL close it and `toggle(anchor)` SHALL do either; `isOpen` SHALL report the state and the `open` attribute SHALL reflect it. With `inline` the root menu SHALL be shown in place with one tab stop; its submenus still open as popups. `disabled` SHALL keep the menu from opening.

#### Scenario: At a point
- **WHEN** a script calls `menu.openAt(120, 160)`
- **THEN** the menu opens with its top-left corner at (120, 160)

### Requirement: Menu semantics and keyboard
Each panel SHALL be a `role="menu"` of `menuitem`, `menuitemcheckbox` or `menuitemradio` elements. Down / Up SHALL move focus to the next / previous enabled item (wrapping), Home / End to the first / last, a printable character to the next item starting with the typed text; Enter and Space SHALL pick the item; Escape SHALL close and return focus to where it was before opening; Tab SHALL close and let focus move on. Disabled items SHALL be skipped.

#### Scenario: Type-ahead
- **WHEN** focus is on "Rename" and "d" is pressed in a menu with "Duplicate" and "Download"
- **THEN** focus moves to "Duplicate", and a second "d" moves it to "Download"

#### Scenario: Escape
- **WHEN** a menu opened from a trigger is closed with Escape
- **THEN** the trigger has focus and `aria-expanded="false"`

### Requirement: Submenus
An item with `children` SHALL carry `aria-haspopup="menu"` and `aria-expanded`, show an arrow, and open a submenu on Right, Enter, Space, click or a short hover. Right, Enter and Space SHALL put focus on the submenu's first item; Left and Escape SHALL close the submenu and return focus to its item. The submenu SHALL open to the right of its menu, else to the left, and with room on neither side under its item, over the parent menu.

#### Scenario: Into and out of a submenu
- **WHEN** focus is on "Share" and Right is pressed, then Left
- **THEN** the submenu opens with focus on its first item, then closes with focus back on "Share"

#### Scenario: Phone width
- **WHEN** a submenu opens in a 390px wide viewport
- **THEN** it opens under its item and stays inside the viewport

### Requirement: Placement
`placement` SHALL be `bottom-start` (default), `bottom-end`, `top-start` or `top-end`. The menu SHALL flip to the other side of the trigger when its side has too little room and the other more, SHALL stay at least 8px inside the viewport, and SHALL scroll when taller than the room. An anchored menu SHALL follow page scrolling and resizing; a menu opened at a point SHALL close on them.

#### Scenario: Flip
- **WHEN** a `bottom-start` menu opens from a trigger near the bottom of the viewport
- **THEN** it opens above the trigger

### Requirement: Events
The component SHALL dispatch `menu-select` when an item is picked, with `detail` `{ value, item }` (`item` being the original entry) plus `checked` (the new state) for check and radio items; the event SHALL be cancelable, and cancelling it SHALL keep the menu open, leave the check unchanged and stop a link. It SHALL dispatch `menu-open` and `menu-close`. All events SHALL bubble and be composed.

#### Scenario: Cancelled pick
- **WHEN** a `menu-select` listener calls `preventDefault()`
- **THEN** the menu stays open

### Requirement: Look and theming
The panel SHALL match the select's panel: overlay shadow level 3 with its 1px ring, theme background, 10px radius, 6px item radius, z-index 70 where the top layer is missing. Every visual value SHALL be a `--kakao-menu-*` property in the settings block, colours defaulting to theme roles. Rows SHALL be 44px tall on coarse pointers.

#### Scenario: Theme
- **WHEN** a dark theme is active
- **THEN** the panel, text, separators and danger items take the theme's roles

### Requirement: Motion and forced colours
The open fade SHALL not run under `prefers-reduced-motion: reduce`, and forced colours SHALL show a panel border and the active item.

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion and the menu opens
- **THEN** the panel appears without animation
