## Why

Small labels are drawn by hand in several places with different looks: the
styleguide's status tags (54, with hard-coded greens and indigos that ignore the
theme), the "Missing" labels on the overview, the "Draft" label, and the token
chips on the construction pages. Two components make them consistent, themeable
and reusable in real products.

## What Changes

- New `<kakao-badge>`: a pill-shaped status label (radius pill) with tones
  neutral, primary, success, danger and ink, plus an `outline` style.
- New `<kakao-chip>`: a compact label (radius xs) with tones, an optional colour
  swatch, an `icon` and a `meta` slot. It can be a link (`href`) and/or
  removable (`removable`, cancelable `chip-remove` event, focus moves on).
- New colour role `success` in `shared/tokens.css`, every theme, and the
  contrast checker.
- Replace the hand-made labels: styleguide `.tag` and `.badge`, overview
  "Missing" labels, the radius examples, and the construction pages' token
  chips (which become removable chips whose × detaches the token).
- Both components get demo, construction page, overview card, styleguide audit
  line, and a natural place in the kitchen sink.

## Capabilities

### New Capabilities
- `badge`: the `<kakao-badge>` status label.
- `chip`: the `<kakao-chip>` compact label, link and removable chip.
- `chip-list`: the `<kakao-chip-list>` wrapping row that animates chips into place.

### Modified Capabilities
- `design-tokens`: colour roles gain `success`.

## Impact

New `components/badge/`, `components/chip/`. Changes to `shared/tokens.css`,
`shared/themes.css`, `tools/check-themes.js`, `shared/construction.js` and
`.css`, `styleguide.html`, `components.html`, `kitchen-sink.html`,
`shared/demo.css`. The file-upload extension tag and the slider unit label stay
internal to those components (components never embed each other).
