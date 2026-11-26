# kakao-components

Web components plus shared tokens and themes. No build step: open the HTML
directly, or run `node tools/construct-server.js` (port 8790) to use the
construction pages. Six components are light DOM (no shadow root) because they
style page-level things: aside-menu, button, chip-list, number-input, table and
tabs (table wraps and enhances a server-rendered `<table>`). All the others
render into a shadow root (with slots where they take content).

## Rules that bite

- One component per folder: `components/<name>/{<name>.js,demo.html,construction.html}`.
  Light DOM components add `<name>.css`; shadow DOM components keep their CSS in a
  `<style>` inside the shadow root, written in `<name>.js` (page CSS cannot reach in,
  and the component stays one inlineable file). Theme and token values still reach
  them, because `--kakao-*` custom properties inherit through the shadow boundary.
- Component defaults live in the component's one `@kakao-settings` block (in
  `<name>.css` for light DOM, in `<name>.js` for shadow DOM) and are edited through
  its `construction.html`, not by hand.
- Shared colours come from `shared/tokens.css`; every theme in `shared/themes.css`
  must keep passing `node tools/check-themes.js`.
- `tokens.json` is generated (`node tools/export-tokens.js`) from the tokens, themes
  and every settings block, for the Flutter mirror and other platforms; never edit it
  by hand. The pre-commit hook regenerates it from the staged sources and the deploy
  runs `--check`. New CSS syntax in a settings block makes the exporter stop: extend
  `tools/export-tokens/parse.js` (with a test), don't work around it.
- A new component is added to `components.html` (the list page), to the styleguide's
  component audit and, if it fits, to `kitchen-sink.html`. `index.html` is the hero page.
- Every page loads `shared/page-cloak.js` synchronously right after `shared/component-api.js`:
  it keeps the page hidden until the deferred component scripts have drawn, so
  reloads don't flicker. It's for this project's pages only, not part of any component.
- A page that switches screens without a reload loads `shared/page-transition.js` and opts
  in with markup: `data-page-transition` on the in-app links or their container,
  `data-page-transition-content="<key>"` on each region a swap replaces (paired by key;
  screens an in-app link leads to must render the same regions, else the link navigates
  for real), `data-page-transition-script` on the scripts that must run again after a swap.
  Its CSS gives the content region its own `view-transition-name`, or the whole shell fades.
- Demo pages (`<body class="demo-page">`) show every example as a `<kakao-card>`, title in
  `<h3 slot="header">`, one card per row (a `.grid` of them is one column there). A layout
  the example needs inside the card (a row of buttons, a form) goes in a `data-demo-wrap`
  element, not on the card. `shared/demo.js` appends a collapsed "Code" accordion (a
  `kakao-accordion` tile with a small Copy `kakao-button` in its header) to each card's
  footer, so every demo page loads `card.js`, `accordion.js`, `button.js` and `button.css`.
  The code is the example's markup as written, minus its `<h3>`, `<p>` notes, `.toolbar`,
  `.log`, `onclick` and the style checker's `force`. An example whose component is itself a box (accordion, card,
  settings group) stays bare as a `data-example` element, its code tile after it.
  Mark demo-only controls `data-demo-only`, demo-only layout wrappers `data-demo-wrap`
  (see-through: their content counts as the example's own), skip a card with
  `data-no-code`, pull in markup from elsewhere on the page (a sheet, a dialog) with
  `data-code-with="id …"`. For script-driven examples add `<template data-code>` with the
  real API call: markup in it replaces the snippet; a template holding only a `<script>`
  is appended to it.
  This layout is the demo pages' own convention (in `shared/demo.css` under `.demo-page`),
  not a styleguide rule; the other pages that load `demo.css` are not affected.
- A new top-level page (or file a page loads, like `CHANGELOG.md`) must also be added to
  the copy list in `.github/workflows/pages.yml`, or it is missing from the live site.
- The deploy minifies the published copy with `tools/minify-site.mjs` (HTML, JS, CSS;
  settings blocks kept line for line; demo pages kept as written for their code blocks). Sources in the repo stay readable; never commit
  minified files.
- Releases: note changes in `CHANGELOG.md` under Unreleased; on a release, move them
  under the new version, bump the version on `index.html` (hero facts), and tag `vX.Y.Z`.
  Every release gets an annotated tag on its release commit, pushed with it. Consumers
  (vendored copies, the Flutter mirror, other projects' agents) pin a tag, never a commit
  hash or a branch.
- The component count on `index.html` (the hero fact and the written-out number in
  the lede) is not edited by hand: the pre-commit hook in `.githooks/` runs
  `node tools/count-components.js --staged`, which counts the staged `components/<name>/<name>.js` and
  rewrites both. Enable it once per clone with `git config core.hooksPath .githooks`.
- Run `node tools/style-check.js` (the style checker; tests: `node --test`) before
  committing a page or demo change; the deploy runs it too and stops on an error.
  Fix a finding, or put `force` and an `id` on a deliberately wrong example and give
  the reason in `kakao-style.forced.md` (mandatory here). Its rules are
  `tools/style-rules/*.js`; the attribute value table is `VALUES` in
  `tools/style-check/helpers.js`: adding or renaming an enumerated value (a size,
  tone, variant) in a component includes updating it, and a new component lists
  `force` in its header comment.
- Planning goes through OpenSpec (`/opsx:propose` → `/opsx:apply` → `/opsx:archive`).
  Project rules for it are in `openspec/config.yaml`. Archive a change once its tasks are done.

## Brief design review

After any change under `components/`, `shared/`, or to a page (`styleguide.html`,
`kitchen-sink.html`, `index.html`, `components.html`, `tokens.html`), the
assistant runs the designer review before replying, without being asked. One
review per turn, once the edits are done. Each tool has its own copy of the
designer:

- **pi:** `subagent({ agent: "kakao.ux-ui-designer", task: "<files changed> - brief review" })`
  (defined in `.pi/agents/kakao.ux-ui-designer.md`; `.pi/APPEND_SYSTEM.md` adds the trigger).
- **Claude Code:** the Agent tool with `subagent_type: "ux-ui-designer"` and the
  same task text (defined in `.claude/agents/ux-ui-designer.md`).

Skip it only when the change cannot reach the visual system: comments, prose,
commit messages, `tools/`, `openspec/`, `.pi/`, `.claude/`, `AGENTS.md`. If the review
cannot be launched, say so in one line; never skip it silently.

It is read-only. It reports **Blocking** (breaks a decided styleguide rule or is
visibly wrong), **Inconsistency** (differs from sibling components) and
**Question** (a pattern worth promoting into the styleguide). Blocking findings
are fixed in the same turn; the rest are the user's decisions.

The designer's brief lives in `.pi/agents/kakao.ux-ui-designer.md` and
`.claude/agents/ux-ui-designer.md`. Both use the cheapest model tier, read-only
tools and the styleguide as their reference. When you change one brief, change the other too.
