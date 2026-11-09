## 1. Fade

- [x] 1.1 Save `--kakao-scroll-fade` into tokens and the three component settings (bound to it) through `POST /__construct/save`; rebind the header bar's nav fade; add construction and tokens rows (verify: settings blocks and tables list them)
- [x] 1.2 Edge fade in tabs, step switch and switch group (mask by `data-more-left/right`, scroll + resize + content changes) (verify: forced-narrow scroller fades on the hidden side(s) only, none when it fits)
- [x] 1.3 Styleguide rule text, CHANGELOG line (verify: read back)

## 2. Verification

- [x] 2.1 Chromium and Firefox at 390px and 1280px on the three demos and the kitchen sink (verify: fades show on overflow, nothing fades without overflow, no page errors)
