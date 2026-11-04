# Spec Delta

## MODIFIED Requirements

### Requirement: Naming and theming
Every component SHALL be a custom element named `kakao-<generic name>` and SHALL expose its theming hooks as CSS custom properties named `--kakao-<component>-*`. Every visual value its construction page controls SHALL be such a custom property rather than a hard-coded value.

#### Scenario: Element registration
- **WHEN** a component script is loaded twice on the same page
- **THEN** it registers its element only once (guarded by `customElements.get`) and no error is thrown

#### Scenario: Theming from the page
- **WHEN** a page sets a documented `--kakao-<component>-*` property on the element or an ancestor
- **THEN** the component uses that value instead of its default

## ADDED Requirements

### Requirement: Settings block
Each component's default custom property values SHALL live in exactly one marked settings block in its source: the `.js` file for shadow DOM components, the `.css` file for light DOM components. A default in that block MAY refer to a main variable as `var(--kakao-<token>, <fallback>)`. Values outside the block SHALL refer to the custom properties instead of repeating them.

#### Scenario: Saved defaults apply everywhere
- **WHEN** the settings block of a component is changed
- **THEN** every page using that component shows the new defaults after a reload, with no other file changed

#### Scenario: Existing look unchanged
- **WHEN** a component is moved to a settings block without saving anything
- **THEN** it looks exactly as before
