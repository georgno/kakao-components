# Proposal

## Why

The overview still lists Progress as missing, with a native `<progress>` as placeholder. Pages need a progress bar that follows the theme and the motion language of the switches (tactile, springy), and that can show multi-step work (upload steps, onboarding) as segments rather than one long bar.

## What Changes

- New component `<kakao-progress>` (`components/progress/`), shadow DOM: a segmented progress bar.
- `value` and `max` as on native `<progress>` (max defaults to 1, value is clamped to 0…max); without a valid `value` the bar is indeterminate and shows a sweeping highlight.
- `segments` (default 4, `1` = a plain continuous bar): the value fills the segments in order, the segment the value lands in fills partially.
- Completion pop: when the fill reaches the end of a segment, that segment plays a short squash-and-stretch jump (keyframes on the standard easing, as the style guide asks for size changes); a jump past several segments pops each of them in order, staggered. A completed segment pops once per fill and only pops again after it has emptied. The fill animates smoothly between values. Under reduced motion: no pop, no fill animation, a still indeterminate state.
- Event `progress-segment-complete` `{ index, segments, value }` for each completion, also emitted as a trigger.
- Accessibility: `role="progressbar"` with `aria-valuemin/max/now` (no `aria-valuenow` while indeterminate), `aria-valuetext` from `value-text`; the accessible name comes from `label` (also shown above the bar) or the page's `aria-label`. `show-value` shows the percentage (or `value-text`) in tabular figures.
- `size` sm / md (default) / lg and `tone` primary (default) / success / warning / danger.
- Settings block (`--kakao-progress-*`), construction page, demo page with step buttons; listed on `components.html` (replacing the Progress placeholder; Meter stays a placeholder), in the style guide audit, and on `kitchen-sink.html`.

## Capabilities

### New Capabilities
- `progress`: the progress bar: value and max, indeterminate state, segments and partial fill, the completion pop and its once-per-fill rule, fill animation, reduced motion, accessibility, visible label and value, sizes, tones and theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/progress/{progress.js,demo.html,construction.html}`. No dependencies.
- Pages: `components.html`, `styleguide.html` (audit row), `kitchen-sink.html`.
- `CHANGELOG.md` (Unreleased). No new top-level file, so `.github/workflows/pages.yml` is unchanged; no new token.
