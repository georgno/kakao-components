# Design

## Context

See proposal.md - Why. Shadow DOM component like card and alert: one inlineable file, styles in the shadow root, defaults in its settings block. Style guide rules that apply: standard easing for size changes, durations via `--kakao-motion-duration` (320ms); radius lg 14px for cards, md 10px for inner containers; focus is `outline: 2px solid var(--kakao-color-focus)` with a 2px offset on `:focus-visible`; sentence case; the card keeps no shadow (elevation level 0), so the accordion has none either.

## Goals / Non-Goals

**Goals:** a disclosure that is a sibling of `<kakao-card>` at the top level, correct disclosure semantics and keyboard behaviour, the same motion in Firefox and Chromium, and nesting that stays light three levels deep.

**Non-Goals:** a disabled state, roving arrow-key focus between headers (the APG accordion option; Tab order is enough for a disclosure list), a wrapping `<kakao-accordion-group>` element, interactive controls inside the header, heading semantics for the header.

## Decisions

- **Native `<details>` / `<summary>` in the shadow root, not a button with `aria-expanded`.** The summary is exposed as a button with an expanded state in Chromium, Firefox and Safari, Enter and Space work, content of a closed details is neither focusable nor read, and find in page and fragment links open it in browsers that support that, all without code. If the script's animation fails the element still opens and closes. A custom button would need `aria-controls` across a slot plus `inert`/`hidden` handling for the closed body. Cost: the summary cannot sit inside a heading, so screen-reader heading navigation does not list accordions (see Risks).
- **Height animation with the Web Animations API, not `::details-content` + `interpolate-size`.** `interpolate-size` is Chromium-only, and Firefox is the reference browser. The script takes the summary's click (which keyboard activation also fires), prevents the native toggle and animates a `.panel` wrapper: opening sets `details.open` first and grows from 0 to the measured height; closing shrinks to 0 and clears `details.open` at the end. An interrupted animation restarts from the current rendered height. The panel clips only while animating, so focus outlines inside the body are not cut at rest. Easing `--kakao-ease-standard` (a size change), duration `--kakao-motion-duration`. The chevron is a CSS transform transition with the same duration and easing, driven by a class set at the start of the change, so both move together. Changes made by the browser itself (find in page) arrive as the native `toggle` event and are synced without animation.
- **State flows through the `open` attribute.** Header clicks and the methods set or remove `open`; `attributeChangedCallback` animates and dispatches `accordion-toggle`. The native `toggle` event only syncs browser-made changes. That way the attribute, property, event and animation can't disagree, and pages that set the attribute get the same behaviour.
- **Groups in script.** Native `<details name>` only groups within one tree, and each accordion has its own shadow root, so opening one closes the other open `kakao-accordion[name="…"]` in the same root node (document or shadow root). On connect, an open accordion whose group already has an earlier open member closes, as native details do.
- **Nesting looks by depth.** Depth = number of `kakao-accordion` ancestors in the light DOM, worked out on connect and written as `data-look` inside the shadow root; `variant` overrides it. The style guide treats the card as the one bordered surface; a card in a card doubles borders, radii and padding. So:
  - *card* (level 1): `--kakao-color-bg`, 1px `--kakao-color-line` border, 14px radius, header padding 1rem × 1.25rem, body 0 1.25rem 1.25rem: the card's 1.25rem sides.
  - *tile* (level 2): no border, `--kakao-color-subtle` fill, 10px radius (md, the inner-container step), padding 0.75rem × 1rem, title one step smaller. A fill instead of a border keeps it inside the card without a second outline; sibling tiles are separated by the body gap. Secondary buttons share the subtle fill, so the tile sets `--kakao-button-secondary-bg` to the surface colour for its content.
  - *row* (level 3+): transparent, a hairline above in 12% text colour over transparent (like the button ring), so it shows on the card surface and the tile fill in every theme (`line` equals `subtle` in Catppuccin, `subtle-strong` is too faint), no side padding, so its text lines up with the tile's text and the tile's padding is the indent. From level 4 rows indent by `--kakao-accordion-row-indent` (1rem) so a fourth level is still distinguishable.
  - The body of every look is a flex column with the card's gap, so nested accordions and other content are spaced the same way.
- **Focus outline on the whole accordion.** The summary fills the top of the card, so an outline with a 2px offset on the summary alone would cross the card's border. The ring goes on the details element with `:has(> summary:focus-visible)` and follows the look's radius; the summary's own outline is removed.
- **Event name** `accordion-toggle` (component-prefixed, like `alert-hide`), bubbling and composed, `detail { open, name }`. The native `toggle` doesn't leave the shadow root.

## Risks / Trade-offs

- [No heading semantics] → the header is a summary (button role), which can't be a heading child. Pages that need heading navigation put the accordions under a real section heading; documented in the header comment.
- [Content in the header is flattened into the button name] → the `meta` slot is for short text or a badge, never controls; documented.
- [Depth is fixed on connect] → moving an accordion reconnects it, which recomputes depth; changing `variant` restyles at once.
- [Find in page opens without animation] → rare, and the state stays in sync.
