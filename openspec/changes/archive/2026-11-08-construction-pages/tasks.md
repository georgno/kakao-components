# Tasks

## 1. Baseline and rule

- [x] 1.1 Take Firefox baseline screenshots of `index.html`, `kitchen-sink.html` and every `components/*/demo.html` into the scratchpad. Verify there is one PNG per page and none is blank.
- [x] 1.2 Add the construction page rule to the `context` in `openspec/config.yaml`: every new or changed component ships an up-to-date `construction.html`. Verify that `openspec instructions proposal --change construction-pages --json` shows the rule in `context`.

## 2. Construction server

- [x] 2.1 Write `tools/construct-server.js`: static serving on 127.0.0.1 with MIME types and no caching, a `--port` flag, `GET /__construct/status`, and start instructions in its header. Verify that `node tools/construct-server.js` serves `index.html` and the status endpoint answers JSON.
- [x] 2.2 Add `POST /__construct/save` (design decision 6):
  - target resolution and exactly-one-block check
  - property namespace check and value filtering
  - Origin check
  - line building, keeping line order
  - atomic write that touches only the text between the markers

  Verify with curl against a scratch copy of a component: a valid save changes only the block, so `diff` shows only block lines. An unknown target, a foreign property, a value containing `}` or `*/`, a malformed block line and a foreign Origin are each refused, and the file is left unchanged.

## 3. Main variables

- [x] 3.1 Create `shared/tokens.css` with the settings block on `:root` and the main variables from design decision 5, using values that match today's defaults (`--kakao-color-primary: #4f46e5`, …). Verify the file parses and `getComputedStyle(document.documentElement)` returns every token on a test page.

## 4. Construction engine

- [x] 4.1 Write `shared/construction.js` and `shared/construction.css`:
  - read the manifest and the settings block of the target source (via fetch)
  - build the grouped settings table with typed controls
  - apply live values to the canvas
  - validate with `CSS.supports`
  - light, dark and checkered canvas switcher

  Verify on a test page that changing each control type updates a sample element and that invalid values are marked and not applied.
- [x] 4.2 Add token binding (a picker filtered by type, a bound display with name and value, and detach that keeps the literal), loading token labels from the `tokens.html` manifest. Verify that binding a colour to the primary colour and then changing the token value on the page updates the bound setting.
- [x] 4.3 Add change marks, per-setting and global reset, a `beforeunload` warning, "Copy CSS", and warnings for manifest/block mismatches. Verify:
  - a changed setting is marked and reset clears it
  - closing the tab asks for confirmation
  - the clipboard text holds `--kakao-<component>-*: value;` lines
  - a deliberately missing manifest entry shows a warning
- [x] 4.4 Add Save: detect the server, disable Save with a start hint when it is missing, block saving while a value is invalid, post the settings, then show success or the server error and refresh the saved state. Verify against the running server: a save rewrites the block, a reload shows the saved values as unchanged, and with the server stopped Save is disabled and the hint is shown.
- [x] 4.5 Write `tokens.html`: a manifest of all main variables and a mixed preview of several components, saving to `shared/tokens.css`. Verify that changing the primary colour updates every previewed component bound to it, and that saving updates `shared/tokens.css`.

## 5. Shadow DOM components to the alias block

For each component:

1. Move its `:host` defaults into a marked block of `--_alias: var(--kakao-<component>-*, default)` lines.
2. Point the internal rules at the aliases.
3. Turn remaining hard-coded visual values into properties.
4. Bind matching defaults to tokens.
5. Write `construction.html` with representative states and a full manifest.
6. Link it from `demo.html`.
7. Update the header docs: ancestor theming now works.

Verify each one:
- its demo screenshot matches the 1.1 baseline pixel for pixel
- its construction page shows no manifest/block warnings
- a setting placed on an ancestor element applies

- [x] 5.1 switch-group
- [x] 5.2 step-switch
- [x] 5.3 file-upload
- [x] 5.4 multi-dropdown
- [x] 5.5 popover
- [x] 5.6 slider
- [x] 5.7 list
- [x] 5.8 animated-number

## 6. Light DOM components to the alias block

Same steps as group 5, with the settings block on the element selector in the component's `.css` file (not `:root`), and with every hard-coded colour, length, radius and timing in that CSS turned into a property. Verify each one:
- demo screenshot matches the baseline
- no construction page warnings
- grepping the component CSS outside the block finds no literal colour values

- [x] 6.1 button: move the `:root` defaults of `button.css` to `kakao-button`, and give variants, sizes and segment styles properties
- [x] 6.2 tabs: `tabs.css`
- [x] 6.3 number-input: `number-input.css`

## 7. Overview and integration

- [x] 7.1 In `index.html`:
  - add a construction link to every component card
  - add a link to `tokens.html` next to the kitchen sink link
  - load `shared/tokens.css` there and in `kitchen-sink.html` and every demo

  Verify that every construction link opens a page without a 404, and that the index and kitchen sink screenshots still match the baseline.
- [x] 7.2 End-to-end check with the server running:
  - change the switch-group on-colour by binding it to the primary colour
  - change the primary colour on `tokens.html`
  - save both, reload `kitchen-sink.html`

  Verify that the switches show the new colour, and that a bare test page loading only `switch-group.js` shows the fallback colour. Then restore both files to the baseline values.
- [x] 7.3 Check that no component source contains a literal closing script tag (`grep -n '</script' components/*/*.js` finds nothing), and run `openspec validate construction-pages`; it passes.

## Workflow follow-up

- Sync the delta specs to the main specs (`/opsx:sync`) or archive the change (`/opsx:archive`) once the work is reviewed.
