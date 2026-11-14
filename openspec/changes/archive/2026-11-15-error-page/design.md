# Design

## Context

See proposal.md for the motivation and specs/error-page/spec.md for the behaviour. Sibling components name a title text attribute `heading` with `heading-level` (alert, error-summary), use the default slot for the main text, `list-data` for JSON (breadcrumb takes `[label, url]` pairs), and draw their own glyphs inline. There is no type scale in `shared/tokens.css`, only `--kakao-font-size`; colours come from the theme roles (`--kakao-color-primary`, `-text`, `-muted`, `-bg`, `-line`). The header bar publishes `--kakao-header-bar-rendered-height` on the root.

## Goals / Non-Goals

**Goals:** one inlineable shadow-DOM file; the page writes plain attributes (easy to fill from a Yii2 error action); a strong, recognisable look from the code alone; correct heading semantics; readable in all seven themes and at phone width.

**Non-Goals:** fetching or logging errors; a copy button for the reference; translated default texts (pages set `heading` in their language); animation.

## Decisions

**Attributes for the facts, slots for the rest.** `code`, `heading`, `message`, `reference`, `time` are short text a server already has, so they are attributes (no markup to escape in a template). The default slot replaces `message` when the text needs links; `actions` and `details` are slots because they are markup. Further rows (path, status text, support contact) go in `list-data` as `[label, value]` pairs, the breadcrumb's pair format, so no new attribute is needed per fact.

**Default headings for known codes.** 400, 401, 403, 404, 405, 408, 410, 429, 500, 502, 503 and 504 map to short English headings; anything else falls back to "Something went wrong". A page in another language sets `heading`.

**The code belongs to the heading.** The heading element (`h1` by default, `heading-level` 1–6) holds the big code and the title as two blocks, with a visually hidden "Error " prefix and ": " separator, so heading navigation reads "Error 404: Page not found". Alternative considered: the code as a paragraph before the heading — a screen reader user jumping to the heading would miss it.

**Pattern from rows of text, not an SVG `<pattern>`.** An SVG pattern's tile size and transform are attributes, which CSS custom properties cannot drive, so the construction page could not change angle or size live and a theme font change would misalign the tile. Instead the background is a layer of text rows (`code` repeated with `word-spacing`), rotated by `--kakao-error-page-pattern-angle`, every other row shifted by half a cell for a staggered look. Colour, opacity, size, weight, spacing and angle are pure CSS. Script only decides how many rows and repeats cover the box: a hidden measure line in the same font gives the cell width and line height, the box diagonal gives the side of the rotated square, and a ResizeObserver on the host and the measure line recounts when the box, the font size or the spacing changes. The layer is `aria-hidden`, not selectable, ignores the pointer, and is clipped by the host.

**Contrast.** The pattern is the primary colour at 7 % opacity by default. Muted text over the strongest spot of the pattern stays above 4.5:1 in every theme (checked in the browser on the demo); the opacity setting's construction range stops at 0.3 and the docs say to keep it low. Forced colours and print drop the pattern.

**Embedded and full.** Embedded (default) is a box: surface fill, 1px line border, 10px radius (the md step, so it nests in a card), `--kakao-error-page-min-height` (20rem). `full` drops the frame, uses `--kakao-error-page-full-surface` (transparent, so the page background shows) and a minimum height of `--kakao-error-page-full-height`, by default `100dvh` minus the header bar's rendered height. Content is a centred column, `--kakao-error-page-max-width` wide; details align to the start.

**Sizes.** Code size `clamp(4.5rem, 20vw, 9rem)` so it shrinks on a phone without a media query; weight 700 (the "rare" weight, here for display); `letter-spacing: -0.02em`, `line-height: 1`, `font-variant-numeric: tabular-nums`. Heading 1.5rem / 600. Padding `clamp(1.5rem, 6vw, 3rem)`.

**Time.** A value that starts like an ISO date (`YYYY-MM-DD`) and parses is shown with `Intl.DateTimeFormat` in the nearest `lang` (date and short time, or date only), in a `<time datetime>`; anything else is shown as written.

## Risks / Trade-offs

- [Many text nodes on a huge screen] → one text node per row, rows and repeats capped at 200 each; a 4K viewport needs a few dozen rows.
- [Default headings are English] → documented; `heading` overrides.
- [A long `code` (a word) makes a wide pattern cell] → works, just a sparser pattern; the code size can be lowered through the setting.

## Open Questions

- Whether a tone per code family (4xx warning, 5xx danger) is wanted; for now everything uses the primary colour.
