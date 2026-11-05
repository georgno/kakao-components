# kakao-components

Web components plus shared tokens and themes. No build step: open the HTML
directly, or run `node tools/construct-server.js` (port 8790) to use the
construction pages. Most components are light DOM (no shadow root) because they
style page-level things; card, dialog, text input, textarea and the pickers use
a shadow root with slots.

## Rules that bite

- One component per folder: `components/<name>/{<name>.js,<name>.css,demo.html,construction.html}`.
- Component defaults live in the `@kakao-settings` block of its CSS and are edited
  through its `construction.html`, not by hand.
- Shared colours come from `shared/tokens.css`; every theme in `shared/themes.css`
  must keep passing `node tools/check-themes.js`.
- A new component is added to `components.html` (the list page) and, if it fits, to `kitchen-sink.html`. `index.html` is the hero page.

## Brief design review

`.pi/APPEND_SYSTEM.md` makes this automatic: after any change under `components/`,
`shared/`, or to a page, the assistant runs

```
subagent({ agent: "kakao.ux-ui-designer", task: "<files changed> — brief review" })
```

before replying, without being asked. One review per turn.

It is read-only. It reports **Blocking** (breaks a decided styleguide rule or is
visibly wrong), **Inconsistency** (differs from sibling components) and
**Question** (a pattern worth promoting into the styleguide). Blocking findings
are fixed in the same turn; the rest are the user's decisions.

The designer's brief lives in `.pi/agents/kakao.ux-ui-designer.md` — cheapest
model tier, read-only tools, the styleguide as its reference.
