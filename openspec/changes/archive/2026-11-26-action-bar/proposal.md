# Proposal

## Why

Consumers build the same floating bar by hand for actions on selected items ("3 marked to fix · Show list · Copy"): sticky or fixed, hidden when nothing is selected, and usually without an announcement, safe-area padding or reduced motion.

## What Changes

- New `<kakao-action-bar>` (shadow DOM, no dependencies, template: kakao-empty-state for the slots, kakao-stack/toast for the safe-area and header-bar offsets): default slot for the summary, `actions` slot for the buttons.
- `position` bottom (default) · top; sticky inside its container by default, `fixed` pins it to the viewport; `count` hides the bar at 0 (or less), shows it above; `hidden` hides it at once.
- Slides in and out from its edge (fades only under reduced motion); count changes are announced through a polite live region (`count-label`, else the summary's text); full width on phones with safe-area padding; a fixed bar publishes `--kakao-action-bar-rendered-height` so the page can keep its last rows reachable.
- Demo, construction page, components.html card, kitchen-sink entry, styleguide audit row, VALUES (`position`), CATALOG line and a "which one?" row (action bar vs toast vs header bar), manifest, loader map, CHANGELOG.

## Capabilities

### New Capabilities
- `action-bar`: the component.

## Impact

components/action-bar/ (new), components.html, kitchen-sink.html, styleguide.html, tools/style-check/helpers.js, CATALOG.md, custom-elements.json, shared/kakao.js, tokens.json, index.html (count), CHANGELOG.md. No breaking change.
