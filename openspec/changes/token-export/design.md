# Design

## Context

The design values live in three kinds of blocks, all already parsed by existing tools:

- **Shared tokens:** `shared/tokens.css` holds one `@kakao-settings` block on `:root`, which is the light theme. `tools/check-themes.js` reads its colour roles.
- **Themes:** `shared/themes.css` holds the `@theme <name>` blocks, which override only `--kakao-color-*`. It also holds the `@generated` copies (light, os-dark), and the `prefers-contrast: more` overrides of muted, border and line per theme.
- **Component settings:** 61 component files (`<name>.js` for shadow DOM, `<name>.css` for light DOM) have one `@kakao-settings` block each. A line is either `--_alias: var(--kakao-<comp>-<x>, <default>);` or, in tokens, `--kakao-<x>: <value>;`. `tools/construct-server.js` already enforces this line format.

Defaults seen across the blocks:
- **Units:** px, rem, em, ms, s and vh/vw/dvh.
- **Colours:** hex, `rgb()`/`rgba()` in both syntaxes, `transparent`, `currentColor`, and `color-mix(in srgb, …)` (24).
- **Easing:** `cubic-bezier` (33).
- **Shadows:** multi-layer shadows, some with a `color-mix` layer.
- **Fonts:** font shorthands (`0.95rem/1.4 var(--kakao-font-family, …)`).
- **Expressions:** a few `calc` / `clamp` / `min`, some of them referencing other `--_` aliases or other components' variables (`--kakao-header-bar-rendered-height`).

## Goals / Non-Goals

**Goals:**
- One file a code generator in any language can read without CSS knowledge.
- Exact parity with what the browser computes for the same theme.

**Non-Goals:**
- Exporting component structure, behaviour or layout rules; those are hand-ported.
- Any Flutter code, the generator in the Flutter repo, or its CI.
- Changing any token, theme or setting value.

## Decisions

**1. A small value parser in the tool, no CSS library.**
A recursive-descent tokenizer for the subset the blocks actually use: numbers with units, colours, `var()`, `color-mix()`, `cubic-bezier()`, `calc`/`clamp`/`min`/`max` and comma or space lists. Any other function is an error.
- *Why:* the repo keeps no package.json for tools, and the subset is small and fixed.
- *Alternative considered:* postcss-value-parser. It would need a dependency, and it still leaves resolution to us.

**2. Output shape: a tree of typed nodes plus a resolved table.**
Each setting holds:
- `name`, which is the public `--kakao-<comp>-<x>`;
- `alias` (`--_x`);
- `value`, a typed node such as `{ "type": "ref", "token": "color-primary", "fallback": {…} }` or `{ "type": "length", "px": 15.2 }`;
- when the value depends on theme colours, `resolved`, keyed `"<theme>"` and `"<theme>/contrast"`.

Generators that want simple constants read `resolved`. Generators that want to keep the variable chain (so a token edit in the app re-themes widgets) walk `value`.
- *Alternative considered:* resolved-only. It is simpler, but it loses the "change the primary colour once" behaviour on the Flutter side.

**3. Units.**
- rem is 16 px. That is the browser default, and a Flutter logical pixel is the same as a CSS px.
- em stays `{ "type": "em", "factor": 0.9 }`, because it depends on the font size where it is used.
- Durations become ms.
- Viewport units and `100%` stay typed.

**4. Colour maths.**
- `color-mix(in srgb, A p%, B)` is computed as straight sRGB interpolation, including the alpha. That is the CSS Color 4 rule for `srgb`, which premultiplies alpha.
- Output is `#rrggbbaa`, rounded the way browsers round.
- *Check:* tests compare a sample against values read from Firefox via `getComputedStyle`, using fixtures recorded once by hand.

**5. Themes.**
- Light comes from `tokens.css`; every other theme comes from its `@theme` block, layered over light.
- Contrast mode layers the `prefers-contrast: more` block over that.
- The `@generated` copies are skipped, since they duplicate light and dark.
- `data-bs-theme` selectors are a web detail and are not exported.

**6. Cross-component references** such as `--kakao-header-bar-rendered-height` are kept as `ref` nodes with their fallback. They are not resolved, because their value is set at runtime by another component.

**7. Committed file, kept current like the themes' generated blocks.**
- `tokens.json` is committed and pretty-printed, with keys sorted, so reviews show real diffs.
- `--check` mirrors `check-themes.js`.
- The pre-commit hook runs the exporter and stages the file, following the same unstaged-edits guard as the component count.
- The Flutter repo pins a tag and fetches `tokens.json` at that tag, so no release-asset workflow is needed.
- *Alternative considered:* generate only in CI on tags. That hides diffs from review, and a forgotten tag would leave Flutter stale.

**8. Versioning.**
- The file carries `formatVersion` (starting at 1) and `version`, taken from the hero fact on `index.html`.
- A breaking change to the JSON shape bumps `formatVersion`.

## Risks / Trade-offs

- **The parser misreads a rare syntax.** → Unknown syntax is a hard error, never a guess. Tests cover every value form found in the current blocks.
- **Rounding differs from the browser by one step.** → The browser fixtures in the tests catch it.
- **Hook friction:** every token or settings edit now also changes `tokens.json`. → The hook stages it automatically, and the deploy `--check` is the safety net when hooks aren't enabled.
- **Expressions (`calc`, `clamp`) still need hand mapping in Flutter.** → They are few (about 6) and are typed, so the generator can map each kind once.
