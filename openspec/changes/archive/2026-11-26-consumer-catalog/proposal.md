# Proposal

## Why

A session in another project should be able to use the library from a few thousand tokens of context. custom-elements.json has the full API but is ~490 kB; a consumer needs a short guide: how to load the library, the shared names, which look-alike to pick, and one line per component, kept in step with the components.

## What Changes

- New `CATALOG.md` (about 3k tokens): page head, shared contract (label, size, tone, list-data, hidden, events, escaping JSON in attributes with Python / PHP / JS helpers), a "which one?" table, and a generated line per component (what for, not for / use instead, light or shadow DOM, CSS file, components to load first).
- Source of the "what for / not for" text: a new CATALOG section in every component header (`for`, `not for`). `tools/manifest.js` reads it into the main declaration's `summary` and `kakao.notFor`; a missing section is an error.
- New `tools/catalog.js` rewrites the generated part of CATALOG.md from custom-elements.json; `--check` runs in the pre-commit hook and the deploy, which also publishes CATALOG.md. Both modes reject a `kakao-<name>` anywhere in the file that is not a tag or event of the manifest.
- The "which one?" rows for stack vs layout and list vs a plain list say what to use today (CSS gap, `<ul>`); the planned layout primitives (B3) and content list (B4) add their names there once named.

## Capabilities

### New Capabilities
- `catalog`: the consumer guide and its generator.

### Modified Capabilities
- `custom-elements-manifest`: the header's CATALOG section, `summary` and `kakao.notFor`.

## Impact

CATALOG.md (new), tools/catalog.js (new), tools/manifest.js, tools/tests/catalog.test.js (new), all 62 component headers (comment only), custom-elements.json, .githooks/pre-commit, .github/workflows/pages.yml, AGENTS.md, CHANGELOG.md. No breaking change.
