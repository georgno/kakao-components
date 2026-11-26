# Tasks

## 1. Headers

- [x] 1.1 Add a FILES section to every component header (script, css, requires, enhanced) from the code's real dependencies. Verify every component file contains it.
- [x] 1.2 Rewrite the headers that don't follow the format (button, slider, tabs, number-input, animated-number, list; switch-group's bulleted entries). Verify `node --check` on each and their entries in the manifest.

## 2. Tool

- [x] 2.1 tools/manifest.js writes custom-elements.json (CEM 2.1.0, kakao field, settings-block CSS properties) and `--check`. Verify with tools/tests/manifest.test.js under `node --test`.
- [x] 2.2 Pre-commit hook and pages.yml run `--check`; the deploy copies the file. AGENTS.md documents the header format; CHANGELOG under Unreleased. Verify `sh -n` on the hook and by reading the diffs.
