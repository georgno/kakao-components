# Design

## Context

Both controls lay out as `[control] [text]` in a flex row with `align-items: flex-start`, and `.text` has `padding-top: 1px`. The label line is `1.4 × font-size` tall (21.3px at md), the control is 16/20/24px, so the control's centre sits 2.8px (sm), 1.6px (md) and 0.2px (lg) above the label line's centre (measured in Firefox). Radio options have `option-gap: 12px` plus `option-padding: 8px 10px` (for the hover pill), about 29px between rows; pages stack checkboxes with `gap: .5rem` (8px), the checkbox demo with `.6rem`.

## Goals / Non-Goals

**Goals:** control centred on the first label line at every size; radio rows and checkbox stacks 8px apart (4px grid).
**Non-Goals:** a checkbox-group component or setting; changing the horizontal radio layout beyond what the shared gap setting implies.

## Decisions

- **Make `.control` exactly one label line tall (`height: 1lh`, fallback `1.4em`) and centre the box in it.** The control's centre is then the first line's centre by construction, for any font size, line height or box size, and independent of hint/error/wrapping. Alternatives: computing a `margin-top` from box size and line height (breaks when a setting changes), or a grid with the label in the control's row and `align-items: center` (centres on a wrapped label's whole block, not its first line). For Inter Tight the line box centre coincides with the cap-height centre, which is the usual optical anchor for checkbox-style controls, so no extra nudge is added.
- When the box is taller than the line (lg checkbox, 24px vs 22.4px), the flex centring lets it overflow the control evenly by under 1px; nothing clips it.
- The hidden native input fills the control instead of the box's top-left square; it is invisible and the whole label is the hit area anyway.
- The checkbox's inline-flex row gets `vertical-align: top`: with the box centred in a taller control, the row's synthesized baseline moved and opened a ~2.5px gap under each checkbox in its host's line box.
- Drop `.text { padding-top: 1px }`; it only existed to nudge the text down.
- **Radio spacing:** `option-gap 4px` and `option-padding 2px 8px` give 2+4+2 = 8px between rows, on the 4px grid, while the hover pill keeps a little padding. Horizontal groups keep `gap: calc(option-gap * 1.6)`, now ~6px plus the 16px of pill padding. Alternative `option-gap 0`/`padding 4px 8px` would leave horizontal options with no gap at all.
- Checkbox stacks are page markup, not a component setting; the checkbox demo's `.6rem` goes to `.5rem` so every page uses 8px.

## Risks / Trade-offs

- [`lh` unsupported in very old browsers] → `1.4em` fallback declared first, matching the default line height.
- [Pages that relied on the old radio spacing] → the values remain settings; a page can set the old ones back.
