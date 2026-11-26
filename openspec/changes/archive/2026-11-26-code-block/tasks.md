# Tasks

## 1. Components

- [x] 1.1 Token `--kakao-font-mono` (tokens.css, tokens.html).
- [x] 1.2 components/code: code.js, code.css, demo.html, construction.html.
- [x] 1.3 components/code-block/code-block.js: header (CATALOG, FILES, force), text-only content, label row, copy, scroller, wrap, max-height, log mode, hidden.
- [x] 1.4 code-block demo.html and construction.html; tools/tests/code-block.test.js (content stays inert text). Verify in Chromium: light, dark, every theme, keyboard, reduced motion, 390px, follow / scroll-up, max-lines.

## 2. Wiring

- [x] 2.1 components.html cards, kitchen-sink entry, styleguide audit rows, VALUES, CATALOG "which one?" row, kbd CATALOG line, AGENTS.md light-DOM list, CHANGELOG. Verify `node tools/style-check.js`.
- [x] 2.2 Regenerate manifest, catalog, loader, tokens. Verify all six checks and `node --test`.
