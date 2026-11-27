---
name: kakao-ui
description: Build web pages with kakao-components (kakao-* web components, plain JS, no build step). Use when a project vendors the library (a kakao/ folder with VERSION and CATALOG.md) or a page uses <kakao-*> tags, and when building or changing such a page, form, table or dashboard.
license: MIT
metadata:
  author: kakao-components
  version: "1.1"
---

kakao-components: web components for server-rendered pages (PHP, Python, plain HTML). Plain JS, no build step, no framework, light and dark themes. Use it for every UI piece it has; write your own markup only for what CATALOG.md lists nothing for.

Paths below assume the library sits in `kakao/` (relative to the page and to where you run the commands); adjust them if the project put it elsewhere.

## Workflow (follow it in this order)

1. **Pick the components.** Read `kakao/CATALOG.md`: one line per component (what for, what not, what to use instead) and a "which one?" table for look-alikes.
2. **Start from a copy, never from a blank page.** `kakao/templates/page.html` is a starting page; `kakao/recipes/` has complete pages: `report.html` (summary tiles, badges, tabs, accordions), `dashboard.html` (stat tiles, progress, table), `form.html` (validation, error summary), `table.html` (filtered, paged grid-view), `list-detail.html` (list plus aside-sheet). Copy the closest one and change `../shared/` to the path of `kakao/shared/`. If none fits the whole page, start from the template and copy sections from several recipes.
3. **Look up every tag before you write it:** `node kakao/tools/api.js kakao-tabs` prints its attributes with their allowed values, slots, events, methods and an example (about 1k tokens). Use only what it lists. Several at once: `node kakao/tools/api.js tabs toast badge`.
4. **Check:** `node kakao/tools/style-check.js path/to/page.html` must report 0 errors. Fix what it names and run it again.
5. **Look:** `node kakao/tools/visual-check.js path/to/page.html` (or a dev server URL) takes light, dark and 390px phone screenshots and checks console errors, sideways scroll, unnamed controls, focus rings and reduced motion. The phone shots are a touch screen (touch layouts show). A view the page shows only after a click (a units switch, a tab) is checked with `--state name=selector`, repeatable. It needs Playwright and says how to install it. Open the screenshots.

## Page head and shell

```html
<link rel="stylesheet" href="kakao/shared/kakao.css">
<script src="kakao/shared/kakao.js"></script><!-- in <head>, no defer: theme before first paint -->
```

- `kakao.js` loads every `<kakao-*>` tag the page uses (also tags added later), with its dependencies and CSS. Add no other kakao script or link tags.
- `kakao.css` brings tokens, font, themes and the page base (body, h1, links). Its rules have no specificity, so your own CSS always wins.
- Before calling a component's methods from a script: `kakaoLoader.ready.then(() => …)`, or `kakaoLoader.load('kakao-toast').then(() => …)`.

Shell of every page:

```html
<body>
<kakao-header-bar>
  <strong>App name</strong>
  <a slot="nav" href="/" aria-current="page">Overview</a>
  <kakao-theme-switch slot="end"></kakao-theme-switch>
</kakao-header-bar>
<main>
  <kakao-page>
    <kakao-flow gap="lg">
      <h1>Title</h1>
      <section>
        <kakao-flow>
          <kakao-section-header heading="Section" count="3"></kakao-section-header>
          …
        </kakao-flow>
      </section>
    </kakao-flow>
  </kakao-page>
</main>
</body>
```

Things the library has no component for, and what to use:
- **Stat tiles** (a label and a big number): `<kakao-grid min="sm">` of `<kakao-card>`, each with `<h3 slot="header">Label</h3><p class="stat">12</p>` and the `.stat` rule from `recipes/dashboard.html` in the page's `<style>`.
- **A row of buttons** in a form: a plain `<div>` (they wrap with a small gap by themselves).

Space comes from `kakao-flow` (vertical gaps) and `kakao-grid` (columns that wrap), colours from the `--kakao-color-*` tokens, spacing from `--kakao-space-*`.

## Rules

- **Never invent attributes or values.** If `api.js` doesn't list it, it doesn't exist.
- `tone`: neutral · primary · success · warning · danger (write `danger`, never `error`). `size`: sm · md · lg.
- JSON configuration goes in `list-data`, never `data`. Escape it in HTML attributes: PHP `htmlspecialchars(json_encode($d), ENT_QUOTES)`, Python `html.escape(json.dumps(d))`, JS `el.setAttribute('list-data', JSON.stringify(d))`.
- `label` is the accessible name; an icon-only control always gets one.
- Every action is a `<kakao-button>` (variant primary · secondary · ghost · danger); links in text stay `<a>`.
- No hard-coded colours, no margins between blocks (use kakao-flow), no CSS for things a component already draws.
- Text in sentence case, never uppercase. No thick coloured stripe on one side of a box; use a tint, a full thin border or weight.
- Events have no `kakao-` prefix (`tab-change`, `sheet-show`), except the button's: `kakao-button-action`. `api.js` lists each tag's events.
- A bar's size matches its buttons: `<kakao-action-bar size="sm">` holds `size="sm"` buttons.

## Without the loader

Only if the project loads single files: load each light-DOM component's CSS (CATALOG.md marks it "light DOM, x.css") and the components it needs first ("after …"), and `shared/component-api.js` before any component script. `style-check` reports what is missing or in the wrong order.

Several pages with the same shell can swap their content instead of reloading: `shared/page-transition.js` (see CATALOG.md).

## Vendor and pin (setting the library up, or upgrading it)

In a checkout of kakao-components, on a release tag:

```sh
git checkout vX.Y.Z
node tools/vendor.js ../myproject/web/kakao            # everything
node tools/vendor.js ../myproject/web/kakao toast tabs  # only these and what they need
```

`kakao/VERSION` holds the tag; vendored from a commit that is not a tag, it holds `git describe` instead (`v0.11.0-3-g1a2b3c4`: 3 commits past v0.11.0), or a bare commit hash when no tag is reachable. Vendor again from a tag before you ship. Copy `kakao/skills/kakao-ui/` to `.claude/skills/` (or `.pi/skills/`) so the skill matches the code. To upgrade, vendor a newer tag into the same folder and read that version's `**Upgrade:**` lines in the library's CHANGELOG.md. Never edit files under `kakao/`.

## Known gotchas

- `kakao-alert` with `tone="info"` or `"success"` hides itself after 8 s; a lasting note needs `duration="0"`.
- `kakao-animated-number` is monospace by default (an odometer): in a heading or next to text, set `--kakao-animated-number-font-family: var(--kakao-font-family)`.
- `kakao-number-input` sends `change` once a stepper press ends (like a native field); update live from `input`.
- `kakao/tools/` holds the checkers (`api.js`, `style-check.js`, `visual-check.js`): run them from the project, as `node kakao/tools/…`. visual-check needs Playwright, which is not vendored.

## Before you finish

1. `node kakao/tools/style-check.js <your pages>`: 0 errors.
2. Light and dark theme, and 390px width without sideways scroll (`visual-check.js` does all three).
3. Keyboard only: every control reachable, focus visible, dialogs and sheets trap and return focus.
4. Reduced motion: nothing important slides or rolls.
5. No console errors.
