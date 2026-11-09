# Proposal

## Why

Pages have no way to show an inline message ("Settings saved", "Payment failed") in the library's look: the overview lists "Toast / alert" as missing, and pages fall back to hand-styled `role="status"` boxes. An inline alert comes first; a floating toast builds on it later.

## What Changes

- New component `<kakao-alert>` (`components/alert/`), shadow DOM: an inline message in the page flow with an optional title, the message (default slot), an icon per tone and an optional close button.
- `tone` attribute (the name badge and chip already use): `info` (default), `success`, `warning`, `danger`; `error` is accepted as an alias of `danger`. Changing it at runtime restyles the alert and updates its role live.
- Roles: `role="alert"` for warning and danger, `role="status"` for info and success, unless the author set a role.
- `dismissible` adds a close button with an accessible label (`close-label`, default "Close"); it fires a cancellable `alert-hide` before hiding.
- Auto-hide: info and success alerts fade out and hide after a default time (a setting, 8 seconds); warning and danger alerts stay until closed. `duration="<ms>"` sets the time for any tone, `duration="0"` turns it off. The timer pauses while the pointer is over the alert or focus is inside it, and while the page is hidden. Under `prefers-reduced-motion` there is no fade, the alert still hides.
- Methods `show()`, `hide()` and `close()` (alias); events `alert-show`, `alert-hide` (cancellable) and `alert-hidden`, also emitted as triggers.
- New main colour role `--kakao-color-warning` in `shared/tokens.css` and every theme, checked for 4.5:1 on the surface by `tools/check-themes.js`.
- Settings block (`--kakao-alert-*`), construction page, demo page; listed on `components.html` (replacing the "Toast / alert" placeholder; a "Toast" placeholder stays), in the style guide audit and on `kitchen-sink.html`.

## Capabilities

### New Capabilities
- `alert`: the inline alert component: tones and roles, title / icon / message, dismissing, auto-hide timer and its accessibility limits, methods and events, theming hooks.

### Modified Capabilities
- `design-tokens`: the colour roles gain `warning`, which must pass 4.5:1 on the surface in every theme.

## Impact

- New: `components/alert/{alert.js,demo.html,construction.html}`.
- Tokens and themes: `shared/tokens.css` (via `tokens.html`), `shared/themes.css`, `tools/check-themes.js` (new pair), `tokens.html` manifest.
- Pages: `components.html`, `styleguide.html` (warning role, audit row), `kitchen-sink.html`.
- `CHANGELOG.md` (Unreleased). No new top-level file, so `.github/workflows/pages.yml` is unchanged.
