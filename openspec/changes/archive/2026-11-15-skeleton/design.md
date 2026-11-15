# Design

## Decisions

- **One element, a `shape` attribute.** Text, circle and block are the plain shapes; row and card are presets built from the same shapes inside the shadow root. Anything else is composed on the page from plain shapes.
- **Sizes are attributes, not only settings.** `width`, `height`, `ratio` and `radius` take a bare number as pixels or any CSS length, checked with `CSS.supports`; a value CSS does not take is ignored. They are written as private properties on the inner box, so the settings block stays the one place for defaults. This is what `kakao-image` will use: `shape="block"` with a ratio or a width and height, and `radius` to match its own corner.
- **Text lines in em.** A line is 0.8em thick with a 0.65em gap, and a text skeleton has half a gap above and below, so n lines take about the room of n lines of text at the surrounding font size.
- **Radii from the scale.** Block 10px (md), line 4px (xs), card frame 14px (lg, as `kakao-card`). Inside the card preset the media block takes card radius minus card padding, never less than the line radius (nesting rule); with the default padding of 1.25rem that is 4px.
- **Theme roles.** Shapes on the strong subtle fill, the shimmer band on the subtle fill, the card frame on the surface with a hairline, like `kakao-card`.
- **Shimmer by background position**, one gradient per shape, all with the same duration so they move together. `pulse` fades the shapes; `none` and reduced motion are static. Right-to-left pages run the band the other way.
- **Silent by default.** The inner box is `aria-hidden`; nothing is focusable. A status element (`role="status"`) in the shadow root is empty unless `label` is set. The demo recommends `aria-busy` on the loading region and a label on at most one skeleton.
- **Forced colours**: fills are dropped there, so the shapes are drawn in `GrayText`, static.

## Out of scope

- A delay before showing (as the spinner has) and a fade to the loaded content.
- Wrapping real content and switching by a `loading` attribute.
- More presets (table, form). They are composed from the plain shapes.
