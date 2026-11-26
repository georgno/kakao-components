# Tasks

## 1. Source and generator

- [x] 1.1 CATALOG section (`for`, `not for`) in every component header; manifest.js reads it into `summary` / `kakao.notFor`, errors when missing. Verify `node tools/manifest.js`.
- [x] 1.2 tools/catalog.js: generated list between markers, tag check, `--check`. Verify `node tools/catalog.js --check`.

## 2. Guide and wiring

- [x] 2.1 CATALOG.md hand-written parts: page head, no-JS components, shared contract, "which one?". Verify size (about 3k tokens).
- [x] 2.2 Pre-commit hook and deploy run `--check`; deploy publishes CATALOG.md; AGENTS.md and CHANGELOG. Verify by reading them.
- [x] 2.3 tools/tests/catalog.test.js. Verify `node --test`.
