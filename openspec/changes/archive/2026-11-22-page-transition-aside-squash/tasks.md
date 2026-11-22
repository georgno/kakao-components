## 1. Verify the work in the tree

- [x] 1.1 `git status` reviewed; nothing in the working tree is discarded,
      reset or reverted (the changes are finished work, not scratch).
- [x] 1.2 Run `node tools/style-check.js` — passes.
- [x] 1.3 Run `node --test` in `tools/style-check` — passes.
- [x] 1.4 Run `node tools/check-themes.js` — passes.
- [x] 1.5 Run `node tools/export-tokens.js --check` — passes (regenerate if
      needed, never hand-edit `tokens.json`).
- [x] 1.6 `git config core.hooksPath .githooks` enabled before committing.

## 2. Close any gap the checks find

- [x] 2.1 `shared/page-transition.js` is reachable from the published site
      (the deploy copies `shared/` wholesale — confirm, no `pages.yml` edit
      unless a list is involved).
- [x] 2.2 `components/aside-menu/construction.html` exposes `effect`;
      `demo.html` shows both effects per the demo-page conventions.
- [x] 2.3 `AGENTS.md` and `CHANGELOG.md` describe what actually shipped.

## 3. Commit on `main`

- [x] 3.1 Logical commits (aside-menu effect and its demo/construction; the
      new `shared/page-transition.js` and its style rules; changelog/docs), each
      one self-contained and passing the checks it can.
- [x] 3.2 Author `georg <georg@example.com>`; no AI attribution, no
      `Co-Authored-By`, no "Generated with" footer.
- [x] 3.3 No secrets, no minified files, no `node_modules`.
- [x] 3.4 No push.

## 4. Review

- [x] 4.1 Designer review (`kakao.ux-ui-designer`) run for the changed
      component/shared files; Blocking findings fixed before the last commit.
- [x] 4.2 Archive this change (`openspec/changes/archive/`) once the tasks are
      done.
