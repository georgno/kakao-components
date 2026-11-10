# Spec Delta

## Purpose

`<kakao-color-code>` shows a CSS colour value as a small badge-like label with a swatch of that colour before the text, so colour values in documentation can be seen, not only read.

## ADDED Requirements

### Requirement: Label and painted colour
The element SHALL show its text content as the label, in a monospace font, in a pill-shaped badge-like box, with a small rounded swatch before the text. The swatch SHALL be painted with the `value` attribute when present and non-empty, otherwise with the trimmed text content. Changes to the text or to `value` SHALL update the swatch.

#### Scenario: Hex from the text
- **WHEN** `<kakao-color-code>#4f46e5</kakao-color-code>` is shown
- **THEN** the label reads `#4f46e5` and the swatch is that indigo

#### Scenario: Value overrides the text
- **WHEN** `<kakao-color-code value="var(--kakao-color-ink)">ink</kakao-color-code>` is shown
- **THEN** the label reads `ink` and the swatch shows the theme's ink colour, following theme changes

#### Scenario: Text changes
- **WHEN** a script sets the element's text to `#dc2626`
- **THEN** the swatch turns red

### Requirement: Every CSS colour syntax
The element SHALL paint any value the browser accepts as a CSS `<color>`: hex with 3, 4, 6 or 8 digits, `rgb()`/`rgba()`, `hsl()`/`hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()`, `color-mix()`, named colours, `transparent`, `currentColor` (the colour of the text around the element) and `var(--…)`.

#### Scenario: Modern syntax
- **WHEN** the text is `oklch(70% 0.15 145)`
- **THEN** the swatch is painted green

#### Scenario: currentColor
- **WHEN** the element sits in red text and its text is `currentColor`
- **THEN** the swatch is red

### Requirement: Invalid values
A value that is not a CSS colour (or an empty one) SHALL NOT throw and SHALL NOT paint: the swatch SHALL show as an empty dashed box with a slash, and the element SHALL expose the `invalid` custom state and a `valid` property that is false.

#### Scenario: Not a colour
- **WHEN** the text is `16px`
- **THEN** the label still reads `16px`, the swatch is an empty dashed box and `:state(invalid)` matches

### Requirement: Swatch stays visible
The swatch SHALL have a 1px inset ring from a theme colour, so it stays visible when the colour equals the label fill or the page. Colours with transparency SHALL sit over a small checkerboard. Under forced colours the swatch SHALL keep its colour.

#### Scenario: Same colour as the fill
- **WHEN** the swatch colour equals the label's fill
- **THEN** the ring still outlines the swatch

#### Scenario: Half transparent
- **WHEN** the text is `rgb(0 0 0 / 50%)`
- **THEN** the checkerboard shows through the swatch

### Requirement: Accessibility and theming
The label text SHALL be the element's accessible text; the swatch SHALL be hidden from assistive technology. The element SHALL NOT take focus. Its fill, text, ring, checkerboard and sizes SHALL come from `--kakao-color-code-*` settings that default to theme variables.

#### Scenario: Screen reader
- **WHEN** a screen reader reads `<kakao-color-code>#18181b</kakao-color-code>`
- **THEN** it reads "#18181b" and nothing for the swatch

#### Scenario: Dark theme
- **WHEN** the page switches to the dark theme
- **THEN** the fill, text and ring follow the dark theme
