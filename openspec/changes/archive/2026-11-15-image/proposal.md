# Proposal

## Why

An image that arrives late pushes the content below it down, and until then the page shows nothing in its place. The components page lists Image as missing; `kakao-skeleton`, which it builds on, exists now.

## What Changes

- New component `<kakao-image>` (`components/image/`), shadow DOM, not interactive.
  - `src`, `srcset`, `sizes` and `loading` (lazy by default, `eager`) go to a real `<img>` in the shadow root.
  - `alt` is the text alternative; `alt=""` (or none) marks a decorative image.
  - `caption`, or content in `slot="caption"`: the whole is then a figure with a figcaption.
  - `width`, `height` and `ratio` reserve the space (a number is pixels, otherwise a CSS length; two numbers give the ratio as on `<img>`), `fit` is cover or contain, `radius` sets the corner.
  - While loading the frame shows a `<kakao-skeleton shape="block">` that fills it; where `kakao-skeleton` is not defined, a plain block. The picture fades in over it; no fade under reduced motion.
  - When the file fails the frame keeps its size and shows a muted icon with the alt text.
  - Events `image-load` and `image-error`, method `reload()`, read-only `state`.
- Settings block (`--kakao-image-*`), construction page, demo page (incl. a slow load so the skeleton is seen); a card on `components.html` (alphabetical, before Kbd) replacing the "Image" placeholder; style guide audit row; changelog entry; three small demo images in `shared/demo-images/`.

## Capabilities

### New Capabilities
- `image`: sources and lazy loading, alt text, caption, reserved size, fit and radius, skeleton placeholder and fade, error state, events, theming hooks.

### Modified Capabilities
- `component-overview`: the prerequisite scenario no longer names Image (it is built).

## Impact

- New: `components/image/{image.js,demo.html,construction.html}`, `shared/demo-images/{landscape-1,landscape-2,tall-1}.svg`. Uses `kakao-skeleton` by composition when it is loaded; works without it.
- Pages: `components.html`, `styleguide.html`. Not on `kitchen-sink.html`: the settings form there has no picture.
- `CHANGELOG.md` (Unreleased: Added). No new token, no theme change.
