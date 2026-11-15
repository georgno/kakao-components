# Design

## Context

See proposal.md and specs/avatar/spec.md. Siblings: the badge tints a theme role into the surface (16%) and into the text (72%); the spinner and badge are inline, non-interactive shadow DOM components; the description list uses manual slot assignment to show a subset of its children without touching them.

## Goals / Non-Goals

**Goals:** never a broken-image mark; readable initials in every theme; presence that does not depend on colour; a group that leaves the page's nodes alone; one inlineable file.

**Non-Goals:** interaction (wrap the avatar in a link or button); a tooltip or popover for "+N"; uploading or cropping; `srcset`; depending on the planned `kakao-image`.

## Decisions

**Group as a second element in `avatar.js`.** `kakao-avatar-group` is registered by the same file, so the folder still holds one component file and the component count is unchanged. A `group` attribute on a wrapper `div` would have needed page CSS reaching into shadow roots. Both elements share one settings block: it is one string constant put into both shadow styles, so it exists once in the source and the construction page edits it once.

**Group reaches its avatars through inheritance, not attributes.** The group's `::slotted(kakao-avatar)` rule sets the avatar's private `--_size`, `--_ring-on` and (with `shape`) `--_radius`; a rule from the outer tree wins over the avatar's own `:host` rules, so the group's size and shape apply to all without writing attributes onto the page's nodes. A single avatar gets the ring with the `ring` attribute.

**Overflow by manual slot assignment.** The group's shadow root uses `slotAssignment: 'manual'` and assigns the first `max` avatars; the others stay in the DOM but are not rendered. "+N" is a shadow element (count shown, "N more" read). `total` lets a server render three avatars of 128. Above 99 the element shows "99+" and still reads the real number. A MutationObserver recounts on child changes. Only `kakao-avatar` children are assigned.

**Stacking.** Later avatars lie over earlier ones (document order, no z-index), overlapping by 0.16 of the size: more would cover the initials. A status dot in a group is partly covered; the documentation says to leave it off there.

**Ring colour.** A ring cannot be transparent, so it has to repeat the surface behind it. The default is the `bg` role (cards, where groups usually sit); on the page background or another surface the page sets `--kakao-avatar-ring-color`. The status dot uses the same ring.

**Tone from the name.** A small hash of the trimmed, lower-cased name picks one of five tones (primary, success, warning, danger, neutral). Toned fills are `color-mix(tone 16%, surface)` with initials `color-mix(tone 72%, text)`, the badge's recipe: measured over all seven themes the lowest contrast is 4.7:1. Neutral is text on the strong subtle fill (6.3:1 at the lowest). No colour outside the theme roles. Without a name the tone is neutral.

**Fallback order.** Image; else a slotted icon if the page gave one (an explicit icon is a choice); else initials; else the built-in glyph. The image lies over the fallback at opacity 0 and fades in on `load`: it must stay rendered, because a lazy image with `display: none` never loads. On `error` the `src` is taken off the inner image so no broken mark shows. Once loaded the fallback is hidden, so a transparent picture does not show initials through.

**Status shapes.** Online: filled. Away: lower half filled. Busy: filled with a bar. Offline: an empty ring in the border role. The dot scales with the avatar (0.28, at least 8px) and sits on the circle's edge at 45 degrees, or on the corner of a square.

**Accessibility.** With a name: `role="img"` named "name" or "name, status"; everything inside is hidden. Without name and status: hidden as decoration. The host takes `aria-hidden="true"` where the name is written beside it.

## Risks / Trade-offs

- [Ring colour is wrong on a surface other than a card] → one custom property; shown in the demo.
- [Only five tones, so many people share one] → the initials carry the identity; the tone only varies the row.
- [Group overrides private variables of the avatar] → both live in one file and are one component.
