# code-block Specification

## Purpose

`<kakao-code-block>` shows preformatted text, code or a running log as text only: monospace, themed, scrolling or wrapping, with an optional label row, copy built in, and a log mode that follows the end unless the reader scrolled up.

## Requirements

### Requirement: Text only
`<kakao-code-block>` SHALL show its content as text, never as HTML: the light DOM's text (leading and trailing blank lines and the common indentation removed), the `text` property, and `append()` SHALL be written with text nodes only.

#### Scenario: Markup in the content
- **WHEN** a script sets `text` to `<img src=x onerror=alert(1)>` and appends `<script>alert(2)</script>`
- **THEN** both are shown literally, no element is created, and nothing runs

### Requirement: Block
The block SHALL use the monospace token, the theme's colours, and a scroller capped at `max-height` (default from its settings) that scrolls in both directions, or wraps lines with `wrap`. When it overflows, the scroller SHALL be focusable and named (`label`, else "Code" / "Log"). `label` and `language` SHALL show a label row; `language` is display-only. `hidden` SHALL hide the block.

#### Scenario: Keyboard
- **WHEN** a block's content is taller than its max-height and the reader tabs to it
- **THEN** the scroller takes focus with the focus outline and the arrow keys scroll it

### Requirement: Copy
Unless `no-copy` is set, a kakao-copy-button SHALL copy the block's whole text, named `copy-label` (default "Copy" + the label, else "Copy code" / "Copy log"); it SHALL be hidden while the block is empty.

#### Scenario: Copy a snippet
- **WHEN** the reader activates the copy button of a block showing `npm test`
- **THEN** `npm test` is on the clipboard and "Copied" is announced

### Requirement: Log mode
With `mode="log"` the block SHALL stay scrolled to the end while text is appended, unless the reader scrolled up; then it SHALL keep their place, also when old lines are dropped, and show a "Jump to latest" button (`latest-label`) that scrolls to the end and follows again. It SHALL keep at most `max-lines` lines (default 1000, 0 keeps all), let a carriage return overwrite the current line, drop ANSI colour codes, and fire `follow-change`. With `announce` the log SHALL be a polite live region.

#### Scenario: Reading while it runs
- **WHEN** the reader scrolls up in a log and lines keep arriving
- **THEN** the view stays where it is and "Jump to latest" appears; activating it scrolls to the end and new lines are followed again
