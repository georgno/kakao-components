## Context

See proposal.md for why. The repo has two Node tools already (`tools/check-themes.js`,
`tools/construct-server.js`): plain CommonJS, no packages, run with `node`. The
checker follows that pattern. The rules it enforces are the decided ones in
`styleguide.html` (Component rules, Dialog footer, Button order, Naming form
fields). Components appear in this repo's pages (about 1,000 placements over
24 components) and in Yii2 views (`.php`) of projects that use them, where
attribute values are often PHP expressions.

## Goals / Non-Goals

**Goals:**
- One command that fails on a broken rule, in this repo and in a consuming project.
- Rules small enough that adding one is a single file.
- A report that points at the exact element, so fixing is quick.

**Non-Goals:**
- Running a browser or the components. The checker reads markup only.
- Components created by script, and markup built in JS strings.
- A full HTML5 parser or template-language evaluation.
- Auto-fixing. A "baseline" of accepted findings (phpstan-style) is left for later;
  `force` plus the documentation file covers deliberate exceptions.

## Decisions

### A small tolerant markup reader of our own
No packages is a project rule, and a full HTML parser is far more than needed. The
reader:
1. **Masks template regions** first (`<?php … ?>`, `<?= … ?>`, `{{ … }}`, `{% … %}`,
   `{# … #}`): each is replaced by placeholder characters of the same length, keeping
   its line breaks, so every line and column still points at the original file.
   The masked ranges are remembered.
2. **Scans tags** with a tokenizer that understands quoted attribute values, comments
   (`<!-- -->`, skipped), and raw-text elements (`<script>`, `<style>`: content
   skipped, which also skips `<script type="application/json">` manifests).
3. **Builds an element tree** for all elements, not only `kakao-*`: rules need the
   parent and the children, e.g. buttons inside a `<div slot="footer">`. Void elements
   close themselves; an unmatched close tag closes up to its open match or is ignored.

An attribute whose value overlaps a masked range is **dynamic**. Rules get it as
`{ dynamic: true }` and skip checks that need the value.

*Alternative:* regexes per rule. Rejected: relational rules (footer order) need the
tree, and each rule would re-solve quoting and templates.

### Rule modules
Each rule is a CommonJS module in `tools/style-rules/`:

```js
module.exports = {
  id: 'dialog-main-button-corner',
  level: 'error',
  description: 'The main dialog button sits in the footer corner.',
  tags: ['kakao-dialog'],          // which placements it looks at
  check(el, ctx) { return [{ message: '…', el }]; },
};
```

`ctx` offers the shared helpers below, so rules stay short and agree with each other.
Extra folders from the config are loaded the same way. The checker validates each
module's shape at start-up (setup error, exit 2, if broken).

### Shared definitions the rules agree on
- **Filled button:** a `kakao-button` whose `variant` is missing, `primary`,
  `secondary` or `danger`; `ghost` is not filled (the same split the dialog uses for
  its corner radius).
- **Main button:** in a footer, the button with variant `primary`/missing or `danger`;
  if there is none, the first filled one. A dynamic `variant` makes the footer unknown
  and the rule skips it.
- **Footer buttons:** `kakao-button` children with `slot="footer"`, or the
  `kakao-button` children of the element with `slot="footer"`, in document order.
- **Attribute value sets:** read from one table in the helpers, kept next to the
  components' documented values.

### Report and order
Findings are collected, then sorted (path, line, column, rule id) before printing.
Paths are printed relative to the working directory with `/` separators. Files are
read in sorted order. The text format groups by file; `--format json` prints
`{ errors, warnings, forced, findings: [...] }`.

### Forced placements and their documentation file
`force` is read by the checker only; components need no code, just a line in their
documentation. The documentation file is Markdown, one section per forced element:

```md
## legacy-confirm
Old confirm flow, kept until the billing page moves to the new dialog.
```

The heading is the element's `id`; the text below it is the reason. With
`forced.mandatory: true`, a forced element without an `id`, an id without a section,
and a section without a forced element are errors.

*Alternative:* key by file and line. Rejected: lines move with every edit, and the
documentation would go stale constantly.

### Config
`kakao-style.config.json`, all keys optional:

```json
{
  "paths": ["."],
  "ignore": ["archive", "openspec", "node_modules", "shared/vendor"],
  "extensions": [".html", ".htm", ".php", ".phtml", ".twig"],
  "rules": { "card-main-button-first": "warning" },
  "ruleDirs": [],
  "forced": { "file": "kakao-style.forced.md", "mandatory": false }
}
```

### Running it here
This repo gets a `kakao-style.config.json` with its pages and component folders, and
`.github/workflows/pages.yml` runs `node tools/style-check.js` before assembling the
site, so a violation stops the deploy.

## Risks / Trade-offs

- **A tolerant reader can misread odd markup** (unquoted values with `>`, templates
  that open a tag in one region and close it in another). → Tests with fixture files
  for each case; an element the reader can't make sense of is reported as a warning
  (`markup-unreadable`), not silently skipped.
- **Dynamic values hide problems** in Yii2 views. → Accepted: the checker never
  guesses. Rules check what is static.
- **The first run in this repo will find things.** → The tasks include fixing them
  or forcing them with a reason; the deploy step is added only once the repo passes.
- **Rules and components can drift** (a new tone value). → The value sets live in one
  table, and adding a value to a component includes updating it (noted in AGENTS.md).
