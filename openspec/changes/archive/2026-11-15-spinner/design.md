# Design

## Decisions

- **The ring is copied, not shared.** Components never reach into each other, so the spinner draws its own SVG with the button's numbers. The construction page and the demo put a running button next to a spinner so a drift is seen.
- **An arc of 74 of 100.** The circle carries `pathLength="100"`, so `--kakao-spinner-arc` is a plain share of the circle. The button gets the same arc in its own units (42 of 56.55).
- **Stroke in 24ths of the size**, so sm and lg keep the button's proportions without a stroke setting per size.
- **No track by default** (the button has none); `--kakao-spinner-track-opacity` can draw the full circle behind the arc.
- **`currentColor` by default, tones as theme roles.** The ring fits wherever text fits (on ink, in muted text) without a variant per background. The label never takes the tone, so a coloured ring does not colour the sentence.
- **Status, not progressbar.** A `role="status"` element in the shadow root holds the label as hidden text; the ring and the visible label are `aria-hidden`. The status text is written when the spinner shows, which is what makes a polite live region speak, and it is empty during the delay. A page that already announces the state hides the spinner with `aria-hidden="true"`.
- **Delay keeps the space.** While waiting the spinner is `visibility: hidden` at full size, visible label included, so nothing moves when it appears. `hidden` is the on/off switch: removing it starts the wait again, setting it ends the run. Changing `delay` after the spinner shows does not hide it again.
- **Reduced motion follows the button**: no turn, an opacity pulse (0.4 to 1, 1.1s).

## Out of scope

- A value or percentage: that is `kakao-progress`.
- An overlay that covers and blocks a region while it loads.
- Changing the button to use `<kakao-spinner>`.
