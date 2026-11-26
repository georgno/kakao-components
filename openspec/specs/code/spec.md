# code Specification

## Purpose

`<kakao-code>` is inline code in running text (file:line references, commands, names), drawn by light-DOM CSS alone.

## Requirements

### Requirement: Inline code
`<kakao-code>` SHALL style its light-DOM text as inline code (monospace token, tinted fill, small radius, wraps anywhere on narrow screens) through code.css alone, so it looks right before and without its script; the script SHALL only mark it `translate="no"`.

#### Scenario: A file:line reference
- **WHEN** a page writes `<kakao-code>src/app.js:42</kakao-code>` in a sentence and loads code.css
- **THEN** the reference shows in the monospace font on a tinted fill, inline with the text, also when code.js has not run
