## Decisions

- **The group decides, by position.** The group's shadow CSS sets `--_kakao-setting-radius-top: 0px` on `::slotted(:not(:first-child))` and `--_kakao-setting-radius-bottom: 0px` on `::slotted(:not(:last-child))`; the row uses them for its logical corner radii, falling back to `--_row-radius`. This is the same mechanism (and the same first-child rule) as the hairline above every row but the first, so corners and hairlines always agree.
- Applies to both looks; in the plain look the first and last rows keep their outer corners for the bleeding hover wash.

## Risks / Trade-offs

- [A `hidden` first or last row still counts as first or last] → same as the hairlines today; groups don't hide edge rows in practice.
