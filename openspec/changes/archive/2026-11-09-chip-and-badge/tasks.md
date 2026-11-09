## 1. Success role

- [x] 1.1 Add `--kakao-color-success` to `shared/tokens.css` and every theme in `shared/themes.css`
- [x] 1.2 Add the success-on-bg pair to `tools/check-themes.js`; regenerate blocks and pass

## 2. Badge

- [x] 2.1 `components/badge/badge.js`: shadow DOM, settings block, tones, outline
- [x] 2.2 `demo.html` and `construction.html`

## 3. Chip

- [x] 3.1 `components/chip/chip.js`: tones, swatch, icon and meta slots, ellipsis
- [x] 3.2 Link mode (`href`, `target`, `rel`) and removable mode (`chip-remove`, focus hand-off)
- [x] 3.3 `demo.html` and `construction.html`

## 4. Use them everywhere

- [x] 4.1 Styleguide: `.tag` and `.badge` become `<kakao-badge>`; radius examples use the real chip and badge
- [x] 4.2 Overview: "Missing" labels become outline badges; cards for badge and chip
- [x] 4.3 Construction pages: token and follow chips become removable `<kakao-chip>`s
- [x] 4.4 Kitchen sink: badge and chip where they fit naturally
- [x] 4.5 Styleguide component audit lines; remove the now unused page CSS

## 5. Chip list

- [x] 5.1 `components/chip-list/{chip-list.js,chip-list.css}`: wrapping row, FLIP glide on removal across rows, ghost fade-out, height follow, fade-in, reduced motion
- [x] 5.2 `demo.html` and `construction.html`
- [x] 5.3 Use it: chip demo filters, kitchen sink genres, overview card, styleguide audit
- [x] 5.4 Chip `action` mode (`chip-action`, `focus()`); kitchen sink "More genres" list: × moves a genre there, + moves it back, both lists animate
