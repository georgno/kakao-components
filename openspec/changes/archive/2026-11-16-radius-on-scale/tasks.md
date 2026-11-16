# Tasks

## 1. Tokens

- [x] 1.1 `shared/tokens.css` and `tokens.html`: remove `--kakao-radius`; update the construct-server comment example. Verify: grep finds no `--kakao-radius` without a step.

## 2. Components and shared styles

- [x] 2.1 Aside menu and number input move from `--kakao-radius` to `--kakao-radius-md`. Verify: grep.
- [x] 2.2 Popover radius `var(--kakao-radius-xs, 4px)`.
- [x] 2.3 Every off-scale corner literal in `components/` and `shared/` moves to the nearest step (ties up, hairlines xs) through its token; on-scale internal literals refer to their token. Verify: a scan finds no fixed px corner outside `var(--kakao-radius-<step>, …)`.

## 3. Pages

- [x] 3.1 `styleguide.html`: Shape text and audit radius column match the code; new Component rule "Button titles show as tooltips". Verify: `node tools/style-check.js`, `node --test`, `node tools/check-themes.js`.
- [x] 3.2 Headless Firefox look at a few changed components.
- [x] 3.3 `CHANGELOG.md` Unreleased entry.
