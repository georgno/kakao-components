## Why

After a theme switch, the scrolled header bar loses its backdrop blur: content
under it is no longer frosted. Likely cause (not yet confirmed in a browser):
the theme switch's ripple runs as a view transition
(`components/theme-switch/theme-switch.js`), and the bar's `backdrop-filter`
does not survive it.

## What Changes

- Either the blur works again after (and during) a theme switch, or the bar
  falls back gracefully to its solid background, the same fallback it already
  uses without `backdrop-filter` support or under reduced transparency.
- The styleguide's component audit lists this as the header bar's open to-do
  until it is done.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `header-bar`: the scrolled look survives a theme switch.
- `theme-switch`: announces an animated switch with `theme-transition-start` / `theme-transition-end` triggers.

## Impact

`components/header-bar/header-bar.js`, possibly `components/theme-switch/theme-switch.js`,
`styleguide.html` (audit row), `CHANGELOG.md`.
