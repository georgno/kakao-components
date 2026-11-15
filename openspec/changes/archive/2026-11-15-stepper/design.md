# Design

## Decisions

- **Shadow DOM, rendered from `list-data`.** The steps are data (label, description, state), not content, and the markers, lines and compact form are all derived from them, so there is no slot. Theme values reach in through the inherited `--kakao-*` properties.
- **Stepper versus step switch.** `kakao-step-switch` is a radiogroup with a draggable thumb that holds a form value. The stepper is an ordered list that shows a position in a flow and holds no form value. To keep the two apart the stepper's change event is `stepper-change` (the step switch already fires `step-change`); only `step-select`, the activation of a clickable step, uses the `step-` prefix. The demo shows both side by side.
- **`current` is a 0-based index or a value.** A value is matched first, then a number. An index equal to the number of steps means finished: every step done, none current. When the attribute named a value, the component keeps writing values back; otherwise the index.
- **States.** Position gives done / current / upcoming. A step's own `state` adds `error` (any position, also on the current step) or `done` (a step finished out of order). Done is a primary fill with a check in the surface colour, which holds contrast in light and dark themes because primary flips with the theme; current is a primary outline with the number and a heavier label; upcoming is the control border with muted text; error is danger with an exclamation mark and the hidden word "Error", so no state is told by colour alone.
- **Narrow widths: a compact form, measured on the element.** A horizontal stepper collapses when its own width divided by the number of steps is under `--kakao-stepper-min-step-width` (6rem), found with a ResizeObserver and a hidden probe that resolves the setting to pixels. It goes by the element, not the viewport, so it also works in a narrow column and three short steps still fit on a phone. The compact form is one line ("Step 2 of 4", the current label, its description) over a bar with a segment per step, the current segment a little taller. This was chosen over falling back to vertical: on a phone a vertical list of four steps takes the first screen and pushes the form down, while the wizard's question is only "where am I". The list stays in the DOM (labels visually hidden), so screen readers get the same ordered list; the summary line is hidden from them. `collapse="always"` and `"never"` override.
- **Clickable is opt-in.** Without it nothing is focusable. `clickable` makes the steps before the current one native buttons, `clickable="all"` every step but the current one. Activation fires a cancelable `step-select`; the default action moves the stepper, the same pattern as the breadcrumb's navigate event, so a wizard can validate and cancel. Arrow keys, Home and End move focus between the buttons; each stays in the tab order. After a pick, focus moves to the new current step so it is not lost with the removed button. In the compact form a button keeps a 24px-high target around its thin segment.
- **Words.** `KakaoStepper.texts` (done, error, summary, complete) is set once for every stepper, like the breadcrumb's start text.

## Out of scope

- Step content panels, validation and routing: the page owns them.
- Disabled steps, sizes, and a label-beside-marker horizontal layout.
- Animated line fill between states.
