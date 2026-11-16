## Why

Shadow DOM components draw themselves only once their script has run. Until
then the server's HTML shows them empty or unstyled, and when they upgrade they
take up space and push the page around (a breadcrumb 0 → 28px high, a toc, an
image frame, buttons changing width). `shared/page-cloak.js`, and the same idea
in projects that use the library (ueberschallwolke's blog), hides the page
until the components have drawn. That hides the gap, it does not close it: the
first view waits for every script (and the fonts), up to the 2.5 s safety reveal.

Declarative Shadow DOM closes it: the server sends a component's shadow root
as `<template shadowrootmode="open">…</template>` inside the element, the HTML
parser attaches it before any script runs, and the browser paints the finished
component at once. Supported in Chromium 111+, Safari 16.4+ and Firefox 123+.

## What Changes

- Components accept a shadow root the parser already attached: when
  `this.shadowRoot` exists at construction they adopt (hydrate) it instead of
  calling `attachShadow()` and building it again, then wire their events and
  carry on as usual. Without a declarative root nothing changes.
- Each shadow component can produce its initial shadow markup as a string
  (styles + structure for given attributes and light content), from one source
  shared by the browser code and the server, so the two never drift apart.
- A server-side way to emit it, for plain pages and for Yii projects
  (KakaoHtml in yii2-base): open question, see below.
- Light DOM components (button, chip-list, number-input, table, tabs,
  aside-menu) get the same benefit by the server writing their final light
  markup directly; they adopt it instead of rebuilding.
- `page-cloak.js` stays as the fallback for components not rendered on the
  server yet, and can go once the components on a page all are.

## Open questions

- How the server renders: a Node renderer (`tools/ssr.mjs`) that projects call
  as a step or a small service, a static "first frame" per component (styles
  and reserved size only, no content), or a PHP port of the render functions
  for KakaoHtml. Trade-off: exact output vs. a second runtime.
- Styles: every declarative root carries its own `<style>`; many buttons or
  chips on a page repeat it. Measure the cost; consider a shared stylesheet
  once declarative adopted stylesheets exist.
- Attribute changes before upgrade, and the order of hydration versus the
  components' first-frame (requestAnimationFrame) updates.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `component-conventions`: shadow components hydrate a declarative shadow root
  and can render their initial shadow markup on the server.

## Impact

`components/*/*.js` (the 56 that call `attachShadow`, light DOM ones for
adoption), a render entry point (`tools/` or `shared/`), `shared/page-cloak.js`,
`styleguide.html` (convention), `CHANGELOG.md`; in Yii projects `KakaoHtml`.
Start with what is on screen at load: header-bar, breadcrumb, button, badge,
chip, card, image, toc.
