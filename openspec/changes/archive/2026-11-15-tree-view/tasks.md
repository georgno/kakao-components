# Tasks

## 1. Component

- [x] 1.1 `components/tree-view/tree-view.js`: shadow DOM with settings block; nodes from `list-data`, `nodes` and a nested list; tree roles, roving tabindex and keyboard; selection single / multiple (tri-state) / none; form value with `name` and `leaves-only`; lazy nodes with `tree-expand`, `setChildren` and `loadChildren`; chevron, icons, guides; methods and events; `KakaoTreeView.texts`; reduced motion and forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `components/tree-view/demo.html`: demo-page card convention with code tiles: nodes and icons, guides, nested list, multiple and none, form, lazy by event and by function, API, words. Verify: loads without console errors.
- [x] 1.3 `components/tree-view/construction.html`: preview plus a manifest for every `--kakao-tree-view-*` property. Verify: the manifest and the settings block list the same properties.

## 2. Pages

- [x] 2.1 `components.html`: Tree view card after Toast, script tag added, "Tree view" placeholder removed from "Not built yet". Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased "Added" entry. Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: rows, chevrons, checkboxes and guides readable; arrow keys, Home / End, type-ahead, Enter and Space work with one tab stop; tri-state parents; the form sends the ids and resets; lazy nodes load; no horizontal scroll at 390px; no console errors.

## Workflow follow-up

- Archive the change once every task is done.
