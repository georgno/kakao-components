# Spec Delta

## MODIFIED Requirements

### Requirement: Variants, sizes and icons
The button SHALL render an inner native `<button>` (or link when `href` is set) styled by `button.css`, with `variant` primary (default), secondary, ghost or danger, `size` sm, md (default) or lg, and an optional icon placed by `icon-position` left, right or only. The icon SHALL come from a child element with `slot="icon"` (an inline SVG, an image or an icon-font element), or from the `icon` attribute, an optional shortcut whose classes are put on an `<i>` and which needs an icon font loaded on the page. A slotted icon SHALL take precedence over the `icon` attribute.

#### Scenario: Icon-only button
- **WHEN** `icon-position="only"` is set with an `aria-label`
- **THEN** only the icon is shown and the accessible name comes from `aria-label`

#### Scenario: Slotted SVG icon
- **WHEN** a `<kakao-button label="Save">` contains `<svg slot="icon">` and no icon font is loaded
- **THEN** the SVG is shown before the label, and moves after it when `icon-position="right"` is set

#### Scenario: Slotted icon survives updates
- **WHEN** the label, `icon-position` or `disabled` of a button with a slotted icon changes
- **THEN** the same icon element is still shown once, in the new position

## ADDED Requirements

### Requirement: Self-drawn success check
The success state of `run()` SHALL show a check mark drawn by the button itself, so it is visible without any icon font on the page.

#### Scenario: Success without Font Awesome
- **WHEN** `run()` resolves on a page that loads no icon font
- **THEN** a check mark is visible over the button until it returns to idle
