# Tasks

## 1. Theme variables

- [x] 1.1 Extend the colour main variables in `shared/tokens.css` to the full set of roles and list them on `tokens.html`.
- [x] 1.2 Write `shared/themes.css`: the dark theme, its OS-preference copy, a scoped light copy, Bootstrap `data-bs-theme` support and `prefers-contrast: more`.
- [x] 1.3 Write `tools/check-themes.js` (contrast pairs plus `--fix` for the generated blocks). Verify both themes pass.

## 2. Components

- [x] 2.1 Bind every component colour setting to a role, keeping the old literal as the fallback. Turn the list fade into a colour. Drop the tabs dark settings.
- [x] 2.2 Theme the demo, construction, overview and kitchen sink page styles. Make the construction canvas's Light and Dark options set `data-kakao-theme`.

## 3. Theme switch

- [x] 3.1 Write `components/theme-switch/theme-switch.js` (themes, storage, sync, ripple, a11y).
- [x] 3.2 Add its `demo.html`, `construction.html` and overview card, and put a switch on every page.
- [x] 3.3 Verify in Firefox: dark screenshots of the overview, demos and construction pages, and a ripple run (`::view-transition-new(root)` animation runs to the end).

## 4. Docs

- [x] 4.1 Style guide: Themes section, contrast findings, audit table.
- [x] 4.2 Project context in `openspec/config.yaml`: themes rule.

## 5. Theme dropdown

- [x] 5.1 Add the Catppuccin (Mocha) theme; it passes `check-themes.js`.
- [x] 5.2 `<kakao-button>` menu form: `list-data`, `selected`, `show-selected`, keyboard, events, settings on its construction page, examples on its demo.
- [x] 5.3 Page-level `setTheme()` / `current()` on the theme switch; theme dropdown on the theme switch card and demo. Verify the keyboard flow and theme change in Firefox.
