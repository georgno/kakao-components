# Proposal

## Why

A project using the library writes a long page head today: three stylesheets, component-api.js, the theme switch, and for every component its script, its light-DOM CSS and its dependencies in the right order. That is where consumers go wrong (tabs without tabs.css, toast before stack.js). Copying the library into a project is also manual and copies too much or too little.

## What Changes

- New `shared/kakao.css`: tokens, font and themes in one file, generated from `shared/tokens.css`, `shared/font.css` and `shared/themes.css`.
- New `shared/kakao.js`: one script, loaded in the head without `defer`. It applies a saved theme before the first paint, watches the page for kakao tags (and `theme-picker` controls) and loads each component on first use: component-api.js first, then for each component the components it requires and is enhanced by, its light-DOM CSS, then its script, in order. Tags stay hidden until defined (no unstyled flash). `kakaoLoader.load(...tags)` and `kakaoLoader.ready` for code that needs a component. Its dependency map is generated from custom-elements.json.
- New `tools/loader.js` writes both generated parts; `--check` runs in the pre-commit hook and the deploy.
- New `tools/vendor.js`: `node tools/vendor.js <dest> [component…]` copies exactly the files those components need (dependencies and enhancers included; all when none are named), the shared files, CATALOG.md and custom-elements.json, and writes `VERSION` with the tag.
- Style checker: a page that loads `shared/kakao.js` loads everything, so `page-loads-dependencies` reports nothing there.
- CATALOG.md's page head shows the loader first, the single files second.
- Pages that load single files keep working unchanged; the loader skips tags that are already defined and files the page already loads.

## Capabilities

### New Capabilities
- `loader`: shared/kakao.js, shared/kakao.css and their generator.
- `vendoring`: tools/vendor.js.

### Modified Capabilities
- `style-checker`: the dependency rule accepts the loader.
- `catalog`: the page head names the loader.

## Impact

shared/kakao.js, shared/kakao.css, tools/loader.js, tools/vendor.js, tools/tests/loader.test.js, tools/tests/vendor.test.js (new); tools/style-check/page.js, tools/style-rules/page-loads-dependencies.js and a fixture; tools/construct-server.js (rewrites kakao.css after a tokens save); CATALOG.md, AGENTS.md, CHANGELOG.md, .githooks/pre-commit, .github/workflows/pages.yml. No breaking change.
