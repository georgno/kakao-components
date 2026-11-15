# Proposal

## Why

Pages that load a list, a card or an image have nothing to hold the layout until the content arrives: the page jumps when it does. The components page lists Skeleton as missing, and the planned `kakao-image` needs it first (it shows a skeleton of the image's size while the image loads).

## What Changes

- New component `<kakao-skeleton>` (`components/skeleton/`), shadow DOM, not interactive.
  - `shape`: `text` (default; `lines`, the last one shorter), `circle`, `block`, and the presets `row` (`avatar`, `count`, `lines`) and `card` (`media`, `avatar`, `lines`).
  - Plain sizing from attributes: `width`, `height`, `ratio`, `radius` (a number is pixels, otherwise a CSS length), so a block of a known size or ratio is one line of markup.
  - `animation`: `shimmer` (default), `pulse` or `none`; under reduced motion the shapes stand still.
  - Decorative: the shapes are `aria-hidden` and never focusable. An optional `label` makes one skeleton a status; the demo shows `aria-busy` on the loading region.
  - The card preset follows the nesting rule: its media block takes the card radius minus the card padding.
- Settings block (`--kakao-skeleton-*`), construction page, demo page; a card on `components.html` (alphabetical, before Slider) replacing the "Skeleton" placeholder; the Image placeholder no longer says Skeleton comes first; style guide audit row; changelog entry.

## Capabilities

### New Capabilities
- `skeleton`: shapes, sizing, presets, animation and reduced motion, accessibility, theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/skeleton/{skeleton.js,demo.html,construction.html}`. No dependency on other components.
- Pages: `components.html`, `styleguide.html`. Not on `kitchen-sink.html`: the form there loads nothing.
- `CHANGELOG.md` (Unreleased: Added). No new token, no theme change.
