# Design

## Decisions

- **A real `<img>` in the shadow root**, there from the start with the alt text, `decoding="async"` and the native `loading` attribute. Lazy loading is the browser's; no IntersectionObserver.
- **Skeleton by composition.** The shadow root holds a `<kakao-skeleton shape="block" radius="0" height="100%">`, placed over the frame and stretched through its public parts (`skeleton`, `bone`). The component does not check whether the skeleton is defined: an undefined `kakao-skeleton` is styled as a plain block (`:not(:defined)`), and upgrades by itself if the script arrives later. The frame clips both to the image radius.
- **Sizes as in the skeleton**: `width`, `height`, `radius` take a number (pixels) or a CSS length, `ratio` an aspect ratio; invalid values are ignored. Two plain numbers for width and height become width plus aspect ratio, so the image scales down with its place like an `<img>` with `height: auto`. The width sits on the figure, so the caption wraps at the image's width.
- **Without height and ratio** the loading frame has the placeholder height from the settings and the loaded image is in the flow at its own size. This shifts the layout; the docs say to give a size.
- **No `src` means still loading.** The skeleton stays, so a page can set `src` later. This is also how the demo shows a slow load.
- **Fade**: image opacity 0 to 1 and the placeholder 1 to 0 over `--kakao-image-fade-duration`; the placeholder is then taken out (display none) so its shimmer stops. Reduced motion: no transition, placeholder out at once.
- **Error state**: the `<img>` is taken out, the frame shows a broken-image glyph (inline SVG, currentColor, aria-hidden) and the alt text on the subtle fill in the muted colour; a decorative image shows the glyph only and the box is aria-hidden. A new `src` or `reload()` starts over.
- **Figure only with a caption**: without one the `<figure>` gets `role="none"`.
- **Radius 10px** (md), the same as the skeleton block.

## Out of scope

- Lightbox or zoom, `<picture>` art direction, blur-up previews, a retry button in the error state.
- Choosing the skeleton's animation per image (the `--kakao-skeleton-*` settings apply).
