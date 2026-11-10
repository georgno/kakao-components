# component-conventions Specification

## Purpose
Shared rules every kakao component follows, so components behave alike and can be combined on one page or in a form.

## Requirements

### Requirement: Naming and theming
Every component SHALL be a custom element named `kakao-<generic name>` and SHALL expose its theming hooks as CSS custom properties named `--kakao-<component>-*`. Every visual value its construction page controls SHALL be such a custom property rather than a hard-coded value.

#### Scenario: Element registration
- **WHEN** a component script is loaded twice on the same page
- **THEN** it registers its element only once (guarded by `customElements.get`) and no error is thrown

#### Scenario: Theming from the page
- **WHEN** a page sets a documented `--kakao-<component>-*` property on the element or an ancestor
- **THEN** the component uses that value instead of its default

### Requirement: JSON configuration attribute
Components that take structured configuration SHALL read it from a `list-data` attribute containing JSON and SHALL never use an attribute named `data`.

#### Scenario: Invalid JSON
- **WHEN** `list-data` contains invalid JSON
- **THEN** the component keeps working with no items instead of throwing

### Requirement: Composed events
Custom events dispatched by a shadow-DOM component SHALL bubble and be composed, so a listener on `document` receives them.

#### Scenario: Listening on an ancestor
- **WHEN** a user changes a component's state
- **THEN** a listener on `document` receives the component's change event with the documented `detail`

### Requirement: Calls before upgrade
Public methods called before the element is connected SHALL be queued and applied once it connects.

#### Scenario: Early method call
- **WHEN** a script calls `setData()` on an element that is not yet connected
- **THEN** the data is applied when the element connects

### Requirement: No dependencies and inlineable source
Component sources SHALL be plain JavaScript without external dependencies or a build step, and SHALL NOT contain a literal closing script tag, so they can be inlined into a `<script>` element.

#### Scenario: Inlining a component
- **WHEN** a component file is pasted inside a `<script>` element of an HTML page
- **THEN** the page parses and the component works

### Requirement: Accessible interaction
Interactive components SHALL be fully usable from the keyboard, SHALL show a visible `:focus-visible` outline, and SHALL expose matching ARIA roles and states.

#### Scenario: Keyboard only
- **WHEN** a user operates a component with only the keyboard
- **THEN** every action available to pointer users is reachable

### Requirement: Settings block
Each component's default custom property values SHALL live in exactly one marked settings block in its source: the `.js` file for shadow DOM components, the `.css` file for light DOM components. A default in that block MAY refer to a main variable as `var(--kakao-<token>, <fallback>)`. Values outside the block SHALL refer to the custom properties instead of repeating them.

#### Scenario: Saved defaults apply everywhere
- **WHEN** the settings block of a component is changed
- **THEN** every page using that component shows the new defaults after a reload, with no other file changed

#### Scenario: Existing look unchanged
- **WHEN** a component is moved to a settings block without saving anything
- **THEN** it looks exactly as before

### Requirement: Themed colours
Every colour setting of a component SHALL default to a theme colour role (`var(--kakao-color-<role>, <literal>)`) or to an expression of other settings. The only exceptions are fixed, theme-independent colours such as white switch thumbs and file-type tags. Hard-coded colours outside the settings block SHALL NOT be used for anything the theme should change.

#### Scenario: Dark page
- **WHEN** a page selects the dark theme
- **THEN** every component on it uses dark colours without any component-specific setting

### Requirement: Own glyphs as inline SVG
A component SHALL draw every glyph it shows on its own (checks, chevrons, spinners, close marks, status icons) as inline SVG coloured with `currentColor`, and SHALL NOT need an icon font or any other stylesheet beyond its own. Icons supplied by the page SHALL come through a slot (or, where offered, an optional icon-class shortcut that is documented as needing an icon font).

#### Scenario: Page without an icon font
- **WHEN** a page loads a component without loading Font Awesome or any other icon font
- **THEN** every glyph the component draws itself is visible
