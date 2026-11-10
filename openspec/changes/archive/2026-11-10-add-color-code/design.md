# Design

## Context

See proposal.md - Why. Shadow DOM component like badge: one inlineable file, styles in the shadow root, defaults in its settings block. `<kakao-chip>` already has a `swatch` attribute (plain background, no ring or checkerboard); the colour code is a separate, read-only label for documentation.

## Goals / Non-Goals

**Goals:** a badge-sized monospace label with a swatch that shows any CSS colour, stays visible on any background, shows transparency and marks values that are not colours.

**Non-Goals:** copying the value, a colour picker, contrast ratios, converting between formats, tones or outline variants.

## Decisions

- **Markup.** `<span class="code" part="code"><span class="label" part="label"><slot></slot></span></span>`; the swatch is `.code::before`, so it is not in the accessibility tree and no extra node needs `aria-hidden`. The label span carries the text colour; `.code` does not set `color`, so `currentColor` in the swatch resolves to the colour of the text around the element.
- **Passing the colour in.** The value is validated with `CSS.supports('color', v)` and set with `style.setProperty('--_color', v)` on `.code`; never written into a stylesheet string. `var(--…)` passes `CSS.supports` and is resolved by the cascade, so theme variables follow the theme (an undefined variable leaves the swatch unpainted, as CSS does).
- **Painting.** `background: linear-gradient(var(--_color), var(--_color)), <checkerboard>`: an opaque colour covers the checkerboard, a transparent one lets it show; no alpha detection in JS. The ring is an inset `box-shadow` (1px, `color-mix` of the text colour at 24%), visible on any fill. `forced-color-adjust: none` on the swatch only.
- **Invalid.** `.code.invalid::before` drops the fill for a dashed muted border and a diagonal slash; the host gets the `invalid` custom state through `ElementInternals.states` when the browser has it (try/catch), plus a read-only `valid` property.
- **Updates.** `observedAttributes = ['value']` plus a `MutationObserver` on the host (characterData, childList, subtree).
- **Look.** Badge numbers (pill radius, 0.05rem / 0.5rem padding, 0.75rem text, line-height 1.45), monospace stack of the style guide's `<code>`, weight 500, fill `--kakao-color-subtle` (the `<code>` background), swatch 0.625rem with radius 2px (as the chip swatch).

## Risks / Trade-offs

- [Undefined var()] → cannot be detected without layout; the swatch shows only the ring and checkerboard, which reads as "transparent". Documented.
- [`:state()` support] → older browsers lack custom states; the visual invalid look does not depend on it.
