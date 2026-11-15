# Design

## Decisions

- **Shadow DOM.** The rows, chevrons, checkboxes and guides are all derived from the node data, and the component styles nothing at page level, so it follows the default in AGENTS.md. Theme values reach in through the inherited `--kakao-*` properties.
- **Two sources: `list-data` and a nested list.** `list-data` (and the `nodes` property) is the project's convention for data-driven components. A nested `<ul>` / `<li>` in the element is read as the same data when there is no `list-data`: a Yii2 view can render the tree as a plain list, which stays readable when the script does not load. The list is not slotted; the shadow tree is drawn from it, because the ARIA tree needs its own structure (rows, chevrons, checkboxes, `role="group"`) that a slotted list cannot provide. `list-data` wins when both exist; `refresh()` reads the source again after the page changed it.
- **Node ids.** Selection, the form value and the methods go by `id`. A node without one gets an id from its position (`node-0-2`); a duplicate id is warned about and suffixed.
- **Tree semantics.** One `role="tree"` list; each node is a `role="treeitem"` list item with `aria-level`, `aria-posinset`, `aria-setsize`, named by its label, holding a `role="group"` list for its children. Exactly one item is in the tab order (the selected one at first in single selection, else the first); focus moves it. The focus ring is drawn inset on the row, since the item also contains its children.
- **Keyboard.** As the APG tree: Up / Down over the visible rows, Right opens a closed node or enters an open one, Left closes or goes to the parent (mirrored in RTL), Home / End, `*` opens the siblings, letters jump to the next visible row starting with what was typed (the buffer ends after 600ms or on a move), Enter / Space activate.
- **Selection modes.** `single` is the default because a tree mostly picks one thing (a folder, a page); it uses `aria-selected` and the list's selected look (stronger subtle fill, weight 600). `multiple` uses `aria-checked` with the select panel's checkbox box; the leaves hold the truth and a parent is ticked, clear or mixed from them. Activating a parent ticks every enabled leaf under it, or clears them when all are ticked; disabled nodes keep their state. `none` makes a row click, Enter and Space open and close.
- **Click targets.** The chevron (a 24px target) opens and closes. A click on the rest of the row activates; in single selection a double click on the row also opens it, the file-manager habit.
- **Value and form.** `value` is the array of selected ids in tree order. In multiple selection a fully ticked parent is included, which lets a server store "the whole group" and covers lazy parents whose children were never loaded; `leaves-only` drops parents. With `name` the ids are sent as repeated entries through ElementInternals, so `name="perm[]"` gives PHP an array. Nothing is sent without a name, when disabled, or in `selection="none"`.
- **Lazy children.** A `lazy` node has a chevron but no children. Opening it fires the cancelable `tree-expand` (which every node fires, with `lazy` in the detail); the node shows a spinner and `aria-busy` until `setChildren(id, nodes)` is called, or until the `loadChildren` function's result arrives. A ticked lazy parent passes its tick to the children that arrive. A failed `loadChildren` closes the node again and leaves it lazy.
- **Motion.** The chevron turns 90° over the standard duration; under reduced motion nothing animates and the spinner stands still. Groups open without a height animation.
- **Words.** `KakaoTreeView.texts` (`label`, `loading`) for every tree, like the stepper.

## Out of scope

- Links as nodes, drag and drop, inline rename, node actions or badges.
- Independent (non-cascading) checkboxes, range selection with Shift.
- Virtual scrolling for very large trees; height animation of opening groups.
