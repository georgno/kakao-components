# Proposal

## Why

A session in another project should use the library well with a few thousand tokens of context. CATALOG.md says what each component is for; nothing tells an agent how to work with the library: vendor and pin it, write the head and the page base, which rules bite, and what to check before it calls a page done.

## What Changes

- `skills/kakao-ui/SKILL.md`: a short consumer skill (when to use the library, vendoring and pinning a tag, the two-line loader head and `kakaoLoader.ready`, the page base, the rules that bite most, known gotchas, a closing checklist). It points to CATALOG.md, `templates/page.html` and `recipes/` instead of repeating them.
- Installed for this repo's own tools as identical copies in `.claude/skills/kakao-ui/` and `.pi/skills/kakao-ui/`. `skills/kakao-ui/` is the one source; `node tools/skills.js` copies it, `--check` fails on a drifted copy (pre-commit hook and deploy), with a test. Copies, not symlinks: symlinks break on Windows checkouts without core.symlinks, and the copy other repos take must be a real file.
- `tools/vendor.js` also copies `skills/kakao-ui/`, `templates/` and `recipes/`, so the skill and what it points to arrive pinned to the same tag as the code.
- The deploy publishes `skills/` with the site (fetchable from the live site, not minified: it is Markdown).

## Capabilities

### New Capabilities
- `consumer-skill`: the kakao-ui skill and its copies.

### Modified Capabilities
- `vendoring`: also copies the skill, the template and the recipes.

## Impact

skills/ (new), .claude/skills/kakao-ui, .pi/skills/kakao-ui, tools/skills.js + test, tools/vendor.js + test, .githooks/pre-commit, .github/workflows/pages.yml, CHANGELOG.md. No component or page changes.
