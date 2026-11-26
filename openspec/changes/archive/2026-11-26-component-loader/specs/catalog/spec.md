## MODIFIED Requirements

### Requirement: Consumer catalog
`CATALOG.md` SHALL give a project that uses the library, in about 3k tokens: the minimal page head (the loader: kakao.css and kakao.js; and the single-file head: tokens, font, themes, component-api, the theme switch loaded early so the theme doesn't flash), vendoring with `tools/vendor.js`, the light-DOM components that work without JS, a shared contract written once (label, size, tone, list-data, hidden, event naming, escaping JSON in attributes with one-line helpers for Python, PHP and JS), a "which one?" table for look-alike components, and one line per component.

#### Scenario: Picking between look-alikes
- **WHEN** an agent wonders whether to use kakao-alert or kakao-toast
- **THEN** the "which one?" table answers it in one row

#### Scenario: Shortest head
- **WHEN** an agent starts a page
- **THEN** the page head section shows the two-line loader head first
