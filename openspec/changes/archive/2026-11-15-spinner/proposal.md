# Proposal

## Why

A loading ring exists only inside `kakao-button`. Pages that load a panel, a list row or a search result have nothing to show, and the components page still lists Spinner as missing. A bare `<progress>` without a value looks different in every browser and cannot be themed.

## What Changes

- New component `<kakao-spinner>` (`components/spinner/`), shadow DOM, inline, not interactive.
  - Draws the button's ring: same geometry (radius 9 in a 24 box, stroke 3, round caps), same turn (0.85s linear), same reduced-motion pulse.
  - `size` sm, md (default, the button's 18px) and lg.
  - Colour: the surrounding text colour (`currentColor`) by default; `tone` (primary, success, warning, danger, muted) takes a theme role.
  - `label` is the status text for assistive technology (default "Loading"); `show-label` also shows it beside the ring, `stacked` under it.
  - `delay` (milliseconds) keeps the spinner invisible and silent at first while it keeps its space; the wait starts on connect and each time `hidden` is removed. Read-only `shown` property.
  - Reduced motion: the ring does not turn, it fades in and out in place.
- `kakao-button`: its ring was drawn closed (`stroke-dasharray: 56` on a 56.55 circumference), so the turning could not be seen. One CSS value makes it the same arc as the spinner. No API change.
- Settings block (`--kakao-spinner-*`), construction page, demo page; a card on `components.html` (alphabetical, between Slider and Step switch) replacing the "Spinner" placeholder; style guide audit row; changelog entries.

## Capabilities

### New Capabilities
- `spinner`: ring, sizes, colour and tones, label and status semantics, delay, reduced motion, theming hooks.

### Modified Capabilities

None. The button's requirements do not describe the ring's shape.

## Impact

- New: `components/spinner/{spinner.js,demo.html,construction.html}`. No dependency on other components; the ring is drawn again in the spinner, not shared with the button.
- Changed: `components/button/button.css` (one value).
- Pages: `components.html`, `styleguide.html`. Not on `kitchen-sink.html`: the form there loads nothing on its own; its buttons already show the ring.
- `CHANGELOG.md` (Unreleased: Added, Fixed). No new token, no theme change.
