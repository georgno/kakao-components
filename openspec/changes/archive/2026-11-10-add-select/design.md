# Design

## Context

Siblings: `kakao-button` menu (placement: flips up, end-aligns, clamps; 36px rows, check mark for the selected item), `kakao-multi-dropdown` (shadow DOM listbox with `aria-activedescendant`, hover follows the mouse, outside pointerdown closes), `kakao-text-input` (field look, sizes 36/44/52, label/hint/error, ElementInternals) and `kakao-checkbox` (box look). Components never reach into each other, so the select copies these looks in its own shadow CSS rather than nesting other kakao elements.

## Decisions

- **Top layer panel.** The panel is a `popover="manual"` element in the shadow root, shown with `showPopover()` and placed with fixed coordinates computed from the trigger (same rules as the button menu: below, or above when there is no room below and more above; start-aligned, else end-aligned, else clamped 8px from the viewport). Its max height is the smaller of the setting and the room on the chosen side. It follows scroll and resize while open. Without the Popover API it falls back to `position: fixed` with a high z-index. Reason: selects sit in cards and sheets with `overflow: hidden`.
- **Focus model.** The trigger is a `<button aria-haspopup="listbox" aria-expanded>`. On open, focus goes to the search `<input role="combobox" aria-autocomplete="list" aria-controls aria-activedescendant>`. The list is `role="listbox"` (with `aria-multiselectable` for multiple), groups are `role="group"` labelled by their heading. "Select all" is the first `role="option"` with `aria-checked` true / false / mixed, so arrow keys reach it.
- **Keys.** Closed trigger: Enter, Space, ↓, ↑, Alt+↓ open; a printable key opens with that key typed into the search; Delete / Backspace clear the selection (validation then reports a required field). Open: ↑ / ↓ / PageUp / PageDown move (Home / End stay with the text caret), Enter picks (single: closes; multiple: toggles and stays open), Escape closes and returns focus to the trigger, Tab closes, focus goes back to the trigger and the Tab continues from there (so focus moves on as from a native select).
- **Filtering.** Labels are compared after `normalize('NFD')`, removing combining marks and lower-casing; a match anywhere counts. Groups with no matching option are hidden. The active option resets to the first match on every keystroke.
- **Select all.** Acts on enabled, visible options only. All selected → unchecks them; otherwise selects them. Label "Select all", or "Select all N matches" while a filter is on.
- **Summary.** Multiple shows the first selected label (in list order) and a muted "+N" count; chips were rejected because they change the field height and duplicate the chip list's remove behaviour. The trigger's accessible name includes all selected labels.
- **Value API.** `value` attribute / property: one value, or with `multiple` a comma-separated list (a JSON array is accepted for values with commas). `values` property: array. `selectedOptions`: `[{ value, label }]`. Form value: single string, or a `FormData` with one entry per value under `name`.
- **Motion.** Panel fades and moves 4px in on the standard easing token over the fast duration (150ms); chevron turns on the same curve. Nothing moves along a line into place, so no spring. Reduced motion: none.
- **Look.** Field: text input border, radius 10, heights 36/44/52; focus: border in the focus colour plus the 2px outline with 2px offset (style guide focus rule). Panel: raised surface, overlay shadow level 3 (ring instead of border), radius 10, padding 4, rows radius 6, height 36. Checkbox: 18px box, radius 5, ink fill and on-ink mark, as `kakao-checkbox`. Values that change in place (count) use tabular numbers.

## Risks / Trade-offs

- Top layer plus fixed coordinates means repositioning on every scroll while open (rAF-throttled).
- All rows are real DOM nodes; ~1,000 options is fine, far more would need virtualisation (out of scope).
