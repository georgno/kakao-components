# Proposal

## Why

Keys, links, install commands and code are things people copy, and the components page still lists Copy button as missing. The demo pages already have one, hand-wired in `shared/demo.js` around a `kakao-button`: clipboard call, textarea fallback, a check for a moment, a status text. Every project that needs the same has to write that again, including the parts that are easy to forget (the announcement for screen readers, the failure case).

## What Changes

- New component `<kakao-copy-button>` (`components/copy-button/`), shadow DOM, with its own native button.
  - Copies `value`, or the text of the element named by `for` (a field's current value, otherwise its text), read at the moment of the click.
  - With `label` it is a labelled button, without it icon only (a circle) named by `aria-label` or "Copy".
  - Looks like the button's quiet variants: `variant` secondary (default) or ghost; `size` sm, md, lg at the button's heights.
  - After copying it shows a check and `copied-label` ("Copied") and announces it through a live region; after `reset-delay` (1600 ms) it is a copy button again. When there is nothing to copy or the browser refuses, it shows a cross and `error-label` ("Copy failed") the same way.
  - Uses `navigator.clipboard.writeText()`, falling back to a hidden textarea and `execCommand('copy')`.
  - Events `copy-success` and `copy-error` (bubbling, composed); methods `copy()` and `reset()`; `slot="icon"` replaces the copy glyph.
- Settings block (`--kakao-copy-button-*`), construction page, demo page; a card on `components.html` (alphabetical, between Combobox and Date input) replacing the "Copy button" placeholder; style guide audit row; changelog entry.

## Capabilities

### New Capabilities
- `copy-button`: what is copied, labelled and icon-only forms, variants and sizes, confirmation and failure states, clipboard access and fallback, events and methods, accessibility, theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/copy-button/{copy-button.js,demo.html,construction.html}`. No dependency on other components.
- Pages: `components.html` (new card, script tag, placeholder removed), `styleguide.html` (audit row). Not on `kitchen-sink.html`: the settings form there has nothing to copy.
- `shared/demo.js` keeps its own Copy button for now (see design).
- `CHANGELOG.md` (Unreleased, Added). `.github/workflows/pages.yml` copies `components/` wholesale, so it is unchanged. No new token, no theme change.
