# Tasks

## 1. Skill

- [x] 1.1 skills/kakao-ui/SKILL.md (frontmatter like the openspec skills: name, description, license, metadata).
- [x] 1.2 Verify every path, attribute and API it names exists.

## 2. Copies and wiring

- [x] 2.1 tools/skills.js (write, --check) + tools/tests/skills.test.js; copies in .claude/skills and .pi/skills.
- [x] 2.2 Pre-commit hook and deploy run `node tools/skills.js --check`; deploy copies skills/.
- [x] 2.3 tools/vendor.js copies skills/kakao-ui, templates, recipes; vendor test.
- [x] 2.4 CHANGELOG; the seven checks plus the new one green.
