# Design

## Context

See proposal.md for the motivation and specs/empty-state/spec.md for the behaviour. The closest sibling is `kakao-error-page` (heading with a level, `message` with a default-slot override, `actions` slot, centred column); the alert supplies the icon convention (`slot="icon"` replaces a built-in inline SVG, `no-icon` removes it). Sizes elsewhere are `size="sm"` / `md` / `lg` (button, spinner, kbd). Colours come from the theme roles; `--kakao-color-subtle` is the quiet fill, `--kakao-color-muted` the caption colour (AA on every theme's surfaces, checked by `tools/check-themes.js`).

## Goals / Non-Goals

**Goals:** one inlineable shadow-DOM file; plain attributes a server template can fill; quiet enough to sit inside a card, list or table area without competing with the page; correct heading semantics; readable in all seven themes and at phone width.

**Non-Goals:** a frame or surface of its own (the container has one); illustrations or a glyph library (the page slots its own icon); a background pattern; animation; announcing itself (a page that empties a list while the user watches puts the block in its own live region); translated texts.

## Decisions

**Names follow the siblings.** `heading`, `heading-level`, `message`, default slot replaces `message`, `slot="actions"` as on the error page; `slot="icon"` and `no-icon` as on the alert. No `icon` attribute: the style guide keeps that name for icon-font classes, and a slot already takes any icon.

**Heading level 3 by default.** The error page defaults to `h1` because it is the page. An empty state is content of a section or card, which normally has an `h2` above it, so `h3` is the level that is right most often; `heading-level` (1 to 6) corrects the rest, other values fall back to 3. Without `heading` no heading element is rendered (a one-line "No results" in a table needs only the message).

**Size is `size="sm"`, not a `compact` flag.** The library's size vocabulary is `sm` / `md` / `lg`; `compact` already means something else on the colour picker (swatch only). Two steps are enough: `md` (default) and `sm`. Each size value has its own setting (`-icon-size` / `-sm-icon-size`, …), the pattern of the spinner.

**The icon is a glyph on a soft round fill.** Glyph in the muted colour, 1.5rem, in a 3rem circle of the subtle fill (`sm`: 1.125rem in 2.25rem). The fill gives the block a visual anchor without a border or a strong colour. A slotted icon is sized to the glyph size and takes the same colour; a page with a larger illustration sets `--kakao-empty-state-icon-size` and makes `--kakao-empty-state-icon-surface` transparent. The default glyph is an inbox tray, 24px grid, 1.5 stroke, round caps, `aria-hidden`: the icon is decoration, the heading and message carry the meaning.

**Text.** Heading in the text colour, 1.0625rem / 600 (the weight of card and alert titles); message in the muted colour at the body size, at most `--kakao-empty-state-max-width` (24rem) wide so lines stay short when the container is wide. `sm`: heading at 0.95rem, message at 0.875rem.

**Layout.** A centred grid column with vertical and horizontal padding as settings (2rem / 1rem; `sm` 1rem / 0.75rem). No minimum height: a container that wants the block centred in a tall area makes the host a grid/flex child and centres it. Actions are a wrapping centred flex row with a little extra space above. Empty parts (no icon, no heading, no message, no actions) take no space.

**Forced colours.** The round fill disappears there; the glyph switches to `CanvasText`.

## Risks / Trade-offs

- [One built-in glyph cannot fit every case] → the slot takes any icon; the demo shows a search and a folder glyph to copy.
- [Appears without announcement when a list empties dynamically] → documented; the page owns the live region, because a `role="status"` on content that is already there at load is not announced anyway.

## Open Questions

- Whether a few named built-in glyphs (search, folder, filter) are wanted later; that would need an attribute name other than `icon`.
