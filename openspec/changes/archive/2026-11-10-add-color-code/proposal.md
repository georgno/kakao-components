# Proposal

## Why

The style guide writes colour values as plain `<code>#18181b</code>`: the reader has to imagine the colour, and nothing shows when a value is not a colour at all. A small label that shows the value and paints it next to the text makes palette tables, role notes and contrast pairs readable at a glance.

## What Changes

- New component `<kakao-color-code>` (`components/color-code/`), shadow DOM: a badge-like label (same height, pill radius, padding and font size as `<kakao-badge>`, neutral subtle fill, monospace text) with a small rounded swatch before the text, painted in the colour.
- The text content is the colour and the label; an optional `value` attribute names a different colour to paint (`<kakao-color-code value="var(--kakao-color-ink)">ink</kakao-color-code>`). Text and attribute changes re-render.
- Every CSS colour syntax is accepted (hex 3/4/6/8, rgb/rgba, hsl/hsla, hwb, lab, lch, oklab, oklch, color(), color-mix(), named colours, `transparent`, `currentColor`, `var(--…)`); anything else shows an empty dashed swatch with a slash and the `invalid` state.
- The swatch has a 1px inset ring so it stays visible when the colour equals the background, and sits on a checkerboard so transparency reads. Forced colours keep the swatch painted.
- Settings block (`--kakao-color-code-*`), construction page, demo page; a Color code section on `components.html`, a style guide audit row, a use on `kitchen-sink.html`; `CHANGELOG.md`.
- Out of this change: the style guide then uses it for its colour values, as a page edit of its own.

## Capabilities

### New Capabilities
- `color-code`: the colour label: value and label, accepted syntaxes, invalid state, swatch visibility (ring, checkerboard, forced colours), accessibility and theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/color-code/{color-code.js,demo.html,construction.html}`. No dependencies, no new token.
- Pages: `components.html`, `styleguide.html` (audit row), `kitchen-sink.html`.
- `CHANGELOG.md` (Unreleased). `components/` is copied wholesale by `.github/workflows/pages.yml`, so it is unchanged.
