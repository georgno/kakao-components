# Spec Delta

## ADDED Requirements

### Requirement: Menu form
With `list-data` (`[{ value, label?, disabled? }]`), any button variant and size SHALL become a menu button: a trailing chevron, `aria-haspopup="menu"` and `aria-expanded`, and a menu of `menuitemradio` items below the button (above it when there is no room). `selected` SHALL mark the checked item and SHALL update on pick. With `show-selected`, the button SHALL show the selected item's label, and its accessible name SHALL be "<label>: <item>". Picking SHALL fire `kakao-button-select` `{ value, label, previous, x, y }`. Opening and closing SHALL fire `kakao-button-menu` `{ open }`. A menu button SHALL NOT fire `kakao-button-action`.

#### Scenario: Picking with the keyboard
- **WHEN** the user focuses a menu button, presses Down, moves with the arrow keys and presses Enter
- **THEN** the menu opens on the checked item, disabled items are skipped, the picked item becomes `selected`, the menu closes and focus returns to the button

#### Scenario: Closing
- **WHEN** the menu is open and the user presses Escape, presses Tab or clicks outside
- **THEN** the menu closes (Escape returns focus to the button)
