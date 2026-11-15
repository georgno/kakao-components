# Proposal

## Why

Folder structures and permission groups need nested, collapsible rows, and the components page still lists Tree view as missing. Nested `<details>` gives the opening and closing but no single tab stop, no arrow keys, no selection and no tri-state checkboxes for "everything under this group".

## What Changes

- New component `<kakao-tree-view>` (`components/tree-view/`), shadow DOM.
  - Nodes from `list-data` (`id`, `label`, `children`, `icon`, `expanded`, `disabled`, `selected`, `lazy`; a string is a label), from the `nodes` property, or from a nested `<ul>` / `<li>` inside the element (`data-id`, `data-icon`, `data-expanded`, `data-selected`, `data-disabled`, `data-lazy`).
  - WAI-ARIA tree pattern: `tree` / `treeitem` / `group`, `aria-expanded`, level and position, one tab stop (roving tabindex), Up / Down, Right, Left, Home / End, type-ahead, `*`, Enter / Space.
  - `selection`: `single` (default), `multiple` (checkboxes, parents cascade and show a mixed state) or `none`.
  - Form-associated: `name` sends every selected id; `leaves-only` leaves parents out; reset restores the initial selection.
  - Lazy children: `"lazy": true`, a cancelable `tree-expand`, `setChildren(id, nodes)` or a `loadChildren` function; a spinner and `aria-busy` meanwhile.
  - Own chevron that turns when a node opens (still under reduced motion), named icon glyphs, optional `guides`.
  - Events `tree-select`, `tree-expand`, `tree-toggle` (bubbling, composed); methods `expand`, `collapse`, `toggle`, `expandAll`, `collapseAll`, `setChildren`, `clear`, `refresh`; `KakaoTreeView.texts`.
- Settings block (`--kakao-tree-view-*`), construction page, demo page; a card on `components.html` (alphabetical, after Toast) replacing the "Tree view" placeholder; style guide audit row; changelog entry.

## Capabilities

### New Capabilities
- `tree-view`: nodes and their sources, tree semantics and keyboard, selection modes, form value, lazy children, methods and events, theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/tree-view/{tree-view.js,demo.html,construction.html}`. No dependency on other components.
- Pages: `components.html` (new card, placeholder removed), `styleguide.html` (audit row). Not on `kitchen-sink.html`: its settings form has no nested data.
- `CHANGELOG.md` (Unreleased, Added). `.github/workflows/pages.yml` copies `components/` wholesale, so it is unchanged. No new token, no theme change.
