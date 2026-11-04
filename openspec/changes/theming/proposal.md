# Proposal

## Why

The components only had a light look, and most of them hard-coded their greys, so nothing could follow a dark page. The project needs real theming: light and dark now, more themes later. Every theme must stay accessible. A theme switch should let people change the theme, with a ripple that spreads the new theme from the button over the page.

## What Changes

- Colour themes. The colour main variables grow into a full set of roles (text, soft text, muted, page, surface, raised, subtle fills, hairline, control border, ink, danger, focus, each with its "on" colour where needed). `shared/tokens.css` holds the light theme; `shared/themes.css` holds the dark theme and any later ones.
- A theme is chosen with `data-kakao-theme` on `<html>` or on any element. With no choice, the page follows the system's light/dark setting. `data-bs-theme="dark"` (Bootstrap 5.3) also selects dark. `prefers-contrast: more` strengthens muted text and borders.
- New tool `tools/check-themes.js` checks WCAG 2.2 AA contrast for every theme (text 4.5:1; borders, filled controls, focus 3:1). It also regenerates the copied blocks in `themes.css`.
- Every component's colour settings now default to a theme variable, with the old value as the literal fallback. Components used without `tokens.css` look as before.
- New component `<kakao-theme-switch>`: cycles through themes (light and dark by default), remembers the choice, stays in sync across switches and tabs, announces the new theme, and reveals it with a ripple from the button (View Transitions). There is no ripple under reduced motion or without View Transitions support.
- A third theme, Catppuccin (Mocha), and a page-level theme API on the switch class.
- `<kakao-button>` gets a menu (dropdown) form via `list-data`, used for a theme dropdown on the theme switch card and demo.
- Demo, construction, overview, kitchen sink and style guide pages load the themes and show a theme switch. The construction canvas's Light and Dark options preview the component in that theme.

## Capabilities

### New Capabilities
- `theme-switch`: the `<kakao-theme-switch>` component.

### Modified Capabilities
- `button`: menu (dropdown) form.
- `design-tokens`: colour roles and themes, the accessibility check.
- `component-conventions`: component colours follow the theme variables.

## Impact

- New files: `shared/themes.css`, `tools/check-themes.js`, `components/theme-switch/{theme-switch.js,demo.html,construction.html}`.
- Visible change in light mode on pages that load `tokens.css`: one grey family (zinc). Control borders and off switch tracks are darker (3:1). Muted text is darker (`#62626c`). The danger red is `#dc2626` everywhere.
- `--kakao-list-fade-color` is now a colour, no longer an "r,g,b" triplet.
- Tabs lose their `--kakao-tabs-dark-*` settings and the `body.dark-mode` / `data-bs-theme` override. The theme variables do this now.
