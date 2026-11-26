---
name: kakao-ui
description: Build web pages with kakao-components (kakao-* web components, plain JS, no build step). Use when a project vendors the library (a kakao/ folder with VERSION and CATALOG.md) or a page uses <kakao-*> tags, and when building or changing such a page, form, table or dashboard.
license: MIT
metadata:
  author: kakao-components
  version: "1.0"
---

kakao-components: web components for server-rendered pages (PHP, Python, plain HTML). Plain JS, no build step, no framework, light and dark themes. Use it for every UI piece it has; write your own markup only for what CATALOG.md lists nothing for.

**Read `kakao/CATALOG.md` first** (a few thousand tokens): one line per component (what for, what not, what to use instead), the "which one?" table for look-alikes, the shared attribute contract. The full API per tag is `kakao/custom-elements.json`. Copy from `kakao/templates/page.html` (a starting page) and `kakao/recipes/` (report, dashboard, form, table, list-detail) rather than starting blank.

## Vendor and pin

The library is copied into the project, never linked to a branch. In a checkout of kakao-components, on a release tag:

```sh
git checkout vX.Y.Z
node tools/vendor.js ../myproject/web/kakao            # everything
node tools/vendor.js ../myproject/web/kakao toast tabs  # only these and what they need
```

`kakao/VERSION` holds the tag; the vendored copy also brings this skill (`kakao/skills/kakao-ui/`: copy it to `.claude/skills/` or `.pi/skills/` so it matches the code). To upgrade, vendor a newer tag into the same folder (it is replaced) and read that version's `**Upgrade:**` lines in the library's CHANGELOG.md. Never edit files under `kakao/`.

## Page head and base

```html
<link rel="stylesheet" href="kakao/shared/kakao.css">
<script src="kakao/shared/kakao.js"></script><!-- no defer: theme before first paint -->
```

`kakao.js` loads every `<kakao-*>` tag the page uses (also tags added later), with its dependencies and light-DOM CSS; no other script tags. Before calling a component's methods: `kakaoLoader.ready.then(…)` (everything in the parsed page) or `kakaoLoader.load('kakao-toast').then(…)`.

`kakao.css` is tokens, font and themes only: it has **no body styles**. Every page needs the base from `templates/page.html`:

```css
body { margin: 0; background: var(--kakao-color-page); color: var(--kakao-color-text);
  font: 1rem/1.5 var(--kakao-font-family); -webkit-font-smoothing: antialiased; }
h1 { font-size: 1.75rem; font-weight: 650; line-height: 1.2; letter-spacing: -0.02em; }
a { color: var(--kakao-color-primary); }
```

Several pages with the same shell can swap their content instead of reloading: add `<script src="kakao/shared/page-transition.js"></script>` after kakao.js, `data-page-transition` on the header bar, `data-page-transition-content="content" tabindex="-1"` on `<main>` of every page, `data-page-transition-script` on page scripts (wrap them in `{ … }`, bind document/window listeners with `{ signal: kakaoPageTransition.signal }`). Details: CATALOG.md and the file's header.

Shell: `<kakao-header-bar>` first in `<body>` (title, `slot="nav"` links, `<kakao-theme-switch slot="end">`), then `<main><kakao-page><kakao-flow gap="lg">…`. Space comes from `kakao-flow` / `kakao-grid` and `--kakao-space-*`, colours from `--kakao-color-*`: no hard-coded colours, no margins of your own between blocks.

## Rules that bite

- **Without the loader**, load each light-DOM component's CSS file yourself (button.css, tabs.css, table.css, … : CATALOG.md marks them "light DOM, x.css") and the components it needs first ("after …"), then `shared/component-api.js` before any component script.
- JSON configuration goes in `list-data`, never `data`. Escape it as HTML in attributes: PHP `htmlspecialchars(json_encode($d), ENT_QUOTES)`, Python `html.escape(json.dumps(d))`, JS `el.setAttribute('list-data', JSON.stringify(d))`.
- Only the documented values: `tone` neutral · primary · success · warning · danger (write `danger`, never `error`); `size` sm · md · lg. Check a tag's values in custom-elements.json before using one.
- `label` is the accessible name; icon-only controls always get one. Text in sentence case, never all caps.
- `hidden` is not honoured by every component yet: hide a wrapper element instead.
- Events have no `kakao-` prefix (`tab-change`, `sheet-show`), except the button's: `kakao-button-action`, `kakao-button-select`, `kakao-button-menu`.
- A bar's size matches its buttons: `<kakao-action-bar size="sm">` holds `size="sm"` buttons.
- Links in text stay `<a>`; every action is a `<kakao-button>` (variant primary · secondary · ghost · danger).

## Known gotchas

- `form.reset()` does not clear `kakao-text-input` (nor `kakao-textarea`, `kakao-checkbox`): reset their `value` / `checked` yourself.
- `KakaoToast.show({ tone, message })` exists only once a `<kakao-toast>` is in the page or after `kakaoLoader.load('kakao-toast')`: wait for that promise.

## Before you finish

1. Run the style checker from the library checkout on your pages: `node <kakao-checkout>/tools/style-check.js path/to/pages` (0 errors; it also reports missing or misordered files on pages without the loader).
2. Look at every page in the light and the dark theme, and at 390px width (no sideways scroll). `node <kakao-checkout>/tools/visual-check.js page.html` (or a dev server URL) takes those screenshots into the temp folder and checks console errors, sideways scroll, unnamed controls, focus rings and reduced motion; it needs Playwright (`npm i playwright && npx playwright install chromium`, and it says so). Open the screenshots; the checks don't replace looking.
3. Use it with the keyboard only: every control reachable, focus visible, dialogs and sheets trap and return focus.
4. Turn on reduced motion: nothing slides or rolls that matters.
5. No console errors.
