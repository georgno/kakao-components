# Proposal

## Why

Consumers render preformatted text, code and build logs by hand: a `<pre>` with page CSS, a home-made copy button, no keyboard access to the scroller, logs that jump back to the end while someone reads, and file:line references styled differently on every page.

## What Changes

- New `<kakao-code-block>` (shadow DOM; template: kakao-copy-button for the shadow-DOM shape, kakao-table for the scroller that takes focus only when it overflows): monospace, theme-aware, `max-height` with scrolling, `wrap`, an optional label row (`label`, display-only `language`), copy built in through kakao-copy-button (`requires copy-button`; `no-copy` turns it off).
- `mode="log"`: follows the end unless the reader scrolled up (a "Jump to latest" button brings it back), `append(text)`, `clear()`, `max-lines` (default 1000), carriage returns overwrite the line, ANSI colour codes are dropped, optional `announce`.
- Content is always text: read from the light DOM's text (indentation removed), set through `text` or `append()`, written with text nodes only. A test checks markup in all three stays inert.
- Inline code: a new `<kakao-code>`, light DOM (code.css styles the tag, so server-rendered references look right before any script runs; code.js only marks it `translate="no"`). Chosen over a shadow-DOM element, which shows unstyled text without JS, and over a class on `<code>`, which the manifest, loader and style checker cannot see.
- New shared token `--kakao-font-mono` (both use it; tokens.html row).
- Demo and construction pages for both, components.html cards, kitchen-sink entry, styleguide audit rows, VALUES (`mode`), CATALOG lines and a "which one?" row (code vs code-block vs kbd), manifest, loader map, CHANGELOG.

## Capabilities

### New Capabilities
- `code-block`: the block component.
- `code`: the inline code style.

## Impact

components/code-block/, components/code/ (new), shared/tokens.css, tokens.html, shared/kakao.css, components.html, kitchen-sink.html, styleguide.html, tools/style-check/helpers.js, tools/tests/code-block.test.js, CATALOG.md, AGENTS.md (light-DOM list), components/kbd/kbd.js (CATALOG line), custom-elements.json, shared/kakao.js, tokens.json, index.html (count), CHANGELOG.md. No breaking change.
