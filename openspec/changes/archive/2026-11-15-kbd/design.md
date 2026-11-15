# Design

## Decisions

- **Shadow DOM, keys rendered from text, no slot.** A slot cannot split "Ctrl+K" into keycaps, so the component reads the `keys` attribute or its own text and builds the keycaps in the shadow root. The light DOM text is not slotted, so it is neither shown nor read twice; without the script it is the visible fallback. A MutationObserver follows text changes.
- **Grammar: `+` within a combination, space between sequence steps.** Spaces around `+` are ignored, so "Ctrl + K" and "Ctrl+K" are the same. A plus key is `Plus` (or a trailing `Ctrl++`), a space key is `Space`. Consequence: "⌘ K" written with a space is a sequence; a combination is "⌘+K" or `Mod+K`.
- **Platform display kept to one switch.** `platform="auto"` reads `navigator.userAgentData.platform` / `navigator.platform`. Mac: symbols for Command, Control, Option, Shift, Return, Delete (backspace) and Tab, keys side by side, the "+" only spoken. Other: words joined by a visible "+". Arrows are glyphs on both. `Mod` is the only name whose key differs by platform; `Cmd` off the Mac is shown as "Meta".
- **Glyphs are inline SVG**, not the Unicode characters: Inter Tight has no ⌘ ⌥ ⇧, and fallback fonts draw them at different sizes and weights. Each glyph has a hidden text name; `list-data` can rename it.
- **`list-data` is an object of key name to label** (`{"ctrl": "Strg"}`), the one JSON attribute, used for translation. `then-label` is a plain attribute because it is one word.
- **`outline`** instead of tones: keys in a tooltip or a coloured row take `currentColor` for border and text, so no per-background variant is needed.
- **Sizes** md (1.5rem high, 0.75rem text, radius 6) and sm (1.25rem, 0.6875rem, radius 4), from the style guide's radius scale. A keycap is at least as wide as it is high. The lower edge is a 1px shadow in the line colour, a setting.

## Out of scope

- Listening for the shortcut: the component only shows keys.
- A page-wide language or platform switch; both are per element.
