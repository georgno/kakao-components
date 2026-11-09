## Context

`<kakao-header-bar>` renders into a shadow root; its settings block defines `--_x: var(--kakao-header-bar-x, default)` on `:host`, so the defaults are visible only inside the bar, never to the page content beside it. The page CSS (`shared/demo.css`, `shared/construction.css`) needs the bar's height for `scroll-padding-top` and the construction canvas's sticky offset, and currently repeats `4rem`.

## Goals / Non-Goals

**Goals:** one source for the bar height; one gutter; a visible overflow cue for the phone nav; a named gap below the bar.

**Non-Goals:** changing the bar's layout, the aside-menu push, or the look of the nav links.

## Decisions

- **Height: the bar publishes its measured height.** A bar whose parent is `<body>` (the page bar; previews sit in cards) sets `--kakao-header-bar-rendered-height` on `document.documentElement` from a `ResizeObserver` (border-box block size, px), and removes it on disconnect. Page CSS: `--page-bar-height: var(--kakao-header-bar-rendered-height, 0px)`. Alternatives: moving the height default into `tokens.css` would make the construction page's height setting dead (the token would always win); keeping `var(--kakao-header-bar-height, 4rem)` in the page still duplicates the literal and misses a bar that grows past its min-height. ResizeObserver callbacks run before paint, and `page-cloak.js` keeps the page hidden until the components have drawn, so the 0px fallback is never seen.
- **Gap token in `shared/tokens.css`, not in the bar's settings.** The gap is applied by the page (padding on `main`), which cannot read the bar's settings (they live on the bar's shadow host, and custom properties inherit downward only, never to siblings). A main variable on `:root` reaches every page, sits with the other `--kakao-space-*` values, and is edited on `tokens.html`. Name `--kakao-space-below-bar`, value `8px`; added through the construction server's save so the settings block stays tool-written.
- **Gutter: change the bar's `padding-x` default to 1.25rem** (saved through the construction server), and delete `index.html`'s phone-only override. Desktop pages then also use 1.25rem, which matches the content gutter of every page's `main`.
- **Edge fade: `mask-image` on the `<nav>`,** chosen by two attributes the script toggles (`data-more-start`, `data-more-end`), in physical left/right after resolving `direction`. Updated by a passive `scroll` listener on the nav, coalesced to one rAF, plus a `ResizeObserver` on the nav and on `slotchange`. Attributes are only written when the state changes. Fade width is a new setting `--kakao-header-bar-nav-fade` (1.5rem).

## Risks / Trade-offs

- [The bar writes a property on the root element] → only the body-level bar, a clearly bar-prefixed name, removed on disconnect; documented in the component header.
- [The mask can soften a focus ring at a faded edge] → the focused link is scrolled into view by the browser, so it sits clear of the fade except at the very edge.
