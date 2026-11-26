## ADDED Requirements

### Requirement: Page container
`<kakao-page>` SHALL be a light-DOM block, drawn by page.css alone, that centres its content at a maximum width chosen by `width` (`narrow`, `normal` by default, `wide`, `full`), pads its sides (at least the safe-area insets), starts `--kakao-space-below-bar` below the header bar, and keeps its end clear of a fixed action bar. `hidden` SHALL hide it.

#### Scenario: A page below the header bar
- **WHEN** a page renders `<kakao-header-bar>` and then `<main><kakao-page>…</kakao-page></main>` and loads page.css
- **THEN** the content is centred at the normal width with side padding, starting just below the bar, also when page.js has not run

#### Scenario: On a phone
- **WHEN** the viewport is 390px wide
- **THEN** the container spans the width minus its side padding and nothing scrolls sideways
