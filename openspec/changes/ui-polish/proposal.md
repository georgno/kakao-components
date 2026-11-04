# Proposal

## Why

A review round brought six notes: dropdown buttons need a way to drop the chevron, the segmented toggle's resting shadow is too heavy, the tabs look unbalanced (especially on phones), the steppers of the slider and number input are too small for touch, and cards need a component that can pick up the colour of their main action.

## What Changes

- `<kakao-button>`: `no-chevron` hides the dropdown chevron. Icon-only dropdowns stay round with it and become a pill without it. Examples with ⋯ and ⋮ actions menus.
- Segmented toggle: the pressed item has no shadow at rest. The shadow fades in and out once when an item becomes pressed.
- `<kakao-tabs>`: equal-width columns, no width shift when the bold selected label appears, 44px total height, focus outline on the thumb radius, tighter tabs on phones, and the selected tab kept in view when the row scrolls. This also fixes three thumb bugs: scroll offset, resize, and the hard-coded padding.
- `<kakao-slider>`: on touch screens (or with `touch-steppers`) the input group becomes `| < | value unit | > |` with 44px buttons that repeat while held.
- `<kakao-number-input>`: on touch screens (or with `touch-steppers`) the arrows become 44px − and + buttons on the right. Arrows repeat while held, with any pointer.
- New `<kakao-card>`: header, body and footer, plus a subtle glow in the colour of the footer's first button.

## Capabilities

### New Capabilities
- `card`

### Modified Capabilities
- `button`, `tabs`, `slider`, `number-input`

## Impact

- New files in `components/card/`. New construction settings for button, tabs, slider and number input.
- Kitchen sink: the "Notifications" tab is now "Alerts", so four tabs fit on a phone.
