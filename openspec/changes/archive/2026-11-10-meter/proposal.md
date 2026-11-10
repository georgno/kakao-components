# Proposal

## Why

The overview still lists Meter as missing, with three native `<meter>` elements as placeholder. Native meters look different in every browser and ignore the theme. Pages need a simple gauge (storage used, password strength, battery) that follows the theme and reads as a sibling of `<kakao-progress>`.

## What Changes

- New component `<kakao-meter>` (`components/meter/`), shadow DOM: one continuous bar, the same track and fill look, sizes and label row as progress. No segments, no pop, no indeterminate state.
- `value`, `min` (default 0), `max` (default 1), `low`, `high`, `optimum` with the native `<meter>` semantics: values are clamped the native way, and the fill colour shows whether the value is in the optimum region (success colour), a suboptimal region (warning) or the even-less-good region (danger).
- A value change slides the fill length over `--kakao-motion-duration` with standard easing (the colour switches at once); at once under reduced motion.
- Accessibility: `role="meter"` on the host with `aria-valuenow/min/max`, `value-text` as `aria-valuetext`; the name comes from `label` (shown above the bar) or the page's `aria-label`. `show-value` shows the percentage of the range (or `value-text`) in tabular figures.
- `size` sm / md (default) / lg.
- Settings block (`--kakao-meter-*`), construction page, demo page with the three storage examples; a real Meter section on `components.html` replacing the placeholder, a style guide audit row, and a use on `kitchen-sink.html` if one fits.

## Capabilities

### New Capabilities
- `meter`: the gauge: value range and native clamping, regions and their colours, fill motion, reduced motion, accessibility, visible label and value, sizes and theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/meter/{meter.js,demo.html,construction.html}`. No dependencies, no new token.
- Pages: `components.html`, `styleguide.html` (audit row), possibly `kitchen-sink.html`.
- `CHANGELOG.md` (Unreleased). No new top-level file, so `.github/workflows/pages.yml` is unchanged.
