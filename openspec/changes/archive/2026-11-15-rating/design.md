# Design

## Decisions

- **Shadow DOM, native radio buttons.** The component styles nothing at page level, so it follows the shadow DOM rule. Each selectable value is an invisible `<input type="radio">` laid over its symbol (two per symbol with half steps), inside a `role="radiogroup"`: one tab stop, Space picks, and a screen reader announces "3 of 5, radio button, 3 of 5" style positions without any ARIA widget code. The arrow keys, Home and End are handled by the component (the native arrow behaviour wraps around and has no Home/End): they clamp at the ends, and left/right swap in right-to-left text.
- **Filled colour: the warning role.** `--kakao-rating-fill` defaults to `var(--kakao-color-warning, #b45309)`. It is the theme's amber/gold, which is what people expect of rating stars, and it is the one hue role every theme already has to keep at 4.5:1 on the surface (`check-themes.js`: warning on bg), so the filled symbol passes the 3:1 for graphics everywhere: measured 4.1:1 at worst (umber, on the raised surface), 5.2:1 or more on `bg` in every theme. Primary was the alternative; it would make a rating look like a selected control (switch, slider fill) and is only checked at 3:1 on the page. The role name says "warning", but the component uses it as a colour, like the avatar's tones; a project changes it with one property.
- **Empty symbols are an outline in the control border role**, not the line or subtle role. With no rating the empty symbols are all there is to see of the control, so they need the 3:1 of a control edge; `border` is the role checked for that (on `bg` and `page`). Filled and empty differ by shape (solid against outline), not only by colour. `--kakao-rating-empty-fill` (transparent) can give the empty star an inside.
- **Partial fill by clipping.** Each symbol has an empty layer and a filled layer on top, clipped to a width (0 to 100%) from the inline start, so half symbols and right-to-left work without separate glyphs. An operable rating snaps the value to the step; a read-only one shows any fraction (4.3) exactly, since averages are its main use.
- **`value` is a number, 0 for none.** The attribute is reflected when the user picks (as in the radio group) and removed when cleared. Nothing is submitted without a rating, like unchecked radios. The reset default is the `value` attribute as the page wrote it: the property setter and user picks do not change it.
- **Clearing is an option** (`clearable`): activating the current value again (click, Space) or Delete / Backspace. No separate clear button; a page that wants one calls `clear()`.
- **Read-only is an image**: `role="img"` named "<label>: 4 of 5", no radios, no tab stop; the value is still submitted, like a read-only field. Disabled is not submitted and also follows a disabled fieldset.
- **One text pattern**, `value-text` ("{value} of {max}"), names each radio, the read-only image and the optional visible text (`show-value`), so a translation is one attribute.
- **Own symbol by copying.** A slotted node can only be shown once, so the `symbol` slot is hidden and its nodes are cloned into every position (page CSS therefore does not reach them: inline SVG in currentColor or a text character). Without `symbol-empty`, the empty position is the same symbol greyed and at 0.45 opacity, which also works for emoji; that is below 3:1, so an outline version in `symbol-empty` is the accessible choice and the demo shows it.
- **Preview is its own event.** Hovering (mouse and pen, not touch) fills the symbols up to the pointer and sends `rating-preview` with the value, `null` on leaving. It is not `input`: the value has not changed. Picking sends `input`, `change` and `rating-change` (`{ value, previous }`); the radios' own events are stopped inside.
- **Sizes**: symbols 20 / 24 / 32px; each cell adds 2px around, so the smallest target is 24x24px. With half steps a target is half a cell wide; the keyboard and the neighbouring half remain.
- **Motion**: the hovered symbol grows slightly (`--kakao-rating-hover-scale`); not under reduced motion.

## Out of scope

- Steps other than 1 and 0.5.
- A count next to the stars ("128 reviews") as its own attribute; `value-text` or page text covers it.
- Per-symbol labels ("Poor", "Good") and tooltips.
