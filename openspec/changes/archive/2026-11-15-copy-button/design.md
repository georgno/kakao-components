# Design

## Decisions

- **Its own native button in a shadow root, not a wrapped `kakao-button`.** `kakao-button` is light DOM and styled by `button.css` on the page; that stylesheet cannot reach into a shadow root, and a light DOM copy button would need its own page stylesheet plus `button.css` and `button.js` loaded, for a control that styles nothing at page level. So the component renders `<button type="button">` itself and stays one inlineable file with no dependency. The look is the button's, copied, not shared (as combobox copies the select's panel): heights 36 / 44 / 52, radii 11 / 13 / 15, paddings, label weight, the secondary fill and the ghost hover tint, an icon-only button as a circle.
- **Two differences from `kakao-button`, both following the style guide rather than the button's open to-dos:** focus is the 2px outline in the focus colour (the rule; the button's halo is the audit's open item), and disabled is 0.45 opacity (the proposed single value) instead of 0.2.
- **Variants are secondary and ghost only.** A copy button sits next to the thing it copies and is never the main action of a view; primary and danger have no use here.
- **`value` wins over `for`.** `for` is resolved at click time, first in the button's own root (so it works inside another component's shadow root), then in the document. A source with a string `value` property (input, textarea, select, the kakao inputs) gives that value; anything else gives its `textContent` without the surrounding white space, so a `<pre><code>` block copies as written. One name only (`for`, as on `<label>` and `<output>`); no `target` alias.
- **The button keeps its width.** The label and the copied label are stacked in one grid cell and the three icons in another; only one of each is visible, so the confirmation never makes the row jump. The error label takes room only while it shows: reserving its width would make every "Copy" button as wide as "Copy failed" for a rare state.
- **The name stays, a live region speaks.** The inner button's `aria-label` is the label (or `aria-label`, or "Copy") in every state; the visible label spans are hidden from assistive technology. The result goes into a `role="status"` element in the shadow root, emptied and written a frame later so a second copy is announced again. Success and failure differ by glyph and text, not only by colour (check in the success colour, cross in the danger colour).
- **Nothing to copy is a failure, not a silent no-op**: the error state with `reason: "empty"`. A refused clipboard is `reason: "failed"`.
- **Clipboard access as in `shared/demo.js`**: `navigator.clipboard.writeText()`, and when that is missing (a page not on HTTPS) or rejects, a hidden read-only textarea with `document.execCommand('copy')`. The fallback moves focus to the textarea, so the previously focused element (found through shadow roots) is focused again afterwards.
- **`reset-delay`** in milliseconds, default 1600 (the demo pages' value); `0` keeps the state until `reset()`. The state is readable as the `state` property and as `data-state` on the host, for page CSS.
- **`slot="icon"`** replaces only the copy glyph (the style guide's rule for page-chosen icons). Check and cross stay built in.
- **Motion**: the icons swap with a short fade and scale; under reduced motion they swap at once.

## Out of scope

- Replacing the hand-wired Copy button in `shared/demo.js`. It would make every demo page load `copy-button.js` and changes the look of all code tiles; a separate, site-only change if wanted.
- Copying rich content (HTML, images); text only.
- A tooltip on the icon-only form; there is no tooltip component yet.
