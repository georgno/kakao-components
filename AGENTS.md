# kakao-components

Web components plus shared tokens and themes. No build step: open the HTML
directly, or run `node tools/construct-server.js` (port 8790) to use the
construction pages. Four components are light DOM (no shadow root) because they
style page-level things: aside-menu, button, number-input and tabs. All the
others render into a shadow root (with slots where they take content).

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
- A new component is added to `components.html` (the list page), to the styleguide's
  component audit and, if it fits, to `kitchen-sink.html`. `index.html` is the hero page.
- Every page loads `shared/page-cloak.js` synchronously right after `shared/component-api.js`:
  it keeps the page hidden until the deferred component scripts have drawn, so
  reloads don't flicker. It's for this project's pages only, not part of any component.
- Releases: note changes in `CHANGELOG.md` under Unreleased; on a release, move them
  under the new version, bump the version and the component count on `index.html`
  (the hero facts and the written-out number in the lede), and tag `vX.Y.Z`.
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
