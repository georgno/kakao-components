# Tasks

## 1. Loader

- [x] 1.1 tools/loader.js: kakao.css from tokens, font, themes; the map in shared/kakao.js from custom-elements.json; `--check`. Verify `node tools/loader.js --check`.
- [x] 1.2 shared/kakao.js: early theme, watch for tags, load in order with CSS, cloak until defined, `kakaoLoader.load` / `ready`. Verify in Chromium with a page using toast, tabs and grid-view through the loader only.

## 2. Vendoring and checks

- [x] 2.1 tools/vendor.js with VERSION. Verify by vendoring toast into a temp dir.
- [x] 2.2 Style checker treats a page loading shared/kakao.js as loading everything (fixture and test).
- [x] 2.3 tools/tests/loader.test.js and vendor.test.js. Verify `node --test`.

## 3. Wiring and docs

- [x] 3.1 Pre-commit hook and deploy run `node tools/loader.js --check`; CATALOG.md page head; AGENTS.md; CHANGELOG. Verify all checks pass.
