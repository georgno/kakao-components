# Proposal

## Why

Reports built with the library list short items all the time (file:line references, test names, findings), each often with a status badge in front. Consumers write a bare `<ul>` and hand-tune its spacing and the badge alignment; `kakao-list` sounds right but is the 3D picker.

## What Changes

- `<kakao-plain-list>`: a light-DOM wrapper that styles the `<ul>` or `<ol>` inside it, drawn by `plain-list.css` alone (works without JS; the script only defines the tag and adds `role="list"`, which Safari drops when the markers are hidden). Template: `kakao-flow` / `kakao-code`.
- Even token spacing between items, muted markers, long references wrap instead of pushing a phone layout sideways. `marker` = `auto` (default: bullets or numbers) · `none`; `size` = `sm` · `md` (default); honours `hidden` (list and items).
- Leading badges or icons: when the items start with a `kakao-badge`, an `<i>` icon or an element marked `data-lead`, the leads form one aligned column (the list lays out as a table: the column takes the widest lead) and wrapped text stays aligned with the text, not under the lead.
- Name: `kakao-plain-list` (the CATALOG's "list, plain list" row; replaces the `kakao-content-list` placeholder in list.js). Demo and construction pages, components.html card, kitchen-sink entry, styleguide audit row, VALUES, CATALOG lines (which-one row, list's `not for`, without-JS line), AGENTS.md light-DOM list, manifest, loader map, tokens.json, CHANGELOG.

## Capabilities

### New Capabilities
- `plain-list`: the styled plain list.

## Impact

components/plain-list/ (new), components/list/list.js (header lines), components.html, kitchen-sink.html, styleguide.html, tools/style-check/helpers.js, CATALOG.md, AGENTS.md, custom-elements.json, shared/kakao.js, tokens.json, index.html (count), CHANGELOG.md. No breaking change.
