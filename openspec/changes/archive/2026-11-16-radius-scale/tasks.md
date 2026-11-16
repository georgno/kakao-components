# Tasks

## 1. Tokens

- [x] 1.1 `shared/tokens.css`: `--kakao-radius-xs/-sm/-md/-lg/-pill` in the settings block (plain declarations, as the construction server writes them). Verify: `node tools/check-themes.js`.
- [x] 1.2 `tokens.html`: manifest entries for the five tokens (group Shape). Verify: manifest lists them.

## 2. Components

- [x] 2.1 Every component settings default whose radius literal equals a scale step refers to the step's token with the same literal fallback (popover excepted). Verify: a scan finds no remaining step literal outside `var(--kakao-radius-*)` except the popover.

## 3. Pages

- [x] 3.1 `styleguide.html`: radius scale badge Rule, note and Proposed tokens text updated. Verify: `node tools/style-check.js`.
- [x] 3.2 `CHANGELOG.md` Unreleased entry. Verify: read.
