# Design

## Context

See proposal.md - Why. Shadow DOM component like progress: one inlineable file, styles in the shadow root, defaults in its settings block. Style guide motion rule: standard easing for size and fill changes (spring only for moves into place along a line); durations from the scale via tokens, here `--kakao-motion-duration` (320ms).

## Goals / Non-Goals

**Goals:** a gauge that looks like a one-segment `<kakao-progress>` (same track, radius, heights, label row and setting names), with native `<meter>` value and region rules and correct meter semantics.

**Non-Goals:** segments, pops, an indeterminate state, a `tone` override (the colour comes from the regions), events, form participation, vertical or circular gauges.

## Decisions

- **Custom bar with `role="meter"`, not a wrapped native `<meter>`.** Styling a native meter needs `::-webkit-meter-bar` / `-optimum-value` / `-suboptimum-value` / `-even-less-good-value` in Chromium and Safari and `::-moz-meter-bar` plus `:-moz-meter-*` in Firefox; the track radius, height and fill colour are handled differently by each engine, and the fill cannot be transitioned in a shared way. A shadow DOM bar looks the same everywhere and matches progress exactly. `role="meter"` (ARIA 1.2) is exposed as a meter by Chromium, Firefox and Safari; the host carries `aria-valuemin/max/now` and `aria-valuetext`, as progress does with `progressbar`. Alternative considered: a visually hidden native `<meter>` for semantics next to a drawn bar; rejected, since the name would have to be bridged across the shadow boundary and the host role is simpler.
- **Native value algorithm** in one `_state()` function: parse each attribute as a finite number or fall back, then clamp in the native order (max ≥ min, value, low, high ≥ low, optimum). Region as in the HTML spec and Chromium: low < optimum < high → inside low…high optimum, else suboptimal; optimum ≤ low → ≤ low optimum, ≤ high suboptimal, else bad; otherwise ≥ high optimum, ≥ low suboptimal, else bad.
- **Rendering.** A single track (pill, `subtle-strong`) with a fill moved by `translateX((p − 1) × 100%)`, as in progress, so the rounded leading edge is kept and nothing re-lays out. The region is written as `data-region` on the bar, which picks `--_success / --_warning / --_danger`.
- **Motion in CSS.** One CSS transition on `transform` only, on `--kakao-meter-fill-duration` (default `--kakao-motion-duration`) and `--kakao-meter-fill-ease` (default the standard token): the fill is a size change. The colour switches at once: a background-color transition interpolates in sRGB, so green to red would pass through brown. No JS animation is needed because nothing has to fire mid-fill. The transition is enabled only after the first render (a `ready` class set one frame later), so the page doesn't animate on load. `@media (prefers-reduced-motion: reduce)` removes it.
- **Label row and sizes** are copied from progress (same markup, parts and setting names): heights 4 / 8 / 12px, label font sizes from the type scale, value in tabular figures, percentage through `Intl.NumberFormat`.

## Risks / Trade-offs

- [Colour-only meaning] → the region is not announced; native `<meter>` doesn't announce it either. Pages put the meaning in `value-text` ("92 GB of 100 GB, almost full") when it matters.
- [Warning fill on the track] → warning is a fill next to the track, not text; checked in each theme during verification.
