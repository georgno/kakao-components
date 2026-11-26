# Proposal

## Why

Consumers lay out every page by hand: a `main` with its own max-width and padding (often forgetting the space below the sticky header bar or the fixed action bar), a CSS grid of cards with home-made breakpoints, and a column of sections whose spacing differs per page. `kakao-stack` sounds like a layout but is the card pile.

## What Changes

- Three light-DOM layout primitives, drawn by their CSS alone (work without JS; the script only defines the tag so the loader and `:defined` see it). Template: `kakao-code`. Spacing from tokens (`--kakao-space-y`, `--kakao-space-gap`, `--kakao-space-below-bar`).
- `<kakao-page>`: the page container. Centred, `width` = `narrow` · `normal` (default) · `wide` · `full`, side padding (plus safe-area insets), starts `--kakao-space-below-bar` below the header bar and keeps its end clear of a fixed action bar (`--kakao-action-bar-rendered-height`).
- `<kakao-grid>`: a responsive grid. `auto-fit` columns of at least `min` = `sm` · `md` (default) · `lg` (or any length through `--kakao-grid-min`), never wider than the container; `gap` = `sm` · `md` (default) · `lg`; `fill` keeps empty tracks so few items keep their column width.
- `<kakao-flow>`: a vertical flow, one gap between its children (`gap` = `sm` · `md` (default) · `lg`), replacing their own block margins; hidden children leave no gap.
- All honour `hidden`. Names: not `stack` (the card pile), not `layout` (too vague for three things); `kakao-grid` is set apart from `kakao-grid-view` (the data grid) in both CATALOG lines.
- Demo and construction pages, components.html cards, kitchen-sink (its content column is a kakao-page, the summary card a kakao-flow), styleguide audit rows, VALUES, CATALOG lines and the "which one?" row (stack vs layout), the stack header's `not for`, AGENTS.md light-DOM list, manifest, loader map, CHANGELOG.

## Capabilities

### New Capabilities
- `page`, `grid`, `flow`: one per primitive.

## Impact

components/page/, components/grid/, components/flow/ (new), components/stack/stack.js (CATALOG line), components.html, kitchen-sink.html, styleguide.html, tools/style-check/helpers.js, CATALOG.md, AGENTS.md, custom-elements.json, shared/kakao.js, tokens.json, index.html (count), CHANGELOG.md. No breaking change.
