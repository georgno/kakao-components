# Design

## Context

Today every page places its top controls with `position: fixed` (`.page-theme-switch`, `.page-tools`, `.page-nav .kakao-aside-open` in `shared/demo.css` and `shared/construction.css`). They take no room in the flow, so each page's `main` has a top padding that clears them. `components.html` and `kitchen-sink.html` have a `<kakao-aside-menu>` whose built-in hamburger is pinned top left; its panel is `position: fixed` and the menu pushes `<body>` with a margin while open. Construction pages have a sticky preview canvas (`top: 1rem`).

## Goals / Non-Goals

**Goals:**
- One component for the page bar; every project page uses it, with today's controls and behaviour unchanged.
- The current look at scroll top (no visible bar), a frosted bar once scrolled.

**Non-Goals:**
- Collapsing navigation into a menu at phone width (the page decides what it slots).
- Hide-on-scroll-down / show-on-scroll-up behaviour.
- Moving breadcrumbs or page titles into the bar.

## Decisions

**Name: `kakao-header-bar`.** Siblings are named after the native element they stand for (`dialog`, `textarea`, `popover`), or, when that alone is ambiguous, element plus shape (`aside-menu`). `kakao-header` would read like the many in-page `<header>` blocks (every demo has one inside `main`); `header-bar` mirrors `aside-menu` and says it is the bar. "App bar" is Material vocabulary the project doesn't use elsewhere.

**Shadow DOM with slots, not light DOM.** The project rule: light DOM only for components that style page-level things (aside-menu pushes `<body>`, button/number-input/tabs style native-ish internals the page must reach). The bar only styles itself; its children are the page's own controls, which stay in the light DOM through slots, so page CSS (`.page-icon-link`), `aside-menu.css` and `settings-dialog.js`'s `[data-settings-open]` lookup keep working. CSS lives in a `<style>` in the shadow root, one inlineable file. Alternative (light DOM wrapper with a stylesheet) rejected: it would need a second file and expose its internals to page CSS for no gain.

**Structure.** Shadow tree: `<header part="bar">` containing `.surface` (the background layer, `part="surface"`) and three regions `start | centre | end` in a `minmax(0,1fr) auto minmax(0,1fr)` grid, so the title stays centred; the centre region holds the default slot (title) and `<nav part="nav">` around `<slot name="nav">`, hidden (and thus not a landmark) while that slot is empty (`slotchange`).

**Background on a separate layer.** `backdrop-filter` (like `filter`/`transform`) makes an element the containing block for fixed-position descendants in the flat tree. A slotted `<kakao-aside-menu>`'s panel is `position: fixed`; if the header itself carried the blur, the panel would be trapped inside the bar. So the blur and colour sit on `.surface` (absolutely positioned, `inset: 0`, behind the regions), which is not an ancestor of any slot. The host itself gets only `position: sticky; top: 0; z-index`.

**Scroll detection: passive scroll listener.** An IntersectionObserver sentinel would need an element in the page above the bar (the component would have to insert into the document) or would move with the sticky host. One `{ passive: true }` window scroll listener, coalesced with `requestAnimationFrame`, compares `scrollY > 0` and toggles `scrolled` only when it changes; checked once on connect too. `no-scroll-watch` turns it off so previews and container-scrolling pages can drive `scrolled` themselves.

**Colours.** Top: `--kakao-header-bar-bg` (transparent) and `-line` (transparent): matches today's floating controls. Scrolled: `color-mix(in srgb, var(--_scrolled-bg) var(--_scrolled-opacity), transparent)` with `--_scrolled-bg` defaulting to `--kakao-color-page`, opacity 78% (`percent` type, like chip's tint), `blur(14px) saturate(1.5)`, hairline `--kakao-color-line`. Text inherits `--kakao-color-text`. No new tokens; themes are untouched.

**Fallbacks.** `@supports not (backdrop-filter: …)` and `prefers-reduced-transparency: reduce` → solid `--_scrolled-bg`. `prefers-reduced-motion` → no transition. `forced-colors` → `Canvas` and `CanvasText` line.

**Pages.** The bar is the first child of `<body>`, in flow (sticky), so pages drop the fixed rules and reduce `main`'s top padding by roughly the bar's height (4rem). `html { scroll-padding-top }` in demo/construction CSS keeps anchor jumps (`#settings`, style guide TOC, component cards) clear of the bar; the construction canvas sticks below it. On `components.html` and `kitchen-sink.html` the whole `<kakao-aside-menu>` goes into `slot="start"`: its hamburger shows there, its fixed panel still covers the viewport edge (see the surface layer), and at the persistent breakpoint its own CSS hides the button. Its panel stays inside the bar's stacking context (bar z 30 over content, panel z 40 inside), so it still paints above the page.

## Risks / Trade-offs

- [The aside panel lives inside the bar's stacking context] → the bar is above all page content, so the panel still is; only content with z-index > 30 at page level could cover it, and the pages have none.
- [Sticky breaks if an ancestor gets `overflow` other than visible/clip] → the bar is a direct child of `<body>`; `index.html`'s `html { overflow-x: hidden }` propagates to the viewport and is fine.
- [Many pages edited mechanically (≈48 demo/construction pages)] → done with one scripted replacement of the identical `<kakao-theme-switch class="page-theme-switch">` line, then spot-checked in the browser.
- [A right-side aside panel (aside-menu demo) now covers the bar's theme switch] → the panel has its own close button in that corner; the demo's "duck the theme switch" wiring is dropped for the switch (kept for the corner button).

## Migration Plan

Pages only; no component API changes. Rollback is reverting the page edits.
