# Tasks

- [x] 1 Record the open fix in the styleguide's component audit (header bar row)
- [ ] 2 Reproduce in Firefox (and Chromium), in a real window: headless Firefox draws no `backdrop-filter` at all, so it can't show this bug. Scroll, switch theme by ripple (menu) and by fade (step switch); check the blur during the switch, after it, and after scrolling again; confirm whether the view transition is the cause
- [ ] 3 Fix the blur, or drop the bar to its solid background while a theme transition runs
- [ ] 4 Verify in all seven themes, with and without reduced motion and reduced transparency
- [ ] 5 Clear the audit row; `CHANGELOG.md` under Unreleased
