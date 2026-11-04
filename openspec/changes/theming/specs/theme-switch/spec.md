# Spec Delta

## Purpose

`<kakao-theme-switch>` switches the page between colour themes with a ripple from the button.

## ADDED Requirements

### Requirement: Switching themes
The switch SHALL cycle through its themes in order: light and dark by default, or the themes given in `list-data` (`{ value, label?, scheme?, icon? }`). It SHALL set `data-kakao-theme` on `<html>` to the theme's value and `data-bs-theme` to the theme's colour scheme, and SHALL fire `theme-change` `{ theme, previous, scheme, source }` (bubbling, composed).

#### Scenario: Toggle
- **WHEN** the page is light and the user activates the switch
- **THEN** `<html>` gets `data-kakao-theme="dark"` and `data-bs-theme="dark"`, and `theme-change` reports `{ theme: "dark", previous: "light" }`

### Requirement: Default and memory
Until a theme is chosen, the switch SHALL leave `data-kakao-theme` unset, so the page follows the system setting, and SHALL show the matching theme. A choice SHALL be stored in localStorage under `storage-key` (default `kakao-theme`; empty = not stored). A stored choice SHALL be applied as soon as the script runs. All switches on a page, and pages in other tabs, SHALL follow a change.

#### Scenario: Returning visitor
- **WHEN** a visitor who chose dark opens another page that loads the script in `<head>`
- **THEN** the page is dark from the first paint

### Requirement: Ripple
A switch made by pointer or keyboard SHALL reveal the new theme as a circle growing from the pointer position (keyboard: the button centre) until it covers the viewport, using a view transition. With `prefers-reduced-motion: reduce`, without View Transitions support, or when set through the `theme` property, the theme SHALL change at once.

#### Scenario: Reduced motion
- **WHEN** reduced motion is on and the user activates the switch
- **THEN** the theme changes at once, with no ripple and no icon morph

### Requirement: Accessible switch
The switch SHALL be a native button named after its action ("Switch to dark theme"). With `show-label`, the visible theme name SHALL start the accessible name. It SHALL show a 2px focus outline in the focus colour, SHALL announce the new theme in a polite live region, and SHALL ignore activation while `disabled`.

#### Scenario: Screen reader
- **WHEN** a screen reader user activates the switch
- **THEN** "Dark theme" is announced
