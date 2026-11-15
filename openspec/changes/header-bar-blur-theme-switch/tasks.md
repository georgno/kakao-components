# Tasks

- [x] 1 Record the open fix in the styleguide's component audit (header bar row)
- [ ] 2 Reproduce in Firefox (and Chromium), in a real window: headless Firefox draws no `backdrop-filter` at all, so it can't show this bug. Scroll, switch theme by ripple (menu) and by fade (step switch); check the blur during the switch, after it, and after scrolling again; confirm whether the view transition is the cause
  - Not done. No real-window reproduction yet, so the view transition as the cause is still unconfirmed.
- [x] 3 Fix the blur, or drop the bar to its solid background while a theme transition runs
  - Solid fallback: the theme switch emits `theme-transition-start` / `theme-transition-end` (trigger API) around a ripple or fade; the bar's surface is solid, without `backdrop-filter` and without its own transition, in between, and gets the blur back one frame after the end.
- [ ] 4 Verify in all seven themes, with and without reduced motion and reduced transparency
  - Headless Firefox only, computed styles on `components.html` and `index.html`: ripple, fade and two queued ripples leave the scrolled surface solid (`backdrop-filter: none`, opaque page colour) from the call until the end, then `blur(14px) saturate(1.5)` and the 78% background return in the new theme; with reduced motion no transition triggers fire and the blur stays; no console errors. Whether the blur is actually drawn again needs a real window.
- [x] 5 Clear the audit row; `CHANGELOG.md` under Unreleased
  - The audit row now names the remaining real-window check instead of being empty; it is cleared with task 4.
