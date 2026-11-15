# Proposal

## Why

Lists of people, comment threads and "who is on this" rows have nothing to show a person with, and the components page still lists Avatar as missing. A bare `<img>` shows a broken-image mark when the file is missing, has no fallback for people without a picture and no way to show presence.

## What Changes

- New component `<kakao-avatar>` (`components/avatar/`), shadow DOM, inline, not interactive.
  - `src` image, loaded lazily (`loading="lazy"`), fading in over the fallback; the fallback stays when the image fails.
  - `name` is the text alternative and the source of the initials (first letter of the first and last word); `initials` overrides them.
  - Icon fallback: `slot="icon"` (inline SVG) or a built-in person glyph when there is no name.
  - `size` xs, sm, md (default), lg, xl; `shape` circle (default) or square (rounded).
  - `tone`: by default picked from the name, always the same for the same name, out of neutral, primary, success, warning and danger; tinted like the badge so text contrast holds in every theme.
  - `status` online, away, busy, offline: a dot that differs by shape as well as colour, with a text for assistive technology (`status-label` overrides it).
  - Events `avatar-load` and `avatar-error`.
- New element `<kakao-avatar-group>` in the same file: overlaps its avatars with a ring in the surface colour, `max` shows "+N" for the rest, `total` counts avatars the page did not render, `size` and `shape` apply to all, `label` names the group.
- Settings block (`--kakao-avatar-*`, shared by both elements), construction page, demo page; a card on `components.html` (alphabetical, between Aside sheet and Badge) replacing the "Avatar" placeholder; style guide audit row; changelog entry.
- `shared/demo-images/`: three tiny SVG stand-in portraits for demo pages.

## Capabilities

### New Capabilities
- `avatar`: image with lazy loading and fallback, initials, icon, sizes, shape, tone from the name, status dot, accessibility, group with overlap and overflow, theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/avatar/{avatar.js,demo.html,construction.html}`, `shared/demo-images/portrait-{1,2,3}.svg` (`shared/` is copied whole by the deploy). No dependency on other components, in particular not on the planned `kakao-image`.
- Pages: `components.html`, `styleguide.html`. Not on `kitchen-sink.html`: the form there has no people.
- `CHANGELOG.md` (Unreleased: Added, Site only). No new token, no theme change.
