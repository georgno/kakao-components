# tree-view Specification

## Purpose
`<kakao-tree-view>` shows nested, collapsible rows, such as folders and files or permission groups, as an accessible tree with optional single or multiple selection and a form value.

## Requirements

### Requirement: Nodes from list-data
The component SHALL take its nodes from the `list-data` attribute, a JSON array whose entries are a string (the label) or an object with `label` and optional `id`, `children`, `icon`, `expanded`, `disabled`, `selected` and `lazy`, and from the `nodes` property with the same shapes. A node without an `id` SHALL get one from its position. It SHALL render again when either changes. Invalid JSON SHALL give an empty tree and a console warning.

#### Scenario: Nested nodes
- **WHEN** a tree has `list-data='[{"id":"a","label":"A","expanded":true,"children":[{"id":"b","label":"B"}]}]'`
- **THEN** a row "A" is shown open with a row "B" indented under it

#### Scenario: Strings
- **WHEN** a node's children are `["Lion", "Lynx"]`
- **THEN** two leaf rows with those labels are shown

#### Scenario: From script
- **WHEN** a script sets `el.nodes = [{ id: 'x', label: 'X' }]`
- **THEN** the tree shows that one row

### Requirement: Nodes from a nested list
Without a `list-data` attribute the component SHALL read a nested `<ul>` or `<ol>` inside the element as its nodes: each `<li>` is a node whose label is its own text, whose nested list holds its children, and whose `data-id`, `data-icon`, `data-expanded`, `data-selected`, `data-disabled` and `data-lazy` attributes set the matching fields. `list-data` SHALL win when both are present. `refresh()` SHALL read the source again.

#### Scenario: Server-rendered list
- **WHEN** a tree without `list-data` contains `<ul><li data-id="home" data-expanded>Home<ul><li data-id="about">About</li></ul></li></ul>`
- **THEN** it shows "Home" open with "About" under it, and the node ids are "home" and "about"

### Requirement: Tree semantics
The rows SHALL be exposed as a `role="tree"` with an accessible name from the `label` attribute ("Tree" by default, changeable through `KakaoTreeView.texts`). Each node SHALL be a `role="treeitem"` with `aria-level`, `aria-posinset` and `aria-setsize`; a node that can be opened SHALL carry `aria-expanded` and hold its children in a `role="group"`; a disabled node SHALL carry `aria-disabled="true"`. Chevrons, icons and checkboxes SHALL be hidden from assistive technology.

#### Scenario: Open and closed
- **WHEN** a node with children is closed
- **THEN** its treeitem has `aria-expanded="false"` and its children are not shown

#### Scenario: Leaf
- **WHEN** a node has no children and is not lazy
- **THEN** its treeitem has no `aria-expanded`

### Requirement: One tab stop
Exactly one row SHALL be in the tab order: at first the selected row in single selection, otherwise the first row; afterwards the row that last had focus. When a node closes while focus is inside it, focus SHALL move to that node.

#### Scenario: One tab stop
- **WHEN** a tree is rendered
- **THEN** exactly one treeitem has `tabindex="0"`

### Requirement: Keyboard
With focus on a row: Up and Down SHALL move to the previous and next visible row; Right SHALL open a closed node, or move to the first child of an open one; Left SHALL close an open node, or move to the parent; Home and End SHALL move to the first and last visible row; `*` SHALL open every node on the row's level; Enter and Space SHALL activate the row. Left and Right SHALL be mirrored in right-to-left text.

#### Scenario: Right, then right
- **WHEN** focus is on a closed node with children and Right is pressed twice
- **THEN** the node opens, then focus moves to its first child

### Requirement: Type-ahead
Typing characters on a row SHALL move focus to the next visible row whose label starts with what was typed, wrapping round to the top.

#### Scenario: Type-ahead
- **WHEN** focus is on the first row and "p" is typed
- **THEN** focus moves to the next visible row whose label starts with "P"

### Requirement: Opening and closing
A click on a node's chevron SHALL open or close it. Before a node opens, the component SHALL fire a cancelable `tree-expand` event with `{ id, label, lazy }`; when it is cancelled the node SHALL stay closed. After a node opened or closed, `tree-toggle` with `{ id, label, expanded }` SHALL fire. Both events SHALL bubble and be composed.

#### Scenario: Cancelled
- **WHEN** a `tree-expand` listener calls `preventDefault()`
- **THEN** the node stays closed and no `tree-toggle` fires

### Requirement: Opening from script
`expand(id)`, `collapse(id)` and `toggle(id)` SHALL open and close a node as a click on its chevron does; `expandAll()` SHALL open every node whose children are loaded and `collapseAll()` SHALL close every node.

#### Scenario: From script
- **WHEN** a script calls `el.expand('docs')`
- **THEN** the node "docs" opens and `tree-toggle` fires with `expanded: true`

