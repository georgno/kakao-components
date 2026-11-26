# Tasks

## 1. Upgrade notes

- [x] 1.1 Add the upgrade note to every version (Unreleased … 0.1.0) from its Changed, Removed and Fixed entries: Unreleased (stack.js before toast.js; data-stack-state), 0.9.0 (--kakao-radius), 0.5.0 (focus-ring-width settings), 0.4.0 (card theme-glow), 0.3.0 (--kakao-alert-border-mix); none elsewhere. Verify with `grep -c '^\*\*Upgrade:\*\*' CHANGELOG.md` = number of versions + 1.
- [x] 1.2 Changelog intro: one sentence on the upgrade note. AGENTS.md: every entry that breaks something adds its bullet to the version's upgrade note. Verify by reading the diffs and loading changelog.html.
