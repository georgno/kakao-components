# Tasks

## 1. Markup reader

- [ ] 1.1 `tools/style-check/markup.js`: mask template regions (`<?php ?>`, `<?= ?>`, `{{ }}`, `{% %}`, `{# #}`) keeping length and line breaks, and remember the ranges
- [ ] 1.2 Tokenizer and element tree: quoted attributes, comments, raw-text `<script>`/`<style>`, void elements, unmatched close tags; each element with tag, attributes (value + dynamic flag), line, column, parent, children, slot
- [ ] 1.3 Fixture files and `node:test` tests for the reader: plain HTML, a Yii2 view with PHP in attributes, Twig, nested footers, comments and scripts containing `<kakao-…>` text

## 2. Checker core

- [ ] 2.1 `tools/style-check.js`: CLI arguments (paths, `--config`, `--format text|json`), file discovery in sorted order with extensions and ignores
- [ ] 2.2 Config loading with defaults for every key; setup errors (bad JSON, unknown rule id or level, missing path) exit 2
- [ ] 2.3 Rule loading from `tools/style-rules/` and `ruleDirs`, shape validation, duplicate ids as setup errors
- [ ] 2.4 Shared helpers for rules: filled and main button, footer buttons, attribute value sets
- [ ] 2.5 Run rules per placement, apply levels, sort findings (path, line, column, rule id), text and JSON reports with a summary, exit codes 0/1/2

## 3. Built-in rules

- [ ] 3.1 `dialog-main-button-corner` (right/full-width: last, left: first, centred: last; skips dynamic variants)
- [ ] 3.2 `card-main-button-first`
- [ ] 3.3 `list-data-name` and `list-data-json` (static values only)
- [ ] 3.4 `field-has-name` and `icon-button-has-name`
- [ ] 3.5 `attribute-values` with the value table (button variant/size, badge and chip tone, dialog size and button-position, breadcrumb start)
- [ ] 3.6 Fixture tests: one passing and one failing case per rule, plus a dynamic-value case where it applies

## 4. Forced placements

- [ ] 4.1 `force` turns a placement's findings into forced entries; a forced placement without findings gives the "force has no effect here" warning
- [ ] 4.2 Read the documentation file (`## <id>` sections with a reason); show reasons in the forced section
- [ ] 4.3 `forced.mandatory`: errors for a forced element without id, an id without a section, and a section without a forced element
- [ ] 4.4 Tests for optional (default) and mandatory documentation

## 5. Components and this repo

- [ ] 5.1 List the `force` attribute in every component's documentation header (no runtime code)
- [ ] 5.2 `kakao-style.config.json` for this repo (pages and `components/`, ignoring archive, openspec, vendor)
- [ ] 5.3 Run the checker over the repo; fix each violation, or force it with an id and a reason in `kakao-style.forced.md`
- [ ] 5.4 `.github/workflows/pages.yml`: run `node tools/style-check.js` before assembling the site
- [ ] 5.5 Docs: `AGENTS.md` and `openspec/config.yaml` (run the checker; keep the value table in step with components), the styleguide links the checker from Component rules, `CHANGELOG.md` under Unreleased
- [ ] 5.6 Verify: two runs give identical output, a seeded violation exits 1, a broken config exits 2, the deploy workflow passes
