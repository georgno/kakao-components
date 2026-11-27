## MODIFIED Requirements

### Requirement: Consumer skill
`skills/kakao-ui/SKILL.md` SHALL be a skill for sessions in projects that use the library, written so a small model can follow it: a numbered workflow (CATALOG.md to pick, copy the template or a recipe, `tools/api.js` for every tag before writing it, the style check, the visual check), the loader head and `kakaoLoader.ready`, the page shell, the rules (never invent attributes or values, tones, list-data and escaping, labels, no hard-coded colours or margins, sentence case), vendoring and pinning a release tag, and a closing checklist (style check; light, dark, 390px phone, keyboard, reduced motion). It SHALL point to CATALOG.md, `templates/page.html` and `recipes/` rather than repeat them, and stay short (well under 2k tokens).

#### Scenario: A fresh session builds a page
- **WHEN** an agent in another project has only SKILL.md, CATALOG.md and the vendored copy
- **THEN** it can write a page with a correct head, components and attributes, and check it with the vendored tools before finishing
