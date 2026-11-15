# copy-button Specification

## Purpose
`<kakao-copy-button>` copies a text to the clipboard and confirms it, visibly and for screen readers, then returns to its copy state; it says so when copying is not possible.

## Requirements

### Requirement: What is copied
The component SHALL copy the `value` attribute or, when that attribute is absent, the text of the element whose id is given in `for`, read at the moment of the copy. For a source with a string `value` property (a field) the text SHALL be that value; for any other element it SHALL be the text content without the white space around it. The `for` id SHALL be looked up in the component's own root first and then in the document. The text SHALL be readable as the `text` property.

#### Scenario: Value
- **WHEN** a copy button with `value="abc"` is clicked
- **THEN** "abc" is written to the clipboard

#### Scenario: Element text
- **WHEN** a copy button with `for="cmd"` is clicked and `<code id="cmd"> npm install </code>` is on the page
- **THEN** "npm install" is written to the clipboard

#### Scenario: Field value at click time
- **WHEN** the user changes the text of the field named by `for` and then clicks the copy button
- **THEN** the changed text is written to the clipboard

#### Scenario: Value wins
- **WHEN** a copy button has both `value` and `for`
- **THEN** the `value` is copied

### Requirement: Labelled and icon-only forms
With a `label` the component SHALL show the copy icon and the label; without one it SHALL be an icon-only, circular button. Its accessible name SHALL be the `aria-label` attribute, else the label, else "Copy", and SHALL not change with the state. A `slot="icon"` child SHALL replace the copy glyph. The component's own glyphs SHALL be inline SVG in the current text colour.

#### Scenario: Icon only
- **WHEN** `<kakao-copy-button value="x">` is shown
- **THEN** it is a circle with the copy icon and a button named "Copy"

#### Scenario: Named
- **WHEN** an icon-only copy button has `aria-label="Copy API key"`
- **THEN** the button is named "Copy API key"

### Requirement: Variants and sizes
`variant` SHALL be `secondary` (default, a quiet fill) or `ghost` (no fill until hovered). `size` SHALL be `md` (default), `sm` or `lg`, with the heights of `kakao-button` (44, 36 and 52px by default). An icon-only button SHALL be as wide as it is high.

#### Scenario: Next to a button
- **WHEN** a small copy button stands next to a small `kakao-button`
- **THEN** both are the same height

### Requirement: Confirmation
After a successful copy the component SHALL show a check in place of the icon and `copied-label` (default "Copied") in place of the label, set its `state` to `copied` (also `data-state="copied"` on the host) and announce the copied label through a polite live region without moving focus. The button SHALL keep its width through the change.

#### Scenario: Confirmed
- **WHEN** a labelled copy button is clicked and the copy succeeds
- **THEN** it shows the check and "Copied", and a screen reader hears "Copied"

#### Scenario: Same width
- **WHEN** a copy button labelled "Copy" changes to "Copied"
- **THEN** its width does not change

### Requirement: Reset
After `reset-delay` milliseconds (default 1600) the component SHALL return to the copy state and empty the live region; with `reset-delay="0"` it SHALL stay until `reset()` is called. Copying again before the reset SHALL copy again and restart the delay.

#### Scenario: Reset after the delay
- **WHEN** 1600 ms have passed since a successful copy
- **THEN** the button shows the copy icon and its label again

#### Scenario: Held
- **WHEN** a copy button with `reset-delay="0"` has copied
- **THEN** it keeps showing the confirmation until `reset()` is called

### Requirement: Failure
When there is no text to copy (no value, a missing `for` element, or an empty one) or the browser refuses the clipboard, the component SHALL show a failure mark and `error-label` (default "Copy failed"), set its `state` to `error`, announce the error label through the live region, and reset as after a confirmation. Success and failure SHALL differ by glyph and text, not only by colour.

#### Scenario: Missing source
- **WHEN** a copy button with `for="nothing"` is clicked and no such element exists
- **THEN** it shows the failure mark and "Copy failed", and nothing is written to the clipboard

### Requirement: Clipboard access
The component SHALL write with `navigator.clipboard.writeText()` where it exists and SHALL fall back to a hidden read-only textarea and `document.execCommand('copy')` when the clipboard API is missing or rejects. After the fallback, focus SHALL be where it was before.

#### Scenario: No clipboard API
- **WHEN** the page has no `navigator.clipboard` and the copy command works
- **THEN** the text is copied, the confirmation shows and focus is still on the copy button

### Requirement: Events and methods
The component SHALL fire `copy-success` with detail `{ value }` after a successful copy and `copy-error` with detail `{ value, reason }` after a failed one, `reason` being `empty` or `failed`; both SHALL bubble and be composed. `copy()` SHALL copy and resolve to `true` or `false`; `reset()` SHALL return to the copy state at once; `focus()` SHALL focus the button. The `value` property SHALL reflect the attribute.

#### Scenario: Success event
- **WHEN** a copy button inside another component's shadow root copies "abc"
- **THEN** a listener on the document receives `copy-success` with `detail.value` "abc"

#### Scenario: Error event
- **WHEN** a copy button without a value is clicked
- **THEN** `copy-error` fires with `detail.reason` "empty"

### Requirement: Keyboard, forms and disabled
The component SHALL render a native button of type `button`: it SHALL be reachable with Tab, copy on Enter and Space, show the style guide's focus outline on keyboard focus, and never submit a form. With `disabled` it SHALL not copy, not take focus, and be dimmed.

#### Scenario: Keyboard
- **WHEN** the copy button has focus and the user presses Enter
- **THEN** the text is copied and the confirmation shows

#### Scenario: Inside a form
- **WHEN** a copy button inside a form is clicked
- **THEN** the form is not submitted

#### Scenario: Disabled
- **WHEN** a disabled copy button is clicked or `copy()` is called on it
- **THEN** nothing is copied and no event fires

### Requirement: Theming and motion
Every visual value SHALL be a `--kakao-copy-button-*` custom property with its default in the component's one settings block; colour settings SHALL default to theme roles. The icon change SHALL be animated only when the user has not asked for reduced motion. No text SHALL be set in capitals.

#### Scenario: Theme switch
- **WHEN** the page switches to a dark theme
- **THEN** fill, text, check and failure mark take the theme's colours

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion and a copy succeeds
- **THEN** the check replaces the icon without a transition
