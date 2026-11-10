# Design

## Context

`kakao-dialog` is a plain fixed overlay: the host is `position: fixed; inset: 0`, a `.scrim` and a `.panel` inside the shadow root, visibility delayed on close so the exit can play, a module-level scroll lock counter, a document keydown listener for Escape and a Tab trap, focus moved to the panel on open and returned on close, `data-close` delegation, `contained` for previews. The sheet copies these patterns rather than sharing code: components never reach into each other, and each component stays one inlineable file.

## Goals / Non-Goals

**Goals:** behave like the dialog wherever the two overlap (keys, focus, scroll lock, `data-close`, `no-dismiss`, `contained`, naming), so a page can swap one for the other.

**Non-Goals:** snap points / half-open detents, sheets that push the page (that is the aside menu), corner fitting for footer buttons (the dialog's nesting rule), sharing one scroll lock with the dialog.

## Decisions

- **Modal by default, `modal="false"` opt-out.** A sheet covers a large part of a phone screen and usually holds a task (filters, form); modal is the safe default and matches the dialog. Non-modal is cheap because it is a subtraction: no scrim, no lock, no trap, no `aria-modal`, the host and scrim stay `pointer-events: none` and only the panel takes clicks; Escape is then scoped to focus inside the sheet. Same focus move on open.
- **No `inert` on the page.** The dialog relies on `aria-modal="true"` plus the Tab trap; making the page `inert` would require touching elements the component does not own (the sheet can sit anywhere in the DOM). Kept consistent with the dialog.
- **Focus trap walks open shadow roots.** The dialog's trap only sees light-DOM focusables, so a `kakao-text-input` (focusable inside its shadow root) would be skipped. The sheet collects focusables in tree order, descending into open shadow roots and slots, plus its own close button. The deep active element decides Escape and Tab: if focus sits in something else (e.g. a dialog opened on top), the sheet leaves the key alone; an event with `defaultPrevented` is ignored.
- **Trigger: `for` on the sheet**, a space-separated id list, matching the popover's `for`. One delegated `click` listener on `document` (checks `composedPath()` for an element with a listed id), so triggers added later need no observer. The dialog has no declarative trigger; this does not change it.
- **Sides with logical CSS.** `inset-inline-start/end` and logical radii (`border-start-end-radius` …) place and round start/end sheets; `:host(:dir(rtl))` flips the slide direction. `left`/`right` use physical properties.
- **Spring in, standard out.** Sliding into place along one axis is the styleguide's spring case: `--kakao-ease-spring` over `--kakao-motion-duration` (320ms). The spring overshoots by about 17%, which would lift the sheet off its edge; a "skirt" pseudo-element in the panel colour extends past the outer edge (the full panel size), so the overshoot never uncovers the page. Leaving uses `--kakao-ease-standard` over 200ms (`base`): an exit is not a move into place, and a spring would first pull the sheet inward. The scrim fades on the standard curve. Reduced motion: no transform, opacity only.
- **`sheet-hidden` after the exit.** On close the component reads the panel's computed transition duration and dispatches after it (plus a small margin), instead of relying on `transitionend`, which does not fire with no transition or when interrupted.
- **Cancelable `sheet-hide`.** Dispatched for user dismissals and `hide()`; removing the `open` attribute directly closes without asking (the attribute is already gone), like setting `hidden` on an alert.
- **Built-in close button** in the header (the dialog has none, but a sheet often has no footer and a drag-only dismissal is not accessible). Styled like the alert's close button: ghost square, 6px radius (`sm`), 2px focus outline with 2px offset.
- **Swipe-to-close** only from the handle and header (not the body, so scrolling is never hijacked), with pointer events and pointer capture; `touch-action: none` on those parts. Threshold: a quarter of the height or a flick faster than 0.5px/ms.
- **Stacking: z-index 50**, between the aside menu (40) and the dialog (60): a confirm dialog opened from a sheet appears over it; toasts (70) stay visible over a sheet.
- **Width:** start/end 24rem, `min(width, 100%)` so a 390px phone gets the full width. Bottom/top: `--kakao-aside-sheet-max-width` 42rem (the dialog's `lg`), centred, so lines stay readable on desktop; set it to `none` for edge-to-edge.
- **Scroll edges:** the header and footer get a hairline in the theme `line` colour while the body has content scrolled past them, so the cut-off text has an edge.

## Risks / Trade-offs

- [Separate scroll lock from the dialog] → if a dialog and a sheet are closed out of order, the second unlock restores the first's saved state. Nested (LIFO) use, the normal case, works because each saves and restores in turn. Documented as a shortcut.
- [Spring overshoot on a tall sheet is large] → the skirt hides the gap; the duration and easing are settings if it reads too lively.
- [Scrim 45% black does nothing on amoled] → same shortcut as the dialog; the overlay ring carries the edge.

## Open Questions

- Should bottom sheets be full width on desktop by default instead of 42rem?
- Should the dialog adopt the shadow-root-aware focus trap?
