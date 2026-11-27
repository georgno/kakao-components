# Proposal

## Why

Projects that use the library are often worked on by small models with little context (the target: a fast, non-frontier model). They choke on three things today: one tag's API is only in custom-elements.json (532 KB; the button entry alone is 10 KB), the checkers live only in a library checkout, and the skill lists exceptions to remember (`hidden` ignored by 17 components, `form.reset()` not clearing fields, a page base every page must copy) instead of the library just working.

## What Changes

- New `tools/api.js <tag|folder…>`: one component's purpose, attributes with values, slots, events, methods and the header's USAGE example, about 1–2k tokens; `--list`, `--css`.
- `tools/vendor.js` also copies `tools/api.js`, the style checker (without tests) and `tools/visual-check.js`.
- New `shared/base.css` (page base, every rule in `:where()`), part of `shared/kakao.css`; the template and recipes drop their copies. Upgrade note: kakao.css now sets the body base.
- Every component honours `hidden`; text-input, textarea, checkbox and radio-group implement `formResetCallback`. Number input: reduced-motion guard on its border transition.
- kakao-ui skill 1.1: a numbered workflow (catalog → copy a recipe → api.js per tag → style check → visual check); caveats that are fixed are gone.
- The deploy runs `node --test` and `node tools/check-themes.js`.

## Capabilities

### New Capabilities
- `api-lookup`: tools/api.js.

### Modified Capabilities
- `vendoring`: ships the tools.
- `loader`: kakao.css includes the page base.
- `component-conventions`: `hidden` and form reset.
- `consumer-skill`: the workflow.

## Impact

tools/api.js, tools/tests/api.test.js, shared/base.css (new); tools/vendor.js, tools/loader.js, shared/kakao.css, 17 component files, 4 field components, templates/page.html, recipes/*.html, skills/kakao-ui (and copies), CATALOG.md, AGENTS.md, CHANGELOG.md, .github/workflows/pages.yml; TAKEOVER.md removed.
