## ADDED Requirements

### Requirement: Page template
`templates/page.html` SHALL be a complete page a consumer can copy and fill: the loader head (`shared/kakao.css`, then `shared/kakao.js` without defer), a page base that takes its colours and font from the tokens, a `kakao-header-bar` as the first child of `<body>` holding the title and a `kakao-theme-switch`, and `<main>` holding `kakao-page` > `kakao-flow gap="lg"`. Spacing SHALL come from the layout primitives and tokens, not from page margins.

#### Scenario: Copied into another project
- **WHEN** the template is copied next to a vendored `kakao/` folder and its two head paths are changed to `kakao/shared/…`
- **THEN** the page renders with the theme switch working and the saved theme applied before the first paint, without adding any script tag

### Requirement: Recipes
`recipes/` SHALL hold complete, copy-paste pages for the screens agents build most: a report or detail page, a dashboard, a form with validation and an error summary, a filtered and paged table, and a list with a detail sheet. Each SHALL be built like the template, pass `node tools/style-check.js` with no errors, and read correctly in the light and dark themes and at 390px width without horizontal page scroll.

#### Scenario: A recipe on a phone
- **WHEN** any recipe is opened 390px wide in the dark theme
- **THEN** its content fits the width, nothing scrolls the page sideways and the browser console shows no errors

### Requirement: Published as written
The deploy SHALL publish `templates/` and `recipes/` with the site and SHALL NOT minify them, so the live pages can be read and copied as written.

#### Scenario: Viewing a recipe's source on the live site
- **WHEN** the site is built with `tools/minify-site.mjs`
- **THEN** the files under `templates/` and `recipes/` are byte for byte the repo's files
