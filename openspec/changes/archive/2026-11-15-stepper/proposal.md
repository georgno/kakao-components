# Proposal

## Why

Wizards and checkouts need to show how far along someone is, and the components page still lists Stepper as missing. A bare `<ol>` has no states, no connecting lines and no answer for a phone, where four labelled steps do not fit in a row. The name is close to the existing `kakao-step-switch`, so the difference has to be stated: the step switch is a form control that picks a value, the stepper shows progress through a flow.

## What Changes

- New component `<kakao-stepper>` (`components/stepper/`), shadow DOM.
  - Steps from `list-data`: strings or `{ label, description?, value?, state? }`; `state` is `error` or `done`.
  - `current`: 0-based index or a step's value; steps before it are done, after it upcoming; the number of steps means finished. The attribute reflects the state.
  - Semantic `<ol>` with an accessible name (`label`), `aria-current="step"`, hidden "Done" / "Error" words; numbers, check and exclamation marks as inline SVG in currentColor; connecting lines.
  - `orientation` horizontal (default) or vertical.
  - `collapse` auto (default), always, never: a horizontal stepper with less room than `--kakao-stepper-min-step-width` per step becomes a summary line ("Step 2 of 4" and the current label) over a segmented bar.
  - `clickable` (done steps) or `clickable="all"`: steps become buttons, with arrow keys, Home and End between them; a cancelable `step-select`, then the stepper moves and fires `stepper-change`.
  - Methods `next()`, `previous()`, `goTo(indexOrValue)`; properties `steps`, `current`, `value`, `compact`; `KakaoStepper.texts` for the words.
- Settings block (`--kakao-stepper-*`), construction page, demo page (with a side-by-side comparison to the step switch); a card on `components.html` (alphabetical, after Step switch) replacing the "Stepper" placeholder; style guide audit row; changelog entry.

## Capabilities

### New Capabilities
- `stepper`: steps and states, current step, semantics, orientation, compact form, clickable steps, methods and events, theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/stepper/{stepper.js,demo.html,construction.html}`. No dependency on other components.
- Pages: `components.html` (new card, placeholder removed), `styleguide.html` (audit row). Not on `kitchen-sink.html`: it is one settings form with tabs, not a multi-step flow.
- `CHANGELOG.md` (Unreleased, Added). `.github/workflows/pages.yml` copies `components/` wholesale, so it is unchanged. No new token, no theme change.
