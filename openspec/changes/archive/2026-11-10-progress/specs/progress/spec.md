# Spec Delta

## Purpose

`<kakao-progress>` shows how far a task has come as a bar split into segments, filling them in order and giving each completed segment a short pop, or shows an indeterminate state when the amount is unknown.

## ADDED Requirements

### Requirement: Value and max
The element SHALL read `value` and `max` like native `<progress>`: `max` defaults to 1 and must be a positive number (otherwise 1), and `value` is clamped to 0…max. The `value`, `max` and `segments` properties SHALL reflect their attributes, and a read-only `position` SHALL return value / max, or -1 while indeterminate.

#### Scenario: Clamped value
- **WHEN** a progress has `value="140" max="100"`
- **THEN** every segment is full and `position` is 1

### Requirement: Indeterminate
Without a `value` attribute, or with one that is not a number, the bar SHALL be indeterminate: no segment shows a fill amount, and a highlight sweeps across the whole bar, through the segments, from start to end in a loop.

#### Scenario: Value removed
- **WHEN** the `value` attribute of a progress is removed
- **THEN** the sweep starts and `aria-valuenow` is removed

### Requirement: Segments
`segments` (default 4, a whole number from 1 to 100; other values fall back to 4) SHALL split the bar into that many equal parts with a gap between them. The value SHALL fill them in order: a segment is full when the value has passed its end, empty when the value is at or before its start, and partly filled in proportion otherwise. `segments="1"` SHALL be one continuous bar.

#### Scenario: Partial segment
- **WHEN** a progress has `segments="4" value="0.6"`
- **THEN** the first two segments are full, the third is 40% filled and the fourth is empty

### Requirement: Smooth fill
When the value changes after the first render, the fill SHALL move to the new value over the fill duration with the standard easing, through the segments in order, both up and down. The first render and leaving the indeterminate state SHALL show the value at once.

#### Scenario: Step up
- **WHEN** the value goes from 0.2 to 0.4 on a four-segment bar
- **THEN** the first segment fills up to its end, then the second starts filling, and the movement ends at the new value

### Requirement: Completion pop
When the fill reaches the end of a segment while increasing, that segment SHALL play a short squash-and-stretch jump (stretches, squashes, rebounds a little, settles) on the standard easing, and the fill SHALL continue into the next segment. A change that completes several segments SHALL pop each of them in order, at least the stagger time apart.

#### Scenario: Jump past three segments
- **WHEN** the value goes from 0 to 0.8 on a four-segment bar
- **THEN** the first, second and third segments each pop once, one after the other, and the fourth does not

### Requirement: Pop once per fill
A segment SHALL pop at most once per fill: after popping it SHALL not pop again until the value has dropped to or below the segment's start. Segments that are already complete on the first render, when the bar leaves the indeterminate state, or when `max` or `segments` change SHALL count as popped and SHALL not pop. A decreasing value SHALL never pop.

#### Scenario: Down and back up within a segment
- **WHEN** the value goes 0.5 → 0.3 → 0.5 on a four-segment bar whose first two segments have popped
- **THEN** no segment pops

#### Scenario: Emptied and filled again
- **WHEN** the value goes 0.5 → 0.1 → 0.5 on a four-segment bar whose first two segments have popped
- **THEN** only the second segment pops again

### Requirement: Segment complete event
Each time a segment completes under the pop rule, the element SHALL dispatch a bubbling, composed `progress-segment-complete` event with `{ index, segments, value }` (when the pop plays, or at once under reduced motion) and emit it as a trigger. It SHALL never fire at a baseline.

#### Scenario: Three completions
- **WHEN** the value goes from 0 to 0.8 on a four-segment bar
- **THEN** three events arrive, with index 0, 1 and 2 in that order

### Requirement: Reduced motion
With `prefers-reduced-motion: reduce`, value changes SHALL show at once, no segment SHALL pop, and the indeterminate state SHALL not move across the bar (a slow fade of the fill is allowed).

#### Scenario: Reduced motion step
- **WHEN** reduced motion is on and the value goes from 0.2 to 0.6
- **THEN** the bar shows 0.6 immediately and nothing scales

### Requirement: Progressbar semantics
The element SHALL have `role="progressbar"` (unless the page set a role), `aria-valuemin="0"`, `aria-valuemax` equal to max and `aria-valuenow` equal to the clamped value, and no `aria-valuenow` while indeterminate. `value-text` SHALL become `aria-valuetext`. It SHALL never take focus.

#### Scenario: Determinate
- **WHEN** a progress has `value="3" max="10"`
- **THEN** it is announced as a progress bar at 30%

### Requirement: Label and value text
`label` SHALL be shown above the bar and SHALL become the accessible name unless the page set `aria-label`. `show-value` SHALL show the percentage (rounded, or `value-text` when set) at the end of that row in tabular figures, hidden while indeterminate unless `value-text` is set.

#### Scenario: Visible value
- **WHEN** a progress has `label="Uploading" show-value value="0.62"`
- **THEN** "Uploading" is shown on the left above the bar, "62%" on the right, and the accessible name is "Uploading"

### Requirement: Sizes and tones
`size` SHALL accept `sm`, `md` (default) and `lg`, changing the bar height and the label text size. `tone` SHALL accept `primary` (default), `success`, `warning` and `danger` (alias `error`), colouring the fill; unknown values fall back to primary. The empty track SHALL follow the theme.

#### Scenario: Danger tone
- **WHEN** a progress has `tone="danger"`
- **THEN** its fill uses the theme's danger colour in every theme

### Requirement: Theming hooks
Every visual value SHALL be a `--kakao-progress-*` property in the component's settings block, with colours defaulting to theme roles and motion to the motion tokens, editable on `components/progress/construction.html`.

#### Scenario: Construction page
- **WHEN** the construction page is opened with the construction server running
- **THEN** every `--kakao-progress-*` property is listed and can be saved
