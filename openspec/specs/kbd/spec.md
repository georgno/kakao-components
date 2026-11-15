# kbd Specification

## Purpose
`<kakao-kbd>` shows keyboard keys as keycaps: a single key, a combination or a sequence, inline in text, next to menu items and beside buttons, drawn the way the reader's platform writes them.

## Requirements

### Requirement: Key sources
The component SHALL take its keys from the `keys` attribute or, when that attribute is absent, from its text content, and SHALL render again when either changes. The text content SHALL not be shown or read in addition to the keycaps.

#### Scenario: Text content
- **WHEN** a page contains `<kakao-kbd>Esc</kakao-kbd>`
- **THEN** one keycap reading "Esc" is shown

#### Scenario: Attribute wins
- **WHEN** a kbd has `keys="Ctrl+S"` and the text "Save"
- **THEN** the keycaps Ctrl and S are shown and "Save" is not

#### Scenario: Text changed by a script
- **WHEN** a script changes the text of a rendered kbd from "A" to "B"
- **THEN** the keycap reads "B"

### Requirement: Combinations and sequences
In the key list `+` SHALL join the keys of one combination, with spaces around it ignored, and a space SHALL separate the steps of a sequence. Each key SHALL be its own keycap. A `+` key SHALL be writable as `Plus` or as a trailing `+` after the joining one.

#### Scenario: Combination
- **WHEN** the keys are `Ctrl + Shift + P`
- **THEN** three keycaps Ctrl, Shift and P are shown as one combination

#### Scenario: Sequence
- **WHEN** the keys are `G I`
- **THEN** the keycaps G and I are shown with the word "then" between them

#### Scenario: Plus key
- **WHEN** the keys are `Ctrl++`
- **THEN** the keycaps Ctrl and + are shown

### Requirement: Key names
The component SHALL recognise, without regard to case, the names Mod, Cmd (Command, Meta), Ctrl (Control), Alt (Option, Opt), Shift, Enter (Return), Backspace, Tab, Esc (Escape), Space, Del (Delete), Home, End, PageUp, PageDown, Plus and Up, Down, Left, Right (ArrowUp …), as well as the Mac symbols for these keys, and SHALL show any other key as written, without changing its case.

#### Scenario: Unknown key
- **WHEN** the keys are `F5`
- **THEN** a keycap reading "F5" is shown

#### Scenario: Aliases
- **WHEN** the keys are `control+return` with `platform="other"`
- **THEN** the keycaps read "Ctrl" and "Enter"

### Requirement: Platform display
`platform` SHALL be `auto` (default, detected from the browser), `mac` or `other`. On a Mac the component SHALL draw Command, Control, Option, Shift, Return, Backspace and Tab as their symbols and show the keys of a combination side by side without a visible "+"; elsewhere it SHALL show these keys as words joined by a visible "+". `Mod` SHALL be Command on a Mac and Ctrl elsewhere. Arrow keys SHALL be drawn as arrows on every platform. Symbols SHALL be inline SVG in the keycap's text colour.

#### Scenario: Mod on a Mac
- **WHEN** `<kakao-kbd keys="Mod+K" platform="mac">` is shown
- **THEN** it shows the Command symbol and K side by side, with no "+"

#### Scenario: Mod elsewhere
- **WHEN** `<kakao-kbd keys="Mod+K" platform="other">` is shown
- **THEN** it shows "Ctrl", a "+" and "K"

### Requirement: Semantics
The component SHALL render one `<kbd>` element containing one `<kbd>` per key. A key drawn as a symbol SHALL carry its name as text for assistive technology ("Command", "Up arrow"), a combination SHALL include a "+" between its keys for assistive technology even when none is visible, and the component SHALL never take focus.

#### Scenario: Read by a screen reader
- **WHEN** a screen reader reads `<kakao-kbd keys="Mod+K" platform="mac">`
- **THEN** it reads "Command + K"

#### Scenario: Tabbing past
- **WHEN** a keyboard user tabs through a paragraph with a kbd
- **THEN** focus never stops on it

### Requirement: Renaming keys
`list-data` SHALL accept a JSON object from key name to label; a listed key SHALL show that label instead of its word, and use it as the name of its symbol. Invalid `list-data` SHALL be ignored. `then-label` SHALL replace the word "then" between sequence steps.

#### Scenario: German
- **WHEN** a kbd has `keys="Ctrl+Enter"`, `platform="other"` and `list-data='{"ctrl":"Strg","enter":"Eingabe"}'`
- **THEN** the keycaps read "Strg" and "Eingabe"

### Requirement: Sizes and outline
The component SHALL be inline, aligned with the text line, in the sizes `md` (default) and `sm`. With `outline` the keycaps SHALL have no fill and take the surrounding text colour for border and text.

#### Scenario: On a coloured background
- **WHEN** an outline kbd sits in a box with light text on a dark fill
- **THEN** its border and text are light and readable

#### Scenario: Phone width
- **WHEN** a long combination sits in a paragraph at a 390px viewport
- **THEN** it wraps between keys and nothing scrolls sideways

### Requirement: Theming hooks
All visual values SHALL be `--kakao-kbd-*` custom properties in the component's settings block, with every colour defaulting to a theme role (`var(--kakao-color-<role>, literal)`), and SHALL be editable on `components/kbd/construction.html`. No text SHALL be styled in capitals.

#### Scenario: Dark theme
- **WHEN** the theme switches from light to dark
- **THEN** keycap fill, border and text take the dark theme's colours
