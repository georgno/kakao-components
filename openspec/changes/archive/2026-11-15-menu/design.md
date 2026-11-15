# Design

## Decisions

- **Shadow DOM, panels in the top layer.** The panels are drawn from the item data and the component styles nothing at page level. Each popup panel is a `popover="manual"` so it sits above sticky headers, sheets and dialogs without a z-index race; where the Popover API is missing, `position: fixed` with `--kakao-menu-z` (70, the select's level, above dialog 60) takes over.
- **Not an extension of kakao-button.** The button's `list-data` dropdown stays the simple case and is not changed. The menu copies the select panel's surface (level 3 overlay shadow with its 1px ring, 10px radius, 4px padding, 6px item radius, 36px items, 44px on coarse pointers), not shared code, as the combobox does.
- **Items.** One shape for `list-data` and `items`: strings, `"-"`, groups and item objects. A group renders as `role="group"` labelled by its heading; radio items belong together by `name`, else by group. `href` items render as real `<a>` so they can be opened in a new tab; `javascript:` links are dropped. Icons are a small named set of inline SVGs in `currentColor`; a menu with any icon or check item keeps a leading column so labels line up.
- **Shortcuts are hints.** Drawn with `<kakao-kbd size="sm">` once that element is defined (the menu re-renders when it arrives), else as plain muted text. The menu does not bind keys: what a shortcut does is the page's business.
- **Opening.** `for` wires a trigger (its inner button or link takes `aria-haspopup="menu"` and `aria-expanded`); a pointer click opens with focus on the panel, a keyboard click or Down opens on the first item, Up on the last. `context-for` opens at the pointer on `contextmenu`, after a 500ms touch press that does not move (iOS sends no `contextmenu`), and under the focused element with Shift+F10 or the ContextMenu key. Script: `open(anchor)`, `openAt(x, y)`.
- **Keyboard.** The APG menu: Down / Up wrap, Home / End (and Page keys), type-ahead (a repeated letter walks on, a word is matched with a 600ms buffer), Enter / Space pick, Right opens a submenu on its first item, Left and Escape close one level and return to the parent item, Escape on the root closes and returns focus to where it was, Tab closes and lets focus move on. Disabled items are shown but skipped.
- **Placement.** Under the trigger (or above for `top-*`), flipped when the other side has more room; lined up with the start edge, else the end edge, else clamped inside an 8px margin; the max height shrinks to the room so long menus scroll. At a point: the top-left corner on the point, flipped to the other side when it would leave the viewport. Scrolling and resizing re-place an anchored menu and close a menu opened at a point.
- **Phones.** No bottom sheet: menus are short and stay anchored to what they act on. A submenu with no room on either side opens under its item, over the parent menu, so the path stays visible. Rows are 44px on coarse pointers.
- **Events.** `menu-select` carries `value`, the original `item` and, for check items, the new `checked`; it is cancelable (the menu stays open, the check stays, a link is not followed). Check items close the menu unless `keep-open`. `menu-open` / `menu-close` bracket every opening.
- **Motion.** A 150ms fade and 4px slide in; none under reduced motion. Forced colours get a panel border and a Highlight outline on the active item.

## Out of scope

- A menubar (a row of menus), binding the shortcut keys, search inside the menu, a bottom-sheet presentation on phones.
