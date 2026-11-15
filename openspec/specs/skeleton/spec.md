# skeleton Specification

## Purpose
`<kakao-skeleton>` holds the place of content that is still loading: grey shapes in the form of text lines, an avatar, an image block, a list row or a card.

## Requirements

### Requirement: Shapes
`shape` SHALL be `text` (default), `circle`, `block`, `row` or `card`; an unknown value SHALL count as `text`. `text` SHALL draw `lines` lines (default 1) and, with more than one, a shorter last line. `circle` SHALL draw a circle and sit inline. `block` SHALL draw a plain rectangle. The component SHALL never take focus.

#### Scenario: Paragraph
- **WHEN** a skeleton has `lines="3"`
- **THEN** it shows three lines and the third is shorter than the others

#### Scenario: Tabbing past
- **WHEN** a keyboard user tabs through a page with skeletons
- **THEN** focus never stops on one

### Requirement: Sizing
`width`, `height` and `radius` SHALL accept a bare number as pixels or a CSS length, and `ratio` an aspect ratio (`16/9`, `16:9` or a number); a value CSS does not accept SHALL be ignored. `width` SHALL apply to any shape, `height` to a block, `radius` to a block or a card's frame. A block without `height` SHALL take its `ratio`, or else the block height from the settings.

#### Scenario: Block of a known size
- **WHEN** a skeleton has `shape="block" width="240" height="160" radius="0"`
- **THEN** it draws a 240 by 160 pixel rectangle with square corners

#### Scenario: Block by ratio
- **WHEN** a skeleton has `shape="block" ratio="16/9"` in a 400 pixel wide place
- **THEN** it is 400 pixels wide and 225 pixels high

#### Scenario: Invalid value
- **WHEN** `width` holds something that is not a length
- **THEN** the skeleton keeps its default width

### Requirement: Text follows the font size
Text lines SHALL be measured in em, so a text skeleton follows the surrounding font size.

#### Scenario: Heading
- **WHEN** a text skeleton sits in a place with a larger font size
- **THEN** its lines are thicker in proportion

### Requirement: Presets
`shape="row"` SHALL draw a list row: a title line and further lines (`lines`, default 2), with a circle in front when `avatar` is set, repeated `count` times with a line between rows. `shape="card"` SHALL draw a card frame holding a title line and text lines (`lines`, default 3), with an image block on top when `media` is set and a circle beside the title when `avatar` is set. The media block's radius SHALL be the card's radius minus the card's padding, and not less than the line radius.

#### Scenario: Rows
- **WHEN** a skeleton has `shape="row" avatar count="3"`
- **THEN** it shows three rows, each with a circle and two lines

#### Scenario: Nesting rule
- **WHEN** a card skeleton has a radius of 14px and a padding of 4px
- **THEN** its media block has a radius of 10px

### Requirement: Animation
`animation` SHALL be `shimmer` (default, a light band moving across each shape), `pulse` (the shapes fade out and in) or `none`. With `prefers-reduced-motion: reduce` the shapes SHALL be static whatever `animation` says.

#### Scenario: Reduced motion
- **WHEN** the reader prefers reduced motion
- **THEN** no skeleton moves or fades

### Requirement: Accessibility
The shapes SHALL be hidden from assistive technology. Without `label` the component SHALL expose no text. With `label` it SHALL expose a status (`role="status"`) with that text. The demo page SHALL show `aria-busy` on a loading region as the way to announce a load.

#### Scenario: Silent
- **WHEN** a screen reader reads a page with unlabelled skeletons
- **THEN** it says nothing for them

#### Scenario: Labelled
- **WHEN** a skeleton has `label="Loading the article"`
- **THEN** its status holds "Loading the article"

### Requirement: Theming hooks
All visual values SHALL be `--kakao-skeleton-*` custom properties in the component's settings block, with every colour defaulting to a theme role (`var(--kakao-color-<role>, literal)`), and SHALL be editable on `components/skeleton/construction.html`.

#### Scenario: Dark theme
- **WHEN** the theme switches from light to dark
- **THEN** the shapes, the shimmer band and the card frame take the dark theme's role colours
