# Design

## Chips

The tags are `<kakao-chip removable>` elements created inside the shadow root, so the library has one chip look. The page loads `chip.js`; without it, `kakao-chip:not(:defined)` draws a plain grey label. The chip's `chip-remove` (cancelable) is cancelled and the tag input does the removing, so it can fire its own cancelable `tag-remove` and keep its list in step. `kakao-chip-list` is not used: it is light DOM with its own stylesheet, which cannot reach into a shadow root.

## Focus

Each chip host gets `tabindex="-1"`, which takes its shadow content (the ×) out of the Tab order in Chromium and Firefox; tags are reached with the arrow keys. A selected tag is focus on its × (the chip's own 2px ring) plus an ink fill set through `--kakao-chip-bg` / `--kakao-chip-text` on `kakao-chip:focus-within`. Readonly chips have no ×, so the host itself takes focus.

## Value

As the select's `multiple`: comma list, or a JSON array when a tag contains a comma. The attribute is the default value and is not rewritten; the property reads the current tags. Form value is a FormData with one entry per tag.

## Attribute name for suggestions

The project rule says JSON configuration attributes are called `list-data`, so the suggestions attribute is `list-data` (as in the combobox); the property is `suggestions`.

## Field metrics

The field grows by lines: `min-height` is the size's height, vertical padding `--kakao-tag-input-padding-y`, each line is `height - 2px - 2 × padding-y` tall. The left inset is computed so a chip is as far from the left edge as from the top; without tags the text starts at the text input's padding.
