# Proposal

## Why

The components page lists "Menu & context menu" as missing. `<kakao-button list-data>` covers a simple pick-one dropdown, but pages also need action menus with groups, separators, shortcuts, check and radio items and submenus, opened from any trigger or by right-click. There is no native element for that.

## What Changes

- New component `<kakao-menu>` (`components/menu/`), shadow DOM.
  - Items from `list-data` or the `items` property: a string, `"-"` (separator), `{ group, items }` (a group with an optional heading), or `{ label, value, icon, shortcut, disabled, tone: "danger", type: "checkbox" | "radio", checked, name, href, target, children }`.
  - Shortcuts drawn with `<kakao-kbd size="sm">` when that element is defined, else as plain text; they are hints only.
  - Opening: `for="<id>"` (click toggles, Down / Up open on the first / last item, the trigger gets `aria-haspopup` and `aria-expanded`), `context-for="<id>"` (right-click, long-press on touch, Shift+F10, the ContextMenu key), `open(anchor)`, `openAt(x, y)`, `close()`, `toggle()`, the `open` attribute; `inline` shows the menu in place.
  - WAI-ARIA menu pattern: `menu` / `menuitem` / `menuitemcheckbox` / `menuitemradio`, `group` with headings, `separator`; arrows, Home / End, type-ahead, Enter / Space, Right / Left for submenus, Escape returns focus, Tab closes.
  - Placement `bottom-start` (default), `bottom-end`, `top-start`, `top-end`; flips to the other side and stays inside the viewport. Submenus open right, else left, else (a phone) under their item.
  - Events `menu-select` (`{ value, item, checked }`, cancelable), `menu-open`, `menu-close`, all bubbling and composed.
  - Look of the select's panel: overlay shadow level 3 with its 1px ring, 10px radius, 6px item radius, z 70 where the top layer is missing. Reduced motion and forced colours honoured.
- Settings block (`--kakao-menu-*`), construction page, demo page; a card on `components.html` (alphabetical, after List) replacing the "Menu & context menu" placeholder; style guide audit row; changelog entry.

## Capabilities

### New Capabilities
- `menu`: items and their sources, opening (trigger, context, script, inline), menu semantics and keyboard, check and radio items, submenus, placement, events, theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/menu/{menu.js,demo.html,construction.html}`. Uses `<kakao-kbd>` only when the page loads it; `kakao-button` is not changed.
- Pages: `components.html` (new card, placeholder removed), `styleguide.html` (audit row). Not on `kitchen-sink.html`: its settings form has no action menu.
- `CHANGELOG.md` (Unreleased, Added). `.github/workflows/pages.yml` copies `components/` wholesale, so it is unchanged. No new token, no theme change.
