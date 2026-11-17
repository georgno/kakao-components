# Tasks

## 1. Value parser

- [ ] 1.1 Create `tools/export-tokens/parse.js`: a tokenizer and parser for the value subset in design.md (numbers with px/rem/em/ms/s/vh/vw/dvh/%, hex, `rgb()`/`rgba()` in both syntaxes, `transparent`, `currentColor`, `inherit`, `var()`, `color-mix(in srgb …)`, `cubic-bezier()`, `calc`/`clamp`/`min`/`max`, space and comma lists). Unknown functions throw with the offending text. Verify with `tools/export-tokens/tests/parse.test.js` under `node --test`: one case per form, plus one failing case.
- [ ] 1.2 Add shadow and font-shorthand readers on top of the parser (multi-layer shadows with a `color-mix` layer; `0.95rem/1.4 var(--kakao-font-family, …)`). Verify with tests using the real dialog shadow and switch label font strings.

## 2. Reading the sources

- [ ] 2.1 Read `shared/tokens.css` (light), every `@theme` block and the `prefers-contrast: more` overrides in `shared/themes.css`, skipping the `@generated` blocks. Verify with a test that the theme list equals the `@theme` names plus light, and that dark border in contrast mode is `#a1a1aa`.
- [ ] 2.2 Read every `components/*/*.{js,css}` settings block. Reuse the line format `construct-server.js` enforces, but no code from it: it is a server. Verify with a test that the count equals the number of files containing `@kakao-settings:start` (61 today), and that button `md-height` reads as 44 px.

## 3. Resolution and output

- [ ] 3.1 Resolve each value per theme and contrast mode: follow `var()` chains through `--_` aliases and shared tokens, compute `color-mix` in sRGB, and convert units (rem = 16 px, ms). Leave em, viewport units, cross-component refs and calc/clamp/min as typed nodes. Verify against fixtures recorded once from Firefox `getComputedStyle` for about 10 settings: button primary ring, dialog shadow, and switch track-on in dark and amoled.
- [ ] 3.2 Write `tokens.json` (`formatVersion: 1`, `version` from the `index.html` hero fact, sorted keys, 2-space indent, trailing newline), with a `value` tree and a `resolved` table per setting as in design.md. Verify that two runs give a byte-identical file.
- [ ] 3.3 Add the `--check` mode: exit 1 and name the first differing entry when the file is stale. On a parse error, exit 1, name the file and setting, and leave `tokens.json` unwritten. Verify with `tools/export-tokens/tests/cli.test.js` using a temp copy of the sources.
- [ ] 3.4 Write the tool's header comment: usage, output shape, and how to read `value` against `resolved`. Generate and commit `tokens.json`. Verify that `node tools/export-tokens.js --check` passes.

## 4. Keeping it current

- [ ] 4.1 Extend `.githooks/pre-commit` to run the exporter and stage `tokens.json`, with the same unstaged-edits guard as for `index.html`. Verify by editing a token value, committing, and seeing `tokens.json` in the commit.
- [ ] 4.2 In `.github/workflows/pages.yml`, add `node tools/export-tokens.js --check` next to the style check, and add `tokens.json` to the copy list. Verify the workflow YAML parses (`node -e` with a YAML-free read is enough) and that the copy line includes the file.
- [ ] 4.3 Add a rule line to `AGENTS.md` (generated file: never edit by hand, run the exporter), and add an Unreleased entry to `CHANGELOG.md`. Verify by reading both diffs.

## 5. Integration check

- [ ] 5.1 Change `--kakao-color-primary` on `tokens.html` via the construct server, run the exporter, and confirm that every setting that follows primary changes in `tokens.json`, in every theme that does not override it. Then revert the change.

## Workflow follow-up

- Archive the change with `/opsx:archive` once all tasks are done.
