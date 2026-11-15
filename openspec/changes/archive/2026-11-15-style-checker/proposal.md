## Why

The styleguide's decided rules (the main dialog button sits in the corner, an
unlabelled field needs an `aria-label`, a JSON attribute is `list-data`, and
others) are only prose today. They are checked by a design review that reads
diffs, so a wrong placement in this repo or in a Yii2 project using the
components slips through. A deterministic checker, run like phpstan, turns
those rules into errors that fail a build.

## What Changes

- A command-line style checker, `node tools/style-check.js [paths…]`: it reads
  HTML and template files (`.html`, `.php`, `.twig`, …), finds every
  `<kakao-*>` placement and checks it against the rules. It prints one line per
  problem (`file:line  rule-id  message`) with a summary, and exits non-zero
  when any error remains. Node only, no packages, like the other tools.
- Style rules as code: one small JS module per rule, each with an id, a level
  (error or warning), a message and a check. A first set covers the decided
  rules that can be read from markup.
- A config file (`kakao-style.config.json`): default paths, rules switched off or
  set to warning, extra rule folders for a project's own rules, and the
  forced-placement documentation settings.
- A new boolean attribute `force` that every component accepts. It changes
  nothing in the browser. To the checker, a forced placement's rule violations
  are not errors: they are listed in a separate "forced" section of the report.
- Optional documentation of forced placements in one file (default
  `kakao-style.forced.md`), keyed by element id with a reason. Off by default;
  when switched on (`forced.mandatory: true`), a forced placement without an
  entry is an error, and so is an entry whose placement no longer exists.
- This repo runs the checker: its pages pass it, and the deploy workflow runs
  it before publishing, so a violation stops the deploy.

## Capabilities

### New Capabilities
- `style-checker`: the command-line checker, its rules-as-code format, its
  configuration, its report and exit codes, and the forced-placement log and
  documentation.

### Modified Capabilities
- `component-conventions`: every component accepts the boolean `force`
  attribute, which has no runtime effect.

## Impact

- New: `tools/style-check.js`, `tools/style-rules/` (one module per rule),
  `kakao-style.config.json`.
- Every component's documentation lists `force`; no component behaviour changes.
- This repo's pages are fixed or forced until they pass.
- `.github/workflows/pages.yml` runs the checker before the site is assembled.
- `AGENTS.md` and `openspec/config.yaml` mention the checker.
- Components created by script (`document.createElement`) are outside the
  checker's reach; it reads markup only.
