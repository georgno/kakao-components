# chip Specification

## Purpose
`<kakao-chip>` is a compact label for things such as file types, tokens or filters. It can carry a colour swatch, an icon and secondary text, act as a link, and be removable.

## Requirements

### Requirement: Chip content
The chip SHALL show its slotted label in a small box (radius 4px) with the same tones as the badge. `swatch` SHALL show a colour square before the label, the `icon` slot SHALL take an icon, and the `meta` slot SHALL show muted secondary text after the label. A label that does not fit SHALL be cut off with an ellipsis instead of breaking the layout.

#### Scenario: Token chip
- **WHEN** a chip has `swatch="#4f46e5"` and a `meta` value
- **THEN** the swatch, the label and the muted value sit on one line

### Requirement: Link chip
With `href`, the chip SHALL render its label as a real link (`target` and `rel` passed through), focusable and with the shared focus ring.

#### Scenario: Following a link chip
- **WHEN** a link chip is activated with Enter
- **THEN** the browser follows its `href`

### Requirement: Removable chip
With `removable`, the chip SHALL show a remove button labelled "Remove <label>" (or `remove-label`). Activating it SHALL fire a bubbling, composed, cancelable `chip-remove` event. Unless the event is cancelled, the chip SHALL remove itself and move focus to the next chip's remove button, else the previous one's, so keyboard focus is not lost. A link chip MAY also be removable; the two controls SHALL stay separate.

#### Scenario: Removing with the keyboard
- **WHEN** a keyboard user activates the remove button of the middle of three chips
- **THEN** that chip is gone and focus is on the next chip's remove button

#### Scenario: Page handles the removal
- **WHEN** a listener calls `preventDefault()` on `chip-remove`
- **THEN** the chip stays, and the page decides what happens

### Requirement: Action chip
With `action` (and no `href`), the chip SHALL render its label as a real button that fires a bubbling, composed `chip-action` event with `{ label, value }` when activated. `chip.focus()` SHALL focus the link or action button, else the remove button.

#### Scenario: Adding a genre back
- **WHEN** an action chip "+ Comedy" is activated with the keyboard
- **THEN** `chip-action` fires with value "comedy"
