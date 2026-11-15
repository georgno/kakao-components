# Design

## Overlay

The palette is modal, like the dialog: a scrim covers the page, focus stays in the palette and the page does not scroll. Unlike the dialog it sits in the top layer (an inner `popover="manual"` overlay), because it is opened by a global hotkey and may need to cover an open dialog or sheet. Where the popover API is missing, the overlay is fixed with `z-index: var(--kakao-command-palette-z, 65)`: above the dialog (60), below dropdown panels (70). The page scroll lock saves and restores `overflow` on `<html>` (components do not share code, so it does not share the dialog's counter).

Only the input is focusable; options are reached through `aria-activedescendant`, so Tab and Shift+Tab are held in the input. Escape and Tab are stopped at the palette, so a dialog underneath does not react to them.

## Running a command

The palette closes first (focus goes back to where it was), then fires `command-select`. A handler that opens a dialog then records the right return focus, and the two scroll locks never overlap. The event is cancelable; cancelling only stops the navigation of a command with `href`.

## Matching

Each query word (case and accents folded, character by character so indexes still point into the label) must match the label as a substring (scored by position: start of the label, then start of a word, then elsewhere), else as letters in order (scored lower, minus the gaps), else a keyword (substring). Scores add up; groups are ordered by their best command, commands by score, ties by list order. Matched letters of the label are wrapped in `<mark>`.

## Recent

`recent` (a number, empty = 5) keeps the ids of the last run commands in memory, newest first. With an empty query they are listed in a "Recent" group above the others (the commands stay in their own groups too).

## Hotkey

`hotkey` is a combination such as `Mod+K` or `Ctrl+Shift+P`; `Mod` is Meta on a Mac and Ctrl elsewhere. The key is matched on `event.key`, else `event.code` (Alt on a Mac changes `key`). A hotkey without Ctrl / Meta / Alt is ignored while the user types in an editable field. Pressing it while open closes the palette.
