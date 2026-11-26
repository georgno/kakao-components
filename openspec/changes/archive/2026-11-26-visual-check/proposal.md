# Proposal

## Why

The kakao-ui skill's closing checklist asks agents to look at every page in light, dark, at 390px, with the keyboard and with reduced motion, but gives them no way to do it. Agents without a browser skip it, and those with one each improvise.

## What Changes

- `tools/visual-check.js <page|url>…`: full-page screenshots (desktop 1280px and phone 390px, each light and dark) into the OS temp folder (`--out` to change), plus checks that need no packages beyond Playwright: console errors, exceptions, failed requests and HTTP errors; sideways scroll on any viewport, naming where it starts; Chromium's accessibility tree (visible controls and images without a name; `lang`, `<title>`, viewport meta); Tab through the page with a focused/blurred screenshot per stop (no visible focus, Tab stuck); animations still running under reduced motion (busy indicators as notes). Exit 0 / 1 findings / 2 usage or no Playwright.
- Playwright stays out of the repo, as for the code-block browser test and the token recording script: it is required lazily (from the current project, the checkout or NODE_PATH) and a missing install prints how to get it. No axe-core: Chromium's own tree covers names without another package.
- Local files are served from `--root` (default: the current folder) by a small built-in http server; URLs (a PHP or Python dev server) open as they are.
- Not vendored: like the style checker, consumers run it from the library checkout.
- Documented in AGENTS.md and in the kakao-ui skill's checklist; test (browser part skipped without Playwright).

## Capabilities

### New Capabilities
- `visual-check`: the screenshot and browser check command.

## Impact

tools/visual-check.js + tools/tests/visual-check.test.js, AGENTS.md, skills/kakao-ui/SKILL.md (+ copies), CHANGELOG.md. No component or page changes.
