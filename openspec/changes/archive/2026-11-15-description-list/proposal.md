# Proposal

## Why

Summary and detail screens are mostly pairs: "Plan / Pro", "Renews / 1 Dec 2026", "Status / Active". Every project writes its own `<dl>` grid for them, and each one handles a phone, an empty value and a badge in the value a little differently. `components.html` lists it as "Description list" under "Not built yet".

## What Changes

- New component `<kakao-description-list>` (`components/description-list/`), shadow DOM, rendering a semantic `<dl>`:
  - rows from `list-data` (a JSON array of `[term, value]` pairs or `{term, value}` objects; a value may be an array of values) and/or from native `<dt>` / `<dd>` children, for values with rich content (badges, links);
  - side by side (a term column and the value) by default, `layout="stacked"` for the term above the value; a side-by-side list stacks by itself when a row is narrower than a setting, so on a phone it reads as label/value blocks, like the style guide's rule for data tables on small screens;
  - `columns` (2 to 4): the pairs fill a grid, which loses columns as the space gets narrow;
  - `dividers` (hairlines between rows), `size="sm"` (dense), `align="end"` (values at the end of the row, for amounts);
  - a placeholder for empty values: `empty-text` (default "—"), spoken as `empty-label` (default "Not set");
  - `label` as the list's accessible name.
- Term muted, value in the text colour, all from theme roles. No frame or surface of its own.
- Settings block (`--kakao-description-list-*`), construction page, demo page; card on `components.html` (alphabetical, between Date input and Dialog) replacing the "Description list" placeholder, style guide audit row, changelog entry.

## Capabilities

### New Capabilities
- `description-list`: rows from data and children, list semantics, layouts, columns, dividers, size, empty values, theming hooks, phone width.

### Modified Capabilities

None.

## Impact

- New: `components/description-list/{description-list.js,demo.html,construction.html}`. No dependency on other components.
- Pages: `components.html` (new card, script tag, placeholder removed; its page rule for the plain native `dt` / `dd` example narrowed to `dl > dt` / `dl > dd` so it does not restyle the component's children), `styleguide.html` (audit row). Not on `kitchen-sink.html`: that page is a settings form with no read-only summary.
- `CHANGELOG.md` (Unreleased, Added). `.github/workflows/pages.yml` copies `components/` wholesale, so it is unchanged. No new token, no theme change.
