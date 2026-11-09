## 1. Header bar

- [x] 1.1 Save `--kakao-header-bar-padding-x: 1.25rem` and new `--kakao-header-bar-nav-fade: 1.5rem` through `POST /__construct/save`; add the fade row to `components/header-bar/construction.html` (verify: settings block shows both, construction page lists the row)
- [x] 1.2 Nav edge fade in `header-bar.js` (mask by `data-more-start/end`, scroll + ResizeObserver + slotchange) (verify: 390px, fade only where more to scroll; none at 1280px)
- [x] 1.3 Publish `--kakao-header-bar-rendered-height` on the root element for a body-level bar; document it in the header comment (verify: value equals bar height in the browser)

## 2. Pages and tokens

- [x] 2.1 Save `--kakao-space-below-bar: 8px` into `shared/tokens.css` via the server; add its row to `tokens.html` (verify: tokens page lists it)
- [x] 2.2 `shared/demo.css`, `shared/construction.css`: `--page-bar-height` from the published height; content top padding from the token; `index.html` uses the token and drops the gutter override (verify: grep shows no `4rem` bar literal left)
- [x] 2.3 Styleguide rule "Overflowing horizontal scrollers get an edge fade" in Component rules; CHANGELOG line under Unreleased

## 3. Verification

- [x] 3.1 Headless Chromium and Firefox at 390px and 1280px on index.html, components.html, a demo and a construction page: gutters line up with content, anchors land below the bar, fade appears/disappears correctly, aside-menu push keeps the bar in place

## Workflow follow-up

- Archive the change with `openspec archive header-bar-polish`.
