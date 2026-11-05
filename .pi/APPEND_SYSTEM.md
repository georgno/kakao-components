# This project: kakao-components

A design system: light-DOM components, and one living rulebook in
`styleguide.html`.

## Design review runs on its own after a change

Whenever you have changed anything under `components/`, `shared/`, or one of
`styleguide.html`, `kitchen-sink.html`, `index.html`, `tokens.html`, run the
design review **before you write the reply**. One review covers the whole turn:

```
subagent({ agent: "kakao.ux-ui-designer", task: "<files changed, one line each> — brief review" })
```

- Run it once your edits for this turn are done — not after every file, and not
  again for the same change.
- Do not ask whether to run it, and do not wait for the user to request it.
- The designer is read-only. It answers with **Blocking**, **Inconsistency** and
  **Question** findings.
- Fix Blocking findings in the same turn. Report Inconsistencies and Questions
  to the user in one or two lines each; they are the user's decisions.
- Skip it only where the change cannot reach the visual system: comments, prose,
  commit messages, `tools/`, `.pi/`, `AGENTS.md`.
- If the review cannot be launched, say so in one line. Never skip it silently.

## House rules the reviewer will hold you to

- A component's defaults live in the `@kakao-settings` block as
  `--_name: var(--kakao-name, fallback)`; the construction page parses exactly
  that form, one setting per line.
- Every colour defaults to a theme variable, and every theme in
  `shared/themes.css` has to pass `node tools/check-themes.js`.
- A new component gets a `demo.html`, a `construction.html`, a card on
  `index.html`, and lines in the styleguide's component audit.
