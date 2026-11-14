# Proposal

## Why

Projects built on the library need error pages (404, 500, 503 maintenance …) and today each one writes its own. They all show the same few things: the status code, a short title, a sentence of explanation, some reference for support (a request id, a time) and a way out (go home, try again). A component that takes those as attributes and draws them consistently, themed like the rest of the library, saves that work and keeps error pages from looking like a different product.

## What Changes

- New component `<kakao-error-page>` (`components/error-page/`), shadow DOM. The page passes the content; the component draws it:
  - `code` (e.g. `404`): drawn very large, tabular numerals, in the primary colour, and as a diagonal repeating pattern in the background.
  - `heading` (the error's name, "Page not found"); known codes get an English default heading. `heading-level` (1 to 6, default 1): the error is the page's main content. The code is part of the heading for assistive technology ("Error 404: Page not found"), `code-label` names the "Error" prefix.
  - `message` (or the default slot for richer text).
  - The usual extras in muted text: `reference` (request or trace id, easy to select), `time` (an ISO date-time is shown in the page language inside a `<time>`), labels `reference-label` / `time-label`, and `list-data` for more label/value rows.
  - Slots `actions` (e.g. kakao-button links "Go home", "Try again") and `details` (anything longer: a list, a contact line, a stack trace in development).
- Background: a decorative (aria-hidden) diagonal pattern of the code: rows of the code text, rotated, staggered, theme coloured at low opacity, so text on top keeps its contrast. Angle, size, weight, spacing and opacity are settings; `no-pattern` turns it off; hidden in forced colours and print.
- Two layouts: embedded (default; a framed box with a minimum height, for a panel or a card) and `full` (fills the viewport height below the header bar, no frame, sits on the page background).
- Settings block (`--kakao-error-page-*`), construction page, demo page; card on `components.html` (alphabetical, between Dialog and Error summary), style guide audit row, changelog entry.

## Capabilities

### New Capabilities
- `error-page`: content attributes and defaults, heading semantics, info rows, slots, the code pattern, embedded and full layouts, theming hooks, phone width.

### Modified Capabilities

None.

## Impact

- New: `components/error-page/{error-page.js,demo.html,construction.html}`. No dependency on other components (actions are whatever the page slots in).
- Pages: `components.html` (new card; the "Empty state" placeholder stays, it is a different thing), `styleguide.html` (audit row). Not on `kitchen-sink.html`: a settings form has no place for an error page.
- `CHANGELOG.md` (Unreleased, Added). `.github/workflows/pages.yml` copies `components/` wholesale, so it is unchanged. No new token, no theme change.
