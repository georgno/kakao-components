# Design

## Context

See proposal.md for the motivation and specs/description-list/spec.md for the behaviour. Siblings: the error page takes its reference rows from `list-data` as pairs; the error summary is a two-part row that stacks below 22rem; sizes elsewhere are `size="sm"`; the empty state and error page have no frame of their own. The style guide's "Data tables on small screens" rule says a phone gets label/value blocks, not squeezed rows.

## Goals / Non-Goals

**Goals:** a real `<dl>` in the accessibility tree; plain attributes a server template can fill; rich values without copying or moving the page's nodes; a layout that follows the space the list has, not the viewport; readable in every theme and at phone width.

**Non-Goals:** a frame, heading or surface (the card around it has them); HTML inside `list-data`; editing in place; a copy button per row (slot a `kakao-copy-button` in a `<dd>`); translated texts; grouping headings inside one list (use two lists).

## Decisions

**Shadow DOM with manual slot assignment.** The shadow root holds the `<dl>`. Each pair is a `<div class="row">` in it (the grouping `div` HTML allows in a `dl`). Rows from `list-data` contain shadow `<dt>` / `<dd>` filled with `textContent`. Rows from children contain one `<slot>` to which that pair's `<dt>` and `<dd>` children are assigned (`slotAssignment: 'manual'`, `slot.assign()`), so the flattened tree is `dl > div > dt, dd`: valid list semantics, and the children stay where the page put them (listeners, focus order and page styles intact). Named slots would have needed `slot` attributes written onto the page's nodes; cloning would have lost listeners. Manual assignment is in Firefox 92, Chromium 86 and Safari 16.4. A MutationObserver on the children re-assigns after changes, once per microtask.

**Grouping children.** A `<dt>` starts a pair; `<dd>`s after it are its values; `<dt>`s directly after each other share the values. A `<dd>` before any `<dt>` and other elements are not assigned, so not shown. `<dt>` / `<dd>` must be direct children (no wrapping `div`: `::slotted` only reaches top-level slotted nodes).

**Empty values.** In `list-data`: `null`, an empty or blank text, an empty array. In children: a `<dd>` with no element and no text, or a `<dt>` with no `<dd>`. An empty `<dd>` child is left unassigned and the row gets a shadow `<dd>` with the placeholder in the muted colour. The default "—" says nothing aloud, so a placeholder with no letter or digit is `aria-hidden` and followed by visually hidden `empty-label` ("Not set"); a placeholder that is a word ("None") is read as it is.

**Layout follows the row, not the viewport.** Side by side is a two-column grid per row: `--kakao-description-list-term-width` (10rem) and the rest. A ResizeObserver compares the width of a row with `--kakao-description-list-stack-below` (22rem, the error summary's figure; measured through a hidden probe so any unit works) and sets `data-stacked` on the `<dl>`: the list stacks in a narrow card or a grid column as well as on a phone. A container query cannot read a custom property in its condition and would have fixed the breakpoint. `layout="stacked"` sets the same state at every width.

**Columns.** The `<dl>` is a grid of `repeat(auto-fill, minmax(min(100%, max(column-min-width, share of 1/columns)), 1fr))`: at most `columns` columns, fewer while one would be narrower than `--kakao-description-list-column-min-width` (12rem), one on a phone. Pairs fill row by row. The observer reads the resolved track count to mark the first and last line of rows.

**Flush edges, dividers.** Rows have `padding-block` (0.5rem; `sm` 0.25rem); the first line has no top padding and the last no bottom padding, so the list sits flush in a card. `dividers` adds a hairline above every row that is not in the first line; in a grid each column draws its own piece, separated by the column gap.

**`align="end"`** right-aligns values while side by side (amounts in a summary); stacked values stay at the start.

**Type and colour.** Term: muted, 0.875rem, weight 400. Value: text colour, body size. Dense: 0.875rem / 0.8125rem. All role-based.

**Page styles on slotted children.** A page's own `dt` / `dd` rules win over `::slotted()`. Margins would break the rows, so they are held with `!important` (the precedent is "Fixed hosts reset their margin"); colour and type are left to the page.

## Risks / Trade-offs

- [Term column has a fixed width, long terms wrap] → the width is a setting; stacked layout has no limit.
- [Without ResizeObserver the list never stacks by itself] → every supported browser has it; `layout="stacked"` still works.
- [Other children are silently not shown] → documented in the file header and the demo.

## Open Questions

- Whether a `heading` attribute or a caption is wanted, or the surrounding card's heading with `label` is enough.
