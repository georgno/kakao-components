# Proposal

## Why

The library promises "no dependencies", but two components quietly rely on Font Awesome. The button's `run()` success check is drawn as `<i class="fas fa-check">`, so without Font Awesome on the page the success state shows nothing. The text input's `icon` attribute puts the icon class on an element inside its shadow root, where page CSS (Font Awesome included) cannot reach, and that element is hidden while empty, so the attribute renders nothing at all. The demo site does use Font Awesome, and should say so instead of implying the components need it.

## What Changes

- Rule: a component draws every glyph of its own (checks, chevrons, spinners, close marks) as inline SVG in `currentColor`; it never depends on an icon font.
- `<kakao-button>`: the `run()` success check becomes an inline SVG in the stroke style of the chevron and menu check.
- `<kakao-button>`: a child element with `slot="icon"` (an inline `<svg>`, an `<img>`, or an `<i>` with icon-font classes) is moved into the icon position and follows `icon-position` (left, right, only). The `icon` attribute stays as an optional shortcut that needs an icon font loaded on the page; a slotted icon wins over it.
- `<kakao-text-input>`: a named `icon` slot in front of the field. Slotted content stays in the light DOM, so page CSS reaches it. The `icon` attribute keeps working honestly: it creates a light-DOM `<i slot="icon">` with those classes (only while no own slotted icon is present), so an icon font on the page now actually draws it.
- Demo pages show a native inline SVG icon next to a Font Awesome one; header comments document both ways.
- Landing page: the "no dependencies" claim stays for the components, with a short note that the demo site loads Font Awesome, which is optional for your own use.
- Style guide: the rule above, and that user icons come through a slot or the optional icon-class shortcut.

## Capabilities

### New Capabilities
- `text-input`: the text input's icon slot and icon attribute (the rest of the component is unchanged and not specified here).

### Modified Capabilities
- `button`: icons through a slotted child or the icon-class shortcut; a self-drawn success check.
- `component-conventions`: components draw their own glyphs as inline SVG and never require an icon font.

## Impact

`components/button/button.js`, `button.css`, `demo.html`; `components/text-input/text-input.js`, `demo.html`; `index.html` (lede / hero note); `styleguide.html` (icon rule); `CHANGELOG.md`. No other component draws a glyph with an icon font (checked: every `components/*/*.js` and `*.css`). No settings change, so no construction page update is needed.
