# Design

## Context

Shadow DOM component like alert and badge: one inlineable file, styles in the shadow root, defaults in its settings block. The motion rule in the style guide: spring easing for things moving into place along a line (and a squash and stretch that belongs to that move); standard easing for everything else, including size changes such as the pop; durations from the motion token; everything stops under reduced motion.

## Goals / Non-Goals

**Goals:** a segmented bar whose segment completions feel tactile, with predictable pop rules and correct progressbar semantics.

**Non-Goals:** meter semantics (low/high/optimum ranges; that is the Meter component, next), circular progress, buffer values, form participation (a progress is not a form value).

## Decisions

- **Rendering.** A flex row of `n` segment elements (track colour, pill radius), each with an inner fill bar moved by `translateX((f − 1) × 100%)` (`f` = 0…1 per segment, set as a custom property), so the leading edge stays rounded and nothing re-lays out while animating. Over 100 segments is clamped (layout and pops would be meaningless).
- **Fill animation in JS.** A requestAnimationFrame loop animates a shown value from where it is now to the target with the fill easing (a small cubic-bezier solver reads `--kakao-progress-fill-ease`; anything that is not `cubic-bezier(...)` falls back to the standard curve). A new value mid-flight starts from the current shown value. JS rather than per-segment CSS transitions because pops must fire exactly when the moving fill crosses a segment end, in order, also when the value changes mid-animation. Duration: the fill duration (`--kakao-progress-fill-duration`, motion token 320ms), lengthened by half of it for each extra segment the change completes, capped at 2.5×, so a jump over several segments reads as a sequence rather than a flash.
- **Pop.** Web Animations on the segment: keyframes rest → vertical stretch (`scale(1, --pop-scale)`, lifted 1px, at 28%) → squash (`1 − 0.35 × (scale − 1)`, at 58%) → small rebound (`1 + 0.1 × (scale − 1)`, at 80%) → rest; no horizontal stretch, which would spill into the gaps and past the ends of a wide bar. Every leg uses `--kakao-progress-pop-ease`, which defaults to the standard token: the pop is a size change, so the style guide gives it standard easing, and the squash comes from the keyframes rather than a spring overshoot. Duration `--kakao-progress-pop-duration` 420ms. Pops go through a queue that keeps them at least `--kakao-progress-pop-stagger` (70ms) apart, so a fast fill still shows them as a ripple.
- **Pop rules.** Each segment has an "armed" flag. A segment pops when the shown value crosses its end upwards while armed; it is then disarmed. It is re-armed when the target value drops to or below its start (the segment emptied). Baseline points (first render, leaving indeterminate, `max` or `segments` changing, and every change under reduced motion) disarm exactly the segments that are complete and arm the rest, without popping. Going down never pops. Alternative considered: re-arm as soon as a segment is no longer full; rejected because a value jittering around a segment end (0.5 → 0.49 → 0.5) would pop repeatedly.
- **Indeterminate.** Each segment's fill is made as wide as the whole bar and offset by its position (`width: calc(n × 100% + (n − 1) × gap)`, `left: −i × (100% + gap)`), and holds a band 40% of the bar wide sliding across. All segments run the same CSS animation, so the band reads as one highlight passing through the gaps. Works unchanged for `segments="1"`. Easing standard, 1600ms (`--kakao-progress-sweep-duration`). Under reduced motion the band is replaced by a full fill at reduced opacity that slowly fades in and out.
- **Semantics on the host.** `role`, `aria-valuemin/max/now/valuetext` and `aria-label` are written on the host like alert writes its role; a role or aria-label the page wrote itself is kept. The visible label and value text are `aria-hidden` inside the shadow root, so they are not read twice.
- **Sizes.** Bar heights 4 / 8 / 12px (sm / md / lg), label text xs / sm / base from the type scale. Gap between segments 4px. Pill radius, as for tracks.
- **Tones.** primary (accent: "in progress" in the style guide's colour roles), success, warning, danger (`error` alias as in alert). Fill colours point at theme roles; the track is `subtle-strong`.

## Risks / Trade-offs

- [rAF does not run in a background tab] → the fill finishes when the tab is shown again; pops fire then. Acceptable.
- [Pop scales outside the bar's box] → the host has no overflow clipping and the label row sits above with a gap; the lg stretch (12px × 1.6) stays within the gap.
- [Warning fill next to the track] → warning is a UI fill, not under text; its contrast against the track is checked in the themes during verification.
