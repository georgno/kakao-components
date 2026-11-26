# Tasks

## 1. Audit

- [x] 1.1 Dump tones, sizes, label / text attributes, events and booleans from custom-elements.json and the sources; list every inconsistency with fix or reason to leave. Verify the list is in the report.

## 2. Components

- [x] 2.1 badge and chip: warning tone, settings, construction rows, demo examples. Verify in the browser (light, dark, 390px) and `node tools/check-themes.js`.
- [x] 2.2 range-slider: low-label / high-label, old names as deprecated aliases. Verify the thumbs' accessible names in the browser.

## 3. Headers and manifest

- [x] 3.1 SLOTS sections for every component with slots; enumerated values in the `a (default) · b` form; aside-menu, stack, toc, tooltip sections fixed. Verify with `node tools/manifest.js` and the manifest's slots / types.
- [x] 3.2 tools/manifest.js: multi-name entries that continue on the next line, with a test. Verify `node --test`.

## 4. Checks

- [x] 4.1 VALUES covers every manifest enum; tools/tests/vocabulary.test.js checks VALUES against the manifest and the shared names. Verify `node --test`, `node tools/style-check.js`.
- [x] 4.2 CHANGELOG under Unreleased. Verify by reading it.
