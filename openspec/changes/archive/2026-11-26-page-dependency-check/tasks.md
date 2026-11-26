# Tasks

## 1. Rule

- [x] 1.1 tools/style-check/page.js: loaded scripts and stylesheets, dependency chain from the manifest, URL matching and suggested URLs. Verify on components/toast/demo.html with stack.js removed.
- [x] 1.2 tools/style-rules/page-loads-dependencies.js; checker core passes doc, source and manifest, honours a finding's warning level, reads the `manifest` config key. Verify `node tools/style-check.js` (0 errors on the repo).

## 2. Tests and notes

- [x] 2.1 Fixtures: tabs without tabs.css, toast without stack.js / alert.js, wrong order, a template (warnings), a partial (skipped), a config-named manifest. Verify `node --test`.
- [x] 2.2 CHANGELOG under Unreleased. Verify by reading it.
