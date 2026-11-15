# Tasks

## 1. Component

- [x] 1.1 `components/menu/menu.js`: shadow DOM with settings block; items from `list-data` and `items` (separators, groups, icons, shortcuts via kakao-kbd or text, disabled, danger, checkbox / radio, links, submenus); `for`, `context-for`, `open()`, `openAt()`, `close()`, `toggle()`, `inline`; menu roles, keyboard and type-ahead; placement with flipping; events; reduced motion and forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/menu/demo.html`: demo-page card convention with code tiles: trigger, labels only, placement, groups, check and radio, submenus, links, context menu on an area and on rows, script API, inline. Verify: loads without console errors.
- [x] 1.3 `components/menu/construction.html`: preview plus a manifest for every `--kakao-menu-*` property. Verify: the manifest and the settings block list the same properties.

## 2. Pages

- [x] 2.1 `components.html`: Menu card after List, script tag added, "Menu & context menu" placeholder removed from "Not built yet". Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased "Added" entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: panel, icons, shortcuts, checks and separators readable; Down / Up on the trigger, arrows, Home / End, type-ahead, Enter, Right / Left, Escape (focus back on the trigger) and Tab work; disabled items are skipped; right-click, Shift+F10, the ContextMenu key and a touch long-press open the context menu; submenus open beside, or under their item at 390px; no horizontal scroll at 390px; reduced motion stops the fade; no console errors.

## Workflow follow-up

- Archive the change once every task is done.
