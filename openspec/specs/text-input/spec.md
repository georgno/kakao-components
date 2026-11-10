# text-input Specification

## Purpose
`<kakao-text-input>` is a single-line, form-associated text field; this capability covers how it takes a leading icon.

## Requirements

### Requirement: Icon slot
The text input SHALL offer a named `icon` slot in front of the field, coloured muted like the rest of the field chrome and hidden from assistive technology. Slotted content SHALL stay in the page's DOM, so page stylesheets (an icon font, for example) apply to it. With no icon, no space SHALL be reserved.

#### Scenario: Inline SVG icon
- **WHEN** a text input contains `<svg slot="icon">` and no icon font is loaded
- **THEN** the SVG is shown inside the field before the text

#### Scenario: Icon font through the slot
- **WHEN** a page loads Font Awesome and the text input contains `<i slot="icon" class="fas fa-magnifying-glass">`
- **THEN** the magnifying glass is shown inside the field

### Requirement: Icon class shortcut
The `icon` attribute SHALL be an optional shortcut: its classes SHALL be put on an `<i>` element placed in the icon slot, so an icon font loaded on the page draws it. It SHALL be ignored while the page supplies its own `slot="icon"` child, and removing the attribute SHALL remove the icon it created.

#### Scenario: Attribute with Font Awesome
- **WHEN** a page loads Font Awesome and a text input has `icon="fas fa-magnifying-glass"`
- **THEN** the magnifying glass is shown inside the field

#### Scenario: Own slotted icon wins
- **WHEN** a text input has both an `icon` attribute and its own `slot="icon"` child
- **THEN** only the slotted child is shown

### Requirement: Focus indicator
On keyboard focus (`:focus-visible` on the inner input) the field box SHALL show a solid outline of `--kakao-text-input-focus-width` (2px) in `--kakao-text-input-focus` (the theme's focus colour), `--kakao-text-input-focus-offset` (2px) outside it, and its border SHALL take the focus colour. No translucent halo SHALL be drawn. With `error`, border and outline SHALL be the danger colour.

#### Scenario: Tabbing into the field
- **WHEN** the person tabs into a text input
- **THEN** a 2px focus-coloured outline shows 2px outside the field box

#### Scenario: Field in error
- **WHEN** a text input with `error` receives keyboard focus
- **THEN** the outline and border are in the danger colour
