## Why

The Caps Lock warning showed on its own line above the hint, so the hint jumped down a line every time Caps Lock was toggled while typing.

## What Changes

- Hint (or the error that replaces it) and the Caps Lock warning share one line under the field: the hint takes the remaining width and wraps, the warning sits at the end and never wraps. Without a hint the warning still sits at the end. Nothing shown, the line takes no space.
- The strength bar and requirement list stay below that line.

## Capabilities

### Modified Capabilities

- `password-input`: where the Caps Lock warning shows.

## Impact

`components/password-input/password-input.js` only. DOM order inside the shadow root becomes hint, error, caps (inside a `.messages` wrapper); parts unchanged.
