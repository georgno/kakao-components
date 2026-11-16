# Proposal

## Why

Icon-only controls show their name only through the native `title` (kakao-button sets it on its inner `<button>`). `title` never shows on iOS and rarely on Android, appears late, cannot be themed and is not keyboard-reachable, so sighted touch and keyboard users never see what an icon means.

## What Changes

- New component `<kakao-tooltip>` (`components/tooltip/`), shadow DOM: a small themed label next to a control.
  - Opt-in on any element with `data-tooltip="Text"` (one shared bubble, created by the script), or a dedicated `<kakao-tooltip for="id">Text</kakao-tooltip>` for one anchor. Plain text only. `placement` / `data-tooltip-placement`: `top` (default), `bottom`, `left`, `right`, flipping and clamping to stay on screen. `data-tooltip=""` turns it off for that element.
  - Mouse: shows after a short hover delay (instantly when moving from one tooltip anchor to the next), stays while the pointer is over the anchor or the label itself, hides on leave. Keyboard: shows on `:focus-visible`, hides on blur. Escape hides it (and is consumed, so it does not also close a surrounding dialog). WCAG 1.4.13: dismissable, hoverable, persistent.
  - Touch: a long-press (500ms, cancelled by moving more than 10px, scrolling or lifting the finger) shows it; the click that would follow is swallowed, the context menu / callout / text selection on the anchor is suppressed. It hides on the next tap anywhere, on scroll and after 3 seconds.
  - Never the accessible name: `aria-label` stays the name. `aria-describedby` is added only when the text differs from the anchor's name.
  - While shown for an element, that element's own `title` is put aside, so the native tooltip does not appear as well; it is restored on hide.
  - `inline` draws a static sample in the text flow (construction and overview previews).
  - Events `tooltip-show` / `tooltip-hide` on the anchor; trigger `tooltip-ready` through `KakaoComponents`, registered.
- `kakao-button` (minimal): when `kakao-tooltip` is defined (or becomes defined: the `tooltip-ready` trigger), an icon-only button puts its name in `data-tooltip` on the inner `<button>` instead of `title`. Precedence unchanged: an own `title` wins, `title=""` turns it off; an author `data-tooltip` on the host wins over both. Without the tooltip script, everything stays as now (`title`).
- Settings block (`--kakao-tooltip-*`, colours from the `ink` / `on-ink` theme roles), construction page, demo page (button case, any element, `for`, placements, touch long-press), card on `components.html` (alphabetical, after Toc), style guide audit row, kitchen sink (icon buttons there get it), `VALUES` for `placement`, changelog.

## Capabilities

### New Capabilities
- `tooltip`: opt-in, triggers (hover, focus, long-press), dismissal, placement, title suppression, accessibility and theming hooks.

### Modified Capabilities
- `button`: an icon-only button's name is shown as a hover tooltip (`title`), and moves to `data-tooltip` when `kakao-tooltip` is loaded.

## Impact

- New: `components/tooltip/{tooltip.js,demo.html,construction.html}`.
- `components/button/button.js`: `_syncTitle` and `_mirrorDataAttrs`, plus a `tooltip-ready` subscription and a `register()` call. No other component changes.
- Pages: `components.html`, `styleguide.html`, `kitchen-sink.html`. `tools/style-check/helpers.js` (`VALUES`). `CHANGELOG.md`. `.github/workflows/pages.yml` copies `components/` wholesale: unchanged. No new token or theme change.
