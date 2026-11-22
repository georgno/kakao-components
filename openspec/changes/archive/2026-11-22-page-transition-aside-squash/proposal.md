## Why

The parent app (`sonne.yii3`) already runs on uncommitted work in this repo:
`shared/page-transition.js` (new, untracked) plus an `effect` attribute on
`kakao-aside-menu`. Until that work is committed on `main`, the app's gitlink
points at a tree that cannot build its shell, and the demo site cannot publish
it.

## What Changes

- Commit `shared/page-transition.js` as a supported shared script: swap marked
  content regions of an in-app page without a reload, inside
  `document.startViewTransition`, with ordinary navigation as every fallback.
- Commit the `kakao-aside-menu` `effect` attribute (`push` default, `squash`),
  including its construction-page control, demo example and the page-bar
  counter-move rules in `shared/construction.css` / `shared/demo.css`.
- Keep `tools/style-check` in step with the new enumerated `effect` values.
- Record all of it under `CHANGELOG.md` → Unreleased.

## Impact

`shared/page-transition.js`, `shared/construction.css`, `shared/demo.css`,
`components/aside-menu/{aside-menu.js,aside-menu.css,demo.html,construction.html}`,
`tools/style-check/{helpers.js,tests/rules.test.js,tests/fixtures/rules/*}`,
`components.html` (the catalogue description), `CHANGELOG.md`, `AGENTS.md`.

No push to `origin` in this change; the operator publishes.
