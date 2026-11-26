# Proposal

## Why

Reports and dashboards built with the library open almost every section with the same row: a heading, often a count ("Findings 12"), a line of description and one or two actions on the right. Consumers rebuild it by hand each time, with a different heading size, spacing and phone layout on every page, and often a heading that is only a styled `<div>`.

## What Changes

- `<kakao-section-header>`: `heading`, `level` (2 · 3 · 4 · 5 · 6, default 2) renders a real `<h2>`–`<h6>`; `count` adds a muted number to the heading, `count-tone` draws it as a `kakao-badge` instead (enhanced by badge, plain text without it); `count-label` is what a screen reader hears instead of the bare number; `description` (or `slot="description"`) a muted line under it; `slot="actions"` children sit at the end of the row and wrap below the text on a narrow screen. Honours `hidden`. Template: `kakao-settings-group` (heading + description attributes) and `kakao-plain-list` (light DOM).
- **Light DOM, not shadow DOM.** A heading inside a shadow root is in the accessibility tree, but it is invisible to the page: `kakao-toc` and other outline tools (`querySelectorAll('h2')`), `#id` fragment links and `:target` cannot reach it, and the page's heading order is split across roots. The script therefore renders the `<hN>` into the light DOM, styled by `section-header.css`. The heading gets `data-toc-title` (the heading text without the count), so a toc lists "Findings", not "Findings 12".
- `level` is named after the job text and `aria-level`: here the whole element is the heading. `heading-level` on other components sets the level of a heading inside a box.
- Spacing from the shared tokens (`--kakao-space-gap`, `--kakao-space-y`). Demo and construction pages, components.html card, kitchen-sink entry, styleguide audit row, VALUES, CATALOG line, AGENTS.md light-DOM list, manifest, loader map, tokens.json, CHANGELOG.

## Capabilities

### New Capabilities
- `section-header`: the heading row of a page section.

## Impact

components/section-header/ (new), components.html, kitchen-sink.html, styleguide.html, tools/style-check/helpers.js, CATALOG.md, AGENTS.md, custom-elements.json, shared/kakao.js, tokens.json, index.html (count), CHANGELOG.md. No breaking change.
