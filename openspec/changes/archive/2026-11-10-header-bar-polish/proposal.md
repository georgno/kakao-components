## Why

The new page bar (`<kakao-header-bar>`) shipped with a few loose ends: its side gutter (1rem) does not line up with page content on phones except on `index.html`, the page CSS hard-codes the bar's 4rem height in two places although the height is an editable setting, the phone navigation scrolls sideways with no visible cue, and the 8px gap below the bar is a bare number repeated per page.

## What Changes

- Bar side gutter default becomes 1.25rem (the page content gutter) on every page; `index.html` drops its phone-only override.
- A bar that is a direct child of `<body>` publishes its rendered height as `--kakao-header-bar-rendered-height` on the root element; `shared/demo.css` and `shared/construction.css` derive `--page-bar-height` from it (scroll padding, construction canvas offset), so there is one source of truth: the bar's height setting.
- The bar's navigation gets an edge fade (mask) on each side where there is more to scroll, none when nothing overflows; fade width is a new setting `--kakao-header-bar-nav-fade`.
- New shared token `--kakao-space-below-bar` (8px): the gap between the bar and the first line of content, used by `shared/demo.css`, `shared/construction.css` and `index.html`.
- `styleguide.html` gets the decided rule "Overflowing horizontal scrollers get an edge fade".
- CHANGELOG entry under Unreleased.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `header-bar`: adds the navigation overflow cue and the published rendered height.
- `design-tokens`: adds the main variable for the gap below the page bar.

## Impact

`components/header-bar/{header-bar.js,construction.html}`, `shared/tokens.css`, `tokens.html`, `shared/demo.css`, `shared/construction.css`, `index.html`, `styleguide.html`, `CHANGELOG.md`. No API removals.
