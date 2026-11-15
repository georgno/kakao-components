# Proposal

## Why

A list with no rows, a search with no results, a card whose content does not exist yet: every project writes the same small block for it (an icon, a title, a sentence, a button) and each one looks a little different. `components.html` lists it as "Empty state" under "Not built yet". The error page covers the page-filling case; this is its quiet, small sibling for the inside of a card, a list or a table area.

## What Changes

- New component `<kakao-empty-state>` (`components/empty-state/`), shadow DOM. A centred column:
  - an icon: a built-in tray glyph (inline SVG, `currentColor`) on a soft round fill; `slot="icon"` replaces it (inline SVG preferred), `no-icon` removes it;
  - `heading` with `heading-level` (1 to 6, default 3: the block sits inside a section or card that already has a heading);
  - `message`, or the default slot for text with links;
  - `slot="actions"`: buttons or links in a wrapping centred row.
- `size="sm"` for tight places (a table body, a popover, a small card): smaller icon, type and padding. Without it the default size.
- The attribute and slot names are the error page's (`heading`, `heading-level`, `message`, default slot, `actions`) and the alert's (`slot="icon"`, `no-icon`), so the three read alike.
- No frame and no background of its own: it takes the surface it sits on. No pattern, no animation.
- Settings block (`--kakao-empty-state-*`), construction page, demo page; card on `components.html` (alphabetical, between Dialog and Error page) replacing the "Empty state" placeholder, style guide audit row, changelog entry.

## Capabilities

### New Capabilities
- `empty-state`: content attributes, heading semantics, icon, slots, sizes, layout, theming hooks, phone width.

### Modified Capabilities

None.

## Impact

- New: `components/empty-state/{empty-state.js,demo.html,construction.html}`. No dependency on other components (actions are whatever the page slots in).
- Pages: `components.html` (new card, script tag, placeholder removed), `styleguide.html` (audit row). Not on `kitchen-sink.html`: the settings form has no empty list or table to show it in.
- `CHANGELOG.md` (Unreleased, Added). `.github/workflows/pages.yml` copies `components/` wholesale, so it is unchanged. No new token, no theme change.
