# Proposal

## Why

The radius scale (xs 4, sm 6, md 10, lg 14, pill 999px) is decided, but corners outside it remain: the old `--kakao-radius` (8px) main variable, the popover's 4px literal (kept as an "outlier"), size-linked button radii (11/13/15px) and a spread of 1, 2, 3, 5, 7, 8, 9, 12px literals. Every corner should sit on a step and follow its token, so the shape of the library changes in one place.

## What Changes

- **BREAKING** `--kakao-radius` (8px) is retired: removed from `shared/tokens.css` and the `tokens.html` manifest. Its users (aside menu, number input) move to `--kakao-radius-md` (10px). A page that still sets `--kakao-radius` breaks nothing; the value is simply ignored.
- The popover's 4px corner is no longer an exception: `var(--kakao-radius-xs, 4px)`.
- Every remaining off-scale corner literal in `components/` and `shared/` moves to the nearest step and refers to its token. Ties round up (5 → 6, 8 → 10, 12 → 14), because corners get rounder as things get bigger; hairline corners (1–3px) take xs. Size-linked button radii (button, copy button, pagination: 11/13/15) become md/lg/lg. Values change visibly; that is intended.
- On-scale literals that are not yet settings (internal corners) refer to their token too.
- Left alone: circles (`50%`), percentage squircles, radii computed from size or by the nesting rule (`calc`, `inherit`), and `0`.
- `styleguide.html`: the Shape section no longer names outliers; the audit's radius column matches the code; a new Component rule "Button titles show as tooltips" (behaviour of the button, which markup cannot break, so no style-check rule module).
- `tools/construct-server.js` comment example, `CHANGELOG.md`.

## Capabilities

### Modified Capabilities
- `design-tokens`: `--kakao-radius` retired; every corner on the scale.

## Impact

Component sources (settings defaults and internal corners) of about 20 components, `shared/*.css`, `shared/settings-dialog.js`, `shared/tokens.css`, `tokens.html`, `styleguide.html`, `CHANGELOG.md`.
