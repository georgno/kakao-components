## Decisions

- **Same rule as the outline siblings.** Copied from date input / password input: `border-color: focus; outline: var(--_focus-width) solid var(--_focus); outline-offset: var(--_focus-offset)` on the field box that holds the native control (`.field:has(input:focus-visible)`), so the ring wraps icons, clear buttons and steppers too. The halo transition is dropped; the border still eases.
- **Error fields** keep a danger border and get a danger outline, as in combobox, tag input and select.
- **Number input** is light DOM; the outline sits on the `<input>` itself, whose box already contains the steppers (stacked arrows and touch buttons are drawn inside its padding).
- **Multi dropdown:** segments overlap by 1px and the focused one is lifted with `z-index: 1`, so its outline draws over the neighbours. Keyboard focus uses the focus colour for border and outline; a box opened by pointer keeps the accent border.
- **Settings:** properties with a new meaning get the sibling names (`-focus`, `-focus-width`, `-focus-offset`). Removed lines are deleted by hand from the settings block (the construction server only adds and changes lines) and from the construction manifest, as with the alert's `-border-mix`.
