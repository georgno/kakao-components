## ADDED Requirements

### Requirement: Consumer skill
`skills/kakao-ui/SKILL.md` SHALL be a skill for sessions in projects that use the library: when to use it, vendoring and pinning a release tag, the loader head and `kakaoLoader.ready`, the page base, the rules that bite most, known gotchas and a closing checklist (style check; light, dark, 390px phone, keyboard, reduced motion). It SHALL point to CATALOG.md, `templates/page.html` and `recipes/` rather than repeat them, and stay short (well under 2k tokens).

#### Scenario: A fresh session builds a page
- **WHEN** an agent in another project has only SKILL.md and CATALOG.md
- **THEN** it can write a page with a correct head, page base, components and attributes, and knows what to check before finishing

### Requirement: One source, checked copies
`skills/kakao-ui/` SHALL be the source; `.claude/skills/kakao-ui/` and `.pi/skills/kakao-ui/` SHALL be byte-identical copies written by `node tools/skills.js`. `node tools/skills.js --check` SHALL exit 1 naming each missing or differing file, and SHALL run in the pre-commit hook and the deploy.

#### Scenario: A copy edited by hand
- **WHEN** `.pi/skills/kakao-ui/SKILL.md` differs from the source
- **THEN** `node tools/skills.js --check` exits 1 and names that file

### Requirement: Published with the site
The deploy SHALL publish `skills/` with the site, so a consumer can fetch the skill from the live site.

#### Scenario: Fetching the skill
- **WHEN** the site is deployed
- **THEN** `skills/kakao-ui/SKILL.md` is served as written
