# Tasks

## 1. Component

- [x] 1.1 `components/avatar/avatar.js`: `kakao-avatar` (shadow DOM, settings block, lazy image with fallback and events, initials, icon slot and glyph, sizes, shape, tone from the name, status dot and label, forced colours, reduced motion) and `kakao-avatar-group` (overlap, ring, `max`, `total`, `size`, `shape`, `label`, `more-label`); header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 Contrast of every tone measured against all themes. Verify: 4.5:1 or more everywhere.
- [x] 1.3 `components/avatar/demo.html`: demo-page card convention with code tiles. Verify: every card has a code tile; no console errors.
- [x] 1.4 `components/avatar/construction.html`: preview plus a manifest for every `--kakao-avatar-*` property. Verify: manifest and settings block list the same properties.
- [x] 1.5 `shared/demo-images/`: three small SVG portraits. Verify: under 1 kB each; `shared/` is copied whole by the deploy.

## 2. Pages

- [x] 2.1 `components.html`: Avatar card between Aside sheet and Badge, script tag added, placeholder removed. Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased entries. Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and a dark theme: images load, the broken image falls back, initials readable, dots distinct, groups overlap with "+N", no horizontal scroll at 390px, never focusable, events logged, no console errors.

## Workflow follow-up

- Archive the change once every task is done.
