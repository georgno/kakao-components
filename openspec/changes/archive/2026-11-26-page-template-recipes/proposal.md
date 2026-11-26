# Proposal

## Why

A session in another project should get from the catalog to a finished page without inventing the page shell or the common screens. Today it has CATALOG.md and the demo pages, which show one component at a time; the page around them (head, header bar, content column, spacing) and the usual screens are rebuilt by hand each time, and drift from the library's conventions.

## What Changes

- `templates/page.html`: a complete starting page: the two-line loader head (`kakao.css` + `kakao.js`), a minimal page base (margin, page colour, text colour, font), `kakao-header-bar` with title, nav and `kakao-theme-switch`, and `main > kakao-page > kakao-flow gap="lg"` with a page header and one section (`kakao-section-header`).
- `recipes/`: five small, complete, copy-paste pages built on that template: `report.html` (summary tiles, status badges, tabs, accordions, plain lists), `dashboard.html` (stat tiles, progress, meter, table), `form.html` (fields, validation, error summary, a server-side error, a toast), `table.html` (filtered, sorted, paged `kakao-grid-view`) and `list-detail.html` (a table whose rows open an `kakao-aside-sheet`).
- They use the loader head, not explicit script tags: two lines a consumer copies unchanged (only the path prefix), nothing to keep in order, and a component added to the page needs no head edit. Each page says in its head comment where the library sits in a consuming project (`kakao/`). They don't load page-cloak.js, which is for this project's own pages, not part of the library: the loader already hides each tag until it is defined.
- Deploy: `templates` and `recipes` join the copy list in pages.yml; `tools/minify-site.mjs` keeps them as written (like the demo pages), since they are read and copied.

## Capabilities

### New Capabilities
- `recipes`: the page template and the recipe pages.

## Impact

templates/ (new), recipes/ (new), .github/workflows/pages.yml, tools/minify-site.mjs, CHANGELOG.md. No component changes, nothing breaking.
