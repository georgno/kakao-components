# Proposal

## Why

A Flutter mirror library (`kakao-components-flutter`) is planned. Its widgets must look and move the same as the web components. Its widgets will be hand-written, but their colours, sizes, radii, shadows and motion have to come from the same values the web components use. Copying those values by hand would drift within one release: there are 61 settings blocks with about 1,500 settings, plus 7 themes and their high-contrast overrides. Every design value already sits in machine-readable blocks (`shared/tokens.css`, `shared/themes.css`, the `@kakao-settings` blocks), so a script can export them all.

## What Changes

- New Node tool `tools/export-tokens.js` (no packages, like the other tools). It reads the shared tokens, every theme, the high-contrast overrides and every component's settings block, and writes one `tokens.json` at the repo root.
- Values are written in a form a non-CSS consumer can use without a CSS engine:
  - lengths in px (rem and em converted as stated in the file);
  - colours as hex with alpha;
  - durations in ms;
  - easing curves as four numbers;
  - shadows as lists of layers.
- References are kept: a component setting records which shared token or sibling setting it falls back to, as well as its resolved value. A theme change on the web therefore carries through to the Flutter side.
- Theme-dependent values (`color-mix`, references to colour roles) are resolved once per theme and per contrast mode.
- Values a plain number cannot hold (`calc`, `clamp`, `min`, `vh`/`vw`/`dvh`, `inherit`, `currentColor`) are written as typed expressions, never dropped silently.
- `tokens.json` is committed. `--check` fails when it is out of date, and the deploy workflow runs `--check`. The pre-commit hook regenerates the file. On a release tag (`vX.Y.Z`), the file at that tag is the contract the Flutter library builds from.
- The file is also published on the demo site, so the current version has a stable URL.

## Capabilities

### New Capabilities
- `token-export`: the machine-readable export of every design value (shared tokens, themes, contrast overrides, component settings): its format, its resolution rules, and how it is kept in step with the sources.

### Modified Capabilities
<!-- None: the tokens, themes and settings blocks keep their current behaviour; the export only reads them. -->

## Impact

- New: `tools/export-tokens.js`, its `node:test` tests, and `tokens.json`.
- `.githooks/pre-commit`: regenerates and stages `tokens.json`.
- `.github/workflows/pages.yml`: runs `node tools/export-tokens.js --check` and copies `tokens.json` to the site.
- `AGENTS.md`: one rule line on the generated file.
- No change to any component, page or theme value; no runtime impact.
- Out of scope: the Flutter repository itself, its code generator, and its debug-app build pipeline. They consume this file and are planned in that repository.
