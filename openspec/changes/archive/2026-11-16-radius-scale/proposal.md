# Proposal

## Why

The style guide's radius scale (xs 4, sm 6, md 10, lg 14, pill 999px) was only proposed, and every component hard-codes its corner radii. The scale is now decided; corners that are on the scale should follow one main variable per step, so the shape of the whole library changes in one place.

## What Changes

- `shared/tokens.css`: new main variables `--kakao-radius-xs` (4px), `--kakao-radius-sm` (6px), `--kakao-radius-md` (10px), `--kakao-radius-lg` (14px), `--kakao-radius-pill` (999px), in the tokens' settings block; listed in the `tokens.html` manifest (group Shape). `--kakao-radius` (8px) stays as it is.
- Component settings blocks: every radius default whose literal equals a scale step refers to that step's token with the same literal fallback (`var(--kakao-radius-sm, 6px)`). No value changes, so nothing changes visually. Exception: the popover's 4px stays literal, because the style guide names it an outlier to be fixed, not an xs corner.
- `styleguide.html`: the radius scale is a decided rule (badge Rule), its note says live components follow the tokens; the "Proposed tokens" section lists the radius tokens as built.
- Changelog.

## Capabilities

### Modified Capabilities
- `design-tokens`: adds the radius scale tokens.

## Impact

Settings blocks of about 48 components (defaults only), `shared/tokens.css`, `tokens.html`, `styleguide.html`, `CHANGELOG.md`.
