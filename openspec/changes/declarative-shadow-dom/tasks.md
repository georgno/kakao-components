# Tasks

- [ ] 1 Decide how the server renders (Node renderer, static first frame, or PHP port) and how a Yii project calls it; write it down in this change
- [ ] 2 Hydration in one component first (breadcrumb): adopt an existing `this.shadowRoot`, wire events, no rebuild; same look and behaviour with and without a declarative root
- [ ] 3 One render source for the initial shadow markup, used by the browser code and the server, for that component
- [ ] 4 Verify in Firefox (reference) and Chromium: no layout shift on reload with `page-cloak.js` off, no console errors, attribute changes after upgrade still work
- [ ] 5 Roll out to the components on screen at load: header-bar, button (light DOM), badge, chip, card, image, toc; then the rest
- [ ] 6 Measure the cost of repeated `<style>` in many declarative roots; decide on sharing
- [ ] 7 Make `page-cloak.js` a fallback only (skip waiting when every component on the page came hydrated)
- [ ] 8 Convention in the styleguide; `CHANGELOG.md` under Unreleased
