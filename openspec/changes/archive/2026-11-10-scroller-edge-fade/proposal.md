## Why

The styleguide now decides that overflowing horizontal scrollers get an edge fade (see `header-bar-polish`). Tabs, the step switch and the switch group also scroll sideways when they don't fit, without that cue, so they break the rule.

## What Changes

- New main variable `--kakao-scroll-fade` (1.5rem): one fade width for every sideways scroller.
- `kakao-tabs`, `kakao-step-switch` and `kakao-switch-group` fade the edge(s) with more to scroll, none when everything fits, with the header bar's approach (mask on the scroller, `data-more-left` / `data-more-right`, updated on scroll and resize). New settings `--kakao-tabs-scroll-fade`, `--kakao-step-switch-scroll-fade`, `--kakao-switch-scroll-fade`, all defaulting to the main variable; `--kakao-header-bar-nav-fade` follows it too.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tabs`, `step-switch`, `switch-group`: edge fade when scrolling sideways.
- `design-tokens`: the scroll fade width main variable.

## Impact

`components/{tabs,step-switch,switch-group,header-bar}`, their construction pages, `shared/tokens.css`, `tokens.html`, `styleguide.html`, `CHANGELOG.md`.
