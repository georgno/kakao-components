# meter Specification

## Purpose

`<kakao-meter>` shows a measurement within a known range (a gauge, like native `<meter>`) as one bar whose colour tells whether the value is good, so-so or bad.

## Requirements

### Requirement: Range and clamping
The element SHALL read `min` (default 0), `max` (default 1; if less than min, it equals min) and `value` (default 0, clamped to min…max) like native `<meter>`; attributes that are not numbers use their defaults. `low` SHALL default to min and be clamped to min…max, `high` SHALL default to max and be clamped to low…max, and `optimum` SHALL default to the midpoint of min and max and be clamped to min…max. The fill SHALL be (value − min) / (max − min) of the bar (empty when max equals min). The `value`, `min`, `max`, `low`, `high` and `optimum` properties SHALL reflect their attributes, and a read-only `position` SHALL return the fill fraction.

#### Scenario: Clamped value
- **WHEN** a meter has `min="10" max="20" value="25"`
- **THEN** the bar is full and `position` is 1

#### Scenario: Offset range
- **WHEN** a meter has `min="10" max="20" value="15"`
- **THEN** the bar is half filled

### Requirement: Regions and colour
The element SHALL work out the region the value is in as native `<meter>` does, and colour the fill by it: optimum region with the success colour, suboptimal with warning, even-less-good with danger. If low < optimum < high, values from low to high are optimum and all others suboptimal. If optimum ≤ low, values up to low are optimum, values up to high suboptimal and higher values even less good. Otherwise (optimum ≥ high), values from high up are optimum, values from low up suboptimal and lower values even less good. The read-only `region` property SHALL return `optimum`, `suboptimal` or `bad`.

#### Scenario: Storage, lower is better
- **WHEN** three meters have `max="100" low="30" high="80" optimum="20"` and values 18, 55 and 92
- **THEN** their fills use the success, warning and danger colours, in every theme

#### Scenario: Defaults
- **WHEN** a meter has only `value="0.4"`
- **THEN** the fill uses the success colour

### Requirement: Fill motion
When the value or range changes after the first render, the fill length SHALL slide to the new state over `--kakao-motion-duration` with the standard easing, and the fill colour SHALL switch at once. The first render SHALL show the value at once. Under `prefers-reduced-motion: reduce` every change SHALL show at once.

#### Scenario: Reduced motion
- **WHEN** reduced motion is on and the value changes from 18 to 92
- **THEN** the bar shows 92 in the danger colour immediately

### Requirement: Meter semantics
The element SHALL have `role="meter"` (unless the page set a role), `aria-valuemin`, `aria-valuemax` and `aria-valuenow` equal to the clamped values, and `value-text` SHALL become `aria-valuetext`. It SHALL never take focus.

#### Scenario: Announced value
- **WHEN** a meter has `label="Storage" value="55" max="100" value-text="55 GB of 100 GB"`
- **THEN** it is announced as a meter named "Storage" with "55 GB of 100 GB"

### Requirement: Label and value text
`label` SHALL be shown above the bar and SHALL become the accessible name unless the page set `aria-label`. `show-value` SHALL show the position as a rounded percentage (or `value-text` when set) at the end of that row in tabular figures. The visible row SHALL be hidden from assistive technology so nothing is read twice.

#### Scenario: Visible value
- **WHEN** a meter has `label="Disk" show-value value="0.62"`
- **THEN** "Disk" is shown on the left above the bar and "62%" on the right

### Requirement: Sizes and theming hooks
`size` SHALL accept `sm`, `md` (default) and `lg`, changing the bar height and the label text size, matching `<kakao-progress>`. Every visual value SHALL be a `--kakao-meter-*` property in the component's settings block, with colours defaulting to theme roles and motion to the motion tokens, editable on `components/meter/construction.html`.

#### Scenario: Construction page
- **WHEN** the construction page is opened with the construction server running
- **THEN** every `--kakao-meter-*` property is listed and can be saved
