## 1. Audit

- [x] 1.1 For each of the 15 components named in the proposal, find the `.sr` span
      and decide whether its containing block is inside the component (a
      positioned ancestor in its own shadow root or on `:host`) or the initial
      containing block. Record the verdict per component in the change directory
      (`audit.md`), with the line that decides it.
- [x] 1.2 Confirm the symptom first-hand in a browser on the components' own demo
      pages: put the component in a clipped scroller (or use a demo card) and check
      `document.scrollingElement.scrollHeight` against the viewport height. Note the
      numbers for at least `copy-button` before the fix (expected: page height far
      beyond the viewport) and after.

## 2. Fix

- [x] 2.1 Give each escaping component a positioned containing block inside itself:
      `:host { position: relative; }` next to its existing `:host` box rules, or the
      wrapping element that already holds the span. Do not reposition a component
      that is already correct, and do not move the span in the markup.
- [x] 2.2 No new attribute, setting or `--kakao-*` property: this must not touch
      `tokens.json` or any construction page's settings table.
- [x] 2.3 `CHANGELOG.md` → Unreleased: what the bug was (a component with an `.sr`
      span in a scroller grew the page's scrollable height into blank space), which
      components were fixed, and that nothing changes for a page author.

## 3. Verify

- [x] 3.1 `node tools/style-check.js`, `node --test` in `tools/style-check`,
      `node tools/check-themes.js`, `node tools/export-tokens.js --check` all pass.
- [x] 3.2 In the browser, every demo page that was affected now reports
      `scrollHeight` equal to the viewport height (no phantom scroll), at a desktop
      and a narrow width. Record page + numbers in `audit.md`.
- [x] 3.3 The `.sr` text is still invisible and still reachable to a screen reader
      (1×1, clipped, not `display: none`, `role="status"`/label kept).

## 4. Commit

- [x] 4.1 `git config core.hooksPath .githooks` set; logical commits on `main`;
      author `georg <georg@example.com>`; no AI attribution, no `Co-Authored-By`;
      no secrets, no minified files, no `node_modules`; no push.
- [x] 4.2 Archive this change under `openspec/changes/archive/` when the tasks are
      done, and tick the boxes.
- [x] 4.3 Designer review for the changed component files per `AGENTS.md` (or say
      which route you took if the reviewer agent is not launchable).
