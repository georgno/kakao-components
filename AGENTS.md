# kakao-components

Light-DOM web components (no shadow DOM) plus shared tokens and themes. No build
step: open the HTML directly, or run `node tools/construct-server.js` (port 8790)
to use the construction pages.

## Rules that bite

- One component per folder: `components/<name>/{<name>.js,<name>.css,demo.html,construction.html}`.
- Component defaults live in the `@kakao-settings` block of its CSS and are edited
  through its `construction.html`, not by hand.
- Shared colours come from `shared/tokens.css`; every theme in `shared/themes.css`
  must keep passing `node tools/check-themes.js`.
- A new component is added to `index.html` and, if it fits, to `kitchen-sink.html`.

## Brief design review

After changing a component, `styleguide.html`, `kitchen-sink.html` or `index.html`,
run the designer before calling the work done:

```
subagent({ agent: "kakao.ux-ui-designer", task: "<what changed> — brief review" })
```

It is read-only. It reports **Blocking** (breaks a decided styleguide rule or is
visibly wrong), **Inconsistency** (differs from sibling components) and
**Question** (a pattern worth promoting into the styleguide). Fix what is
blocking; leave questions for the user to decide.
