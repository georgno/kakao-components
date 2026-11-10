# Design

## Context

Shadow DOM, form-associated like the text input and date input: one inlineable file, styles in the shadow root, defaults in its settings block. The box look is the text input's field.

## Decisions

- **One field, not one per box.** The boxes are drawn (`aria-hidden`); one `<input>` with transparent text, caret and selection lies on top of the whole row. SMS autofill (iOS "From Messages", Android keyboards, Chrome) fills a single field with the whole code; spread over N fields it lands in the first box. Screen readers meet one labelled field with its value and a "6 digits" description, not six unnamed fields. Paste, long-press "Paste", dictation, IME and password managers work natively. The field is on top, not under the boxes, so a long press on a phone reaches it; it is not `opacity: 0` or 1px, which some autofill heuristics skip. Trade-off: the value has no gaps (boxes fill from the left), as in input-otp and most single-field implementations.
- **Selection as the current box.** The component keeps a one-character selection on the current box's character (or a caret after the last one). Typing then overwrites and Backspace clears natively; inserts go through `beforeinput` to filter, overwrite and spread pastes; anything the browser does without `beforeinput` (autofill, IME) is normalised on `input`. Arrow keys, Home and End are handled in keydown (a native ← on a one-character selection would only collapse it). A click picks the box under the pointer, no further than the first empty box.
- **Mask** turns the inner field into a password field, so assistive technology does not read a masked PIN aloud.
- **Focus.** The current box gets the focus border and the shared 2px outline with 2px offset (the date input's field focus); an empty current box shows a caret that blinks unless reduced motion is asked for.
- **Validity.** required + empty → valueMissing; started but incomplete → tooShort; `error` → customError, anchored on the inner field.
- **Forced colours.** The transparent field opts out (`forced-color-adjust: none`), or forced `CanvasText` would show its text over the boxes. Boxes use system colours, the current box Highlight.
- **Narrow space.** Boxes shrink (flex) when the row does not fit, gaps stay; 8 boxes need about 380px at md.

## Risks / Trade-offs

- [iOS autofill inside a shadow root] → not testable here; the field is a normal visible-geometry text field with `autocomplete="one-time-code"`, which is what Safari looks for.
- [No gaps] → clearing a middle box shifts the following characters left. Accepted for one-field simplicity.
