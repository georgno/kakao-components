# Proposal

## Why

Visual decisions about the components (colours, spacing, radii, timing) are made today by editing values in the source and reloading. That is slow and hard to compare, and there is no shared set of main values, so the same accent colour or padding is repeated in every component. Before a real visual design is added, there should be one place per component to tune its look live and save the result into the component itself, plus main variables that all components can follow.

## What Changes

- New standing rule: every component, new or being worked on, has a construction page at `components/<name>/construction.html`. It shows a live preview and a settings table (grouped like a design tool's inspector: colour, size and spacing, shape, effects, motion), with controls that update the preview immediately.
- A Save button writes the chosen values into the component's own source as its built-in defaults. Pages that use the component then get them without loading anything extra.
- Global main variables (design tokens) such as primary colour, text colour, horizontal and vertical padding, radius, font and motion duration. They live in one shared tokens file, are edited on their own construction page, and can be picked as the value of any component setting. The saved default then follows the token, with the literal value as a fallback.
- A small dev-only local server (Node, no dependencies) serves the project and performs the saves. Without it, construction pages still work as previews, but Save is disabled with a hint. The components themselves keep needing no build step and no server.
- Construction pages for all 11 existing components. Where a component hard-codes a visual value the table should control, that value becomes a `--kakao-<component>-*` custom property.
- The overview page and each demo page link to the component's construction page. The project context in `openspec/config.yaml` records the rule so that every future proposal includes a construction page.

## Capabilities

### New Capabilities
- `construction-page`: the per-component construction page (preview, settings table, token picking, reset, save) and the rule that every component has one.
- `design-tokens`: the global main variables, their editor page and how component defaults refer to them.
- `construction-server`: the local dev server that serves the project and writes saved settings and tokens into the source files.

### Modified Capabilities
- `component-conventions`: theming defaults live in a marked, machine-writable settings block in the component source and may refer to design tokens. Every visual value the construction page controls is a custom property.
- `component-overview`: overview cards and demo pages link to the component's construction page.

## Impact

- New files: `shared/tokens.css`, `shared/construction.js`, `shared/construction.css`, `tools/construct-server.js`, `tokens.html`, and `components/<name>/construction.html` plus a settings manifest per component.
- Every component source gets a marked settings block (`.js` for shadow DOM components; `.css` for the light DOM ones: button, tabs, number-input). Some hard-coded values become custom properties. Current defaults keep their values, so nothing looks different until something is saved.
- `index.html` and every `demo.html` get a link to the construction page.
- `openspec/config.yaml` context gains the construction page rule.
- New dev requirement: Node to run the save server. It is not needed to use the components.
