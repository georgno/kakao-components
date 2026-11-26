# Proposal

## Why

A page that uses `<kakao-toast>` without `stack.js` and `alert.js`, or `<kakao-tabs>` without `tabs.css`, breaks silently in the browser. custom-elements.json now records each component's script, light-DOM CSS and required components, so the style checker can catch this before a page ships.

## What Changes

- New built-in rule `page-loads-dependencies` (error): for each kakao tag a page uses, the page loads its script, its light-DOM CSS and the scripts of the components it requires (transitively), each required script before the script that needs it. Findings name the missing file as the page would write its URL.
- The dependency data comes only from custom-elements.json (`kakao.script`, `kakao.css`, `kakao.requires`); optional `enhancedBy` components are not checked.
- Files without a `<head>` (partials, views rendered into a layout) are skipped; template files (.php, .phtml, .twig) and heads with template code report warnings, since they may load files in code.
- Checker core: rules get `ctx.doc`, `ctx.source` and `ctx.manifest`; a finding may lower its level to warning; the config may name the manifest (`manifest`), else custom-elements.json next to the config, else the tool's own.

## Capabilities

### Modified Capabilities
- `style-checker`: built-in rule list, page-level dependency rule, manifest config.

## Impact

tools/style-check.js, tools/style-check/page.js (new), tools/style-rules/page-loads-dependencies.js (new), tests and fixtures, CHANGELOG.md. No component or page changes; the repo's pages already pass. No breaking change.