### Requirement: Chevron
The chevron SHALL be an inline SVG in currentColor that turns when the node is open, without animation under reduced motion.

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion and a node is opened
- **THEN** the chevron shows its open position at once

### Requirement: Single selection
With `selection="single"`, the default, activating an enabled row (click, Enter, Space) SHALL select it and deselect the others, mark it with `aria-selected="true"`, and fire `tree-select` with `{ id, label, selected, value }`. A disabled node SHALL NOT be selectable. A double click on a row SHALL open or close it.

#### Scenario: Select
- **WHEN** a row "Notes" is clicked
- **THEN** it is the only selected row and `tree-select` fires with `value` holding its id

### Requirement: Multiple selection with checkboxes
With `selection="multiple"` every row SHALL show a checkbox and carry `aria-checked`. A parent SHALL be "true" when every node under it is ticked, "false" when none is, and "mixed" otherwise. Activating a parent SHALL tick every enabled leaf under it, or clear them when all are already ticked; disabled nodes SHALL keep their state. A parent given as `selected` in the data SHALL tick everything under it. Each change by the user SHALL fire `tree-select`.

#### Scenario: Mixed parent
- **WHEN** two of a parent's three children are ticked
- **THEN** the parent has `aria-checked="mixed"` and shows a dash

#### Scenario: Tick a parent
- **WHEN** a mixed parent is activated
- **THEN** all its enabled leaves are ticked

### Requirement: No selection
With `selection="none"` no row SHALL be selectable or carry a selected state, and activating a row that can be opened SHALL open or close it.

#### Scenario: Row click opens
- **WHEN** a closed parent row is clicked in a tree with `selection="none"`
- **THEN** it opens and `value` stays empty

### Requirement: Value
The `value` property SHALL return the selected ids in tree order and accept an array of ids (or one id). In multiple selection a parent's id SHALL tick everything under it, and a fully ticked parent SHALL be part of the value unless `leaves-only` is set. `clear()` SHALL select nothing.

#### Scenario: Leaves only
- **WHEN** every child of "reports" is ticked in a tree with `leaves-only`
- **THEN** `value` holds the children's ids and not "reports"

### Requirement: Form participation
The component SHALL be form-associated: with a `name` it SHALL submit one entry per selected id under that name, and nothing when disabled or without a name. A form reset SHALL restore the selection the data started with.

#### Scenario: Submitted ids
- **WHEN** a tree with `name="perm[]"` and `leaves-only` has the leaves "a.read" and "b.read" ticked
- **THEN** the form data holds `perm[]=a.read` and `perm[]=b.read`

#### Scenario: Reset
- **WHEN** the user changes the selection and the form is reset
- **THEN** the initial selection is back

### Requirement: Lazy children
A node with `lazy` SHALL show a chevron without having children. When it is opened and `tree-expand` is not cancelled, it SHALL show a spinner and carry `aria-busy="true"` until `setChildren(id, nodes)` is called. Children arriving under a ticked lazy parent SHALL be ticked.

#### Scenario: By event
- **WHEN** a lazy node is opened and the page later calls `setChildren(id, [{ "id": "x", "label": "X" }])`
- **THEN** the spinner goes and the row "X" is shown under the node

### Requirement: loadChildren function
When the `loadChildren` property is a function, the component SHALL call it with `{ id, label }` when a lazy node opens and use the returned array, or the array a returned Promise resolves to, as the children. When it fails the node SHALL close and stay lazy.

#### Scenario: By function
- **WHEN** `loadChildren` returns a Promise of two nodes and a lazy node is opened
- **THEN** the two rows appear under it when the Promise resolves

### Requirement: Disabled
With the `disabled` attribute, or inside a disabled fieldset, no row SHALL be focusable, opened or selected by the user, and the tree SHALL be dimmed.

#### Scenario: Disabled tree
- **WHEN** a tree has `disabled`
- **THEN** no treeitem is in the tab order and clicks change nothing

### Requirement: Icons and guides
A node's `icon` SHALL be one of the known glyphs (folder, file, user, users, lock, key), drawn as inline SVG in currentColor before the label; any other value or none SHALL draw no icon. The `guides` attribute SHALL draw a line down each open level.

#### Scenario: Unknown icon
- **WHEN** a node has `"icon": "rocket"`
- **THEN** the row shows no icon

### Requirement: Theming hooks
Every visual value SHALL be a `--kakao-tree-view-*` custom property whose default lives in the component's one settings block, every colour defaulting to a theme role with a literal fallback. The hover and selected fills SHALL default to the roles the list and the select's options use (`subtle`, `subtle-strong`). The construction page SHALL list every property.

#### Scenario: Theme change
- **WHEN** the page switches to a dark theme
- **THEN** the rows, fills, checkboxes and guides take the theme's colours without further settings
