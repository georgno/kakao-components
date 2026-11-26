# Proposal

## Why

Agents and tools in other projects need each component's API and its load requirements in a form they can read without opening 62 source files. The style checker, the catalog and a loader need the same dependency data, from one source.

## What Changes

- `tools/manifest.js` (no packages) writes `custom-elements.json` in the Custom Elements Manifest format from the component headers and settings blocks; `--check` reports a stale file.
- Every header gets a FILES section: script, light-DOM CSS, `requires` (load first, in order) and `enhanced` (used when loaded).
- Headers that didn't follow the shared format (button, slider, tabs, number-input, animated-number, list, switch-group's bulleted entries) are rewritten to it.
- The pre-commit hook and the deploy run the check; the deploy publishes the file.

## Capabilities

### New Capabilities
- `custom-elements-manifest`: the generated manifest, the header format it is read from, and its check.

### Modified Capabilities

## Impact

tools/manifest.js and its tests, custom-elements.json, every component header (FILES section; seven headers reformatted), .githooks/pre-commit, pages.yml, AGENTS.md, CHANGELOG.md. No runtime change.
