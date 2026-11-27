## 1. Lookup and vendoring

- [x] 1.1 tools/api.js with --list and --css, tests (every tag under 8k characters, vendored copy)
- [x] 1.2 vendor.js copies api.js, style-check (+ rules, no tests) and visual-check

## 2. Library fixes

- [x] 2.1 `hidden` on the 17 components that ignored it (tooltip keeps its documented behaviour)
- [x] 2.2 formResetCallback in text-input, textarea, checkbox, radio-group
- [x] 2.3 shared/base.css in kakao.css; template and recipes without their copies
- [x] 2.4 number-input reduced-motion guard

## 3. Docs and CI

- [x] 3.1 kakao-ui skill 1.1 (workflow), CATALOG.md, AGENTS.md, CHANGELOG (Upgrade line for the base)
- [x] 3.2 deploy runs node --test and check-themes
- [x] 3.3 visual check of the template, a recipe, index and components pages
