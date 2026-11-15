# spinner Specification

## Purpose
`<kakao-spinner>` shows that something is loading for an unknown time: the turning ring of `kakao-button`, on its own, inline in text, in a row or large in a panel.

## Requirements

### Requirement: Ring
The component SHALL draw a turning arc as inline SVG, with the same geometry, stroke and speed as the ring `kakao-button` shows while it runs, so that both look the same at the same size. It SHALL be inline, aligned with the text line, and SHALL never take focus.

#### Scenario: Next to a running button
- **WHEN** a default spinner is shown next to a button that is running
- **THEN** both rings have the same size, stroke and arc

#### Scenario: Tabbing past
- **WHEN** a keyboard user tabs through a page with a spinner
- **THEN** focus never stops on it

### Requirement: Sizes
`size` SHALL be `md` (default, 18px, the button's ring), `sm` or `lg`. The stroke SHALL scale with the size.

#### Scenario: Large
- **WHEN** a spinner has `size="lg"`
- **THEN** its ring is larger than the default one and its stroke is thicker in proportion

### Requirement: Colour and tones
Without `tone` the ring SHALL be drawn in the surrounding text colour. `tone` SHALL accept `primary`, `success`, `warning`, `danger` and `muted` and draw the ring in that theme role. A visible label SHALL keep the text colour in every tone.

#### Scenario: On a dark fill
- **WHEN** a spinner without a tone sits in a box with light text on a dark fill
- **THEN** the ring is light

#### Scenario: Tone
- **WHEN** a spinner has `tone="primary"` and `show-label`
- **THEN** the ring is in the primary colour and the label in the text colour

### Requirement: Label and status
The component SHALL expose a status (`role="status"`) whose text is `label`, or "Loading" when `label` is absent or empty, and SHALL hide the ring from assistive technology. With `show-label` the label SHALL also be visible beside the ring, and with `stacked` under it, centred. The label SHALL not be read twice.

#### Scenario: Default name
- **WHEN** a screen reader meets `<kakao-spinner>`
- **THEN** it reads "Loading"

#### Scenario: Visible label
- **WHEN** a spinner has `label="Saving draft"` and `show-label`
- **THEN** "Saving draft" is shown beside the ring and read once

### Requirement: Delay
`delay` SHALL be a time in milliseconds (a plain number, or with `ms` or `s`); default 0. For that time after the element is connected, and after each removal of `hidden`, the spinner SHALL be invisible, SHALL have an empty status text and SHALL occupy its final space. When the time has passed it SHALL become visible and the status text SHALL be written. Setting `hidden` before then SHALL cancel the wait. The read-only `shown` property SHALL be true only while the spinner is visible.

#### Scenario: Fast load
- **WHEN** a spinner with `delay="400"` has `hidden` removed and set again 200 ms later
- **THEN** it was never visible and nothing was announced

#### Scenario: Slow load
- **WHEN** a spinner with `delay="400"` has `hidden` removed and the load takes 2 seconds
- **THEN** it appears after 400 ms, without moving what is next to it, and is announced then

### Requirement: Reduced motion
With `prefers-reduced-motion: reduce` the ring SHALL not turn; it SHALL fade in and out in place instead.

#### Scenario: Reduced motion
- **WHEN** the reader prefers reduced motion
- **THEN** the ring stays where it is and its opacity pulses

### Requirement: Theming hooks
All visual values SHALL be `--kakao-spinner-*` custom properties in the component's settings block, with every tone colour defaulting to a theme role (`var(--kakao-color-<role>, literal)`) and the ring without a tone defaulting to `currentColor`, and SHALL be editable on `components/spinner/construction.html`. No text SHALL be styled in capitals.

#### Scenario: Dark theme
- **WHEN** the theme switches from light to dark
- **THEN** a spinner without a tone follows the text colour and a toned one takes the dark theme's role colour
